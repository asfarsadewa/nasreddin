import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CAMERA_POSES } from './story.js';

const C = {
  night: 0x07131b,
  fog: 0x0c2428,
  laterite: 0x8f3f28,
  earth: 0x4c2e24,
  gourd: 0xd89a43,
  gourdDark: 0x7a3e22,
  leaf: 0x1e493d,
  leafLight: 0x376a54,
  raffia: 0xd8c38e,
  wisdom: 0x51b7a6,
  wisdomGold: 0xf1bd59,
  bark: 0x3b2822,
  barkLight: 0x684133,
  eye: 0xf2d69b,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const easeOut = (value) => 1 - (1 - clamp01(value)) ** 3;
const seeded = (index) => { const x = Math.sin(index * 917.73 + 31.7) * 43758.5453; return x - Math.floor(x); };

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

function cylinderBetween(start, end, radius, material, sides = 8) {
  const direction = end.clone().sub(start);
  const result = mesh(new THREE.CylinderGeometry(radius, radius * 1.12, direction.length(), sides), material);
  result.position.copy(start).add(end).multiplyScalar(0.5);
  result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return result;
}

function syncSpiderLegs(spider) {
  const {
    legs, upperLegs, lowerLegs, upperOffset, lowerOffset, legMatrix,
  } = spider.userData;
  legs.forEach((leg, index) => {
    leg.pivot.updateMatrix();
    leg.knee.updateMatrix();
    legMatrix.copy(leg.pivot.matrix).multiply(upperOffset);
    upperLegs.setMatrixAt(index, legMatrix);
    legMatrix.copy(leg.pivot.matrix).multiply(leg.knee.matrix).multiply(lowerOffset);
    lowerLegs.setMatrixAt(index, legMatrix);
  });
  upperLegs.instanceMatrix.needsUpdate = true;
  lowerLegs.instanceMatrix.needsUpdate = true;
}

function createSpider({ small = false } = {}) {
  const group = new THREE.Group();
  const shell = mat(small ? 0x9a4336 : 0x553038, {
    emissive: small ? 0x40140f : 0x2a1118,
    emissiveIntensity: small ? 0.36 : 0.32,
  });
  const marking = mat(small ? 0xd66f3f : C.laterite, { emissive: 0x3b100a, emissiveIntensity: 0.24 });
  const abdomen = mesh(new THREE.IcosahedronGeometry(0.58, 2), shell);
  abdomen.scale.set(1.12, 0.78, 1.24);
  abdomen.position.set(0, 0.72, 0.2);
  const thorax = mesh(new THREE.IcosahedronGeometry(0.5, 2), shell);
  thorax.position.set(0, 0.75, -0.48);
  const head = mesh(new THREE.IcosahedronGeometry(0.39, 2), shell);
  head.position.set(0, 0.84, -0.96);
  const backMark = mesh(new THREE.TorusGeometry(0.255, 0.05, 7, 12), marking);
  backMark.rotation.x = Math.PI / 2;
  backMark.position.set(0, 1.18, 0.2);
  backMark.scale.y = 1.25;
  group.add(abdomen, thorax, head, backMark);

  const eyes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.1, 8, 6),
    mat(C.eye, { emissive: 0x9b6723, emissiveIntensity: 0.82 }),
    4,
  );
  const eyeDummy = new THREE.Object3D();
  [
    [-0.18, 0.94, -1.27, 1.15], [0.18, 0.94, -1.27, 1.15],
    [-0.08, 1.06, -1.23, 0.62], [0.08, 1.06, -1.23, 0.62],
  ].forEach(([x, y, z, scale], index) => {
    eyeDummy.position.set(x, y, z);
    eyeDummy.scale.set(scale, scale * 1.14, scale * 0.72);
    eyeDummy.updateMatrix();
    eyes.setMatrixAt(index, eyeDummy.matrix);
  });
  finishInstances(eyes);
  eyes.castShadow = false;
  eyes.receiveShadow = false;
  group.add(eyes);

  const upperLegs = finishInstances(new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.055, 0.075, 1.02, 7), shell, 8,
  ), true);
  const lowerLegs = finishInstances(new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.035, 0.052, 0.96, 7), shell, 8,
  ), true);
  const upperOffset = new THREE.Matrix4().makeTranslation(0, -0.49, 0);
  const lowerOffset = new THREE.Matrix4().makeTranslation(0, -0.46, 0);
  const legs = [];
  for (const side of [-1, 1]) {
    for (let legIndex = 0; legIndex < 4; legIndex += 1) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.28, 0.72, -0.45 + legIndex * 0.29);
      pivot.rotation.y = (legIndex - 1.5) * 0.18;
      pivot.rotation.z = side * (-1.02 - Math.abs(legIndex - 1.5) * 0.12);
      const knee = new THREE.Group();
      knee.position.y = -0.98;
      knee.rotation.z = side * 0.72;
      legs.push({
        pivot,
        knee,
        side,
        legIndex,
        basePivotZ: pivot.rotation.z,
        baseKneeZ: knee.rotation.z,
      });
    }
  }
  group.add(upperLegs, lowerLegs);

  group.userData = {
    abdomen,
    thorax,
    head,
    eyes,
    legs,
    shell,
    upperLegs,
    lowerLegs,
    upperOffset,
    lowerOffset,
    legMatrix: new THREE.Matrix4(),
  };
  syncSpiderLegs(group);
  if (small) group.scale.setScalar(0.64);
  return group;
}

function createGourd() {
  const group = new THREE.Group();
  const bodyMaterial = mat(C.gourd, { emissive: C.gourdDark, emissiveIntensity: 0.22 });
  const body = mesh(new THREE.SphereGeometry(0.72, 18, 12), bodyMaterial);
  body.scale.set(0.88, 1.18, 0.82);
  const shoulder = mesh(new THREE.SphereGeometry(0.45, 14, 10), bodyMaterial);
  shoulder.scale.set(0.9, 0.68, 0.86);
  shoulder.position.y = 0.62;
  const neck = mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.52, 10), bodyMaterial);
  neck.position.y = 1.0;
  const lip = mesh(new THREE.TorusGeometry(0.23, 0.055, 7, 14), mat(C.raffia));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 1.27;
  const glow = new THREE.PointLight(C.wisdomGold, 4.2, 5.5, 1.7);
  glow.position.y = 0.35;
  group.add(body, shoulder, neck, lip, glow);
  group.userData = { body, shoulder, neck, lip, glow, bodyMaterial };
  return group;
}

export class StoryWorld {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.night);
    this.scene.fog = new THREE.FogExp2(C.fog, 0.026);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.camera.position.fromArray(CAMERA_POSES[0].position);

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
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.7, 0.8);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraPath = new THREE.CatmullRomCurve3(CAMERA_POSES.map((pose) => new THREE.Vector3(...pose.position)), false, 'centripetal', 0.34);
    this.targetPath = new THREE.CatmullRomCurve3(CAMERA_POSES.map((pose) => new THREE.Vector3(...pose.target)), false, 'centripetal', 0.34);
    this.lookMatrix = new THREE.Matrix4();
    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();
    this.gourdPosition = new THREE.Vector3(-0.72, 1.24, 1.68);
    this.wisdomRelease = 0;
    this.build();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  build() {
    this.hemi = new THREE.HemisphereLight(0x6e9ca0, 0x32170f, 1.65);
    this.scene.add(this.hemi);
    this.sunLight = new THREE.DirectionalLight(0xf1c174, 2.8);
    this.sunLight.position.set(8, 12, 8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -13;
    this.sunLight.shadow.camera.right = 13;
    this.sunLight.shadow.camera.top = 13;
    this.sunLight.shadow.camera.bottom = -7;
    this.scene.add(this.sunLight);
    this.wisdomLight = new THREE.PointLight(C.wisdom, 4.5, 11, 1.8);
    this.wisdomLight.position.set(-0.3, 2.2, 1.2);
    this.scene.add(this.wisdomLight);

    this.buildGround();
    this.buildForest();
    this.buildTree();
    this.buildActors();
    this.buildWisdom();
    this.buildWeb();
    this.buildDust();
  }

  buildGround() {
    const ground = mesh(new THREE.CircleGeometry(24, 72), mat(C.earth, { roughness: 1 }), false, true);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    this.scene.add(ground);

    const seedCount = 130;
    const seeds = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.055, 0), mat(C.raffia), seedCount);
    for (let index = 0; index < seedCount; index += 1) {
      const angle = seeded(index) * Math.PI * 2;
      const radius = 2.2 + seeded(index + 40) * 17;
      this.dummy.position.set(Math.cos(angle) * radius, 0.02 + seeded(index + 80) * 0.03, Math.sin(angle) * radius);
      this.dummy.rotation.set(seeded(index + 120) * Math.PI, angle, seeded(index + 160) * Math.PI);
      const scale = 0.45 + seeded(index + 200) * 0.85;
      this.dummy.scale.set(scale * 0.7, scale, scale * 1.4);
      this.dummy.updateMatrix();
      seeds.setMatrixAt(index, this.dummy.matrix);
    }
    finishInstances(seeds);
    this.scene.add(seeds);
  }

  buildForest() {
    const trunkCount = 34;
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.28, 1, 7), mat(C.bark), trunkCount);
    const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat(C.leaf), trunkCount * 2);
    for (let index = 0; index < trunkCount; index += 1) {
      const angle = (index / trunkCount) * Math.PI * 2 + seeded(index) * 0.2;
      const radius = 10 + seeded(index + 30) * 13;
      const height = 4 + seeded(index + 60) * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius - 2;
      this.dummy.position.set(x, height / 2, z);
      this.dummy.rotation.set(0, angle, (seeded(index + 90) - 0.5) * 0.12);
      this.dummy.scale.set(1, height, 1);
      this.dummy.updateMatrix();
      trunks.setMatrixAt(index, this.dummy.matrix);
      for (let layer = 0; layer < 2; layer += 1) {
        const scale = (height / 5.5) * (layer === 0 ? 1.4 : 1.02);
        this.dummy.position.set(x, height * (0.68 + layer * 0.18), z);
        this.dummy.rotation.set(seeded(index + layer * 120) * Math.PI, angle, 0);
        this.dummy.scale.set(scale * 1.35, scale * 0.62, scale);
        this.dummy.updateMatrix();
        crowns.setMatrixAt(index * 2 + layer, this.dummy.matrix);
      }
    }
    finishInstances(trunks);
    finishInstances(crowns);
    this.scene.add(trunks, crowns);
  }

  buildTree() {
    const barkMaterial = mat(C.barkLight, { roughness: 1 });
    this.trunk = mesh(new THREE.CylinderGeometry(0.78, 1.25, 9.8, 11), barkMaterial);
    this.trunk.position.y = 4.85;
    this.trunk.scale.z = 0.84;
    this.scene.add(this.trunk);

    const rootEnds = [
      [-4.2, 0, 1.5], [3.9, 0, 1.8], [-2.8, 0, -3.1], [3.2, 0, -3.5], [0.2, 0, 4.2],
    ];
    rootEnds.forEach(([x, y, z], index) => {
      const root = cylinderBetween(new THREE.Vector3((x / 5) * 0.55, 0.34, (z / 5) * 0.55), new THREE.Vector3(x, y, z), 0.19 + index * 0.012, barkMaterial, 8);
      root.scale.y = 1;
      this.scene.add(root);
    });

    const branches = [
      [[0, 7.0, 0], [-4.6, 8.2, 0.5]], [[0, 7.35, 0], [4.9, 8.7, -0.3]],
      [[0, 8.15, 0], [-3.0, 10.2, -1.8]], [[0, 8.45, 0], [3.5, 10.4, 1.6]],
      [[0, 6.65, 0], [2.8, 7.4, 2.7]], [[0, 7.75, 0], [-2.4, 8.8, 3.0]],
    ];
    branches.forEach(([start, end], index) => {
      this.scene.add(cylinderBetween(new THREE.Vector3(...start), new THREE.Vector3(...end), 0.22 - index * 0.012, barkMaterial, 8));
    });

    const leafCount = 170;
    this.leafData = Array.from({ length: leafCount }, (_, index) => {
      const branch = branches[index % branches.length][1];
      return {
        x: branch[0] + (seeded(index) - 0.5) * 4.2,
        y: branch[1] + (seeded(index + 50) - 0.35) * 3.0,
        z: branch[2] + (seeded(index + 100) - 0.5) * 3.8,
        scale: 0.42 + seeded(index + 150) * 0.72,
        phase: seeded(index + 200) * Math.PI * 2,
      };
    });
    this.leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.62, 1), mat(C.leafLight), leafCount);
    this.updateLeaves(0);
    finishInstances(this.leaves, true);
    this.scene.add(this.leaves);
  }

  buildActors() {
    this.anansi = createSpider();
    this.anansi.position.set(-0.35, 0.12, 1.02);
    this.anansi.rotation.x = -0.08;
    this.anansi.scale.setScalar(1.08);
    this.scene.add(this.anansi);

    this.ntikuma = createSpider({ small: true });
    this.ntikuma.position.set(2.15, 0.1, 1.55);
    this.ntikuma.rotation.y = 1.15;
    this.ntikuma.visible = false;
    this.scene.add(this.ntikuma);

    this.gourd = createGourd();
    this.gourd.scale.setScalar(0.52);
    this.gourd.position.copy(this.gourdPosition);
    this.scene.add(this.gourd);

    const ropeMaterial = new THREE.LineBasicMaterial({ color: C.raffia, transparent: true, opacity: 0.74 });
    const ropeGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.85, 1.0, 0), new THREE.Vector3(-0.4, 1.65, 0),
      new THREE.Vector3(0.4, 1.65, 0), new THREE.Vector3(0.85, 1.0, 0),
    ]);
    this.rope = new THREE.Line(ropeGeometry, ropeMaterial);
    this.rope.scale.setScalar(0.68);
    this.scene.add(this.rope);

    this.shards = new THREE.Group();
    for (let index = 0; index < 6; index += 1) {
      const shard = mesh(new THREE.TetrahedronGeometry(0.18 + seeded(index) * 0.16, 0), mat(index % 2 ? C.gourd : C.gourdDark));
      shard.visible = false;
      this.shards.add(shard);
    }
    this.scene.add(this.shards);
  }

  buildWisdom() {
    const count = 96;
    this.wisdomData = Array.from({ length: count }, (_, index) => {
      const angle = seeded(index) * Math.PI * 2;
      const radius = 3 + seeded(index + 40) * 12;
      return {
        origin: new THREE.Vector3(Math.cos(angle) * radius, 0.3 + seeded(index + 80) * 5.4, Math.sin(angle) * radius - 1.2),
        scatter: new THREE.Vector3((seeded(index + 120) - 0.5) * 26, 0.35 + seeded(index + 160) * 9.5, (seeded(index + 200) - 0.5) * 20 - 1),
        angle,
        radius: 0.06 + seeded(index + 240) * 0.24,
        phase: seeded(index + 280) * Math.PI * 2,
        scale: 0.07 + seeded(index + 320) * 0.09,
      };
    });
    const material = mat(0xffffff, {
      emissive: 0x173e38,
      emissiveIntensity: 1.4,
      roughness: 0.42,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.wisdom = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), material, count);
    for (let index = 0; index < count; index += 1) {
      const color = new THREE.Color(index % 3 === 0 ? C.wisdomGold : index % 3 === 1 ? C.wisdom : C.raffia);
      this.wisdom.setColorAt(index, color);
    }
    if (this.wisdom.instanceColor) this.wisdom.instanceColor.needsUpdate = true;
    finishInstances(this.wisdom, true);
    this.scene.add(this.wisdom);
  }

  buildWeb() {
    const points = [];
    const center = new THREE.Vector3(0, 2.4, 0);
    for (let index = 0; index < 22; index += 1) {
      const angle = (index / 22) * Math.PI * 2;
      const radius = 8 + (index % 4) * 2.1;
      points.push(center.x, center.y, center.z, Math.cos(angle) * radius, 0.6 + (index % 5) * 1.25, Math.sin(angle) * radius - 1);
    }
    for (let ring = 1; ring <= 4; ring += 1) {
      const radius = ring * 2.2;
      for (let index = 0; index < 22; index += 1) {
        const a = (index / 22) * Math.PI * 2;
        const b = ((index + 1) / 22) * Math.PI * 2;
        points.push(
          Math.cos(a) * radius, 2.4 + Math.sin(a * 2) * ring * 0.18, Math.sin(a) * radius - 0.4,
          Math.cos(b) * radius, 2.4 + Math.sin(b * 2) * ring * 0.18, Math.sin(b) * radius - 0.4,
        );
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    this.webMaterial = new THREE.LineBasicMaterial({ color: C.wisdom, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.web = new THREE.LineSegments(geometry, this.webMaterial);
    this.scene.add(this.web);
  }

  buildDust() {
    const positions = [];
    for (let index = 0; index < 220; index += 1) {
      positions.push((seeded(index) - 0.5) * 24, 0.2 + seeded(index + 80) * 10, (seeded(index + 160) - 0.5) * 21 - 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.dust = new THREE.Points(geometry, new THREE.PointsMaterial({ color: C.raffia, size: 0.035, transparent: true, opacity: 0.19, depthWrite: false }));
    this.scene.add(this.dust);
  }

  updateLeaves(now) {
    this.leafData.forEach((leaf, index) => {
      const drift = this.reducedMotion ? 0 : Math.sin(now * 0.55 + leaf.phase) * 0.055;
      this.dummy.position.set(leaf.x + drift, leaf.y, leaf.z);
      this.dummy.rotation.set(leaf.phase, now * 0.04 + leaf.phase, drift * 0.8);
      this.dummy.scale.set(leaf.scale * 1.5, leaf.scale * 0.58, leaf.scale);
      this.dummy.updateMatrix();
      this.leaves.setMatrixAt(index, this.dummy.matrix);
    });
    this.leaves.instanceMatrix.needsUpdate = true;
  }

  updateActors(now, index, progress, started) {
    let climb = 0;
    if (started && index === 4) climb = Math.sin(progress * Math.PI) * 1.75;
    else if (started && index === 5) climb = Math.abs(Math.sin(progress * Math.PI * 3)) * 1.95;
    else if (started && index >= 6 && index <= 8) climb = index === 8 ? Math.sin(progress * Math.PI) * 1.55 : 0.18;
    else if (started && index === 9) climb = THREE.MathUtils.lerp(0.18, 5.9, ease(progress));
    else if (started && index >= 10) climb = 5.9;

    this.anansi.position.set(-0.35, 0.12 + climb, 1.02);
    this.anansi.rotation.x = climb > 0.35 ? -0.25 : -0.08;
    this.anansi.rotation.z = started && index === 8 ? Math.sin(progress * Math.PI) * -0.16 : 0;
    let conversationTurn = 0;
    if (started && index <= 2) conversationTurn = -2.15;
    else if (started && index === 3) conversationTurn = THREE.MathUtils.lerp(-2.15, 0, ease(progress));
    else if (started && index === 5) conversationTurn = THREE.MathUtils.lerp(0, -1.08, ease((progress - 0.58) / 0.42));
    else if (started && index >= 6 && index <= 7) conversationTurn = -1.08;
    else if (started && index === 8) conversationTurn = THREE.MathUtils.lerp(-1.08, 0, ease(progress));
    this.anansi.rotation.y = conversationTurn;
    const crawl = climb > 0.35 && !this.reducedMotion ? now * (index === 9 ? 11 : 7) : 0;
    this.anansi.userData.legs.forEach((leg, legIndex) => {
      const phase = Math.sin(crawl + legIndex * 1.7) * (climb > 0.35 ? 0.24 : 0.035);
      leg.pivot.rotation.z = leg.basePivotZ + phase;
      leg.knee.rotation.z = leg.baseKneeZ - leg.side * phase * 0.6;
    });
    syncSpiderLegs(this.anansi);

    const turn = started && index === 8 ? ease(progress) : started && index >= 9 ? 1 : 0;
    const front = new THREE.Vector3(-0.72, 1.24 + climb, 1.68);
    const back = new THREE.Vector3(-0.18, 1.35 + climb, 0.22);
    this.gourdPosition.copy(front).lerp(back, turn);
    let throwProgress = 0;
    if (started && index === 11) {
      throwProgress = clamp01((progress - 0.08) / 0.36);
      const thrown = new THREE.Vector3(1.45, 0.42, 1.55);
      this.gourdPosition.lerp(thrown, easeOut(throwProgress));
    }
    this.gourd.position.copy(this.gourdPosition);
    this.gourd.rotation.set(0.05 + throwProgress * 1.8, turn * Math.PI, -0.05 - throwProgress * 1.4);
    const intact = throwProgress < 0.78;
    this.gourd.visible = intact;
    this.gourd.userData.glow.intensity = 4.2 + Math.sin(now * 2.2) * 0.8 + (started && index === 10 ? 2.5 : 0);
    this.wisdomLight.position.copy(this.gourdPosition);

    this.rope.visible = intact && (!started || index >= 3);
    this.rope.position.set(THREE.MathUtils.lerp(-0.58, -0.34, turn), 0.5 + climb, turn ? 0.08 : 0.92);
    this.rope.rotation.y = turn * Math.PI;

    const showChild = started && index >= 5;
    this.ntikuma.visible = showChild;
    if (showChild) {
      const arrival = index === 5 ? ease((progress - 0.28) / 0.5) : 1;
      this.ntikuma.position.x = THREE.MathUtils.lerp(3.35, 2.15, arrival);
      this.ntikuma.position.y = 0.1 + Math.sin(now * 2.1) * (this.reducedMotion ? 0 : 0.015);
      this.ntikuma.position.z = THREE.MathUtils.lerp(2.85, 1.55, arrival);
      this.ntikuma.rotation.y = index >= 9 ? 0.55 : 1.15;
      const pointing = index === 6 ? ease(progress) : index >= 7 && index <= 8 ? 1 - progress * 0.35 : 0;
      this.ntikuma.userData.legs.forEach((leg, legIndex) => {
        const idle = this.reducedMotion ? 0 : Math.sin(now * 1.8 + legIndex * 0.9) * 0.018;
        leg.pivot.rotation.z = leg.basePivotZ + idle;
        leg.knee.rotation.z = leg.baseKneeZ - leg.side * idle * 0.4;
      });
      const pointingLeg = this.ntikuma.userData.legs[4];
      pointingLeg.pivot.rotation.z = pointingLeg.basePivotZ - pointing * 0.78;
      pointingLeg.knee.rotation.z = pointingLeg.baseKneeZ + pointing * 0.28;
      syncSpiderLegs(this.ntikuma);
    }

    this.shards.visible = !intact;
    this.shards.position.copy(this.gourdPosition);
    if (!intact) {
      const burst = easeOut((throwProgress - 0.78) / 0.22);
      this.shards.children.forEach((shard, shardIndex) => {
        shard.visible = true;
        const angle = (shardIndex / this.shards.children.length) * Math.PI * 2;
        shard.position.set(Math.cos(angle) * burst * 1.1, Math.sin(angle * 1.7) * burst * 0.8, Math.sin(angle) * burst * 0.9);
        shard.rotation.set(now * (0.8 + shardIndex * 0.1), angle, now * 0.6);
      });
    } else {
      this.shards.children.forEach((shard) => { shard.visible = false; });
    }
  }

  updateWisdom(now, index, progress, started) {
    const gathering = started && index === 0 ? ease(progress) : started && index > 0 ? 1 : 0.18;
    const releaseTarget = started && index === 11 ? ease(clamp01((progress - 0.14) / 0.72)) : 0;
    this.wisdomRelease += (releaseTarget - this.wisdomRelease) * 0.12;
    this.webMaterial.opacity = this.wisdomRelease * 0.34;
    this.web.rotation.y = this.reducedMotion ? 0 : now * 0.004;

    this.wisdomData.forEach((piece, pieceIndex) => {
      const orbitAngle = piece.angle + now * (0.42 + (pieceIndex % 5) * 0.025);
      const contained = new THREE.Vector3(
        this.gourdPosition.x + Math.cos(orbitAngle) * piece.radius,
        this.gourdPosition.y + Math.sin(orbitAngle * 1.4) * piece.radius * 0.9,
        this.gourdPosition.z + Math.sin(orbitAngle) * piece.radius,
      );
      const gathered = piece.origin.clone().lerp(contained, gathering);
      const released = gathered.clone().lerp(piece.scatter, this.wisdomRelease);
      if (this.wisdomRelease > 0) released.y += Math.sin(now * 0.8 + piece.phase) * 0.12 * this.wisdomRelease;
      this.dummy.position.copy(released);
      this.dummy.rotation.set(now * 0.35 + piece.phase, orbitAngle, now * 0.2);
      const pulse = 1 + Math.sin(now * 2.4 + piece.phase) * 0.16;
      const scale = piece.scale * pulse * (0.72 + this.wisdomRelease * 0.6);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.wisdom.setMatrixAt(pieceIndex, this.dummy.matrix);
    });
    this.wisdom.instanceMatrix.needsUpdate = true;
    this.wisdom.material.opacity = 0.6 + gathering * 0.3;
  }

  update(now, dt, state) {
    const started = state.started;
    const index = state.index ?? 0;
    const progress = state.localProgress ?? 0;
    this.updateActors(now, index, progress, started);
    this.updateWisdom(now, index, progress, started);
    this.updateLeaves(now);

    let cameraProgress = started
      ? (index + ease((progress - 0.58) / 0.42)) / (CAMERA_POSES.length - 1)
      : 0;
    if (!started) cameraProgress = clamp01(0.01 + Math.sin(now * 0.05) * 0.006);
    const position = this.cameraPath.getPoint(clamp01(cameraProgress));
    const target = this.targetPath.getPoint(clamp01(cameraProgress));
    if (!this.reducedMotion) {
      position.x += Math.sin(now * 0.12) * 0.045;
      position.y += Math.sin(now * 0.1 + 1) * 0.032;
      if (started && index === 11) position.x += Math.sin(now * 5.5) * 0.025 * (1 - progress);
    }
    this.camera.position.lerp(position, 1 - Math.exp(-dt * 2.25));
    this.lookMatrix.lookAt(this.camera.position, target, this.camera.up);
    this.targetQuaternion.setFromRotationMatrix(this.lookMatrix);
    this.camera.quaternion.slerp(this.targetQuaternion, 1 - Math.exp(-dt * 3.15));
    const poseIndex = Math.min(CAMERA_POSES.length - 1, index);
    this.camera.fov += (CAMERA_POSES[poseIndex].fov - this.camera.fov) * Math.min(1, dt * 2.3);
    this.camera.updateProjectionMatrix();

    const release = this.wisdomRelease;
    this.hemi.intensity = 1.65 + release * 0.9;
    this.sunLight.intensity = 2.8 + release * 1.2;
    this.wisdomLight.intensity = 4.5 + release * 5.5;
    this.bloom.strength = 0.38 + release * 0.42 + (started && index === 1 ? progress * 0.12 : 0);
    this.renderer.toneMappingExposure = 1.03 + release * 0.14;
    this.dust.rotation.y = now * 0.003;
    this.dust.position.y = Math.sin(now * 0.18) * 0.07;
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
