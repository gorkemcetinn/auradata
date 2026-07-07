"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Sparkles, X, Send, BarChart3, LineChart, PieChart, MousePointer, Plus, ChevronRight } from "lucide-react";
import ReactECharts from "echarts-for-react";

/* ─── Types ────────────────────────────────────── */
interface ChartSpec {
  type: "bar" | "line" | "pie" | "donut" | "scatter" | "area";
  x_column: string;
  y_column: string;
  title: string;
  description?: string;
}

interface AiMessage {
  role: "user" | "ai";
  type: "text" | "chart";
  content: string;
  chart?: ChartSpec;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  data: any[][];
  onAddChart: (spec: ChartSpec) => void;
}

/* ─── Quick Prompts (Dynamic) ────────────── */

/* ─── Chart Icon ────────────────────────────────── */
function ChartIcon({ type }: { type: string }) {
  const props = { size: 14 };
  if (type === "line" || type === "area") return <LineChart {...props} />;
  if (type === "pie" || type === "donut") return <PieChart {...props} />;
  if (type === "scatter") return <MousePointer {...props} />;
  return <BarChart3 {...props} />;
}

/* ─── Mini ECharts Preview ──────────────────────── */
function MiniChart({ chart, columns, data }: { chart: ChartSpec; columns: string[]; data: any[][] }) {
  const xIdx = columns.indexOf(chart.x_column);
  const yIdx = columns.indexOf(chart.y_column);

  if (xIdx === -1 || yIdx === -1 || data.length === 0) {
    return (
      <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#999490", fontSize: "0.75rem" }}>
        Sütunlar veri kaynağında bulunamadı
      </div>
    );
  }

  // Aggregate
  const agg: Record<string, number> = {};
  data.forEach(row => {
    const x = String(row[xIdx] ?? "").trim();
    const y = parseFloat(String(row[yIdx] ?? "").replace(",", "."));
    if (x && !isNaN(y)) agg[x] = (agg[x] || 0) + y;
  });

  const labels = Object.keys(agg);
  const values = labels.map(l => agg[l]);
  const color = "#c97b5a";

  const isPie = chart.type === "pie" || chart.type === "donut";
  const radius = chart.type === "donut" ? ["35%", "65%"] : ["0%", "65%"];

  const option = isPie
    ? {
      tooltip: { trigger: "item" },
      series: [{ type: "pie", radius, data: labels.map((l, i) => ({ name: l, value: values[i] })), label: { fontSize: 9 } }],
      color: ["#111110", "#c97b5a", "#e8c4b0", "#87a99c", "#4a6f7c", "#4a7c6f"],
    }
    : {
      xAxis: { type: "category", data: labels, axisLabel: { fontSize: 9, hideOverlap: true, formatter: (v: string) => v.length > 8 ? v.substring(0, 8) + "…" : v } },
      yAxis: { type: "value", axisLabel: { fontSize: 9 } },
      series: [{ type: chart.type === "line" || chart.type === "area" ? "line" : "bar", data: values, itemStyle: { color }, areaStyle: chart.type === "area" ? { color, opacity: 0.15 } : undefined }],
      grid: { top: 10, right: 10, bottom: 30, left: 40 },
      tooltip: { trigger: "axis" },
    };

  return (
    <ReactECharts
      option={option}
      style={{ height: 140, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}

/* ─── Main Component ───────────────────────────── */
export default function CanvasAiPanel({ isOpen, onClose, columns, data, onAddChart }: Props) {
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "ai", type: "text", content: "Merhaba! Canvas'taki veri setini analiz edebilir, grafik önerebilir veya istediğiniz grafiği çizebilirim. Ne yapmamı istersiniz?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const objectData = useMemo(() => {
    return data.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
  }, [data, columns]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    if (columns.length > 0 && data.length > 0) {
      const fetchSuggestions = async () => {
        setIsLoadingPrompts(true);
        try {
          const sample = data.slice(0, 5).map(row =>
            Object.fromEntries(columns.map((col, i) => [col, row[i]]))
          );
          
          const res = await fetch("/api/canvas-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              message: "[SİSTEM MESAJI] Kullanıcı yeni bir veri yükledi. Lütfen bu veri setini analiz etmek için kullanıcıya 4 adet çok kısa (max 3-4 kelime) prompt önerisi oluştur. Yanıt SADECE JSON array olmalıdır ve format [\"Öneri 1\", \"Öneri 2\", \"Öneri 3\", \"Öneri 4\"] şeklinde olmalıdır. Başka hiçbir metin ekleme.", 
              columns, 
              sample_rows: sample, 
              history: [] 
            }),
          });
          
          if (res.ok) {
            const result = await res.json();
            const content = result.content || result.text || "";
            try {
               const parsed = JSON.parse(content);
               if (Array.isArray(parsed)) {
                 setQuickPrompts(parsed.slice(0, 4));
               }
            } catch (e) {
               const match = content.match(/\[[\s\S]*\]/);
               if (match) {
                 const parsed = JSON.parse(match[0]);
                 if (Array.isArray(parsed)) setQuickPrompts(parsed.slice(0, 4));
               }
            }
          }
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        } finally {
          setIsLoadingPrompts(false);
        }
      };
      
      // We only fetch if it's open, or maybe just once when data changes?
      fetchSuggestions();
    } else {
      setQuickPrompts([]);
    }
  }, [columns, data]);

  const sendMessage = useCallback(async (text?: string, isSystem = false, retryCount = 0, passedHistory?: AiMessage[]) => {
    const userText = (text ?? input).trim();
    if (!userText && !isSystem) return;

    if (!isSystem) setInput("");

    // Geçmişe eklenecek mesaj
    const messageToAdd: AiMessage = isSystem
      ? { role: "user", type: "text", content: userText } // System promptları da history'ye eklenecek ki AI anlasın
      : { role: "user", type: "text", content: userText };

    const currentHistory = passedHistory || messages;
    const newMessages: AiMessage[] = [...currentHistory, messageToAdd];
    setMessages(newMessages);

    // Eğer sadece gizli bir sonuç ekliyorsak, loading animasyonunu başlat
    setIsLoading(true);

    try {
      // Prepare 5-row sample from data
      const sample = data.slice(0, 5).map(row =>
        Object.fromEntries(columns.map((col, i) => [col, row[i]]))
      );

      // Build conversation history for context (last 10 msgs)
      const history = newMessages.slice(-10).map(m => ({ role: m.role, text: m.content }));

      const res = await fetch("/api/canvas-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: isSystem ? userText : userText, columns, sample_rows: sample, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();

      // Eğer AI kod çalıştırmak istiyorsa (query)
      if (result.type === "query" && result.code) {
        const loadingMsg: AiMessage = { role: "ai", type: "text", content: result.content || "Veritabanı taranıyor..." };
        setMessages(prev => [...prev, loadingMsg]);
        const nextHistory = [...newMessages, loadingMsg];

        try {
          // Web Worker Sandbox (DOM/Window Isolation + Timeout Protection)
          const workerCode = `
            self.onmessage = function(e) {
              try {
                const { data, columns } = e.data;
                const func = new Function('data', 'columns', ${JSON.stringify(result.code)});
                const res = func(data, columns);
                self.postMessage({ success: true, result: res });
              } catch (err) {
                self.postMessage({ success: false, error: err.message });
              }
            };
          `;

          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          const worker = new Worker(workerUrl);

          const queryResult = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              reject(new Error("Timeout: Kod 3 saniyede tamamlanamadı (Sonsuz döngü veya aşırı yük)."));
            }, 3000);

            worker.onmessage = (e) => {
              clearTimeout(timeout);
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              if (e.data.success) {
                resolve(e.data.result);
              } else {
                reject(new Error(e.data.error));
              }
            };

            worker.postMessage({ data: objectData, columns });
          });

          // Truncation Logic (Safe Serialization)
          let safeResult = queryResult;
          if (Array.isArray(safeResult) && safeResult.length > 15) {
            safeResult = [...safeResult.slice(0, 15), { _warning: "...ve " + (safeResult.length - 15) + " kayıt daha" }];
          } else if (safeResult && typeof safeResult === 'object') {
            const newObj: any = { ...safeResult };
            for (const key in newObj) {
              if (Array.isArray(newObj[key]) && newObj[key].length > 15) {
                newObj[key] = [...newObj[key].slice(0, 15), { _warning: "...ve " + (newObj[key].length - 15) + " kayıt daha" }];
              }
            }
            safeResult = newObj;
          }

          const stringified = JSON.stringify(safeResult);
          if (stringified && stringified.length > 3000) {
            throw new Error("Sonuç çok büyük (3000+ karakter). Lütfen aggregasyon (örn. limit, count) kullanarak daha spesifik bir sorgu yazın.");
          }

          // Çıkan sonucu gizli bir mesaj olarak tekrar AI'a gönderiyoruz
          const systemMsg = `[SİSTEM MESAJI - KULLANICIYA GÖSTERME] Kod başarıyla çalıştı. Sonuç: ${stringified}. Lütfen bu sonuca göre kullanıcıya Türkçe ve anlaşılır bir cevap ver.`;

          // Recursive çağrı (isSystem = true)
          await sendMessage(systemMsg, true, 0, nextHistory);
        } catch (evalError: any) {
          console.error("Query Eval Error:", evalError);
          if (retryCount < 1) {
            const errorMsg = `[SİSTEM MESAJI] Kod çalıştırılırken hata oluştu: ${evalError.message}. Aynı hatayı tekrarlama, kolon isimlerini 'columns' listesinden doğrula ve kodu düzeltip Format 3 ile dön.`;
            await sendMessage(errorMsg, true, retryCount + 1, nextHistory);
          } else {
            setMessages(prev => [...prev, { role: "ai", type: "text", content: "Veriniz taranırken bir hata oluştu ve aşılamadı. Lütfen farklı bir şekilde sormayı deneyin." }]);
          }
        }
        return; // Normal sonlandırmayı atla, recursive çağrı devam edecek
      }

      // Normalize the response (chart or text)
      const aiMessage: AiMessage = {
        role: "ai",
        type: result.type === "chart" ? "chart" : "text",
        content: result.content || result.text || "Yanıt alınamadı.",
        chart: result.chart,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", type: "text", content: "Üzgünüm, bir hata oluştu. n8n canvas-chat flow'unun aktif olduğundan emin olun." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, columns, data, objectData]);

  // Styles
  const panelStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: "var(--white, #fff)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div className="sidebar-header" style={{ height: 44, borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", padding: "0 1rem", flexShrink: 0, background: "var(--white)" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", display: "flex", alignItems: "center", padding: "2px", marginRight: "8px" }} title="Paneli Kapat">
          <ChevronRight size={14} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999490", fontWeight: 400 }}>
          <Sparkles size={14} style={{ color: "#c97b5a" }} />
          AI Asistanı
        </div>
      </div>

      {/* Context strip */}
      {columns.length > 0 && (
        <div style={{ padding: "0.5rem 1rem", background: "#faf8f5", borderBottom: "0.5px solid rgba(17,17,16,0.08)", fontSize: "0.65rem", color: "#999490", flexShrink: 0 }}>
          <span style={{ color: "#c97b5a", fontWeight: 500 }}>{columns.length} sütun</span>
          {" · "}
          {data.length.toLocaleString("tr-TR")} satır
          {" · "}
          <span style={{ opacity: 0.7 }}>{columns.slice(0, 3).join(", ")}{columns.length > 3 ? "…" : ""}</span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

        {/* Quick prompts (only show when just greeting message) */}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {isLoadingPrompts ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#999490", fontSize: "0.72rem", padding: "0.4rem 0.75rem" }}>
                <Sparkles size={12} style={{ color: "#c97b5a", animation: "spin 2s linear infinite" }} />
                Öneriler hazırlanıyor...
              </div>
            ) : quickPrompts.length > 0 ? (
              quickPrompts.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  style={{
                    background: "#faf8f5", border: "0.5px solid rgba(17,17,16,0.14)",
                    borderRadius: "12px", padding: "0.4rem 0.75rem",
                    fontSize: "0.72rem", color: "#4a4845", cursor: "pointer",
                    textAlign: "left", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#c97b5a")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(17,17,16,0.14)")}
                >
                  {p}
                </button>
              ))
            ) : columns.length === 0 && (
              <div style={{ fontSize: "0.72rem", color: "#999490", padding: "0.4rem 0.75rem" }}>
                Öneriler için bir CSV dosyası yükleyin.
              </div>
            )}
          </div>
        )}

        {messages.filter(m => !m.content.startsWith("[SİSTEM MESAJI")).map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: "0.5rem" }}>
            {/* Text bubble */}
            <div style={{
              background: m.role === "user" ? "#111110" : "#f0ebe4",
              color: m.role === "user" ? "#faf8f5" : "#111110",
              padding: "0.625rem 0.875rem", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              maxWidth: "90%", fontSize: "0.8rem", lineHeight: 1.5,
            }}>
              {m.content}
            </div>

            {/* Chart preview */}
            {m.type === "chart" && m.chart && (
              <div style={{
                width: "100%", background: "#fff", border: "0.5px solid rgba(17,17,16,0.14)",
                borderRadius: "10px", overflow: "hidden",
              }}>
                {/* Chart header */}
                <div style={{ padding: "0.5rem 0.75rem", borderBottom: "0.5px solid rgba(17,17,16,0.08)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "3px", background: "#f0ebe4", display: "flex", alignItems: "center", justifyContent: "center", color: "#c97b5a" }}>
                    <ChartIcon type={m.chart.type} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 500, color: "#111110" }}>{m.chart.title}</div>
                    <div style={{ fontSize: "0.6rem", color: "#999490", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      X: {m.chart.x_column} · Y: {m.chart.y_column}
                    </div>
                  </div>
                </div>

                {/* Mini chart */}
                <div style={{ padding: "0.5rem" }}>
                  {columns.length > 0 && data.length > 0
                    ? <MiniChart chart={m.chart} columns={columns} data={data} />
                    : <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", color: "#999490" }}>Veri kaynağı yüklenmeden önizleme yapılamaz</div>
                  }
                </div>

                {/* Add to canvas button */}
                <div style={{ padding: "0.5rem 0.75rem", borderTop: "0.5px solid rgba(17,17,16,0.08)" }}>
                  <button
                    onClick={() => onAddChart(m.chart!)}
                    style={{
                      width: "100%", padding: "0.4rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                      background: "#111110", color: "#faf8f5", border: "none", borderRadius: "8px",
                      fontSize: "0.7rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.08em", textTransform: "uppercase", transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#c97b5a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#111110")}
                  >
                    <Plus size={12} /> Tuvale Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.375rem", color: "#999490", fontSize: "0.75rem" }}>
            <Sparkles size={13} style={{ color: "#c97b5a", animation: "spin 2s linear infinite" }} />
            Düşünüyor…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "0.75rem", borderTop: "0.5px solid rgba(17,17,16,0.08)", display: "flex", gap: "0.5rem", background: "#fff", flexShrink: 0 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={columns.length > 0 ? "Grafik çiz veya veriyi analiz et…" : "Önce veri kaynağı yükleyin…"}
          disabled={isLoading}
          style={{
            flex: 1, padding: "0.5rem 0.75rem", border: "0.5px solid rgba(17,17,16,0.22)",
            borderRadius: "12px", fontSize: "0.78rem", outline: "none", color: "#111110",
            fontFamily: "'DM Sans', sans-serif", background: isLoading ? "#faf8f5" : "#fff",
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          style={{
            background: "#111110", color: "#faf8f5", border: "none", borderRadius: "12px",
            width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            opacity: isLoading || !input.trim() ? 0.4 : 1, transition: "opacity 0.15s, background 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={e => { if (!isLoading && input.trim()) e.currentTarget.style.background = "#c97b5a"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#111110"; }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
