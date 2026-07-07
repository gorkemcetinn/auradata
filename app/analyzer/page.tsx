import React from "react";
import UploadAndAnalyze from "../components/UploadAndAnalyze";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AnalyzerPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      {/* Basit Topbar */}
      <header className="h-16 bg-white border-b border-[rgba(17,17,16,0.14)] flex items-center px-8 sticky top-0 z-50">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-xs font-sans tracking-[0.1em] uppercase text-[#999490] hover:text-[#111110] transition-colors"
        >
          <ArrowLeft size={16} />
          Dashboard'a Dön
        </Link>
        <div className="mx-auto font-serif text-lg text-[#111110] tracking-wide">
          AuraData <span className="italic text-[#c97b5a]">Hızlı Analiz</span>
        </div>
        <div className="w-[120px]"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 py-12">
        <UploadAndAnalyze />
      </main>
    </div>
  );
}
