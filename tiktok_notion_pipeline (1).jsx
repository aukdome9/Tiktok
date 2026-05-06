import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "im_pipeline_config";

const SYSTEM_PROMPT = `You are the TikTok copy engine for Aukdom Ethnine (A.E.) — creator of The Invisible Monastery. You generate TikTok content that is spiritually grounded, direct, and built on Aukdom's proprietary worldview.

BRAND VOCABULARY (use 1-2 per post, naturally):
- Reality architect: person actively constructing their experience
- Dimensional walker: moving between states of consciousness deliberately
- Opulence mindset: abundance as the natural state, not something earned
- Divine incarnation: showing up fully human IS the sacred act
- Invisible Monastery: the internal sacred architecture a person carries
- First nature: who you were before conditioning
- Remembering not becoming: growth as recovery, not construction

VOICE RULES:
- Second person ("you") always
- Direct, grounded, spiritually sovereign
- Speak FROM the worldview, not about it
- Short sentences hit harder
- Never: "unlock your potential," "embark on a journey," "be the best version"
- Never generic self-help language

NICHE INTELLIGENCE:
- Hook must land in first 3 seconds
- Saves and shares outperform likes algorithmically
- Content that names something felt-but-unspoken drives saves
- Content that feels "made for someone I know" drives shares
- Speak from conviction, not persuasion

HOOK TYPES: Bold Claim, Reframe, Call-Out, Result Hook, Authority Statement

HASHTAG RULES:
- 4-6 hashtags max
- Always include 1 brand tag: #invisiblemonastery OR #dimensionalwalker OR #realityarchitect OR #opulencemindset
- Never: #fyp #foryou #foryoupage
- Niche tags: #abundancemindset #manifestation #divinelyfavored #spiritualgrowth #lawofattraction #consciousnessexpansion #selfmastery

OUTPUT: Respond ONLY with a valid JSON object. No preamble, no markdown, no backticks. Exactly this structure:
{
  "title": "6-10 word punchy title that stops the scroll",
  "description": "Full caption: hook sentence | 2-3 sentence core breakdown in Aukdom voice | 1-2 sentence transformation | ends open (no CTA — that's added separately)",
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
  "topic": "2-4 word theme label (e.g. Divine Protection, Abundance Alignment)",
  "hook_type": "one of: Bold Claim | Reframe | Call-Out | Result Hook | Authority Statement",
  "engagement_goal": "one of: Saves | Shares | Comments"
}`;

const TOPIC_SUGGESTIONS = [
  "Divine Protection", "Abundance Alignment", "Shadow Integration",
  "Opulence Mindset", "Reality Architecture", "Dimensional Walking",
  "Emotional Healing", "Manifestation", "Self-Mastery", "Stillness"
];

const TAG_COLOR = {
  "Make.com": "#5BA3D9", "Claude": "#C8922A", "Notion": "#8B8FA8"
};

export default function App() {
  const [config, setConfig] = useState({ webhookUrl: "" });
  const [showSetup, setShowSetup] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [source, setSource] = useState("");
  const [topic, setTopic] = useState("");
  const [step, setStep] = useState("input"); // input | generating | review | sending | done | error
  const [result, setResult] = useState(null);
  const [edited, setEdited] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [cta, setCta] = useState(false);
  const [ctaEmoji, setCtaEmoji] = useState("🏛️");
  const webhookRef = useRef("");

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r?.value) {
          const saved = JSON.parse(r.value);
          setConfig(saved);
          webhookRef.current = saved.webhookUrl || "";
        }
      } catch {}
    })();
  }, []);

  const saveConfig = async (url) => {
    const next = { webhookUrl: url };
    setConfig(next);
    webhookRef.current = url;
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setShowSetup(false);
  };

  const generate = async () => {
    if (!transcript.trim()) return;
    setStep("generating");
    setErrorMsg("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Generate TikTok copy for this transcript:\n\n${transcript}` }]
        })
      });
      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setEdited({ ...parsed, topic: topic || parsed.topic });
      setStep("review");
    } catch (e) {
      setErrorMsg("Generation failed. Check console or try again.");
      setStep("error");
    }
  };

  const sendToNotion = async () => {
    const url = webhookRef.current || config.webhookUrl;
    if (!url) { setShowSetup(true); return; }
    setStep("sending");
    const finalDesc = cta
      ? `${edited.description}\n\nComment ${ctaEmoji} to get a personal invitation to the Invisible Monastery community chat.`
      : edited.description;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: edited.title,
          description: finalDesc,
          hashtags: edited.hashtags,
          topic: edited.topic,
          hook_type: edited.hook_type,
          engagement_goal: edited.engagement_goal,
          source: source || "unspecified",
          submitted_at: new Date().toISOString()
        })
      });
      setStep("done");
    } catch {
      setErrorMsg("Webhook delivery failed. Check your Make.com URL.");
      setStep("error");
    }
  };

  const reset = () => {
    setTranscript(""); setSource(""); setTopic("");
    setResult(null); setEdited({}); setCta(false); setCtaEmoji("🏛️");
    setStep("input"); setErrorMsg("");
  };

  const s = (field, val) => setEdited(e => ({ ...e, [field]: val }));

  return (
    <div style={{ minHeight: "100vh", background: "#0C0C0E", color: "#C8C0B4", fontFamily: "Georgia, serif", padding: "0 0 80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        textarea, input { background: #111116; border: 1px solid #222228; color: #C8C0B4; font-family: Georgia, serif; font-size: 14px; border-radius: 4px; padding: 12px 14px; width: 100%; outline: none; resize: vertical; transition: border-color 0.15s; }
        textarea:focus, input:focus { border-color: #3A3020; }
        textarea::placeholder, input::placeholder { color: #383838; }
        .btn-primary { background: #1A1408; border: 1px solid #6B4F1A; color: #C8922A; font-family: Georgia, serif; font-size: 13px; padding: 11px 24px; border-radius: 3px; cursor: pointer; letter-spacing: 0.06em; transition: all 0.15s; width: 100%; }
        .btn-primary:hover { background: #241C0A; border-color: #C8922A; }
        .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
        .btn-ghost { background: none; border: 1px solid #222228; color: #555; font-family: Georgia, serif; font-size: 12px; padding: 8px 16px; border-radius: 3px; cursor: pointer; transition: all 0.15s; letter-spacing: 0.05em; }
        .btn-ghost:hover { border-color: #444; color: #888; }
        .btn-green { background: #0A1A0F; border: 1px solid #1A5C30; color: #3DBF7A; font-family: Georgia, serif; font-size: 13px; padding: 11px 24px; border-radius: 3px; cursor: pointer; letter-spacing: 0.06em; transition: all 0.15s; width: 100%; }
        .btn-green:hover { background: #0F2418; border-color: #3DBF7A; }
        .field-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #4A4A52; margin-bottom: 6px; display: block; }
        .field-wrap { margin-bottom: 20px; }
        .tag-pill { display: inline-block; font-size: 10px; padding: 3px 9px; border-radius: 2px; font-family: monospace; letter-spacing: 0.05em; margin-right: 5px; }
        .divider { height: 1px; background: #16161A; margin: 28px 0; }
        .chip { display: inline-block; font-size: 11px; padding: 3px 10px; border-radius: 12px; border: 1px solid #222228; color: #555; cursor: pointer; margin: 3px; transition: all 0.15s; font-family: Georgia, serif; }
        .chip:hover { border-color: #444; color: #888; }
        .chip.active { border-color: #6B4F1A; color: #C8922A; background: #1A1408; }
        .emoji-btn { background: none; border: 1px solid #222228; font-size: 18px; padding: 6px 10px; border-radius: 3px; cursor: pointer; transition: all 0.12s; }
        .emoji-btn.active { border-color: #6B4F1A; background: #1A1408; }
        .setup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
        .setup-box { background: #111116; border: 1px solid #222228; border-radius: 6px; padding: 32px; width: 100%; max-width: 480px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulsing { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        .slide-up { animation: slideUp 0.35s ease; }
      `}</style>

      {/* Setup overlay */}
      {showSetup && (
        <div className="setup-overlay">
          <div className="setup-box slide-up">
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: "0.18em", color: "#555", textTransform: "uppercase", marginBottom: 8 }}>One-time setup</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 400, color: "#E8E0D4", margin: "0 0 6px" }}>Make.com Webhook URL</h2>
            <p style={{ fontSize: 13, color: "#555", margin: "0 0 24px", lineHeight: 1.6, fontStyle: "italic" }}>
              In Make.com: New scenario → Custom Webhook module → Copy the webhook URL and paste it here. This is saved locally.
            </p>
            <SetupInput onSave={saveConfig} onCancel={() => setShowSetup(false)} initial={config.webhookUrl} />
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid #16161A", padding: "28px 32px 22px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 10, letterSpacing: "0.22em", color: "#3A3A42", textTransform: "uppercase", margin: "0 0 4px" }}>
              The Invisible Monastery
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, color: "#E8E0D4", margin: 0, letterSpacing: "0.02em" }}>
              TikTok → Notion Pipeline
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["Make.com", "Claude", "Notion"].map(t => (
              <span key={t} className="tag-pill" style={{ background: "transparent", border: `1px solid ${TAG_COLOR[t]}22`, color: TAG_COLOR[t] }}>{t}</span>
            ))}
            <button className="btn-ghost" style={{ marginLeft: 4 }} onClick={() => setShowSetup(true)}>⚙ setup</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 32px 0" }}>

        {/* STEP: INPUT */}
        {(step === "input" || step === "error") && (
          <div className="slide-up">
            <div className="field-wrap">
              <label className="field-label">Transcript or clip notes</label>
              <textarea
                rows={9}
                placeholder="Paste the transcript here. Can be raw speech, rough notes, or a full clip breakdown..."
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div className="field-wrap" style={{ flex: 1 }}>
                <label className="field-label">Source clip (optional)</label>
                <input placeholder="e.g. Portrait clip 04, Riverside recording..." value={source} onChange={e => setSource(e.target.value)} />
              </div>
              <div className="field-wrap" style={{ flex: 1 }}>
                <label className="field-label">Topic override (optional)</label>
                <input placeholder="Auto-detected if blank..." value={topic} onChange={e => setTopic(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="field-label" style={{ marginBottom: 8, display: "block" }}>Topic suggestions</label>
              <div>
                {TOPIC_SUGGESTIONS.map(t => (
                  <span key={t} className={`chip ${topic === t ? "active" : ""}`} onClick={() => setTopic(t === topic ? "" : t)}>{t}</span>
                ))}
              </div>
            </div>

            {step === "error" && (
              <p style={{ fontSize: 13, color: "#A32D2D", marginBottom: 16, fontStyle: "italic" }}>✕ {errorMsg}</p>
            )}

            <button className="btn-primary" disabled={!transcript.trim()} onClick={generate}>
              Generate copy →
            </button>

            {!config.webhookUrl && (
              <p style={{ fontSize: 12, color: "#3A3A42", marginTop: 14, textAlign: "center", fontStyle: "italic" }}>
                ⚠ No webhook URL saved yet —{" "}
                <span style={{ color: "#6B4F1A", cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowSetup(true)}>add it in setup</span>
                {" "}before sending to Notion.
              </p>
            )}
          </div>
        )}

        {/* STEP: GENERATING */}
        {step === "generating" && (
          <div className="pulsing" style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 20, color: "#4A4A52" }}>
              Generating copy...
            </p>
            <p style={{ fontSize: 12, color: "#333", marginTop: 8 }}>Running niche calibration + brand alignment</p>
          </div>
        )}

        {/* STEP: REVIEW */}
        {step === "review" && edited && (
          <div className="slide-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: "0.18em", color: "#555", textTransform: "uppercase", margin: "0 0 4px" }}>Review + edit</p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, color: "#E8E0D4", margin: 0 }}>Copy ready</h2>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#555", padding: "4px 10px", border: "1px solid #222228", borderRadius: 3 }}>
                  {edited.hook_type}
                </span>
                <span style={{ fontSize: 11, color: "#555", padding: "4px 10px", border: "1px solid #222228", borderRadius: 3 }}>
                  {edited.engagement_goal}
                </span>
              </div>
            </div>

            <div className="field-wrap">
              <label className="field-label">Title</label>
              <input value={edited.title || ""} onChange={e => s("title", e.target.value)} />
            </div>

            <div className="field-wrap">
              <label className="field-label">Description</label>
              <textarea rows={6} value={edited.description || ""} onChange={e => s("description", e.target.value)} />
            </div>

            <div className="field-wrap">
              <label className="field-label">Hashtags</label>
              <input value={edited.hashtags || ""} onChange={e => s("hashtags", e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div className="field-wrap" style={{ flex: 1 }}>
                <label className="field-label">Topic</label>
                <input value={edited.topic || ""} onChange={e => s("topic", e.target.value)} />
              </div>
            </div>

            <div className="divider" />

            {/* CTA toggle */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <label className="field-label" style={{ margin: 0 }}>Add community CTA?</label>
                <button
                  onClick={() => setCta(c => !c)}
                  style={{
                    background: cta ? "#1A1408" : "none",
                    border: `1px solid ${cta ? "#C8922A" : "#222228"}`,
                    color: cta ? "#C8922A" : "#555",
                    fontFamily: "Georgia, serif", fontSize: 12, padding: "5px 14px",
                    borderRadius: 3, cursor: "pointer", transition: "all 0.15s"
                  }}>
                  {cta ? "yes" : "no"}
                </button>
              </div>
              {cta && (
                <div className="slide-up">
                  <p style={{ fontSize: 12, color: "#555", marginBottom: 10, fontStyle: "italic" }}>
                    "Comment [emoji] to get a personal invitation to the Invisible Monastery community chat."
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["🏛️", "🔥", "🌙", "⚡", "💎", "🌿"].map(e => (
                      <button key={e} className={`emoji-btn ${ctaEmoji === e ? "active" : ""}`} onClick={() => setCtaEmoji(e)}>{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="btn-green" onClick={sendToNotion}>
              Send to Notion via Make.com →
            </button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button className="btn-ghost" onClick={reset}>start over</button>
            </div>
          </div>
        )}

        {/* STEP: SENDING */}
        {step === "sending" && (
          <div className="pulsing" style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 20, color: "#4A4A52" }}>
              Sending to Make.com...
            </p>
            <p style={{ fontSize: 12, color: "#333", marginTop: 8 }}>Webhook firing → Notion record incoming</p>
          </div>
        )}

        {/* STEP: DONE */}
        {step === "done" && (
          <div className="slide-up" style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: "0.18em", color: "#1A6B4A", textTransform: "uppercase", marginBottom: 16 }}>
              ✓ Delivered
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "#E8E0D4", margin: "0 0 10px" }}>
              "{edited.title}"
            </h2>
            <p style={{ fontSize: 13, color: "#555", margin: "0 0 8px", fontStyle: "italic" }}>
              Topic: {edited.topic} · {edited.engagement_goal} · {edited.hook_type}
            </p>
            <p style={{ fontSize: 12, color: "#3A3A42", marginBottom: 40 }}>
              Make.com received the payload — Notion record is being created with the next open posting slot.
            </p>
            <button className="btn-primary" onClick={reset} style={{ maxWidth: 220, margin: "0 auto", display: "block" }}>
              New clip →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SetupInput({ onSave, onCancel, initial }) {
  const [val, setVal] = useState(initial || "");
  return (
    <>
      <input
        placeholder="https://hook.make.com/..."
        value={val}
        onChange={e => setVal(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="btn-primary"
          style={{ flex: 1 }}
          disabled={!val.trim()}
          onClick={() => onSave(val.trim())}
        >
          Save webhook URL
        </button>
        <button className="btn-ghost" onClick={onCancel}>cancel</button>
      </div>
    </>
  );
}
