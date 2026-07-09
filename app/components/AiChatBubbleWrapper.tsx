"use client";

import { usePathname } from "next/navigation";
import AiChatBubble from "./AiChatBubble";

export default function AiChatBubbleWrapper() {
  const pathname = usePathname();
  // Canvas sayfasında gösterme (kendi AI asistanını kullanıyor), Auth sayfasında ve Dashboard'da gösterme
  if (pathname?.startsWith("/canvas") || pathname?.startsWith("/auth") || pathname?.startsWith("/dashboard")) return null;
  return <AiChatBubble />;
}
