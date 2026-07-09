"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "./utils/supabase";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

import ThemeToggle from "./components/ThemeToggle";
import LanguageToggle from "./components/LanguageToggle";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  html { scroll-behavior: smooth; }

  :root {
    --cream: #faf8f5;
    --ink: #111110;
    --ink-soft: #4a4845;
    --ink-muted: #999490;
    --blush: #e8c4b0;
    --rose: #c97b5a;
    --border: rgba(17,17,16,0.1);
    --border-strong: rgba(17,17,16,0.2);
  }

  body { background: var(--cream); }

  .aura-root {
    min-height: 100vh;
    background: var(--cream);
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    overflow-x: hidden;
  }

  /* NAV */
  .nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 3rem;
    background: var(--nav-bg);
    backdrop-filter: blur(16px);
    border-bottom: 0.5px solid var(--border);
  }
  .nav-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem;
    letter-spacing: 0.08em;
    color: var(--ink);
    text-transform: uppercase;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    list-style: none;
  }
  .nav-links a {
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--ink-soft);
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--ink); }
  .nav-btn {
    background: var(--ink);
    color: var(--cream);
    border: none;
    padding: 0.6rem 1.4rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 2px;
    transition: background 0.2s, transform 0.1s;
  }
  .nav-btn:hover { background: var(--rose); transform: translateY(-1px); }

  /* User menu */
  .user-menu { position: relative; display: flex; align-items: center; gap: 1rem; }
  .user-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--cream-dark, #f0ebe4); border: 0.5px solid var(--border-mid, rgba(17,17,16,0.14));
    cursor: pointer; overflow: hidden; font-size: 0.85rem;
    font-weight: 500; color: var(--ink-soft); transition: border-color 0.18s;
  }
  .user-avatar:hover { border-color: var(--rose); }
  .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .user-dropdown {
    position: absolute; top: calc(100% + 10px); right: 0;
    background: var(--cream); border: 0.5px solid var(--border-mid, rgba(17,17,16,0.14));
    border-radius: 4px; min-width: 200px;
    box-shadow: 0 8px 24px rgba(17,17,16,0.08);
    z-index: 50; overflow: hidden;
  }
  .user-dropdown-header {
    padding: 1rem; border-bottom: 0.5px solid var(--border);
  }
  .user-dropdown-name { font-size: 0.85rem; font-weight: 500; color: var(--ink); }
  .user-dropdown-email { font-size: 0.75rem; color: var(--ink-muted); margin-top: 2px; }
  .user-dropdown-item {
    display: flex; align-items: center; gap: 0.625rem;
    padding: 0.75rem 1rem; font-size: 0.8rem; color: var(--ink-soft);
    cursor: pointer; transition: background 0.15s; border: none;
    background: none; width: 100%; text-align: left;
  }
  .user-dropdown-item:hover { background: var(--cream); color: var(--ink); }
  .user-dropdown-item.danger:hover { background: #fef3f0; color: var(--rose); }

  /* HERO */
  .hero {
    padding: 160px 3rem 120px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    max-width: 1300px;
    margin: 0 auto;
  }
  .hero-left { padding-right: 2rem; }
  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--rose);
    margin-bottom: 2rem;
    opacity: 0;
    animation: fadeUp 0.7s 0.1s forwards;
  }
  .hero-eyebrow::before {
    content: '';
    display: block;
    width: 32px;
    height: 1px;
    background: var(--rose);
  }
  .hero-h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.8rem, 5vw, 4.2rem);
    line-height: 1.15;
    font-weight: 400;
    letter-spacing: -0.01em;
    margin-bottom: 1.75rem;
    opacity: 0;
    animation: fadeUp 0.7s 0.25s forwards;
  }
  .hero-h1 em {
    font-style: italic;
    color: var(--rose);
  }
  .hero-p {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--ink-soft);
    max-width: 460px;
    margin-bottom: 2.5rem;
    opacity: 0;
    animation: fadeUp 0.7s 0.4s forwards;
  }
  .hero-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    opacity: 0;
    animation: fadeUp 0.7s 0.55s forwards;
  }
  .btn-primary {
    background: var(--ink);
    color: var(--cream);
    border: 1px solid var(--ink);
    padding: 0.85rem 2rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.25s;
    font-weight: 400;
  }
  .btn-primary:hover { background: var(--rose); border-color: var(--rose); transform: translateY(-2px); }
  .btn-secondary {
    background: transparent;
    color: var(--ink);
    border: 1px solid var(--border-strong);
    padding: 0.85rem 2rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.25s;
    font-weight: 400;
  }
  .btn-secondary:hover { border-color: var(--ink); transform: translateY(-2px); }

  /* Hero stats */
  .hero-stats {
    display: flex;
    gap: 2.5rem;
    margin-top: 3.5rem;
    padding-top: 2rem;
    border-top: 0.5px solid var(--border);
    opacity: 0;
    animation: fadeUp 0.7s 0.7s forwards;
  }
  .stat-item {}
  .stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 1.7rem;
    color: var(--ink);
    display: block;
  }
  .stat-label {
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-top: 0.2rem;
    display: block;
  }

  /* Hero mockup */
  .hero-right {
    opacity: 0;
    animation: fadeIn 1s 0.5s forwards;
    position: relative;
  }
  .mockup-frame {
    background: var(--cream);
    border: 0.5px solid var(--border-strong);
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 40px 80px rgba(17,17,16,0.08);
    position: relative;
    overflow: hidden;
  }
  .mockup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 0.5px solid var(--border);
  }
  .mockup-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.95rem;
    color: var(--ink);
  }
  .mockup-badge {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: var(--cream-dark);
    color: var(--rose);
    padding: 0.3rem 0.7rem;
    border-radius: 2px;
  }
  .chart-bars {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 120px;
    margin-bottom: 1.5rem;
  }
  .chart-bar {
    flex: 1;
    border-radius: 2px 2px 0 0;
    transition: height 0.3s;
  }
  .chart-bar.dark { background: var(--ink); }
  .chart-bar.mid { background: var(--blush); }
  .chart-bar.light { background: var(--cream-dark); }
  .chart-labels {
    display: flex;
    gap: 8px;
    margin-bottom: 1.5rem;
  }
  .chart-label {
    flex: 1;
    text-align: center;
    font-size: 0.65rem;
    color: var(--ink-muted);
    letter-spacing: 0.05em;
  }
  .mockup-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  .mockup-metric {
    background: var(--cream);
    border-radius: 4px;
    padding: 0.75rem;
    border: 0.5px solid var(--border);
  }
  .mockup-metric-val {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem;
    color: var(--ink);
    display: block;
  }
  .mockup-metric-label {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-top: 0.15rem;
    display: block;
  }
  .floating-tag {
    position: absolute;
    bottom: 24px;
    right: 24px;
    background: var(--ink);
    color: var(--cream);
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 0.5rem 1rem;
    border-radius: 2px;
  }

  /* SECTION BASE */
  section { padding: 8rem 3rem; }
  .section-inner { max-width: 1200px; margin: 0 auto; }
  .section-eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--rose);
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .section-eyebrow::before {
    content: '';
    display: block;
    width: 24px;
    height: 1px;
    background: var(--rose);
  }
  .section-h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 400;
    line-height: 1.2;
    margin-bottom: 1rem;
    letter-spacing: -0.01em;
  }
  .section-h2 em { font-style: italic; color: var(--rose); }
  .section-sub {
    font-size: 0.95rem;
    line-height: 1.8;
    color: var(--ink-soft);
    max-width: 520px;
  }

  /* BEFORE/AFTER */
  .ba-section { background: var(--cream); border-top: 0.5px solid var(--border); border-bottom: 0.5px solid var(--border); }
  .ba-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    margin-top: 4rem;
    border: 0.5px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .ba-panel {
    padding: 2.5rem;
  }
  .ba-panel:first-child { border-right: 0.5px solid var(--border); }
  .ba-label {
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 0.6rem;
  }
  .ba-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    margin-bottom: 1.5rem;
  }
  .ba-visual {
    height: 220px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  /* Excel mockup */
  .excel-mockup {
    background: #f0f0f0;
    border: 1px solid #ccc;
    font-size: 0.65rem;
    font-family: 'DM Sans', sans-serif;
  }
  .excel-toolbar {
    background: #217346;
    height: 24px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 6px;
  }
  .excel-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4); }
  .excel-header-row {
    display: flex;
    background: #d8d8d8;
    border-bottom: 1px solid #bbb;
    font-weight: 500;
    color: #333;
  }
  .excel-cell { flex: 1; padding: 4px 6px; border-right: 1px solid #bbb; }
  .excel-row {
    display: flex;
    border-bottom: 1px solid #ddd;
    color: #444;
  }
  .excel-row:nth-child(even) { background: #f8f8f8; }
  .excel-highlight { background: #fff2cc !important; }

  /* Premium report mockup */
  .report-mockup {
    background: var(--cream);
    border: 0.5px solid var(--border);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .report-header-strip {
    background: var(--ink);
    color: var(--cream);
    padding: 10px 14px;
    border-radius: 3px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .report-h {
    font-family: 'Playfair Display', serif;
    font-size: 0.85rem;
  }
  .report-date { font-size: 0.6rem; opacity: 0.6; letter-spacing: 0.1em; }
  .report-bars-mini {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    height: 60px;
  }
  .rmb { flex: 1; border-radius: 2px 2px 0 0; }
  .rmb-d { background: var(--ink); }
  .rmb-r { background: var(--blush); }
  .rmb-l { background: #e8e4dc; }
  .report-stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }
  .rs {
    background: #faf8f5;
    padding: 8px;
    border-radius: 3px;
    border: 0.5px solid var(--border);
  }
  .rs-val {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    display: block;
  }
  .rs-l { font-size: 0.58rem; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; display: block; }

  /* FEATURES */
  .features-section {}
  .features-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: end;
    margin-bottom: 5rem;
  }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5px;
    background: var(--border);
    border: 0.5px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .feat-card {
    background: var(--cream);
    padding: 2.5rem 2rem;
    transition: background 0.25s;
    cursor: default;
  }
  .feat-card:hover { background: var(--cream-dark); }
  .feat-icon-wrap {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    border: 0.5px solid var(--border-strong);
    border-radius: 4px;
    font-size: 1.1rem;
    color: var(--rose);
  }
  .feat-h {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    font-weight: 400;
    margin-bottom: 0.75rem;
    line-height: 1.3;
  }
  .feat-p {
    font-size: 0.85rem;
    line-height: 1.75;
    color: var(--ink-soft);
  }

  /* PROCESS */
  .process-section {
    background: var(--ink);
    color: var(--cream);
  }
  .process-section .section-eyebrow { color: var(--blush); }
  .process-section .section-eyebrow::before { background: var(--blush); }
  .process-section .section-h2 { color: var(--cream); }
  .process-section .section-h2 em { color: var(--blush); }
  .process-section .section-sub { color: var(--cream-a60); }
  .process-steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    margin-top: 5rem;
    position: relative;
  }
  .process-steps::before {
    content: '';
    position: absolute;
    top: 24px;
    left: 12%;
    right: 12%;
    height: 0.5px;
    background: var(--cream-a15);
  }
  .process-step {
    padding: 0 1.5rem;
    position: relative;
  }
  .step-num {
    width: 48px;
    height: 48px;
    border: 0.5px solid var(--cream-a20);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    color: var(--blush);
    margin-bottom: 1.75rem;
    background: var(--ink);
    position: relative;
    z-index: 1;
  }
  .step-h {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    font-weight: 400;
    margin-bottom: 0.75rem;
    color: var(--cream);
  }
  .step-p {
    font-size: 0.82rem;
    line-height: 1.75;
    color: var(--cream-a55);
  }

  /* PRICING */
  .pricing-section {}
  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1.5px;
    background: var(--border);
    border: 0.5px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    margin-top: 4rem;
  }
  .price-card {
    background: var(--cream);
    padding: 3rem;
    position: relative;
    transition: background 0.25s;
    display: flex;
    flex-direction: column;
  }
  .price-card:hover { background: var(--cream-dark); }
  .price-card.pro { background: var(--cream); border: 1px solid var(--blush); z-index: 1; }
  .popular-badge {
    position: absolute; top: 1rem; right: 1rem;
    background: var(--rose); color: white; padding: 0.2rem 0.6rem;
    font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 2px;
  }
  .price-tier {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--rose);
    margin-bottom: 1.25rem;
  }
  .price-amount {
    font-family: 'Playfair Display', serif;
    font-size: 3.2rem;
    font-weight: 400;
    line-height: 1;
    margin-bottom: 2rem;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }
  .price-currency { font-size: 1.2rem; }
  .price-period {
    font-size: 0.8rem;
    font-weight: 300;
    color: var(--ink-muted);
  }
  .price-features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    margin-bottom: 2.5rem;
    flex: 1;
    font-size: 0.87rem;
    color: var(--ink-soft);
  }

  /* CTA BANNER */
  .cta-section {
    padding: 6rem 3rem;
    background: #f0ebe4;
    border-top: 0.5px solid var(--border);
    text-align: center;
  }
  .cta-inner { max-width: 700px; margin: 0 auto; }
  .cta-h {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 400;
    margin-bottom: 1.25rem;
    line-height: 1.2;
  }
  .cta-h em { font-style: italic; color: var(--rose); }
  .cta-p {
    font-size: 0.95rem;
    line-height: 1.8;
    color: var(--ink-soft);
    margin-bottom: 2.5rem;
  }

  /* FOOTER */
  .footer {
    background: var(--ink);
    color: var(--cream-a50);
    padding: 3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--cream);
  }
  .footer-copy { font-size: 0.78rem; }
  .footer-links {
    display: flex;
    gap: 2rem;
    list-style: none;
  }
  .footer-links a {
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--cream-a40);
    transition: color 0.2s;
  }
  .footer-links a:hover { color: var(--cream); }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 900px) {
    .nav { padding: 1.25rem 1.5rem; }
    .nav-links { display: none; }
    .hero { grid-template-columns: 1fr; padding: 120px 1.5rem 80px; gap: 3rem; }
    .hero-left { padding-right: 0; }
    section { padding: 5rem 1.5rem; }
    .ba-grid { grid-template-columns: 1fr; }
    .ba-panel:first-child { border-right: none; border-bottom: 0.5px solid var(--border); }
    .features-header { grid-template-columns: 1fr; gap: 2rem; margin-bottom: 3rem; }
    .features-grid { grid-template-columns: 1fr; }
    .process-steps { grid-template-columns: 1fr 1fr; gap: 2rem; }
    .process-steps::before { display: none; }
    .pricing-grid { grid-template-columns: 1fr; }
    .footer { flex-direction: column; gap: 1.5rem; text-align: center; }
    .footer-links { justify-content: center; }
  }
`;

const bars = [
  { h: "45%", type: "light" },
  { h: "70%", type: "dark" },
  { h: "55%", type: "mid" },
  { h: "85%", type: "dark" },
  { h: "40%", type: "light" },
  { h: "90%", type: "dark" },
  { h: "65%", type: "mid" },
];
const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem"];

const miniBarData = [
  { h: 35, t: "rmb rmb-l" }, { h: 55, t: "rmb rmb-d" }, { h: 42, t: "rmb rmb-r" },
  { h: 68, t: "rmb rmb-d" }, { h: 30, t: "rmb rmb-l" }, { h: 80, t: "rmb rmb-d" },
  { h: 50, t: "rmb rmb-r" },
];

const features = [
  { icon: "✦", title: "feat.1.title", desc: "feat.1.desc" },
  { icon: "◎", title: "feat.2.title", desc: "feat.2.desc" },
  { icon: "⊞", title: "feat.3.title", desc: "feat.3.desc" },
  { icon: "◈", title: "feat.4.title", desc: "feat.4.desc" },
  { icon: "◉", title: "feat.5.title", desc: "feat.5.desc" },
  { icon: "⬡", title: "feat.6.title", desc: "feat.6.desc" },
];

const steps = [
  { num: "01", title: "process.1.title", desc: "process.1.desc" },
  { num: "02", title: "process.2.title", desc: "process.2.desc" },
  { num: "03", title: "process.3.title", desc: "process.3.desc" },
  { num: "04", title: "process.4.title", desc: "process.4.desc" },
];

export default function AuraDataLandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { t, lang, setLang } = useLanguage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          name: u.user_metadata?.full_name || u.email?.split("@")[0],
          email: u.email,
          avatar: u.user_metadata?.avatar_url
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
  };

  const AvatarEl = () => {
    if (user?.avatar) return <img src={user.avatar} alt="Avatar" />;
    const initials = String(user?.name || "?").substring(0, 2).toUpperCase();
    return <span>{initials}</span>;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="aura-root">

        <nav className="nav">
          <span className="nav-logo">AuraData</span>
          <ul className="nav-links">
            <li><a href="#features">{t("nav.features")}</a></li>
            <li><a href="#templates">{t("nav.templates")}</a></li>
            <li><a href="#pricing">{t("nav.pricing")}</a></li>
          </ul>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <ThemeToggle />
            <LanguageToggle />
            {user ? (
              <div className="user-menu" ref={userMenuRef}>
                <div className="user-avatar" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <AvatarEl />
                </div>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-name">{user?.name}</div>
                      <div className="user-dropdown-email">{user?.email}</div>
                    </div>
                    <Link href="/dashboard" className="user-dropdown-item">
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <button onClick={handleLogout} className="user-dropdown-item" style={{ color: "var(--rose)" }}>
                      <LogOut size={14} /> {t("common.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth"><button className="nav-btn">{t("common.startFree")}</button></Link>
            )}
          </div>
        </nav>

        {/* HERO */}
        <section style={{ padding: 0 }}>
          <div className="hero">
            <div className="hero-left">
              <span className="hero-eyebrow">{t("hero.eyebrow")}</span>
              <h1 className="hero-h1">
                {t("hero.title1")}<br /><em>aura</em> {t("hero.title2")}
              </h1>
              <p className="hero-p">
                {t("hero.subtitle")}
              </p>
              <div className="hero-actions">
                <Link href="/auth"><button className="btn-primary">{t("hero.btnStart")}</button></Link>
                <button className="btn-secondary">{t("hero.btnDemo")}</button>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-num">12k+</span>
                  <span className="stat-label">{t("hero.statUsers")}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-num">1.4M</span>
                  <span className="stat-label">{t("hero.statExports")}</span>
                </div>
              </div>
            </div>

            <div className="hero-right">
              <div className="mockup-frame">
                <div className="mockup-header">
                  <span className="mockup-title">Q4 2025 Satış Raporu</span>
                  <span className="mockup-badge">Yönetim Kurulu</span>
                </div>
                <div className="chart-bars">
                  {bars.map((b, i) => (
                    <div key={i} className={`chart-bar ${b.type}`} style={{ height: b.h }} />
                  ))}
                </div>
                <div className="chart-labels">
                  {months.map((m, i) => <span key={i} className="chart-label">{m}</span>)}
                </div>
                <div className="mockup-metrics">
                  <div className="mockup-metric">
                    <span className="mockup-metric-val">₺2.4M</span>
                    <span className="mockup-metric-label">Gelir</span>
                  </div>
                  <div className="mockup-metric">
                    <span className="mockup-metric-val">+34%</span>
                    <span className="mockup-metric-label">Büyüme</span>
                  </div>
                  <div className="mockup-metric">
                    <span className="mockup-metric-val">847</span>
                    <span className="mockup-metric-label">Müşteri</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="features-section">
          <div className="section-inner">
            <div className="features-header">
              <div>
                <span className="section-eyebrow">{t("feat.eyebrow")}</span>
                <h2 className="section-h2">{t("feat.title1")} <em>{t("feat.title2")}</em></h2>
              </div>
              <p className="section-sub">{t("feat.sub")}</p>
            </div>

            <div className="features-grid">
              {features.map((f, i) => (
                <div key={i} className="feat-card">
                  <div className="feat-icon-wrap">{f.icon}</div>
                  <h3 className="feat-h">{t(f.title as any)}</h3>
                  <p className="feat-p">{t(f.desc as any)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="process-section">
          <div className="section-inner">
            <span className="section-eyebrow">{t("process.eyebrow")}</span>
            <h2 className="section-h2">{t("process.title1")} <em>{t("process.title2")}</em></h2>
            <p className="section-sub">{t("process.sub")}</p>

            <div className="process-steps">
              {steps.map((s, i) => (
                <div key={i} className="process-step">
                  <div className="step-num">{s.num}</div>
                  <h3 className="step-h">{t(s.title as any)}</h3>
                  <p className="step-p">{t(s.desc as any)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="pricing-section">
          <div className="section-inner">
            <span className="section-eyebrow">{t("pricing.eyebrow")}</span>
            <h2 className="section-h2">{t("pricing.title1")} <em>{t("pricing.title2")}</em></h2>
            <p className="section-sub">{t("pricing.sub")}</p>

            <div className="pricing-grid">
              <div className="price-card">
                <p className="price-tier">{t("pricing.tier1")}</p>
                <div className="price-amount"><span className="price-currency">₺</span>0<span className="price-period">/{t("pricing.monthly")}</span></div>
                <ul className="price-features">
                  <li>Temel Kanvas Özellikleri</li>
                  <li>3 Proje Limiti</li>
                  <li>Standart Şablonlar</li>
                  <li>Filigranlı Çıktı</li>
                </ul>
                <button className="btn-secondary">{t("common.startFree")}</button>
              </div>

              <div className="price-card pro">
                <div className="popular-badge">Popüler</div>
                <p className="price-tier">{t("pricing.tier2")}</p>
                <div className="price-amount"><span className="price-currency">₺</span>499<span className="price-period">/{t("pricing.monthly")}</span></div>
                <ul className="price-features">
                  <li>Sınırsız Proje</li>
                  <li>Gelişmiş AI Analizi</li>
                  <li>Özel Marka Renkleri/Logoları</li>
                  <li>Filigransız PDF Dışa Aktarım</li>
                </ul>
                <button className="btn-primary">{t("pricing.btn")}</button>
              </div>

              <div className="price-card">
                <p className="price-tier">{t("pricing.tier3")}</p>
                <div className="price-amount">{t("pricing.custom")}</div>
                <ul className="price-features">
                  <li>Özel Veri Entegrasyonları (API)</li>
                  <li>Öncelikli 7/24 Destek</li>
                  <li>SSO (Çok Yakında)</li>
                  <li>Ekibe Özel Eğitimler</li>
                </ul>
                <button className="btn-secondary">{t("pricing.btn")}</button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="cta-section">
          <div className="cta-inner">
            <h2 className="cta-h">{t("cta.title1")} <em>{t("cta.title2")}</em> {t("cta.title3")}</h2>
            <p className="cta-p">{t("cta.sub")}</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/auth"><button className="btn-primary">{t("common.startFree")}</button></Link>
              <button className="btn-secondary">{t("hero.btnDemo")}</button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <span className="footer-logo">AuraData</span>
          <span className="footer-copy">{t("footer.copy")}</span>
          <ul className="footer-links">
            <li><a href="#">{t("footer.privacy")}</a></li>
            <li><a href="#">{t("footer.terms")}</a></li>
            <li><a href="#">{t("footer.contact")}</a></li>
          </ul>
        </footer>

      </div>
    </>
  );
}