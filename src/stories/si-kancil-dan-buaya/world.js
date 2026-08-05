import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CAMERA_POSES } from './story.js';

const C = {
  sky: 0x081c24,
  fog: 0x12312f,
  river: 0x184a55,
  riverLight: 0x4b9993,
  bank: 0x5a3b27,
  bankWet: 0x2b3429,
  mangrove: 0x173f36,
  jade: 0x2d6658,
  leafLight: 0x4f8261,
  kancil: 0xad5d36,
  kancilLight: 0xd58a55,
  cream: 0xe8d6ad,
  crocodile: 0x526640,
  crocodileDark: 0x394a35,
  crocodileLight: 0x7b8552,
  brass: 0xe5b95f,
  straw: 0xc8b77d,
  eye: 0xf0bc4d,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const easeOut = (value) => 1 - (1 - clamp01(value)) ** 3;
const seeded = (index) => { const x = Math.sin(index * 812.73 + 47.2) * 43758.5453; return x - Math.floor(x); };

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

function createKancil() {
  const root = new THREE.Group();
  const bodyRig = new THREE.Group();
  root.add(bodyRig);
  const fur = mat(C.kancil, { emissive: 0x301108, emissiveIntensity: 0.14 });
  const lightFur = mat(C.kancilLight);
  const cream = mat(C.cream);
  const dark = mat(0x241711);

  const body = mesh(new THREE.IcosahedronGeometry(0.65, 2), fur);
  body.scale.set(0.72, 0.72, 1.22);
  body.position.y = 0.88;
  const chest = mesh(new THREE.IcosahedronGeometry(0.46, 2), lightFur);
  chest.scale.set(0.72, 0.98, 0.72);
  chest.position.set(0, 0.96, -0.52);
  const neck = mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.68, 8), fur);
  neck.position.set(0, 1.25, -0.77);
  neck.rotation.x = -0.4;
  const headRig = new THREE.Group();
  headRig.position.set(0, 1.52, -1.0);
  const head = mesh(new THREE.IcosahedronGeometry(0.42, 2), fur);
  head.scale.set(0.8, 0.84, 1.05);
  const muzzle = mesh(new THREE.IcosahedronGeometry(0.24, 1), cream);
  muzzle.scale.set(0.76, 0.65, 1.16);
  muzzle.position.set(0, -0.07, -0.38);
  const nose = mesh(new THREE.IcosahedronGeometry(0.09, 1), dark);
  nose.position.set(0, -0.03, -0.62);
  headRig.add(head, muzzle, nose);

  const ears = [];
  [-1, 1].forEach((side) => {
    const ear = mesh(new THREE.ConeGeometry(0.18, 0.62, 5), side < 0 ? fur : lightFur);
    ear.position.set(side * 0.22, 0.39, 0.02);
    ear.rotation.z = side * -0.22;
    ear.rotation.x = -0.08;
    ears.push(ear);
    headRig.add(ear);
  });

  const eyes = [];
  [-1, 1].forEach((side) => {
    const eye = mesh(new THREE.SphereGeometry(0.065, 8, 6), mat(0x12100c, { roughness: 0.34 }), false, false);
    eye.position.set(side * 0.25, 0.09, -0.29);
    eyes.push(eye);
    headRig.add(eye);
  });

  const tail = new THREE.Group();
  tail.position.set(0, 1.0, 0.7);
  const tailMesh = mesh(new THREE.ConeGeometry(0.18, 0.66, 7), cream);
  tailMesh.rotation.x = Math.PI / 2;
  tailMesh.position.z = 0.27;
  tail.add(tailMesh);

  const legs = [];
  [
    [-0.36, -0.38], [0.36, -0.38], [-0.34, 0.45], [0.34, 0.45],
  ].forEach(([x, z], index) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.75, z);
    const upper = mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.6, 7), fur);
    upper.position.y = -0.28;
    const knee = new THREE.Group();
    knee.position.y = -0.55;
    const lower = mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.54, 7), lightFur);
    lower.position.y = -0.25;
    const hoof = mesh(new THREE.CapsuleGeometry(0.07, 0.13, 2, 6), dark);
    hoof.rotation.x = Math.PI / 2;
    hoof.position.set(0, -0.53, -0.04);
    knee.add(lower, hoof);
    pivot.add(upper, knee);
    bodyRig.add(pivot);
    legs.push({ pivot, knee, front: index < 2, side: x < 0 ? -1 : 1 });
  });

  bodyRig.add(body, chest, neck, headRig, tail);
  root.userData = { bodyRig, body, chest, headRig, ears, eyes, tail, legs };
  return root;
}

function createLeadCrocodile() {
  const group = new THREE.Group();
  const hide = mat(C.crocodile, { emissive: 0x111c12, emissiveIntensity: 0.18 });
  const dark = mat(C.crocodileDark);
  const belly = mat(C.crocodileLight);
  const body = mesh(new THREE.IcosahedronGeometry(0.72, 2), hide);
  body.scale.set(1.65, 0.54, 0.66);
  body.position.y = 0.36;
  const tail = mesh(new THREE.ConeGeometry(0.4, 2.2, 8), hide);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-1.75, 0.3, 0);
  const headRig = new THREE.Group();
  headRig.position.set(1.22, 0.42, 0);
  const skull = mesh(new THREE.BoxGeometry(1.18, 0.42, 0.92, 2, 1, 2), hide);
  skull.position.x = 0.3;
  const jaw = new THREE.Group();
  jaw.position.set(0.88, -0.15, 0);
  const jawMesh = mesh(new THREE.BoxGeometry(1.0, 0.18, 0.82), belly);
  jawMesh.position.x = -0.35;
  jaw.add(jawMesh);
  headRig.add(skull, jaw);

  const eyes = [];
  [-1, 1].forEach((side) => {
    const eye = mesh(new THREE.SphereGeometry(0.115, 10, 7), mat(C.eye, { emissive: 0x7c4c08, emissiveIntensity: 1.2 }), false, false);
    eye.position.set(0.35, 0.3, side * 0.39);
    eyes.push(eye);
    headRig.add(eye);
  });

  const scutes = [];
  for (let index = 0; index < 5; index += 1) {
    const scute = mesh(new THREE.ConeGeometry(0.13, 0.3, 4), dark);
    scute.position.set(-0.8 + index * 0.4, 0.9 - Math.abs(index - 2) * 0.06, 0);
    scute.rotation.z = Math.PI;
    scutes.push(scute);
    group.add(scute);
  }
  group.add(body, tail, headRig);
  group.userData = { body, headRig, jaw, eyes, scutes };
  return group;
}

export class StoryWorld {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.sky);
    this.scene.fog = new THREE.FogExp2(C.fog, 0.024);
    this.camera = new THREE.PerspectiveCamera(43, 1, 0.1, 140);
    this.camera.position.fromArray(CAMERA_POSES[0].position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.26, 0.65, 0.82);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.dummy = new THREE.Object3D();
    this.lookMatrix = new THREE.Matrix4();
    this.targetQuaternion = new THREE.Quaternion();
    this.cameraTarget = new THREE.Vector3();
    this.desiredCamera = new THREE.Vector3();
    this.crossingPoints = Array.from({ length: 8 }, (_, index) => new THREE.Vector3(0, 0.82, 3.68 - index * 1.06));
    this.nearBankPoint = new THREE.Vector3(0, 0.05, 5.25);
    this.farBankPoint = new THREE.Vector3(0.2, 0.08, -5.45);
    this.lastLandingCount = 0;
    this.build();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  build() {
    this.hemi = new THREE.HemisphereLight(0x7da8a1, 0x301d12, 1.7);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xf0c46f, 3.5);
    this.sun.position.set(-10, 14, 12);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -18;
    this.sun.shadow.camera.right = 18;
    this.sun.shadow.camera.top = 18;
    this.sun.shadow.camera.bottom = -12;
    this.scene.add(this.sun);
    this.riverLight = new THREE.PointLight(C.riverLight, 4.2, 15, 1.8);
    this.riverLight.position.set(0, 1.5, 0);
    this.scene.add(this.riverLight);

    this.buildRiver();
    this.buildBanks();
    this.buildForest();
    this.buildRiverDetails();
    this.buildActors();
    this.buildCrocodileInstances();
    this.buildCountRipples();
    this.buildFireflies();
  }

  buildRiver() {
    const geometry = new THREE.PlaneGeometry(34, 10.4, 64, 24);
    this.waterBase = Float32Array.from(geometry.attributes.position.array);
    this.water = mesh(geometry, mat(C.river, {
      roughness: 0.25,
      metalness: 0.12,
      transparent: true,
      opacity: 0.84,
      emissive: 0x07232a,
      emissiveIntensity: 0.45,
      side: THREE.DoubleSide,
    }), false, true);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = 0.03;
    this.scene.add(this.water);

    const underlay = mesh(new THREE.PlaneGeometry(35, 11), mat(0x071b22, { roughness: 1 }), false, false);
    underlay.rotation.x = -Math.PI / 2;
    underlay.position.y = -0.3;
    this.scene.add(underlay);
  }

  buildBanks() {
    const bankMaterial = mat(C.bank, { roughness: 1 });
    const wetMaterial = mat(C.bankWet, { roughness: 0.96 });
    [-1, 1].forEach((side) => {
      const bank = mesh(new THREE.BoxGeometry(36, 1.1, 8.5, 8, 1, 3), bankMaterial);
      bank.position.set(0, -0.45, side * 9.2);
      bank.rotation.y = side * 0.008;
      this.scene.add(bank);
      const wetEdge = mesh(new THREE.BoxGeometry(35, 0.32, 1.15), wetMaterial);
      wetEdge.position.set(0, -0.05, side * 5.22);
      wetEdge.rotation.z = side * 0.008;
      this.scene.add(wetEdge);
    });

    const stones = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.38, 0), mat(0x56645a), 72);
    for (let index = 0; index < 72; index += 1) {
      const side = index % 2 ? -1 : 1;
      const x = (seeded(index) - 0.5) * 30;
      const z = side * (4.9 + seeded(index + 80) * 4.8);
      this.dummy.position.set(x, 0.02 + seeded(index + 160) * 0.16, z);
      this.dummy.rotation.set(seeded(index + 20) * Math.PI, seeded(index + 40) * Math.PI, 0);
      const scale = 0.35 + seeded(index + 120) * 1.3;
      this.dummy.scale.set(scale * 1.5, scale * 0.62, scale);
      this.dummy.updateMatrix();
      stones.setMatrixAt(index, this.dummy.matrix);
    }
    finishInstances(stones);
    this.scene.add(stones);
  }

  buildForest() {
    const count = 48;
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.34, 1, 7), mat(0x3d2a20), count);
    const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat(C.mangrove), count * 3);
    for (let index = 0; index < count; index += 1) {
      const side = index % 2 ? -1 : 1;
      const x = (seeded(index) - 0.5) * 34;
      const z = side * (7.2 + seeded(index + 50) * 9.5);
      const height = 4.5 + seeded(index + 100) * 7;
      this.dummy.position.set(x, height / 2 - 0.05, z);
      this.dummy.rotation.set(0, seeded(index + 150) * Math.PI, (seeded(index + 200) - 0.5) * 0.09);
      this.dummy.scale.set(1, height, 1);
      this.dummy.updateMatrix();
      trunks.setMatrixAt(index, this.dummy.matrix);
      for (let layer = 0; layer < 3; layer += 1) {
        const scale = (height / 6.2) * (1.3 - layer * 0.18);
        this.dummy.position.set(
          x + (seeded(index + layer * 40) - 0.5) * 2.1,
          height * (0.62 + layer * 0.14),
          z + (seeded(index + layer * 70) - 0.5) * 1.7,
        );
        this.dummy.rotation.set(seeded(index + layer * 20) * Math.PI, seeded(index + layer * 90) * Math.PI, 0);
        this.dummy.scale.set(scale * 1.02, scale * 0.56, scale * 0.76);
        this.dummy.updateMatrix();
        crowns.setMatrixAt(index * 3 + layer, this.dummy.matrix);
      }
    }
    finishInstances(trunks);
    finishInstances(crowns);
    this.scene.add(trunks, crowns);

    const leafCount = 180;
    this.leafData = Array.from({ length: leafCount }, (_, index) => {
      const side = index % 2 ? -1 : 1;
      return {
        x: (seeded(index + 400) - 0.5) * 32,
        y: 2.5 + seeded(index + 460) * 7.5,
        z: side * (6.8 + seeded(index + 520) * 7.5),
        scale: 0.22 + seeded(index + 580) * 0.55,
        phase: seeded(index + 640) * Math.PI * 2,
      };
    });
    this.leaves = finishInstances(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.65, 1), mat(C.leafLight), leafCount), true);
    this.scene.add(this.leaves);
  }

  buildRiverDetails() {
    const reedCount = 150;
    this.reedData = Array.from({ length: reedCount }, (_, index) => ({
      x: (seeded(index + 700) - 0.5) * 33,
      z: (index % 2 ? -1 : 1) * (4.55 + seeded(index + 760) * 1.05),
      height: 0.45 + seeded(index + 820) * 1.45,
      phase: seeded(index + 880) * Math.PI * 2,
    }));
    this.reeds = finishInstances(new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.016, 0.032, 1, 5), mat(C.straw), reedCount,
    ), true);
    this.scene.add(this.reeds);

    const lotusCount = 34;
    this.lotusData = Array.from({ length: lotusCount }, (_, index) => ({
      x: (seeded(index + 940) - 0.5) * 27,
      z: (seeded(index + 980) - 0.5) * 8.2,
      scale: 0.25 + seeded(index + 1020) * 0.42,
      phase: seeded(index + 1060) * Math.PI * 2,
    }));
    this.lotus = finishInstances(new THREE.InstancedMesh(
      new THREE.CircleGeometry(1, 12, 0.18, Math.PI * 1.75), mat(C.jade, { side: THREE.DoubleSide }), lotusCount,
    ), true);
    this.scene.add(this.lotus);
  }

  buildActors() {
    this.kancil = createKancil();
    this.kancil.scale.setScalar(0.68);
    this.kancil.position.copy(this.nearBankPoint);
    this.scene.add(this.kancil);

    this.leadCroc = createLeadCrocodile();
    this.leadCroc.scale.setScalar(1.08);
    this.leadScatter = new THREE.Vector3(-0.9, 0.02, 2.05);
    this.leadCroc.position.copy(this.leadScatter);
    this.leadCroc.rotation.y = 0.14;
    this.scene.add(this.leadCroc);
  }

  buildCrocodileInstances() {
    const count = 7;
    this.crocodileData = Array.from({ length: count }, (_, index) => ({
      scatter: new THREE.Vector3(
        (seeded(index + 1110) - 0.5) * 8.5,
        -0.04 + seeded(index + 1140) * 0.12,
        -2.4 + seeded(index + 1170) * 5.6,
      ),
      line: this.crossingPoints[index + 1].clone().setY(0.13),
      yaw: (seeded(index + 1200) - 0.5) * 1.5,
      phase: seeded(index + 1230) * Math.PI * 2,
      scale: 0.82 + seeded(index + 1260) * 0.24,
    }));
    const hide = mat(C.crocodile, { emissive: 0x101b11, emissiveIntensity: 0.18 });
    const dark = mat(C.crocodileDark);
    const belly = mat(C.crocodileLight);
    this.crocBodies = finishInstances(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.7, 2), hide, count), true);
    this.crocHeads = finishInstances(new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1, 2, 1, 2), hide, count), true);
    this.crocJaws = finishInstances(new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), belly, count), true);
    this.crocTails = finishInstances(new THREE.InstancedMesh(new THREE.ConeGeometry(0.38, 2.0, 8), hide, count), true);
    this.crocEyes = finishInstances(new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.1, 8, 6), mat(C.eye, { emissive: 0x7d4b08, emissiveIntensity: 1.15 }), count * 2,
    ), true);
    this.crocScutes = finishInstances(new THREE.InstancedMesh(new THREE.ConeGeometry(0.12, 0.26, 4), dark, count * 4), true);
    this.scene.add(this.crocBodies, this.crocHeads, this.crocJaws, this.crocTails, this.crocEyes, this.crocScutes);
  }

  buildCountRipples() {
    const count = 24;
    const material = new THREE.MeshBasicMaterial({
      color: C.brass,
      transparent: true,
      opacity: 0.66,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.countRipples = finishInstances(new THREE.InstancedMesh(new THREE.RingGeometry(0.9, 1, 32), material, count), true);
    this.scene.add(this.countRipples);
  }

  buildFireflies() {
    const count = 90;
    this.fireflyData = Array.from({ length: count }, (_, index) => ({
      x: (seeded(index + 1300) - 0.5) * 30,
      y: 0.45 + seeded(index + 1360) * 5.5,
      z: (index % 2 ? -1 : 1) * (5.2 + seeded(index + 1420) * 7.8),
      phase: seeded(index + 1480) * Math.PI * 2,
      scale: 0.035 + seeded(index + 1540) * 0.055,
    }));
    this.fireflies = finishInstances(new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(1, 0),
      mat(C.brass, { emissive: C.brass, emissiveIntensity: 2, transparent: true, opacity: 0.72, depthWrite: false }),
      count,
    ), true);
    this.scene.add(this.fireflies);
  }

  updateWater(now, tension) {
    const position = this.water.geometry.attributes.position;
    for (let index = 0; index < position.count; index += 1) {
      const offset = index * 3;
      const x = this.waterBase[offset];
      const y = this.waterBase[offset + 1];
      const wave = Math.sin(x * 0.42 + now * 0.9) * 0.045 + Math.sin(y * 1.05 - now * 0.65) * 0.03;
      position.array[offset + 2] = wave * (1 + tension * 0.7);
    }
    position.needsUpdate = true;
    this.water.material.emissiveIntensity = 0.45 + tension * 0.16;
  }

  updateVegetation(now) {
    this.leafData.forEach((leaf, index) => {
      const sway = this.reducedMotion ? 0 : Math.sin(now * 0.48 + leaf.phase) * 0.075;
      this.dummy.position.set(leaf.x + sway, leaf.y, leaf.z);
      this.dummy.rotation.set(leaf.phase, now * 0.025 + leaf.phase, sway * 0.7);
      this.dummy.scale.set(leaf.scale * 0.94, leaf.scale * 0.36, leaf.scale * 0.68);
      this.dummy.updateMatrix();
      this.leaves.setMatrixAt(index, this.dummy.matrix);
    });
    this.leaves.instanceMatrix.needsUpdate = true;

    this.reedData.forEach((reed, index) => {
      const sway = this.reducedMotion ? 0 : Math.sin(now * 0.7 + reed.phase) * 0.08;
      this.dummy.position.set(reed.x, reed.height * 0.5 - 0.02, reed.z);
      this.dummy.rotation.set(sway, 0, sway * 0.55);
      this.dummy.scale.set(1, reed.height, 1);
      this.dummy.updateMatrix();
      this.reeds.setMatrixAt(index, this.dummy.matrix);
    });
    this.reeds.instanceMatrix.needsUpdate = true;

    this.lotusData.forEach((lotus, index) => {
      const bob = this.reducedMotion ? 0 : Math.sin(now * 0.9 + lotus.phase) * 0.025;
      this.dummy.position.set(lotus.x, 0.13 + bob, lotus.z);
      this.dummy.rotation.set(-Math.PI / 2, 0, lotus.phase + now * 0.015);
      this.dummy.scale.setScalar(lotus.scale);
      this.dummy.updateMatrix();
      this.lotus.setMatrixAt(index, this.dummy.matrix);
    });
    this.lotus.instanceMatrix.needsUpdate = true;
  }

  updateFireflies(now, escaped) {
    this.fireflyData.forEach((fly, index) => {
      const drift = this.reducedMotion ? 0 : Math.sin(now * 0.55 + fly.phase) * 0.18;
      this.dummy.position.set(fly.x + drift, fly.y + Math.sin(now * 0.72 + fly.phase) * 0.12, fly.z);
      const pulse = fly.scale * (0.7 + Math.sin(now * 2 + fly.phase) * 0.3) * (1 + escaped * 0.55);
      this.dummy.scale.setScalar(pulse);
      this.dummy.rotation.set(fly.phase, now * 0.2, 0);
      this.dummy.updateMatrix();
      this.fireflies.setMatrixAt(index, this.dummy.matrix);
    });
    this.fireflies.instanceMatrix.needsUpdate = true;
  }

  updateCrocodiles(now, index, progress, started) {
    const formation = !started || index < 7 ? 0 : index === 7 ? ease(progress) : 1;
    const closing = started && index >= 2 && index <= 6 ? (index === 2 ? ease(progress) : 1) : 0;
    const arguing = started && (index === 4 || index === 11);
    const dialogue = started && [2, 5, 10].includes(index);
    const leadTarget = this.crossingPoints[0].clone().setY(0.13);
    const leadClose = new THREE.Vector3(-0.5, 0.05, 3.3);
    const leadBase = this.leadScatter.clone().lerp(leadClose, closing * (1 - formation));
    leadBase.lerp(leadTarget, formation);
    if (arguing && !this.reducedMotion) leadBase.x += Math.sin(now * 2.8) * 0.22;
    this.leadCroc.position.lerp(leadBase, 0.16);
    this.leadCroc.rotation.y += ((formation ? 0 : 0.14 + Math.sin(now * 0.5) * 0.05) - this.leadCroc.rotation.y) * 0.1;
    this.leadCroc.position.y += this.reducedMotion ? 0 : Math.sin(now * 1.3) * 0.005;
    const jawOpen = dialogue ? Math.sin(clamp01(progress) * Math.PI) * 0.32 : arguing ? (0.08 + Math.sin(now * 4) * 0.06) : 0;
    this.leadCroc.userData.jaw.rotation.z = jawOpen;
    this.leadCroc.userData.headRig.rotation.z = started && index === 1 ? -ease(progress) * 0.08 : 0;

    this.crocodileData.forEach((croc, crocIndex) => {
      const closePoint = croc.scatter.clone();
      closePoint.x *= 0.62;
      closePoint.z = THREE.MathUtils.lerp(closePoint.z, 2.6 - crocIndex * 0.42, closing);
      const position = croc.scatter.clone().lerp(closePoint, closing * (1 - formation)).lerp(croc.line, formation);
      if (arguing && !this.reducedMotion) {
        position.x += Math.sin(now * (2.2 + crocIndex * 0.08) + croc.phase) * 0.38;
        position.z += Math.cos(now * 2.5 + croc.phase) * 0.18;
      }
      const bob = this.reducedMotion ? 0 : Math.sin(now * 1.25 + croc.phase) * 0.035;
      const yaw = THREE.MathUtils.lerp(croc.yaw, 0, formation) + (arguing ? Math.sin(now * 2.4 + croc.phase) * 0.28 : 0);
      const scale = croc.scale;

      this.dummy.position.set(position.x, position.y + 0.34 + bob, position.z);
      this.dummy.rotation.set(0, yaw, 0);
      this.dummy.scale.set(1.55 * scale, 0.52 * scale, 0.65 * scale);
      this.dummy.updateMatrix();
      this.crocBodies.setMatrixAt(crocIndex, this.dummy.matrix);

      this.dummy.position.set(position.x + Math.cos(yaw) * 1.15, position.y + 0.43 + bob, position.z - Math.sin(yaw) * 1.15);
      this.dummy.rotation.set(0, yaw, 0);
      this.dummy.scale.set(1.1 * scale, 0.4 * scale, 0.88 * scale);
      this.dummy.updateMatrix();
      this.crocHeads.setMatrixAt(crocIndex, this.dummy.matrix);

      const chatter = arguing ? 0.13 + Math.sin(now * 4.2 + croc.phase) * 0.08 : started && index === 9 ? 0.08 : 0;
      this.dummy.position.set(position.x + Math.cos(yaw) * 1.35, position.y + 0.21 - chatter * 0.15 + bob, position.z - Math.sin(yaw) * 1.35);
      this.dummy.rotation.set(0, yaw, chatter);
      this.dummy.scale.set(0.92 * scale, 0.16 * scale, 0.76 * scale);
      this.dummy.updateMatrix();
      this.crocJaws.setMatrixAt(crocIndex, this.dummy.matrix);

      this.dummy.position.set(position.x - Math.cos(yaw) * 1.62, position.y + 0.28 + bob, position.z + Math.sin(yaw) * 1.62);
      this.dummy.rotation.set(0, 0, Math.PI / 2);
      this.dummy.rotation.y = yaw;
      this.dummy.scale.set(scale, scale, scale);
      this.dummy.updateMatrix();
      this.crocTails.setMatrixAt(crocIndex, this.dummy.matrix);

      [-1, 1].forEach((side, eyeIndex) => {
        this.dummy.position.set(
          position.x + Math.cos(yaw) * 1.25 + Math.sin(yaw) * side * 0.34,
          position.y + 0.68 + bob,
          position.z - Math.sin(yaw) * 1.25 + Math.cos(yaw) * side * 0.34,
        );
        this.dummy.rotation.set(0, yaw, 0);
        this.dummy.scale.setScalar(scale);
        this.dummy.updateMatrix();
        this.crocEyes.setMatrixAt(crocIndex * 2 + eyeIndex, this.dummy.matrix);
      });

      for (let scuteIndex = 0; scuteIndex < 4; scuteIndex += 1) {
        const along = -0.78 + scuteIndex * 0.46;
        this.dummy.position.set(
          position.x + Math.cos(yaw) * along,
          position.y + 0.82 - Math.abs(scuteIndex - 1.5) * 0.04 + bob,
          position.z - Math.sin(yaw) * along,
        );
        this.dummy.rotation.set(0, yaw, Math.PI);
        this.dummy.scale.setScalar(scale);
        this.dummy.updateMatrix();
        this.crocScutes.setMatrixAt(crocIndex * 4 + scuteIndex, this.dummy.matrix);
      }
    });
    [this.crocBodies, this.crocHeads, this.crocJaws, this.crocTails, this.crocEyes, this.crocScutes]
      .forEach((instances) => { instances.instanceMatrix.needsUpdate = true; });
    return formation;
  }

  crossingPosition(steps) {
    if (steps <= 0) return this.nearBankPoint.clone();
    const whole = Math.floor(Math.min(steps, 8));
    const fraction = steps >= 8 ? 0 : steps - whole;
    const from = whole === 0 ? this.nearBankPoint : this.crossingPoints[whole - 1];
    const to = this.crossingPoints[Math.min(whole, 7)];
    const position = from.clone().lerp(to, ease(fraction));
    position.y += Math.sin(fraction * Math.PI) * 0.92;
    return position;
  }

  updateKancil(now, index, progress, started) {
    let steps = 0;
    if (started && index === 8) steps = progress * 4;
    else if (started && index === 9) steps = 4 + progress * 4;
    else if (started && index >= 10) steps = 8;
    let position = this.crossingPosition(steps);
    let escaping = 0;
    if (started && index === 10) {
      escaping = easeOut(progress);
      position = this.crossingPoints[7].clone().lerp(this.farBankPoint, escaping);
      position.y += Math.sin(progress * Math.PI) * 2.15;
      position.x += Math.sin(progress * Math.PI) * 0.42;
    } else if (started && index === 11) {
      const forestTarget = new THREE.Vector3(1.4, 0.08, -9.2);
      position = this.farBankPoint.clone().lerp(forestTarget, ease(progress));
      position.y += Math.abs(Math.sin(progress * Math.PI * 3)) * 0.22;
    } else if (!started || index < 8) {
      position = this.nearBankPoint.clone();
    }
    this.kancil.position.lerp(position, started && index >= 8 ? 0.42 : 0.16);
    this.kancil.rotation.y += ((started && index === 3 ? Math.sin(progress * Math.PI) * -0.42 : 0) - this.kancil.rotation.y) * 0.14;
    const hopPhase = (steps % 1) * Math.PI;
    const moving = started && ((index >= 8 && index <= 10) || index === 11);
    this.kancil.userData.legs.forEach((leg, legIndex) => {
      const stride = moving && !this.reducedMotion ? Math.sin(hopPhase + legIndex * Math.PI) * 0.55 : Math.sin(now * 1.5 + legIndex) * 0.025;
      leg.pivot.rotation.x = stride;
      leg.knee.rotation.x = Math.max(0, -stride) * 0.65;
    });
    const fear = started && index >= 1 && index <= 3 ? 1 : 0;
    const idea = started && index >= 3 && index <= 7 ? ease(index === 3 ? progress : 1) : 0;
    this.kancil.userData.headRig.rotation.x = fear * 0.08 - idea * 0.06 + (moving ? -0.08 : 0);
    this.kancil.userData.headRig.rotation.z = started && index === 6 ? Math.sin(progress * Math.PI) * -0.12 : 0;
    this.kancil.userData.ears.forEach((ear, earIndex) => {
      ear.rotation.x = -0.08 + fear * 0.42 + Math.sin(now * 1.1 + earIndex) * (this.reducedMotion ? 0 : 0.025);
      ear.rotation.z = (earIndex ? 1 : -1) * (0.22 + idea * 0.16);
    });
    this.kancil.userData.tail.rotation.x = (moving ? -0.42 : -0.08) + Math.sin(now * 2.1) * (this.reducedMotion ? 0 : 0.04);
    const heartbeat = fear && !this.reducedMotion ? 1 + Math.sin(now * 7.5) * 0.018 : 1;
    this.kancil.userData.chest.scale.set(0.72 * heartbeat, 0.98 * heartbeat, 0.72 * heartbeat);
    return { steps, escaping };
  }

  updateCountRipples(now, steps, index, progress) {
    const landed = Math.min(8, Math.floor(steps + 0.01));
    this.lastLandingCount = Math.max(this.lastLandingCount, landed);
    const visibility = index === 8 || index === 9 ? 1 : index === 10 ? 1 - ease(progress * 2) : 0;
    for (let index = 0; index < 24; index += 1) {
      const landing = Math.floor(index / 3);
      const ring = index % 3;
      const rawAge = steps - (landing + 0.78);
      const active = landing < landed && rawAge < 2.2;
      const age = active ? clamp01(rawAge * 0.68 + ring * 0.16) : 0;
      const fade = active ? clamp01(1 - Math.max(0, rawAge - 1.35) / 0.75) : 0;
      const point = this.crossingPoints[landing];
      this.dummy.position.set(point.x, 0.17 + ring * 0.006, point.z);
      this.dummy.rotation.set(-Math.PI / 2, 0, 0);
      const scale = active ? (0.18 + age * (1.05 + ring * 0.3)) * fade : 0.0001;
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.countRipples.setMatrixAt(index, this.dummy.matrix);
    }
    this.countRipples.instanceMatrix.needsUpdate = true;
    this.countRipples.material.opacity = visibility * (0.56 + Math.sin(now * 2.2) * 0.05);
  }

  updateCamera(now, dt, index, progress, started) {
    const pose = CAMERA_POSES[Math.min(index, CAMERA_POSES.length - 1)];
    const shotProgress = started ? ease(progress) : 0.08 + Math.sin(now * 0.07) * 0.012;
    this.desiredCamera.fromArray(pose.position).lerp(new THREE.Vector3(...pose.endPosition), shotProgress);
    this.cameraTarget.fromArray(pose.target).lerp(new THREE.Vector3(...pose.endTarget), shotProgress);
    if (!this.reducedMotion) {
      this.desiredCamera.x += Math.sin(now * 0.16 + index) * 0.028;
      this.desiredCamera.y += Math.sin(now * 0.12) * 0.022;
      if (started && index === 4) this.desiredCamera.x += Math.sin(progress * Math.PI * 2) * 0.28;
    }
    const positionEase = 1 - Math.exp(-dt * (started ? 2.75 : 1.5));
    this.camera.position.lerp(this.desiredCamera, positionEase);
    this.lookMatrix.lookAt(this.camera.position, this.cameraTarget, this.camera.up);
    this.targetQuaternion.setFromRotationMatrix(this.lookMatrix);
    this.camera.quaternion.slerp(this.targetQuaternion, 1 - Math.exp(-dt * 4.1));
    const desiredFov = THREE.MathUtils.lerp(pose.fov, pose.endFov, shotProgress);
    this.camera.fov += (desiredFov - this.camera.fov) * Math.min(1, dt * 3.2);
    this.camera.updateProjectionMatrix();
  }

  update(now, dt, state) {
    const started = state.started;
    const index = state.index ?? 0;
    const progress = state.localProgress ?? 0;
    const tension = started && index >= 1 && index <= 6 ? (index === 1 ? ease(progress) : 1) : 0;
    const escaped = started && index === 11 ? ease(progress) : 0;
    this.updateWater(now, tension);
    this.updateVegetation(now);
    this.updateFireflies(now, escaped);
    const formation = this.updateCrocodiles(now, index, progress, started);
    const kancilState = this.updateKancil(now, index, progress, started);
    this.updateCountRipples(now, kancilState.steps, index, progress);
    this.updateCamera(now, dt, index, progress, started);

    this.hemi.intensity = 1.7 + escaped * 0.65 - tension * 0.2;
    this.sun.intensity = 3.5 + escaped * 1.2 - tension * 0.45;
    this.riverLight.intensity = 4.2 + formation * 1.8 + escaped * 1.6;
    this.bloom.strength = 0.26 + formation * 0.14 + kancilState.escaping * 0.26;
    this.renderer.toneMappingExposure = 1.05 + escaped * 0.14 - tension * 0.04;
    this.scene.fog.density = 0.024 - escaped * 0.005;
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
