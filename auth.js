/* ===== AUTHENTICATION ===== */
let authMode = 'login';

el('authToggleLink').addEventListener('click', (e)=>{
  e.preventDefault();
  setAuthMode(authMode==='login' ? 'signup' : 'login');
});

function setAuthMode(mode){
  authMode = mode;
  el('authTitle').textContent = mode==='login' ? 'Log in to SPAARSH' : 'Create your SPAARSH account';
  el('authSubText').textContent = mode==='login' ? 'Welcome back.' : 'One form — this covers you as both a User and a potential Guardian.';
  el('authSubmitBtn').textContent = mode==='login' ? 'Log In' : 'Sign Up';
  el('authToggleText').textContent = mode==='login' ? "Don't have an account?" : 'Already have an account?';
  el('authToggleLink').textContent = mode==='login' ? 'Sign up' : 'Log in';
  el('signupExtraFields').style.display = mode==='signup' ? 'block' : 'none';
  el('authError').textContent = '';
}

async function createUserDocuments(uid, profile){
  await db.collection('users').doc(uid).set(profile);
  await db.collection('monitoring').doc(uid).set({stage:0, loc:null, level1ThresholdSec:20, updatedAt:Date.now()});
  await db.collection('guardianLinks').doc(uid).set({list:[]});
  await db.collection('guardianRequests').doc(uid).set({list:[]});
  await db.collection('medications').doc(uid).set({list:[]});
  await db.collection('notifications').doc(uid).set({list:[]});
}

el('authSubmitBtn').addEventListener('click', async ()=>{
  const email = el('authEmail').value.trim();
  const pass = el('authPassword').value;
  el('authError').textContent = '';
  if(!email || !pass){ el('authError').textContent = 'Enter email and password.'; return; }
  if(!firebaseReady){ el('authError').textContent = 'Backend not connected.'; return; }
  el('authSubmitBtn').disabled = true;
  try{
    if(authMode==='login'){
      await auth.signInWithEmailAndPassword(email, pass);
    } else {
      const name = el('fName').value.trim();
      if(!name){ el('authError').textContent = 'Enter your full name.'; el('authSubmitBtn').disabled=false; return; }
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      const uid = cred.user.uid;
      const profile = {
        name, email,
        age: el('fAge').value || null,
        dob: el('fDob').value || null,
        phone: el('fPhone').value || null,
        emergencyName: el('fEmName').value || null,
        emergencyPhone: el('fEmPhone').value || null,
        activeStart: el('fActiveStart').value || '07:00',
        activeEnd: el('fActiveEnd').value || '23:00',
        createdAt: Date.now()
      };
      await createUserDocuments(uid, profile);
    }
  }catch(e){
    el('authError').textContent = (e.message || 'Something went wrong').replace('Firebase: ', '');
  }
  el('authSubmitBtn').disabled = false;
});

el('guestBtn').addEventListener('click', async ()=>{
  if(!firebaseReady) return;
  try{ await auth.signInAnonymously(); }
  catch(e){ el('authError').textContent = 'Guest sign-in unavailable — enable Anonymous auth in Firebase console.'; }
});

el('logoutBtn').addEventListener('click', ()=>{ if(auth) auth.signOut(); location.reload(); });

if(firebaseReady){
  auth.onAuthStateChanged(async user=>{
    if(user){
      myUid = user.uid;
      let profSnap = await db.collection('users').doc(myUid).get();
      if(!profSnap.exists){
        const guestProfile = {name:'Guest', email:null, activeStart:'00:00', activeEnd:'23:59', createdAt:Date.now()};
        await createUserDocuments(myUid, guestProfile);
        profSnap = await db.collection('users').doc(myUid).get();
      }
      myProfile = profSnap.data();
      el('authOverlay').style.display = 'none';
      el('app').style.display = 'block';
      initApp();
    } else {
      el('app').style.display = 'none';
      el('authOverlay').style.display = 'flex';
    }
  });
} else {
  el('authOverlay').style.display = 'none';
}
