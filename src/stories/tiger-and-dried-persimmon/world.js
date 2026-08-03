import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CAMERA_POSES } from './story.js';

const C = {
  night: 0x07141d, dawn: 0xb7c8c4, fog: 0x0d2029, dawnFog: 0xa6b5ac,
  moon: 0xdde4de, hanji: 0xeee2c6, persimmon: 0xe4612d, persimmonDark: 0x9e3b22,
  pine: 0x17362d, pineLight: 0x315b47, bark: 0x342b26, ink: 0x151719,
  tiger: 0xd85b2d, tigerLight: 0xf08a43, cream: 0xf0d7ab, skin: 0xbb8062,
  thief: 0x26343b, roof: 0x263139, earth: 0x4a4b46, paperGlow: 0xf0b45c,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const seeded = (index) => { const x = Math.sin(index * 973.37 + 17.2) * 43758.5453; return x - Math.floor(x); };

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...options });
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

function createPerson({ robe = C.thief, hat = C.ink } = {}) {
  const group = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.3, 0.53, 1.12, 8), mat(robe));
  body.position.y = 0.64;
  const head = mesh(new THREE.IcosahedronGeometry(0.25, 2), mat(C.skin));
  head.position.y = 1.45;
  const cap = mesh(new THREE.CylinderGeometry(0.19, 0.25, 0.22, 8), mat(hat));
  cap.position.y = 1.68;
  group.add(body, head, cap);
  const arms = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.32, 1.04, 0);
    const sleeve = mesh(new THREE.CylinderGeometry(0.065, 0.105, 0.62, 7), mat(robe));
    sleeve.position.y = -0.29;
    const hand = mesh(new THREE.IcosahedronGeometry(0.085, 1), mat(C.skin));
    hand.position.y = -0.62;
    pivot.add(sleeve, hand);
    group.add(pivot);
    return pivot;
  });
  group.userData = { body, head, leftArm: arms[0], rightArm: arms[1] };
  return group;
}

function createTiger() {
  const group = new THREE.Group();
  const orange = mat(C.tiger, { emissive: 0x351006, emissiveIntensity: 0.16 });
  const pale = mat(C.cream);
  const black = mat(C.ink);
  const body = mesh(new THREE.SphereGeometry(0.88, 14, 10), orange);
  body.scale.set(1.7, 0.78, 0.72);
  body.position.y = 1.02;
  const chest = mesh(new THREE.SphereGeometry(0.62, 12, 9), orange);
  chest.scale.set(0.72, 1.12, 0.75);
  chest.position.set(-0.92, 1.18, 0.02);
  const head = mesh(new THREE.IcosahedronGeometry(0.63, 2), orange);
  head.scale.set(1.02, 0.95, 0.82);
  head.position.set(-1.28, 1.72, 0.02);
  const muzzle = mesh(new THREE.SphereGeometry(0.37, 12, 8), pale);
  muzzle.scale.set(1, 0.62, 0.72);
  muzzle.position.set(-1.76, 1.57, 0.03);
  const nose = mesh(new THREE.IcosahedronGeometry(0.12, 1), black);
  nose.position.set(-2.04, 1.64, 0.03);
  group.add(body, chest, head, muzzle, nose);

  const ears = [-1, 1].map((side) => {
    const ear = mesh(new THREE.ConeGeometry(0.2, 0.38, 7), orange);
    ear.rotation.z = side * 0.18;
    ear.position.set(-1.35 + side * 0.34, 2.22, 0.02);
    group.add(ear);
    return ear;
  });

  const eyes = [-1, 1].map((side) => {
    const eye = mesh(new THREE.SphereGeometry(0.092, 8, 6), mat(0xf7e4bc, { emissive: 0x50361c, emissiveIntensity: 0.22 }), false, false);
    eye.position.set(-1.67, 1.88, side * 0.32);
    eye.scale.set(1, 1.25, 0.55);
    const pupil = mesh(new THREE.SphereGeometry(0.045, 7, 5), black, false, false);
    pupil.position.set(-1.745, 1.88, side * 0.34);
    group.add(eye, pupil);
    return { eye, pupil };
  });

  const legs = [[-0.95, -0.42], [-0.95, 0.42], [0.85, -0.42], [0.85, 0.42]].map(([x, z]) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.78, z);
    const leg = mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.82, 7), orange);
    leg.position.y = -0.38;
    const paw = mesh(new THREE.SphereGeometry(0.2, 8, 6), pale);
    paw.scale.set(1.35, 0.55, 1);
    paw.position.set(-0.08, -0.82, 0);
    pivot.add(leg, paw);
    group.add(pivot);
    return pivot;
  });

  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.28, 1.18, 0), new THREE.Vector3(1.9, 1.3, 0.1),
    new THREE.Vector3(2.15, 1.9, 0.18), new THREE.Vector3(1.78, 2.3, 0.22),
  ]);
  const tail = mesh(new THREE.TubeGeometry(tailCurve, 18, 0.1, 7, false), orange);
  group.add(tail);

  const stripeCount = 18;
  const stripes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.62, 0.82), black, stripeCount);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 12; index += 1) {
    dummy.position.set(-0.45 + index * 0.15, 1.34 - Math.abs(index - 5.5) * 0.018, 0);
    dummy.rotation.set(0, 0, -0.28 + seeded(index) * 0.5);
    dummy.scale.set(1, 0.58 + seeded(index + 30) * 0.42, 1);
    dummy.updateMatrix();
    stripes.setMatrixAt(index, dummy.matrix);
  }
  for (let index = 12; index < stripeCount; index += 1) {
    const local = index - 12;
    dummy.position.set(-1.28, 1.75 + (local % 3) * 0.13, -0.3 + Math.floor(local / 3) * 0.6);
    dummy.rotation.set(0, Math.PI / 2, (local % 3 - 1) * 0.28);
    dummy.scale.set(0.72, 0.45, 0.55);
    dummy.updateMatrix();
    stripes.setMatrixAt(index, dummy.matrix);
  }
  finishInstances(stripes);
  group.add(stripes);
  group.userData = { body, head, muzzle, ears, eyes, legs, tail, stripes, orangeMaterial: orange };
  return group;
}

export class StoryWorld {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.nightColor = new THREE.Color(C.night);
    this.dawnColor = new THREE.Color(C.dawn);
    this.nightFog = new THREE.Color(C.fog);
    this.dawnFog = new THREE.Color(C.dawnFog);
    this.scene.background = this.nightColor.clone();
    this.scene.fog = new THREE.FogExp2(C.fog, 0.032);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
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
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.72, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraPath = new THREE.CatmullRomCurve3(CAMERA_POSES.map((pose) => new THREE.Vector3(...pose.position)), false, 'centripetal', 0.35);
    this.targetPath = new THREE.CatmullRomCurve3(CAMERA_POSES.map((pose) => new THREE.Vector3(...pose.target)), false, 'centripetal', 0.35);
    this.lookMatrix = new THREE.Matrix4();
    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();
    this.fear = 0;
    this.build();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  build() {
    this.hemi = new THREE.HemisphereLight(0x8095a2, 0x221913, 1.45);
    this.scene.add(this.hemi);
    this.moonLight = new THREE.DirectionalLight(0xb9d0dd, 2.5);
    this.moonLight.position.set(8, 12, 7);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.set(2048, 2048);
    this.moonLight.shadow.camera.left = -11;
    this.moonLight.shadow.camera.right = 11;
    this.moonLight.shadow.camera.top = 9;
    this.moonLight.shadow.camera.bottom = -7;
    this.scene.add(this.moonLight);
    this.windowLight = new THREE.PointLight(C.paperGlow, 10, 8, 1.8);
    this.windowLight.position.set(-2.7, 2.0, -1.0);
    this.scene.add(this.windowLight);

    this.buildSky();
    this.buildForest();
    this.buildVillage();
    this.buildFamily();
    this.buildTiger();
    this.buildThief();
    this.buildFearField();
    this.buildSnowDust();
  }

  buildSky() {
    const moon = mesh(new THREE.SphereGeometry(1.4, 28, 18), new THREE.MeshBasicMaterial({ color: C.moon }), false, false);
    moon.position.set(-10, 10.5, -18);
    this.scene.add(moon);
    const positions = [];
    for (let index = 0; index < 220; index += 1) {
      const angle = seeded(index) * Math.PI * 2;
      const radius = 18 + seeded(index + 70) * 24;
      positions.push(Math.cos(angle) * radius, 7 + seeded(index + 130) * 17, Math.sin(angle) * radius - 11);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: C.hanji, size: 0.05, transparent: true, opacity: 0.44 }));
    this.scene.add(this.stars);
  }

  buildForest() {
    const treeCount = 36;
    this.treeData = Array.from({ length: treeCount }, (_, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      return {
        x: side * (5.8 + seeded(index) * 8.5),
        z: -4 - seeded(index + 40) * 18,
        height: 3.6 + seeded(index + 90) * 4.8,
        lean: (seeded(index + 120) - 0.5) * 0.16,
      };
    });
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.2, 1, 7), mat(C.bark), treeCount);
    const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 2.4, 7), mat(C.pine), treeCount * 2);
    this.treeData.forEach((tree, index) => {
      this.dummy.position.set(tree.x, tree.height / 2, tree.z);
      this.dummy.rotation.set(0, seeded(index + 220) * Math.PI, tree.lean);
      this.dummy.scale.set(1, tree.height, 1);
      this.dummy.updateMatrix();
      trunks.setMatrixAt(index, this.dummy.matrix);
      for (let layer = 0; layer < 2; layer += 1) {
        const scale = (tree.height / 5) * (layer === 0 ? 1 : 0.72);
        this.dummy.position.set(tree.x, tree.height * (0.62 + layer * 0.18), tree.z);
        this.dummy.rotation.set(0, seeded(index + layer * 50) * Math.PI, tree.lean);
        this.dummy.scale.set(scale, scale, scale);
        this.dummy.updateMatrix();
        crowns.setMatrixAt(index * 2 + layer, this.dummy.matrix);
      }
    });
    finishInstances(trunks);
    finishInstances(crowns);
    this.pineTrunks = trunks;
    this.pineCrowns = crowns;
    this.scene.add(trunks, crowns);
  }

  buildVillage() {
    const ground = mesh(new THREE.PlaneGeometry(36, 30), mat(C.earth, { roughness: 1 }), false, true);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.scene.add(ground);

    this.house = new THREE.Group();
    const wall = mesh(new THREE.BoxGeometry(6.5, 3.25, 3.3), mat(0xb2aa96, { roughness: 1 }), false, true);
    wall.position.y = 1.62;
    this.house.add(wall);
    const beamMaterial = mat(C.bark);
    [-2.95, 0, 2.95].forEach((x) => {
      const beam = mesh(new THREE.BoxGeometry(0.2, 3.45, 0.18), beamMaterial);
      beam.position.set(x, 1.72, 1.7);
      this.house.add(beam);
    });
    const windowMaterial = new THREE.MeshStandardMaterial({ color: C.hanji, emissive: C.paperGlow, emissiveIntensity: 1.35, roughness: 0.9, transparent: true, opacity: 0.9 });
    this.window = mesh(new THREE.PlaneGeometry(2.45, 1.75), windowMaterial, false, false);
    this.window.position.set(-1.15, 1.76, 1.68);
    this.house.add(this.window);
    const windowBars = new THREE.Group();
    [-0.8, -0.27, 0.27, 0.8].forEach((x) => {
      const bar = mesh(new THREE.BoxGeometry(0.035, 1.75, 0.035), beamMaterial, false, false);
      bar.position.x = x;
      windowBars.add(bar);
    });
    [-0.55, 0, 0.55].forEach((y) => {
      const bar = mesh(new THREE.BoxGeometry(2.45, 0.035, 0.035), beamMaterial, false, false);
      bar.position.y = y;
      windowBars.add(bar);
    });
    windowBars.position.copy(this.window.position);
    windowBars.position.z += 0.025;
    this.house.add(windowBars);
    this.house.position.set(-2.35, 0, -3.0);
    this.scene.add(this.house);

    const tileColumns = 13;
    const tileRows = 4;
    const tileCount = tileColumns * tileRows * 2;
    const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.48, 0.09, 0.72), mat(C.roof), tileCount);
    let tileIndex = 0;
    for (let side = -1; side <= 1; side += 2) {
      for (let row = 0; row < tileRows; row += 1) {
        for (let column = 0; column < tileColumns; column += 1) {
          const zOffset = side * (0.3 + row * 0.5);
          this.dummy.position.set(-5.35 + column * 0.5, 3.55 - row * 0.17, -3 + zOffset);
          this.dummy.rotation.set(side * 0.34, 0, 0);
          this.dummy.scale.set(1, 1, 1);
          this.dummy.updateMatrix();
          tiles.setMatrixAt(tileIndex, this.dummy.matrix);
          tileIndex += 1;
        }
      }
    }
    finishInstances(tiles);
    this.roofTiles = tiles;
    this.scene.add(tiles);

    const fruitCount = 18;
    this.hangingFruitData = Array.from({ length: fruitCount }, (_, index) => ({
      x: -4.7 + (index % 9) * 0.43,
      y: 2.95 - Math.floor(index / 9) * 0.55 - seeded(index) * 0.18,
      z: -0.92 + Math.floor(index / 9) * 0.24,
      scale: 0.15 + seeded(index + 24) * 0.06,
      phase: seeded(index + 48) * Math.PI * 2,
    }));
    this.hangingFruit = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), mat(C.persimmon, { roughness: 0.82 }), fruitCount);
    this.updateHangingFruit(0);
    finishInstances(this.hangingFruit, true);
    this.scene.add(this.hangingFruit);

    const shed = mesh(new THREE.BoxGeometry(3.8, 2.7, 3), mat(0x403c34, { roughness: 1 }), false, true);
    shed.position.set(3.9, 1.35, -2.4);
    this.scene.add(shed);
    const shedDoor = mesh(new THREE.PlaneGeometry(1.8, 2.15), mat(0x171a19), false, false);
    shedDoor.position.set(3.9, 1.1, -0.89);
    this.scene.add(shedDoor);
  }

  buildFamily() {
    this.mother = createPerson({ robe: 0x7f4a3d, hat: C.ink });
    this.mother.scale.setScalar(0.8);
    this.mother.position.set(-3.45, 0.68, -1.18);
    this.mother.rotation.y = Math.PI;
    this.mother.userData.leftArm.rotation.z = 1.42;
    this.mother.userData.rightArm.rotation.z = -1.42;
    this.baby = mesh(new THREE.SphereGeometry(0.19, 10, 7), mat(C.cream), false, false);
    this.baby.position.set(-3.45, 1.68, -1.06);
    this.scene.add(this.mother, this.baby);
    this.offeredPersimmon = mesh(new THREE.DodecahedronGeometry(0.2, 1), mat(C.persimmon, { emissive: 0x4b1206, emissiveIntensity: 0.4 }));
    this.offeredPersimmon.position.set(-3.05, 1.82, -0.98);
    this.offeredPersimmon.visible = false;
    this.scene.add(this.offeredPersimmon);
  }

  buildTiger() {
    this.tiger = createTiger();
    this.tiger.position.set(3.8, 0, 0.45);
    this.tiger.rotation.y = 0.08;
    this.scene.add(this.tiger);
    this.tigerKeyLight = new THREE.PointLight(0xff8a45, 0, 7, 1.7);
    this.scene.add(this.tigerKeyLight);
  }

  buildThief() {
    this.thief = createPerson({ robe: C.thief, hat: 0x0f1519 });
    this.thief.position.set(6.3, 0, -0.5);
    this.thief.rotation.y = -1.25;
    this.thief.visible = false;
    this.scene.add(this.thief);
  }

  buildFearField() {
    const count = 60;
    this.fearData = Array.from({ length: count }, (_, index) => ({
      angle: (index / 12) * Math.PI * 2 + seeded(index) * 0.28,
      ring: Math.floor(index / 12),
      drift: seeded(index + 200) * Math.PI * 2,
      scale: 0.28 + seeded(index + 320) * 0.3,
    }));
    const material = new THREE.MeshStandardMaterial({
      color: C.persimmon,
      emissive: C.persimmonDark,
      emissiveIntensity: 1.1,
      roughness: 0.55,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.fearPersimmons = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), material, count);
    finishInstances(this.fearPersimmons, true);
    this.scene.add(this.fearPersimmons);
  }

  buildSnowDust() {
    const positions = [];
    for (let index = 0; index < 190; index += 1) {
      positions.push((seeded(index) - 0.5) * 19, seeded(index + 100) * 6.5, (seeded(index + 200) - 0.5) * 15);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: C.hanji, size: 0.034, transparent: true, opacity: 0.22, depthWrite: false }));
    this.scene.add(this.dust);
  }

  updateHangingFruit(now) {
    this.hangingFruitData.forEach((fruit, index) => {
      this.dummy.position.set(fruit.x + Math.sin(now * 0.7 + fruit.phase) * 0.025, fruit.y, fruit.z);
      this.dummy.rotation.set(0, now * 0.08 + fruit.phase, Math.sin(now * 0.8 + fruit.phase) * 0.04);
      this.dummy.scale.setScalar(fruit.scale);
      this.dummy.updateMatrix();
      this.hangingFruit.setMatrixAt(index, this.dummy.matrix);
    });
    this.hangingFruit.instanceMatrix.needsUpdate = true;
  }

  updateFearField(now, strength) {
    this.fearPersimmons.material.opacity = strength * 0.73;
    this.fearData.forEach((fruit, index) => {
      const radius = 1.2 + fruit.ring * 0.72 + strength * 0.8;
      const angle = fruit.angle + now * (0.08 + fruit.ring * 0.012);
      const depth = -0.3 - fruit.ring * 1.4 + Math.sin(now * 0.7 + fruit.drift) * 0.2;
      this.dummy.position.set(
        this.tiger.position.x - 0.5 + Math.cos(angle) * radius,
        1.45 + Math.sin(angle) * radius * 0.62,
        depth,
      );
      this.dummy.rotation.set(now * 0.16 + fruit.drift, angle, Math.sin(angle) * 0.2);
      const scale = Math.max(0.001, fruit.scale * strength * (1 + fruit.ring * 0.11));
      this.dummy.scale.set(scale * 1.06, scale, scale * 0.86);
      this.dummy.updateMatrix();
      this.fearPersimmons.setMatrixAt(index, this.dummy.matrix);
    });
    this.fearPersimmons.instanceMatrix.needsUpdate = true;
  }

  update(now, dt, state) {
    const started = state.started;
    const index = state.index ?? 0;
    const progress = state.localProgress ?? 0;
    const fearTarget = started
      ? (index === 5 ? ease(progress) : index >= 6 && index <= 8 ? 0.72 : index === 9 ? 0.72 * (1 - ease(progress)) : 0)
      : 0;
    this.fear += (fearTarget - this.fear) * Math.min(1, dt * 4.2);
    this.updateFearField(now, this.fear);
    this.updateHangingFruit(now);

    const dawn = started && index === 11 ? ease(progress) : 0;
    this.scene.background.copy(this.nightColor).lerp(this.dawnColor, dawn * 0.86);
    this.scene.fog.color.copy(this.nightFog).lerp(this.dawnFog, dawn * 0.92);
    this.hemi.intensity = 1.45 + dawn * 1.1;
    this.moonLight.intensity = 2.5 - dawn * 1.15;
    this.windowLight.intensity = 10 * (1 - dawn * 0.8);
    this.stars.material.opacity = 0.44 * (1 - dawn);
    this.bloom.strength = 0.34 + this.fear * 0.27 - dawn * 0.16;
    this.renderer.toneMappingExposure = 1.02 + dawn * 0.18;

    let cameraProgress = started ? state.poseProgress : 0;
    if (!started) cameraProgress = clamp01(0.014 + Math.sin(now * 0.06) * 0.007);
    const position = this.cameraPath.getPointAt(clamp01(cameraProgress));
    const target = this.targetPath.getPointAt(clamp01(cameraProgress));
    if (!this.reducedMotion) {
      position.x += Math.sin(now * 0.14) * 0.045;
      position.y += Math.sin(now * 0.11 + 1) * 0.03;
      if (started && index >= 9 && index <= 10) position.x += Math.sin(now * 13) * 0.035;
    }
    this.camera.position.lerp(position, 1 - Math.exp(-dt * 2.25));
    this.lookMatrix.lookAt(this.camera.position, target, this.camera.up);
    this.targetQuaternion.setFromRotationMatrix(this.lookMatrix);
    this.camera.quaternion.slerp(this.targetQuaternion, 1 - Math.exp(-dt * 3.1));
    const poseIndex = Math.min(CAMERA_POSES.length - 1, index);
    this.camera.fov += (CAMERA_POSES[poseIndex].fov - this.camera.fov) * Math.min(1, dt * 2.3);
    this.camera.updateProjectionMatrix();

    let tigerX = started && index === 0 ? THREE.MathUtils.lerp(4.2, 1.2, ease(progress)) : 1.2;
    let tigerZ = 0.45;
    let tigerY = 0;
    let running = 0;
    if (started && index >= 9) {
      running = index === 9 ? ease(progress) * 0.45 : index === 10 ? 0.45 + ease(progress) * 0.45 : 0.9 + ease(progress) * 0.1;
      const escapeX = this.camera.aspect < 0.75 ? 0.2 : -6.1;
      tigerX = THREE.MathUtils.lerp(1.2, escapeX, running);
      tigerZ = THREE.MathUtils.lerp(0.45, 1.7, running);
      tigerY = !this.reducedMotion && index <= 10 ? Math.abs(Math.sin(now * 10.5)) * 0.11 : 0;
    }
    this.tiger.position.set(tigerX, tigerY, tigerZ);
    this.tigerKeyLight.position.set(tigerX + 0.4, tigerY + 2.45, tigerZ + 1.35);
    this.tigerKeyLight.intensity = running * 6.5 + dawn * 1.2;
    this.tiger.userData.orangeMaterial.emissiveIntensity = 0.16 + running * 0.2 + dawn * 0.08;
    this.tiger.rotation.y = started && index >= 9 ? -0.12 : 0.08;
    this.tiger.rotation.z = this.fear * Math.sin(now * 18) * 0.018;
    const eyeScale = 1 + this.fear * 0.65 + (started && index === 8 ? ease(progress) * 0.35 : 0);
    this.tiger.userData.eyes.forEach(({ eye, pupil }) => {
      eye.scale.y = 1.25 * eyeScale;
      pupil.scale.y = eyeScale;
    });
    this.tiger.userData.ears.forEach((ear, earIndex) => {
      ear.rotation.z = (earIndex === 0 ? -1 : 1) * (0.18 + this.fear * 0.38);
    });
    this.tiger.userData.legs.forEach((leg, legIndex) => {
      leg.rotation.z = running > 0 && index <= 10 ? Math.sin(now * 11 + legIndex * Math.PI / 2) * 0.72 : 0;
    });

    const offer = started && index >= 4 && index <= 5;
    this.offeredPersimmon.visible = offer;
    if (offer) {
      const reveal = index === 4 ? ease(progress) : 1;
      this.offeredPersimmon.scale.setScalar(0.2 + reveal * 0.8);
      this.offeredPersimmon.rotation.y = now * 0.45;
    }
    const rocking = started && index >= 1 && index <= 4 ? Math.sin(now * 2.3) * 0.045 : 0;
    this.mother.rotation.z = rocking;
    this.baby.position.y = 1.68 + rocking * 0.7;

    const thiefVisible = started && index >= 6;
    this.thief.visible = thiefVisible;
    if (thiefVisible) {
      if (index <= 8) {
        const approach = index === 6 ? ease(progress) * 0.45 : index === 7 ? 0.45 + ease(progress) * 0.35 : 0.8 + ease(progress) * 0.2;
        this.thief.position.set(THREE.MathUtils.lerp(6.3, 1.55, approach), THREE.MathUtils.lerp(0, 1.72, Math.max(0, (approach - 0.78) / 0.22)), THREE.MathUtils.lerp(-0.5, 0.38, approach));
        this.thief.rotation.set(0, THREE.MathUtils.lerp(-1.25, -0.05, approach), THREE.MathUtils.lerp(0, -0.18, Math.max(0, (approach - 0.78) / 0.22)));
      } else if (index <= 10) {
        this.thief.position.set(this.tiger.position.x + 0.2, this.tiger.position.y + 1.7, this.tiger.position.z + 0.12);
        this.thief.rotation.set(0, -0.05, -0.18 + Math.sin(now * 10.5) * 0.05);
      } else {
        const leap = ease(progress);
        this.thief.position.set(THREE.MathUtils.lerp(-5.7, -3.1, leap), THREE.MathUtils.lerp(1.7, 4.1, leap), THREE.MathUtils.lerp(-1.9, -3.5, leap));
        this.thief.rotation.set(0, -0.2, THREE.MathUtils.lerp(-0.18, -0.62, leap));
      }
      const grip = index >= 8 && index <= 10 ? 1 : 0;
      this.thief.userData.leftArm.rotation.z = THREE.MathUtils.lerp(-0.12, 2.25, grip);
      this.thief.userData.rightArm.rotation.z = THREE.MathUtils.lerp(0.12, -2.25, grip);
    }

    this.dust.rotation.y = now * 0.004;
    this.dust.position.y = Math.sin(now * 0.2) * 0.08;
    this.stars.rotation.y = now * 0.0015;
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
