"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "../locales/en";
import { tr } from "../locales/tr";

type Language = "en" | "tr";
type Dictionary = typeof en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof Dictionary) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "tr")) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const t = (key: keyof Dictionary): string => {
    const dict = lang === "tr" ? tr : en;
    return dict[key] || key;
  };

  // Prevent hydration mismatch by returning null until mounted, 
  // or just render but wait for effect. 
  // To avoid flicker, we can just render. Since default is "en", server renders "en".

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
