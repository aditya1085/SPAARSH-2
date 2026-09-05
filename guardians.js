/* ===== GUARDIAN REQUESTS, LINKS & WATCH LIST ===== */
let unsubWatch = [];

function initGuardians(){
  db.collection('guardianLinks').doc(myUid).onSnapshot(doc=>{
    renderMyGuardians((doc.data() && doc.data().list) || []);
  });
  db.collection('guardianRequests').doc(myUid).onSnapshot(doc=>{
    const list = (doc.data() && doc.data().list) || [];
    renderIncomingRequests(list);
    renderWatchList(list);
    initChatList();
  });
}

el('addGuardianBtn').addEventListener('click', async ()=>{
  const email = el('addGuardianEmail').value.trim();
  const msg = el('guardianAddMsg');
  msg.textContent=''; msg.style.color='var(--ink-dim)';
  if(!email) return;
  if(email===myProfile.email){ msg.textContent='You cannot add yourself.'; msg.style.color='var(--red)'; return; }

  const q = await db.collection('users').where('email','==',email).limit(1).get();
  if(q.empty){ msg.textContent='No SPAARSH account found with that email — ask them to sign up first.'; msg.style.color='var(--red)'; return; }
  const targetDoc = q.docs[0]; const targetUid = targetDoc.id; const targetName = targetDoc.data().name;

  const myLinksRef = db.collection('guardianLinks').doc(myUid);
  const mySnap = await myLinksRef.get();
  const myList = (mySnap.data() && mySnap.data().list) || [];
  if(myList.some(g=>g.guardianUid===targetUid)){ msg.textContent='Already added.'; return; }
  myList.push({guardianUid:targetUid, guardianName:targetName, guardianEmail:email, status:'pending', addedAt:Date.now()});
  await myLinksRef.set({list:myList}, {merge:true});

  const theirReqRef = db.collection('guardianRequests').doc(targetUid);
  const theirSnap = await theirReqRef.get();
  const theirList = (theirSnap.data() && theirSnap.data().list) || [];
  theirList.push({fromUid:myUid, fromName:myProfile.name, fromEmail:myProfile.email, status:'pending', requestedAt:Date.now()});
  await theirReqRef.set({list:theirList}, {merge:true});

  await pushNotification(targetUid, `${myProfile.name} wants to add you as their guardian.`);
  msg.textContent='Request sent!'; msg.style.color='var(--sage)';
  el('addGuardianEmail').value='';
});

function renderMyGuardians(list){
  const box = el('myGuardiansList');
  if(!list.length){ box.innerHTML='<div class="empty">No guardians added yet.</div>'; return; }
  box.innerHTML='';
  list.forEach(g=>{
    const row = document.createElement('div'); row.className='person-card';
    row.innerHTML = `<div class="avatar">${initials(g.guardianName)}</div><div class="person-info"><div class="person-name">${g.guardianName}</div><div class="person-meta">${g.guardianEmail}</div></div><span class="status-pill ${g.status==='accepted'?'ok':'pending'}">${g.status==='accepted'?'Accepted':'Pending'}</span>`;
    box.appendChild(row);
  });
}

function renderIncomingRequests(list){
  const box = el('incomingRequestsList');
  const pending = list.filter(r=>r.status==='pending');
  if(!pending.length){ box.innerHTML='<div class="empty">No pending requests.</div>'; return; }
  box.innerHTML='';
  pending.forEach(r=>{
    const row = document.createElement('div'); row.className='person-card';
    row.innerHTML = `<div class="avatar">${initials(r.fromName)}</div><div class="person-info"><div class="person-name">${r.fromName}</div><div class="person-meta">wants you as their guardian</div></div>`;
    const btns = document.createElement('div'); btns.style.display='flex'; btns.style.gap='6px';
    const acc = document.createElement('button'); acc.className='btn btn-sm'; acc.textContent='Accept';
    acc.onclick = ()=>respondToRequest(r.fromUid, true);
    const dec = document.createElement('button'); dec.className='btn-outline btn-sm'; dec.textContent='Decline';
    dec.onclick = ()=>respondToRequest(r.fromUid, false);
    btns.appendChild(acc); btns.appendChild(dec); row.appendChild(btns);
    box.appendChild(row);
  });
}

async function respondToRequest(fromUid, accept){
  const myReqRef = db.collection('guardianRequests').doc(myUid);
  const mySnap = await myReqRef.get();
  const myList = (mySnap.data() && mySnap.data().list) || [];
  myList.forEach(r=>{ if(r.fromUid===fromUid) r.status = accept?'accepted':'declined'; });
  await myReqRef.set({list:myList}, {merge:true});

  const theirLinksRef = db.collection('guardianLinks').doc(fromUid);
  const theirSnap = await theirLinksRef.get();
  const theirList = (theirSnap.data() && theirSnap.data().list) || [];
  theirList.forEach(g=>{ if(g.guardianUid===myUid) g.status = accept?'accepted':'declined'; });
  await theirLinksRef.set({list:theirList}, {merge:true});

  await pushNotification(fromUid, `${myProfile.name} ${accept?'accepted':'declined'} your guardian request.`);
}

function renderWatchList(requestList){
  unsubWatch.forEach(u=>u()); unsubWatch=[];
  const accepted = requestList.filter(r=>r.status==='accepted');
  const box = el('watchList');
  if(!accepted.length){ box.innerHTML='<div class="empty">You are not watching anyone yet.</div>'; return; }
  box.innerHTML='';
  accepted.forEach(r=>{
    const card = document.createElement('div'); card.className='person-card'; card.style.flexDirection='column'; card.style.alignItems='stretch';
    card.innerHTML = `<div style="display:flex;align-items:center;gap:12px;"><div class="avatar">${initials(r.fromName)}</div><div class="person-info"><div class="person-name">${r.fromName}</div><div class="person-meta" id="watchmeta-${r.fromUid}">Loading status…</div></div><span class="status-pill ok" id="watchpill-${r.fromUid}">OK</span></div><div id="watchextra-${r.fromUid}"></div>`;
    box.appendChild(card);
    const unsub = db.collection('monitoring').doc(r.fromUid).onSnapshot(async doc=>{
      const d = doc.data(); if(!d) return;
      const pill = el('watchpill-'+r.fromUid), meta = el('watchmeta-'+r.fromUid), extra = el('watchextra-'+r.fromUid);
      if(!pill) return;
      if(d.stage===0 || d.stage==='ok'){ pill.className='status-pill ok'; pill.textContent='All well'; meta.textContent='Status: normal'; extra.innerHTML=''; }
      else if(d.stage===1 || d.stage===2){ pill.className='status-pill warn'; pill.textContent='Checking in'; meta.textContent='Not responding to check-ins'; extra.innerHTML=''; }
      else if(d.stage===3){
        pill.className='status-pill crit'; pill.textContent='EMERGENCY'; meta.textContent='Escalated — details unlocked below';
        const prof = await db.collection('users').doc(r.fromUid).get();
        const p = prof.data() || {};
        const locStr = d.loc ? `${d.loc.lat.toFixed(5)}, ${d.loc.lng.toFixed(5)}` : 'unavailable';
        const mapLink = d.loc ? `https://maps.google.com/?q=${d.loc.lat},${d.loc.lng}` : '#';
        extra.innerHTML = `<div class="emergency-box">📍 Live location: <a href="${mapLink}" target="_blank">${locStr}</a><br>Age: ${p.age||'—'} · Emergency contact: ${p.emergencyName||'—'} (${p.emergencyPhone||'—'})</div>`;
      }
    });
    unsubWatch.push(unsub);
  });
}
