import wecubeModel from '@/assets/wecube-beveled.glb';
import { gsap } from 'gsap';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import styles from './HomePage.module.scss';

type MaterialType = 'gold' | 'white' | 'glass';

export function HomePage() {
  let containerRef: HTMLDivElement | undefined;
  let floatingLights: { pointCloud: THREE.Points; animateParticles: (time: number) => void } | undefined;
  let glowingLights: { pointCloud: THREE.Points; animateParticles: (time: number) => void } | undefined;

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

  let earthSystem: {
    planet: THREE.Mesh;
    atmosphere: THREE.Mesh;
    animateAtmosphere: (time: number) => void;
  } | null = null;

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

      addHelpers();

      addInnerLight();

      earthSystem = addAtmosphere(new THREE.Vector3(0, 0, 0), 4);

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

  const addHelpers = () => {
    if (!scene) return;

    // Create a standard axes helper
    const axesHelper = new THREE.AxesHelper(5); // 5 is the size of the axes
    scene.add(axesHelper);

    return axesHelper;
  };

  const createFloatingLights = () => {
    if (!scene || !model) return;

    // Number of particles
    const particleCount = 150;

    // Create geometry
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Create positions in a sphere around the model
    const radius = 6; // Radius of the sphere
    const center = new THREE.Vector3(0, 0, 0); // Center around origin

    for (let i = 0; i < particleCount; i++) {
      // Calculate random spherical coordinates
      const phi = Math.random() * Math.PI * 2; // around
      const theta = Math.random() * Math.PI; // up and down
      const r = radius * (0.5 + 0.5 * Math.random()); // vary the radius

      // Convert spherical to Cartesian coordinates
      const x = center.x + r * Math.sin(theta) * Math.cos(phi);
      const y = center.y + r * Math.sin(theta) * Math.sin(phi);
      const z = center.z + r * Math.cos(theta);

      // Set positions
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random colors - warm gold to white
      const colorFactor = Math.random();
      colors[i * 3] = 1.0; // Red - full
      colors[i * 3 + 1] = 0.7 + 0.3 * colorFactor; // Green - varies
      colors[i * 3 + 2] = 0.3 + 0.7 * colorFactor; // Blue - varies

      // Random sizes
      sizes[i] = 0.05 + 0.1 * Math.random();
    }

    // Add attributes to geometry
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create material
    const particlesMaterial = new THREE.PointsMaterial({
      size: 3,
      // color: new THREE.Color(0xff9500),
      // vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png'),
    });

    // Create point cloud
    const pointCloud = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(pointCloud);

    // Store initial positions for animation
    const initialPositions = positions.slice();

    // Animation data for particles
    const animationData = new Array(particleCount).fill(0).map(() => ({
      speed: 0.2 + Math.random() * 0.8, // Random speed
      amplitude: 0.1 + Math.random() * 0.2, // Random movement amount
      phase: Math.random() * Math.PI * 2, // Random starting phase
      frequencyX: Math.random() * 2,
      frequencyY: Math.random() * 2,
      frequencyZ: Math.random() * 2,
    }));

    // Animation function to move particles
    const animateParticles = (time: number) => {
      const positions = particlesGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        // Create gentle sine wave motion
        const data = animationData[i];
        const t = time * 0.001 * data.speed + data.phase;

        positions[ix] = initialPositions[ix] + Math.sin(t * data.frequencyX) * data.amplitude;
        positions[iy] = initialPositions[iy] + Math.sin(t * data.frequencyY) * data.amplitude;
        positions[iz] = initialPositions[iz] + Math.cos(t * data.frequencyZ) * data.amplitude;
      }

      particlesGeometry.attributes.position.needsUpdate = true;
    };

    return { pointCloud, animateParticles };
  };

  const createGlowingLights = () => {
    if (!scene) return;

    // Number of particles
    const particleCount = 100;

    // Create geometry
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const customColors = new Float32Array(particleCount * 3); // Renamed from 'colors' to avoid conflict
    const sizes = new Float32Array(particleCount);

    // Create positions in a sphere around the model
    const radius = 4; // Radius of the sphere
    const center = new THREE.Vector3(0, 0, 1);

    for (let i = 0; i < particleCount; i++) {
      // Calculate random spherical coordinates
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const r = radius * (0.5 + 0.5 * Math.random());

      // Convert spherical to Cartesian coordinates
      const x = center.x + r * Math.sin(theta) * Math.cos(phi);
      const y = center.y + r * Math.sin(theta) * Math.sin(phi);
      const z = center.z + r * Math.cos(theta);

      // Set positions
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Golden colors with variation
      customColors[i * 3] = 1.0; // Red
      customColors[i * 3 + 1] = 0.6 + 0.4 * Math.random(); // Green
      customColors[i * 3 + 2] = 0.2 + 0.3 * Math.random(); // Blue

      // Random sizes
      sizes[i] = 0.1 + 1.0 * Math.random();
    }

    // Add attributes to geometry
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('customColor', new THREE.BufferAttribute(customColors, 3)); // Changed name
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material with renamed attribute
    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        pointTexture: {
          value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png'),
        },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor; // Renamed to avoid conflict with built-in 'color' attribute
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = customColor; // Use renamed attribute
          
          // Animate position with time
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Size attenuation
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          // Sample texture
          gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
          
          // Add bloom effect
          float distanceToCenter = length(gl_PointCoord - vec2(0.5));
          float strength = 0.5 / (distanceToCenter + 0.05);
          gl_FragColor.rgb *= strength;
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });

    // Create point cloud
    const pointCloud = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(pointCloud);

    // Store initial positions for animation
    const initialPositions = positions.slice();

    // Animation data
    const animationData = new Array(particleCount).fill(0).map(() => ({
      speed: 0.2 + Math.random() * 0.5,
      amplitude: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      freq: 0.5 + Math.random() * 1.5,
    }));

    // Animation function
    const animateParticles = (time: number) => {
      // // Update shader time uniform
      // (pointCloud.material as THREE.ShaderMaterial).uniforms.time.value = time * 0.001;
      // const positions = particlesGeometry.attributes.position.array as Float32Array;
      // for (let i = 0; i < particleCount; i++) {
      //   const ix = i * 3;
      //   const iy = i * 3 + 1;
      //   const iz = i * 3 + 2;
      //   const data = animationData[i];
      //   const t = time * 0.001 * data.speed + data.phase;
      //   // Create gentle oscillation
      //   positions[ix] = initialPositions[ix] + Math.sin(t * data.freq) * data.amplitude;
      //   positions[iy] = initialPositions[iy] + Math.cos(t * data.freq * 0.8) * data.amplitude;
      //   positions[iz] = initialPositions[iz] + Math.sin(t * data.freq * 1.2) * data.amplitude;
      // }
      // particlesGeometry.attributes.position.needsUpdate = true;
    };

    return { pointCloud, animateParticles };
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
    // scene.add(mainLightHelper);

    const shadowCameraHelper = new THREE.CameraHelper(mainLight.shadow.camera);
    // scene.add(shadowCameraHelper);

    return { mainLight, fillLight, ambientLight, mainLightHelper, shadowCameraHelper };
  };

  // // Create a custom shader material with blurred edges
  // const createBlurredSphereMaterial = (color: THREE.ColorRepresentation) => {
  //   return new THREE.ShaderMaterial({
  //     uniforms: {
  //       color: { value: new THREE.Color(color) },
  //       intensity: { value: 1.0 },
  //     },
  //     vertexShader: `
  //     varying vec3 vNormal;
  //     varying vec3 vViewPosition;

  //     void main() {
  //       vNormal = normalize(normalMatrix * normal);
  //       vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  //       vViewPosition = -mvPosition.xyz;
  //       gl_Position = projectionMatrix * mvPosition;
  //     }
  //   `,
  //     fragmentShader: `
  //     uniform vec3 color;
  //     uniform float intensity;
  //     varying vec3 vNormal;
  //     varying vec3 vViewPosition;

  //     void main() {
  //       // Calculate view direction
  //       vec3 viewDir = normalize(vViewPosition);

  //       // Calculate fresnel effect (stronger at edges)
  //       float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);

  //       // Apply fresnel to opacity - edges are more transparent
  //       float opacity = 0.1 * intensity * (1.0 - fresnel * 0.9);

  //       // Apply fresnel to glow - edges have more glow
  //       vec3 finalColor = color * (1.0 + fresnel * 2.0);

  //       gl_FragColor = vec4(finalColor, opacity);
  //     }
  //   `,
  //     transparent: true,
  //     depthWrite: false,
  //     side: THREE.DoubleSide,
  //     blending: THREE.AdditiveBlending,
  //   });
  // };

  const createAtmosphereMaterial = (color: THREE.ColorRepresentation, rimPower: number = 4.0) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        rimPower: { value: rimPower }, // Controls how quickly the glow fades out (higher = thinner rim)
        atmosphereThickness: { value: 0.2 }, // Thickness of the atmosphere glow
        globalOpacity: { value: 0.2 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          // Standard vertex calculations
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
      uniform vec3 color;
      uniform float rimPower;
      uniform float atmosphereThickness;
      uniform float globalOpacity; // Make sure this is declared
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        vec3 viewDir = normalize(vViewPosition);
        
        // Calculate the rim effect
        float rim = 1.0 - abs(dot(viewDir, vNormal));
        float intensity = pow(rim, rimPower);
        intensity = smoothstep(0.0, atmosphereThickness, intensity);
        
        // Apply the color
        vec3 glowColor = color * intensity;
        
        // IMPORTANT: Multiply by globalOpacity here
        float finalOpacity = intensity * globalOpacity;
        
        // Use finalOpacity for the alpha channel
        gl_FragColor = vec4(glowColor, finalOpacity);
      }
    `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide, // Only show atmosphere on outside
      blending: THREE.AdditiveBlending,
      // opacity: 0.1,
    });
  };

  /**
   * Creates an Earth-like atmosphere effect around a sphere
   */
  const addAtmosphere = (position = new THREE.Vector3(0, 0, 0), radius = 1.0) => {
    if (!scene) return null;

    // Create the main sphere (optional - this would be your Earth/planet)
    const planetGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2233aa,
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.4,
    });

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.copy(position);
    scene.add(planet);

    // Create slightly larger sphere for atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.05, 64, 64);
    const atmosphereMaterial = createAtmosphereMaterial(styles.blue, 2.0);

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.position.copy(position);
    scene.add(atmosphere);

    // Animate the atmosphere
    const animateAtmosphere = (time: number) => {
      if (!atmosphere) return;
      const t = time * 0.001;
      const material = atmosphere.material as THREE.ShaderMaterial;
      // Gently pulse the atmosphere
      material.uniforms.atmosphereThickness.value = 1 + Math.sin(t * 0.3) * 0.1;
      // Optional: slowly rotate atmosphere
      // atmosphere.rotation.y = t * 0.05;
    };

    return { planet, atmosphere, animateAtmosphere };
  };

  // function addSphere(size: number, color: string) {
  //   const geometry = new THREE.SphereGeometry(size, 32, 32);
  //   // const material = new THREE.MeshBasicMaterial({
  //   //   color,
  //   //   transparent: true,
  //   //   opacity: 0.05, // Very low opacity
  //   //   depthWrite: false, // Important: disable depth writing
  //   //   side: THREE.DoubleSide, // Render both sides
  //   // });
  //   const sphere = new THREE.Mesh(geometry, createBlurredSphereMaterial(0x4bbdf1));
  //   sphere.position.set(0, 0, 0);
  //   scene?.add(sphere);
  // }

  const addInnerLight = () => {
    const spheres = [
      { size: 2, color: '#ff0000' }, // Red
      { size: 3, color: '#00ff00' }, // Green
      { size: 4, color: '#0000ff' }, // Blue
      // { size: 5, color: '#ffff00' }, // Yellow
      // { size: 6, color: '#ff00ff' }, // Magenta
    ];

    // spheres.forEach((sphere) => addSphere(sphere.size, sphere.color));
    // // Create a point light
    // const innerLight = new THREE.PointLight(0xffaa00, 20, 10);
    // innerLight.position.set(0, 0, 0); // Position at center of object

    // // Optional: add a small sphere to visualize the light source
    // const lightSphere = new THREE.Mesh(
    //   new THREE.SphereGeometry(4, 36, 36),
    //   new THREE.MeshBasicMaterial({
    //     color: styles.blue, // Use hex directly instead of styles.blue
    //     transparent: true,
    //     opacity: 0.05, // Very low opacity
    //     depthWrite: false, // Important: disable depth writing
    //     side: THREE.DoubleSide, // Render both sides
    //   }),
    // );
    // innerLight.add(lightSphere);

    // // Add to the model
    // scene?.add(innerLight);

    // /// second

    // // Create a point light
    // const innerLight2 = new THREE.PointLight(0xffaa00, 20, 10);
    // innerLight2.position.set(0, 0, 0); // Position at center of object

    // // Optional: add a small sphere to visualize the light source
    // const lightSphere2 = new THREE.Mesh(
    //   new THREE.SphereGeometry(3, 36, 36),
    //   new THREE.MeshBasicMaterial({
    //     color: styles.blue, // Bright color
    //     transparent: true,
    //     opacity: 0.05, // Full opacity
    //     //emissive: 0xffaa00,// Make it glow
    //     // emissiveIntensity: 2
    //   }),
    // );
    // innerLight2.add(lightSphere2);

    // // Add to the model
    // scene?.add(innerLight2);

    // // // Animate the light intensity
    // // const animateInnerLight = () => {
    // //   if (!innerLight) return;

    // //   const time = Date.now() * 0.001;
    // //   // Pulsate intensity between 1 and 3
    // //   innerLight.intensity = 1 + Math.sin(time * 2) * 1;

    //   // Optionally change color
    //   const hue = (time * 0.1) % 1;
    //   innerLight.color.setHSL(hue, 1, 0.5);

    //   if (lightSphere) {
    //     lightSphere.material.color.copy(innerLight.color);
    //   }
    // };
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
          model.position.set(-center.x, -center.y, -center.z); // Lift slightly above floor

          // Set model reference to pivot group
          model = pivotGroup;

          // Apply initial rotation for isometric view
          model.rotation.set(THREE.MathUtils.degToRad(55), THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(-45));

          // Create floating lights
          floatingLights = createFloatingLights();
          glowingLights = createGlowingLights();

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
  // const earthSystem = addAtmosphere(new THREE.Vector3(0, 0, 0), 3.0);
  const startAnimationLoop = () => {
    if (!scene || !camera || !renderer || !controls) return;

    let animationId: number;
    let lastTime = 0;

    const animate = (time?: number) => {
      animationId = requestAnimationFrame(animate);

      // Use the current time for animations
      const currentTime = time || Date.now();

      // Animate both particle systems
      if (floatingLights) {
        floatingLights.animateParticles(currentTime);
      }

      if (glowingLights) {
        glowingLights.animateParticles(currentTime);
      }

      if (earthSystem) {
        earthSystem.animateAtmosphere(currentTime);
      }

      // Update controls
      controls!.update();

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
