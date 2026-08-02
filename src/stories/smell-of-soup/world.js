import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CAMERA_POSES } from './story.js';

const C = {
  night: 0x080b17,
  deepBlue: 0x101b35,
  lapis: 0x17345c,
  stone: 0x6d6b69,
  paleStone: 0xb6aa91,
  copper: 0xc66f3f,
  saffron: 0xf0c46a,
  ivory: 0xf3ebd5,
  turquoise: 0x2d8f8a,
  wine: 0x7a3142,
  brown: 0x51362c,
  black: 0x111016,
};

const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (value) => Math.min(1, Math.max(0, value));

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.02, flatShading: true, ...options });
}

function makeMesh(geometry, mat, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function seeded(index) {
  const x = Math.sin(index * 999.83) * 43758.5453;
  return x - Math.floor(x);
}

function createCharacter({ robe, sash, turban = C.ivory, skin = 0xb98262, beard = null, simple = false }) {
  const group = new THREE.Group();
  const robeMesh = makeMesh(new THREE.CylinderGeometry(0.32, 0.58, 1.18, 8), material(robe));
  robeMesh.position.y = 0.68;
  group.add(robeMesh);

  const sashMesh = makeMesh(new THREE.CylinderGeometry(0.365, 0.37, 0.12, 8), material(sash));
  sashMesh.position.y = 0.94;
  group.add(sashMesh);

  const head = makeMesh(new THREE.IcosahedronGeometry(0.285, 2), material(skin));
  head.position.y = 1.53;
  group.add(head);

  const nose = makeMesh(new THREE.ConeGeometry(0.072, simple ? 0.15 : 0.23, 7), material(skin));
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.51, 0.3);
  group.add(nose);

  if (!simple) {
    [-0.09, 0.09].forEach((x) => {
      const eye = makeMesh(new THREE.SphereGeometry(0.026, 8, 6), material(C.black), false, false);
      eye.position.set(x, 1.59, 0.255);
      group.add(eye);
    });
  }

  if (beard) {
    const beardMesh = makeMesh(new THREE.ConeGeometry(0.21, 0.42, 7), material(beard));
    beardMesh.position.set(0, 1.31, 0.12);
    beardMesh.rotation.x = 0.08;
    group.add(beardMesh);
  }

  const turbanRing = makeMesh(new THREE.TorusGeometry(0.255, 0.082, 8, 18), material(turban));
  turbanRing.rotation.x = Math.PI / 2;
  turbanRing.position.y = 1.78;
  group.add(turbanRing);
  const turbanCap = makeMesh(new THREE.SphereGeometry(0.215, 12, 8), material(turban));
  turbanCap.scale.y = 0.63;
  turbanCap.position.y = 1.85;
  group.add(turbanCap);

  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.38, 1.09, 0);
    const sleeve = makeMesh(new THREE.CylinderGeometry(0.072, 0.105, 0.63, 7), material(robe));
    sleeve.position.y = -0.28;
    const hand = makeMesh(new THREE.IcosahedronGeometry(0.1, 1), material(skin));
    hand.position.y = -0.62;
    pivot.add(sleeve, hand);
    group.add(pivot);
    return { pivot, hand };
  };

  const left = makeArm(-1);
  const right = makeArm(1);
  group.userData = {
    robe: robeMesh,
    head,
    leftArm: left.pivot,
    leftHand: left.hand,
    rightArm: right.pivot,
    rightHand: right.hand,
  };
  return group;
}

function createBuilding(x, z, width, height, color, variant = 0) {
  const group = new THREE.Group();
  const block = makeMesh(new THREE.BoxGeometry(width, height, 1.8), material(color), false, true);
  block.position.y = height / 2;
  group.add(block);

  if (variant % 2 === 0) {
    const dome = makeMesh(
      new THREE.SphereGeometry(width * 0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      material(variant % 4 === 0 ? C.turquoise : C.paleStone),
      false,
      true,
    );
    dome.position.y = height;
    dome.scale.y = 0.72;
    group.add(dome);
  }

  const windowMat = new THREE.MeshBasicMaterial({ color: C.saffron, transparent: true, opacity: 0.38 });
  const windowCount = Math.max(1, Math.floor(width / 1.2));
  for (let i = 0; i < windowCount; i += 1) {
    const windowMesh = makeMesh(new THREE.PlaneGeometry(0.22, 0.42), windowMat, false, false);
    windowMesh.position.set((i - (windowCount - 1) / 2) * 0.68, height * 0.52, 0.906);
    group.add(windowMesh);
  }
  group.position.set(x, 0, z);
  return group;
}

export class StoryWorld {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.night);
    this.scene.fog = new THREE.FogExp2(C.night, 0.026);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(8.8, 4.5, 10.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.48, 0.7, 0.73);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraPath = new THREE.CatmullRomCurve3(
      CAMERA_POSES.map((pose) => new THREE.Vector3(...pose.position)),
      false,
      'centripetal',
      0.24,
    );
    this.targetPath = new THREE.CatmullRomCurve3(
      CAMERA_POSES.map((pose) => new THREE.Vector3(...pose.target)),
      false,
      'centripetal',
      0.24,
    );
    this.lookMatrix = new THREE.Matrix4();
    this.desiredQuaternion = new THREE.Quaternion();
    this.coinPulseStrength = 0;

    this.build();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  build() {
    const hemisphere = new THREE.HemisphereLight(0x536b98, 0x190f12, 1.35);
    this.scene.add(hemisphere);

    const moonLight = new THREE.DirectionalLight(0x9fb6ef, 2.1);
    moonLight.position.set(7, 11, 8);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    moonLight.shadow.camera.left = -9;
    moonLight.shadow.camera.right = 9;
    moonLight.shadow.camera.top = 8;
    moonLight.shadow.camera.bottom = -5;
    this.scene.add(moonLight);

    this.fireLight = new THREE.PointLight(C.copper, 14, 8, 1.8);
    this.fireLight.position.set(-0.72, 0.48, 0.48);
    this.scene.add(this.fireLight);

    this.buildSky();
    this.buildTown();
    this.buildMarket();
    this.buildCast();
    this.buildSteam();
    this.buildSoundRings();
  }

  buildSky() {
    const starGeometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < 380; i += 1) {
      const angle = seeded(i) * Math.PI * 2;
      const radius = 18 + seeded(i + 20) * 28;
      positions.push(Math.cos(angle) * radius, 6 + seeded(i + 70) * 20, Math.sin(angle) * radius - 12);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0xc9d8ff, size: 0.055, transparent: true, opacity: 0.72, sizeAttenuation: true }),
    );
    this.scene.add(stars);

    const moon = makeMesh(
      new THREE.SphereGeometry(1.25, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xe9dda9 }),
      false,
      false,
    );
    moon.position.set(-10, 10.5, -18);
    this.scene.add(moon);
  }

  buildTown() {
    const ground = makeMesh(new THREE.CircleGeometry(27, 72), material(0x171b25), false, true);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.015;
    this.scene.add(ground);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4a4150, transparent: true, opacity: 0.26 });
    for (let radius = 2.3; radius < 14; radius += 1.45) {
      const ring = makeMesh(new THREE.RingGeometry(radius, radius + 0.018, 96), ringMat, false, false);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.002;
      this.scene.add(ring);
    }

    const buildings = [
      [-8.7, -8.5, 4.2, 5.2, 0x333d51], [-4.7, -8.2, 3.4, 3.9, 0x635c5c],
      [-1.4, -8.9, 3.0, 5.7, 0x313d53], [2.0, -8.5, 3.7, 4.5, 0x6d655d],
      [5.7, -8.6, 3.1, 5.4, 0x39445a], [9.0, -8.3, 4.1, 4.2, 0x625b58],
    ];
    buildings.forEach((args, index) => this.scene.add(createBuilding(...args, index)));

    const minaret = new THREE.Group();
    const tower = makeMesh(new THREE.CylinderGeometry(0.24, 0.4, 7.3, 12), material(C.paleStone), false, true);
    tower.position.y = 3.65;
    const balcony = makeMesh(new THREE.CylinderGeometry(0.58, 0.58, 0.18, 16), material(C.paleStone), false, true);
    balcony.position.y = 5.65;
    const roof = makeMesh(new THREE.ConeGeometry(0.46, 1.7, 14), material(C.turquoise), false, true);
    roof.position.y = 8.1;
    minaret.add(tower, balcony, roof);
    minaret.position.set(5.8, 0, -10.1);
    this.scene.add(minaret);
  }

  buildMarket() {
    this.stall = new THREE.Group();
    const wood = material(0x39271f);
    [-1.15, 1.15].forEach((x) => {
      const post = makeMesh(new THREE.BoxGeometry(0.13, 2.7, 0.13), wood);
      post.position.set(x, 1.35, -0.3);
      this.stall.add(post);
    });
    const counter = makeMesh(new THREE.BoxGeometry(2.7, 0.15, 0.72), wood);
    counter.position.set(0, 0.88, -0.22);
    this.stall.add(counter);
    const canopy = makeMesh(new THREE.BoxGeometry(3.05, 0.1, 1.7), material(C.wine));
    canopy.position.set(0, 2.68, -0.22);
    canopy.rotation.z = -0.04;
    this.stall.add(canopy);
    for (let i = 0; i < 7; i += 1) {
      const stripe = makeMesh(new THREE.BoxGeometry(0.22, 0.018, 1.72), material(i % 2 ? C.saffron : C.ivory));
      stripe.position.set(-1.15 + i * 0.38, 2.742, -0.22);
      stripe.rotation.z = -0.04;
      this.stall.add(stripe);
    }
    this.stall.position.set(-1.42, 0, -1.15);
    this.scene.add(this.stall);

    const potMat = material(0x231f22, { metalness: 0.55, roughness: 0.35 });
    this.cauldron = new THREE.Group();
    const pot = makeMesh(new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0.64, Math.PI - 0.64), potMat);
    pot.scale.y = 0.72;
    const rim = makeMesh(new THREE.TorusGeometry(0.44, 0.055, 8, 22), potMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.25;
    const soup = makeMesh(
      new THREE.CircleGeometry(0.39, 24),
      new THREE.MeshBasicMaterial({ color: 0xb95e2f, transparent: true, opacity: 0.9 }),
      false,
      false,
    );
    soup.rotation.x = -Math.PI / 2;
    soup.position.y = 0.26;
    this.cauldron.add(pot, rim, soup);
    this.cauldron.position.set(-0.58, 0.62, 0.62);
    this.scene.add(this.cauldron);

    this.flames = [];
    for (let i = 0; i < 6; i += 1) {
      const flame = makeMesh(
        new THREE.ConeGeometry(0.09 + seeded(i) * 0.06, 0.42, 7),
        new THREE.MeshBasicMaterial({ color: i % 2 ? C.saffron : C.copper, transparent: true, opacity: 0.86 }),
        false,
        false,
      );
      flame.position.set(-0.82 + i * 0.1, 0.28, 0.57 + (seeded(i + 3) - 0.5) * 0.25);
      flame.rotation.z = (seeded(i + 9) - 0.5) * 0.25;
      this.scene.add(flame);
      this.flames.push(flame);
    }

    this.lanterns = [];
    [-2.32, -0.52].forEach((x) => {
      const lantern = makeMesh(
        new THREE.CylinderGeometry(0.12, 0.17, 0.36, 8),
        new THREE.MeshBasicMaterial({ color: C.saffron, transparent: true, opacity: 0.82 }),
        false,
        false,
      );
      lantern.position.set(x, 2.17, -0.92);
      this.scene.add(lantern);
      this.lanterns.push(lantern);
    });
  }

  buildCast() {
    this.cook = createCharacter({ robe: C.wine, sash: C.saffron, turban: 0xc9a363, skin: 0xa9684d, beard: C.black });
    this.cook.position.set(-1.55, 0, 0.02);

    this.traveler = createCharacter({ robe: C.brown, sash: 0x8f7458, turban: 0x8c8174, skin: 0xb97d5d, beard: 0x3c2b28 });
    this.traveler.position.set(2.8, 0, 0.55);

    this.hodja = createCharacter({ robe: C.turquoise, sash: C.copper, turban: C.ivory, skin: 0xb77e5d, beard: 0xe0ded5 });
    this.hodja.position.set(3.7, 0, 0.05);
    this.hodja.scale.setScalar(1.06);

    this.scene.add(this.cook, this.traveler, this.hodja);

    this.bread = makeMesh(new THREE.BoxGeometry(0.3, 0.075, 0.22), material(0xc99552));
    this.bread.position.set(0, -0.72, 0.1);
    this.bread.rotation.z = 0.18;
    this.traveler.userData.rightArm.add(this.bread);

    this.purse = makeMesh(new THREE.IcosahedronGeometry(0.14, 1), material(0x6d4535));
    this.purse.scale.set(0.82, 1.08, 0.72);
    this.scene.add(this.purse);

    this.crowd = new THREE.Group();
    const crowdPositions = [[-3.2, -0.25], [-2.55, -0.55], [2.55, -0.7], [3.15, -0.35], [-3.75, -0.85], [3.8, -0.82]];
    crowdPositions.forEach(([x, z], index) => {
      const person = createCharacter({
        robe: [0x243654, 0x6a3b49, 0x4c5c51][index % 3],
        sash: 0x745f4c,
        turban: [0x8e806b, 0xb5a783, 0x6d7a83][index % 3],
        skin: 0x9c684e,
        simple: true,
      });
      person.position.set(x, 0, z);
      person.scale.setScalar(0.88 + seeded(index) * 0.1);
      person.userData.baseY = 0;
      this.crowd.add(person);
    });
    this.crowd.scale.setScalar(0.001);
    this.scene.add(this.crowd);
  }

  buildSteam() {
    this.steam = [];
    for (let i = 0; i < 18; i += 1) {
      const steamMat = new THREE.MeshBasicMaterial({
        color: C.ivory,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const puff = makeMesh(new THREE.IcosahedronGeometry(0.18 + seeded(i) * 0.18, 1), steamMat, false, false);
      puff.userData.offset = seeded(i + 23);
      puff.userData.wobble = seeded(i + 59) * Math.PI * 2;
      this.scene.add(puff);
      this.steam.push(puff);
    }
  }

  buildSoundRings() {
    this.soundRings = [];
    for (let i = 0; i < 3; i += 1) {
      const ring = makeMesh(
        new THREE.TorusGeometry(0.22, 0.018, 6, 40),
        new THREE.MeshBasicMaterial({
          color: C.saffron,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
        false,
        false,
      );
      ring.position.set(-0.48, 1.77, 0.45 - i * 0.03);
      this.scene.add(ring);
      this.soundRings.push(ring);
    }
  }

  animateRig(character, targets, time, dt) {
    const rig = character.userData;
    const damping = 1 - Math.exp(-dt * 7.5);
    rig.leftArm.rotation.x += ((targets.leftX ?? 0) - rig.leftArm.rotation.x) * damping;
    rig.leftArm.rotation.z += ((targets.leftZ ?? 0) - rig.leftArm.rotation.z) * damping;
    rig.rightArm.rotation.x += ((targets.rightX ?? 0) - rig.rightArm.rotation.x) * damping;
    rig.rightArm.rotation.z += ((targets.rightZ ?? 0) - rig.rightArm.rotation.z) * damping;
    rig.head.rotation.y += ((targets.headY ?? 0) - rig.head.rotation.y) * damping;
    rig.robe.rotation.z += ((targets.lean ?? 0) - rig.robe.rotation.z) * damping;
    const breath = Math.sin(time * 1.7 + character.position.x) * 0.006;
    rig.robe.scale.y = 1 + breath;
  }

  update(time, dt, state) {
    const line = state.index ?? 0;
    const p = clamp01(state.localProgress ?? 0);
    const smooth = ease(p);

    this.fireLight.intensity = 13 + Math.sin(time * 11.3) * 1.6 + Math.sin(time * 17.1) * 0.7;
    this.flames.forEach((flame, index) => {
      flame.scale.y = 0.78 + Math.sin(time * (7.2 + index * 0.23) + index) * 0.2;
      flame.rotation.z += Math.sin(time * 3 + index) * 0.0015;
    });
    this.lanterns.forEach((lantern, index) => {
      lantern.material.opacity = 0.72 + Math.sin(time * 5.4 + index) * 0.08;
    });

    this.steam.forEach((puff) => {
      const cycle = (time * 0.13 + puff.userData.offset) % 1;
      puff.position.set(
        -0.58 + Math.sin(cycle * Math.PI * 3 + puff.userData.wobble) * (0.16 + cycle * 0.3),
        1.03 + cycle * 2.35,
        0.62 + Math.cos(cycle * Math.PI * 2 + puff.userData.wobble) * 0.12,
      );
      const scale = 0.48 + cycle * 1.75;
      puff.scale.setScalar(scale);
      puff.material.opacity = Math.sin(cycle * Math.PI) * 0.12;
      puff.rotation.y = cycle * 2.5;
    });

    const travelerX = line === 0 ? THREE.MathUtils.lerp(2.8, 0.28, smooth) : 0.28;
    this.traveler.position.x += (travelerX - this.traveler.position.x) * (1 - Math.exp(-dt * 4.5));
    const hodjaX = line < 4 ? 3.7 : line === 4 ? THREE.MathUtils.lerp(3.7, 1.08, smooth) : 1.08;
    this.hodja.position.x += (hodjaX - this.hodja.position.x) * (1 - Math.exp(-dt * 4.2));

    const crowdScale = line < 4 ? 0.001 : Math.max(0.001, line === 4 ? ease(p) : 1);
    const currentCrowdScale = this.crowd.scale.x + (crowdScale - this.crowd.scale.x) * (1 - Math.exp(-dt * 4));
    this.crowd.scale.setScalar(currentCrowdScale);

    const cookTargets = {};
    const travelerTargets = {};
    const hodjaTargets = {};
    if (line === 1) {
      travelerTargets.rightX = -1.15;
      travelerTargets.rightZ = -0.46;
      travelerTargets.lean = -0.07;
    }
    if (line === 2) {
      cookTargets.rightX = -1.25;
      cookTargets.rightZ = -0.68;
      cookTargets.headY = -0.28;
    }
    if (line === 3) {
      travelerTargets.leftX = -0.8;
      travelerTargets.leftZ = 0.42;
      travelerTargets.rightX = -0.55;
      travelerTargets.rightZ = -0.28;
    }
    if (line === 5) {
      hodjaTargets.leftX = -0.82;
      hodjaTargets.leftZ = 0.44;
      hodjaTargets.headY = -0.25;
    }
    if (line === 6) {
      cookTargets.leftX = -0.92;
      cookTargets.leftZ = 0.46;
      cookTargets.rightX = -0.75;
      cookTargets.rightZ = -0.35;
      cookTargets.lean = 0.05;
    }
    if (line === 7) {
      hodjaTargets.leftX = -1.08;
      hodjaTargets.leftZ = 0.7;
      travelerTargets.rightX = -0.75;
      travelerTargets.rightZ = -0.35;
    }
    if (line === 8) {
      hodjaTargets.leftX = -1.42;
      hodjaTargets.leftZ = 0.86;
      cookTargets.headY = -0.48;
    }
    if (line === 9) {
      cookTargets.rightX = -1.18;
      cookTargets.rightZ = -0.64;
    }
    if (line === 10) {
      hodjaTargets.rightX = -1.05;
      hodjaTargets.rightZ = -0.5;
      cookTargets.headY = -0.42;
    }
    if (line === 11) {
      hodjaTargets.leftX = -0.5;
      hodjaTargets.rightX = -0.5;
      cookTargets.lean = -0.13;
      travelerTargets.lean = 0.04;
      this.crowd.children.forEach((person, index) => {
        person.position.y = Math.max(0, Math.sin(time * 5.5 + index) * 0.035);
      });
    } else {
      this.crowd.children.forEach((person) => { person.position.y *= 0.9; });
    }

    this.animateRig(this.cook, cookTargets, time, dt);
    this.animateRig(this.traveler, travelerTargets, time, dt);
    this.animateRig(this.hodja, hodjaTargets, time, dt);

    const travelerPurse = new THREE.Vector3(this.traveler.position.x - 0.23, 0.92, 0.56);
    const hodjaPurse = new THREE.Vector3(this.hodja.position.x - 0.32, 1.02, 0.34);
    const earPurse = new THREE.Vector3(-0.64, 1.75, 0.4);
    let purseTarget = travelerPurse;
    if (line === 7) purseTarget = travelerPurse.clone().lerp(hodjaPurse, smooth);
    if (line > 7) purseTarget = hodjaPurse;
    if (line === 8) {
      const lift = ease(clamp01(p * 2.2));
      purseTarget = hodjaPurse.clone().lerp(earPurse, lift);
      if (p > 0.5) {
        purseTarget.y += Math.sin(time * 26) * 0.055;
        this.purse.rotation.z = Math.sin(time * 26) * 0.28;
      }
    }
    this.purse.position.lerp(purseTarget, 1 - Math.exp(-dt * 8));

    this.soundRings.forEach((ring, index) => {
      const pulseA = Math.max(0, 1 - Math.abs(p - (0.7 + index * 0.025)) * 11);
      const pulseB = Math.max(0, 1 - Math.abs(p - (0.86 + index * 0.025)) * 12);
      const pulse = line === 8 ? Math.max(pulseA, pulseB) : 0;
      const scale = 1 + (1 - pulse) * (1.1 + index * 0.55);
      ring.scale.setScalar(scale);
      ring.material.opacity = pulse * (0.62 - index * 0.12);
      ring.position.copy(earPurse);
      ring.position.z -= index * 0.025;
    });

    this.updateCamera(time, dt, state);
    this.composer.render();
  }

  updateCamera(time, dt, state) {
    let desiredPosition;
    let target;
    let desiredFov = 42;
    if (!state.started) {
      const orbit = time * 0.045;
      desiredPosition = new THREE.Vector3(8.8 + Math.sin(orbit) * 0.7, 4.5 + Math.sin(time * 0.12) * 0.15, 10.8 + Math.cos(orbit) * 0.45);
      target = new THREE.Vector3(-0.4, 1.3, -1.7);
    } else {
      const pathT = clamp01(state.poseProgress);
      desiredPosition = this.cameraPath.getPointAt(pathT);
      target = this.targetPath.getPointAt(pathT);
      const scaled = pathT * (CAMERA_POSES.length - 1);
      const from = Math.floor(scaled);
      const to = Math.min(CAMERA_POSES.length - 1, from + 1);
      desiredFov = THREE.MathUtils.lerp(CAMERA_POSES[from].fov, CAMERA_POSES[to].fov, ease(scaled - from));
    }

    if (!this.reducedMotion) {
      desiredPosition.x += Math.sin(time * 0.37) * 0.025;
      desiredPosition.y += Math.sin(time * 0.29) * 0.018;
      target.y += Math.sin(time * 0.31) * 0.009;
    }

    const cameraDamping = 1 - Math.exp(-dt * (state.started ? 3.1 : 1.2));
    this.camera.position.lerp(desiredPosition, cameraDamping);
    this.lookMatrix.lookAt(this.camera.position, target, this.camera.up);
    this.desiredQuaternion.setFromRotationMatrix(this.lookMatrix);
    this.camera.quaternion.slerp(this.desiredQuaternion, 1 - Math.exp(-dt * 4.8));
    this.camera.fov += (desiredFov - this.camera.fov) * (1 - Math.exp(-dt * 3.4));
    this.camera.updateProjectionMatrix();
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloom.resolution.set(width, height);
  }
}
