"use client";

import React, { useState } from "react";
import FileUpload from "./FileUpload";
import ChartRenderer from "./ChartRenderer";
import NarrativeBlock from "./NarrativeBlock";
import { analyzeData, AnalyzeResponse, ChartSpec, ChartRecommendation } from "../../services/analyzeService";
import { RefreshCcw } from "lucide-react";

export default function UploadAndAnalyze() {
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, any>[] | null>(null);
  
  const [summary, setSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDataParsed = async (uploadedFile: File, parsedData: Record<string, any>[]) => {
    setFile(uploadedFile);
    setRawData(parsedData);
    setStatus("analyzing");
    setErrorMsg(null);
    setSummary(null);
    setRecommendations([]);

    try {
      const response = await analyzeData(uploadedFile, parsedData);
      setSummary(response.summary);
      setRecommendations(response.recommendations || []);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Analiz sırasında bir hata oluştu.");
    }
  };

  const handleRetry = () => {
    setFile(null);
    setRawData(null);
    setSummary(null);
    setRecommendations([]);
    setStatus("idle");
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 p-6">
      <div className="text-center mb-4">
        <h2 className="font-serif text-3xl md:text-4xl text-[var(--ink)] mb-3">
          Veri Analizi <em className="text-[var(--rose)] not-italic">Zekası</em>
        </h2>
        <p className="font-sans text-[var(--ink-soft)] text-sm md:text-base max-w-2xl mx-auto">
          Dosyanızı yükleyin, gerisini AuraData'nın yapay zekasına bırakın. Veriniz otomatik olarak analiz edilir ve en uygun görselleştirme ile birlikte yorumlanır.
        </p>
      </div>

      {(status === "idle" || status === "analyzing") && (
        <FileUpload 
          onDataParsed={handleDataParsed} 
          isLoading={status === "analyzing"} 
        />
      )}

      {status === "error" && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          <NarrativeBlock error={errorMsg} />
          <button 
            onClick={handleRetry}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-[var(--ink)] text-[var(--cream)] font-sans text-xs tracking-[0.1em] uppercase rounded-sm hover:bg-[var(--rose)] transition-colors"
          >
            <RefreshCcw size={16} /> Tekrar Dene
          </button>
        </div>
      )}

      {status === "success" && summary && rawData && (
        <div className="flex flex-col gap-8 w-full">
          {/* Summary Section */}
          <div className="bg-[var(--white)] border border-[var(--border-mid)] p-6 rounded-md shadow-md">
            <h3 className="font-serif text-xl text-[var(--ink)] mb-3">Veri Özeti</h3>
            <p className="font-sans text-[var(--ink-soft)] leading-relaxed text-sm md:text-base">
              {summary}
            </p>
          </div>

          {/* Recommendations Section */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[var(--border)]">
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-[var(--rose)]">
                Önerilen Grafikler
              </h3>
              <button 
                onClick={handleRetry}
                className="text-xs font-sans text-[var(--ink-muted)] hover:text-[var(--ink)] underline underline-offset-4"
              >
                Yeni Dosya Yükle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-[var(--white)] border border-[var(--border-mid)] p-5 rounded-md flex flex-col gap-4 shadow-md hover:border-[var(--rose)] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[var(--cream-dark)] flex items-center justify-center text-[var(--rose)]">
                      {rec.type === 'bar' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="5" width="4" height="16"/><rect x="17" y="16" width="4" height="5"/></svg>}
                      {rec.type === 'line' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18l6-6 4 4 8-8"/></svg>}
                      {rec.type === 'pie' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10v-10h10"/></svg>}
                      {rec.type === 'scatter' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="16" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="12" cy="12" r="2"/></svg>}
                      {!['bar','line','pie','scatter'].includes(rec.type) && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/></svg>}
                    </div>
                    <div>
                      <h4 className="font-serif text-[1.05rem] text-[var(--ink)] leading-tight">{rec.title}</h4>
                      <p className="font-sans text-[0.65rem] tracking-wider text-[var(--ink-muted)] uppercase mt-1">
                        X: {rec.x_column} | Y: {rec.y_column}
                      </p>
                    </div>
                  </div>
                  
                  <p className="font-sans text-[0.8rem] text-[var(--ink-soft)] leading-relaxed flex-1">
                    {rec.description}
                  </p>
                  
                  <button 
                    onClick={async () => {
                      // Navigate to canvas with this chart spec
                      const spec = encodeURIComponent(JSON.stringify(rec));
                      if (rawData && rawData.length > 0) {
                        try {
                          const columns = Object.keys(rawData[0] || {});
                          const rows = rawData.map(r => columns.map(c => r[c]));
                          const { saveDraftData } = await import("../utils/draftStorage");
                          await saveDraftData(columns, rows);
                        } catch (e) {
                          console.error("Draft save error", e);
                        }
                      }
                      window.location.href = `/canvas?addChart=${spec}`;
                    }}
                    className="w-full mt-2 py-2.5 bg-[var(--ink)] text-[var(--cream)] text-[0.75rem] font-sans tracking-[0.1em] uppercase rounded-sm hover:bg-[var(--rose)] transition-colors"
                  >
                    Tuvale Ekle
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
