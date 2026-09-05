/* ===== SETTINGS TAB ===== */
function initSettingsTab(){
  el('settingsEmail').textContent = myProfile.email || 'Guest account (no email)';
  el('settingsCreated').textContent = myProfile.createdAt ? new Date(myProfile.createdAt).toLocaleDateString() : '—';

  el('changePasswordBtn').addEventListener('click', async ()=>{
    const msg = el('passwordMsg'); msg.textContent=''; 
    const current = el('currentPassword').value;
    const next = el('newPassword').value;
    if(!current || !next){ msg.textContent='Fill both fields.'; msg.style.color='var(--red)'; return; }
    if(next.length<6){ msg.textContent='New password must be at least 6 characters.'; msg.style.color='var(--red)'; return; }
    try{
      const user = auth.currentUser;
      const cred = firebase.auth.EmailAuthProvider.credential(user.email, current);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(next);
      msg.textContent='Password updated!'; msg.style.color='var(--sage)';
      el('currentPassword').value=''; el('newPassword').value='';
    }catch(e){
      msg.textContent = (e.message||'Error').replace('Firebase: ',''); msg.style.color='var(--red)';
    }
  });

  el('settingsLogoutBtn').addEventListener('click', ()=>{ auth.signOut(); location.reload(); });

  el('deleteAccountBtn').addEventListener('click', async ()=>{
    if(!confirm('This permanently deletes your SPAARSH account and all your data. Continue?')) return;
    try{
      const uid = myUid;
      await Promise.all([
        db.collection('users').doc(uid).delete(),
        db.collection('monitoring').doc(uid).delete(),
        db.collection('guardianLinks').doc(uid).delete(),
        db.collection('guardianRequests').doc(uid).delete(),
        db.collection('medications').doc(uid).delete(),
        db.collection('notifications').doc(uid).delete()
      ]);
      await auth.currentUser.delete();
      location.reload();
    }catch(e){
      el('deleteMsg').textContent = (e.message||'Could not delete — try logging out and back in, then retry.').replace('Firebase: ','');
      el('deleteMsg').style.color='var(--red)';
    }
  });
}
