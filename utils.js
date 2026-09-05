/* ===== SHARED UTILITIES ===== */

function fmtAgo(ms){
  const s = Math.floor(ms/1000);
  if(s<5) return 'just now';
  if(s<60) return s+'s ago';
  const m = Math.floor(s/60);
  if(m<60) return m+'m '+(s%60)+'s ago';
  const h = Math.floor(m/60);
  return h+'h '+(m%60)+'m ago';
}

function withinActiveWindow(start, end){
  const now = new Date();
  const cur = now.getHours()*60 + now.getMinutes();
  const [sh,sm] = start.split(':').map(Number);
  const [eh,em] = end.split(':').map(Number);
  const s = sh*60+sm, e = eh*60+em;
  if(s<=e) return cur>=s && cur<=e;
  return cur>=s || cur<=e; // overnight window (e.g. 22:00-06:00)
}

function initials(name){
  return (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
}

function chatId(a,b){ return [a,b].sort().join('_'); }
