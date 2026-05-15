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
  title: "Orbital OS — Global Economic Matrix",
  description: "Real-time 3D macroeconomic dashboard. Interactive globe visualization powered by World Bank Open Data.",
  metadataBase: new URL("https://orbital-os.vercel.app"), // Placeholder URL
  openGraph: {
    title: "Orbital OS — Global Economic Matrix",
    description: "Real-time 3D macroeconomic dashboard. Interactive globe visualization powered by World Bank Open Data.",
    type: "website",
    url: "https://orbital-os.vercel.app",
    siteName: "Orbital OS",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbital OS — Global Economic Matrix",
    description: "Real-time 3D macroeconomic dashboard. Interactive globe visualization powered by World Bank Open Data.",
  },
};

export const viewport = {
  themeColor: "#00ff88",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import Terminal from "@/components/Terminal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#02040a]">
        {children}
        <Terminal />
      </body>
    </html>
  );
}
