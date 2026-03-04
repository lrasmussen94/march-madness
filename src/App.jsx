import { useState, useEffect } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────
const REGIONS = ["East", "West", "South", "Midwest"];
const ROUNDS = ["Round of 64", "Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship"];

const DEFAULT_TEAMS = {
  East:    [["Duke","#1"],["UConn","#16"],["Texas","#8"],["Florida","#9"],["Marquette","#5"],["Creighton","#12"],["UCLA","#4"],["Gonzaga","#13"],["Purdue","#6"],["Utah St","#11"],["Tennessee","#3"],["Iowa","#14"],["Dayton","#7"],["Nevada","#10"],["Arizona","#2"],["Long Beach","#15"]],
  West:    [["Kansas","#1"],["Howard","#16"],["Arkansas","#8"],["Illinois","#9"],["Miami FL","#5"],["Drake","#12"],["Indiana","#4"],["Kent St","#13"],["Iowa St","#6"],["Pitt","#11"],["Xavier","#3"],["Kennesaw","#14"],["Texas A&M","#7"],["Penn St","#10"],["Texas Tech","#2"],["Montana St","#15"]],
  South:   [["Alabama","#1"],["TAMU-CC","#16"],["Maryland","#8"],["West VA","#9"],["San Diego","#5"],["Charleston","#12"],["Virginia","#4"],["Furman","#13"],["Creighton","#6"],["NC State","#11"],["Baylor","#3"],["UCSB","#14"],["Missouri","#7"],["Utah St","#10"],["Arizona St","#2"],["Nevada","#15"]],
  Midwest: [["Houston","#1"],["N. Kentucky","#16"],["Iowa","#8"],["Auburn","#9"],["Miami OH","#5"],["Indiana St","#12"],["Kansas","#4"],["Gallaudet","#13"],["Kentucky","#6"],["Providence","#11"],["Gonzaga","#3"],["Grand Canyon","#14"],["Northwestern","#7"],["Boise St","#10"],["UCLA","#2"],["UNC Asheville","#15"]],
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "mm_tracker_v2";

async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

async function saveData(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function initBracket() {
  const b = {};
  REGIONS.forEach(r => {
    b[r] = {};
    for (let rd = 0; rd < 4; rd++) {
      b[r][rd] = {};
      const games = Math.pow(2, 3 - rd);
      for (let g = 0; g < games; g++) b[r][rd][g] = null;
    }
  });
  b.finalFour = { 0: null, 1: null, 2: null, 3: null };
  b.championship = { 0: null, 1: null };
  b.champion = null;
  return b;
}

function calcScore(submitted, actual) {
  if (!submitted || !actual) return 0;
  let score = 0;
  const pts = [1, 2, 4, 8, 16, 32];
  REGIONS.forEach(r => {
    for (let rd = 0; rd < 4; rd++) {
      const games = Math.pow(2, 3 - rd);
      for (let g = 0; g < games; g++) {
        if (submitted[r]?.[rd]?.[g] && submitted[r][rd][g] === actual[r]?.[rd]?.[g]) score += pts[rd];
      }
    }
  });
  [0,1,2,3].forEach(i => { if (submitted.finalFour?.[i] && submitted.finalFour[i] === actual.finalFour?.[i]) score += pts[4]; });
  [0,1].forEach(i => { if (submitted.championship?.[i] && submitted.championship[i] === actual.championship?.[i]) score += pts[5]; });
  if (submitted.champion && submitted.champion === actual.champion) score += pts[5];
  return score;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Matchup({ top, bottom, winner, onPick, editable, small }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2, margin:"3px 0" }}>
      {[top, bottom].map((team, i) => {
        const isWinner = winner === team;
        const isLoser = winner && winner !== team;
        return (
          <div key={i}
            onClick={() => editable && team && onPick && onPick(team)}
            style={{
              display:"flex", alignItems:"center", gap:6,
              padding: small ? "3px 7px" : "5px 10px",
              borderRadius:5,
              fontSize: small ? 10 : 11,
              fontFamily:"'Barlow Condensed', sans-serif",
              fontWeight: isWinner ? 700 : 400,
              background: isWinner ? "#f97316" : isLoser ? "#1a1a2e" : "#16213e",
              color: isWinner ? "#fff" : isLoser ? "#444" : "#ccc",
              border: isWinner ? "1px solid #f97316" : "1px solid #1e2a4a",
              cursor: editable && team ? "pointer" : "default",
              transition:"all 0.15s",
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
              maxWidth: small ? 110 : 140,
              textDecoration: isLoser ? "line-through" : "none",
            }}>
            {team || <span style={{color:"#333",fontStyle:"italic"}}>TBD</span>}
            {isWinner && <span style={{marginLeft:"auto",fontSize:9}}>✓</span>}
          </div>
        );
      })}
    </div>
  );
}

function BracketRegion({ region, bracket, teams, onPick, editable }) {
  const getTeam = (rd, game, slot) => {
    if (rd === 0) {
      const idx = game * 2 + slot;
      return teams[idx]?.[0] || null;
    }
    return bracket[rd - 1]?.[Math.floor(game * 2 + slot)] ?? null;
  };

  const rounds = [0,1,2,3];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, alignItems:"center" }}>
        {rounds.map(rd => {
          const games = Math.pow(2, 3 - rd);
          return (
            <div key={rd} style={{ display:"flex", flexDirection:"column", justifyContent:"space-around", height: 460 }}>
              <div style={{ fontSize:9, color:"#f97316", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:1, marginBottom:4, textTransform:"uppercase" }}>
                {["R64","R32","S16","Elite8"][rd]}
              </div>
              {Array.from({length:games}).map((_,g) => {
                const t = getTeam(rd, g, 0);
                const b = getTeam(rd, g, 1);
                return (
                  <Matchup key={g}
                    top={t} bottom={b}
                    winner={bracket[rd]?.[g]}
                    onPick={(team) => onPick(region, rd, g, team)}
                    editable={editable}
                    small={rd === 0}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Leaderboard row
function LBRow({ rank, entry, maxScore }) {
  const pct = maxScore > 0 ? (entry.score / maxScore) * 100 : 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"#0f172a", borderRadius:8, marginBottom:6, border:"1px solid #1e2a4a" }}>
      <div style={{ width:28, textAlign:"center", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color: rank===1?"#f97316":rank===2?"#94a3b8":rank===3?"#b45309":"#334155" }}>{rank}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:"#f1f5f9" }}>{entry.name}</div>
        <div style={{ height:5, background:"#1e2a4a", borderRadius:3, marginTop:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background: rank===1?"linear-gradient(90deg,#f97316,#ef4444)":"#334155", borderRadius:3, transition:"width 0.5s" }} />
        </div>
      </div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:"#f97316" }}>{entry.score}</div>
      <div style={{ fontSize:10, color:"#475569", width:40, textAlign:"right" }}>pts</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home"); // home | submit | admin | leaderboard
  const [entries, setEntries] = useState([]);
  const [actual, setActual] = useState(null); // admin's official results bracket
  const [submitting, setSub] = useState({ name:"", bracket: initBracket() });
  const [adminBracket, setAdminBracket] = useState(initBracket());
  const [adminPass, setAdminPass] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [activeRegion, setActiveRegion] = useState("East");
  const [adminRegion, setAdminRegion] = useState("East");
  const [standingsPass, setStandingsPass] = useState("");
  const [standingsUnlocked, setStandingsUnlocked] = useState(false);
  const [standingsPass, setStandingsPass] = useState("");
  const [standingsUnlocked, setStandingsUnlocked] = useState(false);

  // Load persisted data
  useEffect(() => {
    loadData().then(d => {
      if (d) {
        if (d.entries) setEntries(d.entries);
        if (d.actual) { setActual(d.actual); setAdminBracket(d.actual); }
      }
      setLoaded(true);
    });
  }, []);

  // Persist
  useEffect(() => {
    if (!loaded) return;
    saveData({ entries, actual });
  }, [entries, actual, loaded]);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // Submission bracket picking
  function pickSubmit(region, rd, game, team) {
    setSub(prev => {
      const b = JSON.parse(JSON.stringify(prev.bracket));
      b[region][rd][game] = team;
      // propagate: clear downstream in region
      for (let r = rd + 1; r < 4; r++) {
        const gamesInRd = Math.pow(2, 3 - r);
        for (let g = 0; g < gamesInRd; g++) {
          const pick = b[region][r][g];
          // check if pick still valid
          const prevRd = r - 1;
          const topGame = g * 2, botGame = g * 2 + 1;
          if (pick && pick !== b[region][prevRd][topGame] && pick !== b[region][prevRd][botGame]) b[region][r][g] = null;
        }
      }
      return { ...prev, bracket: b };
    });
  }

  // Admin bracket picking
  function pickAdmin(region, rd, game, team) {
    setAdminBracket(prev => {
      const b = JSON.parse(JSON.stringify(prev));
      b[region][rd][game] = team;
      return b;
    });
  }

  function pickFinalFour(src, idx, team, setFn) {
    setFn(prev => {
      const b = JSON.parse(JSON.stringify(prev));
      b.finalFour[idx] = team;
      return b;
    });
  }

  function pickChampionship(src, idx, team, setFn) {
    setFn(prev => {
      const b = JSON.parse(JSON.stringify(prev));
      b.championship[idx] = team;
      return b;
    });
  }

  function pickChampion(team, setFn) {
    setFn(prev => {
      const b = JSON.parse(JSON.stringify(prev));
      b.champion = team;
      return b;
    });
  }

  function submitBracket() {
    if (!submitting.name.trim()) return showToast("Please enter your name!", false);
    const entry = { name: submitting.name.trim(), bracket: submitting.bracket, submittedAt: Date.now(), score: actual ? calcScore(submitting.bracket, actual) : 0 };
    setEntries(prev => {
      const exists = prev.findIndex(e => e.name.toLowerCase() === entry.name.toLowerCase());
      if (exists >= 0) { const n = [...prev]; n[exists] = entry; return n; }
      return [...prev, entry];
    });
    setSub({ name:"", bracket: initBracket() });
    showToast("Bracket submitted! 🏀");
    setView("leaderboard");
  }

  function saveActual() {
    setActual(adminBracket);
    // recalc all scores
    setEntries(prev => prev.map(e => ({ ...e, score: calcScore(e.bracket, adminBracket) })));
    showToast("Results updated! Scores recalculated ✓");
  }

  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
  const maxScore = sortedEntries[0]?.score || 1;

  // Elite 8 regional winners for Final Four
  const getElite8Winner = (b, regionIdx) => {
    const r = REGIONS[regionIdx];
    return b[r]?.[3]?.[0] || null;
  };

  // Colors
  const C = { bg:"#070b14", panel:"#0d1626", accent:"#f97316", border:"#1e2a4a", text:"#f1f5f9", muted:"#475569" };

  if (!loaded) return <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontFamily:"'Barlow Condensed',sans-serif", fontSize:24 }}>Loading...</div>;

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Barlow:wght@400;500&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#0d1626 0%,#0f2040 100%)", borderBottom:"2px solid #f97316", padding:"0 24px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, padding:"14px 0" }}>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, letterSpacing:2, color:"#f97316", lineHeight:1 }}>🏀 MARCH MADNESS</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, color:"#94a3b8", letterSpacing:3, textTransform:"uppercase" }}>Office Bracket Challenge</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, color:"#475569", letterSpacing:2, textTransform:"uppercase", marginTop:3 }}>Tompkins & Peters CPAs, P.C.</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {[["home","🏠 Home"],["submit","📝 Submit"],["leaderboard","🏆 Standings"],["admin","⚙️ Admin"]].map(([v,label]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding:"8px 16px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, background: view===v?"#f97316":"#1a2540", color: view===v?"#fff":"#94a3b8", transition:"all 0.15s" }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && <div style={{ position:"fixed", top:20, right:20, zIndex:999, padding:"12px 20px", borderRadius:8, background: toast.ok?"#15803d":"#991b1b", color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, boxShadow:"0 4px 24px rgba(0,0,0,0.4)" }}>{toast.msg}</div>}

      <div style={{ maxWidth:1200, margin:"0 auto", padding:24 }}>

        {/* ── HOME ── */}
        {view === "home" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:32 }}>
              {[["📋","Total Entries",entries.length],["🏀","Current Leader",sortedEntries[0]?.name||"—"],["⭐","Top Score",sortedEntries[0]?.score||0],["🗓️","Rounds",ROUNDS.length]].map(([icon,label,val]) => (
                <div key={label} style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:"20px 24px" }}>
                  <div style={{ fontSize:28 }}>{icon}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:"#f97316", marginTop:4 }}>{val}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, color:"#64748b", letterSpacing:1, textTransform:"uppercase" }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:24 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:"#f97316", marginBottom:16 }}>HOW IT WORKS</div>
                {[["1","Submit your bracket","Pick winners for all 63 games before the tournament starts"],["2","Track live results","Admin updates results as games complete"],["3","Score points","1pt R64 · 2pt R32 · 4pt S16 · 8pt E8 · 16pt FF · 32pt Championship"]].map(([n,title,desc]) => (
                  <div key={n} style={{ display:"flex", gap:12, marginBottom:16 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"#f97316", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, flexShrink:0 }}>{n}</div>
                    <div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15 }}>{title}</div>
                      <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:24 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:"#f97316", marginBottom:16 }}>TOP 5 STANDINGS</div>
                {sortedEntries.slice(0,5).map((e,i) => (
                  <div key={e.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #1e2a4a" }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:i===0?900:400, fontSize:15 }}>{i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":"  "}{e.name}</span>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:"#f97316" }}>{e.score} pts</span>
                  </div>
                ))}
                {entries.length === 0 && <div style={{ color:"#334155", fontStyle:"italic", fontSize:13 }}>No entries yet</div>}
                <button onClick={() => setView("submit")} style={{ marginTop:16, width:"100%", padding:"10px", borderRadius:8, border:"none", background:"#f97316", color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, letterSpacing:1, cursor:"pointer" }}>SUBMIT YOUR BRACKET →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUBMIT ── */}
        {view === "submit" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:"#f97316" }}>SUBMIT YOUR BRACKET</div>
              <div style={{ color:"#64748b", fontSize:13, marginTop:4 }}>Pick winners for each matchup. Click a team to advance them.</div>
            </div>
            <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
              <input value={submitting.name} onChange={e => setSub(p=>({...p,name:e.target.value}))} placeholder="Your name..." style={{ padding:"10px 16px", borderRadius:8, border:"1px solid #1e2a4a", background:"#0d1626", color:"#f1f5f9", fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, outline:"none", flex:1, minWidth:200 }} />
            </div>

            {/* Region tabs */}
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {[...REGIONS, "Final Four"].map(r => (
                <button key={r} onClick={() => setActiveRegion(r)} style={{ padding:"7px 16px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, background: activeRegion===r?"#f97316":"#1a2540", color: activeRegion===r?"#fff":"#94a3b8" }}>{r.toUpperCase()}</button>
              ))}
            </div>

            {REGIONS.includes(activeRegion) && (
              <div style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:20, overflowX:"auto" }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:"#f97316", marginBottom:12 }}>{activeRegion.toUpperCase()} REGION</div>
                <BracketRegion region={activeRegion} bracket={submitting.bracket[activeRegion]} teams={DEFAULT_TEAMS[activeRegion]} onPick={pickSubmit} editable={true} />
              </div>
            )}

            {activeRegion === "Final Four" && (
              <div style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:20 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:"#f97316", marginBottom:16 }}>FINAL FOUR & CHAMPIONSHIP</div>
                <div style={{ display:"flex", gap:24, flexWrap:"wrap", alignItems:"flex-start" }}>
                  {/* Semifinal 1 */}
                  <div>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontFamily:"'Barlow Condensed',sans-serif" }}>SEMIFINAL 1 (East vs West)</div>
                    <Matchup top={getElite8Winner(submitting.bracket,0)} bottom={getElite8Winner(submitting.bracket,1)} winner={submitting.bracket.finalFour?.[0]||submitting.bracket.finalFour?.[1]?"":null}
                      onPick={(t) => pickFinalFour(null,t===getElite8Winner(submitting.bracket,0)?0:1,t,b=>setSub(p=>({...p,bracket:b})))}
                      editable={true} />
                  </div>
                  {/* Semifinal 2 */}
                  <div>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontFamily:"'Barlow Condensed',sans-serif" }}>SEMIFINAL 2 (South vs Midwest)</div>
                    <Matchup top={getElite8Winner(submitting.bracket,2)} bottom={getElite8Winner(submitting.bracket,3)}
                      onPick={(t) => pickFinalFour(null,t===getElite8Winner(submitting.bracket,2)?2:3,t,b=>setSub(p=>({...p,bracket:b})))}
                      editable={true} />
                  </div>
                  {/* Championship */}
                  <div>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontFamily:"'Barlow Condensed',sans-serif" }}>CHAMPIONSHIP</div>
                    <Matchup top={submitting.bracket.finalFour?.[0]||submitting.bracket.finalFour?.[1]||"—"} bottom={submitting.bracket.finalFour?.[2]||submitting.bracket.finalFour?.[3]||"—"}
                      editable={false} />
                  </div>
                  {/* Champion */}
                  <div>
                    <div style={{ fontSize:11, color:"#f97316", marginBottom:6, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>🏆 CHAMPION PICK</div>
                    <input value={submitting.bracket.champion||""} onChange={e => pickChampion(e.target.value,b=>setSub(p=>({...p,bracket:b})))} placeholder="Type champion name..."
                      style={{ padding:"8px 12px", borderRadius:8, border:"2px solid #f97316", background:"#0d1626", color:"#f97316", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, outline:"none", width:160 }} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop:20, display:"flex", gap:12 }}>
              <button onClick={submitBracket} style={{ padding:"12px 32px", borderRadius:8, border:"none", background:"#f97316", color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, letterSpacing:1, cursor:"pointer" }}>SUBMIT BRACKET ✓</button>
              <button onClick={() => setSub({name:"",bracket:initBracket()})} style={{ padding:"12px 20px", borderRadius:8, border:"1px solid #1e2a4a", background:"transparent", color:"#64748b", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Reset</button>
            </div>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {view === "leaderboard" && (
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:"#f97316", marginBottom:20 }}>🏆 STANDINGS</div>
            {!standingsUnlocked ? (
              <div style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:32, maxWidth:400 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:18, marginBottom:6 }}>Standings are locked</div>
                <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Enter the staff password to view the leaderboard.</div>
                <input type="password" value={standingsPass} onChange={e => setStandingsPass(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && (standingsPass==="tompkins2025" ? setStandingsUnlocked(true) : showToast("Wrong password",false))}
                  placeholder="Staff password..."
                  style={{ padding:"10px 14px", borderRadius:8, border:"1px solid #1e2a4a", background:"#070b14", color:"#f1f5f9", fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, outline:"none", width:"100%", boxSizing:"border-box" }} />
                <button onClick={() => standingsPass==="tompkins2025" ? setStandingsUnlocked(true) : showToast("Wrong password",false)}
                  style={{ marginTop:12, width:"100%", padding:"10px", borderRadius:8, border:"none", background:"#f97316", color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, cursor:"pointer" }}>VIEW STANDINGS</button>
              </div>
            ) : (
              <div>
                {sortedEntries.length === 0
                  ? <div style={{ color:"#334155", fontStyle:"italic" }}>No entries yet. Be the first to submit!</div>
                  : sortedEntries.map((e, i) => <LBRow key={e.name} rank={i+1} entry={e} maxScore={maxScore} />)
                }
                <div style={{ marginTop:24, background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:20 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:"#64748b", marginBottom:12 }}>SCORING SYSTEM</div>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                    {[["R64","1pt"],["R32","2pts"],["Sweet 16","4pts"],["Elite 8","8pts"],["Final Four","16pts"],["Championship","32pts"]].map(([r,p]) => (
                      <div key={r} style={{ textAlign:"center", background:"#070b14", borderRadius:8, padding:"10px 16px" }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:"#f97316" }}>{p}</div>
                        <div style={{ fontSize:10, color:"#475569", fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1, textTransform:"uppercase" }}>{r}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setStandingsUnlocked(false); setStandingsPass(""); }}
                  style={{ marginTop:16, padding:"8px 20px", borderRadius:8, border:"1px solid #1e2a4a", background:"transparent", color:"#475569", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>🔒 Lock Standings</button>
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN ── */}
        {view === "admin" && (
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:"#f97316", marginBottom:20 }}>⚙️ ADMIN — UPDATE RESULTS</div>
            {!adminUnlocked ? (
              <div style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:32, maxWidth:360 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, marginBottom:12 }}>Enter admin password</div>
                <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} onKeyDown={e => e.key==="Enter" && (adminPass==="admin123" ? setAdminUnlocked(true) : showToast("Wrong password",false))}
                  placeholder="Password..." style={{ padding:"10px 14px", borderRadius:8, border:"1px solid #1e2a4a", background:"#070b14", color:"#f1f5f9", fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, outline:"none", width:"100%", boxSizing:"border-box" }} />
                <button onClick={() => adminPass==="admin123" ? setAdminUnlocked(true) : showToast("Wrong password",false)}
                  style={{ marginTop:12, width:"100%", padding:"10px", borderRadius:8, border:"none", background:"#f97316", color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, cursor:"pointer" }}>UNLOCK</button>
                <div style={{ fontSize:11, color:"#334155", marginTop:8 }}>Default: admin123 — change in code for production</div>
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                  {[...REGIONS, "Final Four"].map(r => (
                    <button key={r} onClick={() => setAdminRegion(r)} style={{ padding:"7px 16px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, background: adminRegion===r?"#f97316":"#1a2540", color: adminRegion===r?"#fff":"#94a3b8" }}>{r.toUpperCase()}</button>
                  ))}
                </div>
                {REGIONS.includes(adminRegion) && (
                  <div style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:20, overflowX:"auto", marginBottom:16 }}>
                    <BracketRegion region={adminRegion} bracket={adminBracket[adminRegion]} teams={DEFAULT_TEAMS[adminRegion]} onPick={pickAdmin} editable={true} />
                  </div>
                )}
                {adminRegion === "Final Four" && (
                  <div style={{ background:"#0d1626", border:"1px solid #1e2a4a", borderRadius:12, padding:20, marginBottom:16 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:"#f97316", marginBottom:12 }}>FINAL FOUR RESULTS</div>
                    <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                      {REGIONS.map((r, i) => {
                        const winner = getElite8Winner(adminBracket, i);
                        return <div key={r} style={{ background:"#070b14", borderRadius:8, padding:"10px 16px", minWidth:140 }}>
                          <div style={{ fontSize:10, color:"#64748b", fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}>{r.toUpperCase()} WINNER</div>
                          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color: winner?"#f1f5f9":"#334155", marginTop:4 }}>{winner||"Not set"}</div>
                        </div>;
                      })}
                    </div>
                    <div style={{ marginTop:12 }}>
                      <div style={{ fontSize:11, color:"#64748b", marginBottom:6, fontFamily:"'Barlow Condensed',sans-serif" }}>CHAMPION</div>
                      <input value={adminBracket.champion||""} onChange={e => setAdminBracket(p=>({...p,champion:e.target.value}))} placeholder="Champion team..."
                        style={{ padding:"8px 12px", borderRadius:8, border:"2px solid #f97316", background:"#0d1626", color:"#f97316", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, outline:"none", width:200 }} />
                    </div>
                  </div>
                )}
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <button onClick={saveActual} style={{ padding:"12px 32px", borderRadius:8, border:"none", background:"#16a34a", color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, letterSpacing:1, cursor:"pointer" }}>💾 SAVE & RECALCULATE SCORES</button>
                  <div style={{ fontSize:12, color:"#334155" }}>{entries.length} bracket{entries.length!==1?"s":""} will be rescored</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
