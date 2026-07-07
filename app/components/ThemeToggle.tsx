"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: 32, height: 32 }} />; // placeholder
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      style={{
        background: "transparent",
        border: "1px solid var(--border-mid)",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "var(--ink)",
        position: "relative",
        overflow: "hidden",
      }}
      aria-label="Toggle Dark Mode"
    >
      <div
        style={{
          position: "absolute",
          transition: "transform 0.4s ease, opacity 0.4s ease",
          transform: theme === "dark" ? "translateY(20px) rotate(90deg)" : "translateY(0) rotate(0)",
          opacity: theme === "dark" ? 0 : 1,
        }}
      >
        <Sun size={16} />
      </div>
      <div
        style={{
          position: "absolute",
          transition: "transform 0.4s ease, opacity 0.4s ease",
          transform: theme === "dark" ? "translateY(0) rotate(0)" : "translateY(-20px) rotate(-90deg)",
          opacity: theme === "dark" ? 1 : 0,
        }}
      >
        <Moon size={16} />
      </div>
    </button>
  );
}
