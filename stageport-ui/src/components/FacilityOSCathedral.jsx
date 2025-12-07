import React, { useState } from 'react';
import {
  Activity,
  Wind,
  Lock,
  Ticket,
  Code,
  Calendar,
  ArrowRight,
  Coffee,
  Briefcase,
  Sparkles,
  X,
  Eye,
} from 'lucide-react';

// --- CONFIG & UTILITIES ---
const apiKey = ""; // API Key injected at runtime

const THEME = {
  bg: "bg-[#080b10]",
  panel: "bg-[#0f1219]/90",
  border: "border-slate-800/60",
  accent_blush: "text-rose-200",
  accent_cerulean: "text-cyan-400/80",
  text_muted: "text-slate-400",
  text_light: "text-slate-200",
};

const callGemini = async (prompt, systemInstruction = "") => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      }
    );
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "The Signal is silent.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection severed. The Archive is offline.";
  }
};

// --- VISUAL FX ---
const StrawberryField = () => (
  <div className="absolute top-10 right-10 w-64 h-64 pointer-events-none opacity-20 mix-blend-screen">
    <div className="absolute inset-0 bg-rose-500/30 blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/20 blur-[60px] animate-bounce" style={{ animationDuration: '6s' }} />
  </div>
);

const MechanicalUnderwire = ({ isVisible }) => (
  <div className={`fixed inset-0 pointer-events-none z-[0] transition-opacity duration-1000 ${isVisible ? 'opacity-20' : 'opacity-[0.03]'}`}>
    {/* The Grid - "Reframing the Blueprint" */}
    <div className="absolute left-[90px] h-full w-[1px] bg-cyan-900" />
    <div className="absolute top-[80px] w-full h-[1px] bg-cyan-900" />
    <div className="absolute bottom-[40px] w-full h-[1px] bg-cyan-900" />
    <div className="absolute right-[40px] h-full w-[1px] bg-cyan-900" />
    
    {/* Tech Specs Labels - From Uploaded PDF */}
    <div className="absolute top-[85px] left-[100px] font-mono text-[8px] text-cyan-700 tracking-[0.2em]">SCHEMA: MoveMintEvent (v1.2)</div>
    <div className="absolute bottom-[45px] right-[50px] font-mono text-[8px] text-cyan-700 tracking-[0.2em]">LEDGER: 8F-992-DELTA</div>
    
    {/* FSM State Indicator */}
    <div className="absolute top-1/2 right-10 font-mono text-[8px] text-rose-500/50 -rotate-90 origin-right">
      STATE: FERMATA (AUDIT)
    </div>
  </div>
);

// --- COMPONENT UNITS ---

// 1. THE HEARTH (KINETIC KITCHEN LOG)
const HearthCard = () => (
  <div className="p-6 border border-slate-800 bg-[#0a0a0f] relative group overflow-hidden">
    <div className="absolute top-0 right-0 p-2 opacity-30"><Activity size={16} className="text-amber-500"/></div>
    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-4">Kinetic Kitchen Log</div>
    
    <div className="font-serif text-white text-lg italic mb-1">Sunday Gravy</div>
    <div className="text-[10px] font-mono text-slate-400 mb-4">Session ID: 8F-992-DELTA</div>
    
    <div className="space-y-2 border-l-2 border-slate-800 pl-3">
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>Duration</span> <span className="text-slate-300">4h 12m</span>
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>Stir Count</span> <span className="text-slate-300">842</span>
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>Hesitations</span> <span className="text-rose-400">3 (Minted)</span>
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
      <span className="text-[9px] font-mono text-emerald-500">Rating: S-Tier</span>
      <span className="text-[9px] font-mono text-slate-600">HASH: 7E4D...</span>
    </div>
  </div>
);

// 2. THE LEDGER (SOCIAL RECEIPT LUX)
const LedgerReceipt = () => (
  <div className="bg-[#fcfcfc] text-zinc-900 p-6 max-w-sm w-full shadow-2xl relative rotate-1 transform hover:rotate-0 transition-transform duration-500 font-mono text-xs">
    <div className="text-center border-b-2 border-dashed border-zinc-300 pb-4 mb-4">
      <div className="font-bold text-sm tracking-widest uppercase">StagePort Ledger</div>
      <div className="text-[9px] mt-1 text-zinc-500">LUX EDITION v1.0</div>
    </div>
    
    <div className="space-y-4 mb-6">
      <div className="flex justify-between">
        <span>SESSION ID</span>
        <span>8F-992-DELTA</span>
      </div>
      <div className="flex justify-between">
        <span>CONTEXT</span>
        <span>Kitchen/Rehearsal</span>
      </div>
      <div className="p-3 bg-zinc-100 italic border-l-2 border-zinc-900 text-[10px]">
        "Your structure held. Your tone softened."
      </div>
    </div>

    <div className="border-t-2 border-zinc-900 pt-4 space-y-2">
      <div className="flex justify-between font-bold">
        <span>THORN INDEX</span>
        <span>2.0/5</span>
      </div>
      <div className="flex justify-between font-bold">
        <span>COMPOSURE</span>
        <span>93.4</span>
      </div>
    </div>

    <div className="mt-6 text-center text-[8px] text-zinc-400 uppercase tracking-widest">
      Structure converts motion to proof.
    </div>
  </div>
);

// 3. THE WINDOW MAP (STAGE DOOR)
const WindowMapItem = ({ tier, price, view, expiry }) => (
  <div className="p-5 border border-slate-800 bg-[#0a0a0f] hover:bg-slate-900 transition-colors group">
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-serif text-white italic text-lg">{tier}</h3>
      <span className="text-xs font-mono text-slate-400">{price}</span>
    </div>
    <div className="space-y-2 text-[10px] font-mono text-slate-500">
      <div className="flex items-center gap-2">
        <Eye size={10} className="text-cyan-400" /> {view}
      </div>
      <div className="flex items-center gap-2">
        <Calendar size={10} className="text-rose-400" /> {expiry}
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-slate-800">
      <button className="w-full text-[9px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors text-left flex justify-between">
        <span>Open Viewport</span> <ArrowRight size={10} />
      </button>
    </div>
  </div>
);

// --- MODALS ---

const TechSpecsOverlay = ({ onClose, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-xl p-8 sm:p-12 animate-in fade-in duration-300 overflow-y-auto">
      <div className="max-w-4xl mx-auto border border-cyan-900/30 p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-cyan-700 hover:text-cyan-400"><X size={20}/></button>
        
        <div className="mb-8 border-b border-cyan-900/30 pb-4">
          <h2 className="font-mono text-2xl text-cyan-500 mb-2">System Underwire // Uploaded Specs</h2>
          <p className="font-mono text-xs text-cyan-800 uppercase tracking-widest">
            From: StagePort_BrandBook_v1.pdf & Investor_Packet_v1.pdf
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-mono text-xs">
          <div className="space-y-6">
            <h3 className="text-white uppercase tracking-widest border-b border-white/10 pb-2">The Choreographic FSM</h3>
            <div className="p-4 bg-slate-900/50 border border-slate-800 text-slate-400 space-y-2">
              <div className="flex items-center gap-2"><span className="text-rose-400">GLISSADE</span> → Prep / Timing</div>
              <div className="flex items-center gap-2"><span className="text-cyan-400">JETE</span> → Launch / Risk-On</div>
              <div className="flex items-center gap-2"><span className="text-amber-400">FERMATA</span> → Hold / Audit (Active)</div>
              <div className="flex items-center gap-2"><span className="text-emerald-400">CODA</span> → Settlement</div>
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              *Logic derived from "Feedback Loops & Four-Inch Pumps" essay.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-white uppercase tracking-widest border-b border-white/10 pb-2">Database Schema</h3>
            <pre className="text-[9px] text-emerald-500/80 overflow-x-auto bg-black p-3 border border-emerald-900/30">
{`model MoveMintEvent {
  id String @id @default(cuid())
  student_id String
  routine_id String
  timestamp DateTime
  tes Float? // Tech Element Score
  pcs Float? // Program Comp Score
  goe Float? // Grade of Execution
  created_at DateTime @default(now())
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP SHELL ---

export default function FacilityOS_Cathedral() {
  const [view, setView] = useState('FOYER'); 
  const [isTechVisible, setIsTechVisible] = useState(false);

  return (
    <div className={`min-h-screen ${THEME.bg} text-slate-200 font-sans selection:bg-rose-900/30 selection:text-white relative overflow-hidden flex`}>
      
      {/* ATMOSPHERE & UNDERWIRE */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.04] pointer-events-none" />
      <StrawberryField />
      <MechanicalUnderwire isVisible={isTechVisible} />
      
      {/* MODALS */}
      <TechSpecsOverlay isVisible={isTechVisible} onClose={() => setIsTechVisible(false)} />

      {/* LEFT RAIL */}
      <nav className={`w-[90px] border-r ${THEME.border} bg-[#080b10]/95 backdrop-blur-xl z-40 flex flex-col justify-between h-screen`}>
        <div>
          <div className="h-[80px] flex items-center justify-center border-b border-slate-800 bg-[#050505]">
             <span className="font-serif italic text-3xl text-rose-100">S</span>
          </div>
          {[
            { id: 'FOYER', icon: Wind, label: 'Foyer' },
            { id: 'STUDY', icon: Briefcase, label: 'Study' },
            { id: 'SALON', icon: Coffee, label: 'Salon' },
            { id: 'BACKSTAGE', icon: Lock, label: 'Vaults' },
            { id: 'DOOR', icon: Ticket, label: 'Gates' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full h-[80px] flex flex-col items-center justify-center gap-1 border-b border-slate-800/50 transition-colors group relative ${view === item.id ? 'bg-white/5' : ''}`}
            >
              <item.icon size={20} strokeWidth={1.5} className={`transition-colors ${view === item.id ? 'text-rose-200' : 'text-slate-600 group-hover:text-slate-400'}`} />
              <span className={`text-[8px] font-mono uppercase tracking-[0.2em] transition-colors ${view === item.id ? 'text-white' : 'text-slate-600'}`}>{item.label}</span>
              {view === item.id && <div className="absolute left-0 top-0 h-full w-[2px] bg-rose-500" />}
            </button>
          ))}
        </div>
        <div className="border-t border-slate-800">
           <button onClick={() => setIsTechVisible(!isTechVisible)} className="w-full h-[60px] flex items-center justify-center text-slate-600 hover:text-cyan-400 transition-colors">
             <Code size={18} />
           </button>
        </div>
      </nav>

      {/* MAIN STAGE */}
      <main className="flex-1 relative flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-[80px] border-b border-slate-800 flex items-center justify-between px-10 bg-[#080b10]/50 backdrop-blur-sm z-30">
           <div>
             <h1 className="text-2xl font-serif text-white italic tracking-wide">
               {view === 'FOYER' ? 'The Foyer' : 
                view === 'STUDY' ? 'Faculty Study' :
                view === 'SALON' ? 'Garden Salon' :
                view === 'BACKSTAGE' ? 'Identity Vaults' :
                'Stage Door'}
             </h1>
             <div className="text-[9px] font-mono text-cyan-700 uppercase tracking-[0.2em] mt-1">
               Facility OS v5.0 // {view} // System: Calibrated
             </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={10} /> Agent: ETHEOS Active
              </div>
           </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-12 pb-24 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* VIEW: FOYER */}
          {view === 'FOYER' && (
            <div className="grid grid-cols-12 gap-8 animate-in fade-in zoom-in duration-500">
              {/* Hero */}
              <div className="col-span-12 lg:col-span-8 p-10 border border-slate-800 bg-gradient-to-r from-[#0f1219] to-transparent relative overflow-hidden">
                 <h2 className="text-4xl font-serif text-white italic mb-4">Good Morning, Director.</h2>
                 <p className="text-sm text-slate-400 max-w-lg mb-8 leading-relaxed">
                   "Structure converts motion to proof." <br/>
                   The FSM is currently in <span className="text-amber-400 font-mono">FERMATA</span> state (Manual Review).
                   <br/> Ghost Labor Scanner detected 2.5hrs of unpaid admin work.
                 </p>
                 <div className="flex gap-4">
                   <button className="px-6 py-3 bg-white text-black font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-rose-100">
                     Mint StageCred
                   </button>
                 </div>
              </div>
              
              {/* The Hearth */}
              <div className="col-span-12 lg:col-span-4">
                 <HearthCard />
              </div>
            </div>
          )}

          {/* VIEW: SALON */}
          {view === 'SALON' && (
            <div className="grid grid-cols-12 gap-8 animate-in fade-in zoom-in duration-500">
               <div className="col-span-12 lg:col-span-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 border border-slate-800 bg-[#0a0a0f] relative overflow-hidden">
                       <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-4">Community Ports</div>
                       <div className="font-serif text-white text-lg mb-2">Gala Roses</div>
                       <div className="text-emerald-400 font-mono text-xs">SPONSORED: Main St. Florist</div>
                    </div>
                    <div className="p-6 border border-slate-800 bg-[#0a0a0f]">
                       <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-4">Coffee Run</div>
                       <div className="font-serif text-white text-lg mb-2">Starbucks: 10AM</div>
                       <div className="text-amber-400 font-mono text-xs">Runner: Sarah M.</div>
                    </div>
                 </div>
               </div>
               
               <div className="col-span-12 lg:col-span-4">
                  <LedgerReceipt />
               </div>
            </div>
          )}

          {/* VIEW: STAGE DOOR (WINDOW MAP) */}
          {view === 'DOOR' && (
             <div className="animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-8">
                   <h3 className="text-xl font-serif text-white italic">The Window Map</h3>
                   <p className="text-[9px] font-mono text-slate-500 uppercase">
                     "One night in the theater. One year in the ledger."
                   </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <WindowMapItem tier="Balcony" price="Included" view="Recital Summary" expiry="30 Days" />
                   <WindowMapItem tier="Mezzanine" price="$49 / Season" view="Timeline + Clips" expiry="Season End" />
                   <WindowMapItem tier="Bay Window" price="$149 / Season" view="Full Portfolio + Export" expiry="Permanent" />
                </div>
             </div>
          )}

          {/* PLACEHOLDERS */}
          {view === 'STUDY' && <div className="flex items-center justify-center h-64 border border-dashed border-slate-800 text-slate-600 font-mono text-xs uppercase tracking-widest">Faculty Study Active</div>}
          {view === 'BACKSTAGE' && <div className="flex items-center justify-center h-64 border border-dashed border-slate-800 text-slate-600 font-mono text-xs uppercase tracking-widest">Backstage Vaults Secure</div>}

        </div>

        {/* CONDUCTIVITY FOOTER */}
        <div className="h-[40px] border-t border-slate-800 bg-[#080b10] flex items-center justify-between px-6 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
           <div>System: Online</div>
           <div className="flex items-center gap-4">
              <span>Ledger: Syncing</span>
              <span className="text-cyan-800">///</span>
              <span>Pink Tax: Offset</span>
           </div>
        </div>

      </main>
    </div>
  );
}
