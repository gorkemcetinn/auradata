"use client";

import { usePathname } from "next/navigation";
import AiChatBubble from "./AiChatBubble";

export default function AiChatBubbleWrapper() {
  const pathname = usePathname();
  // Canvas sayfasında gösterme — Canvas kendi AI asistanını kullanıyor
  if (pathname?.startsWith("/canvas")) return null;
  return <AiChatBubble />;
}
