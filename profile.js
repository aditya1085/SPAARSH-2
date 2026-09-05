/* ===== PROFILE TAB ===== */
let profileEditing = false;

function renderProfileView(){
  const box = el('profileViewBox');
  const p = myProfile || {};
  box.innerHTML = `
    <div class="avatar-lg">${initials(p.name)}</div>
    <div style="text-align:center;font-family:'Fraunces',serif;font-weight:700;font-size:18px;color:var(--teal);margin-bottom:14px;">${p.name||'Guest'}</div>
    <div class="profile-view-row"><span class="lbl">Email</span><span class="val">${p.email||'—'}</span></div>
    <div class="profile-view-row"><span class="lbl">Age</span><span class="val">${p.age||'—'}</span></div>
    <div class="profile-view-row"><span class="lbl">Date of Birth</span><span class="val">${p.dob||'—'}</span></div>
    <div class="profile-view-row"><span class="lbl">Phone</span><span class="val">${p.phone||'—'}</span></div>
    <div class="profile-view-row"><span class="lbl">Emergency Contact</span><span class="val">${p.emergencyName||'—'} (${p.emergencyPhone||'—'})</span></div>
    <div class="profile-view-row"><span class="lbl">Active Window</span><span class="val">${p.activeStart||'—'} – ${p.activeEnd||'—'}</span></div>
  `;
}

function renderProfileEdit(){
  const p = myProfile || {};
  const box = el('profileEditBox');
  box.innerHTML = `
    <div class="profile-edit-grid">
      <div class="field"><label>Full Name</label><input type="text" id="pName" value="${p.name||''}"></div>
      <div class="field"><label>Age</label><input type="number" id="pAge" value="${p.age||''}"></div>
      <div class="field"><label>Date of Birth</label><input type="date" id="pDob" value="${p.dob||''}"></div>
      <div class="field"><label>Phone</label><input type="tel" id="pPhone" value="${p.phone||''}"></div>
      <div class="field"><label>Emergency Contact Name</label><input type="text" id="pEmName" value="${p.emergencyName||''}"></div>
      <div class="field"><label>Emergency Contact Phone</label><input type="tel" id="pEmPhone" value="${p.emergencyPhone||''}"></div>
      <div class="field"><label>Active From</label><input type="time" id="pActiveStart" value="${p.activeStart||'07:00'}"></div>
      <div class="field"><label>Active Until</label><input type="time" id="pActiveEnd" value="${p.activeEnd||'23:00'}"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;">
      <button class="btn btn-sm" id="profileSaveBtn">Save changes</button>
      <button class="btn-outline btn-sm" id="profileCancelBtn">Cancel</button>
    </div>
    <div class="settings-msg" id="profileSaveMsg"></div>
  `;
  el('profileSaveBtn').addEventListener('click', saveProfile);
  el('profileCancelBtn').addEventListener('click', ()=>toggleProfileEdit(false));
}

async function saveProfile(){
  const updated = {
    name: el('pName').value.trim() || myProfile.name,
    age: el('pAge').value || null,
    dob: el('pDob').value || null,
    phone: el('pPhone').value || null,
    emergencyName: el('pEmName').value || null,
    emergencyPhone: el('pEmPhone').value || null,
    activeStart: el('pActiveStart').value || '07:00',
    activeEnd: el('pActiveEnd').value || '23:00'
  };
  await db.collection('users').doc(myUid).set(updated, {merge:true});
  myProfile = {...myProfile, ...updated};
  el('profileSaveMsg').textContent = 'Saved!';
  el('profileSaveMsg').style.color = 'var(--sage)';
  if(el('activeWindowLabel')) el('activeWindowLabel').textContent = updated.activeStart+' – '+updated.activeEnd;
  setTimeout(()=>toggleProfileEdit(false), 700);
}

function toggleProfileEdit(state){
  profileEditing = state;
  el('profileViewBox').style.display = state ? 'none' : 'block';
  el('profileEditBox').style.display = state ? 'block' : 'none';
  if(state) renderProfileEdit();
  else renderProfileView();
}

function initProfileTab(){
  renderProfileView();
  el('profileEditToggleBtn').addEventListener('click', ()=>toggleProfileEdit(!profileEditing));
}
