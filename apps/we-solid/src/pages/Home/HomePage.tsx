import wecubeModel from '@/assets/wecube-beveled.glb';
import { gsap } from 'gsap';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import styles from './HomePage.module.scss';

type MaterialType = 'gold' | 'white' | 'glass';

export function HomePage() {
  // DOM references
  let containerRef: HTMLDivElement | undefined;

  // State management
  const [isModelLoaded, setIsModelLoaded] = createSignal(false);
  const [debugMessage, setDebugMessage] = createSignal('Initializing...');
  const [showPlaceholder, setShowPlaceholder] = createSignal(true);
  const [selectedMaterial, setSelectedMaterial] = createSignal<MaterialType>('glass');

  // Materials definitions
  const materials = {
    gold: new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 1.0,
      roughness: 0.1,
      reflectivity: 1.0,
      envMapIntensity: 1.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    }),
    white: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.8,
      envMapIntensity: 0.3,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, // Clear glass
      metalness: 0.0, // Non-metallic
      roughness: 0.0, // Perfectly smooth
      transmission: 1.0, // Maximum transparency for refraction
      transparent: true, // Enable transparency
      ior: 2, // Index of refraction for glass (controls bending)
      thickness: 5, // Material thickness (0-10, affects refraction strength)
      envMapIntensity: 1.0, // Environment map reflections
      side: THREE.DoubleSide, // Render both sides
      clearcoat: 0.1, // Slight clearcoat
      clearcoatRoughness: 0.0, // Smooth clearcoat
      attenuationDistance: 0.5, // Control color shift through thickness
      attenuationColor: new THREE.Color(0.9, 0.9, 1.0), // Subtle blue tint at thicker areas
    }),
  };

  // Three.js objects
  let scene: THREE.Scene | undefined;
  let camera: THREE.OrthographicCamera | undefined;
  let renderer: THREE.WebGLRenderer | undefined;
  let controls: OrbitControls | undefined;
  let model: THREE.Object3D | undefined;
  let room: { floor: THREE.Mesh; walls: THREE.Mesh[] } | undefined;

  // Tracking current view
  let currentViewIndex = 0;

  // Camera view presets
  const cameraViews = [
    { position: [-18.5, 10.5, 15], roll: -30, name: 'Left' },
    { position: [18.5, 10.5, 15], roll: 30, name: 'Right' },
    { position: [0, 35, 15], roll: 0, name: 'Top' },
    { position: [0, 10.5, 15], roll: 0, name: 'Front' },
    { position: [0, 0, 15], roll: 0, name: 'Bottom' },
  ];

  const initThreeJS = () => {
    if (!containerRef) {
      setDebugMessage('Container reference not available');
      return;
    }

    // Get container dimensions
    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;

    setDebugMessage(`Container dimensions: ${width}x${height}`);

    if (width === 0 || height === 0) {
      setDebugMessage('Container has zero dimensions - will retry in 100ms');
      setTimeout(initThreeJS, 100);
      return;
    }

    try {
      // Create scene
      scene = new THREE.Scene();

      // Create camera
      const zoomFactor = 1.5;
      const aspect = width / height;
      const frustumSize = 10 * zoomFactor;

      camera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        2000,
      );

      // Set initial camera position
      camera.position.set(0, 0, 15);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);

      // Create renderer with shadow support
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;

      // Enable shadows
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Setup environment mapping
      setupEnvironmentMap();

      // Create room
      createRoom();

      // Add lighting
      setupLighting();

      // Setup OrbitControls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 0, 0);
      controls.update();

      // Load 3D model
      loadModel();

      // Add debug sphere
      addDebugSphere();

      // Remove placeholder and add canvas to DOM
      setShowPlaceholder(false);
      setTimeout(() => {
        if (containerRef && renderer) {
          containerRef.appendChild(renderer.domElement);
          setDebugMessage('Renderer initialized, canvas added to DOM');
        }
      }, 0);

      // Start animation loop
      startAnimationLoop();

      // Setup window resize handler
      window.addEventListener('resize', handleResize);

      // Cleanup on component unmount
      onCleanup(() => {
        window.removeEventListener('resize', handleResize);
        cleanupThreeJS();
      });
    } catch (err) {
      console.error('Error setting up Three.js:', err);
      setDebugMessage('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  /**
   * Create a room with walls and floor
   */
  const createRoom = () => {
    if (!scene) return;

    // Room dimensions
    const roomWidth = 30;
    const roomHeight = 15;
    const roomDepth = 30;

    // Room material
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.7,
      metalness: 0.0,
    });

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floor = new THREE.Mesh(floorGeometry, wallMaterial.clone());
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -5;
    floor.receiveShadow = true;
    // scene.add(floor);

    // Create walls
    const walls: THREE.Mesh[] = [];

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial.clone());
    backWall.position.z = -roomDepth / 2;
    backWall.position.y = roomHeight / 2 - 5;
    backWall.receiveShadow = true;
    // scene.add(backWall);
    walls.push(backWall);

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial.clone());
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -roomWidth / 2;
    leftWall.position.y = roomHeight / 2 - 5;
    leftWall.receiveShadow = true;
    // scene.add(leftWall);
    walls.push(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeometry.clone(), wallMaterial.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.x = roomWidth / 2;
    rightWall.position.y = roomHeight / 2 - 5;
    rightWall.receiveShadow = true;
    // scene.add(rightWall);
    walls.push(rightWall);

    room = { floor, walls };
    return room;
  };

  /**
   * Setup environment map for reflections
   */
  const setupEnvironmentMap = () => {
    if (!renderer || !scene) return;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new THREE.TextureLoader().load('https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg', (texture) => {
      console.log('Environment map loaded successfully');
      texture.mapping = THREE.EquirectangularReflectionMapping;
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene!.environment = envMap;
      pmremGenerator.dispose();

      if (model) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material.needsUpdate = true;
          }
        });
      }

      console.log('Environment map applied to scene');
    });
  };

  /**
   * Add a debug glass sphere to test materials
   */
  const addDebugSphere = () => {
    if (!scene) return;

    // // Create a reflective sphere
    // const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    // const sphere = new THREE.Mesh(geometry, materials.glass);
    // sphere.position.set(3, 0, 0);
    // sphere.castShadow = true;
    // sphere.receiveShadow = true;
    // scene.add(sphere);

    // // Add a cube with the same material
    // const cubeGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    // const cube = new THREE.Mesh(cubeGeometry, materials.gold);
    // cube.position.set(-3, 0, 0);
    // cube.castShadow = true;
    // cube.receiveShadow = true;
    // scene.add(cube);
  };

  /**
   * Setup lighting with shadows
   */
  const setupLighting = () => {
    if (!scene) return;

    // Primary directional light (key light)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(10, 20, 15);

    // Configure shadow properties
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;

    // Adjust shadow camera frustum
    const d = 15;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;

    scene.add(mainLight);

    // Secondary directional light (fill light)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // Ambient light to brighten shadows
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Add helpers for debugging
    const mainLightHelper = new THREE.DirectionalLightHelper(mainLight, 2);
    scene.add(mainLightHelper);

    const shadowCameraHelper = new THREE.CameraHelper(mainLight.shadow.camera);
    scene.add(shadowCameraHelper);

    return { mainLight, fillLight, ambientLight, mainLightHelper, shadowCameraHelper };
  };

  /**
   * Load the 3D model and apply materials
   */
  const loadModel = () => {
    if (!scene) return;

    const loader = new GLTFLoader();

    loader.load(
      wecubeModel,
      (gltf) => {
        model = gltf.scene;

        if (model && model.children[0]) {
          // Apply material
          const mesh = model.children[0] as THREE.Mesh;

          // Enable shadows
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Apply material based on selection
          mesh.material = materials[selectedMaterial()];

          // Center model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());

          // Create pivot group
          const pivotGroup = new THREE.Group();
          scene!.add(pivotGroup);

          // Add model to pivot
          pivotGroup.add(model);
          model.position.set(-center.x, -center.y + 1, -center.z); // Lift slightly above floor

          // Set model reference to pivot group
          model = pivotGroup;

          // Apply initial rotation for isometric view
          model.rotation.set(THREE.MathUtils.degToRad(54), THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(-45));

          // Update state
          setIsModelLoaded(true);
          setDebugMessage('Model loaded successfully');
        }
      },
      (progress) => {
        const percent = Math.floor((progress.loaded / progress.total) * 100);
        setDebugMessage(`Loading model: ${percent}%`);
      },
      (error: any) => {
        console.error('Error loading model:', error);
        setDebugMessage('Error loading model: ' + error.message);
      },
    );
  };

  /**
   * Start the animation loop
   */
  const startAnimationLoop = () => {
    if (!scene || !camera || !renderer || !controls) return;

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Update controls
      controls!.update();

      // Update light helpers
      updateHelpers();

      // Render scene
      renderer!.render(scene!, camera!);
    };

    animate();

    // Save animation ID for cleanup
    onCleanup(() => {
      cancelAnimationFrame(animationId);
    });
  };

  /**
   * Update helpers (light helpers, camera helpers)
   */
  const updateHelpers = () => {
    if (!scene) return;

    // Find and update all helpers
    scene.traverse((child) => {
      if (child instanceof THREE.DirectionalLightHelper || child instanceof THREE.CameraHelper) {
        child.update();
      }
    });
  };

  /**
   * Handle window resize
   */
  const handleResize = () => {
    if (!containerRef || !camera || !renderer) return;

    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;
    const aspect = width / height;
    const frustumSize = 10 * 1.5; // Apply zoom factor

    // Update camera
    const orthoCam = camera as THREE.OrthographicCamera;
    orthoCam.left = (frustumSize * aspect) / -2;
    orthoCam.right = (frustumSize * aspect) / 2;
    orthoCam.top = frustumSize / 2;
    orthoCam.bottom = frustumSize / -2;
    orthoCam.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(width, height);
  };

  /**
   * Clean up Three.js resources
   */
  const cleanupThreeJS = () => {
    if (renderer && containerRef && containerRef.contains(renderer.domElement)) {
      containerRef.removeChild(renderer.domElement);
    }

    if (renderer) {
      renderer.dispose();
    }

    if (controls) {
      controls.dispose();
    }

    // Clear references
    scene = undefined;
    camera = undefined;
    renderer = undefined;
    controls = undefined;
    model = undefined;
    room = undefined;
  };

  /**
   * Move camera to a new position with roll
   */
  const moveCameraTo = (x: number, y: number, z: number, rollAngle = 0, duration = 1.0) => {
    if (!camera || !controls) {
      console.warn('Camera or controls not initialized');
      return;
    }

    // Temporarily disable controls
    const wasControlsEnabled = controls.enabled;
    controls.enabled = false;

    // Calculate roll in radians
    const rollRadians = THREE.MathUtils.degToRad(rollAngle);

    // Define target up vector based on roll angle
    const targetUp = new THREE.Vector3(Math.sin(rollRadians), Math.cos(rollRadians), 0);

    // Store initial values
    const startPosition = camera.position.clone();
    const startUpVector = camera.up.clone();

    // Create a progress tracker for animation
    const progress = { value: 0 };

    // Animate with GSAP
    gsap.to(progress, {
      value: 1,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (!camera) return;

        // Calculate interpolated position
        const currentPos = new THREE.Vector3().lerpVectors(startPosition, new THREE.Vector3(x, y, z), progress.value);
        camera.position.copy(currentPos);

        // Calculate interpolated up vector
        const currentUp = new THREE.Vector3().lerpVectors(startUpVector, targetUp, progress.value).normalize();
        camera.up.copy(currentUp);

        // Look at center
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      },
      onComplete: function () {
        if (!camera || !controls) return;

        // Ensure final position and orientation
        camera.position.set(x, y, z);
        camera.up.copy(targetUp);
        camera.lookAt(0, 0, 0);

        // Re-enable controls
        controls.enabled = wasControlsEnabled;
        controls.target.set(0, 0, 0);
        controls.update();
      },
    });
  };

  /**
   * Cycle through predefined camera views
   */
  const cycleToNextView = () => {
    if (!camera || !controls) {
      console.warn('Camera not initialized');
      return;
    }

    console.log(`Changing to view: ${cameraViews[currentViewIndex].name}`);

    const view = cameraViews[currentViewIndex];
    moveCameraTo(view.position[0], view.position[1], view.position[2], view.roll);

    // Increment index and wrap around
    currentViewIndex = (currentViewIndex + 1) % cameraViews.length;
  };

  // Initialize on mount
  onMount(() => {
    setTimeout(initThreeJS, 100);
  });

  // Create an effect to update material when selection changes
  createEffect(() => {
    const materialName = selectedMaterial(); // Track this dependency

    if (model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = materials[materialName as MaterialType];
          child.material.needsUpdate = true;
        }
      });
    }
  });

  return (
    <div class={styles.page}>
      <div ref={(el) => (containerRef = el)} class={styles.modelViewer} onClick={cycleToNextView}>
        <we-row p="300" ax="end" class={styles.header}>
          <we-popover placement="bottom-end">
            <we-button size="sm" slot="trigger" variant="subtle">
              {selectedMaterial()}
            </we-button>
            <we-menu slot="content">
              {Object.keys(materials).map((material) => (
                <we-menu-item key={material} onClick={() => setSelectedMaterial(material as MaterialType)}>
                  {material}
                </we-menu-item>
              ))}
            </we-menu>
          </we-popover>
        </we-row>

        <Show when={showPlaceholder()}>
          <div class={styles.placeholder}></div>
        </Show>

        <Show when={!isModelLoaded()}>
          <div class={styles.loading}>{debugMessage()}</div>
        </Show>
      </div>
    </div>
  );
}

export default HomePage;
