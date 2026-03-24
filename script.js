let pots = [];
let selected = { flowerIdx:-1, stemIdx:-1, potIdx:-1 };

let camX = 0, camY = 0;
let camX = 0;
let camY = 0;
let isPanning = false;
let lastTouchX = 0;
let lastTouchY = 0;
@@ -56,7 +57,9 @@ function isMobile(){
  return window.matchMedia("(max-width: 768px)").matches;
}

/* cursor */
/* =========================
   커서
========================= */
function moveCursorTo(x, y){
  if(!cursorEl) return;
  cursorEl.style.left = `${x}px`;
@@ -71,7 +74,9 @@ window.addEventListener("pointerdown", (e)=>{
  moveCursorTo(e.clientX, e.clientY);
});

/* panel */
/* =========================
   패널 토글
========================= */
function syncToggleButtons(){
  const isOpen = panel.classList.contains("open");

@@ -120,9 +125,16 @@ mobileSheetBackdrop?.addEventListener("touchstart", (e)=>{
  closePanel();
}, { passive:false });

/* modal */
function openModal(){ modal?.classList.add("show"); }
function closeModal(){ modal?.classList.remove("show"); }
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
@@ -134,7 +146,9 @@ modal?.addEventListener("click", (e)=>{
  if(e.target === modal) closeModal();
});

/* preview */
/* =========================
   프리뷰
========================= */
function updatePreview(){
  if(selected.flowerIdx === -1){
    prevFlower.style.display = "none";
@@ -159,7 +173,9 @@ function updatePreview(){
}
updatePreview();

/* selection */
/* =========================
   옵션 선택
========================= */
document.querySelectorAll(".options").forEach((row)=>{
  row.addEventListener("click", (e)=>{
    e.stopPropagation();
@@ -168,7 +184,7 @@ document.querySelectorAll(".options").forEach((row)=>{
    if(!btn) return;

    const type = row.dataset.type;
    row.querySelectorAll(".option").forEach(el=>el.classList.remove("selected"));
    row.querySelectorAll(".option").forEach(el => el.classList.remove("selected"));
    btn.classList.add("selected");

    selected[type + "Idx"] = parseInt(btn.dataset.value, 10);
@@ -180,6 +196,9 @@ document.querySelectorAll(".options").forEach((row)=>{
  }, { passive:true });
});

/* =========================
   크기/충돌
========================= */
function updateBaseSize(){
  const raw = height * 0.07;
  BASE_SIZE = constrain(raw, 60, 120);
@@ -197,6 +216,9 @@ function isOverlapping(x, y){
  return false;
}

/* =========================
   Supabase 불러오기
========================= */
async function loadFromSupabase(){
  const { data, error } = await sb
    .from("pots")
@@ -219,7 +241,9 @@ async function loadFromSupabase(){
  }));
}

/* send */
/* =========================
   전송
========================= */
async function handleSend(e){
  if(e){
    e.preventDefault();
@@ -240,7 +264,8 @@ async function handleSend(e){
  } while(isOverlapping(x, y) && attempts < 250);

  const newPot = {
    x, y,
    x,
    y,
    flowerIdx: selected.flowerIdx,
    stemIdx: selected.stemIdx,
    potIdx: selected.potIdx,
@@ -271,16 +296,19 @@ async function handleSend(e){
  msgInput.value = "";

  selected = { flowerIdx:-1, stemIdx:-1, potIdx:-1 };
  document.querySelectorAll(".option.selected").forEach(el=>el.classList.remove("selected"));
  document.querySelectorAll(".option.selected").forEach(el => el.classList.remove("selected"));
  updatePreview();
}

sendBtn?.addEventListener("click", handleSend);
sendBtn?.addEventListener("touchstart", handleSend, { passive:false });

/* =========================
   p5 preload/setup
========================= */
function preload(){
  const safeLoad = (path, arr, i)=>{
    loadImage(path, img=>arr[i]=img, ()=>arr[i]=null);
    loadImage(path, img => arr[i] = img, () => arr[i] = null);
  };

  for(let i=0;i<7;i++){
@@ -316,6 +344,9 @@ function windowResized(){
  syncToggleButtons();
}

/* =========================
   draw
========================= */
function draw(){
  background("#e5e3e3");

@@ -335,8 +366,8 @@ function draw(){
    drawPot(p);

    if(
      wx > p.x - BASE_SIZE*0.75 && wx < p.x + BASE_SIZE*0.75 &&
      wy > p.y - BASE_SIZE*2.1 && wy < p.y + BASE_SIZE*0.2
      wx > p.x - BASE_SIZE * 0.75 && wx < p.x + BASE_SIZE * 0.75 &&
      wy > p.y - BASE_SIZE * 2.1  && wy < p.y + BASE_SIZE * 0.2
    ){
      hovered = i;
    }
@@ -358,15 +389,18 @@ function draw(){
    const sy = p.y + camY;

    tooltip.style.display = "block";
    tooltip.style.left = `${sx + BASE_SIZE*0.5}px`;
    tooltip.style.top  = `${sy - BASE_SIZE*2.1}px`;
    tooltip.style.left = `${sx + BASE_SIZE * 0.5}px`;
    tooltip.style.top  = `${sy - BASE_SIZE * 2.1}px`;
    tooltip.innerHTML = `
      <div class="msg">${escapeHtml(p.msg || "")}</div>
      <div class="from">from. ${escapeHtml(p.name || "익명")}</div>
    `;
  }
}

/* =========================
   화분 그리기
========================= */
function drawImageKeepRatio(img, x, y, targetW){
  if(!img || img.width === 0 || img.height === 0) return;
  const ratio = img.height / img.width;
@@ -379,110 +413,114 @@ function drawPot(p){

  const BASE = BASE_SIZE;

  drawImageKeepRatio(POTS[p.potIdx],       0,  BASE*0.048, BASE);
  drawImageKeepRatio(STEMS[p.stemIdx],     0, -BASE*1.00, BASE);
  drawImageKeepRatio(FLOWERS[p.flowerIdx], 0, -BASE*1.90, BASE);
  drawImageKeepRatio(POTS[p.potIdx],       0,  BASE * 0.048, BASE);
  drawImageKeepRatio(STEMS[p.stemIdx],     0, -BASE * 1.00,  BASE);
  drawImageKeepRatio(FLOWERS[p.flowerIdx], 0, -BASE * 1.90,  BASE);

  pop();
}

/* =========================
   UI 터치/클릭 판별
========================= */
function isUIElementAtClient(clientX, clientY){
  const el = document.elementFromPoint(clientX, clientY);

  return !!(el && (
    el.closest(".panel") ||
    el.closest(".preview-panel") ||
    el.closest(".modal") ||
    el.closest(".mobile-fab")
    el.closest(".mobile-fab") ||
    el.closest("input") ||
    el.closest("textarea") ||
    el.closest("button") ||
    el.closest(".option")
  ));
}

/* desktop drag */
/* =========================
   데스크탑 마우스
========================= */
function mousePressed(event){
  const clientX = event?.clientX ?? 0;
  const clientY = event?.clientY ?? 0;

  if(isUIElementAtClient(clientX, clientY)) return false;
  if(isUIElementAtClient(clientX, clientY)){
    isPanning = false;
    return;
  }

  isPanning = true;
  return false;
}

function mouseDragged(){
  if(!isPanning) return false;
  if(!isPanning) return;
  camX += movedX;
  camY += movedY;
  return false;
}

function mouseReleased(){
  isPanning = false;
  return false;
}

/* mobile touch */
function touchStarted(){
  if(!touches || touches.length === 0) return false;

  const tx = touches[0].x;
  const ty = touches[0].y;
  const clientX = touches[0].winX ?? tx;
  const clientY = touches[0].winY ?? ty;

  if(isUIElementAtClient(clientX, clientY)) return false;
/* =========================
   모바일 터치
========================= */
function touchStarted(event){
  const touch = event?.touches?.[0] || event?.changedTouches?.[0];

  let tappedIndex = -1;

  for(let i=0;i<pots.length;i++){
    const p = pots[i];
    const wx = tx - camX;
    const wy = ty - camY;

    if(
      wx > p.x - BASE_SIZE*0.75 && wx < p.x + BASE_SIZE*0.75 &&
      wy > p.y - BASE_SIZE*2.1 && wy < p.y + BASE_SIZE*0.2
    ){
      tappedIndex = i;
      break;
    }
  if(!touch){
    isPanning = false;
    return;
  }

  if(tappedIndex !== -1){
    pinnedIndex = tappedIndex;
    pinnedExpireAt = millis() + 2500;
  const clientX = touch.clientX;
  const clientY = touch.clientY;

  if(isUIElementAtClient(clientX, clientY)){
    isPanning = false;
    return;
  }

  isPanning = true;
  lastTouchX = tx;
  lastTouchY = ty;
  lastTouchX = clientX;
  lastTouchY = clientY;

  return false;
}

function touchMoved(){
  if(!isPanning || !touches || touches.length === 0) return false;
function touchMoved(event){
  if(!isPanning) return;

  const tx = touches[0].x;
  const ty = touches[0].y;
  const touch = event?.touches?.[0] || event?.changedTouches?.[0];
  if(!touch) return;

  camX += tx - lastTouchX;
  camY += ty - lastTouchY;
  const clientX = touch.clientX;
  const clientY = touch.clientY;

  lastTouchX = tx;
  lastTouchY = ty;
  camX += clientX - lastTouchX;
  camY += clientY - lastTouchY;

  lastTouchX = clientX;
  lastTouchY = clientY;

  return false;
}

function touchEnded(){
  isPanning = false;
  return false;
}

/* =========================
   문자열 이스케이프
========================= */
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
