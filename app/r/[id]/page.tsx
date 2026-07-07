"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../utils/supabase";
import ReactECharts from "echarts-for-react";
import { Loader2, Sparkles, TrendingUp, AlertCircle, BarChart2 } from "lucide-react";
import { decompressData } from "../../utils/compression";

/* ─────────────────────────────────────────────
   AuraData Scrollytelling Styles
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:        #faf8f5;
    --ink:          #111110;
    --ink-soft:     #4a4845;
    --ink-muted:    #999490;
    --rose:         #c97b5a;
    --border:       rgba(17,17,16,0.1);
  }

  body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); overflow-x: hidden; }

  /* ── HEADER ── */
  .presentation-header {
    position: fixed; top: 0; left: 0; right: 0; height: 72px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 3rem; background: rgba(250, 248, 245, 0.9);
    backdrop-filter: blur(12px); z-index: 100; border-bottom: 0.5px solid var(--border);
  }
  .brand-logo { font-family: 'Playfair Display', serif; font-size: 1.25rem; font-weight: 500; letter-spacing: 0.05em; }
  .brand-logo em { color: var(--rose); font-style: italic; }
  .report-badge { font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; border: 1px solid var(--ink); padding: 4px 10px; border-radius: 20px; }

  /* ── LAYOUT ── */
  .scrolly-container { display: flex; position: relative; width: 100%; }
  
  /* SOL: STICKY CHART */
  .scrolly-visual {
    width: 60%; height: 100vh; position: sticky; top: 0;
    display: flex; align-items: center; justify-content: center;
    padding: 3rem 3rem 3rem; border-right: 0.5px solid var(--border);
    background-color: var(--cream);
    background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .chart-frame {
    width: 100%; height: 100%; max-height: 600px;
    background: var(--cream); border: 0.5px solid var(--border);
    border-radius: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.05);
    padding: 2rem; position: relative; transition: all 0.5s ease;
  }

  /* SAĞ: SCROLLING TEXT */
  .scrolly-text { width: 40%; padding-top: 72px; padding-bottom: 50vh; }
  
  .step-block {
    min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
    padding: 0 4rem; opacity: 0.2; transition: opacity 0.6s ease, transform 0.6s ease;
    transform: translateY(30px);
  }
  .step-block.is-active { opacity: 1; transform: translateY(0); }
  
  .step-icon {
    width: 48px; height: 48px; background: var(--ink); color: var(--cream);
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; margin-bottom: 1.5rem;
  }
  .step-eyebrow { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--rose); margin-bottom: 1rem; display: block; }
  .step-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; line-height: 1.2; margin-bottom: 1.5rem; }
  .step-desc { font-size: 1.1rem; line-height: 1.8; color: var(--ink-soft); }
  .highlight-value { font-family: 'Playfair Display', serif; font-size: 3rem; color: var(--ink); display: block; margin: 1.5rem 0; }

  /* LOADING & ERROR */
  .center-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
`;

/* ─────────────────────────────────────────────
   Data Parser (Canvas'takiyle aynı)
───────────────────────────────────────────── */
function parseData(rawData: any[][], allColumns: string[], xCol: string, yCol: string) {
  const normalizedCols = allColumns.map(c => String(c).trim().toLowerCase());
  const xIdx = normalizedCols.indexOf(String(xCol).trim().toLowerCase());
  const yIdx = normalizedCols.indexOf(String(yCol).trim().toLowerCase());
  if (xIdx === -1 || yIdx === -1) return { labels: [], values: [] };

  const filtered = rawData.filter(row => row[xIdx] != null && String(row[xIdx]).trim() !== "" && row[yIdx] != null && String(row[yIdx]).trim() !== "");
  const labels: string[] = []; const values: number[] = [];
  
  for (const row of filtered) {
    const rawX = String(row[xIdx]).trim();
    const rawY = String(row[yIdx]).trim();
    const num = parseFloat(rawY.replace(/[^\d,.-]/g,"").replace(/\.(?=\d{3}(,|$))/g,"").replace(",","."));
    values.push(isNaN(num) ? 0 : num);
    labels.push(rawX);
  }
  return { labels, values };
}

/* ─────────────────────────────────────────────
   ANA BİLEŞEN
───────────────────────────────────────────── */
export default function PresentationPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [parsedData, setParsedData] = useState<{labels: string[], values: number[]}>({ labels: [], values: [] });
  
  // Scrollytelling için aktif olan adım (0, 1, 2)
  const [activeStep, setActiveStep] = useState(0);

  // Veriyi çek
  useEffect(() => {
    if (!reportId) return;
    const fetchReport = async () => {
      const { data, error: fetchError } = await supabase.from("reports").select("*").eq("id", reportId).single();
      console.log("[Sunum] fetch result:", { data, error: fetchError });
      if (fetchError || !data) {
        console.error("[Sunum] Rapor bulunamadı:", fetchError?.message);
        setError(true);
      } else {
        setReport(data);
        const rd = data.raw_data as any;
        const cc = data.chart_config as any;
        console.log("[Sunum] raw_data:", rd, "chart_config:", cc);
        // blocks yapısı veya eski selectedXAxis/selectedYAxis yapısı destekleniyor
        const xCol = cc?.blocks?.[0]?.xCol ?? cc?.selectedXAxis;
        const yCol = cc?.blocks?.[0]?.yCol ?? cc?.selectedYAxis;
        
        if (rd?.columns && (rd?.rows || rd?.compressed_rows) && xCol && yCol) {
          const rows = rd.compressed_rows ? await decompressData(rd.compressed_rows) : rd.rows;
          setParsedData(parseData(rows, rd.columns, xCol, yCol));
        }
      }
      setLoading(false);
    };
    fetchReport();
  }, [reportId]);

  // Kaydırma (Scroll) algılayıcı
  useEffect(() => {
    const handleScroll = () => {
      // Metin bloklarının ekrandaki konumuna göre aktif adımı belirle
      const stepElements = document.querySelectorAll('.step-block');
      let current = 0;
      stepElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        // Eğer bloğun üst kısmı ekranın ortasını geçmişse onu aktif say
        if (rect.top < window.innerHeight * 0.6) {
          current = index;
        }
      });
      setActiveStep(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Akıllı Metin (Insights) Üretimi ── */
  const insights = useMemo(() => {
    if (!parsedData.values.length) return null;
    const vals = parsedData.values;
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    const total = vals.reduce((a, b) => a + b, 0);
    const maxIndex = vals.indexOf(maxVal);
    const minIndex = vals.indexOf(minVal);

    return {
      total,
      maxVal, maxLabel: parsedData.labels[maxIndex],
      minVal, minLabel: parsedData.labels[minIndex],
    };
  }, [parsedData]);

  /* ── Dinamik Grafik Opsiyonları (ECharts) ── */
  const getChartOption = () => {
    if (!report || !parsedData.labels.length) return {};
    const cc = report.chart_config;
    const block = cc.blocks?.[0] || {};
    const baseColor = block.palette === "rose" ? "#c97b5a" : block.palette === "blush" ? "#e8c4b0" : block.palette === "sage" ? "#87a99c" : "#111110";
    
    // Aktif adıma göre grafiği renklendir ve odakla
    const itemStyles = parsedData.values.map((val) => {
      // 0. Adım: Her şey görünür
      if (activeStep === 0) return { color: baseColor };
      // 1. Adım: Sadece en yüksek değeri parlat
      if (activeStep === 1) return { color: val === insights?.maxVal ? "#c97b5a" : "rgba(17,17,16,0.1)" };
      // 2. Adım: Sadece en düşük değeri parlat
      if (activeStep === 2) return { color: val === insights?.minVal ? "#111110" : "rgba(17,17,16,0.1)" };
      return { color: baseColor };
    });

    return {
      grid: { top: 40, right: 30, bottom: 60, left: 60, containLabel: true },
      tooltip: { trigger: "axis" },
      xAxis: { 
        type: "category", data: parsedData.labels, 
        axisLabel: { fontFamily: "'DM Sans', sans-serif", rotate: parsedData.labels.length > 15 ? 45 : 0 } 
      },
      yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed", color: "rgba(17,17,16,0.08)" } } },
      series: [{
        data: parsedData.values.map((v, i) => ({ value: v, itemStyle: itemStyles[i] })),
        type: block.chartType === "line" ? "line" : "bar",
        smooth: true,
        barWidth: "50%",
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        animationDuration: 1000, // Geçiş animasyonu süresi
      }]
    };
  };

  if (loading) return <div className="center-screen"><Loader2 size={48} style={{ animation: "spin 1s linear infinite", color: "var(--rose)" }} /></div>;
  if (error || !report) return <div className="center-screen"><h1 style={{fontFamily:"'Playfair Display', serif"}}>Rapor Bulunamadı</h1><p>Bu bağlantı geçersiz veya silinmiş olabilir.</p></div>;

  return (
    <>
      <style>{styles}</style>
      
      <header className="presentation-header">
        <div className="brand-logo">Aura<em>Data</em></div>
        <div className="report-badge">Canlı Sunum</div>
      </header>

      <div className="scrolly-container" style={{ paddingTop: "72px" }}>
        
        {/* SOL: SABİT GRAFİK (STICKY) */}
        <div className="scrolly-visual">
          <div className="chart-frame">
            <div style={{ position: "absolute", top: "2rem", left: "2rem", zIndex: 10 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem" }}>{report.title}</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
                {report.chart_config?.blocks?.[0]?.xCol} vs {report.chart_config?.blocks?.[0]?.yCol}
              </p>
            </div>
            
            <div style={{ width: "100%", height: "100%", paddingTop: "3rem" }}>
              <ReactECharts 
                option={getChartOption()} 
                style={{ height: "100%", width: "100%" }} 
                opts={{ renderer: "canvas" }} 
              />
            </div>
          </div>
        </div>

        {/* SAĞ: KAYAN METİNLER (SCROLLING INSIGHTS) */}
        <div className="scrolly-text">
          
          {/* Adım 0: Giriş ve Toplam Değer */}
          <div className={`step-block ${activeStep === 0 ? "is-active" : ""}`}>
            <div className="step-icon"><BarChart2 size={24}/></div>
            <span className="step-eyebrow">Genel Bakış</span>
            <h2 className="step-title">Büyük Resmi Görün.</h2>
            <p className="step-desc">
              Analiz edilen <strong>{parsedData.labels.length}</strong> farklı kaydın genel dağılımını inceliyorsunuz. 
              Tüm bu verilerin kümülatif (toplam) hacmi muazzam bir boyuta ulaşıyor:
            </p>
            <span className="highlight-value">
              {new Intl.NumberFormat('tr-TR').format(insights?.total || 0)}
            </span>
            <p className="step-desc">Detayları incelemek için aşağı kaydırın.</p>
          </div>

          {/* Adım 1: Zirve Değer (En Yüksek) */}
          <div className={`step-block ${activeStep === 1 ? "is-active" : ""}`}>
            <div className="step-icon" style={{ background: "var(--rose)" }}><TrendingUp size={24}/></div>
            <span className="step-eyebrow">Performans Lideri</span>
            <h2 className="step-title">Zirvedeki Kritik Nokta.</h2>
            <p className="step-desc">
              Grafikteki en belirgin sıçrama <strong>{insights?.maxLabel}</strong> kategorisinde yaşanıyor.
              Diğer tüm verileri geride bırakan bu noktanın değeri tam olarak:
            </p>
            <span className="highlight-value" style={{ color: "var(--rose)" }}>
              {new Intl.NumberFormat('tr-TR').format(insights?.maxVal || 0)}
            </span>
            <p className="step-desc">Bu ani yükselişin arkasındaki strateji, gelecek planlamaları için bir referans olmalıdır.</p>
          </div>

          {/* Adım 2: Dip Değer (En Düşük) */}
          <div className={`step-block ${activeStep === 2 ? "is-active" : ""}`}>
            <div className="step-icon" style={{ background: "#fef3f0", color: "var(--rose)" }}><AlertCircle size={24}/></div>
            <span className="step-eyebrow">Gelişim Alanı</span>
            <h2 className="step-title">Dikkat Çeken Düşüş.</h2>
            <p className="step-desc">
              Madalyonun diğer yüzünde ise <strong>{insights?.minLabel}</strong> bulunuyor.
              Bu alan, genel tablonun en zayıf halkası olarak kaydedildi:
            </p>
            <span className="highlight-value" style={{ fontSize: "2.5rem" }}>
              {new Intl.NumberFormat('tr-TR').format(insights?.minVal || 0)}
            </span>
            <p className="step-desc">
              Burası bir kriz değil, optimize edilmesi gereken bir fırsat alanı olarak değerlendirilmeli. Sunumun sonuna geldiniz.
            </p>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
