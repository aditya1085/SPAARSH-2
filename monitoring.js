/* ===== SENSORS, ACTIVITY DETECTION & ESCALATION ===== */
let lastInteraction = Date.now();
let lastKnownLat = null, lastKnownLng = null;
let level1ThresholdSec = 20;
let timers = [], simRunning = false;

const monRef = () => db.collection('monitoring').doc(myUid);

function initMonitoring(){
  el('activeWindowLabel').textContent = myProfile.activeStart+' – '+myProfile.activeEnd;
  el('thresholdInput').value = level1ThresholdSec;
  monRef().onSnapshot(doc=>{
    const d = doc.data(); if(!d) return;
    if(typeof d.level1ThresholdSec === 'number'){
      level1ThresholdSec = d.level1ThresholdSec;
      el('thresholdInput').value = level1ThresholdSec;
    }
    renderMyStage(d.stage, d.loc);
  });
}

el('saveThresholdBtn').addEventListener('click', ()=>{
  const v = parseInt(el('thresholdInput').value) || 20;
  monRef().set({level1ThresholdSec:v}, {merge:true});
});

['touchstart','mousedown','keydown','scroll','mousemove'].forEach(evt=>{
  document.addEventListener(evt, ()=>{ lastInteraction = Date.now(); }, {passive:true});
});
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState==='visible'){ lastInteraction = Date.now(); tryCameraOnResume(); }
});

setInterval(()=>{
  if(!myUid) return;
  const elapsed = Date.now()-lastInteraction;
  if(el('touchVal')) el('touchVal').textContent = fmtAgo(elapsed);
  if(!simRunning && myProfile && withinActiveWindow(myProfile.activeStart||'00:00', myProfile.activeEnd||'23:59') && elapsed > level1ThresholdSec*1000){
    runEscalation(true);
  }
}, 1000);

function renderMyStage(stage, loc){
  const hero = el('statusHero'); if(!hero) return;
  if(stage===0){
    hero.className='status-hero'; el('statusIcon').textContent='📱'; el('statusTitle').textContent='All is well';
    el('statusSub').textContent='Real touch/motion detected.'; el('statusTimer').textContent='';
    el('respondBtn').disabled=true; el('forceBtn').disabled=false; el('forceBtn').textContent='Force trigger (demo)';
    simRunning=false;
  }
  if(stage===1){
    hero.className='status-hero alert'; el('statusIcon').textContent='⏰'; el('statusTitle').textContent='Are you okay?';
    el('statusSub').textContent='No real activity detected in your active window.'; el('statusTimer').textContent='Check-in in progress';
    el('respondBtn').disabled=false;
  }
  if(stage===2){
    hero.className='status-hero alert'; el('statusIcon').textContent='📣'; el('statusTitle').textContent='Notifying guardians';
    el('statusSub').textContent='Still no response — reaching your guardians now.';
    el('respondBtn').disabled=false;
  }
  if(stage===3){
    hero.className='status-hero critical'; el('statusIcon').textContent='📍'; el('statusTitle').textContent='Location shared';
    el('statusSub').textContent='Your guardians can now see your real live location.'; el('statusTimer').textContent='';
    el('respondBtn').disabled=true; el('forceBtn').disabled=false; el('forceBtn').textContent='Run again'; simRunning=false;
  }
  if(stage==='ok'){
    hero.className='status-hero'; el('statusIcon').textContent='✅'; el('statusTitle').textContent='Marked as okay';
    el('statusSub').textContent='Guardians informed all is well.'; el('statusTimer').textContent='';
    el('respondBtn').disabled=true; lastInteraction=Date.now();
    el('forceBtn').disabled=false; el('forceBtn').textContent='Run again';
  }
}

async function writeMyStage(stage, loc){
  await monRef().set({stage, loc: loc||null, updatedAt:Date.now()}, {merge:true});
}

el('respondBtn').addEventListener('click', async ()=>{
  timers.forEach(t=>clearTimeout(t)); timers=[]; simRunning=false;
  await writeMyStage('ok');
  await notifyMyGuardians("✅ "+(myProfile.name||'User')+" confirmed they're okay.");
});
el('forceBtn').addEventListener('click', ()=>runEscalation(false));

async function notifyMyGuardians(text){
  const linkDoc = await db.collection('guardianLinks').doc(myUid).get();
  const list = (linkDoc.data() && linkDoc.data().list) || [];
  list.filter(g=>g.status==='accepted').forEach(g=>{
    pushNotification(g.guardianUid, text);
    sendChatMessage(g.guardianUid, text, true);
  });
}

async function runEscalation(fromReal){
  if(simRunning) return; simRunning=true;
  el('forceBtn').disabled=true; el('forceBtn').textContent='Running…';
  await writeMyStage(1);
  timers.push(setTimeout(async ()=>{
    await writeMyStage(2);
    await notifyMyGuardians("⏰ "+(myProfile.name||'User')+" hasn't responded. Please check on them.");
  }, fromReal?4000:2000));
  timers.push(setTimeout(async ()=>{
    const loc = lastKnownLat!==null ? {lat:lastKnownLat, lng:lastKnownLng} : null;
    await writeMyStage(3, loc);
    const locText = loc
      ? `📍 Emergency: ${myProfile.name}'s live location: https://maps.google.com/?q=${loc.lat},${loc.lng}`
      : `📍 Emergency escalation for ${myProfile.name} — location unavailable (GPS not enabled).`;
    await notifyMyGuardians(locText);
  }, fromReal?8000:5000));
}

/* ---- Real sensors ---- */
el('sensorToggleHead').addEventListener('click', ()=>{
  const body = el('sensorPanelBody');
  const open = body.style.display!=='none';
  body.style.display = open ? 'none' : 'block';
  el('sensorChevron').textContent = open ? '▸' : '▾';
});

el('enableSensorsBtn').addEventListener('click', async ()=>{
  try{
    if(typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function'){
      const res = await DeviceMotionEvent.requestPermission();
      if(res==='granted') startMotion();
    } else startMotion();
  }catch(e){}

  if(navigator.geolocation){
    navigator.geolocation.watchPosition(pos=>{
      lastKnownLat = pos.coords.latitude; lastKnownLng = pos.coords.longitude;
      el('gpsDot').className='dot live';
      el('gpsVal').textContent = lastKnownLat.toFixed(5)+', '+lastKnownLng.toFixed(5);
      lastInteraction = Date.now();
    }, ()=>{ el('gpsVal').textContent='Permission denied'; }, {enableHighAccuracy:true});
  } else el('gpsVal').textContent='Not supported';

  await tryCameraOnResume();
});

async function tryCameraOnResume(){
  if(!el('enableSensorsBtn')) return;
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:true});
    const v = el('camPreview'); v.srcObject=stream; v.style.display='block';
    el('camDot').className='dot live'; el('camVal').textContent='Live preview active (on resume)';
  }catch(e){ el('camVal').textContent='Permission denied / no camera'; }
}

function startMotion(){
  el('motionDot').className='dot live'; el('gyroDot').className='dot live';
  window.addEventListener('devicemotion', e=>{
    const a = e.accelerationIncludingGravity || e.acceleration;
    if(a && a.x!==null){
      el('motionVal').textContent = `x:${a.x?.toFixed(1)} y:${a.y?.toFixed(1)} z:${a.z?.toFixed(1)}`;
      if(Math.abs(a.x||0)+Math.abs(a.y||0)+Math.abs(a.z||0) > 2) lastInteraction = Date.now();
    }
  });
  window.addEventListener('deviceorientation', e=>{
    if(e.alpha!==null) el('gyroVal').textContent = `α:${e.alpha?.toFixed(0)}° β:${e.beta?.toFixed(0)}° γ:${e.gamma?.toFixed(0)}°`;
  });
  setTimeout(()=>{
    if(el('motionVal').textContent==='Not enabled') el('motionVal').textContent='No motion data (desktop)';
    if(el('gyroVal').textContent==='Not enabled') el('gyroVal').textContent='No orientation data (desktop)';
  }, 2500);
}
