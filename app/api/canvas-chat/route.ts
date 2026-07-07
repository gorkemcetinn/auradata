import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.NEXT_PUBLIC_CANVAS_CHAT_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ type: "text", content: "Canvas AI webhook URL tanımlanmamış. .env.local dosyasına NEXT_PUBLIC_CANVAS_CHAT_WEBHOOK_URL ekleyin." }, { status: 500 });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { type: "text", content: `n8n sunucusuna ulaşılamadı (${response.status})` },
        { status: response.status }
      );
    }

    const text = await response.text();
    if (!text) {
      return NextResponse.json({ type: "text", content: "n8n'den boş yanıt döndü." });
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ type: "text", content: text });
    }
  } catch (error) {
    console.error("Canvas Chat API Error:", error);
    return NextResponse.json({ type: "text", content: "İç sunucu hatası." }, { status: 500 });
  }
}
