const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const SCALE_INTERVALS = { major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10] };
const STYLE_PATTERNS = {
  ballad:{ melodyDensity:.52, drumDensity:.24, octave:4 },
  pop:{ melodyDensity:.68, drumDensity:.78, octave:4 },
  lofi:{ melodyDensity:.45, drumDensity:.55, octave:4 },
  cinematic:{ melodyDensity:.38, drumDensity:.30, octave:5 },
  electronic:{ melodyDensity:.72, drumDensity:.88, octave:5 }
};
const CHORD_SETS = {
  major:[[0,4,5,3],[0,5,3,4],[5,3,0,4],[0,3,4,3]],
  minor:[[0,5,2,6],[0,6,5,6],[5,3,0,6],[0,3,6,5]]
};

const defaultProject = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  title:"Lagu Baru",
  prompt:$("#prompt")?.value || "",
  style:"ballad", mood:"sad", key:"C", scale:"minor", bpm:76, bars:16,
  progression:[],
  tracks:[
    {id:"melody",name:"Melody",instrument:"piano",volume:80,pan:0,muted:false,solo:false,notes:[]},
    {id:"chords",name:"Chords",instrument:"piano",volume:68,pan:-8,muted:false,solo:false,notes:[]},
    {id:"bass",name:"Bass",instrument:"bass",volume:72,pan:0,muted:false,solo:false,notes:[]},
    {id:"drums",name:"Drums",instrument:"drums",volume:65,pan:0,muted:false,solo:false,notes:[]}
  ],
  lyrics:$("#lyrics")?.value || "",
  updatedAt:Date.now()
});

let project = defaultProject();
let selectedTrackId = "melody";
let synths = {};
let scheduled = [];
let timer = null;
let playingSince = 0;

function toast(message){
  const el=$("#toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove("show"),2200);
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rand(arr){return arr[Math.floor(Math.random()*arr.length)]}
function midiToName(midi){return NOTE_NAMES[midi%12]+(Math.floor(midi/12)-1)}
function nameToMidi(note){
  const m=note.match(/^([A-G]#?)(-?\d)$/); if(!m)return 60;
  return NOTE_NAMES.indexOf(m[1])+(Number(m[2])+1)*12;
}
function keyRoot(){return NOTE_NAMES.indexOf(project.key)}
function scalePitches(octave=4){
  const root=keyRoot()+(octave+1)*12;
  return SCALE_INTERVALS[project.scale].map(i=>root+i);
}
function chordName(degree){
  const rootMidi=keyRoot()+SCALE_INTERVALS[project.scale][degree];
  const name=NOTE_NAMES[rootMidi%12];
  const minorDegrees=project.scale==="major"?[1,2,5]:[0,3,4];
  return name+(minorDegrees.includes(degree)?"m":"");
}
function chordMidi(degree, octave=3){
  const scale=SCALE_INTERVALS[project.scale], root=keyRoot()+(octave+1)*12+scale[degree];
  const third = project.scale==="major"
    ? ([0,3,4].includes(degree)?4:3)
    : ([2,5,6].includes(degree)?4:3);
  return [root,root+third,root+7];
}
function secPerBeat(){return 60/project.bpm}
function totalSeconds(){return project.bars*4*secPerBeat()}

function syncControlsToProject(){
  project.title=$("#projectTitle").value;
  project.prompt=$("#prompt").value;
  project.style=$("#style").value;
  project.mood=$("#mood").value;
  project.key=$("#key").value;
  project.scale=$("#scale").value;
  project.bpm=Number($("#bpm").value);
  project.bars=Number($("#bars").value);
  project.lyrics=$("#lyrics").value;
}
function syncProjectToControls(){
  $("#projectTitle").value=project.title;
  $("#prompt").value=project.prompt;
  $("#style").value=project.style;
  $("#mood").value=project.mood;
  $("#key").value=project.key;
  $("#scale").value=project.scale;
  $("#bpm").value=project.bpm;
  $("#bpmValue").textContent=project.bpm;
  $("#transportBpm").value=project.bpm;
  $("#bars").value=project.bars;
  $("#lyrics").value=project.lyrics;
}

function generateComposition(){
  syncControlsToProject();
  const progressionPattern=rand(CHORD_SETS[project.scale]);
  project.progression=Array.from({length:project.bars},(_,i)=>progressionPattern[i%progressionPattern.length]);

  const style=STYLE_PATTERNS[project.style]||STYLE_PATTERNS.ballad;
  const melody=project.tracks.find(t=>t.id==="melody");
  const chords=project.tracks.find(t=>t.id==="chords");
  const bass=project.tracks.find(t=>t.id==="bass");
  const drums=project.tracks.find(t=>t.id==="drums");
  melody.notes=[]; chords.notes=[]; bass.notes=[]; drums.notes=[];

  project.progression.forEach((degree,bar)=>{
    const beat=bar*4;
    const chord=chordMidi(degree,3);
    chord.forEach(midi=>chords.notes.push({midi,time:beat,duration:4,velocity:.58}));
    bass.notes.push({midi:chord[0]-12,time:beat,duration:1.75,velocity:.72});
    bass.notes.push({midi:chord[0]-12,time:beat+2,duration:1.5,velocity:.62});

    for(let step=0;step<8;step++){
      if(Math.random()>style.melodyDensity) continue;
      const t=beat+step*.5;
      const chordTone=rand(chord.map(n=>n+12));
      const scale=scalePitches(style.octave);
      let midi=Math.random()<.68?chordTone:rand(scale);
      if(project.mood==="bright"||project.mood==="hopeful") midi += Math.random()<.18?12:0;
      midi=clamp(midi,55,84);
      melody.notes.push({midi,time:t,duration:Math.random()<.25?1:.5,velocity:.65+Math.random()*.22});
    }

    for(let beatIn=0;beatIn<4;beatIn++){
      if(Math.random()<style.drumDensity || beatIn===0 || beatIn===2)
        drums.notes.push({midi:beatIn%2===0?36:38,time:beat+beatIn,duration:.12,velocity:.65});
      if(style.drumDensity>.5){
        drums.notes.push({midi:42,time:beat+beatIn+.5,duration:.08,velocity:.34});
      }
    }
  });

  ensureMelodyStarts();
  renderAll();
  saveProject();
  toast("Komposisi baru dibuat dan siap diedit");
}
function ensureMelodyStarts(){
  const m=project.tracks.find(t=>t.id==="melody");
  if(!m.notes.length) m.notes.push({midi:scalePitches(4)[0],time:0,duration:1,velocity:.75});
}

function renderAll(){
  renderRuler();
  renderTracks();
  renderPianoRoll();
  renderInspector();
  $("#chordProgression").textContent=project.progression.length
    ? project.progression.slice(0,8).map(chordName).join(" · ") + (project.progression.length>8?" …":"")
    : "Belum dibuat";
  $("#durationDisplay").textContent=formatTime(totalSeconds(),false);
  $("#bpmValue").textContent=project.bpm;
  $("#transportBpm").value=project.bpm;
}
function renderRuler(){
  const r=$("#timelineRuler"); r.innerHTML="<span></span>";
  for(let i=1;i<=16;i++) r.innerHTML+=`<span>${i}</span>`;
}
function renderTracks(){
  const wrap=$("#tracks"); wrap.innerHTML="";
  project.tracks.forEach(track=>{
    const el=document.createElement("div");
    el.className="track"; el.dataset.track=track.id;
    const bars=Math.max(1,project.bars);
    el.innerHTML=`
      <div class="track-info" data-select="${track.id}">
        <div><strong>${track.name}</strong><span>${track.instrument}</span></div>
        <div class="track-buttons">
          <button data-mute="${track.id}" title="Mute" style="${track.muted?"color:#fb7185":""}">M</button>
          <button data-solo="${track.id}" title="Solo" style="${track.solo?"color:#4ade80":""}">S</button>
        </div>
      </div>
      <div class="clip-area" data-select="${track.id}">
        <div class="clip" style="grid-column:1 / span 16" title="${track.notes.length} event"></div>
      </div>`;
    wrap.appendChild(el);
  });
  $$("[data-select]").forEach(e=>e.onclick=()=>{selectedTrackId=e.dataset.select;renderInspector()});
  $$("[data-mute]").forEach(e=>e.onclick=ev=>{ev.stopPropagation();const t=getTrack(e.dataset.mute);t.muted=!t.muted;renderTracks();saveProject()});
  $$("[data-solo]").forEach(e=>e.onclick=ev=>{ev.stopPropagation();const t=getTrack(e.dataset.solo);t.solo=!t.solo;renderTracks();saveProject()});
}
function getTrack(id){return project.tracks.find(t=>t.id===id)}
function renderInspector(){
  const t=getTrack(selectedTrackId)||project.tracks[0]; if(!t)return;
  $("#inspectorTitle").textContent=t.name;
  $("#instrumentSelect").value=["piano","synth","pluck","bass"].includes(t.instrument)?t.instrument:"piano";
  $("#trackVolume").value=t.volume; $("#trackVolumeValue").textContent=t.volume+"%";
  $("#trackPan").value=t.pan;
}
function renderPianoRoll(){
  const keys=$("#pianoKeys"), grid=$("#pianoGrid"); keys.innerHTML="";grid.innerHTML="";
  const melody=getTrack("melody"), high=84, low=48, steps=64;
  for(let midi=high;midi>=low;midi--){
    const k=document.createElement("div"); k.className="piano-key"+([1,3,6,8,10].includes(midi%12)?" black":""); k.textContent=midiToName(midi); keys.appendChild(k);
    for(let step=0;step<steps;step++){
      const cell=document.createElement("div"); cell.className="piano-cell"+((step+1)%4===0?" beat":"");
      cell.dataset.midi=midi; cell.dataset.step=step;
      const time=step*.5;
      if(melody.notes.some(n=>n.midi===midi&&Math.abs(n.time-time)<.001)) cell.classList.add("active");
      cell.onclick=()=>togglePianoNote(midi,time);
      grid.appendChild(cell);
    }
  }
}
function togglePianoNote(midi,time){
  const track=getTrack("melody");
  const idx=track.notes.findIndex(n=>n.midi===midi&&Math.abs(n.time-time)<.001);
  if(idx>=0) track.notes.splice(idx,1);
  else track.notes.push({midi,time,duration:.5,velocity:.78});
  track.notes.sort((a,b)=>a.time-b.time);
  renderPianoRoll(); saveProject();
}
function varyMelody(){
  const t=getTrack("melody"), pitches=scalePitches(STYLE_PATTERNS[project.style]?.octave||4);
  t.notes=t.notes.map(n=>{
    if(Math.random()<.35){
      const options=pitches.filter(p=>Math.abs(p-n.midi)<=5);
      return {...n,midi:options.length?rand(options):n.midi};
    }
    return n;
  });
  renderPianoRoll();saveProject();toast("Variasi melodi dibuat");
}

function initAudio(){
  if(synths.ready)return;
  synths.melody=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"triangle"},envelope:{attack:.02,decay:.2,sustain:.55,release:1}}).toDestination();
  synths.chords=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"sine"},envelope:{attack:.05,decay:.4,sustain:.45,release:1.8}}).toDestination();
  synths.bass=new Tone.MonoSynth({oscillator:{type:"square"},filter:{Q:2,type:"lowpass",rolloff:-24},envelope:{attack:.01,decay:.2,sustain:.45,release:.5},filterEnvelope:{attack:.01,decay:.15,sustain:.15,release:.4,baseFrequency:80,octaves:2.3}}).toDestination();
  synths.drum=new Tone.MembraneSynth().toDestination();
  synths.hat=new Tone.MetalSynth({frequency:180,envelope:{attack:.001,decay:.06,release:.02},harmonicity:5.1,modulationIndex:24,resonance:2800,octaves:1.2}).toDestination();
  synths.ready=true;
}
async function play(){
  await Tone.start(); initAudio(); stop(false);
  syncControlsToProject();
  Tone.Transport.bpm.value=project.bpm;
  Tone.Destination.volume.value=Tone.gainToDb(Number($("#masterVolume").value)/100);
  const anySolo=project.tracks.some(t=>t.solo);
  project.tracks.forEach(t=>{
    if(t.muted || (anySolo&&!t.solo))return;
    const vol=Tone.gainToDb(Math.max(.001,t.volume/100));
    t.notes.forEach(n=>{
      const id=Tone.Transport.schedule(time=>{
        const when=time, dur=n.duration*secPerBeat();
        if(t.id==="drums"){
          if(n.midi===42){synths.hat.volume.value=vol;synths.hat.triggerAttackRelease("16n",when,n.velocity)}
          else{synths.drum.volume.value=vol;synths.drum.triggerAttackRelease(n.midi===36?"C1":"G1","16n",when,n.velocity)}
        }else{
          const s=synths[t.id]||synths.melody;s.volume.value=vol;
          s.triggerAttackRelease(midiToName(n.midi),dur,when,n.velocity);
        }
      },n.time*secPerBeat());
      scheduled.push(id);
    });
  });
  Tone.Transport.scheduleOnce(()=>stop(),totalSeconds());
  Tone.Transport.start("+0.05"); playingSince=performance.now()+50;
  $("#playBtn").textContent="❚❚";
  timer=setInterval(updateClock,80);
}
function stop(resetClock=true){
  if(Tone.Transport){Tone.Transport.stop();Tone.Transport.cancel();}
  scheduled=[];clearInterval(timer);timer=null;$("#playBtn").textContent="▶";
  if(resetClock)$("#timeDisplay").textContent="00:00.0";
}
function updateClock(){
  const elapsed=Math.max(0,(performance.now()-playingSince)/1000);
  $("#timeDisplay").textContent=formatTime(Math.min(elapsed,totalSeconds()),true);
}
function formatTime(sec,tenths=true){
  const m=Math.floor(sec/60),s=Math.floor(sec%60),d=Math.floor((sec%1)*10);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}${tenths?"."+d:""}`;
}

function saveProject(){
  syncControlsToProject();
  project.updatedAt=Date.now();
  localStorage.setItem("musika.current",JSON.stringify(project));
  const list=JSON.parse(localStorage.getItem("musika.projects")||"[]");
  const without=list.filter(p=>p.id!==project.id);
  localStorage.setItem("musika.projects",JSON.stringify([{id:project.id,title:project.title,updatedAt:project.updatedAt},...without].slice(0,30)));
  $("#autosaveLabel").textContent="Tersimpan lokal";
}
function loadProject(){
  try{
    const saved=JSON.parse(localStorage.getItem("musika.current"));
    if(saved?.tracks){project=saved;syncProjectToControls();}
  }catch{}
}
function newProject(){
  if(confirm("Buat proyek baru? Proyek saat ini sudah tersimpan di browser.")){
    project=defaultProject();syncProjectToControls();generateComposition();
  }
}
function exportMidi(){
  if(typeof Midi==="undefined"){toast("Pustaka MIDI belum termuat");return}
  const midi=new Midi();
  midi.header.setTempo(project.bpm);
  project.tracks.filter(t=>t.id!=="drums").forEach(t=>{
    const mt=midi.addTrack(); mt.name=t.name;
    t.notes.forEach(n=>mt.addNote({
      midi:n.midi,time:n.time*secPerBeat(),duration:n.duration*secPerBeat(),velocity:n.velocity
    }));
  });
  const bytes=midi.toArray();
  const blob=new Blob([bytes],{type:"audio/midi"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download=(project.title||"musika").replace(/[^a-z0-9-_]+/gi,"-")+".mid";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast("MIDI berhasil diekspor");
}

function wireUI(){
  $("#generateBtn").onclick=generateComposition;
  $("#generateTopBtn").onclick=generateComposition;
  $("#saveBtn").onclick=()=>{saveProject();toast("Proyek disimpan")};
  $("#exportBtn").onclick=exportMidi;
  $("#newProjectBtn").onclick=newProject;
  $("#playBtn").onclick=()=>timer?stop():play();
  $("#stopBtn").onclick=()=>stop();
  $("#regenerateMelodyBtn").onclick=varyMelody;
  $("#addTrackBtn").onclick=()=>toast("Track audio/MIDI tambahan akan hadir di versi berikutnya");
  $("#bpm").oninput=e=>{$("#bpmValue").textContent=e.target.value;$("#transportBpm").value=e.target.value;project.bpm=Number(e.target.value);renderAll()};
  $("#transportBpm").onchange=e=>{$("#bpm").value=e.target.value;$("#bpmValue").textContent=e.target.value;project.bpm=Number(e.target.value);saveProject()};
  ["projectTitle","prompt","style","mood","key","scale","bars","lyrics"].forEach(id=>{
    $("#"+id).addEventListener("change",()=>{syncControlsToProject();if(["key","scale","bars"].includes(id))renderAll();saveProject()});
  });
  $("#trackVolume").oninput=e=>{const t=getTrack(selectedTrackId);t.volume=Number(e.target.value);$("#trackVolumeValue").textContent=t.volume+"%";saveProject()};
  $("#trackPan").oninput=e=>{getTrack(selectedTrackId).pan=Number(e.target.value);saveProject()};
  $("#instrumentSelect").onchange=e=>{getTrack(selectedTrackId).instrument=e.target.value;renderTracks();saveProject()};
  $$(".tab").forEach(tab=>tab.onclick=()=>{
    $$(".tab").forEach(t=>t.classList.remove("active")); $$(".tab-panel").forEach(p=>p.classList.remove("active"));
    tab.classList.add("active"); $("#"+tab.dataset.tab+"Panel").classList.add("active");
  });
  $$("[data-section]").forEach(b=>b.onclick=()=>{$("#lyrics").value+="\n\n"+b.dataset.section;project.lyrics=$("#lyrics").value;saveProject()});
  document.addEventListener("keydown",e=>{if(e.code==="Space"&&!["TEXTAREA","INPUT","SELECT"].includes(document.activeElement.tagName)){e.preventDefault();timer?stop():play()}});
}

loadProject();
wireUI();
if(!project.progression.length) generateComposition(); else renderAll();
