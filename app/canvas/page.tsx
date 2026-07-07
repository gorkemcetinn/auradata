"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import * as XLSX from "xlsx";
import ReactECharts from "echarts-for-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../utils/supabase";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart3, PieChart, LineChart, AlignLeft, LayoutTemplate,
  Download, MousePointer, FileSpreadsheet,
  Palette, ChevronDown, ChevronRight, ChevronLeft, ArrowLeft, Sparkles, Grid3X3, Save, LogOut, Loader2,
  Plus, Trash2, Copy, FileText, Image as ImageIcon, Maximize, Smartphone, Monitor,
  Share2, FileImage, Link2, LayoutList, Layers,
  Lock, Unlock, ArrowUpToLine, ArrowDownToLine, Magnet, Undo2, Redo2, Table, Square, Type, Bot, X
} from "lucide-react";
import CanvasAiPanel from "../components/CanvasAiPanel";
import { useLanguage } from "../../contexts/LanguageContext";
import { compressData, decompressData } from "../utils/compression";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";
/* ─────────────────────────────────────────────
   Design Tokens & CSS
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:        #faf8f5;
    --cream-dark:   #f0ebe4;
    --ink:          #111110;
    --ink-soft:     #4a4845;
    --ink-muted:    #999490;
    --blush:        #e8c4b0;
    --rose:         #c97b5a;
    --rose-light:   #f5ede7;
    --border:       rgba(17,17,16,0.08);
    --border-mid:   rgba(17,17,16,0.14);
    --border-strong:rgba(17,17,16,0.22);
    --white:        #ffffff;
    --green:        #4a7c6f;
    --green-light:  #eaf2f0;
    --blue:         #4a6f7c;
  }

  body { background: var(--cream); font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

  .canvas-root {
    height: 100vh; width: 100%;
    display: flex; flex-direction: column;
    background: var(--cream); color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300; overflow: hidden;
  }
  .noise-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    pointer-events: none; z-index: 9999; opacity: 0.035; mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  /* ── TOPBAR ── */
  .topbar {
    height: 56px; background: var(--white);
    border-bottom: 0.5px solid var(--border-mid);
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem; flex-shrink: 0; z-index: 20;
  }
  .topbar-brand { display: flex; align-items: center; gap: 0.875rem; }
  .topbar-logo {
    width: 32px; height: 32px; background: var(--ink);
    border-radius: 3px; display: flex; align-items: center;
    justify-content: center; font-family: 'Playfair Display', serif;
    font-size: 1rem; color: var(--cream); font-style: italic; flex-shrink: 0;
  }
  .topbar-doc { display: flex; flex-direction: column; }
  .topbar-doc-name {
    font-family: 'Playfair Display', serif; font-size: 0.9rem;
    font-weight: 400; color: var(--ink); line-height: 1.2;
    border: none; background: transparent; outline: none;
    cursor: text; min-width: 160px;
  }
  .topbar-doc-name:focus { border-bottom: 0.5px solid var(--rose); }
  .topbar-doc-status { font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-muted); margin-top: 1px; }
  .topbar-breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--ink-muted); letter-spacing: 0.06em; }
  .topbar-breadcrumb a { color: var(--ink-soft); text-decoration: none; }
  .topbar-breadcrumb a:hover { color: var(--rose); }
  .topbar-actions { display: flex; align-items: center; gap: 0.625rem; }
  .topbar-tool-btn {
    background: transparent; border: none; color: var(--ink-soft); cursor: pointer;
    display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 4px;
    transition: all 0.15s;
  }
  .topbar-tool-btn:hover:not(:disabled) { background: var(--cream-dark); color: var(--ink); }
  .topbar-tool-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .topbar-tool-btn.active { background: var(--rose-light); color: var(--rose); }
  .block-locked-overlay { pointer-events: none; border: 2px dashed rgba(153, 148, 144, 0.4); width: 100%; height: 100%; position: absolute; top:0; left:0; border-radius: 4px; z-index: 10; }
  .topbar-save-btn {
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--white); color: var(--ink);
    border: 0.5px solid var(--border-strong);
    padding: 0 0.875rem; height: 32px;
    font-family: 'DM Sans', sans-serif; font-size: 0.72rem;
    font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; border-radius: 2px; transition: all 0.18s; white-space: nowrap;
  }
  .topbar-save-btn:hover { background: var(--cream); }
  .topbar-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .topbar-save-btn.saved { color: var(--green); border-color: rgba(74,124,111,0.3); }

  /* User menu */
  .user-menu { position: relative; display: flex; align-items: center; gap: 1rem; margin-left: 1rem; }
  .user-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--cream-dark); border: 0.5px solid var(--border-mid);
    cursor: pointer; overflow: hidden; font-size: 0.75rem;
    font-weight: 500; color: var(--ink-soft); transition: border-color 0.18s;
    flex-shrink: 0;
  }
  .user-avatar:hover { border-color: var(--rose); }
  .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .user-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--white); border: 0.5px solid var(--border-mid);
    border-radius: 4px; min-width: 200px;
    box-shadow: 0 8px 24px rgba(17,17,16,0.08);
    z-index: 50; overflow: hidden;
  }
  .user-dropdown-header {
    padding: 0.75rem 1rem; border-bottom: 0.5px solid var(--border);
  }
  .user-dropdown-name { font-size: 0.82rem; font-weight: 400; color: var(--ink); }
  .user-dropdown-email { font-size: 0.72rem; color: var(--ink-muted); margin-top: 1px; }
  .user-dropdown-item {
    display: flex; align-items: center; gap: 0.625rem;
    padding: 0.625rem 1rem; font-size: 0.78rem; color: var(--ink-soft);
    cursor: pointer; transition: background 0.15s; border: none;
    background: none; width: 100%; text-align: left;
  }
  .user-dropdown-item:hover { background: var(--cream); color: var(--ink); }
  .user-dropdown-item.danger:hover { background: #fef3f0; color: var(--rose); }

  /* ── WORKSPACE ── */
  .workspace { flex: 1; display: flex; overflow: hidden; }

  /* ── SIDEBARS ── */
  .sidebar {
    width: 260px; background: var(--white);
    border-right: 0.5px solid var(--border-mid);
    display: flex; flex-direction: column; flex-shrink: 0; z-index: 10;
    transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
  }
  .sidebar.collapsed { width: 0; border-color: transparent; }
  .sidebar-right { border-right: none; border-left: 0.5px solid var(--border-mid); }
  .sidebar-right.collapsed { border-color: transparent; }
  .sidebar-header {
    height: 44px; border-bottom: 0.5px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1rem; flex-shrink: 0; min-width: 260px;
  }
  .sidebar-header-label { font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-muted); font-weight: 400; display: flex; align-items: center; gap: 0.5rem; }
  .sidebar-body { flex: 1; overflow-y: auto; padding: 1rem; min-width: 260px; }

  /* ── SIDEBAR TOGGLE TABS ── */
  .sidebar-tab {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 28px; height: 64px; background: var(--white); border: 0.5px solid var(--border-mid);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 20; transition: background 0.15s, color 0.15s;
    color: var(--ink-muted);
  }
  .sidebar-tab:hover { background: var(--cream-dark); color: var(--ink); }
  .sidebar-tab-left { left: 0; border-left: none; border-radius: 0 4px 4px 0; }
  .sidebar-tab-right { right: 0; border-right: none; border-radius: 4px 0 0 4px; }

  /* ── TOOLTIP ── */
  .tip {
    position: relative; display: inline-flex; align-items: center; justify-content: center;
  }
  .tip::after {
    content: attr(data-tip);
    position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
    background: var(--ink); color: var(--cream); font-size: 0.65rem;
    white-space: nowrap; padding: 4px 8px; border-radius: 3px;
    pointer-events: none; opacity: 0; transition: opacity 0.15s;
    letter-spacing: 0.04em; font-family: 'DM Sans', sans-serif; z-index: 999;
  }
  .tip::before {
    content: ''; position: absolute; bottom: calc(100% + 3px); left: 50%;
    transform: translateX(-50%); border: 4px solid transparent;
    border-top-color: var(--ink); pointer-events: none; opacity: 0; transition: opacity 0.15s;
  }
  .tip:hover::after, .tip:hover::before { opacity: 1; }

  /* ── SHARE MENU ── */
  .share-btn {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0 0.75rem; height: 30px;
    background: var(--rose); color: white; border: none;
    border-radius: 4px; font-size: 0.75rem; font-weight: 500;
    cursor: pointer; transition: opacity 0.15s; font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.02em;
  }
  .share-btn:hover { opacity: 0.88; }
  .share-menu-wrap { position: relative; }
  .share-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--cream); border: 0.5px solid var(--border-mid);
    border-radius: 6px; box-shadow: 0 12px 32px rgba(17,17,16,0.12);
    width: 240px; z-index: 200; overflow: hidden;
    animation: fadeUp 0.15s ease;
  }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .share-dropdown-header {
    padding: 0.5rem 0.875rem; font-size: 0.6rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--ink-muted); border-bottom: 0.5px solid var(--border);
  }
  .share-item {
    display: flex; align-items: center; gap: 0.625rem;
    padding: 0.625rem 0.875rem; font-size: 0.78rem; color: var(--ink-soft);
    cursor: pointer; border: none; background: none; width: 100%;
    text-align: left; transition: background 0.12s; font-family: 'DM Sans', sans-serif;
  }
  .share-item:hover { background: var(--cream); color: var(--ink); }
  .share-item .share-item-icon {
    width: 28px; height: 28px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .share-item .share-item-desc { font-size: 0.65rem; color: var(--ink-muted); margin-top: 1px; }
  .share-sep { height: 0.5px; background: var(--border); margin: 0; }

  /* ── PDF MODE ICONS ── */
  .pdf-mode-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .pdf-mode-icon {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0.25rem; padding: 0.5rem; border-radius: 4px; border: 1.5px solid var(--border-mid);
    cursor: pointer; background: var(--cream); transition: all 0.15s; color: var(--ink-muted);
  }
  .pdf-mode-icon.active { border-color: var(--ink); color: var(--ink); background: var(--cream); }
  .pdf-mode-icon:hover:not(.active) { border-color: var(--border-strong); color: var(--ink-soft); }
  .pdf-mode-icon span { font-size: 0.55rem; letter-spacing: 0.08em; text-transform: uppercase; }

  /* ── UPLOAD ZONE ── */
  .upload-zone {
    border: 0.5px dashed var(--border-strong); border-radius: 2px;
    padding: 1.25rem 1rem; text-align: center; background: var(--cream);
    cursor: pointer; transition: all 0.2s; margin-bottom: 1.25rem; display: block;
  }
  .upload-zone:hover { border-color: var(--rose); background: var(--rose-light); }
  .upload-zone-icon { color: var(--ink-muted); margin-bottom: 0.5rem; display: flex; justify-content: center; }
  .upload-zone-label { font-size: 0.75rem; color: var(--ink-soft); font-weight: 400; }
  .upload-zone-sub { font-size: 0.65rem; color: var(--ink-muted); margin-top: 0.25rem; letter-spacing: 0.06em; }

  /* ── SECTION LABEL ── */
  .section-label {
    font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--ink-muted); margin-bottom: 0.625rem;
    display: flex; align-items: center; gap: 0.5rem; font-weight: 400;
  }
  .section-label::after { content: ''; flex: 1; height: 0.5px; background: var(--border); }

  /* ── BLOCK BUTTONS ── */
  .block-add-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 0.5px; background: var(--border);
    border: 0.5px solid var(--border); border-radius: 4px;
    overflow: hidden; margin-bottom: 1.25rem;
  }
  .block-add-btn {
    background: var(--white); border: none;
    padding: 0.75rem 0.5rem;
    display: flex; flex-direction: column;
    align-items: center; gap: 0.375rem;
    cursor: pointer; transition: background 0.15s; color: var(--ink-soft);
  }
  .block-add-btn:hover { background: var(--cream-dark); color: var(--ink); }
  .block-add-label { font-size: 0.62rem; letter-spacing: 0.08em; text-transform: uppercase; }

  /* ── CANVAS MAIN ── */
  .canvas-main {
    flex: 1; overflow: auto;
    display: flex; align-items: flex-start; justify-content: center;
    position: relative; background-color: var(--cream-dark);
    background-image:
      linear-gradient(var(--border) 1px, transparent 1px),
      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 32px 32px; padding: 3rem;
  }
  .canvas-zoom-wrapper {
    transform-origin: top center;
    transition: transform 0.2s ease;
  }
  /* ── ZOOM CONTROLS ── */
  .zoom-controls {
    display: flex; align-items: center; gap: 0; background: var(--cream-dark);
    border: 0.5px solid var(--border-mid); border-radius: 4px; overflow: hidden;
  }
  .zoom-btn {
    width: 28px; height: 28px; border: none; background: transparent;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--ink-soft); transition: background 0.15s, color 0.15s;
    font-size: 0.8rem;
  }
  .zoom-btn:hover { background: var(--border); color: var(--ink); }
  .zoom-btn:disabled { opacity: 0.35; cursor: default; }
  .zoom-label {
    font-size: 0.7rem; color: var(--ink-muted); font-weight: 400;
    min-width: 38px; text-align: center; letter-spacing: 0.03em;
    cursor: pointer; padding: 0 2px;
  }
  .zoom-label:hover { color: var(--ink); }
  .a4-page {
    background: var(--white);
    border: 0.5px solid var(--border-mid);
    box-shadow: 0 8px 48px rgba(17,17,16,0.1);
    position: relative; flex-shrink: 0;
    transition: width 0.3s, height 0.3s;
  }
  .a4-page.portrait { width: 794px; height: 1123px; }
  .a4-page.landscape { width: 1123px; height: 794px; }
  /* ── RND BLOCKS ── */
  .block-rnd {
    border: 1px solid transparent;
    transition: border-color 0.15s, box-shadow 0.15s;
    background: transparent;
  }
  .block-rnd.selected {
    border-color: var(--blue);
    box-shadow: 0 0 0 2px rgba(74, 111, 124, 0.1);
    z-index: 50 !important;
  }
  .block-rnd.highlighted {
    border-color: var(--rose) !important;
    animation: blockPulse 0.6s ease-in-out 3;
    z-index: 49 !important;
  }
  .block-rnd:hover:not(.selected) {
    border-color: var(--border-strong);
  }
  .block-content {
    width: 100%; height: 100%; position: relative;
    display: flex; flex-direction: column; padding: 0.5rem;
  }
  
  /* ── BLOCK HEADER (Only visible on hover/select) ── */
  .block-toolbar {
    position: absolute; top: -28px; right: -1px;
    background: var(--white); border: 1px solid var(--blue);
    border-bottom: none; border-radius: 4px 4px 0 0;
    display: none; padding: 2px 4px; gap: 4px;
  }
  .block-rnd.selected .block-toolbar { display: flex; }
  .block-toolbar-btn {
    background: transparent; border: none; cursor: pointer;
    color: var(--ink-soft); padding: 4px; border-radius: 2px;
  }
  .block-toolbar-btn:hover { background: var(--cream-dark); color: var(--rose); }

  /* ── BLOCK TYPES ── */
  .block-kpi {
    display: flex; flex-direction: column; justify-content: center;
    background: var(--white); border: 0.5px solid var(--border-mid);
    border-radius: 2px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    width: 100%; height: 100%;
  }
  .block-kpi-title { font-size: 0.75rem; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
  .block-kpi-value { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: var(--ink); line-height: 1; }
  
  .block-text { padding: 1rem; outline: none; width: 100%; height: 100%; overflow: hidden; }
  .block-text h1 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 400; margin-bottom: 0.5rem; }
  .block-text p { font-size: 0.9rem; color: var(--ink-soft); line-height: 1.6; }

  /* ── RIGHT PANEL CONTROLS ── */
  .prop-group { margin-bottom: 1.5rem; }
  .prop-label { font-size: 0.7rem; color: var(--ink-soft); margin-bottom: 0.375rem; display: block; }
  .prop-select {
    width: 100%; padding: 0.5rem 0.75rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.78rem;
    color: var(--ink); background: var(--cream);
    border: 0.5px solid var(--border-mid); border-radius: 3px;
    outline: none; cursor: pointer; margin-bottom: 0.75rem;
  }
  .prop-input {
    width: 100%; padding: 0.5rem 0.75rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.78rem;
    color: var(--ink); background: var(--white);
    border: 0.5px solid var(--border-mid); border-radius: 3px;
    outline: none; margin-bottom: 0.75rem;
  }
  .palette-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0.75rem; }
  .swatch {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid transparent; cursor: pointer; transition: transform 0.15s;
  }
  .swatch:hover { transform: scale(1.15); }
  .swatch.active { border-color: var(--ink); }
  .toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 0; border-bottom: 0.5px solid var(--border);
  }
  .toggle-label { font-size: 0.8rem; color: var(--ink-soft); }
  .toggle-input { accent-color: var(--rose); width: 14px; height: 14px; cursor: pointer; }
  
  /* ── EXPORT MENU ── */
  .export-menu {
    position: relative;
  }
  .export-btn {
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--ink); color: var(--cream); border: none;
    padding: 0 1rem; height: 32px;
    font-family: 'DM Sans', sans-serif; font-size: 0.75rem;
    font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; border-radius: 2px; transition: background 0.18s; white-space: nowrap;
  }
  .export-btn:hover { background: var(--rose); }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
    background: var(--ink); color: var(--cream);
    padding: 0.625rem 1.25rem; border-radius: 3px;
    font-size: 0.78rem; letter-spacing: 0.06em;
    z-index: 999; pointer-events: none;
    animation: toastIn 0.25s ease forwards;
  }
  .toast.error { background: var(--rose); }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* ── ITEMS LIST ── */
  .items-list { margin-bottom: 0.5rem; }
  .item-row {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.375rem 0.5rem; border-radius: 3px;
    cursor: pointer; transition: all 0.12s;
    border: 1px solid transparent; margin-bottom: 2px;
  }
  .item-row:hover { background: var(--cream); }
  .item-row.active { background: var(--cream-dark); border-color: var(--border-mid); }
  .item-icon {
    width: 26px; height: 26px; border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; background: var(--cream); color: var(--ink-soft);
  }
  .item-name {
    flex: 1; font-size: 0.72rem; border: none; background: transparent;
    color: var(--ink); outline: none; font-family: 'DM Sans', sans-serif;
    min-width: 0; padding: 2px 0;
  }
  .item-name:focus { border-bottom: 0.5px solid var(--rose); background: var(--cream); }
  .item-delete {
    background: none; border: none; cursor: pointer;
    color: var(--ink-muted); padding: 3px; border-radius: 2px;
    display: flex; align-items: center; opacity: 0;
    transition: opacity 0.12s, color 0.12s; flex-shrink: 0;
  }
  .item-row:hover .item-delete { opacity: 1; }
  .item-delete:hover { color: var(--rose); }
  .items-empty {
    font-size: 0.72rem; color: var(--ink-muted); text-align: center;
    padding: 1rem 0; font-style: italic;
  }
  @keyframes blockPulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(201,123,90,0.3); }
    50% { box-shadow: 0 0 0 6px rgba(201,123,90,0.1); }
  }

  /* ── MOBILE RESPONSIVE ── */
  @media (max-width: 900px) {
    .canvas-body {
      flex-direction: column;
      overflow-y: auto;
    }
    .sidebar-left {
      width: 100%;
      border-right: none;
      border-bottom: 0.5px solid var(--border-mid);
      max-height: 200px;
    }
    .sidebar-right {
      width: 100%;
      border-left: none;
      border-top: 0.5px solid var(--border-mid);
      max-height: 300px;
    }
    .canvas-main {
      min-height: 500px;
    }
  }
`;

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const palettes = [
  { key: "ink",   color: "#111110", label: "Mürekkep" },
  { key: "rose",  color: "#c97b5a", label: "Gül"      },
  { key: "blush", color: "#e8c4b0", label: "Pudra"    },
  { key: "sage",  color: "#87a99c", label: "Adaçayı"  },
  { key: "blue",  color: "#4a6f7c", label: "Okyanus"  },
  { key: "green", color: "#4a7c6f", label: "Orman"    },
];

const blockTemplates = [
  { type: "chart", icon: BarChart3, label: "Sütun", chartType: "bar", w: 380, h: 280 },
  { type: "chart", icon: LineChart, label: "Çizgi", chartType: "line", w: 380, h: 280 },
  { type: "chart", icon: PieChart, label: "Pasta", chartType: "pie", w: 300, h: 280 },
  { type: "chart", icon: PieChart, label: "Donut", chartType: "donut", w: 300, h: 280 },
  { type: "chart", icon: LineChart, label: "Alan", chartType: "area", w: 380, h: 280 },
  { type: "chart", icon: MousePointer, label: "Dağılım", chartType: "scatter", w: 380, h: 280 },
  { type: "kpi", icon: Monitor, label: "KPI Kart", w: 200, h: 120 },
  { type: "table", icon: Table, label: "Tablo", w: 400, h: 300 },
  { type: "text", icon: AlignLeft, label: "Metin", w: 300, h: 100 },
  { type: "image", icon: ImageIcon, label: "Görsel", w: 200, h: 200 },
  { type: "shape", icon: Square, label: "Şekil", shapeType: "rect", w: 100, h: 100 },
  { type: "meta", icon: Type, label: "Sayfa Bilg.", metaType: "page", w: 150, h: 40 },
];

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface BlockData {
  id: string;
  name?: string;
  type: "chart" | "kpi" | "text" | "table" | "image" | "shape" | "meta";
  x: number;
  y: number;
  w: number;
  h: number;
  locked?: boolean;
  z?: number;
  pageIndex?: number;
  
  // Chart & KPI config
  chartType?: "bar" | "pie" | "line" | "area" | "scatter" | "donut";
  direction?: "vertical" | "horizontal";
  xCol?: string;
  yCol?: string;
  palette?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  
  // Text & KPI specific
  title?: string;
  content?: string;
  shapeType?: "line" | "rect" | "arrow";
  metaType?: "page" | "date";
}

interface CanvasState {
  blocks: BlockData[];
  orientation: "portrait" | "landscape";
  pageCount: number;
}

interface ParseResult {
  labels: string[];
  values: number[];
  totalRows: number;
  cleanedRows: number;
  kpiSum: number;
}

/* ─────────────────────────────────────────────
   Data Parser (Boolean Support)
───────────────────────────────────────────── */
function parseData(rawData: any[][], allColumns: string[], xCol?: string, yCol?: string): ParseResult {
  if (!xCol || !yCol) return { labels: [], values: [], totalRows: rawData.length, cleanedRows: 0, kpiSum: 0 };
  const normalizedCols = allColumns.map(c => String(c).trim().toLowerCase());
  const xIdx = normalizedCols.indexOf(String(xCol).trim().toLowerCase());
  const yIdx = normalizedCols.indexOf(String(yCol).trim().toLowerCase());
  
  if (xIdx === -1 || yIdx === -1)
    return { labels: [], values: [], totalRows: rawData.length, cleanedRows: 0, kpiSum: 0 };

  const filtered = rawData.filter((row) => {
    const xVal = row[xIdx]; const yVal = row[yIdx];
    return xVal != null && String(xVal).trim() !== "" && yVal != null && String(yVal).trim() !== "";
  });
  
  const aggregated: Record<string, number[]> = {};
  let kpiSum = 0;
  
  for (const row of filtered) {
    const rawX = String(row[xIdx] ?? "").trim();
    let rawY = String(row[yIdx] ?? "").trim().toLowerCase();
    
    // Handle booleans/text values logically mapping to numbers
    let num = NaN;
    if (["true", "doğru", "yes", "evet", "1"].includes(rawY)) num = 1;
    else if (["false", "yanlış", "no", "hayır", "0"].includes(rawY)) num = 0;
    else {
      const normalised = rawY.replace(/[^\d,.-]/g,"").replace(/\.(?=\d{3}(,|$))/g,"").replace(",",".");
      num = parseFloat(normalised);
    }
    
    if (!aggregated[rawX]) aggregated[rawX] = [];
    if (!isNaN(num)) {
      aggregated[rawX].push(num);
      kpiSum += num;
    } else {
      // If it's pure text that can't be parsed, treat as count=1 (frequency)
      aggregated[rawX].push(1);
      kpiSum += 1;
    }
  }

  const labels: string[] = [];
  const values: number[] = [];
  for (const [x, yArr] of Object.entries(aggregated)) {
    labels.push(x);
    // sum up values
    const sum = yArr.reduce((a,b) => a+b, 0);
    values.push(sum);
  }
  
  return { labels, values, totalRows: rawData.length, cleanedRows: filtered.length, kpiSum };
}

/* ─────────────────────────────────────────────
   ECharts config builder
───────────────────────────────────────────── */
function buildChartOption(labels: string[], values: number[], block: BlockData) {
  if (!labels.length) return {};
  const activeColor = palettes.find((p) => p.key === block.palette)?.color ?? "#111110";
  const baseFont = { fontFamily: "'DM Sans', sans-serif" };
  const axisColor = "#999490";
  const gridColor = block.showGrid !== false ? "rgba(17,17,16,0.06)" : "transparent";
  
  const isLargeDataset = labels.length > 25;

  if (block.chartType === "pie" || block.chartType === "donut") {
    const radius = block.chartType === "donut" ? ["40%", "70%"] : ["0%", "70%"];
    return {
      legend: block.showLegend !== false ? { orient: "horizontal", bottom: 0, textStyle: { ...baseFont, color: "#4a4845", fontSize: 11 } } : { show: false },
      tooltip: { trigger: "item", backgroundColor: "#fff", borderColor: "rgba(17,17,16,0.1)", borderWidth: 0.5, textStyle: { ...baseFont, color: "#111110", fontSize: 12 } },
      series: [{ type: "pie", radius, data: labels.map((l, i) => ({ name: l, value: values[i] })), itemStyle: { borderRadius: 3, borderColor: "#fff", borderWidth: 2 }, label: { ...baseFont, color: "#4a4845", fontSize: 11 } }],
      color: palettes.map(p => p.color) // Use all palettes for pie slices
    };
  }

  const isHorizontal = block.direction === "horizontal";
  const catAxis = { 
    type: "category", 
    data: labels, 
    name: isHorizontal ? block.yCol : block.xCol, 
    nameLocation: "end", 
    nameTextStyle: { ...baseFont, color: axisColor, fontSize: 10 }, 
    axisLine: { lineStyle: { color: gridColor } }, 
    axisTick: { show: false }, 
    axisLabel: { 
      ...baseFont, 
      color: axisColor, 
      fontSize: 10,
      hideOverlap: true,
      rotate: isHorizontal ? 0 : (isLargeDataset ? 45 : 0),
      formatter: (value: string) => value.length > 12 ? value.substring(0, 12) + '...' : value
    } 
  };

  const valAxis = { type: "value", name: isHorizontal ? block.xCol : block.yCol, nameLocation: "end", nameTextStyle: { ...baseFont, color: axisColor, fontSize: 10 }, splitLine: { lineStyle: { color: gridColor, type: "dashed" } }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...baseFont, color: axisColor, fontSize: 11 } };

  // DataZoom adjust for horizontal
  const dZoom = isLargeDataset ? [
    { type: 'inside', [isHorizontal ? 'yAxisIndex' : 'xAxisIndex']: 0, start: 0, end: Math.max((25 / labels.length) * 100, 5) },
    { type: 'slider', [isHorizontal ? 'yAxisIndex' : 'xAxisIndex']: 0, [isHorizontal ? 'right' : 'bottom']: 5, [isHorizontal ? 'width' : 'height']: 16, borderColor: 'transparent', handleSize: '100%', fillerColor: 'rgba(201,123,90,0.2)', textStyle: { color: 'transparent' } }
  ] : [];

  const commonAxes = {
    grid: { top: 32, right: 32, bottom: isHorizontal ? 32 : (isLargeDataset ? 60 : (block.showLegend !== false ? 40 : 24)), left: isHorizontal ? 10 : 52, containLabel: true },
    legend: block.showLegend !== false ? { data: [block.yCol], top: 0, textStyle: { ...baseFont, color: "#4a4845", fontSize: 11 } } : { show: false },
    tooltip: { trigger: "axis", backgroundColor: "#fff", borderColor: "rgba(17,17,16,0.1)", borderWidth: 0.5, textStyle: { ...baseFont, color: "#111110", fontSize: 12 } },
    dataZoom: dZoom,
    xAxis: isHorizontal ? valAxis : catAxis,
    yAxis: isHorizontal ? catAxis : valAxis,
  };

  if (block.chartType === "line" || block.chartType === "area") {
    return { 
      ...commonAxes, 
      series: [{ 
        name: block.yCol, data: values, type: "line", smooth: true, symbol: "circle", symbolSize: 6, 
        lineStyle: { color: activeColor, width: 2 }, 
        itemStyle: { color: activeColor, borderColor: "#fff", borderWidth: 2 }, 
        areaStyle: block.chartType === "area" ? { color: activeColor, opacity: 0.1 } : undefined 
      }] 
    };
  }
  
  if (block.chartType === "scatter") {
    // For scatter, x is index and y is value just for visual since we map categorical
    const scatterData = labels.map((l, i) => isHorizontal ? [values[i], l] : [l, values[i]]);
    return {
       ...commonAxes,
       xAxis: { ...commonAxes.xAxis, boundaryGap: true },
       series: [{ name: block.yCol, data: scatterData, type: "scatter", symbolSize: 10, itemStyle: { color: activeColor } }]
    };
  }

  // Default Bar
  return { 
    ...commonAxes, 
    series: [{ 
      name: block.yCol, data: values, type: "bar", barWidth: "40%", 
      itemStyle: { borderRadius: isHorizontal ? [0, 3, 3, 0] : [3, 3, 0, 0], color: activeColor } 
    }] 
  };
}

/* ─────────────────────────────────────────────
   Helper Functions
───────────────────────────────────────────── */
function getBlockIcon(block: BlockData) {
  if (block.type === "text") return AlignLeft;
  if (block.type === "kpi") return Monitor;
  if (block.type === "table") return Table;
  if (block.type === "image") return ImageIcon;
  if (block.type === "shape") return Square;
  if (block.type === "meta") return Type;
  switch (block.chartType) {
    case "bar": return BarChart3;
    case "line": case "area": return LineChart;
    case "pie": case "donut": return PieChart;
    case "scatter": return MousePointer;
    default: return BarChart3;
  }
}

function getDefaultBlockName(tmpl: { type: string; chartType?: string }): string {
  if (tmpl.type === "text") return "Metin";
  if (tmpl.type === "kpi") return "KPI Kart";
  if (tmpl.type === "table") return "Tablo";
  if (tmpl.type === "image") return "Görsel";
  if (tmpl.type === "shape") return "Şekil";
  if (tmpl.type === "meta") return "Sayfa Bilgisi";
  switch (tmpl.chartType) {
    case "bar": return "Sütun Grafik";
    case "line": return "Çizgi Grafik";
    case "area": return "Alan Grafik";
    case "pie": return "Pasta Grafik";
    case "donut": return "Donut Grafik";
    case "scatter": return "Dağılım Grafik";
    default: return "Grafik";
  }
}

/* ─────────────────────────────────────────────
   Custom Hooks
───────────────────────────────────────────── */
function useHistory<T>(initialState: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<T[]>([]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setPast(newPast);
    setFuture([present, ...future]);
    setPresent(previous);
  }, [past, present, future]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast([...past, present]);
    setFuture(newFuture);
    setPresent(next);
  }, [future, present, past]);

  const set = useCallback((newState: T | ((curr: T) => T)) => {
    setPresent((curr) => {
      const state = typeof newState === "function" ? (newState as Function)(curr) : newState;
      if (state === curr) return curr;
      setPast((p) => [...p, curr]);
      setFuture([]);
      return state;
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setPast([]);
    setPresent(newState);
    setFuture([]);
  }, []);

  return { state: present, set, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0, reset };
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
function CanvasUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang, setLang } = useLanguage();
  const reportId = searchParams.get("id");

  // Auth & Meta
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(reportId);
  const [reportTitle, setReportTitle] = useState("İsimsiz Rapor");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pdfMode, setPdfMode] = useState<"multipage" | "summary-table">("summary-table");
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // share menu dışına tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  // Data State
  const [data, setData] = useState<any[][]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  
  // Multi-CSV State
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string, name: string, data: any[][], columns: string[] }[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  
  // Canvas State — full history (blocks + orientation + pageCount)
  const history = useHistory<CanvasState>({ blocks: [], orientation: "portrait", pageCount: 1 });
  const canvasState = history.state;
  const blocks = canvasState.blocks;
  const canvasOrientation = canvasState.orientation;
  const pageCount = canvasState.pageCount;

  // Setters that push to history
  const setCanvasState = history.set;
  const setBlocks = (updater: BlockData[] | ((prev: BlockData[]) => BlockData[])) =>
    setCanvasState(prev => ({ ...prev, blocks: typeof updater === "function" ? updater(prev.blocks) : updater }));
  const setCanvasOrientation = (o: "portrait" | "landscape") =>
    setCanvasState(prev => ({ ...prev, orientation: o }));
  const setPageCount = (updater: number | ((prev: number) => number)) =>
    setCanvasState(prev => ({ ...prev, pageCount: typeof updater === "function" ? updater(prev.pageCount) : updater }));

  const [isGridSnapEnabled, setIsGridSnapEnabled] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const recMenuRef = useRef<HTMLDivElement>(null);

  // AI Panel open/close (mutually exclusive with right sidebar)
  const openAiPanel = useCallback(() => { setAiPanelOpen(true); setRightSidebarOpen(false); }, []);
  const closeAiPanel = useCallback(() => setAiPanelOpen(false), []);

  // Init
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.replace("/login"); return; }
      setUser({
        name: u.user_metadata?.full_name || u.email?.split("@")[0],
        email: u.email,
        avatar: u.user_metadata?.avatar_url,
        id: u.id
      });
      
      // Son analizi çek
      supabase.from("data_analyses")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data: analyses }) => {
          if (analyses && analyses.length > 0) {
            setRecommendations(analyses[0].recommendations || []);
          }
        });
    });
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (recMenuRef.current && !recMenuRef.current.contains(e.target as Node)) {
        setRecommendationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const AvatarEl = () => {
    if (user?.avatar) return <img src={user.avatar} alt="Avatar" />;
    const initials = String(user?.name || "?").substring(0, 2).toUpperCase();
    return <span>{initials}</span>;
  };

  useEffect(() => {
    const initCanvas = async () => {
      // Handle addChart if present
      const addChartParam = searchParams.get("addChart");
      if (addChartParam) {
        try {
          const spec = JSON.parse(decodeURIComponent(addChartParam));
          setBlocks(prev => [
            ...prev,
            {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              type: "chart",
              chartType: spec.type === 'donut' ? 'donut' : spec.type,
              xCol: spec.x_column,
              yCol: spec.y_column,
              name: spec.title,
              x: 50,
              y: 50,
              w: 400,
              h: 300,
              z: prev.length + 1,
              pageIndex: 0
            } as BlockData
          ]);
          // Clean URL
          window.history.replaceState(null, "", window.location.pathname + (reportId ? `?id=${reportId}` : ""));
        } catch (e) {
          console.error("Invalid addChart param", e);
        }
      }

      if (reportId) {
        const { data: report, error } = await supabase.from("reports").select("*").eq("id", reportId).single();
        if (error || !report) return;
        setCurrentReportId(report.id);
        setReportTitle(report.title ?? "İsimsiz Rapor");
        
        const rd = report.raw_data as any;
        if (rd?.columns) {
          setColumns(rd.columns); 
          if (rd.compressed_rows) {
            const decompressed = await decompressData(rd.compressed_rows);
            setData(decompressed);
          } else if (rd.rows) {
            setData(rd.rows);
          }
        }
        const cc = report.chart_config as any;
        if (cc) {
          const savedBlocks: BlockData[] = cc.blocks || [];
          const savedOrientation: "portrait" | "landscape" = cc.orientation || "portrait";
          const savedPageCount: number = cc.pageCount || 1;
          if (!addChartParam) {
            history.reset({ blocks: savedBlocks, orientation: savedOrientation, pageCount: savedPageCount });
          } else {
            // Merge saved blocks with the new chart block appended by addChart handler above
            setCanvasState(prev => ({ ...prev, blocks: [...savedBlocks, ...prev.blocks], orientation: savedOrientation, pageCount: savedPageCount }));
          }
        }
      } else {
        // Load draft data if arriving from analyzer
        try {
          const { loadDraftData, clearDraftData } = await import("../../app/utils/draftStorage");
          const draftData = await loadDraftData();
          if (draftData && draftData.columns && draftData.rows) {
            setColumns(draftData.columns);
            setData(draftData.rows);
            // Optionally clear it to prevent stale data on manual refresh, but keeping it is safer for reloads
            await clearDraftData();
          }
        } catch (e) {
          console.error("Failed to load draft data", e);
        }
      }
    };
    initCanvas();
  }, [reportId, searchParams]);

  // Helpers
  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaveStatus("saving");
    const compressedRows = await compressData(data);
    const raw_data = { columns, compressed_rows: compressedRows };
    const chart_config = { blocks: canvasState.blocks, orientation: canvasState.orientation, pageCount: canvasState.pageCount };

    let error;
    if (currentReportId) {
      ({ error } = await supabase.from("reports")
        .update({ title: reportTitle, raw_data, chart_config, updated_at: new Date().toISOString() })
        .eq("id", currentReportId));
    } else {
      const { data: newReport, error: insertError } = await supabase.from("reports")
        .insert({ user_id: user.id, title: reportTitle, raw_data, chart_config })
        .select("id").single();
      error = insertError;
      if (newReport) {
        setCurrentReportId(newReport.id);
        window.history.replaceState(null, "", `/canvas?id=${newReport.id}`);
      }
    }
    if (error) {
      setSaveStatus("error"); showToast("Kaydetme başarısız: " + error.message, "error");
    } else {
      setSaveStatus("saved"); showToast("Rapor kaydedildi ✦");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [user, currentReportId, reportTitle, columns, data, canvasState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); history.undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); history.redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, history]);

  // Ctrl+Scroll ile zoom
  useEffect(() => {
    const canvasEl = document.querySelector('.canvas-main');
    if (!canvasEl) return;
    const handleWheel = (e: Event) => {
      const we = e as WheelEvent;
      if (we.ctrlKey || we.metaKey) {
        we.preventDefault();
        setCanvasZoom(z => Math.min(200, Math.max(25, z - Math.round(we.deltaY / 5))));
      }
    };
    canvasEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvasEl.removeEventListener('wheel', handleWheel);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadedFiles.length >= 3) {
      showToast("En fazla 3 dosya yükleyebilirsiniz.");
      return;
    }

    if (uploadedFiles.some(f => f.name === file.name)) {
      showToast("Bu dosya zaten yüklü.");
      return;
    }
    
    setIsUploadingCsv(true);
    showToast("Verileriniz işleniyor, lütfen bekleyin...");
    
    // UI'ın render olabilmesi için ağır okuma işlemini biraz geciktiriyoruz
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target?.result, { type: "binary", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false, dateNF: "dd.mm.yyyy" });
        if (json.length) {
          const cols = json[0] as string[];
          const newFile = {
            id: "file_" + Date.now(),
            name: file.name,
            data: json.slice(1) as any[][],
            columns: cols
          };
          
          setUploadedFiles(prev => [...prev, newFile]);
          setActiveFileId(newFile.id);
          setColumns(newFile.columns);
          setData(newFile.data);
          setSaveStatus("idle");
        }
        setIsUploadingCsv(false);
      };
      reader.readAsBinaryString(file);
    }, 100);
  };

  // Block Operations
  const addBlock = (tmpl: any) => {
    const pageW = canvasOrientation === "portrait" ? 794 : 1123;
    const pageH = canvasOrientation === "portrait" ? 1123 : 794;
    
    // Add to the last used page or page 0
    const targetPage = selectedBlockId ? (blocks.find(b => b.id === selectedBlockId)?.pageIndex || 0) : 0;
    
    const pageBlocks = blocks.filter(b => (b.pageIndex || 0) === targetPage);
    const safeX = Math.max(10, Math.min(50 + ((pageBlocks.length * 30) % Math.max(1, pageW - tmpl.w - 60)), pageW - tmpl.w - 10));
    const safeY = Math.max(12, Math.min(50 + ((pageBlocks.length * 30) % Math.max(1, pageH - tmpl.h - 60)), pageH - tmpl.h - 10));
    
    const newBlock: BlockData = {
      id: "block_" + Date.now(),
      name: getDefaultBlockName(tmpl),
      type: tmpl.type,
      x: safeX, y: safeY,
      w: tmpl.w, h: tmpl.h,
      pageIndex: targetPage,
      chartType: tmpl.chartType,
      shapeType: tmpl.shapeType,
      metaType: tmpl.metaType,
      direction: "vertical",
      palette: "ink",
      showLegend: true, showGrid: true,
      xCol: columns[0] || "",
      yCol: columns[1] || columns[0] || "",
      title: tmpl.type !== "chart" ? tmpl.label : undefined,
      content: tmpl.type === "text" ? "Buraya metin girin..." : undefined
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setSaveStatus("idle");
  };

  const updateBlock = (id: string, updates: Partial<BlockData>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    setSaveStatus("idle");
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
    setSaveStatus("idle");
  };

  const copyBlock = (id: string) => {
    const src = blocks.find(b => b.id === id);
    if (!src) return;
    const clone = { ...src, id: "block_" + Date.now(), name: (src.name || getDefaultBlockName(src)) + " (kopya)", x: src.x + 20, y: src.y + 20 };
    setBlocks([...blocks, clone]);
    setSelectedBlockId(clone.id);
  };

  const highlightBlock = useCallback((id: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedBlockId(id);
    highlightTimerRef.current = setTimeout(() => setHighlightedBlockId(null), 1800);
  }, []);

  const handleOrientationChange = (newOrientation: "portrait" | "landscape") => {
    const newW = newOrientation === "portrait" ? 794 : 1123;
    const newH = newOrientation === "portrait" ? 1123 : 794;
    // Push orientation + clamped blocks into history atomically
    setCanvasState(prev => ({
      ...prev,
      orientation: newOrientation,
      blocks: prev.blocks.map(b => ({
        ...b,
        x: Math.max(0, Math.min(b.x, newW - b.w)),
        y: Math.max(8, Math.min(b.y, newH - b.h)),
      }))
    }));
    setSaveStatus("idle");
  };

  const deletePage = (index: number) => {
    if (pageCount <= 1) return;
    // Atomically remove page blocks + decrement pageCount in history
    setCanvasState(prev => ({
      ...prev,
      pageCount: prev.pageCount - 1,
      blocks: prev.blocks
        .filter(b => (b.pageIndex || 0) !== index)
        .map(b => {
          const pIdx = b.pageIndex || 0;
          if (pIdx > index) return { ...b, pageIndex: pIdx - 1 };
          return b;
        })
    }));
    setSelectedBlockId(null);
  };

  // Export
  /* ── PDF Üretim Motoru ── */
  const handleExportPDF = async () => {
    setIsGenerating(true);
    setSelectedBlockId(null); // Remove selection outline before export

    try {
      // Wait for React to render without selections
      await new Promise(resolve => setTimeout(resolve, 100));

      const pdf = new jsPDF({
        orientation: canvasOrientation,
        unit: "px",
        format: canvasOrientation === "portrait" ? [794, 1123] : [1123, 794]
      });

      const pages = document.querySelectorAll('.a4-page');
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, width, height);
      }
      
      pdf.save(`${reportTitle.trim() || 'AuraData_Rapor'}.pdf`);
      showToast("PDF başarıyla oluşturuldu ✦");

    } catch (error) {
      console.error(error);
      showToast("PDF oluşturulurken bir hata oluştu.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportCanvas = async (format: "png" | "pdf") => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setSelectedBlockId(null); // hide selection outlines
    
    // allow react to re-render without selections
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(canvasRef.current!, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        if (format === "png") {
          const link = document.createElement("a");
          link.download = `${reportTitle}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        } else {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({
            orientation: canvasOrientation,
            unit: "px",
            format: canvasOrientation === "portrait" ? [794, 1123] : [1123, 794]
          });
          const width = pdf.internal.pageSize.getWidth();
          const height = pdf.internal.pageSize.getHeight();
          pdf.addImage(imgData, "PNG", 0, 0, width, height);
          pdf.save(`${reportTitle}.pdf`);
        }
        showToast(`${format.toUpperCase()} dışa aktarıldı ✦`);
      } catch (err) {
        showToast("Dışa aktarım hatası", "error");
      }
      setIsExporting(false);
    }, 100);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <>
      <style>{styles}</style>
      <div className="noise-overlay" />
      <div className="canvas-root">
        {isUploadingCsv && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 9999, 
            backgroundColor: "rgba(17, 17, 16, 0.4)", backdropFilter: "blur(2px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", color: "var(--cream)"
          }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: "1.2rem", fontWeight: 500, letterSpacing: "0.02em" }}>{t("canvas.processing")}</div>
          </div>
        )}
        {/* ── TOPBAR ── */}
        <header className="topbar">
          <div className="topbar-brand">
            <div className="topbar-logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }} title={t("common.backHome")}>A</div>
            <div className="topbar-doc">
              <input
                className="topbar-doc-name"
                value={reportTitle}
                onChange={(e) => { setReportTitle(e.target.value); setSaveStatus("idle"); }}
                onBlur={handleSave}
              />
              <span className="topbar-doc-status">
                {saveStatus === "saving" && t("canvas.saving")}
                {saveStatus === "saved"  && t("canvas.saved")}
                {saveStatus === "error"  && t("canvas.error")}
                {saveStatus === "idle"   && t("canvas.draft")}
              </span>
            </div>
          </div>
          
          <div className="topbar-breadcrumb">
            <button onClick={() => router.push("/dashboard")} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ink-soft)' }} title={t("common.goBack")}>
              <ArrowLeft size={14} />
            </button>
            <a href="/dashboard" style={{ marginLeft: "0.5rem" }}>{t("common.projects")}</a>
            <ChevronRight size={12} style={{ opacity: 0.4, margin: "0 0.25rem" }} />
            <span style={{ color: "var(--ink)" }}>{reportTitle}</span>
          </div>

          <div className="topbar-actions">
            <div style={{ display: "flex", gap: "0.25rem", marginRight: "1rem", borderRight: "1px solid var(--border)", paddingRight: "1rem" }}>
              <button className="topbar-tool-btn" onClick={() => history.undo()} disabled={!history.canUndo} title={t("common.undo")}><Undo2 size={16} /></button>
              <button className="topbar-tool-btn" onClick={() => history.redo()} disabled={!history.canRedo} title={t("common.redo")}><Redo2 size={16} /></button>
              <button className={`topbar-tool-btn${isGridSnapEnabled ? " active" : ""}`} onClick={() => setIsGridSnapEnabled(s => !s)} title={t("canvas.snapToGrid")}><Magnet size={16} /></button>
            </div>
            <ThemeToggle />
            <div style={{ marginRight: "0.5rem" }}><LanguageToggle /></div>
            <button className={`topbar-save-btn${saveStatus === "saved" ? " saved" : ""}`} onClick={handleSave} disabled={saveStatus === "saving"}>
              {saveStatus === "saving" ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={13} />}
              {saveStatus === "saved" ? t("canvas.saved") : t("canvas.save")}
            </button>
            {/* ── RECOMMENDED CHARTS BUTTON + DROPDOWN ── */}
            <div className="share-menu-wrap" ref={recMenuRef}>
              <button 
                className="topbar-save-btn" 
                onClick={() => setRecommendationsOpen(o => !o)}
                style={{ 
                  color: recommendations.length > 0 ? "var(--rose)" : "var(--ink-soft)",
                  borderColor: recommendations.length > 0 ? "var(--rose)" : "var(--border-strong)",
                  gap: "0.3rem"
                }}
              >
                <Sparkles size={13} /> {recommendations.length > 0 ? `${t("canvas.recommendations")} (${recommendations.length})` : t("canvas.recommendations")}
              </button>

              {recommendationsOpen && recommendations.length > 0 && (
                <div className="share-dropdown" style={{ width: "300px", maxHeight: "400px", overflowY: "auto" }}>
                  <div className="share-dropdown-header">{t("canvas.aiRecommendations")}</div>
                  
                  {recommendations.map((rec) => {
                    const isAlreadyOnCanvas = blocks.some(b => 
                      b.name === rec.title && 
                      b.xCol === rec.x_column && 
                      b.yCol === rec.y_column
                    );

                    return (
                      <div key={rec.id} style={{ padding: "0.75rem", borderBottom: "0.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "3px", background: "var(--cream-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--rose)" }}>
                            {rec.type === 'bar' && <BarChart3 size={14} />}
                            {rec.type === 'line' && <LineChart size={14} />}
                            {rec.type === 'pie' && <PieChart size={14} />}
                            {rec.type === 'scatter' && <MousePointer size={14} />}
                            {!['bar','line','pie','scatter'].includes(rec.type) && <BarChart3 size={14} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ink)", lineHeight: 1.2 }}>{rec.title}</div>
                            <div style={{ fontSize: "0.6rem", color: "var(--ink-muted)", marginTop: "2px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                              X: {rec.x_column} | Y: {rec.y_column}
                            </div>
                          </div>
                        </div>
                        <p style={{ fontSize: "0.7rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>{rec.description}</p>
                        <button
                          disabled={isAlreadyOnCanvas}
                          onClick={() => {
                          if (isAlreadyOnCanvas) return;
                            setBlocks(prev => [
                              ...prev,
                              {
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                type: "chart",
                                chartType: rec.type === 'donut' ? 'donut' : rec.type,
                                xCol: rec.x_column,
                                yCol: rec.y_column,
                                name: rec.title,
                                x: Math.floor(Math.random() * 100) + 50,
                                y: Math.floor(Math.random() * 100) + 50,
                                w: 400,
                                h: 300,
                                z: prev.length + 1,
                                pageIndex: 0
                              } as BlockData
                            ]);
                            setRecommendationsOpen(false);
                            showToast(t("canvas.addedToCanvas"));
                          }}
                          style={{
                            padding: "0.4rem",
                            background: isAlreadyOnCanvas ? "var(--cream-dark)" : "var(--ink)",
                            color: isAlreadyOnCanvas ? "var(--ink-muted)" : "white",
                            border: "none",
                            borderRadius: "3px",
                            fontSize: "0.7rem",
                            cursor: isAlreadyOnCanvas ? "not-allowed" : "pointer",
                            transition: "background 0.2s",
                            fontFamily: "'DM Sans', sans-serif"
                          }}
                        >
                          {isAlreadyOnCanvas ? t("canvas.alreadyOnCanvas") : t("canvas.addToCanvas")}
                        </button>
                      </div>
                    );
                  })}
                  {recommendations.length === 0 && (
                    <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                      {t("canvas.noRecommendations")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SHARE BUTTON + DROPDOWN ── */}
            <div className="share-menu-wrap" ref={shareMenuRef}>
              <button className="share-btn" onClick={() => setShareMenuOpen(o => !o)}>
                <Share2 size={13} /> {t("canvas.share")}
              </button>

              {shareMenuOpen && (
                <div className="share-dropdown">
                  <div className="share-dropdown-header">{t("canvas.export")}</div>

                  {/* PNG */}
                  <button className="share-item" onClick={() => { exportCanvas("png"); setShareMenuOpen(false); }}>
                    <div className="share-item-icon" style={{ background: "#f0ebe4" }}>
                      <FileImage size={14} style={{ color: "var(--ink-soft)" }} />
                    </div>
                    <div>
                      <div>{t("canvas.downloadPng")}</div>
                      <div className="share-item-desc">{t("canvas.screenshot")}</div>
                    </div>
                  </button>

                  {/* PDF */}
                  <button className="share-item" onClick={() => { handleExportPDF(); setShareMenuOpen(false); }} disabled={isGenerating}>
                    <div className="share-item-icon" style={{ background: "#fef0eb" }}>
                      {isGenerating
                        ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "var(--rose)" }} />
                        : <Download size={14} style={{ color: "var(--rose)" }} />
                      }
                    </div>
                    <div>
                      <div>{isGenerating ? t("canvas.preparing") : t("canvas.downloadPdf")}</div>
                      <div className="share-item-desc">{t("canvas.pdfMode")}</div>
                    </div>
                  </button>

                  <div className="share-sep" />
                  <div className="share-dropdown-header" style={{ borderTop: 'none' }}>{t("canvas.presentation")}</div>

                  {/* LIVE LINK */}
                  <button className="share-item" onClick={async () => {
                    const idToShare = currentReportId || "yeni-rapor";
                    if (currentReportId) await supabase.from("reports").update({ is_published: true }).eq("id", currentReportId);
                    const link = `${window.location.origin}/r/${idToShare}`;
                    setShareLink(link);
                    navigator.clipboard.writeText(link);
                    showToast(t("canvas.linkCopied"));
                    setShareMenuOpen(false);
                  }}>
                    <div className="share-item-icon" style={{ background: "#eaf2f0" }}>
                      <Link2 size={14} style={{ color: "var(--green)" }} />
                    </div>
                    <div>
                      <div>{t("canvas.liveLink")}</div>
                      <div className="share-item-desc">{t("canvas.scrollytelling")}</div>
                    </div>
                  </button>

                  {shareLink && (
                    <div style={{ margin: "0.5rem 0.875rem", padding: "0.4rem 0.5rem", background: "var(--cream)", borderRadius: "3px", fontSize: "0.67rem", color: "var(--ink-muted)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</span>
                      <button style={{ background: "var(--ink)", color: "var(--cream)", border: "none", padding: "2px 6px", borderRadius: "2px", cursor: "pointer", fontSize: "0.65rem", whiteSpace: "nowrap" }}
                        onClick={() => { navigator.clipboard.writeText(shareLink); showToast(t("canvas.linkCopied")); }}>{t("canvas.copy")}</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── ZOOM CONTROLS ── */}
            <div className="zoom-controls">
              <button
                className="zoom-btn"
                onClick={() => setCanvasZoom(z => Math.max(25, z - 10))}
                disabled={canvasZoom <= 25}
                title={t("canvas.zoomOut")} 
              >-</button>
              <span
                className="zoom-label"
                onClick={() => setCanvasZoom(100)}
                title={t("canvas.resetZoom")}
              >{canvasZoom}%</span>
              <button
                className="zoom-btn"
                onClick={() => setCanvasZoom(z => Math.min(200, z + 10))}
                disabled={canvasZoom >= 200}
                title={t("canvas.zoomIn")}
              >+</button>
            </div>
            
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
                  <button className="user-dropdown-item" onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </button>
                  <button className="user-dropdown-item" onClick={() => router.push("/settings")}>
                    {t("nav.settings")}
                  </button>
                  <button className="user-dropdown-item danger" onClick={handleSignOut}>
                    <LogOut size={14} /> {t("nav.signOut")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── WORKSPACE ── */}
        <div className="workspace" style={{ position: "relative" }}>
          {/* ── LEFT SIDEBAR ── */}
          <aside className={`sidebar${leftSidebarOpen ? "" : " collapsed"}`}>
            <div className="sidebar-header">
              <span className="sidebar-header-label"><FileSpreadsheet size={14} /> {t("canvas.dataSource")}</span>
              <button onClick={() => { setLeftSidebarOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", display: "flex", alignItems: "center", padding: "2px" }} title={t("canvas.closePanel")}>
                <ChevronLeft size={14} />
              </button>
            </div>
            <div className="sidebar-body">
              {uploadedFiles.length > 0 ? (
                <button 
                  onClick={() => setIsFileModalOpen(true)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--cream)", border: "0.5px solid var(--border-strong)", borderRadius: "2px", cursor: "pointer", marginBottom: "1.25rem", textAlign: "left", transition: "all 0.2s" }}
                >
                  <div style={{ background: "var(--white)", padding: "6px", borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid var(--border-mid)" }}>
                    <FileSpreadsheet size={16} style={{ color: "var(--green)" }} />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {uploadedFiles.find(f => f.id === activeFileId)?.name || "Bilinmeyen Dosya"}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                      {uploadedFiles.length} {t("canvas.filesUploaded")}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--ink-muted)" }} />
                </button>
              ) : (
                <label className="upload-zone">
                  <div className="upload-zone-icon"><FileSpreadsheet size={22} strokeWidth={1.25} /></div>
                  <div className="upload-zone-label">{t("canvas.clickToUpload")}</div>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              )}

              {columns.length > 0 && (
                <>
                  <div className="section-label">{t("canvas.columns")} ({columns.length})</div>
                  <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "1.5rem" }}>
                    {columns.map((col, i) => (
                      <div key={i} style={{ fontSize: "0.75rem", padding: "4px 8px", borderBottom: "0.5px solid var(--border)", color: "var(--ink-soft)" }}>
                        {col}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="sidebar-header-label" style={{ marginBottom: "0.75rem" }}><Plus size={14} /> {t("canvas.addBlock")}</div>
              <div className="block-add-grid">
                {blockTemplates.map((tmpl, i) => (
                  <button key={i} className="block-add-btn" onClick={() => addBlock(tmpl)}>
                    <tmpl.icon size={18} strokeWidth={1.5} />
                    <span className="block-add-label">{tmpl.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── LEFT COLLAPSED TAB (Veri) ── */}
          {!leftSidebarOpen && (
            <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "4px", zIndex: 20 }}>
              <button
                className="sidebar-tab sidebar-tab-left"
                style={{ position: "static", transform: "none" }}
                onClick={() => setLeftSidebarOpen(true)}
                title={t("canvas.openDataPanel")}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}



          {/* ── MAIN CANVAS ── */}
          <main className="canvas-main" onClick={(e) => { if (e.target === e.currentTarget) setSelectedBlockId(null); }}>
            <div
              className="canvas-zoom-wrapper"
              style={{ transform: `scale(${canvasZoom / 100})`, marginBottom: canvasZoom < 100 ? `${((canvasZoom / 100) - 1) * (canvasOrientation === 'portrait' ? 1123 : 794)}px` : 0, display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}
            >
              {Array.from({ length: pageCount }).map((_, pageIdx) => (
                <div key={pageIdx} className={`a4-page ${canvasOrientation}`} ref={pageIdx === 0 ? canvasRef : null} onClick={() => setSelectedBlockId(null)} style={{ position: "relative" }}>
                  {/* Header Strip Design */}
                  <div style={{ height: "6px", background: "var(--ink)", width: "100%" }} />
                  
                  {/* Sayfa Silme Butonu */}
                  {pageCount > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePage(pageIdx); }} 
                      style={{ position: "absolute", right: "-32px", top: "0", background: "var(--white)", border: "1px solid var(--border-mid)", borderRadius: "4px", padding: "6px", cursor: "pointer", color: "var(--ink-muted)", zIndex: 10 }} 
                      title={`${t("canvas.deletePage")} ${pageIdx + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  
                  {/* Render Blocks */}
                  {blocks.filter(b => (b.pageIndex || 0) === pageIdx).map(block => {
                    const parseRes = (block.type === "chart" || block.type === "kpi" || block.type === "table") ? parseData(data, columns, block.xCol, block.yCol) : null;
                    const isSelected = selectedBlockId === block.id;

                    return (
                  <Rnd
                    key={block.id}
                    className={`block-rnd${isSelected ? " selected" : ""}${highlightedBlockId === block.id ? " highlighted" : ""}`}
                    size={{ width: block.w, height: block.h }}
                    position={{ x: block.x, y: block.y }}
                    scale={canvasZoom / 100}
                    disableDragging={block.locked}
                    enableResizing={!block.locked ? { top:true, right:true, bottom:true, left:true, topRight:true, bottomRight:true, bottomLeft:true, topLeft:true } : false}
                    style={{ zIndex: block.z || 1 }}
                    dragGrid={isGridSnapEnabled ? [20, 20] : [1, 1]}
                    resizeGrid={isGridSnapEnabled ? [20, 20] : [1, 1]}
                    onDragStop={(e, d) => updateBlock(block.id, { x: d.x, y: d.y })}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      updateBlock(block.id, { w: parseInt(ref.style.width), h: parseInt(ref.style.height), ...position });
                    }}
                    bounds="parent"
                    onClick={(e: any) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                    dragHandleClassName="block-drag-handle"
                  >
                    <div className="block-content block-drag-handle">
                      <div className="block-toolbar">
                        <button className="block-toolbar-btn" onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { z: (block.z || 1) + 1 }); }} title={t("canvas.bringForward")}><ArrowUpToLine size={12} /></button>
                        <button className="block-toolbar-btn" onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { z: Math.max(0, (block.z || 1) - 1) }); }} title={t("canvas.sendBackward")}><ArrowDownToLine size={12} /></button>
                        <button className="block-toolbar-btn" onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { locked: !block.locked }); }} title={block.locked ? t("canvas.unlock") : t("canvas.lock")}>
                          {block.locked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                        <button className="block-toolbar-btn" onClick={(e) => { e.stopPropagation(); copyBlock(block.id); }} title={t("canvas.duplicate")}><Copy size={12} /></button>
                        <button className="block-toolbar-btn" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} title={t("canvas.delete")}><Trash2 size={12} /></button>
                      </div>
                      {block.locked && <div className="block-locked-overlay" />}

                      {block.type === "chart" && parseRes && (
                        <div style={{ width: "100%", height: "100%" }}>
                          <ReactECharts 
                            option={buildChartOption(parseRes.labels, parseRes.values, block)} 
                            style={{ height: "100%", width: "100%" }} 
                            opts={{ renderer: "canvas" }} 
                          />
                        </div>
                      )}

                      {block.type === "kpi" && parseRes && (
                        <div className="block-kpi">
                          <div className="block-kpi-title">{block.title || "KPI"}</div>
                          <div className="block-kpi-value">{parseRes.kpiSum.toLocaleString("tr-TR")}</div>
                          <div style={{ fontSize: "0.6rem", color: "var(--ink-muted)", marginTop: "0.5rem" }}>{block.yCol} {t("canvas.total")}</div>
                        </div>
                      )}

                      {block.type === "text" && (
                        <div className="block-text">
                          {block.title && <h1>{block.title}</h1>}
                          {block.content && <p>{block.content}</p>}
                        </div>
                      )}

                      {block.type === "table" && parseRes && (
                        <div className="block-table" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--white)" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid var(--border-strong)", position: "sticky", top: 0, background: "var(--white)", zIndex: 1 }}>{block.xCol}</th>
                                <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid var(--border-strong)", position: "sticky", top: 0, background: "var(--white)", zIndex: 1 }}>{block.yCol}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parseRes.labels.slice(0, 50).map((lbl, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: "4px 8px", borderBottom: "0.5px solid var(--border)" }}>{lbl}</td>
                                  <td style={{ textAlign: "right", padding: "4px 8px", borderBottom: "0.5px solid var(--border)" }}>{parseRes.values[idx].toLocaleString("tr-TR")}</td>
                                </tr>
                              ))}
                              {parseRes.labels.length > 50 && (
                                <tr>
                                  <td colSpan={2} style={{ padding: "6px 8px", textAlign: "center", fontSize: "0.65rem", fontStyle: "italic", color: "var(--ink-muted)", background: "var(--cream)" }}>
                                    İlk 50 kayıt gösteriliyor (Toplam: {parseRes.labels.length})
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {block.type === "image" && (
                        <div className="block-image" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: block.content ? "transparent" : "var(--cream)", border: block.content ? "none" : "1px dashed var(--border-strong)", overflow: "hidden", borderRadius: "4px" }}>
                          {block.content ? (
                            <img src={block.content} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="Görsel" />
                          ) : (
                            <div style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: "0.8rem" }}>
                              <ImageIcon size={24} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                              <div>Resim Yükle</div>
                            </div>
                          )}
                        </div>
                      )}

                      {block.type === "shape" && (
                        <div className="block-shape" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {block.shapeType === "line" && <div style={{ width: "100%", height: "2px", background: palettes.find(p => p.key === block.palette)?.color || "var(--ink)" }} />}
                          {block.shapeType === "rect" && <div style={{ width: "100%", height: "100%", border: `2px solid ${palettes.find(p => p.key === block.palette)?.color || "var(--ink)"}`, borderRadius: "2px" }} />}
                          {block.shapeType === "arrow" && (
                            <div style={{ position: "relative", width: "100%", height: "2px", background: palettes.find(p => p.key === block.palette)?.color || "var(--ink)" }}>
                              <div style={{ position: "absolute", right: "-2px", top: "-4px", width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `8px solid ${palettes.find(p => p.key === block.palette)?.color || "var(--ink)"}` }} />
                            </div>
                          )}
                        </div>
                      )}

                      {block.type === "meta" && (
                        <div className="block-meta" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                          {block.metaType === "page" ? `Sayfa ${pageIdx + 1}` : new Date().toLocaleDateString("tr-TR")}
                        </div>
                      )}

                    </div>
                  </Rnd>
                );
              })}
              </div>
            ))}
            
            <button 
              onClick={() => setPageCount(p => p + 1)} 
              style={{ padding: "0.75rem 1rem", background: "var(--white)", border: "1px dashed var(--border-strong)", borderRadius: "4px", cursor: "pointer", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "0.5rem", width: canvasOrientation === "portrait" ? "794px" : "1123px", justifyContent: "center", transition: "all 0.15s" }}
            >
              <Plus size={16} /> Yeni Sayfa Ekle
            </button>
            </div>{/* zoom-wrapper */}
          </main>

          {/* ── RIGHT COLLAPSED TABS (Öğeler + AI) ── */}
          {!rightSidebarOpen && !aiPanelOpen && (
            <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "4px", zIndex: 20 }}>
              <button
                className="sidebar-tab sidebar-tab-right"
                style={{ position: "static", transform: "none" }}
                onClick={() => setRightSidebarOpen(true)}
                title="Öğeler ve Ayarlar Panelini Aç"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="sidebar-tab sidebar-tab-right"
                style={{ position: "static", transform: "none", color: "var(--rose)", borderTop: "0.5px solid var(--border-mid)" }}
                onClick={openAiPanel}
                title="AI Asistanı Aç"
              >
                <Sparkles size={15} />
              </button>
            </div>
          )}

          {/* ── RIGHT SIDEBAR ── */}
          <aside className={`sidebar sidebar-right${rightSidebarOpen ? "" : " collapsed"}`}>
            <div className="sidebar-header">
              <button onClick={() => setRightSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", display: "flex", alignItems: "center", padding: "2px" }} title="Paneli Kapat">
                <ChevronRight size={14} />
              </button>
              <span className="sidebar-header-label"><Layers size={14} /> Öğeler & Ayarlar</span>
            </div>
            <div className="sidebar-body">
              {/* ── Canvas Öğeleri ── */}
              <div className="section-label">Canvas Öğeleri ({blocks.length})</div>
              {blocks.length === 0 ? (
                <div className="items-empty">Henüz öğe eklenmedi.</div>
              ) : (
                <div className="items-list">
                  {blocks.map(block => {
                    const BlockIcon = getBlockIcon(block);
                    const isActive = selectedBlockId === block.id;
                    return (
                      <div key={block.id} className={`item-row${isActive ? " active" : ""}`}
                        onClick={() => { setSelectedBlockId(block.id); highlightBlock(block.id); }}>
                        <div className="item-icon"><BlockIcon size={13} /></div>
                        <input className="item-name"
                          value={block.name || getDefaultBlockName(block)}
                          onChange={e => updateBlock(block.id, { name: e.target.value })}
                          onClick={e => e.stopPropagation()} />
                        <button className="item-delete" onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} title="Sil">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ height: '0.5px', background: 'var(--border)', margin: '1rem 0' }} />

              {!selectedBlock && (
                <>
                  <div className="section-label">Sayfa Ayarları</div>
                  <div className="prop-group">
                    <span className="prop-label">Sayfa Yönü</span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => handleOrientationChange("portrait")}
                        style={{ flex: 1, padding: "0.5rem", background: canvasOrientation==="portrait" ? "var(--ink)" : "var(--cream)", color: canvasOrientation==="portrait" ? "var(--cream)" : "var(--ink)", border: "1px solid var(--border-mid)", borderRadius: "3px", cursor: "pointer", fontSize: "0.75rem" }}>
                        Dikey
                      </button>
                      <button 
                        onClick={() => handleOrientationChange("landscape")}
                        style={{ flex: 1, padding: "0.5rem", background: canvasOrientation==="landscape" ? "var(--ink)" : "var(--cream)", color: canvasOrientation==="landscape" ? "var(--cream)" : "var(--ink)", border: "1px solid var(--border-mid)", borderRadius: "3px", cursor: "pointer", fontSize: "0.75rem" }}>
                        Yatay
                      </button>
                    </div>
                  </div>
                  <div className="prop-group" style={{ marginTop: "1rem" }}>
                    <span className="prop-label">Sayfa Yönetimi</span>
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--cream)", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-mid)" }}>
                      <span>Toplam Sayfa: <b>{pageCount}</b></span>
                      <button onClick={() => setPageCount(p => p + 1)} style={{ background: "none", border: "none", color: "var(--rose)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Plus size={14} /> Ekle
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedBlock && (
                <>
                  <div className="section-label">Blok Ayarları</div>
                  
                  {pageCount > 1 && (
                    <div className="prop-group">
                      <span className="prop-label">Sayfa Numarası</span>
                      <select className="prop-select" value={selectedBlock.pageIndex || 0} onChange={e => updateBlock(selectedBlock.id, { pageIndex: parseInt(e.target.value) })}>
                        {Array.from({ length: pageCount }).map((_, i) => (
                          <option key={i} value={i}>Sayfa {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(selectedBlock.type === "chart" || selectedBlock.type === "kpi" || selectedBlock.type === "table") && (
                    <div className="prop-group">
                      <span className="prop-label">Veri Bağlantısı (X)</span>
                      <select className="prop-select" value={selectedBlock.xCol || ""} onChange={e => updateBlock(selectedBlock.id, { xCol: e.target.value })}>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      
                      <span className="prop-label">Veri Bağlantısı (Y)</span>
                      <select className="prop-select" value={selectedBlock.yCol || ""} onChange={e => updateBlock(selectedBlock.id, { yCol: e.target.value })}>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}

                  {selectedBlock.type === "chart" && (
                    <>
                      <div className="prop-group">
                        <span className="prop-label">Grafik Tipi</span>
                        <select className="prop-select" value={selectedBlock.chartType || "bar"} onChange={e => updateBlock(selectedBlock.id, { chartType: e.target.value as any })}>
                          <option value="bar">Sütun (Bar)</option>
                          <option value="line">Çizgi (Line)</option>
                          <option value="area">Alan (Area)</option>
                          <option value="pie">Pasta (Pie)</option>
                          <option value="donut">Donut</option>
                          <option value="scatter">Dağılım (Scatter)</option>
                        </select>
                      </div>

                      {["bar", "line", "area", "scatter"].includes(selectedBlock.chartType || "bar") && (
                        <div className="prop-group">
                          <span className="prop-label">Eksen Yönü</span>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button 
                              onClick={() => updateBlock(selectedBlock.id, { direction: "vertical" })}
                              style={{ flex: 1, padding: "0.5rem", background: selectedBlock.direction !== "horizontal" ? "var(--ink)" : "var(--cream)", color: selectedBlock.direction !== "horizontal" ? "var(--cream)" : "var(--ink)", border: "1px solid var(--border-mid)", borderRadius: "3px", cursor: "pointer", fontSize: "0.75rem" }}>
                              Dikey
                            </button>
                            <button 
                              onClick={() => updateBlock(selectedBlock.id, { direction: "horizontal" })}
                              style={{ flex: 1, padding: "0.5rem", background: selectedBlock.direction === "horizontal" ? "var(--ink)" : "var(--cream)", color: selectedBlock.direction === "horizontal" ? "var(--cream)" : "var(--ink)", border: "1px solid var(--border-mid)", borderRadius: "3px", cursor: "pointer", fontSize: "0.75rem" }}>
                              Yatay
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="prop-group">
                        <span className="prop-label">Renk Paleti</span>
                        <div className="palette-row">
                          {palettes.map((p) => (
                            <button key={p.key} className={`swatch${selectedBlock.palette === p.key ? " active" : ""}`}
                              style={{ background: p.color }} title={p.label}
                              onClick={() => updateBlock(selectedBlock.id, { palette: p.key })} />
                          ))}
                        </div>
                      </div>

                      <div className="prop-group">
                        <span className="prop-label">Görünüm</span>
                        <div className="toggle-row">
                          <span className="toggle-label">Lejant Göster</span>
                          <input type="checkbox" className="toggle-input" checked={selectedBlock.showLegend ?? false} onChange={(e) => updateBlock(selectedBlock.id, { showLegend: e.target.checked })} />
                        </div>
                        {selectedBlock.chartType !== "pie" && selectedBlock.chartType !== "donut" && (
                          <div className="toggle-row">
                            <span className="toggle-label">Izgara Çizgileri</span>
                            <input type="checkbox" className="toggle-input" checked={selectedBlock.showGrid ?? false} onChange={(e) => updateBlock(selectedBlock.id, { showGrid: e.target.checked })} />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "kpi" && (
                    <div className="prop-group">
                      <span className="prop-label">KPI Başlığı</span>
                      <input className="prop-input" value={selectedBlock.title || ""} onChange={e => updateBlock(selectedBlock.id, { title: e.target.value })} />
                    </div>
                  )}

                  {selectedBlock.type === "text" && (
                    <div className="prop-group">
                      <span className="prop-label">Başlık</span>
                      <input className="prop-input" value={selectedBlock.title || ""} onChange={e => updateBlock(selectedBlock.id, { title: e.target.value })} />
                      <span className="prop-label">Metin İçeriği</span>
                      <textarea className="prop-input" style={{ height: "100px", resize: "none" }} value={selectedBlock.content || ""} onChange={e => updateBlock(selectedBlock.id, { content: e.target.value })} />
                    </div>
                  )}

                  {selectedBlock.type === "image" && (
                    <div className="prop-group">
                      <span className="prop-label">Görsel Yükle (Max 1MB)</span>
                      <label className="prop-select" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", cursor: "pointer", background: "var(--cream)" }}>
                        <ImageIcon size={16} /> Dosya Seç
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 1024 * 1024) {
                            alert("Dosya çok büyük (Max 1MB)");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            updateBlock(selectedBlock.id, { content: ev.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                      {selectedBlock.content && (
                        <button onClick={() => updateBlock(selectedBlock.id, { content: "" })} style={{ marginTop: "0.5rem", width: "100%", padding: "0.5rem", background: "#fef3f0", color: "var(--rose)", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "0.75rem" }}>
                          Görseli Kaldır
                        </button>
                      )}
                    </div>
                  )}

                  {selectedBlock.type === "shape" && (
                    <div className="prop-group">
                      <span className="prop-label">Şekil Tipi</span>
                      <select className="prop-select" value={selectedBlock.shapeType || "rect"} onChange={e => updateBlock(selectedBlock.id, { shapeType: e.target.value as any })}>
                        <option value="line">Çizgi</option>
                        <option value="rect">Dikdörtgen Çerçeve</option>
                        <option value="arrow">Ok</option>
                      </select>
                      
                      <span className="prop-label" style={{ marginTop: "1rem" }}>Renk Paleti</span>
                      <div className="palette-row">
                        {palettes.map((p) => (
                          <button key={p.key} className={`swatch${selectedBlock.palette === p.key ? " active" : ""}`}
                            style={{ background: p.color }} title={p.label}
                            onClick={() => updateBlock(selectedBlock.id, { palette: p.key })} />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === "meta" && (
                    <div className="prop-group">
                      <span className="prop-label">Bilgi Tipi</span>
                      <select className="prop-select" value={selectedBlock.metaType || "page"} onChange={e => updateBlock(selectedBlock.id, { metaType: e.target.value as any })}>
                        <option value="page">Sayfa Numarası</option>
                        <option value="date">Bugünün Tarihi</option>
                      </select>
                    </div>
                  )}

                </>
              )}


            </div>
          </aside>

          {/* ── AI PANEL ── */}
          <aside className={`sidebar sidebar-right${aiPanelOpen ? "" : " collapsed"}`} style={{ padding: 0, overflow: "hidden", width: aiPanelOpen ? 400 : 0 }}>
            <CanvasAiPanel
              isOpen={aiPanelOpen}
              onClose={closeAiPanel}
              columns={columns}
              data={data}
              onAddChart={(spec) => {
                setBlocks(prev => [
                  ...prev,
                  {
                    id: "ai-" + Date.now(),
                    type: "chart",
                    chartType: (spec.type === "donut" ? "donut" : spec.type) as any,
                    xCol: spec.x_column,
                    yCol: spec.y_column,
                    name: spec.title,
                    x: Math.floor(Math.random() * 200) + 50,
                    y: Math.floor(Math.random() * 100) + 50,
                    w: 400, h: 300,
                    z: blocks.length + 1,
                    pageIndex: 0,
                    showLegend: true,
                    showGrid: true,
                    palette: "rose",
                    direction: "vertical",
                  } as any
                ]);
                setSaveStatus("idle");
              }}
            />
          </aside>
        </div>

        {/* ── FILE MANAGEMENT MODAL ── */}
        {isFileModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,16,0.2)", backdropFilter: "blur(2px)" }} onClick={() => setIsFileModalOpen(false)}>
            <div style={{ background: "var(--white)", width: "100%", maxWidth: "480px", borderRadius: "14px", boxShadow: "0 24px 48px rgba(17,17,16,0.1)", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>Yüklü Dosyalar</div>
                <button onClick={() => setIsFileModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", display: "flex", alignItems: "center" }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {uploadedFiles.map(file => {
                    const isActive = file.id === activeFileId;
                    return (
                      <div 
                        key={file.id} 
                        onClick={() => { setActiveFileId(file.id); setColumns(file.columns); setData(file.data); }}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "6px", border: `1px solid ${isActive ? "var(--ink)" : "var(--border-mid)"}`, background: isActive ? "var(--cream)" : "var(--white)", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--cream-dark)"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "var(--white)"; }}
                      >
                        <div style={{ background: "var(--white)", padding: "6px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid var(--border-mid)" }}>
                          <FileSpreadsheet size={18} style={{ color: "var(--green)" }} />
                        </div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: isActive ? 600 : 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: "0.65rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                            {file.columns.length} Sütun • {file.data.length.toLocaleString("tr-TR")} Satır
                          </div>
                        </div>
                        {isActive && <div style={{ fontSize: "0.6rem", background: "var(--ink)", color: "var(--cream)", padding: "2px 6px", borderRadius: "3px", fontWeight: 600 }}>Aktif</div>}
                      </div>
                    );
                  })}
                </div>
                
                {uploadedFiles.length < 3 && (
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.85rem", border: "1px dashed var(--border-strong)", borderRadius: "6px", marginTop: "1rem", cursor: "pointer", background: "var(--white)", color: "var(--ink-soft)", fontSize: "0.75rem", fontWeight: 500, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--cream)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--white)"; }}
                  >
                    <Plus size={16} />
                    Yeni Dosya Yükle ({3 - uploadedFiles.length} hakkınız kaldı)
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                )}
                {uploadedFiles.length >= 3 && (
                  <div style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "1rem" }}>
                    Maksimum dosya sınırına ulaştınız (3/3).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TOAST ── */}
        {toast && <div className={`toast${toast.type === "error" ? " error" : ""}`}>{toast.msg}</div>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default function CanvasPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa" }}>Loading...</div>}>
      <CanvasUI />
    </Suspense>
  );
}