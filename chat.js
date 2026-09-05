/* ===== REAL-TIME CHAT ===== */
let activeChatUid = null;

async function initChatList(){
  const [linksSnap, reqSnap] = await Promise.all([
    db.collection('guardianLinks').doc(myUid).get(),
    db.collection('guardianRequests').doc(myUid).get()
  ]);
  const links = ((linksSnap.data() && linksSnap.data().list) || []).filter(g=>g.status==='accepted').map(g=>({uid:g.guardianUid, name:g.guardianName}));
  const reqs = ((reqSnap.data() && reqSnap.data().list) || []).filter(r=>r.status==='accepted').map(r=>({uid:r.fromUid, name:r.fromName}));
  const combined = [...links, ...reqs].filter((v,i,arr)=>arr.findIndex(x=>x.uid===v.uid)===i);

  const box = el('chatList');
  if(!combined.length){ box.innerHTML='<div class="empty">No conversations yet.</div>'; return; }
  box.innerHTML='';
  combined.forEach(c=>{
    const item = document.createElement('div');
    item.className = 'chat-list-item' + (activeChatUid===c.uid ? ' active' : '');
    item.textContent = c.name;
    item.onclick = ()=>openChat(c.uid, c.name);
    box.appendChild(item);
  });
}

function openChat(uid, name){
  activeChatUid = uid;
  document.querySelectorAll('.chat-list-item').forEach(i=>i.classList.remove('active'));
  initChatList();
  el('chatInputBox').disabled = false;
  el('chatSendBtn').disabled = false;
  const cid = chatId(myUid, uid);
  db.collection('chats').doc(cid).collection('messages').orderBy('ts').onSnapshot(snap=>{
    const box = el('chatMsgs'); box.innerHTML='';
    snap.forEach(doc=>{
      const m = doc.data();
      const b = document.createElement('div');
      b.className = 'bubble ' + (m.isLocation ? 'loc' : (m.sender===myUid ? 'me' : 'them'));
      b.innerHTML = m.text + '<div class="time">' + new Date(m.ts).toLocaleTimeString() + '</div>';
      box.appendChild(b);
    });
    box.scrollTop = box.scrollHeight;
  });
}

async function sendChatMessage(toUid, text, isLocation){
  const cid = chatId(myUid, toUid);
  await db.collection('chats').doc(cid).collection('messages').add({sender:myUid, text, ts:Date.now(), isLocation:!!isLocation});
}

el('chatSendBtn').addEventListener('click', ()=>{
  const text = el('chatInputBox').value.trim();
  if(!text || !activeChatUid) return;
  sendChatMessage(activeChatUid, text, false);
  el('chatInputBox').value='';
});
el('chatInputBox').addEventListener('keydown', e=>{ if(e.key==='Enter') el('chatSendBtn').click(); });
