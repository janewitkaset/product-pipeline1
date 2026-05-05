"use client";
import { useState, useRef } from "react";

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const BG_THEMES = [
  { id: "studio_dark",    label: "Studio Dark",     emoji: "🖤", color: "#111",                              prompt: "Pure black studio background, dramatic professional lighting, luxury brand aesthetic, deep shadows" },
  { id: "sunset",         label: "Sunset Gradient",  emoji: "🌅", color: "linear-gradient(135deg,#ff6b35,#f7c59f)", prompt: "Warm sunset gradient background, orange to pink coral tones, soft ethereal lighting, golden hour mood" },
  { id: "neon",           label: "Neon Cyber",       emoji: "⚡", color: "linear-gradient(135deg,#0f0c29,#302b63)", prompt: "Cyberpunk neon background, deep purple and electric blue glowing lights, futuristic aesthetic" },
  { id: "nature",         label: "Nature Fresh",     emoji: "🌿", color: "linear-gradient(135deg,#134e5e,#71b280)", prompt: "Fresh nature background, lush green botanical leaves, natural daylight, organic aesthetic" },
  { id: "marble",         label: "Marble Luxury",    emoji: "💎", color: "linear-gradient(135deg,#e8e0d8,#c9b99a)", prompt: "White marble texture background, elegant gold accents, luxury high-end product photography" },
  { id: "pastel",         label: "Pastel Soft",      emoji: "🌸", color: "linear-gradient(135deg,#ffecd2,#fcb69f)", prompt: "Soft pastel background, blush pink and peach tones, dreamy bokeh, Instagram aesthetic" },
  { id: "ocean",          label: "Midnight Ocean",   emoji: "🌊", color: "linear-gradient(135deg,#0f2027,#2c5364)", prompt: "Deep midnight ocean blue background, cool teal accents, mysterious atmosphere, premium brand" },
  { id: "custom",         label: "กำหนดเอง",          emoji: "✏️", color: "#1a1a2e",                           prompt: "" },
];

function Step({ num, title, sub, status, log, children }) {
  const c = { idle: "#222", running: "#f59e0b", done: "#10b981", error: "#ef4444" }[status] || "#222";
  return (
    <div style={{ border: `1px solid ${c}`, borderRadius: 12, padding: "16px 20px", marginBottom: 10, background: "#0c0c0c", position: "relative", overflow: "hidden" }}>
      {status === "running" && (
        <div style={{ position: "absolute", top: 0, left: "-100%", width: "200%", height: 2, background: "linear-gradient(90deg,transparent,#f59e0b,transparent)", animation: "scan 1.4s linear infinite" }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: log || children ? 12 : 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c, flexShrink: 0, background: status === "done" ? "rgba(16,185,129,0.1)" : "transparent" }}>
          {status === "done" ? "✓" : status === "error" ? "!" : status === "running" ? "◌" : num}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5" }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${c}22`, color: c, fontFamily: "monospace", letterSpacing: "0.06em" }}>
          {status === "idle" ? "WAIT" : status === "running" ? "RUNNING" : status === "done" ? "DONE" : "ERROR"}
        </div>
      </div>
      {log && (
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#5a6a7a", background: "#070707", borderRadius: 8, padding: "10px 14px", lineHeight: 1.75, whiteSpace: "pre-wrap", maxHeight: 130, overflowY: "auto", border: "1px solid #181818" }}>
          {log}
        </div>
      )}
      {children}
    </div>
  );
}

export default function Home() {
  const [img, setImg]           = useState(null);
  const [imgB64, setImgB64]     = useState(null);
  const [imgType, setImgType]   = useState("image/jpeg");
  const [productDesc, setProductDesc] = useState("");
  const [bgTheme, setBgTheme]   = useState("studio_dark");
  const [customBg, setCustomBg] = useState("");
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const [err, setErr]           = useState("");
  const [steps, setSteps]       = useState({ script: "idle", image: "idle", voice: "idle" });
  const [logs, setLogs]         = useState({});
  const [results, setResults]   = useState({});
  const [genImg, setGenImg]     = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const fileRef = useRef();

  const setStep = (k, v) => setSteps(p => ({ ...p, [k]: v }));
  const setLog  = (k, v) => setLogs(p => ({ ...p, [k]: v }));
  const addLog  = (k, v) => setLogs(p => ({ ...p, [k]: (p[k] || "") + v }));

  const loadImg = async (file) => {
    setImg(URL.createObjectURL(file));
    setImgType(file.type || "image/jpeg");
    setImgB64(await toBase64(file));
  };

  const getTheme = () => {
    if (bgTheme === "custom") return { label: "Custom", prompt: customBg || "Clean neutral background, professional product photography" };
    const t = BG_THEMES.find(t => t.id === bgTheme);
    return { label: t?.label || "", prompt: t?.prompt || "" };
  };

  const run = async () => {
    if (!imgB64) return;
    setRunning(true); setDone(false); setErr("");
    setGenImg(null); setAudioUrl(null);
    setSteps({ script: "idle", image: "idle", voice: "idle" });
    setLogs({});
    const theme = getTheme();

    try {
      // ── STEP 1: Gemini คิด Script ──────────────────────────────────────────
      setStep("script", "running");
      setLog("script", "Gemini กำลังวิเคราะห์สินค้าและเขียน script...\n");

      const scriptRes = await fetch("/api/gemini-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgB64,
          imageType: imgType,
          productDesc,
          bgThemePrompt: theme.prompt,
          bgThemeLabel: theme.label,
        }),
      });
      const scriptData = await scriptRes.json();
      if (!scriptData.ok) throw new Error("Script: " + scriptData.error);

      const p = scriptData.data;
      setResults(r => ({ ...r, script: p }));
      setLog("script",
        `✓ สินค้า: ${p.product_name}\n` +
        `✓ ประเภท: ${p.product_type}\n` +
        `✓ Tagline: ${p.tagline}\n` +
        `✓ จุดเด่น: ${p.key_benefits?.join(", ")}\n` +
        `✓ Script: ${p.script?.slice(0, 70)}...`
      );
      setStep("script", "done");

      // ── STEP 2 & 3: ภาพ + เสียง พร้อมกัน (parallel) ──────────────────────
      setStep("image", "running");
      setStep("voice", "running");
      setLog("image", "Gemini กำลังสร้างภาพฉากหลัง...\n");
      setLog("voice", "ElevenLabs กำลังสร้างเสียง voiceover...\n");

      const [imageResult, voiceResult] = await Promise.allSettled([
        // Gemini Image
        fetch("/api/gemini-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: p.image_prompt }),
        }).then(r => r.json()),

        // ElevenLabs Voice
        fetch("/api/elevenlabs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script: p.script }),
        }).then(r => r.json()),
      ]);

      // ── ผล Image ──
      if (imageResult.status === "fulfilled" && imageResult.value.ok) {
        const d = imageResult.value;
        const url = `data:${d.mimeType};base64,${d.imageBase64}`;
        setGenImg(url);
        addLog("image", `✓ สร้างภาพสำเร็จ · Theme: ${theme.label}`);
        setStep("image", "done");
      } else {
        const msg = imageResult.reason?.message || imageResult.value?.error || "Unknown error";
        addLog("image", `❌ ${msg}`);
        setStep("image", "error");
      }

      // ── ผล Voice ──
      if (voiceResult.status === "fulfilled" && voiceResult.value.ok) {
        const d = voiceResult.value;
        const blob = new Blob(
          [Uint8Array.from(atob(d.audioBase64), c => c.charCodeAt(0))],
          { type: "audio/mpeg" }
        );
        setAudioUrl(URL.createObjectURL(blob));
        addLog("voice", `✓ สร้างเสียงสำเร็จ · Script: "${p.script?.slice(0, 50)}..."`);
        setStep("voice", "done");
      } else {
        const msg = voiceResult.reason?.message || voiceResult.value?.error || "Unknown error";
        addLog("voice", `❌ ${msg}`);
        setStep("voice", "error");
      }

      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setImg(null); setImgB64(null); setRunning(false); setDone(false);
    setErr(""); setGenImg(null); setAudioUrl(null); setResults({});
    setSteps({ script: "idle", image: "idle", voice: "idle" });
    setLogs({}); setProductDesc("");
  };

  const anyStarted = Object.values(steps).some(s => s !== "idle");
  const themeObj   = BG_THEMES.find(t => t.id === bgTheme);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; font-family: 'Outfit', sans-serif; color: #e5e5e5; }
        @keyframes scan    { 0%   { left: -100% } 100% { left: 100% } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes glow    { 0%,100% { box-shadow: 0 0 20px #f59e0b33 } 50% { box-shadow: 0 0 40px #f59e0b66 } }
        textarea:focus { outline: none; border-color: #f59e0b !important; }
        ::-webkit-scrollbar { width: 3px } ::-webkit-scrollbar-thumb { background: #2a2a2a }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080808", padding: "28px 18px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 32, animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", animation: "glow 2s infinite" }} />
              <span style={{ fontSize: 10, color: "#f59e0b", letterSpacing: "0.2em", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>
                AI VIDEO PIPELINE — GEMINI POWERED
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Product Clip<br /><span style={{ color: "#f59e0b" }}>Generator</span>
            </h1>
            <p style={{ marginTop: 10, fontSize: 12, color: "#444", lineHeight: 1.8, fontFamily: "'DM Mono',monospace" }}>
              รูปสินค้า → Gemini Script+ภาพ (parallel) + ElevenLabs เสียง
            </p>
          </div>

          {/* Pipeline Flow */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 28, gap: 0 }}>
            {[
              ["script", "🤖", "Gemini\nScript"],
              ["image",  "🖼️", "Gemini\nImage"],
              ["voice",  "🎙️", "ElevenLabs\nVoice"],
            ].map(([k, icon, label], i) => {
              const st = steps[k];
              const dot = st === "done" ? "#10b981" : st === "running" ? "#f59e0b" : st === "error" ? "#ef4444" : "#2a2a2a";
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ textAlign: "center", padding: "0 8px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: st === "done" ? "#10b981" : st === "running" ? "#f59e0b22" : "#111", border: `1.5px solid ${dot}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, margin: "0 auto 4px", transition: "all 0.3s" }}>
                      {st === "done" ? "✓" : icon}
                    </div>
                    <div style={{ fontSize: 9, color: dot, fontFamily: "'DM Mono',monospace", whiteSpace: "pre", textAlign: "center", lineHeight: 1.4 }}>{label}</div>
                  </div>
                  {i < 2 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: 24, height: 1, background: "#1a1a1a" }} />
                      {i === 1 && <div style={{ fontSize: 8, color: "#333", fontFamily: "monospace", whiteSpace: "nowrap" }}>parallel</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 8 }}>01 — อัปโหลดรูปสินค้า</label>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); e.dataTransfer?.files?.[0] && loadImg(e.dataTransfer.files[0]); }}
              onClick={() => !img && fileRef.current?.click()}
              style={{ border: `1.5px dashed ${img ? "#10b981" : "#222"}`, borderRadius: 12, padding: img ? 14 : 36, background: img ? "rgba(16,185,129,0.04)" : "#0d0d0d", cursor: img ? "default" : "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.3s" }}
            >
              {img ? (
                <>
                  <img src={img} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #1f1f1f" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>✓ รูปสินค้าพร้อมแล้ว</div>
                    <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>Gemini จะวิเคราะห์รูปนี้</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); reset(); }} style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>✕</button>
                </>
              ) : (
                <div style={{ width: "100%", textAlign: "center" }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 13, color: "#555" }}>วางรูปสินค้าหรือคลิกเพื่อเลือก</div>
                  <div style={{ fontSize: 11, color: "#2a2a2a", marginTop: 4 }}>JPG, PNG, WEBP</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && loadImg(e.target.files[0])} />
          </div>

          {/* Product Desc */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 8 }}>
              02 — รายละเอียดสินค้า <span style={{ color: "#2a2a2a" }}>(ไม่บังคับ)</span>
            </label>
            <textarea
              value={productDesc}
              onChange={e => setProductDesc(e.target.value)}
              placeholder="เช่น: ครีมบำรุงผิว สูตรอ่อนโยน ราคา 390 บาท กลุ่มเป้าหมายผู้หญิงอายุ 25-40 ปี..."
              rows={3}
              style={{ width: "100%", padding: "12px 14px", background: "#0d0d0d", border: "1px solid #222", borderRadius: 10, color: "#e5e5e5", fontSize: 13, fontFamily: "'Outfit',sans-serif", lineHeight: 1.7, resize: "vertical", transition: "border-color 0.2s" }}
            />
          </div>

          {/* BG Theme */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 8 }}>03 — Background Theme</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(118px,1fr))", gap: 8 }}>
              {BG_THEMES.map(t => (
                <div key={t.id} onClick={() => setBgTheme(t.id)}
                  style={{ border: `1.5px solid ${bgTheme === t.id ? "#f59e0b" : "#1f1f1f"}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", background: bgTheme === t.id ? "rgba(245,158,11,0.06)" : "#0d0d0d", transition: "all 0.2s" }}>
                  <div style={{ height: 28, borderRadius: 6, marginBottom: 7, background: t.color, border: "1px solid #ffffff10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{t.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: bgTheme === t.id ? "#f59e0b" : "#bbb" }}>{t.label}</div>
                </div>
              ))}
            </div>
            {bgTheme === "custom" && (
              <textarea value={customBg} onChange={e => setCustomBg(e.target.value)}
                placeholder="บรรยาย background เช่น: พื้นขาว มีดอกไม้ แสงธรรมชาติ..."
                rows={2}
                style={{ width: "100%", marginTop: 8, padding: "10px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#e5e5e5", fontSize: 12, fontFamily: "'DM Mono',monospace", lineHeight: 1.7, resize: "vertical", outline: "none" }} />
            )}
          </div>

          {/* Run Button */}
          {img && !done && (
            <button onClick={run} disabled={running}
              style={{ width: "100%", padding: "14px 24px", marginBottom: 22, background: running ? "#111" : "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 12, color: running ? "#444" : "#000", fontSize: 14, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", letterSpacing: "0.04em", transition: "all 0.3s", animation: running ? "none" : "glow 2.5s infinite" }}>
              {running ? "⏳ Gemini กำลังทำงาน..." : "🚀 เริ่ม Pipeline"}
            </button>
          )}

          {/* Steps */}
          {anyStarted && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <Step num="1" title="Gemini AI — Script" sub="วิเคราะห์รูปสินค้า + เขียน script + ออกแบบ prompt" status={steps.script} log={logs.script}>
                {results.script && steps.script === "done" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    {[["สินค้า", results.script.product_name], ["Tagline", results.script.tagline]].map(([k, v]) => (
                      <div key={k} style={{ background: "#070707", border: "1px solid #181818", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 9, color: "#444", marginBottom: 2, fontFamily: "monospace" }}>{k}</div>
                        <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Step>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Step num="2" title="Gemini Image" sub={`ฉาก: ${themeObj?.label}`} status={steps.image} log={logs.image}>
                  {genImg && (
                    <div style={{ marginTop: 10 }}>
                      <img src={genImg} alt="generated" style={{ width: "100%", borderRadius: 8, border: "1px solid #222", maxHeight: 180, objectFit: "cover" }} />
                      <a href={genImg} download="scene_background.png" style={{ display: "inline-block", marginTop: 6, fontSize: 11, color: "#10b981", fontFamily: "monospace", textDecoration: "none" }}>⬇ scene_background.png</a>
                    </div>
                  )}
                </Step>

                <Step num="3" title="ElevenLabs" sub="เสียง voiceover ไทย" status={steps.voice} log={logs.voice}>
                  {audioUrl && (
                    <div style={{ marginTop: 10 }}>
                      <audio controls src={audioUrl} style={{ width: "100%" }} />
                      <a href={audioUrl} download="voiceover.mp3" style={{ display: "inline-block", marginTop: 6, fontSize: 11, color: "#10b981", fontFamily: "monospace", textDecoration: "none" }}>⬇ voiceover.mp3</a>
                    </div>
                  )}
                </Step>
              </div>
            </div>
          )}

          {/* Done */}
          {done && (
            <div style={{ marginTop: 12, animation: "fadeUp 0.4s ease" }}>
              <div style={{ border: "1px solid #10b981", borderRadius: 12, padding: "18px 22px", background: "rgba(16,185,129,0.04)", marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#10b981", marginBottom: 4 }}>✓ Pipeline เสร็จสมบูรณ์</div>
                <div style={{ fontSize: 12, color: "#555", fontFamily: "monospace" }}>{results.script?.product_name} · {themeObj?.label}</div>
              </div>

              {results.script?.script && (
                <div style={{ border: "1px solid #1f1f1f", borderRadius: 12, padding: "14px 18px", background: "#0a0a0a", marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "monospace" }}>SCRIPT</div>
                  <div style={{ fontSize: 13, color: "#e5e5e5", lineHeight: 1.8, fontStyle: "italic" }}>"{results.script.script}"</div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "#f59e0b", fontFamily: "monospace" }}>— {results.script.tagline}</div>
                </div>
              )}

              <div style={{ border: "1px solid #1f1f1f", borderRadius: 12, padding: "14px 18px", background: "#0a0a0a", marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 10, fontWeight: 700 }}>ขั้นตอนต่อไป — HeyGen</div>
                {[
                  ["อัปโหลด scene_background.png", "เป็นภาพพื้นหลัง"],
                  ["อัปโหลด voiceover.mp3", "เป็นเสียงพากย์"],
                  ["เพิ่ม subtitle", results.script?.script?.slice(0, 40) + "..."],
                  ["Export วิดีโอ", "พร้อม publish 🎉"],
                ].map(([t, d], i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>{t}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 1, fontFamily: "monospace" }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={reset} style={{ width: "100%", padding: "11px", background: "transparent", border: "1px solid #1f1f1f", borderRadius: 10, color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>
                สร้างคลิปใหม่
              </button>
            </div>
          )}

          {err && (
            <div style={{ border: "1px solid #ef4444", borderRadius: 10, padding: "12px 16px", background: "rgba(239,68,68,0.05)", color: "#ef4444", fontSize: 12, fontFamily: "monospace", marginTop: 14 }}>
              ❌ {err}
            </div>
          )}

          <div style={{ marginTop: 36, fontSize: 9, color: "#1a1a1a", textAlign: "center", letterSpacing: "0.15em", fontFamily: "monospace" }}>
            GEMINI · ELEVENLABS · HEYGEN PIPELINE
          </div>
        </div>
      </div>
    </>
  );
}
