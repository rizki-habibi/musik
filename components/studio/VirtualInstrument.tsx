"use client";

import {useEffect,useRef,useState} from "react";

const KEYS=[
  {note:"C4",midi:60,black:false},{note:"C#4",midi:61,black:true},{note:"D4",midi:62,black:false},
  {note:"D#4",midi:63,black:true},{note:"E4",midi:64,black:false},{note:"F4",midi:65,black:false},
  {note:"F#4",midi:66,black:true},{note:"G4",midi:67,black:false},{note:"G#4",midi:68,black:true},
  {note:"A4",midi:69,black:false},{note:"A#4",midi:70,black:true},{note:"B4",midi:71,black:false},
  {note:"C5",midi:72,black:false}
];

function hz(midi:number){return 440*Math.pow(2,(midi-69)/12)}

export default function VirtualInstrument(){
  const audio=useRef<AudioContext|null>(null);
  const [instrument,setInstrument]=useState<"piano"|"synth"|"organ"|"bass">("piano");
  const [octave,setOctave]=useState(4);
  const [active,setActive]=useState<number[]>([]);
  const [sustain,setSustain]=useState(false);
  const held=useRef<Map<number,{osc:OscillatorNode,gain:GainNode}>>(new Map());

  function ctx(){audio.current ??= new AudioContext(); if(audio.current.state==="suspended") void audio.current.resume(); return audio.current}
  function play(midi:number){
    if(held.current.has(midi))return;
    const c=ctx(), osc=c.createOscillator(), gain=c.createGain();
    osc.type=instrument==="piano"?"triangle":instrument==="organ"?"sine":instrument==="bass"?"sawtooth":"square";
    osc.frequency.value=hz(midi+(octave-4)*12);
    const now=c.currentTime;
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(instrument==="piano"?0.42:0.25,now+0.015);
    if(instrument==="piano")gain.gain.exponentialRampToValueAtTime(0.18,now+0.18);
    osc.connect(gain).connect(c.destination); osc.start();
    held.current.set(midi,{osc,gain}); setActive(v=>v.includes(midi)?v:[...v,midi]);
  }
  function stop(midi:number){
    const v=held.current.get(midi); if(!v)return;
    const c=audio.current; if(!c)return;
    const now=c.currentTime; v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setTargetAtTime(0.0001,now,sustain?0.35:0.045);
    v.osc.stop(now+(sustain?1.2:0.18)); held.current.delete(midi);
    setActive(x=>x.filter(n=>n!==midi));
  }
  useEffect(()=>()=>{held.current.forEach(v=>v.osc.stop()); audio.current?.close()},[]);
  useEffect(()=>{
    const map:Record<string,number>={a:0,w:1,s:2,e:3,d:4,f:5,t:6,g:7,y:8,h:9,u:10,j:11,k:12};
    const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches("input,textarea,select"))return; const n=map[e.key.toLowerCase()]; if(n!==undefined){e.preventDefault();play(60+n)}};
    const up=(e:KeyboardEvent)=>{const n=map[e.key.toLowerCase()]; if(n!==undefined)stop(60+n)};
    window.addEventListener("keydown",down); window.addEventListener("keyup",up); return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up)}
  },[instrument,octave,sustain]);

  return <section className="instrument-panel">
    <div className="instrument-head">
      <div><small>ALAT MUSIK</small><h2>Keyboard Virtual</h2><p>Mainkan langsung dengan mouse atau keyboard komputer.</p></div>
      <div className="instrument-tools">
        <select value={instrument} onChange={e=>setInstrument(e.target.value as typeof instrument)} aria-label="Pilih suara"><option value="piano">Piano</option><option value="synth">Synth</option><option value="organ">Organ</option><option value="bass">Bass</option></select>
        <button type="button" onClick={()=>setOctave(o=>Math.max(1,o-1))}>−</button><b>Oktaf {octave}</b><button type="button" onClick={()=>setOctave(o=>Math.min(7,o+1))}>+</button>
        <label className="sustain"><input type="checkbox" checked={sustain} onChange={e=>setSustain(e.target.checked)}/> Tahan</label>
      </div>
    </div>
    <div className="keyboard" role="group" aria-label="Keyboard piano">
      {KEYS.map(k=><button key={k.note} type="button" className={`key ${k.black?"black":"white"} ${active.includes(k.midi)?"pressed":""}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);play(k.midi)}} onPointerUp={()=>stop(k.midi)} onPointerCancel={()=>stop(k.midi)} onPointerLeave={e=>{if(e.buttons)stop(k.midi)}}>{k.note}</button>)}
    </div>
    <div className="key-help">Keyboard: A W S E D F T G Y H U J K · tekan beberapa tombol untuk memainkan akor.</div>
  </section>
}