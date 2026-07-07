"use client";

import React from "react";
import clsx from "clsx";

interface NarrativeBlockProps {
  narrative?: string | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function NarrativeBlock({ narrative, isLoading, error }: NarrativeBlockProps) {
  if (error) {
    return (
      <div className="p-6 bg-[#fef3f0] border-l-4 border-[#c97b5a] rounded-r-lg">
        <h4 className="font-serif text-[#111110] text-lg mb-2">Analiz Hatası</h4>
        <p className="font-sans text-[#c97b5a] text-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-[0_4px_24px_rgba(17,17,16,0.04)] border border-[rgba(17,17,16,0.08)] animate-pulse">
        <div className="h-6 w-1/3 bg-[#f0ebe4] rounded mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-[#faf8f5] rounded"></div>
          <div className="h-4 w-[90%] bg-[#faf8f5] rounded"></div>
          <div className="h-4 w-[95%] bg-[#faf8f5] rounded"></div>
          <div className="h-4 w-[60%] bg-[#faf8f5] rounded"></div>
        </div>
      </div>
    );
  }

  if (!narrative) return null;

  return (
    <div className="p-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(17,17,16,0.04)] border border-[rgba(17,17,16,0.08)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#c97b5a]"></div>
      <h3 className="font-serif text-2xl text-[#111110] mb-4">AuraData Yorumu</h3>
      <p className="font-sans text-[#4a4845] text-[0.95rem] leading-relaxed whitespace-pre-wrap">
        <span className="float-left text-5xl font-serif text-[#c97b5a] mt-[-6px] mr-3 leading-none">
          {narrative.charAt(0)}
        </span>
        {narrative.slice(1)}
      </p>
    </div>
  );
}
