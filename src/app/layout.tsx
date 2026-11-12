import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeStudio from "@/components/theme-studio";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "SPECProof — Evidence-based Agent Benchmarking",
  description: "A reproducible benchmark for evaluating AI developer agents against technical documentation, API versions and evidence quality.",
};

export const viewport: Viewport = { themeColor: "#F6F7FA", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={geist.variable + " " + geistMono.variable}>{children}<ThemeStudio /></body></html>;
}
