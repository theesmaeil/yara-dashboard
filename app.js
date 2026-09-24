/* ============================================================
   یارا (Yara) — Application Logic v1.0.0
   Local-First  •  Multi-View  •  Customizable  •  Auto-Update
   ============================================================ */
(() => {
'use strict';

/* ==================== CONSTANTS ==================== */
const APP_VERSION  = '1.0.0';
const UPDATE_URL   = 'https://raw.githubusercontent.com/theesmaeil/yara-dashboard/main/updates.xml';
const CHANGELOG_URL= 'https://raw.githubusercontent.com/theesmaeil/yara-dashboard/main/CHANGELOG.md';

/* ==================== HELPERS ==================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const LS = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('yara.' + k)); return v ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem('yara.' + k, JSON.stringify(v)); },
  del(k)    { localStorage.removeItem('yara.' + k); }
};

const FA = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
const toFa = (s) => String(s).replace(/[0-9]/g, d => FA[+d]);
const pad  = (n) => String(n).padStart(2, '0');
const esc  = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (n, c = 'ic') => `<svg class="${c}"><use href="#i-${n}"/></svg>`;
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function toast(msg, ic = 'check-circle') {
  const t = $('#toast');
  $('#toastText').textContent = msg;
  t.querySelector('svg use').setAttribute('href', '#i-' + ic);
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ==================== SETTINGS ==================== */
const DEFAULT_SETTINGS = {
  theme: 'system',
  fontSize: 2,
  accent: '#6366f1',
  sidebarCollapsed: false,
  background: 'default',
  soundEnabled: true,
  notificationsEnabled: false,
  autoTheme: false,
  widgets: {
    clock:true, weather:true, quote:true, worldclock:true, pomodoro:true,
    'stats-quick':true, goals:true, quicklinks:true, progress:true,
    habits:true, todo:true, notes:true, bookmarks:true
  },
  menu: [
    { id:'home',      label:'داشبورد',    icon:'home',         visible:true },
    { id:'tasks',     label:'کارها',       icon:'check-circle', visible:true },
    { id:'notes',     label:'یادداشت‌ها', icon:'file-text',    visible:true },
    { id:'bookmarks', label:'بوکمارک‌ها',  icon:'bookmark',     visible:true },
    { id:'calendar',  label:'تقویم',       icon:'calendar',     visible:true },
    { id:'habits',    label:'عادت‌ها',     icon:'flame',        visible:true },
    { id:'stats',     label:'آمار',        icon:'bar-chart',    visible:true }
  ]
};

const FS_SIZES  = ['xs','sm','md','lg','xl'];
const FS_LABELS = ['XS','S','M','L','XL'];
const ACCENT_PRESETS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#0ea5e9'];

let S = LS.get('settings', null);
if (!S) { S = structuredClone(DEFAULT_SETTINGS); LS.set('settings', S); }
S = { ...structuredClone(DEFAULT_SETTINGS), ...S, widgets: { ...DEFAULT_SETTINGS.widgets, ...(S.widgets || {}) } };

const saveSettings = () => LS.set('settings', S);

const hexToRgba = (hex, a) => {
  const h = hex.replace('#','');
  return `rgba(${parseInt(h.substr(0,2),16)},${parseInt(h.substr(2,2),16)},${parseInt(h.substr(4,2),16)},${a})`;
};

function applySettings() {
  const hour = new Date().getHours();
  let theme = S.theme;
  if (S.autoTheme) theme = (hour >= 19 || hour < 6) ? 'dark' : 'light';
  const isDark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  $('#themeBtn').querySelector('use').setAttribute('href', isDark ? '#i-sun' : '#i-moon');
  document.documentElement.setAttribute('data-fs', FS_SIZES[S.fontSize] || 'md');
  document.documentElement.style.setProperty('--accent', S.accent);
  document.documentElement.style.setProperty('--accent-soft', hexToRgba(S.accent, .10));
  $('#app').classList.toggle('collapsed', !!S.sidebarCollapsed);
  document.body.setAttribute('data-bg', S.background || 'default');
}

/* ==================== GREETING ==================== */
function updateGreeting() {
  const h = new Date().getHours();
  let g = 'سلام';
  if (h >= 5 && h < 12) g = 'صبح بخیر ☀️';
  else if (h >= 12 && h < 17) g = 'ظهر بخیر 🌤️';
  else if (h >= 17 && h < 21) g = 'عصر بخیر 🌆';
  else g = 'شب بخیر 🌙';
  $('#greeting').textContent = g;
}

/* ==================== CLOCK ==================== */
function updateClock() {
  const now = new Date();
  $('#clockTime').textContent = toFa(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
  $('#clockDate').textContent = now.toLocaleDateString('fa-IR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  $('#dayOfWeek').textContent = now.toLocaleDateString('fa-IR', { weekday:'long' });
  try {
    const h = now.toLocaleDateString('fa-IR-u-ca-islamic', { year:'numeric', month:'long', day:'numeric' });
    $('#clockHijri').textContent = 'قمری: ' + h;
  } catch { $('#clockHijri').textContent = ''; }
}

/* ==================== WORLD CLOCK ==================== */
const WORLD_ZONES = [
  { name:'تهران', tz:'Asia/Tehran', flag:'🇮🇷' },
  { name:'لندن', tz:'Europe/London', flag:'🇬🇧' },
  { name:'نیویورک', tz:'America/New_York', flag:'🇺🇸' },
  { name:'توکیو', tz:'Asia/Tokyo', flag:'🇯🇵' }
];
function updateWorldClock() {
  const html = WORLD_ZONES.map(z => {
    try {
      const t = new Date().toLocaleTimeString('en-GB', { timeZone: z.tz, hour12: false, hour:'2-digit', minute:'2-digit' });
      return `<div class="wc-row"><span class="wc-name">${z.flag} ${z.name}</span><span class="wc-time">${toFa(t)}</span></div>`;
    } catch { return ''; }
  }).join('');
  $('#worldClockList').innerHTML = html;
}

/* ==================== WEATHER ==================== */
const WMO = {
  0:{d:'آفتابی',i:'sun'},1:{d:'نسبتاً آفتابی',i:'cloud-sun'},2:{d:'نیمه‌ابری',i:'cloud-sun'},3:{d:'ابری',i:'cloud'},
  45:{d:'مه',i:'cloud'},48:{d:'مه یخ‌زده',i:'cloud-snow'},51:{d:'نم‌نم باران',i:'cloud-rain'},53:{d:'باران سبک',i:'cloud-rain'},
  55:{d:'باران',i:'cloud-rain'},61:{d:'بارانی',i:'cloud-rain'},63:{d:'باران متوسط',i:'cloud-rain'},65:{d:'باران شدید',i:'cloud-rain'},
  71:{d:'برفی',i:'cloud-snow'},73:{d:'برف متوسط',i:'cloud-snow'},75:{d:'برف سنگین',i:'cloud-snow'},80:{d:'رگبار',i:'cloud-rain'},
  81:{d:'رگبار شدید',i:'cloud-rain'},82:{d:'رگبار سیل‌آسا',i:'cloud-rain'},95:{d:'رعد و برق',i:'cloud-rain'},99:{d:'توفان',i:'cloud-rain'}
};
const setWxIcon = n => { $('#weatherIcon').innerHTML = icon(n); };

async function fetchWeather() {
  if (!navigator.geolocation) { $('#weatherDesc').textContent = 'پشتیبانی نمی‌شود'; return; }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
      const d = await (await fetch(url)).json();
      const c = d.current;
      const w = WMO[c.weather_code] || { d:'نامشخص', i:'cloud' };
      $('#weatherTemp').textContent = toFa(Math.round(c.temperature_2m)) + '°';
      $('#weatherDesc').textContent = w.d;
      $('#weatherWind').textContent = toFa(Math.round(c.wind_speed_10m)) + ' km/h';
      $('#weatherHum').textContent = toFa(c.relative_humidity_2m) + '٪';
      setWxIcon(w.i);
      LS.set('weatherCache', { ts: Date.now(), temp: c.temperature_2m, code: c.weather_code, wind: c.wind_speed_10m, hum: c.relative_humidity_2m });
    } catch { $('#weatherDesc').textContent = 'خطا'; }
  }, () => { $('#weatherDesc').textContent = 'دسترسی رد شد'; }, { timeout: 8000 });
}

function initWeather() {
  const c = LS.get('weatherCache', null);
  if (c && Date.now() - c.ts < 30 * 60 * 1000) {
    const w = WMO[c.code] || { d:'نامشخص', i:'cloud' };
    $('#weatherTemp').textContent = toFa(Math.round(c.temp)) + '°';
    $('#weatherDesc').textContent = w.d;
    $('#weatherWind').textContent = toFa(Math.round(c.wind)) + ' km/h';
    $('#weatherHum').textContent = toFa(c.hum) + '٪';
    setWxIcon(w.i);
    return;
  }
  fetchWeather();
}

/* ==================== QUOTE ==================== */
const QUOTES = [
  { t:'هر روز یک فرصت تازه برای بهتر شدن است.', a:'ناشناس' },
  { t:'موفقیت مجموع تلاش‌های کوچک روزانه است.', a:'رابرت کولیر' },
  { t:'انضباط، پلی است میان اهداف و دستاوردها.', a:'جیم ران' },
  { t:'ساده‌ترین راه پیش‌بینی آینده، ساختن آن است.', a:'پیتر دراکر' },
  { t:'کیفیت زندگی شما، کیفیت سوالات شماست.', a:'تونی رابینز' },
  { t:'متمرکز بر پیشرفت باش، نه کمال.', a:'ناشناس' },
  { t:'بزرگ‌ترین ریسک، هیچ ریسکی نکردن است.', a:'مارک زاکربرگ' },
  { t:'آنچه را می‌توانی امروز انجام بده، به فردا نسپار.', a:'بنجامین فرانکلین' },
  { t:'ذهن شما باغ است، افکار شما بذر.', a:'ضرب‌المثل' },
  { t:'زمانی که آماده‌ای، همیشه زود است.', a:'ضرب‌المثل' }
];
let quoteIdx = LS.get('quoteIdx', Math.floor(Math.random() * QUOTES.length));
function renderQuote(adv = false) {
  if (adv) { quoteIdx = (quoteIdx + 1) % QUOTES.length; LS.set('quoteIdx', quoteIdx); }
  const q = QUOTES[quoteIdx];
  $('#quoteText').textContent = '«' + q.t + '»';
  $('#quoteAuthor').textContent = '— ' + q.a;
}

/* ==================== POMODORO ==================== */
const pomo = { minutes:25, remaining:25*60, running:false, interval:null, sessions:LS.get('pomoSessions',0), isBreak:false };
function updatePomoDisplay() {
  const m = Math.floor(pomo.remaining/60), s = pomo.remaining%60;
  $('#pomoDisplay').textContent = `${pad(m)}:${pad(s)}`;
  $('#pomoDisplay').classList.toggle('break', pomo.isBreak);
  $('#pomoBar').style.width = (pomo.remaining / (pomo.minutes*60) * 100) + '%';
  $('#pomoCount').textContent = toFa(pomo.sessions) + ' جلسه';
}
function startPomo() {
  if (pomo.running) {
    clearInterval(pomo.interval); pomo.running = false;
    $('#pomoStart').innerHTML = icon('play') + ' ادامه';
    $('#pomoStatus').textContent = 'متوقف';
    return;
  }
  pomo.running = true;
  $('#pomoStart').innerHTML = icon('pause') + ' توقف';
  $('#pomoStatus').textContent = pomo.isBreak ? 'استراحت' : 'تمرکز';
  pomo.interval = setInterval(() => {
    pomo.remaining--;
    updatePomoDisplay();
    if (pomo.remaining <= 0) {
      clearInterval(pomo.interval); pomo.running = false;
      $('#pomoStart').innerHTML = icon('play') + ' شروع';
      if (!pomo.isBreak) { pomo.sessions++; LS.set('pomoSessions', pomo.sessions); }
      $('#pomoStatus').textContent = 'زمان تمام شد!';
      toast(pomo.isBreak ? 'وقت کاره!' : 'وقت استراحت!');
      playBeep();
      try { new Notification('یارا — پومودورو', { body: pomo.isBreak ? 'استراحت تمام شد' : 'زمان کار تمام شد، استراحت کن' }); } catch {}
    }
  }, 1000);
}
function resetPomo() {
  clearInterval(pomo.interval); pomo.running = false;
  pomo.remaining = pomo.minutes * 60;
  $('#pomoStart').innerHTML = icon('play') + ' شروع';
  $('#pomoStatus').textContent = 'آماده';
  updatePomoDisplay();
}
$('#pomoStart').onclick = startPomo;
$('#pomoReset').onclick = resetPomo;
$$('#pomoModes .pomo-mode').forEach(b => b.onclick = () => {
  $$('#pomoModes .pomo-mode').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  pomo.minutes = +b.dataset.min;
  pomo.isBreak = pomo.minutes !== 25;
  resetPomo();
});

/* ==================== SOUND ==================== */
function playBeep() {
  if (!S.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

/* ==================== TODOS ==================== */
let todos = LS.get('todos', []);
let taskFilter = 'all';

const todayISO = () => new Date().toISOString().slice(0,10);

function filteredTodos() {
  const today = todayISO();
  return todos.filter(t => {
    if (taskFilter === 'today')    return t.due === today && !t.done;
    if (taskFilter === 'overdue')  return t.due && t.due < today && !t.done;
    if (taskFilter === 'done')     return t.done;
    return true;
  });
}

function renderTodos() {
  const list = filteredTodos();
  const html = list.length
    ? list.map(t => {
        const i = todos.indexOf(t);
        const prio = t.priority || 'medium';
        const dueTxt = t.due ? new Date(t.due).toLocaleDateString('fa-IR') : '';
        const overdue = t.due && t.due < todayISO() && !t.done;
        return `<li data-i="${i}" draggable="true">
          <span class="priority-dot ${prio}"></span>
          <button class="checkbox ${t.done?'checked':''}" data-act="toggle">${icon('check')}</button>
          <span class="item-text ${t.done?'done':''}" data-act="edit">${esc(t.text)}</span>
          ${dueTxt ? `<span class="item-meta" style="${overdue?'color:var(--danger)':''}">${dueTxt}</span>` : ''}
          <button class="mini-btn" data-act="del">${icon('trash')}</button>
        </li>`;
      }).join('')
    : `<div class="empty"><div class="empty-icon">${icon('check-circle')}</div><div>${taskFilter==='all'?'هنوز کاری نداری':'موردی نیست'}</div></div>`;

  $('#todoList').innerHTML = html;
  $('#todoListFull').innerHTML = html;
  $('#todoCount').textContent = toFa(todos.filter(t=>!t.done).length);
  const total = todos.length;
  $('#tasksSub').textContent = `${toFa(total)} مورد • ${toFa(todos.filter(t=>t.done).length)} انجام‌شده`;
  renderProgress();
  updateQuickStats();

  // Drag & drop for reorder
  ['#todoList', '#todoListFull'].forEach(sel => {
    const list = $(sel);
    let dragSrc = null;
    $$('li', list).forEach(li => {
      li.ondragstart = () => { dragSrc = +li.dataset.i; li.classList.add('dragging'); };
      li.ondragend   = () => { li.classList.remove('dragging'); $$('li', list).forEach(x=>x.classList.remove('drag-over')); };
      li.ondragover  = (e) => { e.preventDefault(); li.classList.add('drag-over'); };
      li.ondragleave = () => { li.classList.remove('drag-over'); };
      li.ondrop      = (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        const drop = +li.dataset.i;
        if (dragSrc === null || dragSrc === drop) return;
        const [m] = todos.splice(dragSrc, 1);
        todos.splice(drop, 0, m);
        LS.set('todos', todos);
        renderTodos();
      };
    });
  });
}

function addTodo(text, priority = 'medium', due = '') {
  text = text.trim();
  if (!text) return;
  todos.unshift({ id:uid(), text, done:false, priority, due, ts:Date.now() });
  LS.set('todos', todos);
  renderTodos();
  logActivity('task');
}

$('#todoAdd').onclick = () => { addTodo($('#todoInput').value); $('#todoInput').value = ''; };
$('#todoInput').onkeydown = (e) => { if (e.key === 'Enter') { addTodo($('#todoInput').value); $('#todoInput').value = ''; } };
$('#todoAddFull').onclick = () => {
  addTodo($('#todoInputFull').value, $('#todoPriorityFull').value, $('#todoDueFull').value);
  $('#todoInputFull').value = ''; $('#todoDueFull').value = '';
};
$('#todoInputFull').onkeydown = (e) => { if (e.key === 'Enter') $('#todoAddFull').click(); };

['#todoList', '#todoListFull'].forEach(sel => {
  $(sel).onclick = (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.closest('li').dataset.i;
    const act = b.dataset.act;
    if (act === 'toggle') todos[i].done = !todos[i].done;
    else if (act === 'del') { todos.splice(i, 1); toast('حذف شد', 'trash'); }
    else if (act === 'edit') {
      const nt = prompt('ویرایش:', todos[i].text);
      if (nt && nt.trim()) todos[i].text = nt.trim();
    }
    LS.set('todos', todos); renderTodos();
  };
});

$$('#taskFilter button').forEach(b => b.onclick = () => {
  $$('#taskFilter button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  taskFilter = b.dataset.f;
  renderTodos();
});

/* ==================== PROGRESS ==================== */
function renderProgress() {
  const total = todos.length;
  if (!total) {
    $('#progressFill').style.width = '0%';
    $('#progressPct').textContent = '۰٪';
    $('#progressInfo').textContent = 'هنوز کاری نداری';
    $('#progressSub').textContent = '—';
    return;
  }
  const done = todos.filter(t => t.done).length;
  const pct = Math.round(done / total * 100);
  $('#progressFill').style.width = pct + '%';
  $('#progressPct').textContent = toFa(pct) + '٪';
  $('#progressInfo').textContent = `${toFa(done)} از ${toFa(total)} کار انجام شده`;
  $('#progressSub').textContent = pct === 100 ? '🎉 عالی!' : pct >= 50 ? 'در حال پیشرفت' : 'ادامه بده';
}

/* ==================== QUICK STATS ==================== */
function updateQuickStats() {
  const today = todayISO();
  const tasksToday = todos.filter(t => t.due === today || (t.ts && new Date(t.ts).toISOString().slice(0,10) === today)).length;
  $('#statTasksToday').textContent = toFa(tasksToday);
  $('#statNotesTotal').textContent = toFa(notes.length);
  $('#statPomoTotal').textContent = toFa(pomo.sessions);
}

/* ==================== NOTES ==================== */
let notes = LS.get('notes', []);
const NOTE_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

function renderNotes() {
  // Short list in home
  $('#noteList').innerHTML = notes.length
    ? notes.slice(0, 5).map((n,i) => `
        <li data-i="${i}">
          <button class="mini-btn ${n.pinned?'pin-active':''}" data-act="pin">${icon(n.pinned?'pin':'pin-off')}</button>
          <span class="item-text">${esc(n.text.slice(0,60))}${n.text.length>60?'…':''}</span>
        </li>`).join('')
    : `<div class="empty"><div class="empty-icon">${icon('file-text')}</div><div>یادداشتی نداری</div></div>`;

  $('#noteList').onclick = (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.closest('li').dataset.i;
    if (b.dataset.act === 'pin') notes[i].pinned = !notes[i].pinned;
    LS.set('notes', notes); renderNotes();
  };

  // Full view
  const sorted = [...notes].sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0) || b.ts - a.ts);
  $('#notesContainer').innerHTML = sorted.length
    ? sorted.map(n => {
        const i = notes.indexOf(n);
        const color = n.color || '#6366f1';
        return `<div class="note-card ${n.pinned?'pinned':''}" data-i="${i}">
          <div class="note-card-head">
            <span class="note-color-dot" style="background:${color}"></span>
            <div class="note-card-title">${esc(n.title || n.text.slice(0, 40))}</div>
            <button class="mini-btn ${n.pinned?'pin-active':''}" data-act="pin">${icon(n.pinned?'pin':'pin-off')}</button>
            <button class="mini-btn" data-act="edit">${icon('edit')}</button>
            <button class="mini-btn" data-act="del">${icon('trash')}</button>
          </div>
          <div class="note-card-body">${esc(n.text)}</div>
          <div class="note-card-footer">
            ${(n.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
            <span class="item-meta">${new Date(n.ts).toLocaleDateString('fa-IR')}</span>
          </div>
        </div>`;
      }).join('')
    : `<div class="empty"><div class="empty-icon">${icon('file-text')}</div><div>یادداشتی نداری</div></div>`;

  $('#notesContainer').onclick = (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.closest('.note-card').dataset.i;
    if (b.dataset.act === 'del') { if (confirm('حذف شود؟')) { notes.splice(i,1); LS.set('notes',notes); renderNotes(); } }
    else if (b.dataset.act === 'pin') { notes[i].pinned = !notes[i].pinned; LS.set('notes',notes); renderNotes(); }
    else if (b.dataset.act === 'edit') { openNoteModal(notes[i], i); }
  };

  $('#noteCount').textContent = toFa(notes.length);
  $('#notesSub').textContent = toFa(notes.length) + ' مورد';
  updateQuickStats();
}

function addNote(text) {
  text = text.trim(); if (!text) return;
  notes.unshift({ id:uid(), text, title:'', pinned:false, color:'#6366f1', tags:[], ts:Date.now() });
  LS.set('notes', notes); renderNotes(); logActivity('note');
}

$('#noteAdd').onclick = () => { addNote($('#noteInput').value); $('#noteInput').value = ''; };
$('#noteInput').onkeydown = (e) => { if (e.key === 'Enter') { addNote($('#noteInput').value); $('#noteInput').value = ''; } };
$('#noteAddBig').onclick = () => openNoteModal(null, -1);

function openNoteModal(note, idx) {
  const isNew = idx < 0;
  const data = isNew ? { title:'', text:'', color:'#6366f1', tags:[] } : note;
  openModal(`
    <div class="modal-head">
      <div class="modal-title">${icon('file-text')} ${isNew?'یادداشت جدید':'ویرایش یادداشت'}</div>
      <button class="btn-icon" data-close>${icon('x')}</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">عنوان</label>
        <input id="nTitle" class="form-input" value="${esc(data.title)}" placeholder="عنوان...">
      </div>
      <div class="form-group">
        <label class="form-label">متن</label>
        <textarea id="nText" class="form-textarea" placeholder="متن یادداشت...">${esc(data.text)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">رنگ</label>
        <div class="color-swatches">${NOTE_COLORS.map(c =>
          `<div class="color-swatch ${c===data.color?'active':''}" data-c="${c}" style="background:${c}"></div>`).join('')}</div>
      </div>
      <div class="form-group">
        <label class="form-label">برچسب‌ها (با کاما جدا کنید)</label>
        <input id="nTags" class="form-input" value="${esc((data.tags||[]).join(', '))}" placeholder="مثلاً: کار، ایده">
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>انصراف</button>
      <button class="btn btn-primary" id="nSave">ذخیره</button>
    </div>
  `, () => {
    let selColor = data.color;
    $$('#modalContent .color-swatch').forEach(sw => sw.onclick = () => {
      $$('#modalContent .color-swatch').forEach(x => x.classList.remove('active'));
      sw.classList.add('active'); selColor = sw.dataset.c;
    });
    $('#nSave').onclick = () => {
      const title = $('#nTitle').value.trim();
      const text = $('#nText').value.trim();
      const tags = $('#nTags').value.split(',').map(t=>t.trim()).filter(Boolean);
      if (!text) { toast('متن خالی است', 'alert'); return; }
      if (isNew) {
        notes.unshift({ id:uid(), title, text, pinned:false, color:selColor, tags, ts:Date.now() });
        logActivity('note');
      } else {
        notes[idx] = { ...notes[idx], title, text, color:selColor, tags };
      }
      LS.set('notes', notes); renderNotes(); closeModal(); toast('ذخیره شد');
    };
  });
}

/* ==================== BOOKMARKS ==================== */
let bms = LS.get('bms', []);
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return ''; } };
const faviconOf = (u) => `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostOf(u))}`;

function renderBms() {
  const html = bms.length
    ? bms.map((b,i) => `
        <a class="bm-card" href="${esc(b.url)}" target="_blank" rel="noopener" data-i="${i}">
          <img src="${faviconOf(b.url)}" onerror="this.style.display='none'" alt="">
          <span>${esc(b.title || hostOf(b.url))}</span>
          ${b.tag ? `<span class="tag">${esc(b.tag)}</span>` : ''}
          <button class="bm-rm" data-act="del">${icon('x')}</button>
        </a>`).join('')
    : `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">${icon('bookmark')}</div><div>بوکمارکی نداری</div></div>`;

  ['#bmList', '#bmListFull'].forEach(sel => {
    const el = $(sel); if (!el) return;
    el.innerHTML = html;
    el.onclick = (e) => {
      const rm = e.target.closest('[data-act="del"]'); if (!rm) return;
      e.preventDefault(); e.stopPropagation();
      const i = +rm.closest('.bm-card').dataset.i;
      if (confirm('حذف شود؟')) { bms.splice(i, 1); LS.set('bms', bms); renderBms(); }
    };
  });
  $('#bmCount').textContent = toFa(bms.length);
  $('#bmSub').textContent = toFa(bms.length) + ' مورد';
}

function addBm(url, title, tag) {
  url = url.trim(); if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try { new URL(url); } catch { toast('آدرس نامعتبر', 'alert'); return; }
  bms.unshift({ id:uid(), url, title:(title||'').trim(), tag:(tag||'').trim(), ts:Date.now() });
  LS.set('bms', bms); renderBms(); logActivity('bookmark');
}

$('#bmAdd').onclick = () => { addBm($('#bmUrl').value, $('#bmTitle').value); $('#bmUrl').value=''; $('#bmTitle').value=''; };
$('#bmAddFull').onclick = () => { addBm($('#bmUrlFull').value, $('#bmTitleFull').value, $('#bmTagFull').value); $('#bmUrlFull').value=''; $('#bmTitleFull').value=''; $('#bmTagFull').value=''; };

/* ==================== QUICK LINKS ==================== */
let qls = LS.get('qls', [
  { url:'https://www.google.com', title:'گوگل' },
  { url:'https://github.com/theesmaeil', title:'گیت‌هاب' },
  { url:'https://mail.google.com', title:'جیمیل' },
  { url:'https://www.youtube.com', title:'یوتیوب' },
  { url:'https://chat.openai.com', title:'ChatGPT' },
  { url:'https://stackoverflow.com', title:'Stack' }
]);

function renderQls() {
  const el = $('#qlList');
  if (!qls.length) { el.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">${icon('globe')}</div></div>`; return; }
  el.innerHTML = qls.map((q,i) => `
    <a class="ql-item" href="${esc(q.url)}" target="_blank" rel="noopener">
      <img class="ql-fav" src="${faviconOf(q.url)}" onerror="this.outerHTML='<div class=\\'ql-fallback\\'>${esc(q.title.charAt(0))}</div>'" alt="">
      <span>${esc(q.title)}</span>
      <button class="ql-remove" data-i="${i}">${icon('x')}</button>
    </a>`).join('');
  $$('.ql-remove', el).forEach(b => b.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    qls.splice(+b.dataset.i, 1); LS.set('qls', qls); renderQls();
  });
}

$('#qlAdd').onclick = () => {
  const url = prompt('آدرس سایت:'); if (!url) return;
  const title = prompt('عنوان:') || hostOf(url) || 'لینک';
  let u = url.trim(); if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  qls.push({ url:u, title }); LS.set('qls', qls); renderQls(); toast('اضافه شد');
};

/* ==================== CALENDAR (Jalali) ==================== */
let calendarYear, calendarMonth;
let events = LS.get('events', []);

// Jalali <-> Gregorian conversion
function toJalali(gy, gm, gd) {
  const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? gy + 1 : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}
function toGregorian(jy, jm, jd) {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  const sal_a = [0,31,(gy%4===0 && gy%100!==0)||(gy%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
  let gm = 0;
  for (gm = 0; gm < 13; gm++) { if (gd <= sal_a[gm]) break; gd -= sal_a[gm]; }
  return [gy, gm, gd];
}
const JALALI_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Esfand
  const leap = ((jy + 12) % 33) % 4;
  return leap === 1 ? 30 : 29;
}

function initCalendar() {
  const [jy, jm] = toJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
  calendarYear = jy; calendarMonth = jm;
}

function renderCalendar() {
  const today = new Date();
  const [tjy, tjm, tjd] = toJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());

  $('#calTitle').textContent = `${JALALI_MONTHS[calendarMonth-1]} ${toFa(calendarYear)}`;
  $('#calendarSub').textContent = `امروز: ${JALALI_MONTHS[tjm-1]} ${toFa(tjd)}، ${toFa(tjy)}`;

  // First day of Jalali month
  const [gy, gm, gd] = toGregorian(calendarYear, calendarMonth, 1);
  const firstDate = new Date(gy, gm - 1, gd);
  // Persian week starts on Saturday. JS: Sun=0, Mon=1, ..., Sat=6
  // Persian: ش=0 → JS Sat=6; convert: (jsDay + 1) % 7
  const startOffset = (firstDate.getDay() + 1) % 7;

  const totalDays = jalaliMonthLength(calendarYear, calendarMonth);
  const prevMonthDays = calendarMonth === 1 ? jalaliMonthLength(calendarYear - 1, 12) : jalaliMonthLength(calendarYear, calendarMonth - 1);

  let html = '';
  for (let i = 0; i < startOffset; i++) {
    const day = prevMonthDays - startOffset + i + 1;
    html += `<div class="calendar-day other-month"><span class="calendar-day-num">${toFa(day)}</span></div>`;
  }
  for (let d = 1; d <= totalDays; d++) {
    const isToday = d === tjd && calendarMonth === tjm && calendarYear === tjy;
    const [gy2, gm2, gd2] = toGregorian(calendarYear, calendarMonth, d);
    const dateStr = `${gy2}-${pad(gm2)}-${pad(gd2)}`;
    const hasEvent = events.some(e => e.date === dateStr);
    // Friday is holiday in Iran (JS Friday = 5)
    const isFriday = new Date(gy2, gm2 - 1, gd2).getDay() === 5;
    html += `<div class="calendar-day ${isToday?'today':''} ${hasEvent?'has-event':''}" data-date="${dateStr}" data-jd="${d}">
      <span class="calendar-day-num ${isFriday?'calendar-day-holiday':''}">${toFa(d)}</span>
    </div>`;
  }
  const remaining = (7 - (startOffset + totalDays) % 7) % 7;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="calendar-day other-month"><span class="calendar-day-num">${toFa(i)}</span></div>`;
  }

  $('#calendarGrid').innerHTML = html;
  $$('#calendarGrid .calendar-day:not(.other-month)').forEach(el => {
    el.onclick = () => openEventModal(el.dataset.date);
  });

  // Events list for current month
  const monthStr = `${calendarYear}-${pad(calendarMonth)}`;
  const [mgy, mgm] = toGregorian(calendarYear, calendarMonth, 1);
  const monthPrefix = `${mgy}-${pad(mgm)}`;
  const monthEvents = events
    .filter(e => e.date.startsWith(monthPrefix))
    .sort((a,b) => a.date.localeCompare(b.date));

  $('#eventList').innerHTML = monthEvents.length
    ? monthEvents.map(e => `
        <div class="event-item ${e.color || ''}" data-eid="${e.id}">
          <div class="event-title">${esc(e.title)}</div>
          <div class="event-meta">${new Date(e.date).toLocaleDateString('fa-IR')}${e.time ? ' • ' + toFa(e.time) : ''}</div>
          ${e.desc ? `<div style="font-size:.75rem;color:var(--muted);margin-top:.2rem">${esc(e.desc)}</div>` : ''}
        </div>`).join('')
    : `<div class="empty" style="padding:1rem"><div>رویدادی در این ماه نیست</div></div>`;

  $$('#eventList .event-item').forEach(el => el.onclick = () => {
    const e = events.find(x => x.id === el.dataset.eid);
    if (e && confirm(`حذف «${e.title}»؟`)) {
      events = events.filter(x => x.id !== e.id);
      LS.set('events', events); renderCalendar();
    }
  });
}

$('#calPrev').onclick = () => {
  calendarMonth--;
  if (calendarMonth < 1) { calendarMonth = 12; calendarYear--; }
  renderCalendar();
};
$('#calNext').onclick = () => {
  calendarMonth++;
  if (calendarMonth > 12) { calendarMonth = 1; calendarYear++; }
  renderCalendar();
};

function openEventModal(presetDate) {
  const defaultDate = presetDate || todayISO();
  openModal(`
    <div class="modal-head">
      <div class="modal-title">${icon('calendar')} رویداد جدید</div>
      <button class="btn-icon" data-close>${icon('x')}</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">عنوان</label>
        <input id="eTitle" class="form-input" placeholder="عنوان رویداد...">
      </div>
      <div class="form-group">
        <label class="form-label">تاریخ</label>
        <input id="eDate" class="form-input" type="date" value="${defaultDate}">
      </div>
      <div class="form-group">
        <label class="form-label">ساعت (اختیاری)</label>
        <input id="eTime" class="form-input" type="time">
      </div>
      <div class="form-group">
        <label class="form-label">توضیحات</label>
        <textarea id="eDesc" class="form-textarea" placeholder="اختیاری..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">رنگ</label>
        <select id="eColor" class="form-select">
          <option value="">پیش‌فرض</option>
          <option value="success">سبز (موفقیت)</option>
          <option value="warn">زرد (مهم)</option>
          <option value="danger">قرمز (ضروری)</option>
        </select>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close>انصراف</button>
      <button class="btn btn-primary" id="eSave">ذخیره</button>
    </div>
  `, () => {
    $('#eSave').onclick = () => {
      const title = $('#eTitle').value.trim();
      const date  = $('#eDate').value;
      if (!title || !date) { toast('عنوان و تاریخ الزامی است', 'alert'); return; }
      events.push({ id:uid(), title, date, time:$('#eTime').value, desc:$('#eDesc').value.trim(), color:$('#eColor').value, ts:Date.now() });
      LS.set('events', events);
      renderCalendar(); closeModal(); toast('رویداد اضافه شد');
    };
  });
}
$('#eventAdd').onclick = () => openEventModal();

/* ==================== HABITS ==================== */
let habits = LS.get('habits', []);

function renderHabits() {
  const today = new Date();
  const dayNames = ['ش','ی','د','س','چ','پ','ج'];

  const html = habits.length
    ? habits.map((h, hi) => {
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0,10);
          const done = (h.days || []).includes(key);
          const isToday = i === 0;
          last7.push({ key, done, isToday, name: dayNames[(d.getDay()+1)%7] });
        }
        const streak = calcStreak(h.days || []);
        return `<div class="habit-card" data-hi="${hi}">
          <div class="habit-head">
            <div class="habit-name">${esc(h.name)}</div>
            <div class="habit-streak">${icon('flame')} ${toFa(streak)}</div>
            <button class="mini-btn" data-act="del-habit">${icon('trash')}</button>
          </div>
          <div class="habit-days">
            ${last7.map(d => `<div class="habit-day ${d.done?'done':''} ${d.isToday?'today':''}" data-date="${d.key}" title="${d.name}">${d.name}</div>`).join('')}
          </div>
        </div>`;
      }).join('')
    : `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">${icon('flame')}</div><div>هنوز عادتی تعریف نکردی</div></div>`;

  ['#habitsGrid', '#habitsGridFull'].forEach(sel => {
    const el = $(sel); if (!el) return;
    el.innerHTML = html;

    $$('.habit-day', el).forEach(day => day.onclick = (e) => {
      e.stopPropagation();
      const hi = +day.closest('.habit-card').dataset.hi;
      const date = day.dataset.date;
      if (!habits[hi].days) habits[hi].days = [];
      const idx = habits[hi].days.indexOf(date);
      if (idx >= 0) habits[hi].days.splice(idx, 1);
      else { habits[hi].days.push(date); logActivity('habit'); }
      LS.set('habits', habits); renderHabits();
    });

    $$('[data-act="del-habit"]', el).forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const hi = +b.closest('.habit-card').dataset.hi;
      if (confirm(`حذف «${habits[hi].name}»؟`)) {
        habits.splice(hi, 1); LS.set('habits', habits); renderHabits();
      }
    });
  });

  $('#habitsSub').textContent = toFa(habits.length) + ' عادت';
}

function calcStreak(days) {
  if (!days.length) return 0;
  const sorted = [...new Set(days)].sort().reverse();
  let streak = 0;
  let cur = new Date(); cur.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const key = cur.toISOString().slice(0,10);
    if (sorted.includes(key)) { streak++; cur.setDate(cur.getDate() - 1); }
    else if (i === 0) { cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

function addHabit(name) {
  name = name.trim(); if (!name) return;
  habits.push({ id:uid(), name, days:[], ts:Date.now() });
  LS.set('habits', habits); renderHabits();
}

$('#habitAdd').onclick = () => {
  const n = prompt('نام عادت جدید:'); if (n) addHabit(n);
};
$('#habitAddBig').onclick = () => {
  const n = prompt('نام عادت جدید:'); if (n) addHabit(n);
};

/* ==================== STATS ==================== */
function logActivity(type) {
  const log = LS.get('activityLog', {});
  const today = todayISO();
  if (!log[today]) log[today] = { task:0, note:0, bookmark:0, habit:0, pomo:0 };
  log[today][type] = (log[today][type] || 0) + 1;
  LS.set('activityLog', log);
}

function renderStats() {
  // Chart
  const log = LS.get('activityLog', {});
  const bars = [], labels = [];
  const fa_day_short = ['ی','د','س','چ','پ','ج','ش'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const data = log[key] || {};
    const total = (data.task||0) + (data.note||0) + (data.bookmark||0) + (data.habit||0) + (data.pomo||0);
    bars.push(total);
    labels.push(fa_day_short[(d.getDay()+1)%7]);
  }
  const max = Math.max(...bars, 1);
  $('#chartBars').innerHTML = bars.map(v => `<div class="chart-bar" style="height:${(v/max)*100}%" title="${toFa(v)}"></div>`).join('');
  $('#chartLabels').innerHTML = labels.map(l => `<span>${l}</span>`).join('');

  // Stats
  $('#sTasksTotal').textContent = toFa(todos.length);
  $('#sTasksDone').textContent = toFa(todos.filter(t=>t.done).length);
  $('#sNotesTotal').textContent = toFa(notes.length);
  $('#sBmTotal').textContent = toFa(bms.length);
  $('#sPomoTotal').textContent = toFa(pomo.sessions);
  const bestStreak = habits.reduce((m,h) => Math.max(m, calcStreak(h.days||[])), 0);
  $('#sHabitStreak').textContent = toFa(bestStreak);
  const activeDays = Object.keys(log).length;
  $('#sDaysActive').textContent = toFa(activeDays);
  const avg = activeDays ? Math.round(Object.values(log).reduce((s,d) => s + Object.values(d).reduce((a,b)=>a+b, 0), 0) / activeDays) : 0;
  $('#sAvgDone').textContent = toFa(avg);

  // Badges
  const badges = [
    { icon:'⭐', name:'شروع',      cond: activeDays >= 1 },
    { icon:'🔥', name:'۳ روز فعال', cond: activeDays >= 3 },
    { icon:'💪', name:'۷ روز فعال', cond: activeDays >= 7 },
    { icon:'✅', name:'۱۰ کار',     cond: todos.filter(t=>t.done).length >= 10 },
    { icon:'📝', name:'۵ یادداشت',  cond: notes.length >= 5 },
    { icon:'🍅', name:'۱۰ پومو',    cond: pomo.sessions >= 10 },
    { icon:'🏆', name:'۳۰ روز فعال', cond: activeDays >= 30 }
  ];
  $('#badgeList').innerHTML = badges.map(b =>
    `<div class="badge ${b.cond?'unlocked':''}">
       <div class="badge-icon">${b.icon}</div>
       <div class="badge-name">${b.name}</div>
     </div>`).join('');
}

/* ==================== GOALS ==================== */
let goals = LS.get('goals', [
  { text:'ورزش روزانه', done:false },
  { text:'مطالعه ۳۰ دقیقه', done:false },
  { text:'نوشیدن ۸ لیوان آب', done:false }
]);

function renderGoals() {
  const today = todayISO();
  const lastReset = LS.get('goalsReset', today);
  if (lastReset !== today) {
    goals.forEach(g => g.done = false);
    LS.set('goals', goals); LS.set('goalsReset', today);
  }

  $('#goalsList').innerHTML = goals.length
    ? goals.map((g, i) => `
        <div class="wc-row" data-i="${i}" style="cursor:pointer;background:${g.done?'var(--accent-soft)':'var(--surface-2)'}">
          <span class="wc-name" style="${g.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(g.text)}</span>
          ${g.done ? icon('check-circle') : ''}
        </div>`).join('')
    : `<div class="empty"><div>هدفی تعریف نشده</div></div>`;

  $$('#goalsList .wc-row').forEach(row => row.onclick = () => {
    const i = +row.dataset.i;
    goals[i].done = !goals[i].done;
    LS.set('goals', goals); renderGoals();
  });
}

$('#goalsEdit').onclick = () => {
  const text = goals.map(g => g.text).join('\n');
  const nt = prompt('هر هدف را در یک خط بنویس:', text);
  if (nt === null) return;
  goals = nt.split('\n').map(l => l.trim()).filter(Boolean).map(t => {
    const existing = goals.find(g => g.text === t);
    return { text:t, done: existing ? existing.done : false };
  });
  LS.set('goals', goals); renderGoals();
};

/* ==================== COMMAND PALETTE ==================== */
const cmdk = { open:false, query:'', activeIdx:0 };

function buildCommands() {
  return [
    { section:'ناوبری' },
    { icon:'home', text:'داشبورد', action:() => switchView('home') },
    { icon:'check-circle', text:'کارها', hint:'Ctrl+1', action:() => switchView('tasks') },
    { icon:'file-text', text:'یادداشت‌ها', hint:'Ctrl+2', action:() => switchView('notes') },
    { icon:'bookmark', text:'بوکمارک‌ها', hint:'Ctrl+3', action:() => switchView('bookmarks') },
    { icon:'calendar', text:'تقویم', hint:'Ctrl+4', action:() => switchView('calendar') },
    { icon:'flame', text:'عادت‌ها', hint:'Ctrl+5', action:() => switchView('habits') },
    { icon:'bar-chart', text:'آمار', hint:'Ctrl+6', action:() => switchView('stats') },
    { section:'عملیات' },
    { icon:'plus', text:'کار جدید', action:() => { switchView('tasks'); setTimeout(()=>$('#todoInputFull').focus(), 100); } },
    { icon:'file-text', text:'یادداشت جدید', action:() => { switchView('notes'); setTimeout(()=>openNoteModal(null,-1), 100); } },
    { icon:'bookmark', text:'بوکمارک جدید', action:() => { switchView('bookmarks'); setTimeout(()=>$('#bmUrlFull').focus(), 100); } },
    { icon:'calendar', text:'رویداد جدید', action:() => { switchView('calendar'); setTimeout(()=>openEventModal(), 100); } },
    { section:'ظاهر' },
    { icon:'moon', text:'حالت تیره', action:() => { S.theme='dark'; S.autoTheme=false; saveSettings(); applySettings(); syncSettingsUI(); } },
    { icon:'sun', text:'حالت روشن', action:() => { S.theme='light'; S.autoTheme=false; saveSettings(); applySettings(); syncSettingsUI(); } },
    { icon:'settings', text:'باز کردن تنظیمات', action:() => openPanel() },
    { icon:'focus', text:'حالت تمرکز', hint:'Ctrl+Shift+F', action:toggleFocus },
    { section:'ابزار' },
    { icon:'refresh', text:'بررسی به‌روزرسانی', action:() => { toast('بررسی…', 'refresh'); checkForUpdates(); } },
    { icon:'keyboard', text:'میان‌بُرهای صفحه‌کلید', action:showShortcuts }
  ];
}

function openCmdk() {
  cmdk.open = true; cmdk.query = ''; cmdk.activeIdx = 0;
  $('#cmdk').classList.add('open');
  $('#cmdkInput').value = ''; $('#cmdkInput').focus();
  renderCmdk();
}
function closeCmdk() { cmdk.open = false; $('#cmdk').classList.remove('open'); }

function renderCmdk() {
  const q = cmdk.query.trim().toLowerCase();

  // Calculator
  const calc = q.match(/^(?:calc\s+)?([\d+\-*/().\s]+)$/i);
  if (calc && /[+\-*/]/.test(calc[1])) {
    try {
      const r = Function('"use strict";return (' + calc[1] + ')')();
      if (typeof r === 'number' && isFinite(r)) {
        $('#cmdkList').innerHTML = `
          <div class="cmdk-section">نتیجه محاسبه</div>
          <div class="cmdk-item active" data-calc="${r}">
            <div class="ci-icon">${icon('zap')}</div>
            <div class="ci-text">${esc(calc[1].trim())} = <strong>${toFa(r)}</strong></div>
            <span class="ci-hint">Enter</span>
          </div>`;
        return;
      }
    } catch {}
  }

  const all = buildCommands();
  const filtered = !q ? all : all.filter(c => !c.section && (c.text.toLowerCase().includes(q) || (c.hint||'').toLowerCase().includes(q)));

  if (!filtered.length) {
    $('#cmdkList').innerHTML = `
      <div class="cmdk-section">جستجوی وب</div>
      <div class="cmdk-item active" data-web="1">
        <div class="ci-icon">${icon('globe')}</div>
        <div class="ci-text">جستجوی «${esc(q)}» در گوگل</div>
        <span class="ci-hint">Enter</span>
      </div>`;
    return;
  }

  $('#cmdkList').innerHTML = filtered.map((c, i) => c.section
    ? `<div class="cmdk-section">${esc(c.section)}</div>`
    : `<div class="cmdk-item ${i === cmdk.activeIdx ? 'active' : ''}" data-idx="${i}">
         <div class="ci-icon">${icon(c.icon || 'zap')}</div>
         <div class="ci-text">${esc(c.text)}</div>
         ${c.hint ? `<span class="ci-hint">${esc(c.hint)}</span>` : ''}
       </div>`).join('');

  $$('#cmdkList .cmdk-item').forEach(el => el.onclick = () => {
    const cmd = filtered[+el.dataset.idx];
    if (cmd && cmd.action) { cmd.action(); closeCmdk(); }
  });
}

function executeCmdk() {
  const active = $('#cmdkList .cmdk-item.active');
  if (!active) return;
  if (active.dataset.calc) {
    navigator.clipboard?.writeText(active.dataset.calc).then(() => toast('کپی شد'));
    closeCmdk(); return;
  }
  if (active.dataset.web) {
    window.open('https://www.google.com/search?q=' + encodeURIComponent(cmdk.query), '_blank');
    closeCmdk(); return;
  }
  const filterFn = (c) => !c.section && (c.text.toLowerCase().includes(cmdk.query.trim().toLowerCase()) || (c.hint||'').toLowerCase().includes(cmdk.query.trim().toLowerCase()));
  const filtered = cmdk.query.trim() ? buildCommands().filter(filterFn) : buildCommands().filter(c => !c.section);
  const cmd = filtered[cmdk.activeIdx];
  if (cmd && cmd.action) { cmd.action(); closeCmdk(); }
}

$('#cmdkBtn').onclick = openCmdk;
$('#cmdk').onclick = (e) => { if (e.target.id === 'cmdk') closeCmdk(); };
$('#cmdkInput').oninput = (e) => { cmdk.query = e.target.value; cmdk.activeIdx = 0; renderCmdk(); };
$('#cmdkInput').onkeydown = (e) => {
  if (e.key === 'Escape') closeCmdk();
  else if (e.key === 'Enter') executeCmdk();
  else if (e.key === 'ArrowDown') { e.preventDefault(); cmdk.activeIdx = Math.min(cmdk.activeIdx+1, 50); renderCmdk(); }
  else if (e.key === 'ArrowUp')   { e.preventDefault(); cmdk.activeIdx = Math.max(0, cmdk.activeIdx-1); renderCmdk(); }
};

/* ==================== FOCUS MODE ==================== */
function toggleFocus() {
  const on = $('#app').classList.toggle('focus-mode');
  toast(on ? 'حالت تمرکز روشن' : 'حالت تمرکز خاموش', 'focus');
}
$('#focusBtn').onclick = toggleFocus;

/* ==================== SHORTCUTS ==================== */
function showShortcuts() {
  const items = [
    ['Ctrl + K', 'Command Palette'],
    ['Ctrl + 1..7', 'پرش بین Viewها'],
    ['Ctrl + Shift + F', 'حالت تمرکز'],
    ['Ctrl + N', 'یادداشت جدید'],
    ['Ctrl + T', 'کار جدید'],
    ['Ctrl + /', 'این راهنما'],
    ['Esc', 'بستن پنجره']
  ];
  $('#cmdkList').innerHTML = `
    <div class="cmdk-section">میان‌بُرهای صفحه‌کلید</div>
    ${items.map(([k,v]) => `
      <div class="cmdk-item">
        <div class="ci-icon">${icon('keyboard')}</div>
        <div class="ci-text">${v}</div>
        <span class="ci-hint" style="background:var(--surface-3);padding:.15rem .5rem;border-radius:4px">${k}</span>
      </div>`).join('')}`;
  $('#cmdkInput').value = ''; cmdk.query = '';
  $('#cmdk').classList.add('open');
}
$('#shortcutsBtn').onclick = showShortcuts;

/* ==================== KEYBOARD ==================== */
document.addEventListener('keydown', (e) => {
  const mod = navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(); }
  else if (mod && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFocus(); }
  else if (mod && e.key === '/') { e.preventDefault(); showShortcuts(); }
  else if (mod && e.key.toLowerCase() === 'n' && !e.shiftKey) { e.preventDefault(); switchView('notes'); setTimeout(()=>openNoteModal(null,-1), 100); }
  else if (mod && e.key.toLowerCase() === 't' && !e.shiftKey) { e.preventDefault(); switchView('tasks'); setTimeout(()=>$('#todoInputFull').focus(), 100); }
  else if (mod && e.key >= '1' && e.key <= '7') {
    e.preventDefault();
    const views = ['home','tasks','notes','bookmarks','calendar','habits','stats'];
    if (views[+e.key - 1]) switchView(views[+e.key - 1]);
  }
  else if (e.key === 'Escape') {
    if (cmdk.open) closeCmdk();
    if ($('#modal').classList.contains('open')) closeModal();
    if ($('#settingsPanel').classList.contains('open')) closePanel();
  }
});

/* ==================== THEME ==================== */
$('#themeBtn').onclick = () => {
  const cur = document.documentElement.getAttribute('data-theme');
  S.theme = cur === 'dark' ? 'light' : 'dark';
  S.autoTheme = false;
  saveSettings(); applySettings(); syncSettingsUI();
};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.theme === 'system' && !S.autoTheme) applySettings(); });

/* ==================== NOTIFICATIONS ==================== */
$('#notifBtn').onclick = async () => {
  if (!('Notification' in window)) { toast('مرورگر پشتیبانی نمی‌کند', 'alert'); return; }
  if (Notification.permission === 'granted') { toast('اعلان‌ها فعال هستند'); return; }
  const p = await Notification.requestPermission();
  if (p === 'granted') {
    S.notificationsEnabled = true; saveSettings();
    new Notification('یارا', { body:'اعلان‌ها فعال شد! ✅' });
    toast('اعلان‌ها فعال شد');
  } else toast('رد شد', 'alert');
};

/* ==================== SETTINGS PANEL ==================== */
let currentTab = 'appearance';

function openPanel() { $('#settingsPanel').classList.add('open'); $('#panelBackdrop').classList.add('open'); renderPanelBody(); }
function closePanel() { $('#settingsPanel').classList.remove('open'); $('#panelBackdrop').classList.remove('open'); }
$('#settingsBtn').onclick = openPanel;
$('#panelClose').onclick = closePanel;
$('#panelBackdrop').onclick = closePanel;

$$('.panel-tab').forEach(t => t.onclick = () => {
  $$('.panel-tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  currentTab = t.dataset.tab;
  renderPanelBody();
});

function renderPanelBody() {
  const el = $('#panelBody');

  if (currentTab === 'appearance') {
    el.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-title">حالت نمایش</div>
        <div class="setting-row">
          <div class="setting-label">${icon('moon')} تم</div>
          <div class="segmented" id="themeSeg">
            <button data-v="light" class="${S.theme==='light'?'active':''}">روشن</button>
            <button data-v="dark" class="${S.theme==='dark'?'active':''}">تیره</button>
            <button data-v="system" class="${S.theme==='system'?'active':''}">سیستم</button>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('clock')} تم خودکار بر اساس ساعت</div>
          <div class="switch ${S.autoTheme?'on':''}" id="swAutoTheme"></div>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">اندازه و رنگ</div>
        <div class="setting-row">
          <div class="setting-label">${icon('type')} اندازه فونت</div>
          <div class="range-wrap">
            <input type="range" id="fsRange" min="0" max="4" step="1" value="${S.fontSize}">
            <span class="range-value">${FS_LABELS[S.fontSize]}</span>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('palette')} رنگ Accent</div>
          <div class="color-swatches" id="accentSwatches">
            ${ACCENT_PRESETS.map(c => `<div class="color-swatch ${c===S.accent?'active':''}" data-c="${c}" style="background:${c}"></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">پس‌زمینه</div>
        <div class="setting-row">
          <div class="setting-label">${icon('layout')} نوع پس‌زمینه</div>
          <div class="segmented" id="bgSeg">
            <button data-v="default" class="${S.background==='default'?'active':''}">پیش‌فرض</button>
            <button data-v="gradient" class="${S.background==='gradient'?'active':''}">گرادیان</button>
            <button data-v="dark" class="${S.background==='dark'?'active':''}">تیره</button>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('bell')} صدا در اعلان‌ها</div>
          <div class="switch ${S.soundEnabled?'on':''}" id="swSound"></div>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('layout')} جمع کردن سایدبار</div>
          <div class="switch ${S.sidebarCollapsed?'on':''}" id="swSidebar"></div>
        </div>
      </div>
    `;
    // Bind
    $$('#themeSeg button').forEach(b => b.onclick = () => { S.theme = b.dataset.v; S.autoTheme = false; saveSettings(); applySettings(); renderPanelBody(); });
    $('#swAutoTheme').onclick = () => { S.autoTheme = !S.autoTheme; saveSettings(); applySettings(); renderPanelBody(); };
    $('#fsRange').oninput = (e) => { S.fontSize = +e.target.value; saveSettings(); applySettings(); renderPanelBody(); };
    $$('#accentSwatches .color-swatch').forEach(sw => sw.onclick = () => { S.accent = sw.dataset.c; saveSettings(); applySettings(); renderPanelBody(); });
    $$('#bgSeg button').forEach(b => b.onclick = () => { S.background = b.dataset.v; saveSettings(); applySettings(); renderPanelBody(); });
    $('#swSound').onclick = () => { S.soundEnabled = !S.soundEnabled; saveSettings(); renderPanelBody(); };
    $('#swSidebar').onclick = () => { S.sidebarCollapsed = !S.sidebarCollapsed; saveSettings(); applySettings(); renderPanelBody(); };
  }

  else if (currentTab === 'widgets') {
    const WL = {
      clock:'ساعت و تاریخ', weather:'آب‌وهوا', quote:'نقل قول', worldclock:'ساعت جهانی',
      pomodoro:'پومودورو', 'stats-quick':'آمار سریع', goals:'اهداف روزانه',
      quicklinks:'دسترسی سریع', progress:'پیشرفت', habits:'عادت‌ها',
      todo:'کارها', notes:'یادداشت‌ها', bookmarks:'بوکمارک‌ها'
    };
    el.innerHTML = `<div class="panel-section"><div class="panel-section-title">نمایش ویجت‌ها</div>
      ${Object.keys(WL).map(k => `
        <div class="setting-row">
          <div class="setting-label">${icon('layout')} ${WL[k]}</div>
          <div class="switch ${S.widgets[k]?'on':''}" data-w="${k}"></div>
        </div>`).join('')}</div>`;
    $$('.panel-body .switch[data-w]').forEach(sw => sw.onclick = () => {
      S.widgets[sw.dataset.w] = !S.widgets[sw.dataset.w];
      saveSettings(); applyWidgets(); renderPanelBody();
    });
  }

  else if (currentTab === 'menu') {
    el.innerHTML = `<div class="panel-section"><div class="panel-section-title">ترتیب و نمایش منو</div>
      ${S.menu.map((m, i) => `
        <div class="menu-item-row">
          ${icon(m.icon)}
          <span style="flex:1">${esc(m.label)}</span>
          <button data-up="${i}" ${i===0?'disabled':''} class="btn-icon" style="width:1.5rem;height:1.5rem">${icon('chevron-up')}</button>
          <button data-down="${i}" ${i===S.menu.length-1?'disabled':''} class="btn-icon" style="width:1.5rem;height:1.5rem">${icon('chevron-down')}</button>
          <button data-vis="${i}" class="btn-icon" style="width:1.5rem;height:1.5rem">${icon(m.visible?'eye':'eye-off')}</button>
        </div>`).join('')}</div>`;
    $$('#panelBody [data-up]').forEach(b => b.onclick = () => {
      const i = +b.dataset.up;
      [S.menu[i-1], S.menu[i]] = [S.menu[i], S.menu[i-1]];
      saveSettings(); renderSidebar(); renderPanelBody();
    });
    $$('#panelBody [data-down]').forEach(b => b.onclick = () => {
      const i = +b.dataset.down;
      [S.menu[i+1], S.menu[i]] = [S.menu[i], S.menu[i+1]];
      saveSettings(); renderSidebar(); renderPanelBody();
    });
    $$('#panelBody [data-vis]').forEach(b => b.onclick = () => {
      const i = +b.dataset.vis;
      S.menu[i].visible = !S.menu[i].visible;
      if (!S.menu[i].visible && currentView === S.menu[i].id) switchView('home');
      saveSettings(); renderSidebar(); renderPanelBody();
    });
  }

  else if (currentTab === 'shortcuts') {
    const items = [
      ['Ctrl + K', 'Command Palette'],
      ['Ctrl + 1..7', 'پرش بین Viewها'],
      ['Ctrl + Shift + F', 'حالت تمرکز'],
      ['Ctrl + N', 'یادداشت جدید'],
      ['Ctrl + T', 'کار جدید'],
      ['Ctrl + /', 'راهنما'],
      ['Esc', 'بستن']
    ];
    el.innerHTML = `<div class="panel-section">
      <div class="panel-section-title">میان‌بُرهای صفحه‌کلید</div>
      ${items.map(([k,v]) => `
        <div class="setting-row">
          <div class="setting-label">${icon('keyboard')} ${v}</div>
          <span class="tag">${k}</span>
        </div>`).join('')}
    </div>`;
  }

  else if (currentTab === 'data') {
    el.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-title">پشتیبان‌گیری</div>
        <div class="setting-row">
          <div class="setting-label">${icon('save')} خروجی کامل (JSON)</div>
          <button class="btn btn-ghost btn-sm" id="exportBtn">دریافت</button>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('upload')} بازیابی از فایل</div>
          <button class="btn btn-ghost btn-sm" id="importBtn">انتخاب فایل</button>
          <input type="file" id="importFile" accept=".json" hidden>
        </div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">حذف داده‌ها</div>
        <div class="setting-row">
          <div class="setting-label">${icon('trash')} کارها</div>
          <button class="btn btn-danger btn-sm" data-clear="todos">حذف</button>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('trash')} یادداشت‌ها</div>
          <button class="btn btn-danger btn-sm" data-clear="notes">حذف</button>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('trash')} بوکمارک‌ها</div>
          <button class="btn btn-danger btn-sm" data-clear="bms">حذف</button>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('trash')} رویدادها</div>
          <button class="btn btn-danger btn-sm" data-clear="events">حذف</button>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('trash')} عادت‌ها</div>
          <button class="btn btn-danger btn-sm" data-clear="habits">حذف</button>
        </div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">بازنشانی کامل</div>
        <div class="setting-row">
          <div class="setting-label" style="color:var(--danger)">${icon('alert')} پاک کردن همه چیز</div>
          <button class="btn btn-danger btn-sm" id="resetBtn">بازنشانی</button>
        </div>
      </div>`;
    $('#exportBtn').onclick = exportAll;
    $('#importBtn').onclick = () => $('#importFile').click();
    $('#importFile').onchange = importAll;
    $('#resetBtn').onclick = resetAll;
    $$('#panelBody [data-clear]').forEach(b => b.onclick = () => {
      if (!confirm('حذف شود؟')) return;
      LS.del(b.dataset.clear);
      toast('حذف شد'); setTimeout(() => location.reload(), 500);
    });
  }

  else if (currentTab === 'about') {
    el.innerHTML = `
      <div class="panel-section" style="text-align:center;padding:1rem">
        <img src="logo.png" alt="یارا" style="width:80px;height:80px;border-radius:20px;margin:0 auto 1rem;display:block;box-shadow:0 8px 24px -8px rgba(99,102,241,.5)">
        <div style="font-weight:800;font-size:1.3rem">یارا</div>
        <div style="color:var(--muted);font-size:.85rem;margin-top:.25rem">داشبورد هوشمند شما</div>
        <div class="tag" style="margin-top:.75rem">نسخه ${toFa(APP_VERSION)}</div>
      </div>
      <div class="panel-section">
        <div class="setting-row">
          <div class="setting-label">${icon('globe')} مخزن گیت‌هاب</div>
          <a href="https://github.com/theesmaeil/yara-dashboard" target="_blank" class="btn btn-ghost btn-sm">مشاهده</a>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('users')} سازنده</div>
          <span class="tag">theesmaeil</span>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon('refresh')} بررسی به‌روزرسانی</div>
          <button class="btn btn-ghost btn-sm" id="aboutUpdateBtn">بررسی</button>
        </div>
      </div>
    `;
    $('#aboutUpdateBtn').onclick = () => { toast('بررسی…', 'refresh'); checkForUpdates(); };
  }
}

function syncSettingsUI() { if ($('#settingsPanel').classList.contains('open')) renderPanelBody(); }

/* ==================== EXPORT / IMPORT ==================== */
function exportAll() {
  const data = {};
  Object.keys(localStorage).filter(k => k.startsWith('yara.')).forEach(k => data[k] = localStorage[k]);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `yara-backup-v${APP_VERSION}-${Date.now()}.json`;
  a.click();
  toast('پشتیبان‌گیری انجام شد');
}
function importAll(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      Object.keys(d).forEach(k => localStorage.setItem(k, d[k]));
      toast('بازیابی شد');
      setTimeout(() => location.reload(), 700);
    } catch { toast('فایل نامعتبر', 'alert'); }
  };
  r.readAsText(f);
}
function resetAll() {
  if (!confirm('همه داده‌ها پاک شود؟ این عمل قابل بازگشت نیست.')) return;
  Object.keys(localStorage).filter(k => k.startsWith('yara.')).forEach(k => localStorage.removeItem(k));
  location.reload();
}

/* ==================== SIDEBAR ==================== */
let currentView = 'home';

function renderSidebar() {
  $('#sbNav').innerHTML = S.menu.filter(m => m.visible).map(m => {
    let badge = '';
    if (m.id === 'tasks') {
      const c = todos.filter(t => !t.done).length;
      if (c) badge = `<span class="sb-badge">${toFa(c)}</span>`;
    } else if (m.id === 'notes') {
      if (notes.length) badge = `<span class="sb-badge">${toFa(notes.length)}</span>`;
    } else if (m.id === 'bookmarks') {
      if (bms.length) badge = `<span class="sb-badge">${toFa(bms.length)}</span>`;
    }
    return `<div class="sb-item ${m.id===currentView?'active':''}" data-view="${m.id}">
      ${icon(m.icon)}
      <span class="sb-item-label">${esc(m.label)}</span>
      ${badge}
    </div>`;
  }).join('');
  $$('#sbNav .sb-item').forEach(el => el.onclick = () => switchView(el.dataset.view));
}

function switchView(id) {
  currentView = id;
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === id));
  $$('#sbNav .sb-item').forEach(el => el.classList.toggle('active', el.dataset.view === id));
  closeMobileSidebar();
  // Refresh view-specific content
  if (id === 'calendar') { if (!calendarYear) initCalendar(); renderCalendar(); }
  if (id === 'stats') renderStats();
  if (id === 'habits') renderHabits();
}

function openMobileSidebar() { $('#sidebar').classList.add('open'); $('#sbBackdrop').classList.add('show'); }
function closeMobileSidebar() { $('#sidebar').classList.remove('open'); $('#sbBackdrop').classList.remove('show'); }
$('#sbToggle').onclick = () => {
  if (innerWidth <= 768) openMobileSidebar();
  else { S.sidebarCollapsed = !S.sidebarCollapsed; saveSettings(); applySettings(); syncSettingsUI(); }
};
$('#sbBackdrop').onclick = closeMobileSidebar;

/* ==================== APPLY WIDGETS ==================== */
function applyWidgets() {
  Object.keys(S.widgets).forEach(k => {
    const el = $(`[data-widget="${k}"]`);
    if (el) el.classList.toggle('hidden', !S.widgets[k]);
  });
}

/* ==================== MODAL ==================== */
let modalCloseCb = null;
function openModal(html, onReady) {
  $('#modalContent').innerHTML = html;
  $('#modal').classList.add('open');
  $$('#modalContent [data-close]').forEach(b => b.onclick = closeModal);
  if (onReady) onReady();
}
function closeModal() { $('#modal').classList.remove('open'); }
$('#modal').onclick = (e) => { if (e.target.id === 'modal') closeModal(); };

/* ==================== VOICE INPUT ==================== */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  const rec = new SR();
  rec.lang = 'fa-IR';
  rec.continuous = false;
  rec.interimResults = false;
  $('#todoMicFull').onclick = () => {
    const btn = $('#todoMicFull');
    btn.innerHTML = icon('mic-off');
    rec.start();
    rec.onresult = (e) => {
      $('#todoInputFull').value = (e.results[0][0].transcript || '').trim();
      btn.innerHTML = icon('mic');
    };
    rec.onerror = () => { btn.innerHTML = icon('mic'); toast('خطا در ضبط', 'alert'); };
    rec.onend = () => { btn.innerHTML = icon('mic'); };
  };
} else {
  $('#todoMicFull').style.display = 'none';
}

/* ==================== AUTO UPDATE ==================== */
async function checkForUpdates() {
  try {
    const res = await fetch(UPDATE_URL + '?t=' + Date.now());
    if (!res.ok) return;
    const doc = new DOMParser().parseFromString(await res.text(), 'text/xml');
    const el = doc.querySelector('updatecheck');
    if (!el) return;
    const v = el.getAttribute('version');
    if (v && compareVersions(v, APP_VERSION) > 0) {
      $('#updateSub').textContent = `نسخه ${toFa(v)} آماده نصب است`;
      $('#updateBanner').classList.add('show');
      $('#updateBanner').dataset.version = v;
    }
  } catch (e) { console.warn('[Yara] update check failed', e); }
}
function compareVersions(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i]||0, y = pb[i]||0;
    if (x > y) return 1; if (x < y) return -1;
  }
  return 0;
}
$('#updateBtn').onclick = () => { if (chrome.runtime?.reload) chrome.runtime.reload(); else location.reload(); };
$('#changelogBtn').onclick = async () => {
  try {
    const md = await (await fetch(CHANGELOG_URL + '?t=' + Date.now())).text();
    const v = $('#updateBanner').dataset.version;
    const lines = md.split('\n');
    let section = '', out = [];
    for (const l of lines) {
      if (l.startsWith('## ')) {
        if (section && out.length) break;
        if (l.includes(v)) section = l;
      } else if (section) out.push(l);
    }
    $('#cmdkList').innerHTML = `
      <div class="cmdk-section">تغییرات نسخه ${toFa(v||'')}</div>
      <div style="padding:1rem;font-size:.85rem;line-height:1.9;color:var(--text-soft);white-space:pre-wrap">${esc(out.join('\n').trim() || 'لیست تغییرات در دسترس نیست')}</div>`;
    $('#cmdkInput').value = ''; cmdk.query = '';
    $('#cmdk').classList.add('open');
  } catch { toast('خطا در دریافت', 'alert'); }
};
$('#updateCheckBtn').onclick = () => { toast('بررسی به‌روزرسانی…', 'refresh'); checkForUpdates(); };

/* ==================== DEADLINE CHECK ==================== */
function checkDeadlines() {
  if (Notification.permission !== 'granted') return;
  const today = todayISO();
  const urgent = todos.filter(t => !t.done && t.due && t.due <= today);
  urgent.forEach(t => {
    if (!LS.get('notified.' + t.id, false)) {
      try {
        new Notification('یارا — یادآوری', { body: `${t.text} (سررسید: ${new Date(t.due).toLocaleDateString('fa-IR')})` });
        LS.set('notified.' + t.id, true);
      } catch {}
    }
  });
}

/* ==================== INIT ==================== */
function init() {
  applySettings();
  applyWidgets();
  renderSidebar();
  renderQuote(false);
  updatePomoDisplay();
  renderTodos(); renderNotes(); renderBms(); renderQls();
  renderHabits(); renderGoals();
  initCalendar(); renderCalendar();
  renderStats();

  updateClock(); setInterval(updateClock, 1000);
  updateWorldClock(); setInterval(updateWorldClock, 30000);
  updateGreeting(); setInterval(updateGreeting, 60000);

  initWeather();
  setInterval(initWeather, 30 * 60 * 1000);

  checkForUpdates();
  setInterval(checkForUpdates, 6 * 60 * 60 * 1000);

  checkDeadlines();
  setInterval(checkDeadlines, 60 * 60 * 1000);

  if ('Notification' in window && Notification.permission === 'granted') S.notificationsEnabled = true;
  $('#sbVersion').textContent = 'نسخه ' + toFa(APP_VERSION);
  $('#aboutVersion') && ($('#aboutVersion').textContent = APP_VERSION);
}

window.yara = { reset: resetAll };
init();
})();