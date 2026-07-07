"use client";

import { useLanguage } from "../../contexts/LanguageContext";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "tr" : "en")}
      style={{
        background: "transparent",
        border: "1px solid var(--border-mid)",
        borderRadius: "4px",
        width: "36px",
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "0.75rem",
        fontFamily: "inherit",
        color: "var(--ink)",
        position: "relative",
        overflow: "hidden",
      }}
      aria-label="Toggle Language"
    >
      <div
        style={{
          position: "absolute",
          transition: "transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.4s ease",
          transform: lang === "en" ? "translateY(0)" : "translateY(20px)",
          opacity: lang === "en" ? 1 : 0,
          fontWeight: 500,
        }}
      >
        EN
      </div>
      <div
        style={{
          position: "absolute",
          transition: "transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.4s ease",
          transform: lang === "tr" ? "translateY(0)" : "translateY(-20px)",
          opacity: lang === "tr" ? 1 : 0,
          fontWeight: 500,
        }}
      >
        TR
      </div>
    </button>
  );
}
