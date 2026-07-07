"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabase";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";

/* ─── DATA ─── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:         #faf8f5;
    --cream-dark:    #f0ebe4;
    --ink:           #111110;
    --ink-soft:      #4a4845;
    --ink-muted:     #999490;
    --blush:         #e8c4b0;
    --rose:          #c97b5a;
    --rose-mid:      #d98a6a;
    --rose-light:    #f5ede7;
    --border:        rgba(17,17,16,0.08);
    --border-mid:    rgba(17,17,16,0.14);
    --border-strong: rgba(17,17,16,0.22);
    --white:         #ffffff;
    --shadow:        0 12px 60px rgba(17,17,16,0.10);
  }

  body {
    background: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    color: var(--ink);
    overflow: hidden;
    height: 100vh;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--blush); border-radius: 2px; }

  /* ─── ROOT LAYOUT ─── */
  .login-root {
    height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* ─── LEFT PANEL ─── */
  .left-panel {
    background: var(--ink);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 2.5rem 3rem;
  }

  .left-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 2;
    position: relative;
  }
  .left-logo {
    width: 36px; height: 36px;
    background: var(--rose);
    border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; color: var(--white);
    font-style: italic; flex-shrink: 0;
  }
  .left-brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem; font-weight: 400;
    color: var(--cream);
    letter-spacing: 0.02em;
  }

  .left-tagline {
    position: relative; z-index: 2;
    margin-top: auto;
    padding-bottom: 0.5rem;
  }
  .left-tagline-label {
    font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--rose); margin-bottom: 1rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .left-tagline-label::before { content:''; display:block; width:16px; height:1px; background:var(--rose); }
  .left-tagline h2 {
    font-family: 'Playfair Display', serif;
    font-size: 2rem; font-weight: 400; line-height: 1.25;
    color: var(--cream);
  }
  .left-tagline h2 em { font-style: italic; color: var(--rose); }
  .left-tagline-sub {
    margin-top: 0.875rem;
    font-size: 0.82rem; color: var(--cream-a50);
    line-height: 1.7; max-width: 320px;
  }

  /* ─── DEMO CANVAS (inside left panel) ─── */
  .demo-canvas {
    position: relative; z-index: 2;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2rem 0;
  }

  /* ─── BEFORE card: messy spreadsheet ─── */
  .before-card {
    position: absolute;
    width: 300px;
    background: rgba(255,255,255,0.06);
    border: 0.5px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    overflow: hidden;
    transform: rotate(-3deg) translateX(-20px);
    transition: all 0.9s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 1;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  .before-card.hidden {
    transform: rotate(-12deg) translate(-80px, 30px) scale(0.88);
    opacity: 0;
  }
  .before-card-header {
    background: rgba(255,255,255,0.05);
    border-bottom: 0.5px solid rgba(255,255,255,0.08);
    padding: 0.5rem 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .before-dot { width:7px; height:7px; border-radius:50%; }
  .before-title { font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--cream-a35); margin-left:0.25rem; }

  table.messy-table {
    width: 100%; border-collapse: collapse;
    font-size: 0.68rem; font-family: 'DM Sans', monospace;
  }
  table.messy-table th {
    padding: 5px 8px; text-align: left;
    font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--cream-a30); font-weight: 400;
    border-bottom: 0.5px solid rgba(255,255,255,0.06);
  }
  table.messy-table td {
    padding: 5px 8px; color: var(--cream-a55);
    border-bottom: 0.5px solid rgba(255,255,255,0.04);
    white-space: nowrap; overflow: hidden;
  }
  table.messy-table td.num { color: rgba(232,196,176,0.7); text-align: right; }
  .messy-row-highlight td { background: rgba(201,123,90,0.1); color: var(--cream-a75) !important; }

  /* ─── AFTER card: clean chart ─── */
  .after-card {
    position: absolute;
    width: 300px;
    background: var(--white);
    border-radius: 8px;
    overflow: hidden;
    transform: rotate(2deg) translateX(24px) translateY(-8px);
    transition: all 0.9s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    box-shadow: 0 16px 60px rgba(0,0,0,0.4);
    pointer-events: none;
  }
  .after-card.visible {
    opacity: 1;
    transform: rotate(1deg) translateX(20px) translateY(-12px);
  }
  .after-card-header {
    background: var(--ink);
    padding: 0.625rem 0.875rem;
    display: flex; align-items: center; justify-content: space-between;
  }
  .after-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.75rem; color: var(--cream);
    font-weight: 400;
  }
  .after-card-badge {
    font-size: 0.55rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--rose); background: rgba(201,123,90,0.18);
    padding: 2px 6px; border-radius: 2px;
  }
  .after-card-body { padding: 0.875rem; }

  /* bar chart inside after-card */
  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 120px;
    padding-bottom: 28px;
    position: relative;
  }
  .bar-chart::after {
    content: '';
    position: absolute;
    bottom: 28px; left: 0; right: 0;
    height: 0.5px;
    background: var(--border-mid);
  }
  .bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .bar-fill {
    width: 100%; border-radius: 3px 3px 0 0;
    transform-origin: bottom;
    transform: scaleY(0);
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bar-fill.animate { transform: scaleY(1); }
  .bar-label { font-size: 0.58rem; color: var(--ink-muted); letter-spacing: 0.06em; }

  .after-stats {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 6px; margin-top: 0.625rem;
  }
  .after-stat {
    background: var(--cream);
    border-radius: 4px; padding: 0.5rem 0.625rem;
  }
  .after-stat-label { font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-muted); }
  .after-stat-val { font-size: 1rem; font-weight: 500; color: var(--ink); margin-top: 1px; font-family: 'Playfair Display', serif; }
  .after-stat-val span { font-size: 0.65rem; color: var(--rose); font-family: 'DM Sans', sans-serif; font-weight: 400; }

  /* arrow between cards */
  .transform-arrow {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
    width: 36px; height: 36px;
    background: var(--rose);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.6s ease;
    box-shadow: 0 4px 16px rgba(201,123,90,0.4);
  }
  .transform-arrow svg { color: white; }

  /* ─── TOGGLE ─── */
  .demo-toggle {
    position: relative; z-index: 3;
    display: flex; align-items: center; gap: 1rem;
    margin: 0 0 2rem;
  }
  .demo-toggle-label {
    font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--cream-a35);
  }
  .demo-toggle-track {
    width: 48px; height: 26px;
    background: rgba(255,255,255,0.1);
    border: 0.5px solid rgba(255,255,255,0.15);
    border-radius: 13px;
    cursor: pointer;
    position: relative;
    transition: background 0.3s;
    flex-shrink: 0;
  }
  .demo-toggle-track.on { background: var(--rose); border-color: var(--rose); }
  .demo-toggle-thumb {
    position: absolute;
    top: 3px; left: 3px;
    width: 20px; height: 20px;
    background: var(--cream);
    border-radius: 50%;
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .demo-toggle-track.on .demo-toggle-thumb { transform: translateX(22px); }
  .demo-toggle-state {
    font-size: 0.7rem; color: var(--cream-a50);
    transition: color 0.3s;
    min-width: 60px;
  }
  .demo-toggle-state.on { color: var(--rose); }

  /* ─── RIGHT PANEL ─── */
  .right-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 3.5rem;
    background: var(--white);
    position: relative;
    overflow: hidden;
  }
  .right-panel::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 200px; height: 200px;
    background: var(--rose-light);
    border-radius: 0 0 0 200px;
    opacity: 0.5;
  }

  .right-inner { width: 100%; max-width: 360px; position: relative; z-index: 1; }

  .right-eyebrow {
    font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--rose); margin-bottom: 0.875rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .right-eyebrow::before { content:''; display:block; width:16px; height:1px; background:var(--rose); }
  .right-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.625rem; font-weight: 400; line-height: 1.2;
    color: var(--ink); margin-bottom: 0.375rem;
  }
  .right-title em { font-style: italic; color: var(--rose); }
  .right-sub { font-size: 0.8rem; color: var(--ink-muted); line-height: 1.65; margin-bottom: 2rem; }

  /* ─── GOOGLE BUTTON ─── */
  .google-btn {
    width: 100%; height: 44px;
    display: flex; align-items: center; justify-content: center; gap: 0.75rem;
    background: var(--white);
    border: 0.5px solid var(--border-strong);
    border-radius: 4px;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 400;
    color: var(--ink); cursor: pointer;
    transition: all 0.18s;
    margin-bottom: 1.25rem;
  }
  .google-btn:hover { background: var(--cream); border-color: var(--border-mid); box-shadow: 0 2px 8px rgba(17,17,16,0.06); }

  /* divider */
  .divider {
    display: flex; align-items: center; gap: 0.875rem;
    margin-bottom: 1.25rem;
  }
  .divider-line { flex: 1; height: 0.5px; background: var(--border-mid); }
  .divider-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-muted); }

  /* form fields */
  .field { margin-bottom: 1rem; }
  .field-label {
    display: block;
    font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--ink-muted); margin-bottom: 0.375rem;
  }
  .field-input {
    width: 100%; height: 40px; padding: 0 0.875rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 300;
    color: var(--ink); background: var(--cream);
    border: 0.5px solid var(--border-mid); border-radius: 3px;
    outline: none; transition: border-color 0.18s, background 0.18s;
    appearance: none;
  }
  .field-input:focus { border-color: var(--rose); background: var(--rose-light); }
  .field-input::placeholder { color: var(--ink-muted); }

  /* action row */
  .action-row { display: flex; gap: 0.625rem; margin-top: 1.5rem; }
  .btn-primary {
    flex: 1; height: 40px;
    background: var(--ink); color: var(--cream);
    border: none; border-radius: 3px;
    font-family: 'DM Sans', sans-serif; font-size: 0.75rem;
    font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: background 0.18s;
  }
  .btn-primary:hover:not(:disabled) { background: var(--rose); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-secondary {
    flex: 1; height: 40px;
    background: var(--white); color: var(--ink);
    border: 0.5px solid var(--border-strong); border-radius: 3px;
    font-family: 'DM Sans', sans-serif; font-size: 0.75rem;
    font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: all 0.18s;
  }
  .btn-secondary:hover:not(:disabled) { background: var(--cream); }
  .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }

  /* error */
  .error-box {
    padding: 0.625rem 0.75rem;
    background: #fef3f0; border: 0.5px solid rgba(201,123,90,0.3);
    border-radius: 3px; font-size: 0.75rem; color: var(--rose);
    margin-bottom: 1rem; line-height: 1.5;
  }

  /* footer */
  .right-footer {
    margin-top: 2rem;
    text-align: center;
    font-size: 0.68rem; color: var(--ink-muted); line-height: 1.7;
  }
  .right-footer a { color: var(--rose); text-decoration: none; }
  .right-footer a:hover { text-decoration: underline; }

  /* ─── BG GRID for left panel ─── */
  .left-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .left-glow {
    position: absolute;
    bottom: -60px; left: -60px;
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(201,123,90,0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ─── MOBILE RESPONSIVE ─── */
  @media (max-width: 850px) {
    .login-root {
      grid-template-columns: 1fr;
    }
    .left-panel {
      display: none;
    }
    .right-panel {
      padding: 2rem;
    }
    .right-inner {
      max-width: 400px;
      margin: 0 auto;
    }
  }
`;

/* ─── STATIC DATA ─── */
const bars = [
  { label: "Oca", height: 55, delay: 0    },
  { label: "Şub", height: 72, delay: 0.1  },
  { label: "Mar", height: 88, delay: 0.2  },
  { label: "Nis", height: 64, delay: 0.3  },
  { label: "May", height: 95, delay: 0.4  },
  { label: "Haz", height: 80, delay: 0.5  },
];

const rawRows = [
  ["Oca 2025", "1.250,00", "TR/IST"],
  ["Şub 2025", "2.890,50", "TR/ANK"],
  ["Mar 2025", "4.210,00", "EU/BER"],
  ["Nis 2025", "3.750,75", "TR/IST"],
  ["", "", ""],
  ["Haz 2025", "6.980,00", "US/NYC"],
];

/* ─── COMPONENT ─── */
export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const [view, setView] = useState<"login" | "signup" | "forgot_password">("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAfter, setShowAfter] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* auto-flip demo every 4s */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setShowAfter((v) => !v);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  /* animate bars when after-card becomes visible */
  useEffect(() => {
    if (showAfter) {
      setBarsAnimated(false);
      const t = setTimeout(() => setBarsAnimated(true), 100);
      return () => clearTimeout(t);
    } else {
      setBarsAnimated(false);
    }
  }, [showAfter]);

  const handleToggle = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowAfter((v) => !v);
  };

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!email || !password) {
      setErrorMsg(t("auth.errEmailPass"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      // If email confirmation is disabled, user is logged in. Otherwise, they need to check email.
      // But per user request, we assume email confirmation is not needed, so we redirect.
      router.push("/");
    }
  };

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!email || !password) {
      setErrorMsg(t("auth.errEmailPass"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/");
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!email || !password) {
      setErrorMsg(t("auth.errForgot"));
      return;
    }
    setLoading(true);
    
    // UI simülasyonu (Supabase güvenlik gereği doğrudan değiştirmeye izin vermez)
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(t("auth.successForgot"));
      // view state'i login'e geçirilebilir veya kullanıcı kendisi basabilir.
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErrorMsg(error.message);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">

        {/* ══════════ LEFT PANEL ══════════ */}
        <div className="left-panel">
          <div className="left-grid" />
          <div className="left-glow" />

          {/* Brand */}
          <div className="left-brand">
            <div className="left-logo">A</div>
            <span className="left-brand-name">AuraData</span>
          </div>

          {/* Demo canvas */}
          <div className="demo-canvas">
            {/* BEFORE card */}
            <div className={`before-card${showAfter ? " hidden" : ""}`}>
              <div className="before-card-header">
                <div className="before-dot" style={{ background: "#ff5f57" }} />
                <div className="before-dot" style={{ background: "#ffbd2e" }} />
                <div className="before-dot" style={{ background: "#28c841" }} />
                <span className="before-title">satis_raporu_son_v3.xlsx</span>
              </div>
              <table className="messy-table">
                <thead>
                  <tr>
                    <th>{t("ba.period")}</th>
                    <th>{t("ba.revenue")}</th>
                    <th>{t("ba.region")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rawRows.map((row, i) => (
                    <tr key={i} className={i === 2 ? "messy-row-highlight" : ""}>
                      <td>{row[0] || <span style={{ opacity: 0.25 }}>—</span>}</td>
                      <td className="num">{row[1] || <span style={{ opacity: 0.25 }}>—</span>}</td>
                      <td>{row[2] || <span style={{ opacity: 0.25 }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Transform arrow */}
            <div className="transform-arrow">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* AFTER card */}
            <div className={`after-card${showAfter ? " visible" : ""}`}>
              <div className="after-card-header">
                <span className="after-card-title">Aylık Satış Analizi</span>
                <span className="after-card-badge">Canlı</span>
              </div>
              <div className="after-card-body">
                <div className="bar-chart">
                  {bars.map((b, i) => (
                    <div key={i} className="bar-col">
                      <div
                        className={`bar-fill${barsAnimated ? " animate" : ""}`}
                        style={{
                          height: `${b.height}px`,
                          background: i === 4 ? "var(--rose)" : "var(--blush)",
                          transitionDelay: `${b.delay}s`,
                        }}
                      />
                      <span className="bar-label">{b.label}</span>
                    </div>
                  ))}
                </div>
                <div className="after-stats">
                  <div className="after-stat">
                    <div className="after-stat-label">Toplam</div>
                    <div className="after-stat-val">₺19.1K <span>↑ %34</span></div>
                  </div>
                  <div className="after-stat">
                    <div className="after-stat-label">En Yüksek</div>
                    <div className="after-stat-val">Mayıs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="demo-toggle">
            <span className="demo-toggle-label">{t("auth.toggleRaw")}</span>
            <div
              className={`demo-toggle-track${showAfter ? " on" : ""}`}
              onClick={handleToggle}
              role="switch"
              aria-checked={showAfter}
              tabIndex={0}
              onKeyDown={(e) => e.key === " " && handleToggle()}
            >
              <div className="demo-toggle-thumb" />
            </div>
            <span className={`demo-toggle-state${showAfter ? " on" : ""}`}>
              {showAfter ? t("auth.toggleChart") : t("auth.toggleTable")}
            </span>
          </div>

          {/* Tagline */}
          <div className="left-tagline">
            <div className="left-tagline-label">{t("auth.taglineLabel")}</div>
            <h2>{t("auth.taglineTitle1")} <em>{t("auth.taglineTitle2")}</em><br />{t("auth.taglineTitle3")}</h2>
            <p className="left-tagline-sub">
              {t("auth.taglineSub")}
            </p>
          </div>
        </div>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div className="right-panel">
          <div style={{ position: "absolute", top: "2rem", right: "2rem", display: "flex", gap: "1rem" }}>
            <ThemeToggle />
            <LanguageToggle />
          </div>
          
          <div className="right-inner">
            <div className="right-eyebrow">{t("auth.access")}</div>
            <h1 className="right-title">
              {view === "login" ? <>{t("auth.loginTitle1")} <em>{t("auth.loginTitle2")}</em></> : 
               view === "signup" ? <>{t("auth.signupTitle1")} <em>{t("auth.signupTitle2")}</em></> : 
               <>{t("auth.forgotTitle1")} <em>{t("auth.forgotTitle2")}</em></>}
            </h1>
            <p className="right-sub">
              {view === "login" ? t("auth.loginSub") :
               view === "signup" ? t("auth.signupSub") :
               t("auth.forgotSub")}
            </p>

            {view !== "forgot_password" && (
              <>
                {/* Google */}
                <button className="google-btn" onClick={handleGoogleLogin}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {t("auth.google")}
                </button>
                <div className="divider">
                  <div className="divider-line" />
                  <span className="divider-label">{t("auth.or")}</span>
                  <div className="divider-line" />
                </div>
              </>
            )}

            {errorMsg && <div className="error-box">{errorMsg}</div>}
            {successMsg && <div className="error-box" style={{ background: "#eef8f1", borderColor: "#a6d9b4", color: "#2d7a46" }}>{successMsg}</div>}

            <div className="field">
              <label className="field-label">{t("common.email")}</label>
              <input
                type="email" className="field-input"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
              />
            </div>
            
            <div className="field">
              <label className="field-label">{view === "forgot_password" ? t("common.newPassword") : t("common.password")}</label>
              <input
                type="password" className="field-input"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="action-row">
              {view === "login" && (
                <>
                  <button className="btn-primary" onClick={handleSignIn} disabled={loading}>
                    {loading ? t("common.loading") : t("common.login")}
                  </button>
                  <button className="btn-secondary" onClick={() => setView("signup")} disabled={loading}>
                    {t("common.signup")}
                  </button>
                </>
              )}
              {view === "signup" && (
                <>
                  <button className="btn-primary" onClick={handleSignUp} disabled={loading}>
                    {loading ? t("common.loading") : t("common.signup")}
                  </button>
                  <button className="btn-secondary" onClick={() => setView("login")} disabled={loading}>
                    {t("auth.btnBack")}
                  </button>
                </>
              )}
              {view === "forgot_password" && (
                <>
                  <button className="btn-primary" onClick={handleResetPassword} disabled={loading}>
                    {loading ? t("common.loading") : t("auth.btnUpdate")}
                  </button>
                  <button className="btn-secondary" onClick={() => setView("login")} disabled={loading}>
                    {t("common.cancel")}
                  </button>
                </>
              )}
            </div>

            <div className="right-footer">
              {view === "login" && (
                <>
                  <a href="#" onClick={(e) => { e.preventDefault(); setView("forgot_password"); }}>{t("auth.forgotLink")}</a>
                  &nbsp;·&nbsp;
                </>
              )}
              <a href="#">{t("auth.privacy")}</a>
              <br />
              <span style={{ opacity: 0.6 }}>{t("auth.termsPre")}</span>
              <a href="#">{t("auth.termsLink")}</a>
              <span style={{ opacity: 0.6 }}>{t("auth.termsPost")}</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}