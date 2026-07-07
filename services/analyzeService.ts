export type ChartSpec = {
  type: "bar" | "line" | "pie" | "scatter";
  x_column: string;
  y_column: string;
  aggregation: "sum" | "avg" | "count" | "none";
  title: string;
};

import { supabase } from "../app/utils/supabase";

export interface ChartRecommendation {
  id: string;
  type: string;
  x_column: string;
  y_column: string;
  title: string;
  description: string;
}

export interface AnalyzeResponse {
  summary: string;
  recommendations: ChartRecommendation[];
  reportId?: string;
}

export async function analyzeData(
  file: File,
  rawData: Record<string, any>[]
): Promise<AnalyzeResponse> {
  const webhookUrl = process.env.NEXT_PUBLIC_ANALYZE_WEBHOOK_URL;
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_ANALYZE === "true";

  if (webhookUrl && !useMock) {
    try {
      // Sadece ilk 50 veriyi LLM'e göndermek için kırpıyoruz
      const limitedData = rawData.slice(0, 50);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset_name: file.name,
          data: limitedData
        }),
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error("n8n sunucusundan boş yanıt döndü. n8n akışınız tamamlanmadan hata vermiş olabilir (Örn: Webhook'a ulaşılamadı veya bir node çöktü). Lütfen n8n 'Executions' sekmesini kontrol edin.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`n8n sunucusundan geçersiz JSON döndü: ${text.substring(0, 50)}...`);
      }

      // Supabase'e kaydet
      const { data: { session } } = await supabase.auth.getSession();
      let reportId: string | undefined = undefined;
      
      if (session?.user) {
        await supabase.from("data_analyses").insert({
          user_id: session.user.id,
          dataset_name: file.name,
          summary: data.summary,
          recommendations: data.recommendations
        });
      }

      return data as AnalyzeResponse;
    } catch (error: any) {
      console.error("Analyze error:", error);
      throw new Error(error.message || "Bilinmeyen bir hata oluştu.");
    }
  }

  // --- MOCK MODE ---
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!rawData || rawData.length === 0) {
    throw new Error("Veri seti boş, analiz edilemedi.");
  }

  // Find first categorical and numeric columns
  let catCol = "";
  let numCol = "";
  
  const sample = rawData[0];
  for (const [key, val] of Object.entries(sample)) {
    if (!catCol && typeof val === "string" && isNaN(Number(val))) {
      catCol = key;
    } else if (!numCol && (typeof val === "number" || !isNaN(Number(val)))) {
      numCol = key;
    }
  }

  // Fallbacks if not found
  if (!catCol) catCol = Object.keys(sample)[0] || "Kategori";
  if (!numCol) numCol = Object.keys(sample)[1] || Object.keys(sample)[0] || "Değer";

  return {
    summary: "Veriniz başarıyla analiz edildi. Genel dağılım ve eğilimleri görmek için aşağıdaki grafikleri inceleyebilirsiniz.",
    recommendations: [
      {
        id: "mock-1",
        type: "bar",
        x_column: catCol,
        y_column: numCol,
        title: "Kategorik Dağılım",
        description: "En yüksek değerleri karşılaştırmak için idealdir."
      },
      {
        id: "mock-2",
        type: "line",
        x_column: catCol,
        y_column: numCol,
        title: "Zaman/Eğilim Analizi",
        description: "Verinin ilerleyişini veya trendini görmek için."
      },
      {
        id: "mock-3",
        type: "pie",
        x_column: catCol,
        y_column: numCol,
        title: "Oransal Dağılım",
        description: "Bütün içindeki payları görselleştirir."
      }
    ]
  };
}
