import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuraData",
  description: "Veri analizi ve görselleştirme platformu",
  openGraph: {
    title: "AuraData - Veri Analizi",
    description: "Veri analizi ve görselleştirme platformu ile verilerinizi anlamlandırın.",
    url: "https://auradata.vercel.app",
    siteName: "AuraData",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AuraData Önizleme",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuraData",
    description: "Veri analizi ve görselleştirme platformu",
    images: ["/og-image.png"],
  },
};

import AiChatBubbleWrapper from "./components/AiChatBubbleWrapper";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <AiChatBubbleWrapper />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
