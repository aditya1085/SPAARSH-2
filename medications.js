/* ===== MEDICATION ADHERENCE ===== */
function initMeds(){
  db.collection('medications').doc(myUid).onSnapshot(doc=>{
    renderMeds((doc.data() && doc.data().list) || []);
  });
}

function renderMeds(list){
  const box = el('medList');
  if(!list.length){ box.innerHTML='<div class="empty">No medications added yet.</div>'; return; }
  box.innerHTML='';
  list.forEach((m,i)=>{
    const row = document.createElement('div'); row.className='med-row';
    const remaining = Math.max(0, Math.ceil((m.dueAt-Date.now())/1000));
    let cls='pending', txt=remaining+'s left';
    if(m.status==='taken'){ cls='taken'; txt='Taken'; }
    else if(m.status==='missed'){ cls='missed'; txt='Missed'; }
    row.innerHTML = `<span>${m.name}</span>`;
    const tag = document.createElement('span'); tag.className='tag '+cls; tag.textContent=txt; row.appendChild(tag);
    if(m.status==='pending'){
      const btn = document.createElement('button'); btn.className='btn btn-sm'; btn.textContent='Taken';
      btn.onclick = async ()=>{
        const ref = db.collection('medications').doc(myUid);
        const snap = await ref.get();
        const l = (snap.data() && snap.data().list) || [];
        l[i].status='taken';
        await ref.set({list:l}, {merge:true});
      };
      row.appendChild(btn);
    }
    box.appendChild(row);
  });
}

el('addMedBtn').addEventListener('click', async ()=>{
  const name = el('medName').value.trim() || 'Unnamed medication';
  const secs = parseInt(el('medSeconds').value) || 30;
  const ref = db.collection('medications').doc(myUid);
  const snap = await ref.get();
  const list = (snap.data() && snap.data().list) || [];
  list.push({name, dueAt:Date.now()+secs*1000, status:'pending', alerted:false});
  await ref.set({list}, {merge:true});
  el('medName').value='';
});

setInterval(async ()=>{
  if(!myUid) return;
  const ref = db.collection('medications').doc(myUid);
  const snap = await ref.get();
  const list = (snap.data() && snap.data().list) || [];
  let changed = false;
  for(const m of list){
    if(m.status==='pending' && Date.now()>m.dueAt){
      m.status='missed'; changed=true;
      if(!m.alerted){ m.alerted=true; await notifyMyGuardians(`💊 Missed dose: ${m.name} (${myProfile?myProfile.name:'User'})`); }
    }
  }
  if(changed) await ref.set({list}, {merge:true});
}, 2000);
