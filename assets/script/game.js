// =============================
// SHARED CONFIG
// =============================
const GAME_CONFIG = window.IKA_GAME_CONFIG || {
  climateModes: ["sunny", "night", "rainny", "snow", "mixed"],
  climateLabels: {
    sunny: "Sunny",
    night: "Night",
    rainny: "Rainy",
    snow: "Snow",
    mixed: "Dynamic"
  },
  uiText: {
    climatePrefix: "Climate",
    reviveReady: "Watch Ad & Continue",
    revivePending: "Watching Ad..."
  }
};
const CLIMATE_MODES = GAME_CONFIG.climateModes;
const CLIMATE_LABELS = GAME_CONFIG.climateLabels;
const UI_TEXT = GAME_CONFIG.uiText;
const THREE_FACTORIES = window.IKAThreeFactories;
const soundToggleBtn = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const pauseBtn = document.getElementById("pauseBtn");
const pauseIcon = document.getElementById("pauseIcon");
const climateModeToggleInput = document.getElementById("climateModeToggle");
const gameCanvasHost = document.getElementById("gameCanvasHost");
const previewCanvasHost = document.getElementById("previewCanvasHost");
const settingsToggleBtn = document.getElementById("settingsToggleBtn");
const settingsPanel = document.getElementById("settingsPanel");
const musicMenuBtn = document.getElementById("musicMenuBtn");
const soundMenuBtn = document.getElementById("soundMenuBtn");
const pauseMenuBtn = document.getElementById("pauseMenuBtn");
const exitMenuBtn = document.getElementById("exitMenuBtn");
const resolutionMenuBtn = document.getElementById("resolutionMenuBtn");
const musicMenuValue = document.getElementById("musicMenuValue");
const soundMenuValue = document.getElementById("soundMenuValue");
const pauseMenuValue = document.getElementById("pauseMenuValue");
const resolutionMenuValue = document.getElementById("resolutionMenuValue");
const startScreenEl = document.getElementById("startScreen");
const gameOverEl = document.getElementById("gameOver");
const reviveBtnEl = document.getElementById("reviveBtn");
const hudEl = document.getElementById("hud");
const impactFlashEl = document.getElementById("impactFlash");
const climateModeButtons = Array.from(document.querySelectorAll(".climateOptionBtn"));

// =============================
// BASIC THREE SETUP
// =============================
const isLowEnd = /Android|iPhone|iPad/i.test(navigator.userAgent);
const lowEndFactor = isLowEnd ? 0.5 : 1;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // visible sky to avoid black screen
//scene.fog=new THREE.Fog(0x87ceeb,20,140);
scene.fog = new THREE.Fog(0x87ceeb, 80, 300);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 8, 15);
camera.rotation.x = -0.35;
const baseCameraPosition = new THREE.Vector3().copy(camera.position);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setClearColor(0x000000, 0);
gameCanvasHost.appendChild(renderer.domElement);
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = false; // ✅ moved here
scene.add(sunLight);
renderer.shadowMap.enabled = false; // ✅ ok here too
const clock = new THREE.Clock();
const RESOLUTION_QUALITY_KEY = "ika_resolution_quality";
function getPixelRatioForQuality(quality) {
  const deviceRatio = Math.max(1, window.devicePixelRatio || 1);
  switch (quality) {
    case "low":
      return Math.max(0.7, Math.min(0.85, deviceRatio * 0.75));
    case "medium":
      return Math.max(0.9, Math.min(1.1, deviceRatio));
    case "high":
    default:
      return Math.min(1.5, Math.max(1.05, deviceRatio));
  }
}
function applyResolutionQuality(quality) {
  const nextQuality = ["low", "medium", "high"].includes(quality) ? quality : "medium";
  renderer.setPixelRatio(getPixelRatioForQuality(nextQuality));
  localStorage.setItem(RESOLUTION_QUALITY_KEY, nextQuality);
  resolutionMenuValue.textContent = nextQuality.charAt(0).toUpperCase() + nextQuality.slice(1);
  resolutionMenuValue.classList.remove("is-on", "is-off");
  return nextQuality;
}
function refreshRendererQuality() {
  activeResolutionQuality = applyResolutionQuality(activeResolutionQuality);
  syncRendererHost();
  renderer.render(scene, camera);
}
let activeResolutionQuality = applyResolutionQuality(
  localStorage.getItem(RESOLUTION_QUALITY_KEY) || (isLowEnd ? "medium" : "high")
);
let rendererHostMode = "";
let settingsPauseActive = false;
let manualPauseActive = false;
function getViewportHeight() {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}
function syncRendererHost() {
  const targetHost = startScreenActive ? previewCanvasHost : gameCanvasHost;
  const nextMode = startScreenActive ? "preview" : "game";
  setStartPreviewIsolation(startScreenActive);
  if (renderer.domElement.parentElement !== targetHost) {
    targetHost.appendChild(renderer.domElement);
  }
  rendererHostMode = nextMode;
  if (nextMode === "preview") {
    const rect = previewCanvasHost.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || previewCanvasHost.clientWidth || window.innerWidth));
    const height = Math.max(1, Math.round(rect.height || previewCanvasHost.clientHeight || Math.max(180, getViewportHeight() * 0.24)));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  } else {
    const viewportHeight = Math.max(1, Math.round(getViewportHeight()));
    camera.aspect = window.innerWidth / viewportHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, viewportHeight, false);
  }
}
function setStartScreenVisible(visible) {
  startScreenEl.style.opacity = visible ? "1" : "0";
  startScreenEl.style.pointerEvents = visible ? "auto" : "none";
}
function showGameOverScreen() {
  gameOverEl.classList.remove("is-visible");
  gameOverEl.style.display = "flex";
  requestAnimationFrame(() => {
    gameOverEl.classList.add("is-visible");
  });
  updateSettingsMenuForContext();
}
function hideGameOverScreen() {
  gameOverEl.classList.remove("is-visible");
  gameOverEl.style.display = "none";
}
function triggerImpactFlash() {
  if (!impactFlashEl) return;
  impactFlashEl.classList.remove("is-active");
  void impactFlashEl.offsetWidth;
  impactFlashEl.classList.add("is-active");
}
function setSettingsPanelOpen(open) {
  updateSettingsMenuForContext();
  const onGameOverScreen = gameOverEl.style.display === "flex";
  const inGame = !startScreenActive && !onGameOverScreen && (running || paused);
  if (open && inGame && !paused) {
    paused = true;
    settingsPauseActive = true;
    pauseIcon.src = "assets/images/play.png";
    engine.pause();
  } else if (!open && settingsPauseActive && !manualPauseActive) {
    paused = false;
    settingsPauseActive = false;
    pauseIcon.src = "assets/images/pause.png";
    playEngine();
  } else if (!open) {
    settingsPauseActive = false;
  }
  settingsPanel.hidden = !open;
  settingsToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
  updateSettingsMenuForContext();
}
function setTogglePillState(element, isOn) {
  element.classList.toggle("is-on", isOn);
  element.classList.toggle("is-off", !isOn);
}
function updateSettingsMenuForContext() {
  const onStartScreen = startScreenActive;
  const onGameOverScreen = gameOverEl.style.display === "flex";
  const inGame = !onStartScreen && !onGameOverScreen;

  resolutionMenuBtn.hidden = !onStartScreen;
  pauseMenuBtn.hidden = !inGame;
  exitMenuBtn.hidden = !inGame;
  hudEl.hidden = !inGame;
  pauseMenuValue.textContent = paused ? "On" : "Off";
  setTogglePillState(pauseMenuValue, paused);
}
function setPausedState(nextPaused, options = {}) {
  const { manual = false, closeSettingsOnResume = false } = options;
  paused = nextPaused;
  if (manual) {
    manualPauseActive = nextPaused;
  } else if (!nextPaused) {
    manualPauseActive = false;
  }
  if (!nextPaused) {
    settingsPauseActive = false;
  }
  pauseIcon.src = nextPaused ? "assets/images/play.png" : "assets/images/pause.png";
  if (nextPaused) {
    engine.pause();
  } else {
    playEngine();
  }
  if (!nextPaused && closeSettingsOnResume && !settingsPanel.hidden) {
    settingsPanel.hidden = true;
    settingsToggleBtn.setAttribute("aria-expanded", "false");
  }
  updateSettingsMenuForContext();
}
function returnToStartMenu() {
  running = false;
  launchTransition.active = false;
  crashTransition.active = false;
  startScreenActive = true;
  hideGameOverScreen();
  setPausedState(false);
  setSettingsPanelOpen(false);
  syncRendererHost();
  previewSpinActive = true;
  setStartScreenVisible(true);
  engine.pause();
  engine.currentTime = 0;
  manualPauseActive = false;
  settingsPauseActive = false;
  updateSettingsMenuForContext();
}
function updateClimateSelector() {
  if (climateModeToggleInput) climateModeToggleInput.value = climateMode;
  climateModeButtons.forEach(button => {
    const isActive = button.dataset.mode === climateMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}
// =============================
// SKY OBJECTS
// =============================
const loader = new THREE.TextureLoader();
const posterTextures = ['assets/images/poster1.png', 'assets/images/poster2.png', 'assets/images/poster3.png'];
const sunGroup = new THREE.Group();
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshBasicMaterial({
  color: 0xffdd55
}));
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: loader.load('assets/images/glow.png'),
  color: 0xffdd88,
  transparent: true,
  opacity: 0.6
}));
sunGlow.scale.set(14, 14, 1);
sunGroup.add(sunMesh, sunGlow);
scene.add(sunGroup);
const moonGroup = new THREE.Group();
const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshBasicMaterial({
  color: 0xddddff
}));
const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: loader.load('assets/images/glow1.png'),
  color: 0xaaaaff,
  transparent: true,
  opacity: 0.5
}));
moonGlow.scale.set(10, 10, 1);
moonGroup.add(moonMesh, moonGlow);
scene.add(moonGroup);
const clouds = [];
function spawnCloud() {
  const cloud = THREE_FACTORIES.createCloud();
  scene.add(cloud);
  clouds.push(cloud);
}
const birds = [];
const MAX_BIRDS = isLowEnd ? 6 : 12;
function spawnBird() {
  const bird = new THREE.Group();
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1c,
    side: THREE.DoubleSide,
    roughness: 0.9
  });
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.25), wingMat);
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.25), wingMat);
  leftWing.position.set(-0.35, 0, 0);
  rightWing.position.set(0.35, 0, 0);
  bird.add(leftWing);
  bird.add(rightWing);
  bird.position.set(-20 + Math.random() * 40, 13 + Math.random() * 8, -180 - Math.random() * 80);
  bird.userData.wings = [leftWing, rightWing];
  bird.userData.phase = Math.random() * Math.PI * 2;
  bird.userData.speed = 0.08 + Math.random() * 0.1;
  scene.add(bird);
  birds.push(bird);
}
// =============================
// STARS
// =============================
const starGeo = new THREE.BufferGeometry();
const starCount = isLowEnd ? 300 : 1200;
const starPos = [];
const starTwinkle = [];
for (let i = 0; i < starCount; i++) {
  starPos.push((Math.random() * 600) - 300, (Math.random() * 260) + 40, (Math.random() * 600) - 300);
  starTwinkle.push(Math.random() * Math.PI * 2);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.9,
  transparent: true
});
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);
// =============================
// ROAD
// =============================
const road = new THREE.Group();
const roadSegments = [];
const roadLineSegments = [];
const ROAD_SEGMENTS = 22;
const ROAD_TOTAL_LEN = 400;
const ROAD_SEG_LEN = ROAD_TOTAL_LEN / ROAD_SEGMENTS;
const ROAD_START_Z = -300;
for (let i = 0; i < ROAD_SEGMENTS; i++) {
  const seg = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, ROAD_SEG_LEN + 0.35), new THREE.MeshStandardMaterial({
    color: 0x444444
  }));
  const z = ROAD_START_Z + (i + 0.5) * ROAD_SEG_LEN;
  seg.position.set(0, 0, z);
  seg.userData.depth = 1 - (i / (ROAD_SEGMENTS - 1)); // 0 near camera, 1 far
  road.add(seg);
  roadSegments.push(seg);
  for (let side = -1; side <= 1; side += 2) {
    const lineSeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, ROAD_SEG_LEN + 0.35), new THREE.MeshStandardMaterial({
      color: 0xffffff
    }));
    lineSeg.position.set(side * 1.15, 0.11, z);
    lineSeg.userData.depth = seg.userData.depth;
    lineSeg.userData.offset = side * 1.15;
    road.add(lineSeg);
    roadLineSegments.push(lineSeg);
  }
}
scene.add(road);
// =============================
// GRASS LAND (LEFT & RIGHT)
// =============================
const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0x388e3c,
  roughness: 1
});
// Left grass
const grassLeft = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 400), grassMaterial);
grassLeft.position.set(-13, -0.05, -100);
scene.add(grassLeft);
// Right grass
const grassRight = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 400), grassMaterial);
grassLeft.material.color.offsetHSL(0, 0, -0.05);
grassRight.material.color.offsetHSL(0, 0, 0.05);
grassRight.position.set(13, -0.05, -100);
scene.add(grassRight);
// =============================
// CLIMATE GROUND PATCHES
// =============================
const climateGroundPatches = [];
function createPatchTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 160, 160);

  if (kind === "snow") {
    for (let i = 0; i < 10; i++) {
      const radius = 18 + Math.random() * 26;
      const x = 24 + Math.random() * 112;
      const y = 24 + Math.random() * 112;
      const gradient = ctx.createRadialGradient(x, y, 4, x, y, radius);
      gradient.addColorStop(0, "rgba(255,255,255,0.95)");
      gradient.addColorStop(0.6, "rgba(244,248,252,0.7)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const gradient = ctx.createRadialGradient(80, 80, 12, 80, 80, 70);
    gradient.addColorStop(0, "rgba(165,220,255,0.72)");
    gradient.addColorStop(0.45, "rgba(88,154,207,0.44)");
    gradient.addColorStop(1, "rgba(61,110,148,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(80, 84, 62, 38, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(230,247,255,0.36)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(74, 78, 26, 10, -0.2, Math.PI * 0.15, Math.PI * 1.1);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
const snowPatchTexture = createPatchTexture("snow");
const puddlePatchTexture = createPatchTexture("rain");
function createGroundPatch(x, z, width, depth, kind, opacity) {
  const patch = new THREE.Mesh(
    new THREE.CircleGeometry(1, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: kind === "snow" ? snowPatchTexture : puddlePatchTexture,
      transparent: true,
      opacity,
      depthWrite: false
    })
  );
  patch.rotation.x = -Math.PI / 2;
  patch.scale.set(width, depth, 1);
  patch.position.set(x, 0.03, z);
  scene.add(patch);
  climateGroundPatches.push(patch);
  return patch;
}
for (let i = 0; i < 8; i++) {
  const z = -170 + i * 42;
  createGroundPatch(-10.5 - Math.random() * 6.5, z, 2.8 + Math.random() * 2.8, 1.8 + Math.random() * 2.8, "snow", 0);
  createGroundPatch(10.5 + Math.random() * 6.5, z + 8, 2.8 + Math.random() * 2.8, 1.8 + Math.random() * 2.8, "snow", 0);
  createGroundPatch((Math.random() - 0.5) * 2.2, z - 6, 1.2 + Math.random() * 1.2, 1.8 + Math.random() * 2.4, "snow", 0);
}
for (let i = 0; i < 8; i++) {
  const z = -180 + i * 40;
  createGroundPatch(-10.5 - Math.random() * 6.5, z + 10, 3 + Math.random() * 2.5, 1.8 + Math.random() * 2.5, "rain", 0);
  createGroundPatch(10.5 + Math.random() * 6.5, z, 3 + Math.random() * 2.5, 1.8 + Math.random() * 2.5, "rain", 0);
  createGroundPatch((Math.random() - 0.5) * 1.8, z - 8, 1.3 + Math.random() * 1.4, 2.2 + Math.random() * 2.6, "rain", 0);
}
function updateClimateGroundPatches() {
  const showSnow = climateMode === "snow";
  const showRainWater = climateMode === "rainny";
  const roadTone = showSnow ? 0x6d7680 : showRainWater ? 0x2d333a : 0x444444;
  const roadLineTone = showSnow ? 0xe6edf4 : 0xffffff;
  roadSegments.forEach(seg => seg.material.color.setHex(roadTone));
  roadLineSegments.forEach(seg => seg.material.color.setHex(roadLineTone));
  climateGroundPatches.forEach((patch, index) => {
    const isSnowPatch = index < 24;
    patch.material.opacity = isSnowPatch
      ? (showSnow ? (patch.position.x > -4 && patch.position.x < 4 ? 0.26 : 0.34) : 0)
      : (showRainWater ? (patch.position.x > -4 && patch.position.x < 4 ? 0.22 : 0.18) : 0);
  });
}
// =============================
// CAR
// =============================
const { car, body, hood, roof, wheels, headlightL, headlightR, beamL, beamR } =
  THREE_FACTORIES.createPlayerCar();
let selectedCarColor = body.material.color.getHex();
const previewVisibleRoots = new Set([car, hemi, sunLight]);
const previewHiddenState = new Map();
let previewIsolationActive = false;
let previewStoredBackground = null;
let previewStoredFog = null;
// =============================
// START SCREEN CAR VIEW
// =============================
const desktopStartShowcaseConfig = {
  carScale: 2.45,
  carY: 4.45,
  carZ: 2.1,
  cameraPosition: new THREE.Vector3(0, 5.05, 6.9),
  lookTarget: new THREE.Vector3(0, 4.2, 0)
};
const mobileStartShowcaseConfig = {
  carScale: 2.45,
  carY: 3.15,
  carZ: 2.1,
  cameraPosition: new THREE.Vector3(0, 4.6, 6.9),
  lookTarget: new THREE.Vector3(0, 2.95, 0)
};
function getStartShowcaseConfig() {
  return window.innerWidth <= 480 ? mobileStartShowcaseConfig : desktopStartShowcaseConfig;
}
// =============================
// SUBWAY TRACKS
// =============================
// =============================
// RAILWAY TRACK
// =============================
// rail material
const railMat = new THREE.MeshStandardMaterial({
  color: 0xaaaaaa,
  metalness: 0.9,
  roughness: 0.3
});
// sleeper material
const sleeperMat = new THREE.MeshStandardMaterial({
  color: 0x5d4037,
  roughness: 1
});
// function to build one track
function createRailTrack(xOffset) {
  const trackGroup = new THREE.Group();
  // LEFT RAIL
  const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 400), railMat);
  rail1.position.set(xOffset - 0.6, 0.08, -100);
  trackGroup.add(rail1);
  // RIGHT RAIL
  const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 400), railMat);
  rail2.position.set(xOffset + 0.6, 0.08, -100);
  trackGroup.add(rail2);
  // sleepers (wood pieces)
  for (let i = 0; i < 80; i++) {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.4), sleeperMat);
    sleeper.position.set(xOffset, 0.02, -200 + i * 5);
    trackGroup.add(sleeper);
  }
  scene.add(trackGroup);
}
// create TWO tracks
createRailTrack(-12);
createRailTrack(-17);
// =============================
// TRAIN CREATOR
// =============================
const windowMat = new THREE.MeshStandardMaterial({
  color: 0x90caf9,
  transparent: true,
  opacity: 0.75,
  emissive: 0x000000,
  emissiveIntensity: 0
});
const doorMat = new THREE.MeshStandardMaterial({
  color: 0xeeeeee
});
function addTrainWindows(parent, registry) {
  for (let i = -1; i <= 1; i++) {
    // LEFT WINDOW
    const winL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.8), windowMat);
    winL.position.set(-1.11, 0.35, i * 1.1);
    parent.add(winL);
    registry.push(winL.material);
    // RIGHT WINDOW
    const winR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.8), windowMat);
    winR.position.set(1.11, 0.35, i * 1.1);
    parent.add(winR);
    registry.push(winR.material);
  }
}
function addTrainDoors(parent) {
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.9), doorMat);
  doorL.position.set(-1.11, 0.15, 0);
  parent.add(doorL);
  const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.9), doorMat);
  doorR.position.set(1.11, 0.15, 0);
  parent.add(doorR);
}
// =============================
// TRAIN WITH TWO ENGINES
// =============================
function createTrain(xPos, direction) {
  const train = new THREE.Group();
  const windowMaterials = [];
  const headLights = [];
  const engineMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f
  });
  const coachMat = new THREE.MeshStandardMaterial({
    color: 0xb71c1c
  });
  const engineWindowMat = new THREE.MeshStandardMaterial({
    color: 0x90caf9,
    transparent: true,
    opacity: 0.9,
    emissive: 0x000000,
    emissiveIntensity: 0
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c2,
    emissive: 0xffe082,
    emissiveIntensity: 1.2
  });
  function addEngineDetails(engine, faceSign) {
    // Front windshield
    const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.05), engineWindowMat);
    frontWindow.position.set(0, 0.6, faceSign * 2.03);
    engine.add(frontWindow);
    windowMaterials.push(frontWindow.material);
    // Side windows for better cabin visibility
    const sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.9), engineWindowMat);
    sideWindowL.position.set(-1.08, 0.55, 0);
    engine.add(sideWindowL);
    windowMaterials.push(sideWindowL.material);
    const sideWindowR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.9), engineWindowMat);
    sideWindowR.position.set(1.08, 0.55, 0);
    engine.add(sideWindowR);
    windowMaterials.push(sideWindowR.material);
    // Two headlights on the engine face
    const leftLight = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), headlightMat);
    leftLight.position.set(-0.45, 0.45, faceSign * 2.08);
    engine.add(leftLight);
    const rightLight = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), headlightMat);
    rightLight.position.set(0.45, 0.45, faceSign * 2.08);
    engine.add(rightLight);
    const beam = new THREE.PointLight(0xfff3c4, isLowEnd ? 0.6 : 1.0, 10);
    beam.position.set(0, 0.45, faceSign * 2.05);
    engine.add(beam);
    headLights.push(beam);
  }
  // ---- FRONT ENGINE ----
  const engineFront = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 4), engineMat);
  engineFront.position.z = 0;
  engineFront.position.y = 0.9;
  train.add(engineFront);
  // ---- COACHES ----
  for (let i = 1; i <= 7; i++) {
    const coach = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 4), coachMat);
    coach.position.z = -i * 4.5;
    coach.position.y = 0.9;
    train.add(coach);
    // add windows and doors
    addTrainWindows(coach, windowMaterials);
    addTrainDoors(coach);
  }
  // ---- BACK ENGINE ----
  const engineBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 4), engineMat);
  engineBack.position.z = -6 * 4.5;
  engineBack.position.y = 0.9;
  train.add(engineBack);
  addEngineDetails(engineFront, 1);
  addEngineDetails(engineBack, -1);
  train.position.set(xPos, 0, -200);
  train.userData.direction = direction;
  train.userData.windowMaterials = windowMaterials;
  train.userData.headLights = headLights;
  scene.add(train);
  return train;
}
const train1 = createTrain(-12, 1); // forward
const train2 = createTrain(-17, -1); // opposite
// =============================
// TRAINS
// =============================
//const train1 = createTrain(0xd32f2f);
train1.position.set(-12, 0, -150);
scene.add(train1);
//const train2 = createTrain(0x1976d2);
train2.rotation.y = Math.PI; // face opposite direction
train2.position.set(-16, 0, 50);
scene.add(train2);
let previewTime = 0;
let previewSpinActive = true;
let startScreenActive = true;
syncRendererHost();
setStartScreenVisible(true);
if (impactFlashEl) {
  impactFlashEl.addEventListener("animationend", () => {
    impactFlashEl.classList.remove("is-active");
  });
}
document.querySelectorAll(".colorDot").forEach(dot => {
  dot.addEventListener("click", () => {
    selectedCarColor = parseInt(dot.dataset.color);
    // main game car
    body.material.color.setHex(selectedCarColor);
    hood.material.color.setHex(selectedCarColor);
  });
});
scene.add(car);
function setStartPreviewIsolation(active) {
  if (active) {
    headlightL.visible = false;
    headlightR.visible = false;
    beamL.visible = false;
    beamR.visible = false;
  }
  if (previewIsolationActive === active) return;
  previewIsolationActive = active;
  if (active) {
    previewStoredBackground = scene.background;
    previewStoredFog = scene.fog;
    previewHiddenState.clear();
    scene.children.forEach(child => {
      if (previewVisibleRoots.has(child)) return;
      previewHiddenState.set(child, child.visible);
      child.visible = false;
    });
    scene.background = null;
    scene.fog = null;
    return;
  }
  previewHiddenState.forEach((visible, child) => {
    child.visible = visible;
  });
  previewHiddenState.clear();
  scene.background = previewStoredBackground;
  scene.fog = previewStoredFog;
}
// =============================
// EXHAUST FLAME
// =============================
const flameGeo = new THREE.ConeGeometry(0.15, 0.6, 8);
const flameMat = new THREE.MeshBasicMaterial({
  color: 0xff5500,
  transparent: true,
  opacity: 0.8
});
const flame = new THREE.Mesh(flameGeo, flameMat);
flame.rotation.x = Math.PI;
flame.position.set(0, 0.25, 1.8); // adjust to exhaust pipe
flame.visible = false;
car.add(flame);
function createBatWingShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0.0, 0.22);
  shape.lineTo(0.16, 0.18);
  shape.lineTo(0.34, 0.2);
  shape.lineTo(0.56, 0.14);
  shape.lineTo(0.8, 0.18);
  shape.lineTo(1.05, 0.08);
  shape.lineTo(1.26, -0.02);
  shape.lineTo(1.14, -0.1);
  shape.lineTo(1.34, -0.24);
  shape.lineTo(1.02, -0.2);
  shape.lineTo(0.78, -0.32);
  shape.lineTo(0.52, -0.24);
  shape.lineTo(0.28, -0.34);
  shape.lineTo(0.12, -0.2);
  shape.lineTo(0.0, -0.24);
  shape.closePath();
  return shape;
}
const jetWingMat = new THREE.MeshStandardMaterial({
  color: 0x12161d,
  emissive: 0x081018,
  emissiveIntensity: 0.95,
  metalness: 0.65,
  roughness: 0.3,
  side: THREE.DoubleSide
});
const jetWingGeo = new THREE.ShapeGeometry(createBatWingShape());
jetWingGeo.rotateX(-Math.PI / 2);
const jetWingLeft = new THREE.Mesh(jetWingGeo, jetWingMat);
jetWingLeft.position.set(-0.54, 0.58, 0.08);
jetWingLeft.scale.x = -1;
const jetWingRight = jetWingLeft.clone();
jetWingRight.scale.x = 1;
jetWingRight.position.x = 0.54;
jetWingLeft.visible = false;
jetWingRight.visible = false;
car.add(jetWingLeft, jetWingRight);
// =============================
// DRIFT SMOKE SYSTEM
// =============================
const smokeParticles = [];
function spawnSmoke() {
  const geo = new THREE.SphereGeometry(0.25, 8, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6
  });
  const smoke = new THREE.Mesh(geo, mat);
  // Spawn behind car
  smoke.position.set(car.position.x + (Math.random() - 0.5) * 0.4, 0.15, car.position.z + 1.2);
  smoke.userData.life = 1;
  scene.add(smoke);
  smokeParticles.push(smoke);
}
// =============================
// SKID MARK SYSTEM
// =============================
const skidMarks = [];
function spawnSkid() {
  const geo = new THREE.PlaneGeometry(0.4, 1.2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const skid = new THREE.Mesh(geo, mat);
  skid.rotation.x = -Math.PI / 2;
  skid.position.set(car.position.x, 0.01, car.position.z + 1.5);
  skid.userData.life = 1;
  scene.add(skid);
  skidMarks.push(skid);
}
// =============================
// LANES
// =============================
const lanes = [-2.2, 0, 2.2];
let currentLane = 1;
let targetX = lanes[currentLane];
const laneSmoothness = isLowEnd ? 0.14 : 0.22;
// =============================
// TREES
// =============================
const trees = [];
function spawnTree(side) {
  const tree = THREE_FACTORIES.createTree(side);
  scene.add(tree);
  trees.push(tree);
}
const landscapeDecor = [];
const MAX_LANDSCAPE_DECOR = isLowEnd ? 22 : 40;
function spawnLandscapeDecor(side) {
  const roll = Math.random();
  const decor = roll < 0.18
    ? THREE_FACTORIES.createCoconutTree(side)
    : roll < 0.55
      ? THREE_FACTORIES.createSunflower(side)
      : THREE_FACTORIES.createRoseBush(side);
  scene.add(decor);
  landscapeDecor.push(decor);
}
// =============================
// STREET LIGHTS
// =============================
const streetLights = [];
const MAX_STREET_LIGHTS = isLowEnd ? 8 : 14;
let streetLightTimer = 0;
function createStreetLight(x) {
  const lightGroup = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.8, 10),
    new THREE.MeshStandardMaterial({
      color: 0x737b86,
      roughness: 0.9
    })
  );
  pole.position.y = 2.4;
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.08, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x737b86,
      roughness: 0.9
    })
  );
  arm.position.set(0.42 * Math.sign(-x), 4.55, 0);
  const lampHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.2, 0.34),
    new THREE.MeshStandardMaterial({
      color: 0x2d3642,
      emissive: 0xffd58f,
      emissiveIntensity: 0
    })
  );
  lampHead.position.set(0.88 * Math.sign(-x), 4.45, 0);
  const lampGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffd58f,
      transparent: true,
      opacity: 0
    })
  );
  lampGlow.position.copy(lampHead.position);
  const lampLight = new THREE.PointLight(0xffd58f, 0, 28, 1.65);
  lampLight.position.set(lampHead.position.x, 4.25, 0);
  lightGroup.add(pole, arm, lampHead, lampGlow, lampLight);
  lightGroup.position.set(x, 0, -240);
  lightGroup.userData = { lampHead, lampGlow, lampLight };
  scene.add(lightGroup);
  streetLights.push(lightGroup);
}
function setStreetLightsEnabled(enabled) {
  for (const lightGroup of streetLights) {
    lightGroup.userData.lampLight.intensity = enabled ? 6.4 : 0;
    lightGroup.userData.lampGlow.material.opacity = enabled ? 0.98 : 0;
    lightGroup.userData.lampHead.material.emissiveIntensity = enabled ? 3.6 : 0;
  }
}
function updateStreetLights(speed, enabled) {
  streetLightTimer += speed;
  if (streetLightTimer > 0.7 && streetLights.length < MAX_STREET_LIGHTS) {
    createStreetLight(Math.random() > 0.5 ? -5.9 : 5.9);
    streetLightTimer = 0;
  }
  for (let i = streetLights.length - 1; i >= 0; i--) {
    const lightGroup = streetLights[i];
    lightGroup.position.z += speed * WORLD_SPEED;
    lightGroup.position.x += roadCurve * 0.012;
    const glowPulse = enabled ? 0.92 + Math.sin(clock.elapsedTime * 6 + i) * 0.08 : 0;
    lightGroup.userData.lampLight.intensity = enabled ? 6.2 + Math.sin(clock.elapsedTime * 4 + i) * 0.55 : 0;
    lightGroup.userData.lampGlow.material.opacity = glowPulse;
    lightGroup.userData.lampHead.material.emissiveIntensity = enabled ? 3.2 + Math.sin(clock.elapsedTime * 3.5 + i) * 0.35 : 0;
    if (lightGroup.position.z > 24) {
      scene.remove(lightGroup);
      streetLights.splice(i, 1);
    }
  }
}
// =============================
// Movie Poster
// =============================
function addMoviePoster(building, width, height, depth) {
  if (isLowEnd) return;
  if (Math.random() > 0.4) return;
  const tex = loader.load(posterTextures[Math.floor(Math.random() * posterTextures.length)]);
  tex.colorSpace = THREE.SRGBColorSpace;
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.6, height * 0.4), new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true
  }));
  poster.position.set(0, height * 0.55, depth / 2 + 0.02);
  building.add(poster);
}
// =============================
// BUILDINGS (NEW FEATURE)
// =============================
const buildings = [];
function spawnBuilding(x) {
  const building = new THREE.Group();
  const height = 4 + Math.random() * 8;
  const width = 2 + Math.random() * 1.5;
  const depth = 2 + Math.random() * 1.5;
  // Building box
  const buildingMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(Math.random(), 0.2, 0.5),
    roughness: 0.8
  }));
  buildingMesh.position.y = height / 2;
  building.add(buildingMesh);
  // ✅ Add poster here
  addMoviePoster(building, width, height, depth);
  // Windows
  for (let y = 0.8; y < height; y += 1.2) {
    for (let i = -width / 2 + 0.3; i < width / 2; i += 0.5) {
      const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xffffaa : 0x222222,
        side: THREE.DoubleSide
      }));
      windowMesh.position.set(i, y, depth / 2 + 0.01);
      building.add(windowMesh);
    }
  }
  // Position & add to scene
  building.position.set(x, 0, -260);
  scene.add(building);
  buildings.push(building);
}
// =============================
// ROAD SIDE SHOPS
// =============================
const shops = [];
function createTextSign(text, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = color;
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 64);
  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.4), new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  }));
}
function spawnBurgerShop(x) {
  const shop = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    roughness: 0.7
  }));
  body.position.y = 1.25;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 3.2), new THREE.MeshStandardMaterial({
    color: 0xffc107
  }));
  roof.position.y = 2.7;
  const sign = createTextSign("BURGER", "#ffeb3b");
  sign.position.set(0, 2, 1.6);
  shop.add(body, roof, sign);
  shop.position.set(x, 0, -260);
  scene.add(shop);
  shops.push(shop);
}
function spawnIceCreamShop(x) {
  const shop = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 2.8), new THREE.MeshStandardMaterial({
    color: 0xf48fb1,
    roughness: 0.6
  }));
  body.position.y = 1.2;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 20), new THREE.MeshStandardMaterial({
    color: 0xffffff
  }));
  cone.position.y = 3;
  const sign = createTextSign("ICE CREAM", "#ffffff");
  sign.position.set(0, 2, 1.5);
  shop.add(body, cone, sign);
  shop.position.set(x, 0, -260);
  scene.add(shop);
  shops.push(shop);
}
// =============================
// TEA STALL ☕
// =============================
function spawnTeaStall(x) {
  const shop = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.4), new THREE.MeshStandardMaterial({
    color: 0x8d6e63,
    roughness: 0.8
  }));
  base.position.y = 0.8;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 4), new THREE.MeshStandardMaterial({
    color: 0x4e342e
  }));
  roof.position.y = 2;
  const sign = createTextSign("TEA ☕", "#ffffff");
  sign.position.set(0, 1.6, 1.3);
  shop.add(base, roof, sign);
  shop.position.set(x, 0, -260);
  scene.add(shop);
  shops.push(shop);
}
// =============================
// PETROL BUNK ⛽
// =============================
function spawnPetrolBunk(x) {
  const shop = new THREE.Group();
  const building = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 3.2), new THREE.MeshStandardMaterial({
    color: 0x1565c0,
    roughness: 0.6
  }));
  building.position.y = 1.3;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 3.8), new THREE.MeshStandardMaterial({
    color: 0xffeb3b
  }));
  canopy.position.y = 3;
  const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), new THREE.MeshStandardMaterial({
    color: 0xffffff
  }));
  pillar1.position.set(-1.8, 1.5, 1.5);
  const pillar2 = pillar1.clone();
  pillar2.position.x = 1.8;
  const sign = createTextSign("PETROL ⛽", "#ffeb3b");
  sign.position.set(0, 2.2, 1.8);
  shop.add(building, canopy, pillar1, pillar2, sign);
  shop.position.set(x, 0, -260);
  scene.add(shop);
  shops.push(shop);
}
// =============================
// MODIFY TREE SPAWN AREA (BUILDINGS BEHIND TREES)
// =============================
// Add building spawn inside main loop
let buildingTimer = 0;
function updateBuildings(speed) {
  buildingTimer += speed;
  if (buildingTimer > 1.2 && buildings.length < 6) {
    spawnBuilding(Math.random() > 0.5 ? -8 : 8);
    buildingTimer = 0;
  }
  for (let i = buildings.length - 1; i >= 0; i--) {
    const b = buildings[i];
    b.position.z += speed * WORLD_SPEED;
    b.position.x += roadCurve * 0.008;
    if (b.position.z > 20) {
      scene.remove(b);
      buildings.splice(i, 1);
    }
  }
}
// =============================
// OBSTACLES (YELLOW CONES)
// =============================
const obstacles = [];
function spawnObstacle() {
  const coneGroup = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(0.7, 1.6, 24);
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0xffe600,
    roughness: 0.4
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = 0.8; // upright
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x000000
  });
  const stripe1 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 10, 30), stripeMat);
  stripe1.rotation.x = Math.PI / 2;
  stripe1.position.y = 1.05;
  const stripe2 = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.05, 10, 30), stripeMat);
  stripe2.rotation.x = Math.PI / 2;
  stripe2.position.y = 0.75;
  coneGroup.add(cone, stripe1, stripe2);
  const laneX = lanes[Math.floor(Math.random() * 3)];
  coneGroup.userData.laneX = laneX;
  coneGroup.position.x = roadCurve + laneX;
  coneGroup.position.z = -200;
  scene.add(coneGroup);
  obstacles.push(coneGroup);
}
// =============================
// JET POWER
// =============================
const jetPowers = [];
const JET_SPEED_MULTIPLIER = 2.5;
const JET_DURATION = 15;
const JET_FLIGHT_HEIGHT = 4.4;
let nextJetScore = 500;
let jetActive = false;
let jetTimer = 0;
let landingSafeTimer = 0;
function clearNearObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].position.z > -50) {
      scene.remove(obstacles[i]);
      obstacles.splice(i, 1);
    }
  }
}
function spawnJetPower() {
  const pickup = new THREE.Group();
  const badgeCanvas = document.createElement("canvas");
  badgeCanvas.width = 256;
  badgeCanvas.height = 256;
  const badgeCtx = badgeCanvas.getContext("2d");
  badgeCtx.clearRect(0, 0, 256, 256);
  badgeCtx.fillStyle = "#f4d12c";
  badgeCtx.beginPath();
  badgeCtx.ellipse(128, 128, 100, 64, 0, 0, Math.PI * 2);
  badgeCtx.fill();
  badgeCtx.fillStyle = "#0b0f14";
  badgeCtx.beginPath();
  badgeCtx.moveTo(40, 138);
  badgeCtx.lineTo(70, 124);
  badgeCtx.lineTo(86, 136);
  badgeCtx.lineTo(102, 110);
  badgeCtx.lineTo(118, 128);
  badgeCtx.lineTo(128, 84);
  badgeCtx.lineTo(138, 128);
  badgeCtx.lineTo(154, 110);
  badgeCtx.lineTo(170, 136);
  badgeCtx.lineTo(186, 124);
  badgeCtx.lineTo(216, 138);
  badgeCtx.lineTo(174, 136);
  badgeCtx.lineTo(154, 150);
  badgeCtx.lineTo(128, 156);
  badgeCtx.lineTo(102, 150);
  badgeCtx.lineTo(82, 136);
  badgeCtx.closePath();
  badgeCtx.fill();
  const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
  badgeTexture.needsUpdate = true;
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({
    map: badgeTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  }));
  badge.position.y = 0.9;
  const aura = new THREE.Mesh(new THREE.RingGeometry(0.53, 0.66, 28), new THREE.MeshBasicMaterial({
    color: 0x2adfff,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide
  }));
  aura.position.y = 0.9;
  pickup.add(aura, badge);
  pickup.userData.pulseOffset = Math.random() * Math.PI * 2;
  pickup.userData.laneX = lanes[Math.floor(Math.random() * lanes.length)];
  pickup.position.set(roadCurve + pickup.userData.laneX, 0, -220);
  scene.add(pickup);
  jetPowers.push(pickup);
}
function activateJetPower() {
  jetActive = true;
  jetTimer = JET_DURATION;
  landingSafeTimer = 0;
  isJumping = false;
  jumpVelocity = 0;
  car.rotation.x = 0;
  jetWingLeft.visible = true;
  jetWingRight.visible = true;
  jetWingLeft.rotation.z = 0;
  jetWingRight.rotation.z = 0;
  clearNearObstacles();
}
function endJetPower() {
  jetActive = false;
  landingSafeTimer = 1.8;
  jetWingLeft.visible = false;
  jetWingRight.visible = false;
  jetWingLeft.rotation.z = 0;
  jetWingRight.rotation.z = 0;
  clearNearObstacles();
}
// =============================
// COUNTDOWN OBJECTS (1 2 3 GO)
// =============================
function spawnCountdownObject(text, zPos) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 256;
  // ✅ transparent background (DO NOTHING)
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = "white";
  ctx.font = "bold 160px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true, // ✅ important
    depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), mat);
  mesh.position.set(0, 3, zPos);
  scene.add(mesh);
  countdownObjects.push(mesh);
}
// =============================
// GAME VARIABLES (FIXED DUPLICATES)
// =============================
let score = 0;
let level = 1;
let speed = 0.01;
let minSpeed = 0.05;
let maxSpeed = 0.15;
let speedStep = 0.00025; // smooth change
let speedDir = 1; // 1 = increasing, -1 = decreasing
let running = false; // start paused until Start pressed
let paused = false;
const WORLD_SPEED = 10;
// Jump system (single definition)
let isJumping = false;
let jumpVelocity = 0;
const gravity = 0.0045; // reduced air float
const jumpPower = 0.135; // little higher jump      // small but higher jump
const flipSpeed = 0.18; // single flip only
let flipRotation = 0;
let hasFlipped = false;
let shakeTime = 0;
let shakeIntensity = 0.15;
let countdownStage = 0; // 0=1, 1=2, 2=3, 3=GO, 4=done
let countdownActive = true;
const launchTransition = {
  active: false,
  startedAt: 0,
  duration: 700,
  startCarScale: getStartShowcaseConfig().carScale,
  startCarY: getStartShowcaseConfig().carY,
  startCarZ: getStartShowcaseConfig().carZ,
  startCarRotY: 0,
  startCameraPosition: getStartShowcaseConfig().cameraPosition.clone(),
  startCameraRotX: -0.12
};
const crashTransition = {
  active: false,
  startedAt: 0,
  duration: 720,
  startCameraPosition: new THREE.Vector3(),
  startCarPosition: new THREE.Vector3(),
  startCarRotation: new THREE.Euler()
};
const countdownObjects = [];
let isTouching = false;
let lockedSpeed = 0;
let activeTouchId = null;
let reviveUsed = false;
let waitingForAd = false;
const MAX_TREES = isLowEnd ? 24 : 45;
const MAX_CLOUDS = isLowEnd ? 8 : 18;
const MAX_OBSTACLES = isLowEnd ? 6 : 12;
// =============================
// ROAD CURVE SYSTEM
// =============================
let roadCurve = 0;
let curveDir = 1;
const maxCurve = 0.7; // how strong the curve is
const curveSpeed = 0.0006; // how fast it changes
const farmlands = [];
function spawnFarmland() {
  const farm = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.BoxGeometry(16, 0.05, 40), new THREE.MeshStandardMaterial({
    color: 0x6d4c41
  }));
  soil.position.set(0, 0, -200);
  farm.add(soil);
  // crop lines
  for (let i = -6; i <= 6; i += 2) {
    const crop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 40), new THREE.MeshStandardMaterial({
      color: 0x7cb342
    }));
    crop.position.set(i, 0.4, -200);
    farm.add(crop);
  }
  farm.position.x = Math.random() > 0.5 ? -14 : 14;
  scene.add(farm);
  farmlands.push(farm);
}
function updateFarmland(speed) {
  if (Math.random() > 0.995) {
    spawnFarmland();
  }
  for (let i = farmlands.length - 1; i >= 0; i--) {
    const f = farmlands[i];
    f.position.z += speed * WORLD_SPEED;
    if (f.position.z > 40) {
      scene.remove(f);
      farmlands.splice(i, 1);
    }
  }
}
// =============================
// RAIN SYSTEM
// =============================
let rainEnabled = false;
let rainTimer = 0;
let nextRainTime = 10 + Math.random() * 20;
const rainDrops = [];
const MAX_RAIN = 400;
const snowFlakes = [];
const MAX_SNOW = isLowEnd ? 180 : 320;
let snowEnabled = false;
let climateMode = localStorage.getItem("ika_climate_mode") || "sunny";
if (!CLIMATE_MODES.includes(climateMode)) climateMode = "sunny";
let denseFieldMode = false;
let denseTimer = 0;
let nextDenseTime = 15 + Math.random() * 25;
const fireflies = [];
const MAX_FIREFLIES = isLowEnd ? 15 : 40;
const fireworks = [];
let nextNightFireworkScore = 1000;
function spawnFirefly() {
  const geo = new THREE.SphereGeometry(0.08, 6, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffff88,
    transparent: true,
    opacity: 0.8
  });
  const fly = new THREE.Mesh(geo, mat);
  fly.position.set(
    (Math.random() > 0.5 ? -1 : 1) * (8 + Math.random() * 10), 1 + Math.random() * 3, -200);
  fly.userData.offset = Math.random() * Math.PI * 2;
  scene.add(fly);
  fireflies.push(fly);
}
function updateFireflies(speed) {
  if (!isNightNow) {
    for (let i = fireflies.length - 1; i >= 0; i--) {
      scene.remove(fireflies[i]);
      fireflies.splice(i, 1);
    }
    return;
  }
  if (fireflies.length < MAX_FIREFLIES && Math.random() > 0.6) {
    spawnFirefly();
  }
  for (let i = fireflies.length - 1; i >= 0; i--) {
    const f = fireflies[i];
    f.position.z += speed * WORLD_SPEED;
    f.position.y += Math.sin(clock.elapsedTime * 2 + f.userData.offset) * 0.02;
    f.material.opacity = 0.5 + Math.sin(clock.elapsedTime * 4 + f.userData.offset) * 0.3;
    if (f.position.z > 20) {
      scene.remove(f);
      fireflies.splice(i, 1);
    }
  }
}
// =============================
// SOUND / MUSIC SETTINGS
// =============================
let soundEnabled = localStorage.getItem("ika_sound") !== "off";
let musicEnabled = localStorage.getItem("ika_music") !== "off";
function getActiveMusicTrack() {
  return climateMode === "rainny" ? rainnyMusic : sunnyMusic;
}
function playBackgroundMusic() {
  if (!musicEnabled) return;
  const activeTrack = getActiveMusicTrack();
  if (activeTrack.paused) activeTrack.play().catch(() => {});
}
function attemptAutoplayMusic() {
  if (!musicEnabled) return;
  [sunnyMusic, rainnyMusic].forEach(track => {
    track.autoplay = true;
    track.playsInline = true;
  });
  playBackgroundMusic();
}
function updateSoundIcon() {
  soundIcon.src = soundEnabled ? "assets/images/sound-on.png" : "assets/images/sound-off.png";
}
function clearRainDrops() {
  for (let i = rainDrops.length - 1; i >= 0; i--) {
    scene.remove(rainDrops[i]);
    rainDrops.splice(i, 1);
  }
}
function spawnNightFirework() {
  const burst = new THREE.Group();
  const burstColor = [0xffd54f, 0xff6f61, 0x8ec5ff, 0xff78c5][Math.floor(Math.random() * 4)];
  for (let i = 0; i < 22; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 6, 6),
      new THREE.MeshBasicMaterial({
        color: burstColor,
        transparent: true,
        opacity: 0.95
      })
    );
    const theta = (i / 22) * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const sparkSpeed = 0.05 + Math.random() * 0.07;
    spark.userData.velocity = new THREE.Vector3(
      Math.cos(theta) * Math.sin(phi) * sparkSpeed,
      Math.cos(phi) * sparkSpeed * 0.9,
      Math.sin(theta) * Math.sin(phi) * sparkSpeed
    );
    burst.add(spark);
  }
  burst.position.set((Math.random() - 0.5) * 28, 15 + Math.random() * 10, -120 - Math.random() * 60);
  burst.userData.life = 1;
  scene.add(burst);
  fireworks.push(burst);
}
function updateFireworks() {
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const burst = fireworks[i];
    burst.userData.life -= 0.02;
    burst.children.forEach(spark => {
      spark.position.add(spark.userData.velocity);
      spark.material.opacity = Math.max(0, burst.userData.life);
    });
    if (burst.userData.life <= 0) {
      scene.remove(burst);
      fireworks.splice(i, 1);
    }
  }
}
function clearSnowFlakes() {
  for (let i = snowFlakes.length - 1; i >= 0; i--) {
    scene.remove(snowFlakes[i]);
    snowFlakes.splice(i, 1);
  }
}
function setClimateMode(mode) {
  climateMode = mode;
  localStorage.setItem("ika_climate_mode", mode);
  updateClimateSelector();
  rainTimer = 0;
  nextRainTime = 8 + Math.random() * 12;
  if (mode === "rainny") {
    rainEnabled = true;
    snowEnabled = false;
    clearSnowFlakes();
  } else if (mode === "snow") {
    rainEnabled = false;
    clearRainDrops();
    snowEnabled = true;
  } else if (mode === "mixed") {
    rainEnabled = false;
    snowEnabled = false;
    clearSnowFlakes();
  } else {
    rainEnabled = false;
    snowEnabled = false;
    clearRainDrops();
    clearSnowFlakes();
  }
}
function syncAudioSettings() {
  crash.muted = !soundEnabled;
  engine.muted = !soundEnabled;
  sunnyMusic.muted = !musicEnabled;
  rainnyMusic.muted = !musicEnabled;
  const activeTrack = getActiveMusicTrack();
  [sunnyMusic, rainnyMusic].forEach(track => {
    if (track !== activeTrack) track.pause();
  });
  if (!musicEnabled) {
    sunnyMusic.pause();
    rainnyMusic.pause();
  } else {
    playBackgroundMusic();
  }
  if (!soundEnabled) {
    engine.pause();
  } else if (running && !paused) {
    engine.play().catch(() => {});
  }
  musicMenuValue.textContent = musicEnabled ? "On" : "Off";
  soundMenuValue.textContent = soundEnabled ? "On" : "Off";
  setTogglePillState(musicMenuValue, musicEnabled);
  setTogglePillState(soundMenuValue, soundEnabled);
  updateSettingsMenuForContext();
  updateSoundIcon();
}
function setMusicState(state) {
  musicEnabled = state;
  localStorage.setItem("ika_music", state ? "on" : "off");
  syncAudioSettings();
}
function setSoundState(state) {
  soundEnabled = state;
  localStorage.setItem("ika_sound", state ? "on" : "off");
  syncAudioSettings();
}
// Button click
soundToggleBtn.addEventListener("click", () => {
  setSoundState(!soundEnabled);
});
climateModeButtons.forEach(button => {
  button.addEventListener("click", () => {
    setClimateMode(button.dataset.mode);
    syncAudioSettings();
  });
});
climateModeToggleInput.addEventListener("change", () => {
  setClimateMode(climateModeToggleInput.value);
  syncAudioSettings();
});
settingsToggleBtn.addEventListener("click", () => {
  setSettingsPanelOpen(settingsPanel.hidden);
});
musicMenuBtn.addEventListener("click", () => {
  setMusicState(!musicEnabled);
});
soundMenuBtn.addEventListener("click", () => {
  setSoundState(!soundEnabled);
});
pauseMenuBtn.addEventListener("click", () => {
  if (startScreenActive || gameOverEl.style.display === "flex" || !running) return;
  const nextPaused = !paused;
  setPausedState(nextPaused, {
    manual: true,
    closeSettingsOnResume: !nextPaused
  });
  if (!nextPaused) {
    setSettingsPanelOpen(false);
  } else {
    settingsPauseActive = false;
  }
});
resolutionMenuBtn.addEventListener("click", () => {
  const qualities = ["low", "medium", "high"];
  const currentIndex = qualities.indexOf(activeResolutionQuality);
  activeResolutionQuality = applyResolutionQuality(qualities[(currentIndex + 1) % qualities.length]);
  refreshRendererQuality();
});
exitMenuBtn.addEventListener("click", () => {
  returnToStartMenu();
});
setSettingsPanelOpen(false);
function startCountdownSequence() {
  countdownStage = 0;
  countdownActive = true;
  countdownObjects.forEach(o => scene.remove(o));
  countdownObjects.length = 0;
  spawnCountdownObject("1", -20);
  spawnCountdownObject("2", -40);
  spawnCountdownObject("3", -60);
  spawnCountdownObject("GO", -80);
}
function resetGame(options = {}) {
  const { startRunning = true, startCountdown = true } = options;
  body.material.color.setHex(selectedCarColor);
  hood.material.color.setHex(selectedCarColor);
  reviveUsed = false;
  waitingForAd = false;
  reviveBtnEl.style.display = "block";
  reviveBtnEl.disabled = false;
  reviveBtnEl.innerText = UI_TEXT.reviveReady;
  // core state
  score = 0;
  level = 1;
  speed = minSpeed;
  speedDir = 1;
  running = startRunning;
  paused = false;
  manualPauseActive = false;
  settingsPauseActive = false;
  roadCurve = 0;
  curveDir = 1;
  launchTransition.active = false;
  crashTransition.active = false;
  // car state
  car.position.set(0, 0.1, 4);
  car.rotation.set(0, 0, 0);
  car.scale.setScalar(1);
  camera.position.copy(baseCameraPosition);
  camera.rotation.set(-0.35, 0, 0);
  currentLane = 1;
  targetX = lanes[currentLane];
  isJumping = false;
  // countdown
  countdownObjects.forEach(o => scene.remove(o));
  countdownObjects.length = 0;
  countdownActive = false;
  if (startCountdown) startCountdownSequence();
  // obstacles
  obstacles.forEach(o => scene.remove(o));
  obstacles.length = 0;
  jetPowers.forEach(j => scene.remove(j));
  jetPowers.length = 0;
  jetActive = false;
  jetTimer = 0;
  landingSafeTimer = 0;
  nextJetScore = 1000;
  jetWingLeft.visible = false;
  jetWingRight.visible = false;
  trees.forEach(t => scene.remove(t));
  trees.length = 0;
  landscapeDecor.forEach(item => scene.remove(item));
  landscapeDecor.length = 0;
  clouds.forEach(c => scene.remove(c));
  clouds.length = 0;
  buildings.forEach(b => scene.remove(b));
  buildings.length = 0;
  streetLights.forEach(lightGroup => scene.remove(lightGroup));
  streetLights.length = 0;
  fireworks.forEach(item => scene.remove(item));
  fireworks.length = 0;
  nextNightFireworkScore = 1000;
  clearRainDrops();
  clearSnowFlakes();
  // UI
  hideGameOverScreen();
  pauseIcon.src = "assets/images/pause.png";
  updateSettingsMenuForContext();
  // audio
  engine.currentTime = 0;
  playEngine();
  shops.forEach(s => scene.remove(s));
  shops.length = 0;
}
function finishCrashSequence() {
  crashTransition.active = false;
  document.getElementById("finalScore").innerText = score;
  document.getElementById("finalLevel").innerText = level;
  if (reviveUsed) {
    reviveBtnEl.style.display = "none";
  } else {
    reviveBtnEl.style.display = "block";
    reviveBtnEl.disabled = false;
    reviveBtnEl.innerText = UI_TEXT.reviveReady;
  }
  showGameOverScreen();
}
function startCrashSequence() {
  if (crashTransition.active) return;
  if (soundEnabled) {
    crash.currentTime = 0;
    crash.play().catch(() => {});
  }
  engine.pause();
  running = false;
  paused = false;
  crashTransition.active = true;
  crashTransition.startedAt = performance.now();
  crashTransition.startCameraPosition.copy(camera.position);
  crashTransition.startCarPosition.copy(car.position);
  crashTransition.startCarRotation.copy(car.rotation);
  triggerImpactFlash();
}
function beginLaunchTransition() {
  resetGame({
    startRunning: false,
    startCountdown: false
  });
  startScreenActive = false;
  syncRendererHost();
  previewSpinActive = false;
  launchTransition.active = true;
  launchTransition.startedAt = performance.now();
  launchTransition.startCarScale = car.scale.x;
  launchTransition.startCarY = car.position.y;
  launchTransition.startCarZ = car.position.z;
  launchTransition.startCarRotY = car.rotation.y;
  launchTransition.startCameraPosition.copy(camera.position);
  launchTransition.startCameraRotX = camera.rotation.x;
  setStartScreenVisible(false);
  startCountdownSequence();
}
// =============================
// AUDIO
// =============================
const engine = document.getElementById("engine");
const crash = document.getElementById("crash");
const sunnyMusic = document.getElementById("sunnyMusic");
const rainnyMusic = document.getElementById("rainnyMusic");
engine.volume = isLowEnd ? 0.25 : 0.4;
sunnyMusic.volume = 0.42;
rainnyMusic.volume = 0.42;
sunnyMusic.loop = true;
rainnyMusic.loop = true;
setClimateMode(climateMode);
syncAudioSettings();
attemptAutoplayMusic();
window.addEventListener("DOMContentLoaded", attemptAutoplayMusic, { once: true });
window.addEventListener("load", attemptAutoplayMusic, { once: true });
window.addEventListener("pageshow", attemptAutoplayMusic);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) attemptAutoplayMusic();
});
document.addEventListener("pointerdown", () => {
  playBackgroundMusic();
}, {
  once: true
});
// =============================
// revive
// =============================
function playEngine() {
  if (soundEnabled && !paused) {
    engine.play().catch(() => {});
  }
}
// =============================
// ADVANCED GRASS SYSTEM 🌱🌾🌼
// =============================
const grasses = [];
const MAX_GRASS = isLowEnd ? 120 : 300;
const grassColors = [
  0x2e7d32,
  0x388e3c,
  0x43a047,
  0x4caf50
];
function spawnGrass() {
  const group = new THREE.Group();
  const side = Math.random() > 0.5 ? -1 : 1;
  const baseX = side * (8 + Math.random() * 8);
  // 🌿 NORMAL OR TALL GRASS
  const isTall = Math.random() > 0.75;
  const height = isTall ? 1.2 : 0.6;
  const width = isTall ? 0.35 : 0.25;
  const bladeGeo = new THREE.PlaneGeometry(width, height);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: grassColors[Math.floor(Math.random() * grassColors.length)],
    side: THREE.DoubleSide
  });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.y = height / 2;
  group.add(blade);
  // 🌼 FLOWERS (small chance)
  if (Math.random() > 0.85) {
    const flowerGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const flowerMat = new THREE.MeshBasicMaterial({
      color: [0xff5252, 0xffeb3b, 0xff80ab, 0xffffff][Math.floor(Math.random() * 4)]
    });
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    flower.position.set(0, height + 0.1, 0);
    group.add(flower);
  }
  group.position.set(baseX, 0, -220);
  scene.add(group);
  grasses.push(group);
}
// =============================
// spawnRain
// =============================
function spawnRain() {
  const geo = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x66aaff,
    transparent: true,
    opacity: 0.6
  });
  const drop = new THREE.Mesh(geo, mat);
  drop.position.set(
    (Math.random() - 0.5) * 20, 8 + Math.random() * 5,
    (Math.random() - 0.5) * 40);
  scene.add(drop);
  rainDrops.push(drop);
}
function spawnSnowFlake() {
  const geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 6, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  const flake = new THREE.Mesh(geo, mat);
  flake.position.set((Math.random() - 0.5) * 24, 7 + Math.random() * 6, (Math.random() - 0.5) * 50);
  flake.userData.drift = (Math.random() - 0.5) * 0.02;
  scene.add(flake);
  snowFlakes.push(flake);
}
function revivePlayer() {
  // Move car safely forward
  car.position.z = 4;
  car.position.y = 0.1;
  car.rotation.set(0, 0, 0);
  car.scale.setScalar(1);
  jetActive = false;
  jetTimer = 0;
  landingSafeTimer = 1.2;
  jetWingLeft.visible = false;
  jetWingRight.visible = false;
  // Clear nearby obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].position.z > -40) {
      scene.remove(obstacles[i]);
      obstacles.splice(i, 1);
    }
  }
  // Resume game
  running = true;
  manualPauseActive = false;
  settingsPauseActive = false;
  paused = false;
  playEngine();
}
// =============================
// BUTTONS
// =============================
document.getElementById("menuBtn").addEventListener("click", () => {
  returnToStartMenu();
});
document.getElementById("reviveBtn").addEventListener("click", () => {
  if (waitingForAd || reviveUsed) return;
  waitingForAd = true;
  reviveUsed = true;
  const btn = document.getElementById("reviveBtn");
  btn.innerText = UI_TEXT.revivePending;
  btn.disabled = true;
  setTimeout(() => {
    waitingForAd = false;
    revivePlayer();
    hideGameOverScreen();
    btn.innerText = UI_TEXT.reviveReady;
    btn.disabled = false;
    updateSettingsMenuForContext();
  }, 3000);
});
document.getElementById("restartBtn").addEventListener("click", () => {
  resetGame();
});
document.getElementById("startBtn").addEventListener("click", () => {
  body.material.color.setHex(selectedCarColor);
  hood.material.color.setHex(selectedCarColor);
  setSettingsPanelOpen(false);
  startScreenEl.style.transition = "opacity 0.6s ease";
  setStartScreenVisible(false);
  beginLaunchTransition();
  updateSettingsMenuForContext();
});
// Pause button logic
pauseBtn.addEventListener("click", () => {
  if (!running || gameOverEl.style.display === "flex") return;
  setPausedState(!paused, { manual: true, closeSettingsOnResume: true });
});
// =============================
// INPUT
// =============================
addEventListener("keydown", e => {
  if (e.key === "ArrowUp" && !isJumping) {
    isJumping = true;
    jumpVelocity = jumpPower;
    hasFlipped = false;
  }
  if (!running) return;
  if (e.key === "ArrowLeft") currentLane = Math.max(0, currentLane - 1);
  if (e.key === "ArrowRight") currentLane = Math.min(2, currentLane + 1);
  targetX = lanes[currentLane];
});
let startX = 0;
let startY = 0;
addEventListener("touchstart", e => {
  // Ignore if a finger is already active
  if (activeTouchId !== null) return;
  const touch = e.changedTouches[0];
  activeTouchId = touch.identifier;
  isTouching = true;
  lockedSpeed = speed; // 🔒 freeze speed
  startX = touch.clientX;
  startY = touch.clientY;
});
addEventListener("touchend", e => {
  // Find the touch that ended
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier === activeTouchId) {
      // ✅ correct finger released
      activeTouchId = null;
      isTouching = false;
      const dx = touch.clientX - startX;
      const dy = startY - touch.clientY;
      // swipe up = jump
      if (dy > 60 && !isJumping) {
        isJumping = true;
        jumpVelocity = jumpPower;
        hasFlipped = false;
        return;
      }
      // left / right
      if (dx > 50) currentLane = Math.min(2, currentLane + 1);
      if (dx < -50) currentLane = Math.max(0, currentLane - 1);
      targetX = lanes[currentLane];
    }
  }
});
function hit(a, b) {
  // If car is jumping high enough, ignore collision
  if (jetActive || landingSafeTimer > 0) return false;
  if (isJumping && car.position.y > 0.6) return false;
  return Math.abs(a.position.x - b.position.x) < 0.8 && Math.abs(a.position.z - b.position.z) < 1.5;
}
// =============================
// SKY CYCLE
// =============================
let time = 0;
let isNightNow = false;
function updateSky() {
  const sunrise = new THREE.Color(0xff9a3c);
  const day = new THREE.Color(0x87ceeb);
  const sunset = new THREE.Color(0xff5e57);
  const night = new THREE.Color(0x0b1026);
  const snowSky = new THREE.Color(0xdce9f7);
  let streetLightsOn = false;
  if (climateMode === "mixed") {
    time = (time + 0.00012) % 1;
    const phase = (Math.sin(time * Math.PI) + 1) / 2;
    let skyColor;
    if (phase < 0.25) skyColor = night.clone().lerp(sunrise, phase / 0.25);
    else if (phase < 0.5) skyColor = sunrise.clone().lerp(day, (phase - 0.25) / 0.25);
    else if (phase < 0.75) skyColor = day.clone().lerp(sunset, (phase - 0.5) / 0.25);
    else skyColor = sunset.clone().lerp(night, (phase - 0.75) / 0.25);
    scene.background = skyColor;
    scene.fog.color.copy(skyColor);
    const angle = phase * Math.PI * 2;
    sunGroup.position.set(Math.cos(angle) * 30, Math.sin(angle) * 20 + 10, -100);
    moonGroup.position.set(Math.cos(angle + Math.PI) * 30, Math.sin(angle + Math.PI) * 20 + 10, -100);
    isNightNow = phase < 0.15 || phase > 0.85;
    streetLightsOn = isNightNow;
    sunGroup.visible = !isNightNow;
    moonGroup.visible = isNightNow;
    hemi.intensity = isNightNow ? 0.25 : 1;
    sunLight.intensity = isNightNow ? 0.15 : 1;
    scene.fog.near = isNightNow ? 10 : 40;
    scene.fog.far = isNightNow ? 75 : 140;
  } else if (climateMode === "night") {
    isNightNow = true;
    streetLightsOn = true;
    scene.background = night;
    scene.fog.color.copy(night);
    sunGroup.visible = false;
    moonGroup.visible = true;
    moonGroup.position.set(0, 24, -100);
    hemi.intensity = 0.25;
    sunLight.intensity = 0.15;
    scene.fog.near = 10;
    scene.fog.far = 75;
  } else if (climateMode === "snow") {
    isNightNow = false;
    streetLightsOn = false;
    scene.background = snowSky;
    scene.fog.color.copy(snowSky);
    sunGroup.visible = false;
    moonGroup.visible = false;
    hemi.intensity = 0.9;
    sunLight.intensity = 0.45;
    scene.fog.near = 26;
    scene.fog.far = 110;
  } else {
    isNightNow = false;
    streetLightsOn = false;
    scene.background = day;
    scene.fog.color.copy(day);
    sunGroup.visible = true;
    moonGroup.visible = false;
    sunGroup.position.set(18, 28, -100);
    hemi.intensity = 1;
    sunLight.intensity = 1;
    scene.fog.near = 40;
    scene.fog.far = 140;
  }
  headlightL.visible = isNightNow;
  headlightR.visible = isNightNow;
  beamL.visible = isNightNow;
  beamR.visible = isNightNow;
  starField.visible = !isLowEnd && isNightNow;
  setStreetLightsEnabled(streetLightsOn);
  updateClimateGroundPatches();
  [train1, train2].forEach(train => {
    train.userData.windowMaterials.forEach(material => {
      material.emissive.setHex(isNightNow ? 0xffd98a : 0x000000);
      material.emissiveIntensity = isNightNow ? 1.8 : 0;
      material.color.setHex(isNightNow ? 0xc8c089 : 0x90caf9);
      material.opacity = isNightNow ? 0.96 : 0.75;
    });
    train.userData.headLights.forEach(light => {
      light.intensity = isNightNow ? (isLowEnd ? 1.1 : 1.8) : 0;
    });
  });
}
function ensureGameplaySceneState() {
  if (startScreenActive) return;
  if (previewIsolationActive) {
    setStartPreviewIsolation(false);
  }
}
function updateGrass(speed) {
  denseTimer += clock.getDelta();
  if (denseTimer > nextDenseTime) {
    denseFieldMode = !denseFieldMode;
    denseTimer = 0;
    nextDenseTime = 20 + Math.random() * 30;
  }
  // Dense mode spawns more grass
  const spawnChance = denseFieldMode ? 0.3 : 0.7;
  if (grasses.length < MAX_GRASS && Math.random() > spawnChance) {
    spawnGrass();
  }
  for (let i = grasses.length - 1; i >= 0; i--) {
    const g = grasses[i];
    g.position.z += speed * WORLD_SPEED;
    g.position.x += roadCurve * 0.01; // follow road curve
    // slight wind sway
    g.rotation.z = Math.sin(clock.elapsedTime * 4 + i) * 0.05;
    if (g.position.z > 20) {
      scene.remove(g);
      grasses.splice(i, 1);
    }
  }
}
function updateLandscapeDecor(speed) {
  if (landscapeDecor.length < MAX_LANDSCAPE_DECOR && Math.random() < 0.1 * lowEndFactor) {
    spawnLandscapeDecor(Math.random() > 0.5 ? -1 : 1);
  }
  for (let i = landscapeDecor.length - 1; i >= 0; i--) {
    const item = landscapeDecor[i];
    item.position.z += speed * WORLD_SPEED;
    item.position.x += roadCurve * 0.015;
    if (item.position.z > 20) {
      scene.remove(item);
      landscapeDecor.splice(i, 1);
    }
  }
}
// =============================
// INTRO + IDLE
// =============================
// MAIN LOOP
// =============================
function animate() {
  requestAnimationFrame(animate);
  if (startScreenActive) {
    const startShowcaseConfig = getStartShowcaseConfig();
    if (previewSpinActive) {
      previewTime += 0.01;
      car.rotation.y += 0.01;
    }
    car.scale.setScalar(startShowcaseConfig.carScale);
    car.position.set(0, startShowcaseConfig.carY, startShowcaseConfig.carZ);
    camera.position.copy(startShowcaseConfig.cameraPosition);
    camera.lookAt(startShowcaseConfig.lookTarget);
    renderer.render(scene, camera);
    return;
  }
  if (launchTransition.active) {
    const elapsed = performance.now() - launchTransition.startedAt;
    const progress = Math.min(1, elapsed / launchTransition.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const carScale = THREE.MathUtils.lerp(launchTransition.startCarScale, 1, eased);
    const carY = THREE.MathUtils.lerp(launchTransition.startCarY, 0.1, eased);
    const carZ = THREE.MathUtils.lerp(launchTransition.startCarZ, 4, eased);
    const carRotY = THREE.MathUtils.lerp(launchTransition.startCarRotY, 0, eased);

    car.scale.setScalar(carScale);
    car.position.set(0, carY, carZ);
    car.rotation.set(0, carRotY, 0);

    camera.position.lerpVectors(
      launchTransition.startCameraPosition,
      baseCameraPosition,
      eased
    );
    camera.rotation.x = THREE.MathUtils.lerp(
      launchTransition.startCameraRotX,
      -0.35,
      eased
    );
    camera.rotation.y = 0;
    camera.rotation.z = 0;

    renderer.render(scene, camera);

    if (progress >= 1) {
      launchTransition.active = false;
      previewSpinActive = true;
      car.scale.setScalar(1);
      car.position.set(0, 0.1, 4);
      car.rotation.set(0, 0, 0);
      camera.position.copy(baseCameraPosition);
      camera.rotation.set(-0.35, 0, 0);
      running = true;
      playEngine();
    }
    return;
  }
  if (crashTransition.active) {
    const elapsed = performance.now() - crashTransition.startedAt;
    const progress = Math.min(1, elapsed / crashTransition.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const shake = (1 - progress) * 0.22;

    car.position.x = crashTransition.startCarPosition.x + Math.sin(progress * 28) * shake;
    car.position.y = crashTransition.startCarPosition.y + Math.sin(progress * Math.PI) * 0.42;
    car.position.z = crashTransition.startCarPosition.z - eased * 0.8;
    car.rotation.x = THREE.MathUtils.lerp(crashTransition.startCarRotation.x, -0.26, eased);
    car.rotation.y = THREE.MathUtils.lerp(crashTransition.startCarRotation.y, 0.55, eased);
    car.rotation.z = THREE.MathUtils.lerp(crashTransition.startCarRotation.z, -0.38, eased);

    camera.position.lerpVectors(
      crashTransition.startCameraPosition,
      new THREE.Vector3(baseCameraPosition.x, baseCameraPosition.y + 0.45, baseCameraPosition.z + 1.8),
      eased
    );
    camera.position.x += Math.sin(progress * 32) * shake * 0.55;
    camera.position.y += Math.cos(progress * 26) * shake * 0.45;
    camera.lookAt(car.position.x * 0.2, Math.max(0.3, car.position.y * 0.65), 2.5);
    renderer.render(scene, camera);

    if (progress >= 1) {
      finishCrashSequence();
    }
    return;
  }
  if (!running || paused) {
    renderer.render(scene, camera);
    return;
  }
  ensureGameplaySceneState();
  const delta = clock.getDelta();
  // train movement
  train1.position.z += 0.8;
  train2.position.z -= 0.8;
  if (train1.position.z > 50) {
    train1.position.z = -300;
  }
  if (train2.position.z < -300) {
    train2.position.z = 50;
  }
  if (jetActive) {
    jetTimer -= delta;
    if (jetTimer <= 0) {
      endJetPower();
    }
  } else if (landingSafeTimer > 0) {
    landingSafeTimer -= delta;
    if (landingSafeTimer < 0) landingSafeTimer = 0;
  }
  const speedMultiplier = jetActive ? JET_SPEED_MULTIPLIER : 1;
  const effectiveSpeed = (isTouching ? lockedSpeed : speed) * speedMultiplier;
  if (climateMode === "rainny") {
    rainEnabled = true;
    snowEnabled = false;
  } else if (climateMode === "mixed") {
    rainTimer += delta;
    if (rainTimer >= nextRainTime) {
      rainEnabled = !rainEnabled;
      rainTimer = 0;
      nextRainTime = rainEnabled ? (6 + Math.random() * 8) : (8 + Math.random() * 12);
      if (!rainEnabled) clearRainDrops();
    }
    snowEnabled = false;
  } else {
    rainEnabled = false;
    if (rainDrops.length > 0) clearRainDrops();
    snowEnabled = climateMode === "snow";
  }
  if (rainEnabled && rainDrops.length < MAX_RAIN) {
    for (let i = 0; i < 8; i++) {
      spawnRain();
    }
  }
  if (snowEnabled && snowFlakes.length < MAX_SNOW) {
    for (let i = 0; i < 4; i++) {
      spawnSnowFlake();
    }
  } else if (!snowEnabled && snowFlakes.length > 0) {
    clearSnowFlakes();
  }
  roadCurve += curveSpeed * curveDir;
  if (Math.abs(roadCurve) >= maxCurve) {
    roadCurve = THREE.MathUtils.clamp(roadCurve, -maxCurve, maxCurve);
    curveDir *= -1;
  }
  // ===== ROAD CURVE APPLY =====
  // Bend farther road segments more so the road visibly curves.
  const previewBend = 1.45;
  for (const seg of roadSegments) {
    const d = seg.userData.depth;
    seg.position.x = roadCurve + curveDir * previewBend * d * d;
  }
  for (const lineSeg of roadLineSegments) {
    const d = lineSeg.userData.depth;
    lineSeg.position.x = roadCurve + curveDir * previewBend * d * d + lineSeg.userData.offset;
  }
  updateSky();
  camera.rotation.z = -roadCurve * 0.02;
  updateBuildings(effectiveSpeed);
  updateStreetLights(effectiveSpeed, isNightNow);
  updateGrass(effectiveSpeed);
  updateLandscapeDecor(effectiveSpeed);
  // Score & Speed (0 → max 2)
  score++;
  level = Math.floor(score / 1000) + 1;
  document.getElementById("score").innerText = score;
  document.getElementById("level").innerText = level;
  document.getElementById("speed").innerText = (effectiveSpeed * WORLD_SPEED).toFixed(1);
  updateFarmland(effectiveSpeed);
  updateFireflies(effectiveSpeed);
  updateFireworks();
  if (climateMode === "night" && score >= nextNightFireworkScore) {
    spawnNightFirework();
    nextNightFireworkScore += 1000;
  }
  if (score >= nextJetScore) {
    if (!jetActive && jetPowers.length === 0) {
      spawnJetPower();
    }
    nextJetScore += 1000;
  }
  // =============================
  // SPAWN ROAD SIDE SHOPS
  // =============================
  if (Math.random() < 0.01) {
    const sideX = Math.random() > 0.5 ? -9 : 9;
    const r = Math.random();
    if (r < 0.25) spawnBurgerShop(sideX);
    else if (r < 0.5) spawnIceCreamShop(sideX);
    else if (r < 0.75) spawnTeaStall(sideX);
    else spawnPetrolBunk(sideX);
  }
  // Move shops
  for (let i = shops.length - 1; i >= 0; i--) {
    const s = shops[i];
    s.position.z += effectiveSpeed * WORLD_SPEED;
    s.position.x += roadCurve * 0.02;
    if (s.position.z > 20) {
      s.traverse(o => {
        if (o.material?.map) o.material.map.dispose();
        if (o.material) o.material.dispose();
        if (o.geometry) o.geometry.dispose();
      });
      scene.remove(s);
      shops.splice(i, 1);
    }
  }
  // ===== SPEED OSCILLATION (0.1 ↔ 0.3) =====
  if (isTouching) {
    speed = lockedSpeed; // 🚫 speed CANNOT change
  } else {
    speed += speedStep * speedDir;
    if (speed >= maxSpeed) {
      speed = maxSpeed;
      speedDir = -1;
    }
    if (speed <= minSpeed) {
      speed = minSpeed;
      speedDir = 1;
    }
  }
  if (countdownActive) speed = minSpeed;
  // ===== COUNTDOWN OBJECT UPDATE =====
  // ===== COUNTDOWN OBJECT UPDATE (FIXED) =====
  for (let i = countdownObjects.length - 1; i >= 0; i--) {
    const obj = countdownObjects[i];
    obj.position.z += effectiveSpeed * WORLD_SPEED;
    if (obj.position.z > 5) {
      scene.remove(obj);
      countdownObjects.splice(i, 1);
    }
  }
  // ✅ END countdown automatically
  if (countdownActive && countdownObjects.length === 0) {
    countdownActive = false;
  }
  // Lane movement follows curved road center
  const prevX = car.position.x;
  const laneWorldTargetX = targetX + roadCurve;
  car.position.x += (laneWorldTargetX - car.position.x) * laneSmoothness;
  const lateralDelta = car.position.x - prevX;
  const isDrifting = Math.abs(laneWorldTargetX - prevX) > 0.05;
  if (!isJumping) {
    const desiredYaw = THREE.MathUtils.clamp(-lateralDelta * 2.5 - roadCurve * 0.08, -0.22, 0.22);
    car.rotation.y += (desiredYaw - car.rotation.y) * 0.12;
  }
  // =============================
  // CAMERA SHAKE
  // =============================
  if (running && !isJumping && isDrifting) {
    const shakeStrength = 0.08; // increase for stronger shake
    camera.position.x = baseCameraPosition.x + (Math.random() - 0.5) * shakeStrength;
    camera.position.y = baseCameraPosition.y + (Math.random() - 0.5) * shakeStrength;
  } else {
    // Smoothly return to original position
    camera.position.lerp(baseCameraPosition, 0.1);
  }
  if (shakeTime > 0) {
    const falloff = shakeTime / 6;
    camera.position.x += (Math.random() - 0.5) * shakeIntensity * falloff;
    camera.position.y += (Math.random() - 0.5) * shakeIntensity * falloff;
    shakeTime--;
  }
  // Spawn smoke only if:
  // - Running
  // - Not jumping
  // - Actually drifting left/right
  if (running && !isJumping && isDrifting) {
    if (Math.random() < 0.4) { // control density
      spawnSmoke();
    }
  }
  // Idle bounce
  let baseY = 0.1 + Math.sin(score * 0.02) * 0.05;
  // Jump / Jet flight logic
  if (jetActive) {
    const flightY = baseY + JET_FLIGHT_HEIGHT;
    car.position.y += (flightY - car.position.y) * 0.1;
    car.rotation.x += (-0.08 - car.rotation.x) * 0.18;
    const wingFlap = 0.24 + Math.sin(clock.elapsedTime * 9) * 0.12;
    jetWingLeft.rotation.z = -wingFlap;
    jetWingRight.rotation.z = wingFlap;
  } else if (isJumping) {
    jumpVelocity -= gravity;
    car.position.y += jumpVelocity;
    if (!hasFlipped) {
      flipRotation += flipSpeed;
      car.rotation.x = flipRotation;
      if (flipRotation >= Math.PI * 2) {
        hasFlipped = true;
        car.rotation.x = 0;
      }
    }
    if (car.position.y <= baseY) {
      car.position.y = baseY;
      isJumping = false;
      flipRotation = 0;
      car.rotation.x = 0;
      shakeTime = 6;
    }
  } else if (car.position.y > baseY + 0.02) {
    // Smooth safe landing after jet mode.
    car.position.y += (baseY - car.position.y) * 0.1;
    car.rotation.x += (0 - car.rotation.x) * 0.2;
  } else {
    car.position.y = baseY;
    jetWingLeft.rotation.z += (0 - jetWingLeft.rotation.z) * 0.18;
    jetWingRight.rotation.z += (0 - jetWingRight.rotation.z) * 0.18;
  }
  wheels.forEach(w => w.rotation.x -= effectiveSpeed * 3);
  // Stars twinkle
  for (let i = 0; i < starTwinkle.length; i++) starTwinkle[i] += 0.01;
  starMat.opacity = 0.6 + Math.sin(score * 0.01) * 0.4;
  // Spawning (reduce obstacles at high speed)
  const normalizedSpeed = speed / maxSpeed;
  const obstacleRate = normalizedSpeed < 0.4 ? 0.03 : normalizedSpeed < 0.7 ? 0.02 : 0.01;
  if (Math.random() < obstacleRate && obstacles.length < MAX_OBSTACLES) spawnObstacle();
  if (clouds.length < MAX_CLOUDS && Math.random() < 0.02 * lowEndFactor) spawnCloud();
  if (trees.length < MAX_TREES && Math.random() < 0.08 * lowEndFactor) spawnTree(-1);
  if (trees.length < MAX_TREES && Math.random() < 0.08 * lowEndFactor) spawnTree(1);
  // Move jet powers
  for (let i = jetPowers.length - 1; i >= 0; i--) {
    const j = jetPowers[i];
    j.position.z += effectiveSpeed * WORLD_SPEED;
    j.position.x = roadCurve + j.userData.laneX;
    j.rotation.y += 0.08;
    const jetPulse = 1 + Math.sin(score * 0.07 + j.userData.pulseOffset) * 0.1;
    j.scale.set(jetPulse, jetPulse, jetPulse);
    if (running && !paused && !countdownActive && hit(car, j)) {
      scene.remove(j);
      jetPowers.splice(i, 1);
      activateJetPower();
      continue;
    }
    if (j.position.z > 10) {
      scene.remove(j);
      jetPowers.splice(i, 1);
    }
  }
  // Move obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.position.z += effectiveSpeed * WORLD_SPEED;
    o.position.x = roadCurve + o.userData.laneX;
    if (running && !paused && !countdownActive && hit(car, o)) {
      startCrashSequence();
      return;
    }
    if (o.position.z > 10) {
      scene.remove(o);
      obstacles.splice(i, 1);
    }
  }
  // Trees
  for (let i = trees.length - 1; i >= 0; i--) {
    const t = trees[i];
    t.position.z += effectiveSpeed * WORLD_SPEED;
    t.position.x += roadCurve * 0.02;
    if (t.position.z > 10) {
      scene.remove(t);
      trees.splice(i, 1);
    }
  }
  // Clouds
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    c.position.z += effectiveSpeed * 2;
    if (c.position.z > 20) {
      scene.remove(c);
      clouds.splice(i, 1);
    }
  }
  if (climateMode === "sunny" && birds.length < MAX_BIRDS && Math.random() < 0.015 * lowEndFactor) {
    spawnBird();
  }
  for (let i = birds.length - 1; i >= 0; i--) {
    const b = birds[i];
    b.position.z += effectiveSpeed * 1.6;
    b.position.x += b.userData.speed;
    b.position.y += Math.sin(clock.elapsedTime * 2 + b.userData.phase) * 0.01;
    const flap = Math.sin(clock.elapsedTime * 12 + b.userData.phase) * 0.55;
    b.userData.wings[0].rotation.z = flap;
    b.userData.wings[1].rotation.z = -flap;
    b.visible = climateMode === "sunny";
    if (b.position.z > 25 || b.position.x > 24 || b.position.x < -24) {
      scene.remove(b);
      birds.splice(i, 1);
    }
  }
  // Update smoke
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const s = smokeParticles[i];
    s.position.y += 0.02; // rise
    s.scale.multiplyScalar(1.03); // expand
    s.material.opacity -= 0.02;
    s.userData.life -= 0.02;
    if (s.userData.life <= 0) {
      scene.remove(s);
      smokeParticles.splice(i, 1);
    }
  }
  if (running && !isJumping && isDrifting) {
    if (Math.random() < 0.3) {
      spawnSmoke();
      spawnSkid();
    }
  }
  if ((speed > 0.1 || jetActive) && running && !isJumping) {
    flame.visible = true;
    flame.scale.y = jetActive ? (1.8 + Math.random() * 0.9) : (1 + Math.random() * 0.5);
  } else {
    flame.visible = false;
  }
  for (let i = rainDrops.length - 1; i >= 0; i--) {
    const drop = rainDrops[i];
    drop.position.y -= 0.4;
    drop.position.z += 0.05;
    if (drop.position.y < 0) {
      scene.remove(drop);
      rainDrops.splice(i, 1);
    }
  }
  for (let i = snowFlakes.length - 1; i >= 0; i--) {
    const flake = snowFlakes[i];
    flake.position.y -= 0.06;
    flake.position.z += 0.02;
    flake.position.x += flake.userData.drift;
    if (flake.position.y < 0 || flake.position.z > 30 || Math.abs(flake.position.x) > 16) {
      scene.remove(flake);
      snowFlakes.splice(i, 1);
    }
  }
  renderer.render(scene, camera);
}
animate();
renderer.domElement.addEventListener("webglcontextlost", event => {
  event.preventDefault();
});
renderer.domElement.addEventListener("webglcontextrestored", () => {
  activeResolutionQuality = applyResolutionQuality(activeResolutionQuality);
  syncRendererHost();
  renderer.render(scene, camera);
});
addEventListener("resize", () => {
  activeResolutionQuality = applyResolutionQuality(activeResolutionQuality);
  syncRendererHost();
});
addEventListener("orientationchange", () => {
  setTimeout(() => {
    activeResolutionQuality = applyResolutionQuality(activeResolutionQuality);
    syncRendererHost();
    renderer.render(scene, camera);
  }, 120);
});
addEventListener("pageshow", () => {
  activeResolutionQuality = applyResolutionQuality(activeResolutionQuality);
  syncRendererHost();
  renderer.render(scene, camera);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  requestAnimationFrame(() => {
    activeResolutionQuality = applyResolutionQuality(activeResolutionQuality);
    syncRendererHost();
    renderer.render(scene, camera);
  });
});
