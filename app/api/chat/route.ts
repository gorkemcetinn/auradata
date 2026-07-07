import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL || "http://localhost:5678/webhook/chat";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ reply: "N8N sunucusuna ulaşılamadı (API Hatası)" }, { status: response.status });
    }

    const text = await response.text();
    
    // Eğer yanıt boşsa
    if (!text) {
       return NextResponse.json({ reply: "N8N'den boş yanıt döndü." });
    }

    // Yanıtı güvenli bir şekilde JSON'a çevirmeye çalış
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseError) {
      // Eğer JSON değilse, düz metin dönmüştür, onu al
      return NextResponse.json({ reply: text });
    }

  } catch (error) {
    console.error("Chat API Proxy Error:", error);
    return NextResponse.json({ reply: "İç sunucu hatası (Proxy)" }, { status: 500 });
  }
}
