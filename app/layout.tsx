import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Closest free alternative to Capital One's custom "Optimist" font
const capitalOneFont = Plus_Jakarta_Sans({
  variable: "--font-capital-one",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Capital One Online Banking",
  description: "The Capital One Official Website allows users to securely manage personal and business finances. Visitors can compare and apply for credit cards, open checking and savings accounts, apply for auto loans, and monitor their credit scores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${capitalOneFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Adding capitalOneFont.className here forces the entire app to use it by default */}
      <body className={`${capitalOneFont.className} min-h-full flex flex-col`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}