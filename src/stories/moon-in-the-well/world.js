import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CAMERA_POSES } from './story.js';

const C = {
  sky: 0x050712,
  fog: 0x0b1020,
  slate: 0x263244,
  slateDark: 0x111723,
  slateLight: 0x4e5c69,
  water: 0x0b1727,
  moon: 0xeef4e2,
  moonBlue: 0x9fc4cf,
  copper: 0xc88949,
  robe: 0x812b36,
  robeDark: 0x481824,
  cream: 0xe6ddc6,
  skin: 0xa86f4f,
  beard: 0xc8c4b8,
  cypress: 0x102b2b,
  wood: 0x553824,
  iron: 0x424a50,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const easeIn = (value) => clamp01(value) ** 3;
const easeOut = (value) => 1 - (1 - clamp01(value)) ** 3;
const seeded = (index) => { const x = Math.sin(index * 791.31 + 29.7) * 43758.5453; return x - Math.floor(x); };

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, flatShading: true, ...options });
}

function mesh(geometry, material, cast = true, receive = true) {
  const result = new THREE.Mesh(geometry, material);
  result.castShadow = cast;
  result.receiveShadow = receive;
  return result;
}

function finishInstances(instances, dynamic = false) {
  instances.castShadow = true;
  instances.receiveShadow = true;
  instances.instanceMatrix.setUsage(dynamic ? THREE.DynamicDrawUsage : THREE.StaticDrawUsage);
  instances.instanceMatrix.needsUpdate = true;
  if (dynamic) instances.frustumCulled = false;
  else instances.computeBoundingSphere();
  return instances;
}

function createNasreddin() {
  const root = new THREE.Group();
  const bodyRig = new THREE.Group();
  root.add(bodyRig);
  const robe = mat(C.robe, { emissive: 0x250710, emissiveIntensity: 0.18 });
  const robeDark = mat(C.robeDark);
  const cream = mat(C.cream);
  const skin = mat(C.skin);
  const beardMaterial = mat(C.beard);
  const dark = mat(0x171115);

  const skirt = mesh(new THREE.ConeGeometry(0.7, 1.65, 9), robe);
  skirt.position.y = 0.88;
  const torso = mesh(new THREE.CapsuleGeometry(0.48, 0.65, 4, 8), robe);
  torso.position.y = 1.72;
  const sash = mesh(new THREE.TorusGeometry(0.49, 0.07, 6, 20), cream);
  sash.rotation.x = Math.PI / 2;
  sash.position.y = 1.42;

  const headRig = new THREE.Group();
  headRig.position.set(0, 2.72, -0.02);
  const head = mesh(new THREE.IcosahedronGeometry(0.37, 2), skin);
  head.scale.set(0.88, 1.03, 0.88);
  const beard = mesh(new THREE.ConeGeometry(0.34, 0.72, 8), beardMaterial);
  beard.position.set(0, -0.35, -0.14);
  beard.rotation.x = 0.08;
  const nose = mesh(new THREE.ConeGeometry(0.09, 0.32, 7), skin);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.02, -0.38);
  const eyes = [];
  [-1, 1].forEach((side) => {
    const eye = mesh(new THREE.SphereGeometry(0.04, 8, 6), dark, false, false);
    eye.position.set(side * 0.16, 0.12, -0.32);
    eyes.push(eye);
    headRig.add(eye);
  });
  const turbanBase = mesh(new THREE.TorusGeometry(0.38, 0.14, 7, 20), cream);
  turbanBase.rotation.x = Math.PI / 2;
  turbanBase.position.y = 0.36;
  const turbanTop = mesh(new THREE.SphereGeometry(0.28, 10, 7), cream);
  turbanTop.scale.set(1.15, 0.72, 1.05);
  turbanTop.position.y = 0.52;
  headRig.add(head, beard, nose, turbanBase, turbanTop);

  const arms = [];
  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.47, 2.15, 0);
    const sleeve = mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.82, 8), robe);
    sleeve.position.y = -0.38;
    const elbow = new THREE.Group();
    elbow.position.y = -0.76;
    const forearm = mesh(new THREE.CylinderGeometry(0.095, 0.13, 0.68, 7), robeDark);
    forearm.position.y = -0.28;
    const hand = mesh(new THREE.SphereGeometry(0.13, 8, 6), skin);
    hand.scale.set(0.86, 1.05, 0.72);
    hand.position.y = -0.63;
    elbow.add(forearm, hand);
    shoulder.add(sleeve, elbow);
    bodyRig.add(shoulder);
    arms.push({ shoulder, elbow, hand, side });
  });

  const legs = [];
  [-1, 1].forEach((side) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.27, 0.42, 0);
    const boot = mesh(new THREE.CapsuleGeometry(0.14, 0.38, 3, 7), dark);
    boot.position.y = -0.28;
    boot.rotation.x = 0.05;
    leg.add(boot);
    bodyRig.add(leg);
    legs.push(leg);
  });

  bodyRig.add(skirt, torso, sash, headRig);
  root.userData = { bodyRig, torso, skirt, headRig, eyes, arms, legs };
  return root;
}

function createHook() {
  const group = new THREE.Group();
  const iron = mat(C.iron, { metalness: 0.68, roughness: 0.3 });
  const stem = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.6, 8), iron);
  stem.position.y = 0.2;
  const curve = mesh(new THREE.TorusGeometry(0.23, 0.045, 7, 24, Math.PI * 1.42), iron);
  curve.rotation.z = -0.34;
  curve.position.set(0.18, -0.13, 0);
  group.add(stem, curve);
  return group;
}

function waterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uDisturbance: { value: 0 },
      uHook: { value: 0 },
      uWater: { value: new THREE.Color(C.water) },
      uMoon: { value: new THREE.Color(C.moon) },
      uMoonBlue: { value: new THREE.Color(C.moonBlue) },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uDisturbance;
      void main() {
        vUv = uv;
        vec3 p = position;
        float d = distance(uv, vec2(0.5));
        p.z += sin(d * 52.0 - uTime * 2.2) * (0.012 + uDisturbance * 0.055) * (1.0 - smoothstep(0.0, 0.5, d));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uDisturbance;
      uniform float uHook;
      uniform vec3 uWater;
      uniform vec3 uMoon;
      uniform vec3 uMoonBlue;
      void main() {
        vec2 p = vUv - 0.5;
        float d = length(p);
        float rings = sin(d * 88.0 - uTime * 3.0) * (0.006 + uHook * 0.022 + uDisturbance * 0.065);
        float crossWave = sin((p.x + p.y) * 62.0 + uTime * 2.1) * uDisturbance * 0.05;
        vec2 reflected = p + normalize(p + vec2(0.0001)) * rings + vec2(crossWave, -crossWave * 0.6);
        float moon = 1.0 - smoothstep(0.14, 0.155, length(reflected - vec2(-0.12, 0.05)));
        float broken = 0.76 + 0.24 * sin(p.y * 105.0 + uTime * 5.0) * uDisturbance;
        float glint = pow(max(0.0, sin(d * 62.0 - uTime * 2.5)), 18.0) * (0.08 + uHook * 0.22 + uDisturbance * 0.5);
        vec3 color = mix(uWater, uMoonBlue * 0.48, glint + d * 0.12);
        color = mix(color, uMoon, moon * broken * (0.42 + glint * 0.35));
        color += uMoonBlue * glint;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

export class StoryWorld {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.sky);
    this.scene.fog = new THREE.FogExp2(C.fog, 0.022);
    this.camera = new THREE.PerspectiveCamera(43, 1, 0.08, 180);
    this.camera.position.fromArray(CAMERA_POSES[0].position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.72, 0.78);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.dummy = new THREE.Object3D();
    this.lookMatrix = new THREE.Matrix4();
    this.targetQuaternion = new THREE.Quaternion();
    this.cameraTarget = new THREE.Vector3();
    this.desiredCamera = new THREE.Vector3();
    this.ropeAnchor = new THREE.Vector3();
    this.hookPosition = new THREE.Vector3();
    this.moonPosition = new THREE.Vector3(-13.5, 18.5, -27);
    this.build();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  build() {
    this.hemi = new THREE.HemisphereLight(0x879fac, 0x1a1115, 1.55);
    this.scene.add(this.hemi);
    this.moonLight = new THREE.DirectionalLight(C.moon, 3.2);
    this.moonLight.position.copy(this.moonPosition);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.set(2048, 2048);
    this.moonLight.shadow.camera.left = -18;
    this.moonLight.shadow.camera.right = 18;
    this.moonLight.shadow.camera.top = 18;
    this.moonLight.shadow.camera.bottom = -12;
    this.scene.add(this.moonLight);
    this.wellLight = new THREE.PointLight(C.moonBlue, 4.8, 14, 1.75);
    this.wellLight.position.set(0, -3.4, 0);
    this.scene.add(this.wellLight);
    this.warmLight = new THREE.PointLight(C.copper, 2.4, 11, 1.9);
    this.warmLight.position.set(5.5, 3.2, 3.5);
    this.scene.add(this.warmLight);

    this.buildSky();
    this.buildCourtyard();
    this.buildWell();
    this.buildRope();
    this.buildNasreddin();
    this.buildAtmosphere();
  }

  buildSky() {
    const moonHalo = mesh(new THREE.CircleGeometry(4.25, 64), new THREE.MeshBasicMaterial({
      color: C.moonBlue, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending,
    }), false, false);
    const moon = mesh(new THREE.CircleGeometry(2.55, 64), new THREE.MeshBasicMaterial({ color: C.moon, toneMapped: false }), false, false);
    moonHalo.position.z = 0.06;
    const moonGroup = new THREE.Group();
    moonGroup.position.copy(this.moonPosition);
    moonGroup.add(moonHalo, moon);
    this.moon = moonGroup;
    this.scene.add(moonGroup);

    const starCount = 620;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    for (let index = 0; index < starCount; index += 1) {
      const radius = 48 + seeded(index) * 70;
      const theta = seeded(index + 700) * Math.PI * 2;
      const phi = 0.2 + seeded(index + 1400) * 1.22;
      positions[index * 3] = Math.cos(theta) * Math.sin(phi) * radius;
      positions[index * 3 + 1] = Math.cos(phi) * radius + 8;
      positions[index * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;
      const warmth = seeded(index + 2100);
      colors[index * 3] = 0.68 + warmth * 0.25;
      colors[index * 3 + 1] = 0.75 + warmth * 0.18;
      colors[index * 3 + 2] = 0.88;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.stars = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.07, vertexColors: true, transparent: true, opacity: 0.58, depthWrite: false,
    }));
    this.scene.add(this.stars);
  }

  buildCourtyard() {
    const ground = mesh(new THREE.CircleGeometry(28, 64), mat(0x171923, { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    this.scene.add(ground);

    const pavers = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.12, 1.0), mat(C.slateDark), 180);
    let instance = 0;
    for (let ring = 0; ring < 10; ring += 1) {
      const count = 8 + ring * 3;
      for (let index = 0; index < count && instance < 180; index += 1) {
        const angle = (index / count) * Math.PI * 2 + ring * 0.12;
        const radius = 3.4 + ring * 1.45;
        this.dummy.position.set(Math.cos(angle) * radius, 0.01, Math.sin(angle) * radius);
        this.dummy.rotation.set(0, -angle + (seeded(instance) - 0.5) * 0.18, 0);
        const scale = 0.72 + seeded(instance + 400) * 0.44;
        this.dummy.scale.set(scale, 1, scale * 0.8);
        this.dummy.updateMatrix();
        pavers.setMatrixAt(instance, this.dummy.matrix);
        instance += 1;
      }
    }
    finishInstances(pavers);
    this.scene.add(pavers);

    const wallMaterial = mat(0x202535, { roughness: 1 });
    const backWall = mesh(new THREE.BoxGeometry(38, 5.2, 1), wallMaterial);
    backWall.position.set(0, 2.2, -15);
    const sideWall = mesh(new THREE.BoxGeometry(1, 4.3, 30), wallMaterial);
    sideWall.position.set(-17.5, 1.85, -1.8);
    this.scene.add(backWall, sideWall);

    const cypressCount = 24;
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.25, 1, 7), mat(C.wood), cypressCount);
    const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 9), mat(C.cypress), cypressCount);
    for (let index = 0; index < cypressCount; index += 1) {
      const side = index % 2 ? -1 : 1;
      const x = side < 0 ? -15 + seeded(index) * 2.2 : -14 + index * 1.28;
      const z = side < 0 ? -11 + (index / 2) * 2.05 : -13.2 + seeded(index + 100) * 1.4;
      const height = 4.5 + seeded(index + 200) * 5.4;
      this.dummy.position.set(x, height * 0.35, z);
      this.dummy.scale.set(1, height * 0.7, 1);
      this.dummy.rotation.set(0, seeded(index + 300) * Math.PI, 0);
      this.dummy.updateMatrix();
      trunks.setMatrixAt(index, this.dummy.matrix);
      this.dummy.position.set(x, height * 0.66, z);
      this.dummy.scale.set(0.72 + height * 0.055, height, 0.72 + height * 0.055);
      this.dummy.rotation.set(0, seeded(index + 500) * Math.PI, (seeded(index + 600) - 0.5) * 0.05);
      this.dummy.updateMatrix();
      crowns.setMatrixAt(index, this.dummy.matrix);
    }
    finishInstances(trunks);
    finishInstances(crowns);
    this.scene.add(trunks, crowns);
  }

  buildWell() {
    const stoneMaterial = mat(C.slate, { emissive: 0x0a1019, emissiveIntensity: 0.16 });
    const lightStone = mat(C.slateLight, { roughness: 0.96 });
    const ringCount = 48;
    this.wellStones = new THREE.InstancedMesh(new THREE.BoxGeometry(0.98, 0.48, 0.82), stoneMaterial, ringCount);
    for (let layer = 0; layer < 2; layer += 1) {
      for (let index = 0; index < 24; index += 1) {
        const angle = (index / 24) * Math.PI * 2 + layer * (Math.PI / 24);
        const radius = 2.52;
        this.dummy.position.set(Math.cos(angle) * radius, 0.32 + layer * 0.48, Math.sin(angle) * radius);
        this.dummy.rotation.set(0, -angle, 0);
        this.dummy.scale.set(0.92 + seeded(index + layer * 24) * 0.15, 0.96, 1);
        this.dummy.updateMatrix();
        this.wellStones.setMatrixAt(layer * 24 + index, this.dummy.matrix);
      }
    }
    finishInstances(this.wellStones);
    this.scene.add(this.wellStones);

    const rim = mesh(new THREE.TorusGeometry(2.52, 0.36, 9, 64), lightStone);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.08;
    this.scene.add(rim);

    const inner = mesh(new THREE.CylinderGeometry(2.18, 2.08, 7.0, 48, 10, true), mat(C.slateDark, {
      side: THREE.BackSide, roughness: 1, emissive: 0x050b15, emissiveIntensity: 0.25,
    }));
    inner.position.y = -2.42;
    this.scene.add(inner);

    const deepWallStones = new THREE.InstancedMesh(new THREE.BoxGeometry(0.78, 0.44, 0.3), stoneMaterial, 144);
    for (let layer = 0; layer < 8; layer += 1) {
      for (let index = 0; index < 18; index += 1) {
        const angle = (index / 18) * Math.PI * 2 + (layer % 2) * Math.PI / 18;
        const radius = 2.08;
        this.dummy.position.set(Math.cos(angle) * radius, 0.52 - layer * 0.78, Math.sin(angle) * radius);
        this.dummy.rotation.set(0, -angle, 0);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        deepWallStones.setMatrixAt(layer * 18 + index, this.dummy.matrix);
      }
    }
    finishInstances(deepWallStones);
    this.scene.add(deepWallStones);

    this.water = mesh(new THREE.CircleGeometry(2.02, 64), waterMaterial(), false, false);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -5.72;
    this.scene.add(this.water);

    this.rock = mesh(new THREE.DodecahedronGeometry(0.48, 1), mat(0x34404c));
    this.rock.scale.set(0.92, 0.52, 0.76);
    this.rock.position.set(0.72, -5.52, 0.4);
    this.scene.add(this.rock);

    const beamMaterial = new THREE.MeshBasicMaterial({
      color: C.moonBlue, transparent: true, opacity: 0.026, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    this.wellBeam = mesh(new THREE.CylinderGeometry(1.05, 1.9, 6.7, 32, 1, true), beamMaterial, false, false);
    this.wellBeam.position.y = -2.3;
    this.scene.add(this.wellBeam);

    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: C.moon, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.ripples = finishInstances(new THREE.InstancedMesh(new THREE.RingGeometry(0.93, 1, 48), rippleMaterial, 6), true);
    this.scene.add(this.ripples);
  }

  buildRope() {
    this.hook = createHook();
    this.hook.position.set(3.1, 0.45, 1.1);
    this.scene.add(this.hook);
    const points = new Float32Array(48 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    this.rope = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: C.copper, transparent: true, opacity: 0.95 }));
    this.rope.frustumCulled = false;
    this.scene.add(this.rope);

    const coil = mesh(new THREE.TorusGeometry(0.62, 0.045, 7, 40), mat(C.copper, { roughness: 0.72 }));
    coil.rotation.x = Math.PI / 2;
    coil.scale.set(1, 0.7, 1);
    coil.position.set(3.3, 0.12, 1.2);
    this.coil = coil;
    this.scene.add(coil);
  }

  buildNasreddin() {
    this.nasreddin = createNasreddin();
    this.nasreddin.scale.setScalar(0.92);
    this.nasreddin.position.set(7.2, 0.06, 4.8);
    this.nasreddin.rotation.y = -1.95;
    this.scene.add(this.nasreddin);
  }

  buildAtmosphere() {
    const count = 90;
    this.moteData = Array.from({ length: count }, (_, index) => ({
      x: (seeded(index + 3000) - 0.5) * 28,
      y: 0.5 + seeded(index + 3100) * 9,
      z: (seeded(index + 3200) - 0.5) * 26,
      phase: seeded(index + 3300) * Math.PI * 2,
      scale: 0.015 + seeded(index + 3400) * 0.035,
    }));
    this.motes = finishInstances(new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(1, 0),
      mat(C.moonBlue, { emissive: C.moonBlue, emissiveIntensity: 1.5, transparent: true, opacity: 0.32, depthWrite: false }),
      count,
    ), true);
    this.scene.add(this.motes);
  }

  updateAtmosphere(now, saved) {
    this.moteData.forEach((mote, index) => {
      const drift = this.reducedMotion ? 0 : Math.sin(now * 0.4 + mote.phase) * 0.22;
      this.dummy.position.set(mote.x + drift, mote.y + Math.sin(now * 0.55 + mote.phase) * 0.13, mote.z);
      const pulse = mote.scale * (0.72 + Math.sin(now * 1.6 + mote.phase) * 0.28) * (1 + saved * 0.5);
      this.dummy.scale.setScalar(pulse);
      this.dummy.rotation.set(mote.phase, now * 0.15, 0);
      this.dummy.updateMatrix();
      this.motes.setMatrixAt(index, this.dummy.matrix);
    });
    this.motes.instanceMatrix.needsUpdate = true;
  }

  hookDepth(index, progress, started) {
    if (!started || index < 4) return 0;
    if (index === 4) return ease(progress);
    return 1;
  }

  updateHookAndRope(now, index, progress, started) {
    const depth = this.hookDepth(index, progress, started);
    const snapped = started && index >= 9;
    const snapProgress = index === 9 ? easeOut(progress) : snapped ? 1 : 0;
    const pulling = started && index >= 6 && index <= 8;
    const start = new THREE.Vector3(3.05, 0.48, 1.05);
    const bottom = new THREE.Vector3(0.48, -5.4, 0.22);
    this.hookPosition.copy(start).lerp(bottom, depth);
    if (pulling && !this.reducedMotion) {
      this.hookPosition.x += Math.sin(now * 9.5) * 0.025;
      this.hookPosition.y += Math.sin(now * 12) * 0.018;
    }
    this.hook.position.lerp(this.hookPosition, 0.35);
    this.hook.rotation.z = depth * 0.28 + (pulling ? Math.sin(now * 8) * 0.035 : 0);
    this.hook.visible = true;
    this.coil.scale.setScalar(1 - depth * 0.5);

    const fallOffset = snapped ? snapProgress : 0;
    this.ropeAnchor.set(2.8 + fallOffset * 0.75, 1.6 - fallOffset * 0.9, 0.72 + fallOffset * 1.5);
    const rim = new THREE.Vector3(0.65, 1.25, 0.2);
    const ropeEnd = snapped
      ? new THREE.Vector3(1.1 + snapProgress * 0.8, 0.82 - snapProgress * 0.45, 0.5 + snapProgress * 0.8)
      : this.hook.position.clone();
    const curve = new THREE.CatmullRomCurve3([
      this.ropeAnchor,
      this.ropeAnchor.clone().lerp(rim, 0.5).add(new THREE.Vector3(0, pulling ? 0 : -0.16 * (1 - depth), 0)),
      snapped ? ropeEnd : rim,
      ropeEnd,
    ]);
    const points = curve.getPoints(47);
    const attribute = this.rope.geometry.attributes.position;
    points.forEach((point, pointIndex) => attribute.setXYZ(pointIndex, point.x, point.y, point.z));
    attribute.needsUpdate = true;
    this.rope.material.opacity = started && index < 3 ? 0.35 : 0.95;
    if (snapped) this.rope.material.opacity = 0.95 * (1 - snapProgress * 0.35);
    return { depth, snapped: snapProgress, pulling: pulling ? 1 : 0 };
  }

  updateNasreddin(now, index, progress, started, ropeState) {
    const u = this.nasreddin.userData;
    const approach = started && index === 0 ? ease(progress) : started ? 1 : 0;
    let desired = new THREE.Vector3(7.2, 0.06, 4.8).lerp(new THREE.Vector3(3.15, 0.06, 1.25), approach);
    let fall = 0;
    if (started && index === 9) fall = easeOut(progress);
    else if (started && index > 9) fall = 1;
    desired = desired.lerp(new THREE.Vector3(4.45, 0.42, 3.35), fall);
    this.nasreddin.position.lerp(desired, fall > 0 ? 0.48 : 0.16);
    this.nasreddin.rotation.x += ((-Math.PI / 2) * fall - this.nasreddin.rotation.x) * (fall > 0 ? 0.24 : 0.12);
    this.nasreddin.rotation.z = fall * -0.08;

    const walking = started && index === 0;
    u.legs.forEach((leg, legIndex) => {
      leg.rotation.x = walking && !this.reducedMotion ? Math.sin(progress * Math.PI * 5 + legIndex * Math.PI) * 0.48 : 0;
    });
    const leaning = started && index >= 1 && index <= 2 ? (index === 1 ? ease(progress) : 0.72) : 0;
    const promise = started && index === 3 ? Math.sin(progress * Math.PI) : 0;
    const lowering = started && index >= 4 && index <= 5 ? 1 : 0;
    const pulling = ropeState.pulling;
    const strain = pulling * (0.55 + (index - 6 + progress) * 0.13);
    u.bodyRig.rotation.x = leaning * 0.42 - strain * 0.46;
    u.bodyRig.rotation.z = strain * -0.08 + (index === 2 ? Math.sin(progress * Math.PI) * 0.06 : 0);
    u.headRig.rotation.x = -leaning * 0.34 + strain * 0.18;
    u.headRig.rotation.z = promise * -0.12;

    u.arms.forEach((arm, armIndex) => {
      const side = arm.side;
      let shoulderX = 0.08;
      let shoulderZ = side * -0.18;
      let elbowX = -0.18;
      if (leaning) { shoulderX = 0.55 * leaning; shoulderZ = side * -0.08; }
      if (index === 2) { shoulderX = 0.25; shoulderZ = side < 0 ? -0.9 * Math.sin(progress * Math.PI) : 0.18; }
      if (promise) { shoulderX = 0.3; shoulderZ = side < 0 ? -1.02 * promise : 0.25; }
      if (lowering || pulling) {
        shoulderX = 0.75 + strain * 0.48 + (this.reducedMotion ? 0 : Math.sin(now * 7 + armIndex * 1.7) * pulling * 0.06);
        shoulderZ = side * -0.34;
        elbowX = -0.72 - strain * 0.22;
      }
      if (fall) {
        shoulderX = 0.2 + fall * 0.65;
        shoulderZ = side * (-0.18 - fall * 0.9);
        elbowX = -0.1;
      }
      arm.shoulder.rotation.x = shoulderX;
      arm.shoulder.rotation.z = shoulderZ;
      arm.elbow.rotation.x = elbowX;
    });

    if (started && index === 11) {
      const rub = Math.sin(progress * Math.PI);
      u.arms[1].shoulder.rotation.z = 0.8 * rub;
      u.arms[1].shoulder.rotation.x = -0.25 * rub;
      u.headRig.rotation.z = -0.08 * rub;
    }
    const blink = !this.reducedMotion && Math.sin(now * 0.72) > 0.995 ? 0.15 : 1;
    u.eyes.forEach((eye) => { eye.scale.y = blink; });
    return { fall, strain };
  }

  updateWater(now, index, progress, ropeState) {
    const snap = index === 9 ? Math.sin(clamp01(progress) * Math.PI) : 0;
    const settle = index >= 10 ? Math.max(0, 1 - (index === 10 ? progress : 1) * 0.7) : 0;
    const disturbance = Math.max(snap, settle * 0.45, ropeState.pulling * 0.18);
    this.water.material.uniforms.uTime.value = now;
    this.water.material.uniforms.uDisturbance.value = disturbance;
    this.water.material.uniforms.uHook.value = ropeState.depth;
    for (let ringIndex = 0; ringIndex < 6; ringIndex += 1) {
      const phase = (now * (0.16 + disturbance * 0.7) + ringIndex / 6) % 1;
      const active = ropeState.depth > 0.05 || disturbance > 0.03;
      const scale = active ? 0.15 + phase * (1.2 + disturbance * 0.65) : 0.0001;
      this.dummy.position.set(0, -5.68 + ringIndex * 0.002, 0);
      this.dummy.rotation.set(-Math.PI / 2, 0, 0);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.ripples.setMatrixAt(ringIndex, this.dummy.matrix);
    }
    this.ripples.instanceMatrix.needsUpdate = true;
    this.ripples.material.opacity = clamp01((ropeState.depth + disturbance) * 0.05) * (0.72 + Math.sin(now * 2) * 0.06);
    this.wellBeam.material.opacity = 0.024 + ropeState.depth * 0.014 + (index >= 10 ? 0.016 : 0);
    return disturbance;
  }

  updateCamera(now, dt, index, progress, started) {
    const pose = CAMERA_POSES[Math.min(index, CAMERA_POSES.length - 1)];
    const shotProgress = started ? ease(progress) : 0.08 + Math.sin(now * 0.07) * 0.012;
    this.desiredCamera.fromArray(pose.position).lerp(new THREE.Vector3(...pose.endPosition), shotProgress);
    this.cameraTarget.fromArray(pose.target).lerp(new THREE.Vector3(...pose.endTarget), shotProgress);
    if (!this.reducedMotion) {
      this.desiredCamera.x += Math.sin(now * 0.14 + index) * 0.025;
      this.desiredCamera.y += Math.sin(now * 0.11) * 0.018;
      if (started && index === 7) this.desiredCamera.x += Math.sin(progress * Math.PI * 2) * 0.16;
      if (started && index === 9) this.desiredCamera.y += Math.sin(Math.min(1, progress * 2) * Math.PI) * 0.32;
    }
    const positionEase = 1 - Math.exp(-dt * (started ? 2.9 : 1.45));
    this.camera.position.lerp(this.desiredCamera, positionEase);
    this.lookMatrix.lookAt(this.camera.position, this.cameraTarget, this.camera.up);
    this.targetQuaternion.setFromRotationMatrix(this.lookMatrix);
    this.camera.quaternion.slerp(this.targetQuaternion, 1 - Math.exp(-dt * 4.2));
    const desiredFov = THREE.MathUtils.lerp(pose.fov, pose.endFov, shotProgress);
    this.camera.fov += (desiredFov - this.camera.fov) * Math.min(1, dt * 3.3);
    this.camera.updateProjectionMatrix();
  }

  update(now, dt, state) {
    const started = state.started;
    const index = state.index ?? 0;
    const progress = state.localProgress ?? 0;
    const ropeState = this.updateHookAndRope(now, index, progress, started);
    const actorState = this.updateNasreddin(now, index, progress, started, ropeState);
    const disturbance = this.updateWater(now, index, progress, ropeState);
    const saved = started && index >= 10 ? (index === 10 ? ease(progress) : 1) : 0;
    this.updateAtmosphere(now, saved);
    this.updateCamera(now, dt, index, progress, started);

    this.moon.lookAt(this.camera.position);
    this.stars.rotation.y = now * 0.002;
    this.hemi.intensity = 1.55 + saved * 0.42 - actorState.strain * 0.12;
    this.moonLight.intensity = 3.2 + saved * 1.1;
    this.wellLight.intensity = 4.8 + ropeState.depth * 1.3 + disturbance * 2.2;
    this.warmLight.intensity = 2.4 - actorState.strain * 0.35 + saved * 0.2;
    this.bloom.strength = 0.34 + ropeState.depth * 0.08 + disturbance * 0.22 + saved * 0.18;
    this.renderer.toneMappingExposure = 1.02 + saved * 0.13 - actorState.strain * 0.03;
    this.scene.fog.density = 0.022 - saved * 0.004;
    this.composer.render();
  }

  resize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  }
}
