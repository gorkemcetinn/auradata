"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AiChatBubble() {
  const { t, lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: lang === 'tr' ? "Merhaba! Ben AuraData yapay zeka asistanıyım. Size nasıl yardımcı olabilirim?" : "Hello! I am AuraData AI assistant. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Supabase'den güncel auth token'ı al
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText, sessionId: token || "anonymous" })
      });

      if (!res.ok) throw new Error("API hatası");

      const result = await res.json();
      const replyText = result.reply || result.text || result[0]?.text || "Yanıt alınamadı.";
      setMessages([...newMessages, { role: "ai", text: replyText }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "ai", text: "Üzgünüm, şu an backend bağlantısı kuramıyorum." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
      {/* Chat Window */}
      <div style={{ 
        width: "350px", height: "500px", background: "white", 
        borderRadius: "12px", boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        border: "1px solid #eee",
        position: "absolute", bottom: "0", right: "0",
        transformOrigin: "bottom right",
        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transform: isOpen ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none"
      }}>
        {/* Header */}
        <div style={{ 
          padding: "16px", background: "#111110", color: "white", 
          display: "flex", justifyContent: "space-between", alignItems: "center" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, fontSize: "0.95rem" }}>
            <Bot size={18} style={{ color: "#d94b2b" }} />
            {t("chat.title")}
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}>
            <X size={20} />
          </button>
        </div>

        {/* Mesaj Listesi */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ 
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#d94b2b" : "#f5f5f4",
              color: m.role === "user" ? "white" : "#111110",
              padding: "10px 14px", borderRadius: "8px", maxWidth: "80%",
              fontSize: "0.85rem", lineHeight: "1.4"
            }}>
              {m.text}
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: "flex-start", color: "#888", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={14} style={{ animation: "spin 2s linear infinite" }} /> {t("chat.thinking")}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Girdi Alanı */}
        <div style={{ padding: "12px", borderTop: "1px solid #eee", display: "flex", gap: "8px", background: "#fff" }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={t("chat.placeholder")}
            style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.85rem", outline: "none", color: "#111110" }}
          />
          <button onClick={sendMessage} disabled={isLoading} style={{ 
            background: "#111110", color: "white", border: "none", borderRadius: "6px", 
            padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Bubble Button */}
      <button onClick={() => setIsOpen(true)} style={{
        width: "56px", height: "56px", borderRadius: "50%", background: "#d94b2b",
        color: "white", border: "none", boxShadow: "0 8px 24px rgba(217, 75, 43, 0.3)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        position: "absolute", bottom: "0", right: "0",
        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transform: isOpen ? "scale(0) rotate(-90deg)" : "scale(1) rotate(0deg)",
        opacity: isOpen ? 0 : 1,
        pointerEvents: isOpen ? "none" : "auto"
      }}>
        <Sparkles size={24} />
      </button>
    </div>
  );
}
