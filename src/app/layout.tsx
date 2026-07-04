import type { Metadata } from "next";
import { Alan_Sans, Geist_Mono } from "next/font/google";
import "antd/dist/reset.css";

import { Providers } from "@/components/providers";

import "./globals.css";

const alanSans = Alan_Sans({
  variable: "--font-alan-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memory Mirror",
  description: "Reflect across your own saved memories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${alanSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
