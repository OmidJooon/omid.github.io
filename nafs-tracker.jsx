import { useState, useEffect, useRef } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STORAGE_KEY = "nafs_v1";
const PIN_KEY = "nafs_pin";

const PALETTE = [
  "#E8614A","#E8964A","#E8C94A","#7EC87E","#4ABFE8",
  "#6A7FE8","#B46AE8","#E86AA8","#4AE8B4","#E84A6A"
];

const DEFAULT_WEAKNESSES = [
  { name: "Backbiting", desc: "Speaking about someone in a way they wouldn't like", why: "" },
  { name: "Anger", desc: "Losing composure in difficult situations", why: "" },
  { name: "Dishonesty", desc: "Small lies or misleading others", why: "" },
  { name: "Envy", desc: "Feeling resentment toward others' blessings", why: "" },
  { name: "Procrastination", desc: "Delaying what needs to be done out of laziness", why: "" },
];

const DEFAULT_HABITS = [
  { name: "Water Intake", type: "countable", unit: "glasses", desc: "Stay hydrated throughout the day" },
  { name: "Exercise", type: "timed", unit: "min", desc: "Physical activity" },
  { name: "Reading", type: "timed", unit: "min", desc: "Read books or articles" },
  { name: "Sleep", type: "timed", unit: "hrs", desc: "Quality sleep" },
];

const WEAKNESS_SITUATIONS = ["With family","With friends","At work","Online","In private","Under stress"];
const HABIT_SITUATIONS = ["At home","At work","Traveling","Morning","Afternoon","Evening","Weekday","Weekend"];

const WEEKLY_QUESTIONS = [
  "What was your hardest moment this week?",
  "Which weakness showed up most? Why do you think that is?",
  "What are you most proud of this week?",
  "What is one thing you want to focus on next week?"
];

const QUOTES = [
  "The greatest jihad is to battle your own soul.",
  "Know yourself, and you will know your Lord.",
  "He who conquers himself is greater than he who conquers a city.",
  "Self-knowledge is the beginning of self-improvement.",
  "Every day is a new opportunity to grow."
];

// ── storage ──────────────────────────────────────────────────────────────────
const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
};
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const loadPin = () => localStorage.getItem(PIN_KEY) || null;
const savePin = (pin) => localStorage.setItem(PIN_KEY, pin);
const removePin = () => localStorage.removeItem(PIN_KEY);

// ── initial state ─────────────────────────────────────────────────────────────
const initState = () => ({
  weaknesses: [],
  habits: [],
  logs: {},        // { date: { wid/hid: { done, situations[], note } } }
  weeklyReflections: {},  // { weekKey: { answers: [] } }
  archivedWeaknesses: [],
  archivedHabits: [],
});

// ── components ────────────────────────────────────────────────────────────────

const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    chevronRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    chevronDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    lock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    sun: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    warning: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    export: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    archive: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    note: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4h10l-1 7a5 5 0 0 1-8 0L7 4z"/><path d="M5 4H3v3a4 4 0 0 0 4 4"/><path d="M19 4h2v3a4 4 0 0 1-4 4"/></svg>,
  };
  return icons[name] || null;
};

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
  <div style={{
    position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,
    display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",
    backdropFilter:"blur(4px)"
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{
      background:"#1a1a2e",border:"1px solid #2a2a4a",borderRadius:"20px",
      padding:"24px",width:"100%",maxWidth: wide ? 520 : 380,
      maxHeight:"90vh",overflowY:"auto",
      boxShadow:"0 24px 80px rgba(0,0,0,0.6)"
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
        <h3 style={{margin:0,fontSize:"18px",fontFamily:"'Playfair Display',serif",color:"#f0f0ff"}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#666",padding:"4px"}}>
          <Icon name="x" size={20}/>
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ── Input / Button helpers ────────────────────────────────────────────────────
const Input = ({ style, ...props }) => (
  <input style={{
    background:"#0d0d1a",border:"1px solid #2a2a4a",borderRadius:"10px",
    padding:"10px 14px",color:"#f0f0ff",fontSize:"14px",width:"100%",
    outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",...style
  }} {...props}/>
);

const Textarea = ({ style, ...props }) => (
  <textarea style={{
    background:"#0d0d1a",border:"1px solid #2a2a4a",borderRadius:"10px",
    padding:"10px 14px",color:"#f0f0ff",fontSize:"14px",width:"100%",
    outline:"none",fontFamily:"'DM Sans',sans-serif",resize:"vertical",
    minHeight:"80px",boxSizing:"border-box",...style
  }} {...props}/>
);

const Btn = ({ children, onClick, color, outline, small, style, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? "transparent" : (color || "#6A7FE8"),
    border: `1.5px solid ${color || "#6A7FE8"}`,
    color: outline ? (color || "#6A7FE8") : "#fff",
    borderRadius:"12px",padding: small ? "8px 16px" : "12px 20px",
    fontSize: small ? "13px" : "14px",fontWeight:"600",cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif",
    opacity: disabled ? 0.5 : 1,...style
  }}>{children}</button>
);

// ── Color Picker ──────────────────────────────────────────────────────────────
const ColorPicker = ({ value, onChange }) => (
  <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
    {PALETTE.map(c => (
      <div key={c} onClick={() => onChange(c)} style={{
        width:"28px",height:"28px",borderRadius:"50%",background:c,cursor:"pointer",
        border: value===c ? "3px solid #fff" : "2px solid transparent",
        boxSizing:"border-box",transition:"transform 0.15s",
        transform: value===c ? "scale(1.2)" : "scale(1)"
      }}/>
    ))}
  </div>
);

// ── Situation Picker ──────────────────────────────────────────────────────────
const SituationPicker = ({ situations, selected, onChange, onAdd, type }) => {
  const [newSit, setNewSit] = useState("");
  const defaults = type === "weakness" ? WEAKNESS_SITUATIONS : HABIT_SITUATIONS;
  const allSits = [...new Set([...defaults, ...situations])];
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"10px"}}>
        {allSits.map(s => (
          <div key={s} onClick={() => {
            const next = selected.includes(s) ? selected.filter(x=>x!==s) : [...selected,s];
            onChange(next);
          }} style={{
            padding:"6px 12px",borderRadius:"20px",fontSize:"13px",cursor:"pointer",
            background: selected.includes(s) ? "#6A7FE8" : "#0d0d1a",
            border:`1px solid ${selected.includes(s) ? "#6A7FE8" : "#2a2a4a"}`,
            color: selected.includes(s) ? "#fff" : "#999",transition:"all 0.15s"
          }}>{s}</div>
        ))}
      </div>
      <div style={{display:"flex",gap:"8px"}}>
        <Input placeholder="Add new situation…" value={newSit} onChange={e=>setNewSit(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&newSit.trim()){onAdd(newSit.trim());onChange([...selected,newSit.trim()]);setNewSit("");}}}
          style={{flex:1}}/>
        <Btn small onClick={()=>{if(newSit.trim()){onAdd(newSit.trim());onChange([...selected,newSit.trim()]);setNewSit("");}}}>Add</Btn>
      </div>
    </div>
  );
};

// ── PIN Screen ────────────────────────────────────────────────────────────────
const PinScreen = ({ onUnlock, isSetup }) => {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleDigit = (d) => {
    if (isSetup) {
      if (step === 1) {
        const next = pin + d;
        if (next.length <= 4) setPin(next);
        if (next.length === 4) setStep(2);
      } else {
        const next = confirm + d;
        if (next.length <= 4) setConfirm(next);
        if (next.length === 4) {
          if (next === pin) { savePin(pin); onUnlock(); }
          else { setError("PINs don't match"); setPin(""); setConfirm(""); setStep(1); }
        }
      }
    } else {
      const next = pin + d;
      if (next.length <= 4) setPin(next);
      if (next.length === 4) {
        if (next === loadPin()) onUnlock();
        else { setError("Wrong PIN"); setPin(""); }
      }
    }
  };

  const current = isSetup ? (step === 1 ? pin : confirm) : pin;
  const label = isSetup ? (step === 1 ? "Set your PIN" : "Confirm your PIN") : "Enter PIN";

  return (
    <div style={{
      minHeight:"100vh",background:"#0d0d1a",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:"32px",padding:"24px"
    }}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"48px",marginBottom:"12px"}}>🔒</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:"#f0f0ff",margin:0}}>{label}</h2>
        {error && <p style={{color:"#E8614A",fontSize:"13px",marginTop:"8px"}}>{error}</p>}
      </div>
      <div style={{display:"flex",gap:"12px"}}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:"16px",height:"16px",borderRadius:"50%",
            background: i < current.length ? "#6A7FE8" : "#2a2a4a",transition:"background 0.2s"
          }}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",width:"200px"}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
          <button key={i} onClick={() => {
            if (d === "⌫") {
              if (isSetup && step===2) setConfirm(c=>c.slice(0,-1));
              else setPin(p=>p.slice(0,-1));
              setError("");
            } else if (d !== "") handleDigit(String(d));
          }} style={{
            background: d === "" ? "transparent" : "#1a1a2e",
            border: d === "" ? "none" : "1px solid #2a2a4a",
            borderRadius:"12px",padding:"16px",color:"#f0f0ff",fontSize:"20px",
            fontWeight:"600",cursor: d === "" ? "default" : "pointer",
            fontFamily:"'DM Sans',sans-serif"
          }}>{d}</button>
        ))}
      </div>
    </div>
  );
};

// ── Onboarding ────────────────────────────────────────────────────────────────
const Onboarding = ({ onDone }) => {
  const [step, setStep] = useState(0); // 0=welcome,1=weaknesses,2=habits,3=pin
  const [selectedW, setSelectedW] = useState([]);
  const [selectedH, setSelectedH] = useState([]);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [setupPin, setSetupPin] = useState(false);
  const [pinDone, setPinDone] = useState(false);
  const quoteIdx = useRef(Math.floor(Math.random()*QUOTES.length));

  const toggleW = (name) => setSelectedW(s => s.includes(name)?s.filter(x=>x!==name):[...s,name]);
  const toggleH = (name) => setSelectedH(s => s.includes(name)?s.filter(x=>x!==name):[...s,name]);

  const finish = () => {
    const weaknesses = selectedW.map((name, i) => ({
      id: uid(), name,
      desc: DEFAULT_WEAKNESSES.find(d=>d.name===name)?.desc || "",
      why: "",
      color: PALETTE[i % PALETTE.length],
      situations: []
    }));
    const habits = selectedH.map((name, i) => {
      const def = DEFAULT_HABITS.find(d=>d.name===name);
      return {
        id: uid(), name,
        type: def?.type || "boolean",
        unit: def?.unit || "",
        desc: def?.desc || "",
        color: PALETTE[(weaknesses.length + i) % PALETTE.length],
        situations: []
      };
    });
    onDone(weaknesses, habits);
  };

  if (setupPin && !pinDone) return <PinScreen isSetup onUnlock={()=>{setPinDone(true); finish();}}/>;

  return (
    <div style={{minHeight:"100vh",background:"#0d0d1a",display:"flex",flexDirection:"column",padding:"24px",maxWidth:"480px",margin:"0 auto"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>

        {step === 0 && (
          <div style={{textAlign:"center",animation:"fadeIn 0.6s ease"}}>
            <div style={{fontSize:"56px",marginBottom:"16px"}}>🌙</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",color:"#f0f0ff",marginBottom:"12px",lineHeight:1.2}}>
              Know Yourself
            </h1>
            <p style={{color:"#888",fontSize:"15px",lineHeight:1.7,marginBottom:"8px"}}>
              {QUOTES[quoteIdx.current]}
            </p>
            <p style={{color:"#555",fontSize:"13px",lineHeight:1.6,marginBottom:"40px"}}>
              A daily mirror for your character. Track your weaknesses honestly, build better habits, and watch yourself grow.
            </p>
            <Btn onClick={()=>setStep(1)} style={{width:"100%",padding:"16px"}}>Begin</Btn>
          </div>
        )}

        {step === 1 && (
          <div style={{animation:"fadeIn 0.4s ease"}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",color:"#f0f0ff",marginBottom:"8px"}}>Your Weaknesses</h2>
            <p style={{color:"#666",fontSize:"13px",marginBottom:"20px"}}>Select what you want to work on. You can always add more later.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"20px"}}>
              {DEFAULT_WEAKNESSES.map(w => (
                <div key={w.name} onClick={()=>toggleW(w.name)} style={{
                  padding:"14px 16px",borderRadius:"14px",cursor:"pointer",
                  background: selectedW.includes(w.name) ? "rgba(106,127,232,0.15)" : "#1a1a2e",
                  border:`1.5px solid ${selectedW.includes(w.name) ? "#6A7FE8" : "#2a2a4a"}`,
                  transition:"all 0.2s"
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{color:"#f0f0ff",fontWeight:"600",fontSize:"15px"}}>{w.name}</span>
                    {selectedW.includes(w.name) && <Icon name="check" size={16} color="#6A7FE8"/>}
                  </div>
                  <span style={{color:"#666",fontSize:"12px"}}>{w.desc}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
              <Input placeholder="Add custom weakness…" value={customW} onChange={e=>setCustomW(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&customW.trim()){toggleW(customW.trim());setCustomW("");}}}/>
              <Btn small onClick={()=>{if(customW.trim()){toggleW(customW.trim());setCustomW("");}}}>Add</Btn>
            </div>
            <div style={{display:"flex",gap:"12px"}}>
              <Btn outline onClick={()=>setStep(2)} style={{flex:1}}>Skip</Btn>
              <Btn onClick={()=>setStep(2)} style={{flex:2}} disabled={selectedW.length===0}>Next →</Btn>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{animation:"fadeIn 0.4s ease"}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",color:"#f0f0ff",marginBottom:"8px"}}>Your Habits</h2>
            <p style={{color:"#666",fontSize:"13px",marginBottom:"20px"}}>Positive habits to build alongside your inner work.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"20px"}}>
              {DEFAULT_HABITS.map(h => (
                <div key={h.name} onClick={()=>toggleH(h.name)} style={{
                  padding:"14px 16px",borderRadius:"14px",cursor:"pointer",
                  background: selectedH.includes(h.name) ? "rgba(74,191,232,0.1)" : "#1a1a2e",
                  border:`1.5px solid ${selectedH.includes(h.name) ? "#4ABFE8" : "#2a2a4a"}`,
                  transition:"all 0.2s"
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{color:"#f0f0ff",fontWeight:"600",fontSize:"15px"}}>{h.name}</span>
                    {selectedH.includes(h.name) && <Icon name="check" size={16} color="#4ABFE8"/>}
                  </div>
                  <span style={{color:"#666",fontSize:"12px"}}>{h.desc} · {h.type}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
              <Input placeholder="Add custom habit…" value={customH} onChange={e=>setCustomH(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&customH.trim()){toggleH(customH.trim());setCustomH("");}}}/>
              <Btn small onClick={()=>{if(customH.trim()){toggleH(customH.trim());setCustomH("");}}}>Add</Btn>
            </div>
            <div style={{display:"flex",gap:"12px"}}>
              <Btn outline onClick={()=>setStep(3)} style={{flex:1}}>Skip</Btn>
              <Btn onClick={()=>setStep(3)} style={{flex:2,background:"#4ABFE8",borderColor:"#4ABFE8"}} disabled={selectedH.length===0}>Next →</Btn>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{animation:"fadeIn 0.4s ease",textAlign:"center"}}>
            <div style={{fontSize:"48px",marginBottom:"16px"}}>🔒</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",color:"#f0f0ff",marginBottom:"8px"}}>Privacy Lock</h2>
            <p style={{color:"#666",fontSize:"13px",lineHeight:1.7,marginBottom:"32px"}}>
              This data is deeply personal. Protect it with a PIN.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <Btn onClick={()=>setSetupPin(true)} style={{padding:"16px"}}>Set up PIN</Btn>
              <Btn outline onClick={finish} style={{padding:"16px"}}>Skip for now</Btn>
            </div>
          </div>
        )}
      </div>

      {step > 0 && (
        <div style={{display:"flex",justifyContent:"center",gap:"6px",paddingTop:"20px"}}>
          {[1,2,3].map(s => (
            <div key={s} style={{
              width: step===s ? "20px" : "6px",height:"6px",borderRadius:"3px",
              background: step===s ? "#6A7FE8" : "#2a2a4a",transition:"all 0.3s"
            }}/>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Log Entry Modal ───────────────────────────────────────────────────────────
const LogModal = ({ item, type, isWeakness, log, onSave, onClose }) => {
  const [done, setDone] = useState(log?.done ?? null);
  const [situations, setSituations] = useState(log?.situations || []);
  const [note, setNote] = useState(log?.note || "");
  const [value, setValue] = useState(log?.value || "");
  const [showSit, setShowSit] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const handleSave = () => {
    onSave({ done, situations, note, value });
    onClose();
  };

  return (
    <Modal title={item.name} onClose={onClose}>
      {item.desc && <p style={{color:"#666",fontSize:"13px",marginBottom:"16px",lineHeight:1.5}}>{item.desc}</p>}
      {item.why && <p style={{color:"#6A7FE8",fontSize:"12px",marginBottom:"16px",fontStyle:"italic"}}>"{item.why}"</p>}

      {isWeakness ? (
        <>
          <p style={{color:"#aaa",fontSize:"14px",marginBottom:"12px"}}>Did you fall into this today?</p>
          <div style={{display:"flex",gap:"12px",marginBottom:"16px"}}>
            <Btn onClick={()=>{setDone(false);setShowSit(false);}} outline={done!==false}
              color="#7EC87E" style={{flex:1}}>No ✓</Btn>
            <Btn onClick={()=>{setDone(true);setShowSit(true);}} outline={done!==true}
              color="#E8614A" style={{flex:1}}>Yes</Btn>
          </div>

          {done === false && (
            <div style={{marginBottom:"16px"}}>
              <button onClick={()=>setShowSit(!showSit)} style={{
                background:"none",border:"none",color:"#6A7FE8",fontSize:"13px",
                cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:"4px"
              }}>
                <Icon name={showSit?"chevronDown":"chevronRight"} size={14} color="#6A7FE8"/>
                Log a win (optional)
              </button>
              {showSit && (
                <div style={{marginTop:"12px"}}>
                  <p style={{color:"#888",fontSize:"12px",marginBottom:"8px"}}>In what situation did you hold back?</p>
                  <SituationPicker situations={item.situations||[]} selected={situations}
                    onChange={setSituations} onAdd={s=>{item.situations=[...(item.situations||[]),s];}} type="weakness"/>
                </div>
              )}
            </div>
          )}

          {done === true && showSit && (
            <div style={{marginBottom:"16px"}}>
              <p style={{color:"#888",fontSize:"12px",marginBottom:"8px"}}>In what situation?</p>
              <SituationPicker situations={item.situations||[]} selected={situations}
                onChange={setSituations} onAdd={s=>{item.situations=[...(item.situations||[]),s];}} type="weakness"/>
            </div>
          )}
        </>
      ) : (
        <>
          <p style={{color:"#aaa",fontSize:"14px",marginBottom:"12px"}}>
            {type==="boolean" ? "Did you complete this today?" : type==="countable" ? `How many ${item.unit || "units"}?` : `How many ${item.unit || "minutes"}?`}
          </p>
          {type === "boolean" ? (
            <div style={{display:"flex",gap:"12px",marginBottom:"16px"}}>
              <Btn onClick={()=>setDone(false)} outline={done!==false} color="#E8614A" style={{flex:1}}>Missed</Btn>
              <Btn onClick={()=>setDone(true)} outline={done!==true} color="#7EC87E" style={{flex:1}}>Done ✓</Btn>
            </div>
          ) : (
            <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"16px"}}>
              <Input type="number" value={value} onChange={e=>setValue(e.target.value)}
                placeholder="0" style={{width:"100px"}}/>
              <span style={{color:"#666",fontSize:"14px"}}>{item.unit}</span>
              <div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>
                <Btn small color="#E8614A" outline onClick={()=>setDone(false)}>Missed</Btn>
                <Btn small color="#7EC87E" onClick={()=>setDone(true)}>Log ✓</Btn>
              </div>
            </div>
          )}

          <button onClick={()=>setShowSit(!showSit)} style={{
            background:"none",border:"none",color:"#6A7FE8",fontSize:"13px",
            cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:"4px",marginBottom:"12px"
          }}>
            <Icon name={showSit?"chevronDown":"chevronRight"} size={14} color="#6A7FE8"/>
            Log situation (optional)
          </button>
          {showSit && (
            <div style={{marginBottom:"16px"}}>
              <SituationPicker situations={item.situations||[]} selected={situations}
                onChange={setSituations} onAdd={s=>{item.situations=[...(item.situations||[]),s];}} type="habit"/>
            </div>
          )}
        </>
      )}

      <button onClick={()=>setShowNote(!showNote)} style={{
        background:"none",border:"none",color:"#6A7FE8",fontSize:"13px",
        cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:"4px",marginBottom:"12px"
      }}>
        <Icon name={showNote?"chevronDown":"chevronRight"} size={14} color="#6A7FE8"/>
        Add a note (optional)
      </button>
      {showNote && (
        <Textarea value={note} onChange={e=>setNote(e.target.value)}
          placeholder="Reflect on what happened…" style={{marginBottom:"16px"}}/>
      )}

      <Btn onClick={handleSave} style={{width:"100%"}} disabled={done===null && !value}>Save Entry</Btn>
    </Modal>
  );
};

// ── Add/Edit Item Modal ───────────────────────────────────────────────────────
const ItemFormModal = ({ item, isWeakness, onSave, onClose }) => {
  const [name, setName] = useState(item?.name || "");
  const [desc, setDesc] = useState(item?.desc || "");
  const [why, setWhy] = useState(item?.why || "");
  const [color, setColor] = useState(item?.color || PALETTE[0]);
  const [type, setType] = useState(item?.type || "boolean");
  const [unit, setUnit] = useState(item?.unit || "");

  return (
    <Modal title={item ? `Edit ${isWeakness?"Weakness":"Habit"}` : `New ${isWeakness?"Weakness":"Habit"}`} onClose={onClose} wide>
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        <div>
          <label style={{color:"#888",fontSize:"12px",display:"block",marginBottom:"6px"}}>Name *</label>
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder={isWeakness?"e.g. Backbiting":"e.g. Reading"}/>
        </div>
        <div>
          <label style={{color:"#888",fontSize:"12px",display:"block",marginBottom:"6px"}}>Description (optional)</label>
          <Textarea value={desc} onChange={e=>setDesc(e.target.value)}
            placeholder={isWeakness?"Define this weakness for yourself…":"What does this habit involve?"} style={{minHeight:"60px"}}/>
        </div>
        {isWeakness && (
          <div>
            <label style={{color:"#888",fontSize:"12px",display:"block",marginBottom:"6px"}}>Why am I tracking this? (optional)</label>
            <Textarea value={why} onChange={e=>setWhy(e.target.value)}
              placeholder="Your personal intention for working on this…" style={{minHeight:"60px"}}/>
          </div>
        )}
        {!isWeakness && (
          <>
            <div>
              <label style={{color:"#888",fontSize:"12px",display:"block",marginBottom:"6px"}}>Type</label>
              <div style={{display:"flex",gap:"8px"}}>
                {["boolean","countable","timed"].map(t => (
                  <div key={t} onClick={()=>setType(t)} style={{
                    padding:"8px 14px",borderRadius:"10px",cursor:"pointer",fontSize:"13px",
                    background: type===t ? "#4ABFE8" : "#0d0d1a",
                    border:`1px solid ${type===t ? "#4ABFE8" : "#2a2a4a"}`,
                    color: type===t ? "#fff" : "#888"
                  }}>{t==="boolean"?"Yes/No":t==="countable"?"Countable":"Timed"}</div>
                ))}
              </div>
            </div>
            {(type==="countable"||type==="timed") && (
              <div>
                <label style={{color:"#888",fontSize:"12px",display:"block",marginBottom:"6px"}}>Unit</label>
                <Input value={unit} onChange={e=>setUnit(e.target.value)} placeholder={type==="countable"?"glasses, reps…":"min, hrs…"}/>
              </div>
            )}
          </>
        )}
        <div>
          <label style={{color:"#888",fontSize:"12px",display:"block",marginBottom:"8px"}}>Color</label>
          <ColorPicker value={color} onChange={setColor}/>
        </div>
        <Btn onClick={()=>{if(name.trim()) onSave({...item,name,desc,why,color,type,unit,id:item?.id||uid(),situations:item?.situations||[]});}} style={{width:"100%",marginTop:"4px"}} disabled={!name.trim()}>
          {item ? "Save Changes" : "Add"}
        </Btn>
      </div>
    </Modal>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteModal = ({ item, isWeakness, onDelete, onArchive, onClose }) => (
  <Modal title="Remove Item" onClose={onClose}>
    <p style={{color:"#aaa",fontSize:"14px",lineHeight:1.6,marginBottom:"20px"}}>
      What would you like to do with <strong style={{color:"#f0f0ff"}}>{item.name}</strong> and its history?
    </p>
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      <Btn onClick={onArchive} outline color="#6A7FE8" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
        <Icon name="archive" size={16} color="#6A7FE8"/>Archive (keep history)
      </Btn>
      <Btn onClick={onDelete} outline color="#E8614A" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
        <Icon name="trash" size={16} color="#E8614A"/>Delete everything
      </Btn>
      <Btn outline onClick={onClose} style={{width:"100%"}}>Cancel</Btn>
    </div>
  </Modal>
);

// ── Weekly Heatmap ────────────────────────────────────────────────────────────
const WeekHeatmap = ({ item, logs, isWeakness }) => {
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-6+i);
    return d.toISOString().slice(0,10);
  });
  return (
    <div style={{display:"flex",gap:"4px"}}>
      {days.map(date => {
        const entry = logs[date]?.[item.id];
        let filled = false;
        if (entry) {
          if (isWeakness) filled = entry.done === false;
          else filled = entry.done === true || (entry.value && parseFloat(entry.value) > 0);
        }
        const isToday = date === today();
        return (
          <div key={date} title={date} style={{
            flex:1,aspectRatio:"1",borderRadius:"6px",
            background: entry ? (filled ? item.color : isWeakness ? "#E8614A33" : "#E8614A33") : "#1a1a2e",
            border: isToday ? `1px solid ${item.color}` : "1px solid transparent",
            opacity: filled ? 1 : entry ? 0.4 : 0.3
          }}/>
        );
      })}
    </div>
  );
};

// ── Detail Page ───────────────────────────────────────────────────────────────
const DetailPage = ({ item, isWeakness, logs, onBack }) => {
  const allDates = Object.keys(logs).sort();
  const entries = allDates.map(date => ({ date, entry: logs[date]?.[item.id] })).filter(e=>e.entry);

  // line chart data (last 30 days)
  const last30 = Array.from({length:30},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-29+i);
    return d.toISOString().slice(0,10);
  });

  const chartData = last30.map(date => {
    const entry = logs[date]?.[item.id];
    if (!entry) return { date, v: null };
    if (isWeakness) return { date, v: entry.done ? 1 : 0 };
    return { date, v: entry.value ? parseFloat(entry.value) : (entry.done ? 1 : 0) };
  });

  // situation breakdown
  const sitCounts = {};
  entries.forEach(({entry}) => {
    (entry.situations||[]).forEach(s => { sitCounts[s] = (sitCounts[s]||0)+1; });
  });
  const sitEntries = Object.entries(sitCounts).sort((a,b)=>b[1]-a[1]);

  const yesCount = entries.filter(e=>e.entry.done===true).length;
  const noCount = entries.filter(e=>e.entry.done===false).length;
  const total = entries.length;

  // simple SVG line chart
  const validPoints = chartData.filter(d=>d.v!==null);
  const maxV = Math.max(...validPoints.map(d=>d.v), 1);
  const W = 300, H = 80;
  const points = chartData.map((d,i) => {
    const x = (i / (last30.length-1)) * W;
    const y = d.v !== null ? H - (d.v/maxV)*H*0.9 - 4 : null;
    return {x, y, v: d.v};
  }).filter(p=>p.y!==null);
  const pathD = points.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");

  return (
    <div style={{padding:"0"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#888",padding:"4px"}}>
          <Icon name="back" size={24}/>
        </button>
        <div style={{width:"12px",height:"12px",borderRadius:"50%",background:item.color}}/>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:"#f0f0ff",margin:0,fontSize:"22px"}}>{item.name}</h2>
      </div>

      {item.why && (
        <div style={{
          background:"rgba(106,127,232,0.08)",border:"1px solid rgba(106,127,232,0.2)",
          borderRadius:"12px",padding:"12px 16px",marginBottom:"20px"
        }}>
          <p style={{color:"#6A7FE8",fontSize:"13px",fontStyle:"italic",margin:0}}>"{item.why}"</p>
        </div>
      )}

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"20px"}}>
        <div style={{background:"#1a1a2e",borderRadius:"12px",padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:"24px",fontWeight:"700",color: isWeakness?"#E8614A":"#7EC87E"}}>{isWeakness?yesCount:yesCount}</div>
          <div style={{fontSize:"11px",color:"#666",marginTop:"2px"}}>{isWeakness?"fell in":"completed"}</div>
        </div>
        <div style={{background:"#1a1a2e",borderRadius:"12px",padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:"24px",fontWeight:"700",color:"#7EC87E"}}>{noCount}</div>
          <div style={{fontSize:"11px",color:"#666",marginTop:"2px"}}>{isWeakness?"resisted":"missed"}</div>
        </div>
        <div style={{background:"#1a1a2e",borderRadius:"12px",padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:"24px",fontWeight:"700",color:item.color}}>{total}</div>
          <div style={{fontSize:"11px",color:"#666",marginTop:"2px"}}>total days</div>
        </div>
      </div>

      {/* Line chart */}
      {points.length > 1 && (
        <div style={{background:"#1a1a2e",borderRadius:"14px",padding:"16px",marginBottom:"20px"}}>
          <div style={{color:"#888",fontSize:"12px",marginBottom:"12px"}}>Last 30 days</div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
            <defs>
              <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={item.color} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={`${pathD} L${points[points.length-1].x},${H} L${points[0].x},${H} Z`}
              fill={`url(#grad-${item.id})`}/>
            <path d={pathD} fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {points.map((p,i)=>(
              <circle key={i} cx={p.x} cy={p.y} r="3" fill={item.color}/>
            ))}
          </svg>
        </div>
      )}

      {/* Situation breakdown */}
      {sitEntries.length > 0 && (
        <div style={{background:"#1a1a2e",borderRadius:"14px",padding:"16px",marginBottom:"20px"}}>
          <div style={{color:"#888",fontSize:"12px",marginBottom:"12px"}}>Situation patterns</div>
          {sitEntries.map(([sit,count]) => (
            <div key={sit} style={{marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                <span style={{color:"#ccc",fontSize:"13px"}}>{sit}</span>
                <span style={{color:"#666",fontSize:"12px"}}>{count}x</span>
              </div>
              <div style={{height:"4px",background:"#2a2a4a",borderRadius:"2px"}}>
                <div style={{height:"100%",borderRadius:"2px",background:item.color,width:`${(count/Math.max(...Object.values(sitCounts)))*100}%`,transition:"width 0.5s"}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log history */}
      <div style={{background:"#1a1a2e",borderRadius:"14px",padding:"16px"}}>
        <div style={{color:"#888",fontSize:"12px",marginBottom:"12px"}}>Log history</div>
        {entries.length === 0 && <p style={{color:"#444",fontSize:"13px"}}>No entries yet</p>}
        {[...entries].reverse().slice(0,20).map(({date,entry}) => (
          <div key={date} style={{
            borderBottom:"1px solid #2a2a4a",paddingBottom:"12px",marginBottom:"12px"
          }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
              <span style={{color:"#888",fontSize:"12px"}}>{date}</span>
              <span style={{
                fontSize:"11px",padding:"2px 8px",borderRadius:"20px",
                background: entry.done ? (isWeakness?"rgba(232,97,74,0.15)":"rgba(126,200,126,0.15)") : (isWeakness?"rgba(126,200,126,0.15)":"rgba(232,97,74,0.15)"),
                color: entry.done ? (isWeakness?"#E8614A":"#7EC87E") : (isWeakness?"#7EC87E":"#E8614A")
              }}>
                {isWeakness ? (entry.done?"fell in":"resisted") : (entry.done?"done":"missed")}
                {entry.value ? ` · ${entry.value} ${item.unit}` : ""}
              </span>
            </div>
            {entry.situations?.length > 0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"4px"}}>
                {entry.situations.map(s=>(
                  <span key={s} style={{fontSize:"11px",padding:"2px 8px",borderRadius:"20px",background:"#0d0d1a",color:"#888",border:"1px solid #2a2a4a"}}>{s}</span>
                ))}
              </div>
            )}
            {entry.note && <p style={{color:"#666",fontSize:"12px",margin:"4px 0 0",fontStyle:"italic"}}>"{entry.note}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Weekly Reflection Modal ───────────────────────────────────────────────────
const WeeklyReflectionModal = ({ weekKey, existing, onSave, onClose }) => {
  const [answers, setAnswers] = useState(existing?.answers || WEEKLY_QUESTIONS.map(()=>""));
  return (
    <Modal title="Weekly Reflection" onClose={onClose} wide>
      <p style={{color:"#666",fontSize:"13px",marginBottom:"20px"}}>Take a moment to reflect on your week.</p>
      {WEEKLY_QUESTIONS.map((q,i) => (
        <div key={i} style={{marginBottom:"16px"}}>
          <label style={{color:"#aaa",fontSize:"13px",display:"block",marginBottom:"6px",lineHeight:1.4}}>{q}</label>
          <Textarea value={answers[i]} onChange={e=>setAnswers(a=>{const n=[...a];n[i]=e.target.value;return n;})}
            placeholder="Reflect…" style={{minHeight:"60px"}}/>
        </div>
      ))}
      <Btn onClick={()=>{onSave({answers});onClose();}} style={{width:"100%"}}>Save Reflection</Btn>
    </Modal>
  );
};

// ── Export Modal ──────────────────────────────────────────────────────────────
const ExportModal = ({ data, onClose }) => {
  const now = new Date();
  const month = now.toLocaleString("default",{month:"long",year:"numeric"});

  const text = [
    `NAFS TRACKER — Monthly Summary`,`${month}`,``,
    `=== WEAKNESSES ===`,
    ...data.weaknesses.map(w => {
      const entries = Object.values(data.logs).map(l=>l[w.id]).filter(Boolean);
      const fell = entries.filter(e=>e.done===true).length;
      const resisted = entries.filter(e=>e.done===false).length;
      return `${w.name}: ${fell} times / resisted ${resisted} times`;
    }),``,
    `=== HABITS ===`,
    ...data.habits.map(h => {
      const entries = Object.values(data.logs).map(l=>l[h.id]).filter(Boolean);
      const done = entries.filter(e=>e.done===true||e.value).length;
      return `${h.name}: completed ${done} days`;
    }),``,
    `=== WEEKLY REFLECTIONS ===`,
    ...Object.entries(data.weeklyReflections).map(([k,r]) =>
      [`Week of ${k}:`,...r.answers.map((a,i)=>`  Q: ${WEEKLY_QUESTIONS[i]}\n  A: ${a||"—"}`)].join("\n")
    )
  ].join("\n");

  const blob = new Blob([text],{type:"text/plain"});
  const url = URL.createObjectURL(blob);

  return (
    <Modal title="Export Summary" onClose={onClose}>
      <p style={{color:"#888",fontSize:"13px",marginBottom:"20px"}}>Your {month} summary is ready to download.</p>
      <pre style={{
        background:"#0d0d1a",border:"1px solid #2a2a4a",borderRadius:"10px",
        padding:"12px",fontSize:"11px",color:"#aaa",overflowX:"auto",
        maxHeight:"200px",overflowY:"auto",whiteSpace:"pre-wrap"
      }}>{text}</pre>
      <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
        <a href={url} download={`nafs-${month.replace(" ","-")}.txt`} style={{flex:1,textDecoration:"none"}}>
          <Btn style={{width:"100%"}}><Icon name="export" size={14}/> Download</Btn>
        </a>
        <Btn outline onClick={()=>navigator.clipboard.writeText(text)} style={{flex:1}}>Copy</Btn>
      </div>
    </Modal>
  );
};

// ── Trend Alert Banner ────────────────────────────────────────────────────────
const TrendAlerts = ({ weaknesses, logs }) => {
  const alerts = weaknesses.filter(w => {
    const last5 = Array.from({length:5},(_,i)=>{
      const d = new Date(); d.setDate(d.getDate()-i);
      return d.toISOString().slice(0,10);
    });
    const count = last5.filter(date => logs[date]?.[w.id]?.done === true).length;
    return count >= 3;
  });
  if (!alerts.length) return null;
  return (
    <div style={{marginBottom:"16px"}}>
      {alerts.map(w => (
        <div key={w.id} style={{
          background:"rgba(232,150,74,0.1)",border:"1px solid rgba(232,150,74,0.3)",
          borderRadius:"12px",padding:"12px 16px",marginBottom:"8px",
          display:"flex",alignItems:"center",gap:"10px"
        }}>
          <Icon name="warning" size={16} color="#E8964A"/>
          <span style={{color:"#E8964A",fontSize:"13px",lineHeight:1.4}}>
            <strong>{w.name}</strong> has been triggered 3+ days this week. Time to reflect.
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(!loadPin());
  const [data, setData] = useState(() => load() || null);
  const [tab, setTab] = useState("dashboard"); // dashboard | stats | settings
  const [activeSection, setActiveSection] = useState("weaknesses"); // weaknesses | habits
  const [logModal, setLogModal] = useState(null); // {item, isWeakness}
  const [formModal, setFormModal] = useState(null); // {item|null, isWeakness}
  const [deleteModal, setDeleteModal] = useState(null);
  const [detailPage, setDetailPage] = useState(null); // {item, isWeakness}
  const [weeklyModal, setWeeklyModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [pinModal, setPinModal] = useState(false);

  useEffect(() => { if (data) save(data); }, [data]);

  // Check if weekly reflection is due
  const weekKey = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().slice(0,10);
  })();
  const weeklyDue = data && !data.weeklyReflections?.[weekKey] && new Date().getDay() === 0;

  const updateData = (fn) => setData(d => { const next = fn({...d}); save(next); return next; });

  const logEntry = (item, isWeakness, entry) => {
    updateData(d => {
      const date = today();
      if (!d.logs[date]) d.logs[date] = {};
      d.logs[date][item.id] = entry;
      // persist new situations
      if (isWeakness) {
        const idx = d.weaknesses.findIndex(w=>w.id===item.id);
        if (idx>=0) d.weaknesses[idx].situations = item.situations;
      } else {
        const idx = d.habits.findIndex(h=>h.id===item.id);
        if (idx>=0) d.habits[idx].situations = item.situations;
      }
      return d;
    });
  };

  const saveItem = (item, isWeakness) => {
    updateData(d => {
      if (isWeakness) {
        const idx = d.weaknesses.findIndex(w=>w.id===item.id);
        if (idx>=0) d.weaknesses[idx] = item;
        else d.weaknesses.push(item);
      } else {
        const idx = d.habits.findIndex(h=>h.id===item.id);
        if (idx>=0) d.habits[idx] = item;
        else d.habits.push(item);
      }
      return d;
    });
  };

  const deleteItem = (item, isWeakness, archive) => {
    updateData(d => {
      if (isWeakness) {
        d.weaknesses = d.weaknesses.filter(w=>w.id!==item.id);
        if (archive) d.archivedWeaknesses = [...(d.archivedWeaknesses||[]), item];
      } else {
        d.habits = d.habits.filter(h=>h.id!==item.id);
        if (archive) d.archivedHabits = [...(d.archivedHabits||[]), item];
      }
      return d;
    });
  };

  if (!unlocked) return <PinScreen onUnlock={()=>setUnlocked(true)}/>;
  if (!data) return (
    <Onboarding onDone={(weaknesses, habits) => {
      const d = initState();
      d.weaknesses = weaknesses;
      d.habits = habits;
      setData(d);
    }}/>
  );

  const todayLog = data.logs[today()] || {};

  // ── Render detail page ────────────────────────────────────────────────────
  if (detailPage) return (
    <div style={{
      minHeight:"100vh",background:"#0d0d1a",padding:"24px",
      maxWidth:"480px",margin:"0 auto",fontFamily:"'DM Sans',sans-serif"
    }}>
      <DetailPage {...detailPage} logs={data.logs} onBack={()=>setDetailPage(null)}/>
    </div>
  );

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh",background:"#0d0d1a",fontFamily:"'DM Sans',sans-serif",
      maxWidth:"480px",margin:"0 auto",position:"relative"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{
        padding:"20px 24px 0",display:"flex",justifyContent:"space-between",alignItems:"center"
      }}>
        <div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",color:"#f0f0ff",margin:0}}>Nafs</h1>
          <p style={{color:"#444",fontSize:"12px",margin:"2px 0 0"}}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </p>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          {weeklyDue && (
            <button onClick={()=>setWeeklyModal(true)} style={{
              background:"rgba(106,127,232,0.15)",border:"1px solid rgba(106,127,232,0.3)",
              borderRadius:"10px",padding:"8px 12px",cursor:"pointer",color:"#6A7FE8",fontSize:"12px",fontWeight:"600"
            }}>Weekly ✦</button>
          )}
          <button onClick={()=>setTab("settings")} style={{background:"none",border:"none",cursor:"pointer",color:"#444",padding:"4px"}}>
            <Icon name="settings" size={20}/>
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{display:"flex",padding:"16px 24px 0",gap:"4px"}}>
        {["dashboard","stats"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:"10px",borderRadius:"12px",border:"none",cursor:"pointer",
            background: tab===t ? "#1a1a2e" : "transparent",
            color: tab===t ? "#f0f0ff" : "#555",fontWeight:"600",fontSize:"13px",
            fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize"
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:"20px 24px 100px",animation:"fadeIn 0.3s ease"}}>

        {tab === "settings" && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
              <button onClick={()=>setTab("dashboard")} style={{background:"none",border:"none",cursor:"pointer",color:"#888"}}>
                <Icon name="back" size={24}/>
              </button>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#f0f0ff",margin:0}}>Settings</h2>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <Btn onClick={()=>setExportModal(true)} outline style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                <Icon name="export" size={16}/>Export Monthly Summary
              </Btn>
              <Btn onClick={()=>setWeeklyModal(true)} outline style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                <Icon name="note" size={16}/>Weekly Reflection
              </Btn>
              {loadPin() ? (
                <Btn onClick={()=>{removePin();alert("PIN removed");}} outline color="#E8614A" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                  <Icon name="lock" size={16} color="#E8614A"/>Remove PIN
                </Btn>
              ) : (
                <Btn onClick={()=>setPinModal(true)} outline style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                  <Icon name="lock" size={16}/>Set up PIN Lock
                </Btn>
              )}
              {/* Archived */}
              {(data.archivedWeaknesses?.length > 0 || data.archivedHabits?.length > 0) && (
                <div style={{background:"#1a1a2e",borderRadius:"14px",padding:"16px",marginTop:"8px"}}>
                  <p style={{color:"#888",fontSize:"12px",marginBottom:"12px"}}>Archived Items</p>
                  {[...(data.archivedWeaknesses||[]),...(data.archivedHabits||[])].map(item => (
                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #2a2a4a"}}>
                      <span style={{color:"#666",fontSize:"14px"}}>{item.name}</span>
                      <Btn small outline onClick={()=>{
                        updateData(d=>{
                          const isW = (d.archivedWeaknesses||[]).some(w=>w.id===item.id);
                          if(isW){d.archivedWeaknesses=d.archivedWeaknesses.filter(w=>w.id!==item.id);d.weaknesses.push(item);}
                          else{d.archivedHabits=d.archivedHabits.filter(h=>h.id!==item.id);d.habits.push(item);}
                          return d;
                        });
                      }}>Restore</Btn>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "dashboard" && (
          <div>
            <TrendAlerts weaknesses={data.weaknesses} logs={data.logs}/>

            {/* Today's score */}
            {(data.weaknesses.length > 0 || data.habits.length > 0) && (() => {
              const total = data.weaknesses.length + data.habits.length;
              const good = data.weaknesses.filter(w=>todayLog[w.id]?.done===false).length +
                data.habits.filter(h=>todayLog[h.id]?.done===true||todayLog[h.id]?.value).length;
              const pct = total > 0 ? Math.round((good/total)*100) : 0;
              return (
                <div style={{
                  background:"linear-gradient(135deg,#1a1a2e,#16162a)",
                  border:"1px solid #2a2a4a",borderRadius:"20px",
                  padding:"20px",marginBottom:"20px",
                  display:"flex",alignItems:"center",gap:"20px"
                }}>
                  <div style={{position:"relative",width:"64px",height:"64px",flexShrink:0}}>
                    <svg viewBox="0 0 64 64" style={{transform:"rotate(-90deg)"}}>
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#2a2a4a" strokeWidth="6"/>
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#6A7FE8" strokeWidth="6"
                        strokeDasharray={`${pct*1.759} 175.9`} strokeLinecap="round"/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                      fontWeight:"700",fontSize:"14px",color:"#f0f0ff"}}>{pct}%</div>
                  </div>
                  <div>
                    <div style={{color:"#f0f0ff",fontWeight:"600",fontSize:"16px"}}>{good}/{total} completed</div>
                    <div style={{color:"#555",fontSize:"12px",marginTop:"2px"}}>
                      {pct>=80?"Excellent day 🌟":pct>=50?"Keep going ✊":"Every effort counts 🌱"}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Section switcher */}
            <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
              {["weaknesses","habits"].map(s => (
                <button key={s} onClick={()=>setActiveSection(s)} style={{
                  flex:1,padding:"10px",borderRadius:"12px",border:"none",cursor:"pointer",
                  background: activeSection===s ? (s==="weaknesses"?"rgba(232,97,74,0.15)":"rgba(74,191,232,0.1)") : "#1a1a2e",
                  color: activeSection===s ? (s==="weaknesses"?"#E8614A":"#4ABFE8") : "#555",
                  fontWeight:"600",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize"
                }}>{s}</button>
              ))}
            </div>

            {/* Items */}
            {activeSection === "weaknesses" && (
              <div>
                {data.weaknesses.length === 0 && (
                  <div style={{textAlign:"center",padding:"40px 0",color:"#444",fontSize:"14px"}}>
                    <div style={{fontSize:"32px",marginBottom:"12px"}}>🌱</div>
                    <p>No weaknesses added yet.</p>
                    <p style={{fontSize:"12px",color:"#333"}}>Awareness is the first step.</p>
                  </div>
                )}
                {data.weaknesses.map(w => {
                  const log = todayLog[w.id];
                  const logged = log !== undefined;
                  const isGood = logged && log.done === false;
                  const isBad = logged && log.done === true;
                  return (
                    <div key={w.id} style={{
                      background:"#1a1a2e",borderRadius:"16px",padding:"16px",
                      marginBottom:"10px",border:`1px solid ${logged?(isGood?"#7EC87E33":isBad?"#E8614A33":"#2a2a4a"):"#2a2a4a"}`,
                      transition:"all 0.2s",animation:"fadeIn 0.3s ease"
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"10px",flex:1}}>
                          <div style={{width:"10px",height:"10px",borderRadius:"50%",background:w.color,flexShrink:0}}/>
                          <div>
                            <div style={{color:"#f0f0ff",fontWeight:"600",fontSize:"15px"}}>{w.name}</div>
                            {w.desc && <div style={{color:"#555",fontSize:"12px",marginTop:"1px"}}>{w.desc}</div>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:"4px"}}>
                          <button onClick={()=>setFormModal({item:w,isWeakness:true})} style={{background:"none",border:"none",cursor:"pointer",color:"#444",padding:"4px"}}>
                            <Icon name="edit" size={14}/>
                          </button>
                          <button onClick={()=>setDeleteModal({item:w,isWeakness:true})} style={{background:"none",border:"none",cursor:"pointer",color:"#444",padding:"4px"}}>
                            <Icon name="trash" size={14}/>
                          </button>
                        </div>
                      </div>

                      {/* Heatmap */}
                      <div style={{marginBottom:"12px"}}>
                        <WeekHeatmap item={w} logs={data.logs} isWeakness={true}/>
                      </div>

                      {logged ? (
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{
                            fontSize:"12px",padding:"4px 10px",borderRadius:"20px",
                            background: isGood?"rgba(126,200,126,0.15)":"rgba(232,97,74,0.15)",
                            color: isGood?"#7EC87E":"#E8614A"
                          }}>
                            {isGood?"✓ Resisted today":"⚠ Fell in today"}
                          </span>
                          <button onClick={()=>setLogModal({item:w,isWeakness:true})} style={{background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:"12px"}}>edit</button>
                        </div>
                      ) : (
                        <div style={{display:"flex",gap:"8px"}}>
                          <Btn small outline color="#7EC87E" onClick={()=>setLogModal({item:w,isWeakness:true})} style={{flex:1}}>No ✓</Btn>
                          <Btn small outline color="#E8614A" onClick={()=>setLogModal({item:w,isWeakness:true})} style={{flex:1}}>Yes</Btn>
                          <button onClick={()=>setDetailPage({item:w,isWeakness:true})} style={{background:"none",border:"1px solid #2a2a4a",borderRadius:"10px",padding:"6px 10px",cursor:"pointer",color:"#555"}}>
                            <Icon name="chart" size={14}/>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <Btn outline onClick={()=>setFormModal({item:null,isWeakness:true})} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",marginTop:"4px"}}>
                  <Icon name="plus" size={16}/>Add Weakness
                </Btn>
              </div>
            )}

            {activeSection === "habits" && (
              <div>
                {data.habits.length === 0 && (
                  <div style={{textAlign:"center",padding:"40px 0",color:"#444",fontSize:"14px"}}>
                    <div style={{fontSize:"32px",marginBottom:"12px"}}>✨</div>
                    <p>No habits added yet.</p>
                    <p style={{fontSize:"12px",color:"#333"}}>Build something consistent.</p>
                  </div>
                )}
                {data.habits.map(h => {
                  const log = todayLog[h.id];
                  const logged = log !== undefined;
                  const done = logged && (log.done===true || log.value);
                  return (
                    <div key={h.id} style={{
                      background:"#1a1a2e",borderRadius:"16px",padding:"16px",
                      marginBottom:"10px",border:`1px solid ${done?"#7EC87E33":"#2a2a4a"}`,
                      transition:"all 0.2s",animation:"fadeIn 0.3s ease"
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"10px",flex:1}}>
                          <div style={{width:"10px",height:"10px",borderRadius:"50%",background:h.color,flexShrink:0}}/>
                          <div>
                            <div style={{color:"#f0f0ff",fontWeight:"600",fontSize:"15px"}}>{h.name}</div>
                            {h.desc && <div style={{color:"#555",fontSize:"12px",marginTop:"1px"}}>{h.desc} · {h.type==="boolean"?"Yes/No":h.type==="countable"?`Countable (${h.unit})`:`Timed (${h.unit})`}</div>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:"4px"}}>
                          <button onClick={()=>setFormModal({item:h,isWeakness:false})} style={{background:"none",border:"none",cursor:"pointer",color:"#444",padding:"4px"}}>
                            <Icon name="edit" size={14}/>
                          </button>
                          <button onClick={()=>setDeleteModal({item:h,isWeakness:false})} style={{background:"none",border:"none",cursor:"pointer",color:"#444",padding:"4px"}}>
                            <Icon name="trash" size={14}/>
                          </button>
                        </div>
                      </div>

                      <div style={{marginBottom:"12px"}}>
                        <WeekHeatmap item={h} logs={data.logs} isWeakness={false}/>
                      </div>

                      {logged ? (
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{
                            fontSize:"12px",padding:"4px 10px",borderRadius:"20px",
                            background: done?"rgba(126,200,126,0.15)":"rgba(232,97,74,0.15)",
                            color: done?"#7EC87E":"#E8614A"
                          }}>
                            {done ? `✓ Done${log.value?` · ${log.value} ${h.unit}`:""}` : "✗ Missed"}
                          </span>
                          <button onClick={()=>setLogModal({item:h,isWeakness:false})} style={{background:"none",border:"none",cursor:"pointer",color:"#444",fontSize:"12px"}}>edit</button>
                        </div>
                      ) : (
                        <div style={{display:"flex",gap:"8px"}}>
                          <Btn small color="#4ABFE8" onClick={()=>setLogModal({item:h,isWeakness:false})} style={{flex:1,borderColor:"#4ABFE8"}}>Log</Btn>
                          <button onClick={()=>setDetailPage({item:h,isWeakness:false})} style={{background:"none",border:"1px solid #2a2a4a",borderRadius:"10px",padding:"6px 10px",cursor:"pointer",color:"#555"}}>
                            <Icon name="chart" size={14}/>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <Btn outline onClick={()=>setFormModal({item:null,isWeakness:false})} color="#4ABFE8" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",marginTop:"4px"}}>
                  <Icon name="plus" size={16} color="#4ABFE8"/>Add Habit
                </Btn>
              </div>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div>
            <h2 style={{fontFamily:"'Playfair Display',serif",color:"#f0f0ff",marginBottom:"20px",fontSize:"22px"}}>Statistics</h2>

            {data.weaknesses.length === 0 && data.habits.length === 0 && (
              <div style={{textAlign:"center",padding:"60px 0",color:"#444"}}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>📊</div>
                <p>Start logging to see your stats.</p>
              </div>
            )}

            {data.weaknesses.length > 0 && (
              <div style={{marginBottom:"24px"}}>
                <p style={{color:"#E8614A",fontSize:"12px",fontWeight:"600",letterSpacing:"1px",marginBottom:"12px"}}>WEAKNESSES</p>
                {data.weaknesses.map(w => (
                  <div key={w.id} onClick={()=>setDetailPage({item:w,isWeakness:true})} style={{
                    background:"#1a1a2e",borderRadius:"14px",padding:"14px 16px",
                    marginBottom:"8px",cursor:"pointer",
                    display:"flex",alignItems:"center",gap:"12px",
                    border:"1px solid #2a2a4a",transition:"border-color 0.2s"
                  }}>
                    <div style={{width:"10px",height:"10px",borderRadius:"50%",background:w.color,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{color:"#f0f0ff",fontWeight:"600",fontSize:"14px",marginBottom:"6px"}}>{w.name}</div>
                      <WeekHeatmap item={w} logs={data.logs} isWeakness={true}/>
                    </div>
                    <Icon name="chevronRight" size={16} color="#444"/>
                  </div>
                ))}
              </div>
            )}

            {data.habits.length > 0 && (
              <div>
                <p style={{color:"#4ABFE8",fontSize:"12px",fontWeight:"600",letterSpacing:"1px",marginBottom:"12px"}}>HABITS</p>
                {data.habits.map(h => (
                  <div key={h.id} onClick={()=>setDetailPage({item:h,isWeakness:false})} style={{
                    background:"#1a1a2e",borderRadius:"14px",padding:"14px 16px",
                    marginBottom:"8px",cursor:"pointer",
                    display:"flex",alignItems:"center",gap:"12px",
                    border:"1px solid #2a2a4a",transition:"border-color 0.2s"
                  }}>
                    <div style={{width:"10px",height:"10px",borderRadius:"50%",background:h.color,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{color:"#f0f0ff",fontWeight:"600",fontSize:"14px",marginBottom:"6px"}}>{h.name}</div>
                      <WeekHeatmap item={h} logs={data.logs} isWeakness={false}/>
                    </div>
                    <Icon name="chevronRight" size={16} color="#444"/>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {tab !== "settings" && (
        <div style={{
          position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:"480px",
          background:"rgba(13,13,26,0.95)",backdropFilter:"blur(20px)",
          borderTop:"1px solid #1a1a2e",padding:"12px 24px 20px",
          display:"flex",justifyContent:"space-around"
        }}>
          {[{id:"dashboard",icon:"sun",label:"Today"},{id:"stats",icon:"chart",label:"Stats"}].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:"none",border:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",
              color: tab===t.id?"#6A7FE8":"#444",padding:"4px 16px"
            }}>
              <Icon name={t.icon} size={20} color={tab===t.id?"#6A7FE8":"#444"}/>
              <span style={{fontSize:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:"600"}}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {logModal && (
        <LogModal
          item={logModal.item}
          type={logModal.item.type}
          isWeakness={logModal.isWeakness}
          log={todayLog[logModal.item.id]}
          onSave={(entry)=>logEntry(logModal.item,logModal.isWeakness,entry)}
          onClose={()=>setLogModal(null)}
        />
      )}

      {formModal && (
        <ItemFormModal
          item={formModal.item}
          isWeakness={formModal.isWeakness}
          onSave={(item)=>{saveItem(item,formModal.isWeakness);setFormModal(null);}}
          onClose={()=>setFormModal(null)}
        />
      )}

      {deleteModal && (
        <DeleteModal
          item={deleteModal.item}
          isWeakness={deleteModal.isWeakness}
          onDelete={()=>{deleteItem(deleteModal.item,deleteModal.isWeakness,false);setDeleteModal(null);}}
          onArchive={()=>{deleteItem(deleteModal.item,deleteModal.isWeakness,true);setDeleteModal(null);}}
          onClose={()=>setDeleteModal(null)}
        />
      )}

      {weeklyModal && (
        <WeeklyReflectionModal
          weekKey={weekKey}
          existing={data.weeklyReflections?.[weekKey]}
          onSave={(r)=>updateData(d=>{d.weeklyReflections={...d.weeklyReflections,[weekKey]:r};return d;})}
          onClose={()=>setWeeklyModal(false)}
        />
      )}

      {exportModal && <ExportModal data={data} onClose={()=>setExportModal(false)}/>}

      {pinModal && <PinScreen isSetup onUnlock={()=>setPinModal(false)}/>}
    </div>
  );
}
