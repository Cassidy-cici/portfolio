/* ============== 配置 ============== */
const CHAPTERS = [
  { id:'profile',  name:'角色档案',     pages:['1.png'] },
  { id:'persona',  name:'用户画像',     pages:['2.png','3.png'] },
  { id:'priconne', name:'公主连结',     pages:['4.png','5.png','6.png'] },
  { id:'case',     name:'案例介绍',     pages:['7.png','8.png','9.png','10.png','11.png','12.png','13.png','14.png'] },
  { id:'a3',       name:'A3!满开剧团',  pages:['15.png','16.png','17.png','18.png'] },
  { id:'ending',   name:'探索结算',     pages:['19.png'] },
];

const LANDMARKS = [
  { id: 'profile',  x: '16.11%', y: '27.89%', w: '17.85%', h: '35.92%' },
  { id: 'persona',  x: '39.31%', y: '24.93%', w: '14.31%', h: '23.38%' },
  { id: 'priconne', x: '58.82%', y: '23.66%', w: '18.61%', h: '33.1%'  },
  { id: 'case',     x: '50.21%', y: '56.9%',  w: '18.13%', h: '27.32%' },
  { id: 'a3',       x: '34.31%', y: '48.87%', w: '15.63%', h: '21.13%' },
  { id: 'ending',   x: '21.81%', y: '64.08%', w: '12.15%', h: '24.79%' },
];

const STORAGE_KEY     = 'portfolio_progress';
const HINT_KEY_MAP    = 'hint_map_profile_clicked';
const HINT_KEY_FINISH = 'hint_finish_clicked';

/* ============== 状态 ============== */
let progress = loadProgress();
let currentChapter = 0;
let currentPage = 0;

/* ============== 工具 ============== */
function loadProgress(){
  let d = { unlocked:['profile'] };
  try{
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(raw && Array.isArray(raw.unlocked)) d = raw;
  }catch(e){}
  if(!d.unlocked.includes('profile')) d.unlocked.push('profile');
  return d;
}
function saveProgress(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }

function showLoading(){
  const l = document.getElementById('loading');
  l.classList.remove('fade-out');
  l.classList.add('active');
}
function hideLoading(){
  const l = document.getElementById('loading');
  l.classList.add('fade-out');
  setTimeout(()=> l.classList.remove('active'), 400);
}

function preloadImages(srcList){
  return Promise.all(srcList.map(src => new Promise(res=>{
    const img = new Image();
    img.onload = img.onerror = () => res();
    img.src = src;
  })));
}

function silentPreloadNext(chapterIdx){
  const next = CHAPTERS[chapterIdx + 1];
  if(!next) return;
  next.pages.forEach(p => { new Image().src = `assets/${p}`; });
}

/* ============== 地图 ============== */
function renderMap(){
  const box = document.getElementById('landmarks');
  box.innerHTML = '';
  LANDMARKS.forEach(l => {
    const el = document.createElement('div');
    el.className = 'landmark';
    el.dataset.id = l.id;
    el.style.left = l.x; el.style.top = l.y;
    el.style.width = l.w; el.style.height = l.h;

    const unlocked = progress.unlocked.includes(l.id);
    if(!unlocked){
      el.classList.add('locked');
      const fog = document.createElement('div');
      fog.className = 'fog';
      el.appendChild(fog);
    }

    // 角色档案未点击过：显示聚光灯 + 手指
    if(l.id === 'profile' && !localStorage.getItem(HINT_KEY_MAP)){
      const spot = document.createElement('div');
      spot.className = 'spotlight';
      el.appendChild(spot);

      const hand = document.createElement('img');
      hand.src = 'assets/handclick.svg';
      hand.className = 'hand-hint hand-landmark';
      hand.alt = '';
      el.appendChild(hand);
    }

    el.addEventListener('click', () => {
      if(!progress.unlocked.includes(l.id)) return;
      if(l.id === 'profile'){
        localStorage.setItem(HINT_KEY_MAP, '1');
        const sp = el.querySelector('.spotlight'); if(sp) sp.remove();
        const hd = el.querySelector('.hand-hint'); if(hd) hd.remove();
      }
      const idx = CHAPTERS.findIndex(c=>c.id===l.id);
      enterChapter(idx);
    });
    box.appendChild(el);
  });
}

function unlockLandmark(id){
  if(progress.unlocked.includes(id)) return;
  progress.unlocked.push(id);
  saveProgress();
  const el = document.querySelector(`.landmark[data-id="${id}"]`);
  if(el){
    const fog = el.querySelector('.fog');
    if(fog){
      fog.classList.add('dissipate');
      setTimeout(()=>{ fog.remove(); el.classList.remove('locked'); }, 1500);
    }
  }
}

function playGoldFlash(){
  const flash = document.getElementById('goldFlash');
  if(!flash) return;
  flash.style.transition = 'none';
  flash.style.opacity = '0';
  void flash.offsetWidth;
  flash.style.transition = 'opacity .5s ease-out';
  flash.style.opacity = '1';
  setTimeout(()=>{
    flash.style.transition = 'opacity 1.5s ease-in';
    flash.style.opacity = '0';
  }, 500);
}

/* ============== 章节进入 ============== */
async function enterChapter(idx){
  currentChapter = idx;
  currentPage = 0;
  const ch = CHAPTERS[idx];
  showLoading();
  await preloadImages(ch.pages.map(p=>`assets/${p}`));
  hideLoading();
  silentPreloadNext(idx);
  showWork();
  loadPage();
}

function showWork(){
  hideAll();
  const work = document.getElementById('work');
  work.classList.remove('hidden');
  const c = document.getElementById('work-container');
  c.classList.remove('show','exit','peel-out','peel-in');
  void c.offsetWidth;
  requestAnimationFrame(()=> c.classList.add('show'));
}

/* 🆕 彻底重置手指状态：先隐藏 + 清空所有内联样式，防止缓存残留 */
function resetHandFinish(){
  const hand = document.getElementById('hand-finish');
  if(!hand) return;
  hand.classList.add('hidden');
  hand.style.cssText = ''; // 清空所有内联样式
}

/* 🆕 把手指定位到「下一页/完成」按钮中心，尺寸 = 按钮宽度的 23% */
function positionHandFinish(){
  const hand = document.getElementById('hand-finish');
  const btn  = document.getElementById('next-btn');
  const container = document.getElementById('work-container');
  if(!hand || !btn || !container) return;

  const btnRect = btn.getBoundingClientRect();
  const ctRect  = container.getBoundingClientRect();

  // 按钮未渲染时退出等待下一帧
  if(btnRect.width === 0){
    requestAnimationFrame(positionHandFinish);
    return;
  }

  const size = Math.max(16, Math.round(btnRect.width * 0.23)); // 🆕 按钮宽度的 23%
  const centerX = btnRect.left - ctRect.left + btnRect.width  / 2;
  const centerY = btnRect.top  - ctRect.top  + btnRect.height / 2;

  // 用 left/top + transform 居中，覆盖掉 CSS 中的 right/bottom
  hand.style.right     = 'auto';
  hand.style.bottom    = 'auto';
  hand.style.left      = `${centerX}px`;
  hand.style.top       = `${centerY}px`;
  hand.style.width     = `${size}px`;
  hand.style.height    = `${size}px`;
  hand.style.transform = 'translate(-50%, -50%)';
  hand.style.animation = 'handTap 1.2s ease-in-out infinite';
}

function loadPage(){
  const ch = CHAPTERS[currentChapter];
  const img = document.getElementById('work-img');
  img.classList.remove('fit-viewport');
  img.src = `assets/${ch.pages[currentPage]}`;

  img.onload = () => {
    const container = document.getElementById('work-container');
    const ratioImg   = img.naturalHeight / img.naturalWidth;
    const ratioFrame = container.clientHeight / container.clientWidth;
    if(ratioImg > ratioFrame * 1.05){
      img.classList.add('fit-viewport');
    }else{
      img.classList.remove('fit-viewport');
    }
    container.scrollTop = 0;
  };

  const prev = document.getElementById('prev-btn');
  const next = document.getElementById('next-btn');
  prev.style.display = currentPage === 0 ? 'none' : 'block';
  next.textContent = (currentPage === ch.pages.length - 1) ? '完成' : '下一页 ▶';

  // 🆕 第一步：无论如何先彻底重置手指（关键修复，解决缓存残留 & 其他页残留）
  resetHandFinish();

  // 🆕 第二步：严格判断，仅当「profile 章节 + 1.png + 未点击过完成」才显示
  const currentPageName = ch.pages[currentPage];
  const shouldShowHand = (ch.id === 'profile')
                      && (currentPage === 0)
                      && (currentPageName === '1.png')
                      && !localStorage.getItem(HINT_KEY_FINISH);

  if(shouldShowHand){
    const handFinish = document.getElementById('hand-finish');
    if(handFinish){
      handFinish.classList.remove('hidden');
      // 等待两帧：确保容器 show 动画完成 + 按钮渲染就位，再定位
      requestAnimationFrame(()=> {
        requestAnimationFrame(()=> positionHandFinish());
      });
    }
  }

  if(ch.id === 'ending') launchConfetti(3500);
}

function flipPage(dir){
  const c = document.getElementById('work-container');
  // 🆕 翻页时立即重置手指，避免动画过程中闪现
  resetHandFinish();
  c.classList.add('peel-out');
  setTimeout(()=>{
    currentPage += dir;
    loadPage();
    c.classList.remove('peel-out');
    c.classList.add('peel-in');
    setTimeout(()=> c.classList.remove('peel-in'), 700);
  }, 700);
}

/* 解锁下一章地标（next 和 close 两处共用） */
function unlockNextIfLastPage(){
  const ch = CHAPTERS[currentChapter];
  const isLastPage = currentPage === ch.pages.length - 1;
  if(!isLastPage) return;
  const nextCh = CHAPTERS[currentChapter + 1];
  if(nextCh) setTimeout(()=> unlockLandmark(nextCh.id), 400);
  if(ch.id === 'a3'){
    CHAPTERS.forEach(c => unlockLandmark(c.id));
  }
}

function finishChapter(){
  exitWork(()=>{
    goToMap();
    playGoldFlash();
    unlockNextIfLastPage();
  });
}

function exitWork(cb){
  const c = document.getElementById('work-container');
  // 🆕 退出作品页时清除手指状态
  resetHandFinish();
  c.classList.remove('show');
  c.classList.add('exit');
  setTimeout(()=>{
    document.getElementById('work').classList.add('hidden');
    c.classList.remove('exit');
    cb && cb();
  }, 1000);
}

/* ============== 切页 ============== */
function goToMap(){
  hideAll();
  document.getElementById('map').classList.remove('hidden');
  renderMap();
}
function hideAll(){
  ['map','work'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
}

/* ============== 礼花 ============== */
function launchConfetti(duration = 3500) {
  const canvas = document.getElementById('confetti');
  if(!canvas) return;
  canvas.width = innerWidth; canvas.height = innerHeight;
  const ctx = canvas.getContext('2d');

  const colors = ['#f4e4c1','#e8b870','#c9534c','#6b8e5a','#5a7fa8','#c98b3b'];
  const pieces = Array.from({ length: 180 }, () => ({
    x: Math.random() * innerWidth,
    y: -Math.random() * innerHeight,
    w: 6 + Math.random() * 6,
    h: 10 + Math.random() * 10,
    c: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 3,
    vx: -1 + Math.random() * 2,
    rot: Math.random() * Math.PI,
    vr: -0.1 + Math.random() * 0.2,
  }));

  const start = performance.now();
  function frame(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    if (t - start < duration) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}

/* ============== 重置 ============== */
function resetProgress(){
  if(!confirm('确定要重新探索吗？所有解锁进度将被清除。')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(HINT_KEY_MAP);
  localStorage.removeItem(HINT_KEY_FINISH);
  progress = { unlocked:['profile'] };
  saveProgress();
  renderMap();
}

/* ============== 事件绑定 ============== */
function bindEvents(){
  // 下一页 / 完成
  document.getElementById('next-btn').addEventListener('click', () => {
    const ch = CHAPTERS[currentChapter];
    // 点击完成按钮后记录：下次不再显示手指
    if(ch.id === 'profile' && currentPage === 0){
      localStorage.setItem(HINT_KEY_FINISH, '1');
      resetHandFinish();
    }
    if(currentPage < ch.pages.length - 1){
      flipPage(1);
    }else{
      finishChapter();
    }
  });

  // 上一页
  document.getElementById('prev-btn').addEventListener('click', () => {
    if(currentPage > 0) flipPage(-1);
  });

  // 关闭按钮
  document.getElementById('close-btn').addEventListener('click', () => {
    const ch = CHAPTERS[currentChapter];
    if(ch.id === 'profile' && currentPage === 0){
      localStorage.setItem(HINT_KEY_FINISH, '1');
    }
    exitWork(()=>{
      goToMap();
      playGoldFlash();
      unlockNextIfLastPage();
    });
  });

  // 重置
  const resetBtn = document.getElementById('reset-btn');
  if(resetBtn) resetBtn.addEventListener('click', resetProgress);

  // 窗口尺寸变化时重新对齐手指
  window.addEventListener('resize', () => {
    const hf = document.getElementById('hand-finish');
    if(hf && !hf.classList.contains('hidden')) positionHandFinish();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  goToMap();
  hideLoading();
});
