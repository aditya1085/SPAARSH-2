/* ===== NOTIFICATIONS ===== */
function initNotifications(){
  db.collection('notifications').doc(myUid).onSnapshot(doc=>{
    const list = (doc.data() && doc.data().list) || [];
    const unread = list.filter(n=>!n.read).length;
    el('bellBadge').style.display = unread>0 ? 'block' : 'none';
    el('bellBadge').textContent = unread;
    const panel = el('notifPanel');
    if(!list.length){ panel.innerHTML = '<div class="notif-item">No notifications yet.</div>'; return; }
    panel.innerHTML = '';
    list.slice().reverse().slice(0,20).forEach(n=>{
      const d = document.createElement('div'); d.className='notif-item';
      d.innerHTML = n.text + '<div class="t">'+new Date(n.ts).toLocaleString()+'</div>';
      panel.appendChild(d);
    });
  });
}

el('bellBtn').addEventListener('click', async ()=>{
  const panel = el('notifPanel');
  panel.style.display = panel.style.display==='block' ? 'none' : 'block';
  const ref = db.collection('notifications').doc(myUid);
  const snap = await ref.get();
  const list = (snap.data() && snap.data().list) || [];
  list.forEach(n=>n.read=true);
  ref.set({list}, {merge:true});
});

async function pushNotification(uid, text){
  const ref = db.collection('notifications').doc(uid);
  await ref.set({list: FV.arrayUnion({text, ts:Date.now(), read:false})}, {merge:true});
}
