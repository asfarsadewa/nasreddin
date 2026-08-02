import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CAMERA_POSES } from './story.js';

const C = {
  night: 0x071311, fog: 0x0b1715, jade: 0x183c35, paleJade: 0x4e7d68,
  bronze: 0x9f6a31, brightBronze: 0xd2a65a, patina: 0x315f52, cinnabar: 0x9b3129,
  paper: 0xe8dfc4, wood: 0x3b241c, darkWood: 0x1c1514, stone: 0x6a7066,
  roof: 0x182522, skin: 0xb9825f, ink: 0x111515, moon: 0xffe1a0,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const seeded = (index) => { const x = Math.sin(index * 812.17) * 43758.5453; return x - Math.floor(x); };

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.03, flatShading: true, ...options });
}

function mesh(geometry, material, cast = true, receive = true) {
  const result = new THREE.Mesh(geometry, material);
  result.castShadow = cast;
  result.receiveShadow = receive;
  return result;
}

function createPerson({ robe = C.jade, trim = C.paper, hat = C.ink, simple = false } = {}) {
  const group = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.3, 0.54, 1.12, 8), mat(robe));
  body.position.y = 0.65;
  const belt = mesh(new THREE.CylinderGeometry(0.34, 0.35, 0.1, 8), mat(trim));
  belt.position.y = 0.92;
  const head = mesh(new THREE.IcosahedronGeometry(0.27, 2), mat(C.skin));
  head.position.y = 1.47;
  const hair = mesh(new THREE.SphereGeometry(0.278, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(hat));
  hair.position.y = 1.5;
  const cap = mesh(new THREE.CylinderGeometry(0.23, 0.28, 0.18, 8), mat(hat));
  cap.position.y = 1.73;
  const nose = mesh(new THREE.ConeGeometry(0.055, 0.18, 7), mat(C.skin));
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.44, 0.28);
  group.add(body, belt, head, hair, cap, nose);

  if (!simple) {
    [-0.085, 0.085].forEach((x) => {
      const eye = mesh(new THREE.SphereGeometry(0.022, 7, 5), mat(C.ink), false, false);
      eye.position.set(x, 1.53, 0.25);
      group.add(eye);
    });
  }

  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.34, 1.1, 0);
    const sleeve = mesh(new THREE.CylinderGeometry(0.065, 0.105, 0.58, 7), mat(robe));
    sleeve.position.y = -0.27;
    const hand = mesh(new THREE.IcosahedronGeometry(0.09, 1), mat(C.skin));
    hand.position.y = -0.59;
    pivot.add(sleeve, hand);
    group.add(pivot);
    return pivot;
  };

  group.userData = { body, head, leftArm: makeArm(-1), rightArm: makeArm(1) };
  return group;
}

function createRoof(width, depth) {
  const group = new THREE.Group();
  const roofMat = mat(C.roof);
  const slab = mesh(new THREE.BoxGeometry(width, 0.18, depth), roofMat, false, true);
  slab.rotation.z = 0.08;
  group.add(slab);
  [-1, 1].forEach((side) => {
    const tip = mesh(new THREE.CylinderGeometry(0.05, 0.07, depth + 0.35, 8), roofMat, false, true);
    tip.rotation.x = Math.PI / 2;
    tip.position.x = side * width * 0.49;
    tip.position.y = 0.06;
    group.add(tip);
  });
  return group;
}

export class StoryWorld {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.baseBackground = new THREE.Color(C.night);
    this.muffledBackground = new THREE.Color(0x101817);
    this.scene.background = this.baseBackground.clone();
    this.scene.fog = new THREE.FogExp2(C.fog, 0.028);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
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
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.65, 0.76);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraPath = new THREE.CatmullRomCurve3(CAMERA_POSES.map((pose) => new THREE.Vector3(...pose.position)), false, 'centripetal', 0.35);
    this.targetPath = new THREE.CatmullRomCurve3(CAMERA_POSES.map((pose) => new THREE.Vector3(...pose.target)), false, 'centripetal', 0.35);
    this.lookMatrix = new THREE.Matrix4();
    this.targetQuaternion = new THREE.Quaternion();
    this.muffle = 0;
    this.lastStateIndex = -1;
    this.build();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  build() {
    this.hemi = new THREE.HemisphereLight(0x5b7b75, 0x190d0a, 1.4);
    this.scene.add(this.hemi);
    const moonLight = new THREE.DirectionalLight(0xc5d5c9, 2.25);
    moonLight.position.set(7, 11, 8);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    moonLight.shadow.camera.left = -9;
    moonLight.shadow.camera.right = 9;
    moonLight.shadow.camera.top = 8;
    moonLight.shadow.camera.bottom = -6;
    this.scene.add(moonLight);
    this.lanternLight = new THREE.PointLight(0xff973e, 8, 8, 1.8);
    this.lanternLight.position.set(3.5, 2.2, -1.5);
    this.scene.add(this.lanternLight);

    this.buildSky();
    this.buildCourtyard();
    this.buildBell();
    this.buildThief();
    this.buildVillagers();
    this.buildRings();
    this.buildDust();
  }

  buildSky() {
    const stars = [];
    for (let i = 0; i < 320; i += 1) {
      const angle = seeded(i) * Math.PI * 2;
      const radius = 18 + seeded(i + 40) * 25;
      stars.push(Math.cos(angle) * radius, 7 + seeded(i + 90) * 18, Math.sin(angle) * radius - 10);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    this.stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xe6e5cf, size: 0.055, transparent: true, opacity: 0.55 }));
    this.scene.add(this.stars);
    const moon = mesh(new THREE.SphereGeometry(1.3, 32, 20), new THREE.MeshBasicMaterial({ color: C.moon }), false, false);
    moon.position.set(-11, 10, -19);
    this.scene.add(moon);
  }

  buildCourtyard() {
    const ground = mesh(new THREE.PlaneGeometry(30, 24), mat(C.stone, { roughness: 0.96 }), false, true);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.scene.add(ground);

    const jointMat = new THREE.LineBasicMaterial({ color: 0x303c36, transparent: true, opacity: 0.45 });
    for (let x = -10; x <= 10; x += 1.4) {
      const points = [new THREE.Vector3(x, 0.006, -7), new THREE.Vector3(x + 0.45, 0.006, 7)];
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), jointMat));
    }
    for (let z = -7; z <= 7; z += 1.2) {
      const points = [new THREE.Vector3(-10, 0.008, z), new THREE.Vector3(10, 0.008, z + 0.18)];
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), jointMat));
    }

    const wallMat = mat(0x9b927a, { roughness: 1 });
    const backWall = mesh(new THREE.BoxGeometry(18, 4.3, 0.45), wallMat, false, true);
    backWall.position.set(0, 2.15, -5.3);
    this.scene.add(backWall);
    const sideWall = mesh(new THREE.BoxGeometry(0.45, 4.3, 11), wallMat, false, true);
    sideWall.position.set(-7.7, 2.15, -0.1);
    this.scene.add(sideWall);

    const backRoof = createRoof(19, 1.3);
    backRoof.position.set(0, 4.45, -5.25);
    this.scene.add(backRoof);
    const sideRoof = createRoof(12, 1.3);
    sideRoof.rotation.y = Math.PI / 2;
    sideRoof.position.set(-7.65, 4.45, 0);
    this.scene.add(sideRoof);

    const gate = new THREE.Group();
    [-1, 1].forEach((side) => {
      const post = mesh(new THREE.BoxGeometry(0.42, 3.6, 0.42), mat(C.darkWood));
      post.position.set(side * 1.45, 1.8, 0);
      gate.add(post);
    });
    const lintel = mesh(new THREE.BoxGeometry(3.5, 0.45, 0.52), mat(C.darkWood));
    lintel.position.y = 3.35;
    gate.add(lintel);
    const gateRoof = createRoof(4.2, 1.15);
    gateRoof.position.y = 3.72;
    gate.add(gateRoof);
    gate.position.set(5.9, 0, -4.95);
    this.scene.add(gate);

    this.lanterns = [];
    [[-5.5, -4.8], [3.7, -4.8]].forEach(([x, z], index) => {
      const lantern = new THREE.Group();
      const body = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.56, 10), new THREE.MeshStandardMaterial({ color: C.cinnabar, emissive: 0x6a160e, emissiveIntensity: 1.5, roughness: 0.65 }));
      const capTop = mesh(new THREE.CylinderGeometry(0.15, 0.28, 0.08, 10), mat(C.darkWood));
      capTop.position.y = 0.32;
      const capBottom = capTop.clone();
      capBottom.position.y = -0.32;
      lantern.add(body, capTop, capBottom);
      lantern.position.set(x, 3.05, z);
      lantern.userData.phase = index * 2.1;
      this.lanterns.push(lantern);
      this.scene.add(lantern);
    });

    const bamboo = new THREE.Group();
    for (let i = 0; i < 8; i += 1) {
      const stalk = mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.5 + seeded(i) * 1.3, 7), mat(C.paleJade), false, true);
      stalk.position.set((i - 3.5) * 0.18, stalk.geometry.parameters.height / 2, seeded(i + 3) * 0.45);
      stalk.rotation.z = (seeded(i + 12) - 0.5) * 0.12;
      bamboo.add(stalk);
    }
    bamboo.position.set(-6.6, 0, -3.9);
    this.scene.add(bamboo);
  }

  buildBell() {
    this.bellRig = new THREE.Group();
    const woodMaterial = mat(C.wood, { roughness: 0.82 });
    [-1, 1].forEach((side) => {
      const post = mesh(new THREE.BoxGeometry(0.34, 3.65, 0.34), woodMaterial);
      post.position.set(side * 1.28, 1.82, 0);
      this.bellRig.add(post);
      const foot = mesh(new THREE.BoxGeometry(0.95, 0.2, 0.75), woodMaterial);
      foot.position.set(side * 1.28, 0.1, 0);
      this.bellRig.add(foot);
    });
    const beam = mesh(new THREE.BoxGeometry(3.25, 0.38, 0.44), woodMaterial);
    beam.position.y = 3.54;
    this.bellRig.add(beam);
    this.bellRig.position.set(-0.6, 0, -0.55);
    this.scene.add(this.bellRig);

    this.bell = new THREE.Group();
    const bellMaterial = mat(C.bronze, { metalness: 0.7, roughness: 0.34 });
    const shell = mesh(new THREE.CylinderGeometry(0.6, 0.82, 1.45, 12, 2, true), bellMaterial);
    shell.position.y = -0.14;
    const crown = mesh(new THREE.CylinderGeometry(0.38, 0.58, 0.35, 12), bellMaterial);
    crown.position.y = 0.72;
    const rim = mesh(new THREE.TorusGeometry(0.82, 0.085, 8, 24), bellMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.86;
    const clapper = mesh(new THREE.SphereGeometry(0.17, 10, 8), bellMaterial);
    clapper.position.y = -0.82;
    const clapperStem = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 7), bellMaterial);
    clapperStem.position.y = -0.35;
    const hanger = mesh(new THREE.TorusGeometry(0.18, 0.055, 8, 16), bellMaterial);
    hanger.position.y = 1.04;
    this.bell.add(shell, crown, rim, clapper, clapperStem, hanger);
    for (let row = 0; row < 3; row += 1) {
      for (let i = 0; i < 8; i += 1) {
        const stud = mesh(new THREE.SphereGeometry(0.055, 7, 5), mat(C.brightBronze, { metalness: 0.6, roughness: 0.4 }));
        const angle = (i / 8) * Math.PI * 2;
        const radius = 0.63 + row * 0.04;
        stud.position.set(Math.cos(angle) * radius, 0.42 - row * 0.42, Math.sin(angle) * radius);
        this.bell.add(stud);
      }
    }
    this.bell.position.set(-0.6, 2.38, -0.55);
    this.scene.add(this.bell);
  }

  buildThief() {
    this.thief = createPerson({ robe: 0x293f38, trim: C.cinnabar, hat: 0x161a17 });
    this.thief.position.set(1.55, 0, 0.75);
    this.thief.rotation.y = -0.6;
    this.scene.add(this.thief);
    this.thief.userData.leftArm.rotation.z = -0.16;
    this.thief.userData.rightArm.rotation.z = 0.2;

    this.mallet = new THREE.Group();
    const handle = mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.35, 8), mat(C.wood));
    const head = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 10), mat(0x393a36, { metalness: 0.55, roughness: 0.45 }));
    head.rotation.z = Math.PI / 2;
    head.position.y = 0.68;
    this.mallet.add(handle, head);
    this.mallet.position.set(1.0, 1.25, 0.45);
    this.mallet.rotation.z = -0.9;
    this.scene.add(this.mallet);
  }

  buildVillagers() {
    this.villagers = new THREE.Group();
    const colors = [0x6a3830, 0x3b4c51, 0x62563a];
    colors.forEach((robe, index) => {
      const person = createPerson({ robe, trim: index === 1 ? C.paper : C.patina, hat: C.ink, simple: true });
      person.scale.setScalar(0.9 + index * 0.04);
      person.position.set(index * 0.75, 0, Math.abs(index - 1) * 0.45);
      this.villagers.add(person);
    });
    this.villagers.position.set(8.7, 0, -3.4);
    this.villagers.rotation.y = -1.05;
    this.scene.add(this.villagers);
  }

  buildRings() {
    this.soundRings = [];
    for (let i = 0; i < 7; i += 1) {
      const ring = mesh(
        new THREE.TorusGeometry(0.75, 0.018, 6, 64),
        new THREE.MeshBasicMaterial({ color: C.brightBronze, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
        false, false,
      );
      ring.position.set(-0.6, 2.15, -0.5);
      ring.rotation.x = 0.08;
      ring.userData.offset = i / 7;
      this.soundRings.push(ring);
      this.scene.add(ring);
    }
  }

  buildDust() {
    const positions = [];
    for (let i = 0; i < 170; i += 1) positions.push((seeded(i) - 0.5) * 15, seeded(i + 200) * 5, (seeded(i + 400) - 0.5) * 11);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: C.paper, size: 0.032, transparent: true, opacity: 0.25, depthWrite: false }));
    this.scene.add(this.dust);
  }

  update(now, dt, state) {
    const started = state.started;
    const index = state.index ?? 0;
    const progress = state.localProgress ?? 0;
    const earsCovered = started && index >= 7 && index <= 9;
    this.muffle += ((earsCovered ? 1 : 0) - this.muffle) * Math.min(1, dt * 4.8);
    this.scene.background.copy(this.baseBackground).lerp(this.muffledBackground, this.muffle * 0.76);
    this.scene.fog.color.copy(new THREE.Color(C.fog)).lerp(this.muffledBackground, this.muffle * 0.8);
    this.bloom.strength = 0.42 - this.muffle * 0.19;
    this.renderer.toneMappingExposure = 1.05 - this.muffle * 0.18;

    let cameraProgress = started ? state.poseProgress : 0;
    if (!started) cameraProgress = clamp01(0.018 + Math.sin(now * 0.07) * 0.009);
    const position = this.cameraPath.getPointAt(clamp01(cameraProgress));
    const target = this.targetPath.getPointAt(clamp01(cameraProgress));
    if (!this.reducedMotion) {
      position.x += Math.sin(now * 0.17) * 0.055;
      position.y += Math.sin(now * 0.13 + 1) * 0.035;
    }
    this.camera.position.lerp(position, 1 - Math.exp(-dt * 2.2));
    this.lookMatrix.lookAt(this.camera.position, target, this.camera.up);
    this.targetQuaternion.setFromRotationMatrix(this.lookMatrix);
    this.camera.quaternion.slerp(this.targetQuaternion, 1 - Math.exp(-dt * 3));
    const poseIndex = Math.min(CAMERA_POSES.length - 1, index);
    this.camera.fov += (CAMERA_POSES[poseIndex].fov - this.camera.fov) * Math.min(1, dt * 2.2);
    this.camera.updateProjectionMatrix();

    const strain = started && index === 2 ? Math.sin(progress * Math.PI) : 0;
    this.thief.position.x = 1.55 - strain * 0.22;
    this.thief.rotation.z = -strain * 0.12;

    const cover = ease(clamp01((this.muffle - 0.05) / 0.8));
    const secondStrikeMode = started && index === 9;
    const rightEarCover = cover * (secondStrikeMode ? 1 - ease(clamp01(progress / 0.36)) : 1);
    this.thief.userData.leftArm.rotation.z = THREE.MathUtils.lerp(-0.16, 2.48, cover);
    this.thief.userData.rightArm.rotation.z = THREE.MathUtils.lerp(0.2, -2.48, rightEarCover);
    this.thief.userData.leftArm.rotation.x = cover * -0.24;
    this.thief.userData.rightArm.rotation.x = rightEarCover * -0.24;

    let hammerSwing = 0;
    if (started && index === 4) hammerSwing = ease(progress < 0.68 ? progress / 0.68 : (1 - progress) / 0.32);
    if (started && index === 9) hammerSwing = ease(progress < 0.56 ? progress / 0.56 : (1 - progress) / 0.44);
    this.mallet.rotation.z = THREE.MathUtils.lerp(-0.9, 0.75, hammerSwing);
    this.mallet.position.y = 1.25 + hammerSwing * 0.38;
    this.mallet.visible = cover < 0.88 || index === 9;

    const firstStrike = started && ((index === 4 && progress > 0.62) || index === 5);
    const secondStrike = started && index === 9 && progress > 0.48;
    const ringPhase = secondStrike ? clamp01((progress - 0.48) / 0.52) : firstStrike ? (index === 4 ? clamp01((progress - 0.62) / 0.38) : clamp01(progress * 0.8 + 0.2)) : -1;
    const bellImpulse = ringPhase >= 0 ? Math.exp(-ringPhase * 2.8) * Math.sin(ringPhase * Math.PI * 7) : 0;
    this.bell.rotation.z = bellImpulse * (secondStrike ? 0.17 : 0.12);
    this.soundRings.forEach((ring) => {
      const phase = ringPhase < 0 ? -1 : (ringPhase * 2.5 - ring.userData.offset + 1) % 1;
      const active = ringPhase >= 0 && ringPhase * 2.5 >= ring.userData.offset;
      const scale = 1 + Math.max(0, phase) * 8.5;
      ring.scale.setScalar(scale);
      ring.material.opacity = active ? Math.sin(Math.min(1, phase) * Math.PI) * 0.27 : 0;
    });

    const arrival = started ? ease(clamp01((index - 9 + progress) / 1.45)) : 0;
    this.villagers.visible = arrival > 0.005;
    this.villagers.position.x = THREE.MathUtils.lerp(8.7, 3.6, arrival);
    this.villagers.position.z = THREE.MathUtils.lerp(-3.4, -1.6, arrival);
    this.villagers.children.forEach((person, personIndex) => {
      person.position.y = arrival > 0 && arrival < 1 ? Math.abs(Math.sin(now * 6 + personIndex)) * 0.035 : 0;
    });

    this.lanterns.forEach((lantern) => { lantern.rotation.z = Math.sin(now * 0.7 + lantern.userData.phase) * 0.018; });
    this.lanternLight.intensity = 7.4 + Math.sin(now * 4.7) * 0.55;
    this.stars.rotation.y = now * 0.002;
    this.dust.rotation.y = now * 0.006;
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
