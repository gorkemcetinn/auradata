import React from "react";
import UploadAndAnalyze from "../components/UploadAndAnalyze";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AnalyzerPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)] flex flex-col">
      {/* Basit Topbar */}
      <header className="h-16 bg-[var(--white)] border-b border-[var(--border-mid)] flex items-center px-8 sticky top-0 z-50">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-xs font-sans tracking-[0.1em] uppercase text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft size={16} />
          Dashboard'a Dön
        </Link>
        <div className="mx-auto font-serif text-lg text-[var(--ink)] tracking-wide">
          AuraData <span className="italic text-[var(--rose)]">Hızlı Analiz</span>
        </div>
        <div className="w-[120px]"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 py-12">
        <UploadAndAnalyze />
      </main>
    </div>
  );
}
