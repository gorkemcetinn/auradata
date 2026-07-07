"use client";

import { usePathname } from "next/navigation";
import AiChatBubble from "./AiChatBubble";

export default function AiChatBubbleWrapper() {
  const pathname = usePathname();
  // Canvas sayfasında gösterme (kendi AI asistanını kullanıyor) ve Auth sayfasında gösterme
  if (pathname?.startsWith("/canvas") || pathname?.startsWith("/auth")) return null;
  return <AiChatBubble />;
}
