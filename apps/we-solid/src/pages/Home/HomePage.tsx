import wecubeModel from '@/assets/wecube-beveled.glb';
import { gsap } from 'gsap';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import styles from './HomePage.module.scss';

export function HomePage() {
  // DOM references
  let containerRef: HTMLDivElement | undefined;

  // State management
  const [isModelLoaded, setIsModelLoaded] = createSignal(false);
  const [debugMessage, setDebugMessage] = createSignal('Initializing...');
  const [showPlaceholder, setShowPlaceholder] = createSignal(true);

  // Three.js objects
  let scene: THREE.Scene | undefined;
  let camera: THREE.OrthographicCamera | undefined;
  let renderer: THREE.WebGLRenderer | undefined;
  let controls: OrbitControls | undefined;
  let model: THREE.Object3D | undefined;

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

  /**
   * Initialize Three.js scene, camera, renderer and controls
   */
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
      scene.background = new THREE.Color(styles.backgroundColor);

      // Create camera
      const aspect = width / height;
      const frustumSize = 10;

      camera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000,
      );

      // Set initial camera position
      camera.position.set(0, 0, 15);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);

      // Create renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;

      // Setup environment mapping
      setupEnvironmentMap();

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
   * Load environment map for reflections/lighting
   */
  const setupEnvironmentMap = () => {
    if (!renderer || !scene) return;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new THREE.TextureLoader().load('https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene!.environment = envMap;
      pmremGenerator.dispose();
    });
  };

  /**
   * Setup scene lighting
   */
  const setupLighting = () => {
    if (!scene) return;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 10, 20);
    scene.add(directionalLight);

    // Add light helper for debugging
    const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 2);
    scene.add(lightHelper);

    return { directionalLight, lightHelper };
  };

  /**
   * Load 3D model and apply materials
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
          mesh.material = createGoldMaterial();

          // Center model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());

          // Create pivot group
          const pivotGroup = new THREE.Group();
          scene!.add(pivotGroup);

          // Add model to pivot
          pivotGroup.add(model);
          model.position.set(-center.x, -center.y, -center.z);

          // Set model reference to pivot group
          model = pivotGroup;

          // Apply initial rotation for isometric view
          model.rotation.set(THREE.MathUtils.degToRad(55), THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(-45));

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
   * Create gold material for the model
   */
  const createGoldMaterial = () => {
    return new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 1.0,
    });
  };

  /**
   * Create white matte material
   */
  const createWhiteMaterial = () => {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.8,
      envMapIntensity: 0.3,
    });
  };

  /**
   * Create glass material
   */
  const createGlassMaterial = () => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.5,
      transmission: 0.9,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      ior: 1.5,
      envMapIntensity: 1.0,
    });
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
      updateLightHelpers();

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
   * Update light helpers
   */
  const updateLightHelpers = () => {
    if (!scene) return;

    // Find and update all light helpers
    scene.traverse((child) => {
      if (child instanceof THREE.DirectionalLightHelper) {
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
    const frustumSize = 10;

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

  return (
    <div class={styles.page}>
      <div class={styles.controls} style={{ 'margin-top': '60px' }}>
        <button onClick={cycleToNextView}>Change View</button>
      </div>

      <div ref={(el) => (containerRef = el)} class={styles.modelViewer}>
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
