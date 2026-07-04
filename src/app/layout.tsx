import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "antd/dist/reset.css";

import { Providers } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
);
const title = "Meera";
const description =
  "Meera is a private memory engine that turns saved notes, chats, and raw thoughts into patterns, open loops, and next moves.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: title,
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  keywords: [
    "Meera",
    "memory engine",
    "AI notes",
    "reflection app",
    "personal knowledge",
    "weekly review",
    "pattern recognition",
    "open loops",
  ],
  authors: [{ name: "Meera" }],
  creator: "Meera",
  publisher: "Meera",
  category: "productivity",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/png",
        sizes: "256x256",
      },
    ],
    apple: [
      {
        url: "/logo.png",
        type: "image/png",
        sizes: "256x256",
      },
    ],
    shortcut: "/logo.png",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: title,
    images: [
      {
        url: "/logo.png",
        width: 256,
        height: 256,
        alt: "Meera logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
