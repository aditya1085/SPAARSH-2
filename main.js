/* ===== TAB SWITCHING ===== */
document.querySelectorAll('.tabbtn').forEach(b=>b.addEventListener('click', ()=>{
  document.querySelectorAll('.tabbtn').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  el('panel-'+b.dataset.tab).classList.add('active');
}));

/* ===== APP INITIALIZATION (called once, right after login/signup) ===== */
function initApp(){
  initNotifications();
  initMonitoring();
  initGuardians();
  initMeds();
  initChatList();
  initProfileTab();
  initSettingsTab();
}
