"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // PKCE flow: Supabase detectSessionInUrl ile code'u otomatik exchange eder
    // Biz sadece session'ın hazır olmasını bekleyip yönlendiriyoruz
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        router.replace("/");
      } else if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        subscription.unsubscribe();
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#faf8f5",
      fontFamily: "'DM Sans', sans-serif",
      gap: "1rem",
    }}>
      <div style={{
        width: "32px", height: "32px",
        background: "#111110", borderRadius: "3px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "serif", fontStyle: "italic",
        color: "#faf8f5", fontSize: "1rem",
      }}>A</div>
      <span style={{ color: "#999490", fontSize: "0.78rem", letterSpacing: "0.12em" }}>
        Giriş yapılıyor…
      </span>
    </div>
  );
}