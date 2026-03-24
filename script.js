/* =========================
   Supabase
========================= */
const SUPABASE_URL = "https://zsvsbrkphrbxazjordss.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_KEY_HERE";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================
   SVG 경로
========================= */
const FLOWER_PATHS = [
  "assets/flower01.svg","assets/flower02.svg","assets/flower03.svg",
  "assets/flower04.svg","assets/flower05.svg","assets/flower06.svg","assets/flower07.svg",
];
const STEM_PATHS = [
  "assets/stem01.svg","assets/stem02.svg","assets/stem03.svg",
  "assets/stem04.svg","assets/stem05.svg","assets/stem06.svg","assets/stem07.svg",
];
const POT_PATHS = [
  "assets/pot01.svg","assets/pot02.svg","assets/pot03.svg",
  "assets/pot04.svg","assets/pot05.svg","assets/pot06.svg","assets/pot07.svg",
];

/* =========================
   상태
========================= */
let pots = [];
let selected = { flowerIdx:-1, stemIdx:-1, potIdx:-1 };

let camX = 0;
let camY = 0;
let isPanning = false;
let lastTouchX = 0;
let lastTouchY = 0;

let pinnedIndex = -1;
let pinnedExpireAt = 0;
const PIN_DURATION = 2500;

let BASE_SIZE = 80;

/* 이미지 버퍼 */
let FLOWERS = new Array(7).fill(null);
let STEMS   = new Array(7).fill(null);
let POTS    = new Array(7).fill(null);

/* =========================
   DOM
========================= */
const panel = document.getElementById("panel");
const dropdownBtn = document.getElementById("dropdownBtn");
const sendBtn = document.getElementById("sendBtn");

const tooltip   = document.getElementById("tooltip");
const nameInput = document.getElementById("name");
const msgInput  = document.getElementById("msg");

const prevFlower = document.getElementById("prevFlower");
const prevStem   = document.getElementById("prevStem");
const prevPot    = document.getElementById("prevPot");

const modal = document.getElementById("modal");
const modalClose = document.getElementById("modalClose");

/* =========================
   공통
========================= */
function isMobile(){
  return window.matchMedia("(max-width: 768px)").matches;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   패널 토글
========================= */
function syncToggleButtons(){
  const isOpen = panel.classList.contains("open");

  if(dropdownBtn){
    dropdownBtn.textContent = isMobile()
      ? (isOpen ? "▼" : "▲")
      : (isOpen ? "▲" : "▼");
  }
}

function togglePanel(e){
  if(e){
    e.preventDefault();
    e.stopPropagation();
  }
  panel.classList.toggle("open");
  syncToggleButtons();
}

dropdownBtn?.addEventListener("click", togglePanel);
dropdownBtn?.addEventListener("touchstart", togglePanel, { passive:false });

/* =========================
   모달
========================= */
function openModal(){
  modal?.classList.add("show");
}
function closeModal(){
  modal?.classList.remove("show");
}

modalClose?.addEventListener("click", closeModal);
modalClose?.addEventListener("touchstart", (e)=>{
  e.preventDefault();
  closeModal();
}, { passive:false });

modal?.addEventListener("click", (e)=>{
  if(e.target === modal) closeModal();
});

/* =========================
   프리뷰
========================= */
function updatePreview(){
  if(!prevFlower || !prevStem || !prevPot) return;

  if(selected.flowerIdx === -1){
    prevFlower.style.display = "none";
  } else {
    prevFlower.style.display = "block";
    prevFlower.src = FLOWER_PATHS[selected.flowerIdx];
  }

  if(selected.stemIdx === -1){
    prevStem.style.display = "none";
  } else {
    prevStem.style.display = "block";
    prevStem.src = STEM_PATHS[selected.stemIdx];
  }

  if(selected.potIdx === -1){
    prevPot.style.display = "none";
  } else {
    prevPot.style.display = "block";
    prevPot.src = POT_PATHS[selected.potIdx];
  }
}
updatePreview();

/* =========================
   옵션 선택
========================= */
document.querySelectorAll(".options").forEach((row)=>{
  row.addEventListener("click",(e)=>{
    const btn = e.target.closest(".option");
    if(!btn) return;

    const type = row.dataset.type;
    row.querySelectorAll(".option").forEach(el => el.classList.remove("selected"));
    btn.classList.add("selected");

    selected[type + "Idx"] = parseInt(btn.dataset.value, 10);
    updatePreview();
  });
});

/* =========================
   크기 / 충돌
========================= */
function updateBaseSize(){
  const raw = height * 0.07;
  BASE_SIZE = constrain(raw, 60, 120);
}

function isOverlapping(x, y){
  const hitW = BASE_SIZE * 1.6;
  const hitH = BASE_SIZE * 3.0;

  for(const p of pots){
    if(Math.abs(x - p.x) < hitW && Math.abs(y - p.y) < hitH){
      return true;
    }
  }
  return false;
}

/* =========================
   DB 불러오기
========================= */
async function loadFromSupabase(){
  const { data, error } = await sb
    .from("pots")
    .select("*")
    .order("created_at", { ascending: true });

  if(error){
    console.error("Supabase load error:", error);
    return;
  }

  pots = (data || []).map(p => ({
    x: p.x,
    y: p.y,
    flowerIdx: p.flower_idx,
    stemIdx: p.stem_idx,
    potIdx: p.pot_idx,
    name: p.name,
    msg: p.msg
  }));
}

/* =========================
   전송
========================= */
async function handleSend(e){
  if(e){
    e.preventDefault();
    e.stopPropagation();
  }

  if(selected.flowerIdx === -1 || selected.stemIdx === -1 || selected.potIdx === -1){
    openModal();
    return;
  }

  let x, y, attempts = 0;

  do{
    x = random(160, width - 160) - camX;
    y = random(260, height - 120) - camY;
    attempts++;
  } while(isOverlapping(x, y) && attempts < 250);

  const newPot = {
    x,
    y,
    flowerIdx: selected.flowerIdx,
    stemIdx: selected.stemIdx,
    potIdx: selected.potIdx,
    name: nameInput.value.trim() || "익명",
    msg: msgInput.value.trim() || ""
  };

  /* 화면에는 바로 추가 */
  pots.push(newPot);

  /* DB 저장 */
  const { error } = await sb.from("pots").insert([{
    x: newPot.x,
    y: newPot.y,
    flower_idx: newPot.flowerIdx,
    stem_idx: newPot.stemIdx,
    pot_idx: newPot.potIdx,
    name: newPot.name,
    msg: newPot.msg
  }]);

  if(error){
    console.error("Supabase insert error:", error);
  }

  pinnedIndex = pots.length - 1;
  pinnedExpireAt = millis() + PIN_DURATION;

  panel.classList.remove("open");
  syncToggleButtons();

  nameInput.value = "";
  msgInput.value = "";

  selected = { flowerIdx:-1, stemIdx:-1, potIdx:-1 };
  document.querySelectorAll(".option.selected").forEach(el => el.classList.remove("selected"));
  updatePreview();
}

sendBtn?.addEventListener("click", handleSend);
sendBtn?.addEventListener("touchstart", handleSend, { passive:false });

/* =========================
   preload
========================= */
function preload(){
  const safeLoad = (path, arr, i)=>{
    loadImage(
      path,
      img => arr[i] = img,
      err => {
        console.error("Image load error:", path, err);
        arr[i] = null;
      }
    );
  };

  for(let i=0;i<7;i++){
    safeLoad(FLOWER_PATHS[i], FLOWERS, i);
    safeLoad(STEM_PATHS[i], STEMS, i);
    safeLoad(POT_PATHS[i], POTS, i);
  }
}

/* =========================
   setup / resize
========================= */
function setup(){
  const stage = document.querySelector(".stage");
  const c = createCanvas(stage.clientWidth, stage.clientHeight);
  c.parent("canvas");

  pixelDensity(2);
  imageMode(CENTER);

  updateBaseSize();
  syncToggleButtons();
  loadFromSupabase();
}

function windowResized(){
  const stage = document.querySelector(".stage");
  resizeCanvas(stage.clientWidth, stage.clientHeight);
  updateBaseSize();
}

/* =========================
   히트 테스트
========================= */
function hitTestPot(screenX, screenY){
  const wx = screenX - camX;
  const wy = screenY - camY;

  for(let i = pots.length - 1; i >= 0; i--){
    const p = pots[i];

    const within =
      wx > p.x - BASE_SIZE * 0.75 &&
      wx < p.x + BASE_SIZE * 0.75 &&
      wy > p.y - BASE_SIZE * 2.1 &&
      wy < p.y + BASE_SIZE * 0.25;

    if(within) return i;
  }

  return -1;
}

/* =========================
   draw
========================= */
function draw(){
  background("#e5e3e3");

  if(pinnedIndex !== -1 && millis() > pinnedExpireAt){
    pinnedIndex = -1;
  }

  push();
  translate(camX, camY);

  for(let i=0;i<pots.length;i++){
    drawPot(pots[i]);
  }

  pop();

  let showIndex = -1;

  if(!isMobile()){
    const hovered = hitTestPot(mouseX, mouseY);
    showIndex = hovered !== -1 ? hovered : pinnedIndex;
  } else {
    showIndex = pinnedIndex;
  }

  renderTooltip(showIndex);
}

function renderTooltip(index){
  if(!tooltip) return;

  if(index === -1 || !pots[index]){
    tooltip.style.display = "none";
    return;
  }

  const p = pots[index];

  if(!p.msg && (!p.name || p.name === "익명")){
    tooltip.style.display = "none";
    return;
  }

  const sx = p.x + camX;
  const sy = p.y + camY;

  tooltip.style.display = "block";
  tooltip.style.left = `${sx + BASE_SIZE * 0.55}px`;
  tooltip.style.top  = `${sy - BASE_SIZE * 2.05}px`;
  tooltip.innerHTML = `
    <div class="msg">${escapeHtml(p.msg || "")}</div>
    <div class="from">from. ${escapeHtml(p.name || "익명")}</div>
  `;
}

/* =========================
   화분 그리기
========================= */
function drawImageKeepRatio(img, x, y, targetW){
  if(!img || img.width === 0 || img.height === 0) return;
  const ratio = img.height / img.width;
  image(img, x, y, targetW, targetW * ratio);
}

function drawPot(p){
  if(
    p.flowerIdx == null || p.stemIdx == null || p.potIdx == null ||
    !FLOWERS[p.flowerIdx] || !STEMS[p.stemIdx] || !POTS[p.potIdx]
  ){
    return;
  }

  push();
  translate(p.x, p.y);

  const BASE = BASE_SIZE;

  drawImageKeepRatio(POTS[p.potIdx],       0,  BASE * 0.048, BASE);
  drawImageKeepRatio(STEMS[p.stemIdx],     0, -BASE * 1.00,  BASE);
  drawImageKeepRatio(FLOWERS[p.flowerIdx], 0, -BASE * 1.90,  BASE);

  pop();
}

/* =========================
   UI 클릭/터치 판별
========================= */
function isUIElementAtClient(clientX, clientY){
  const el = document.elementFromPoint(clientX, clientY);

  return !!(el && (
    el.closest(".panel") ||
    el.closest(".preview-panel") ||
    el.closest(".modal") ||
    el.closest(".mobile-fab") ||
    el.closest("input") ||
    el.closest("textarea") ||
    el.closest("button") ||
    el.closest(".option")
  ));
}

/* =========================
   데스크톱 마우스
========================= */
function mousePressed(event){
  const clientX = event?.clientX ?? 0;
  const clientY = event?.clientY ?? 0;

  if(isUIElementAtClient(clientX, clientY)){
    isPanning = false;
    return;
  }

  const hit = hitTestPot(mouseX, mouseY);
  if(hit !== -1){
    pinnedIndex = hit;
    pinnedExpireAt = millis() + PIN_DURATION;
    isPanning = false;
    return false;
  }

  isPanning = true;
  return false;
}

function mouseDragged(){
  if(!isPanning) return;
  camX += movedX;
  camY += movedY;
  return false;
}

function mouseReleased(){
  isPanning = false;
}

/* =========================
   모바일 터치
========================= */
function touchStarted(event){
  const touch = event?.touches?.[0] || event?.changedTouches?.[0];

  if(!touch){
    isPanning = false;
    return;
  }

  const clientX = touch.clientX;
  const clientY = touch.clientY;

  if(isUIElementAtClient(clientX, clientY)){
    isPanning = false;
    return;
  }

  const hit = hitTestPot(clientX, clientY);
  if(hit !== -1){
    pinnedIndex = hit;
    pinnedExpireAt = millis() + PIN_DURATION;
  }

  isPanning = true;
  lastTouchX = clientX;
  lastTouchY = clientY;

  return false;
}

function touchMoved(event){
  if(!isPanning) return;

  const touch = event?.touches?.[0] || event?.changedTouches?.[0];
  if(!touch) return;

  const clientX = touch.clientX;
  const clientY = touch.clientY;

  camX += clientX - lastTouchX;
  camY += clientY - lastTouchY;

  lastTouchX = clientX;
  lastTouchY = clientY;

  return false;
}

function touchEnded(){
  isPanning = false;
}
