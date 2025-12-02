import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: {
    default: "VoidAI - Unified AI API",
    template: "%s | VoidAI",
  },
  description:
    "Access advanced AI models through one reliable API. GPT-5.1, Claude 4.5, Gemini 3, and more. Designed for stable performance, fast responses, and consistent results.",
  keywords: [
    "AI API",
    "GPT",
    "OpenAI",
    "Anthropic",
    "Claude",
    "Gemini",
    "AI Platform",
    "Machine Learning API",
    "LLM API",
  ],
  authors: [{ name: "VoidAI Team" }],
  creator: "VoidAI",
  publisher: "VoidAI",
  metadataBase: new URL("https://voidai.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://voidai.app",
    siteName: "VoidAI",
    title: "VoidAI - Unified AI API",
    description:
      "Access advanced AI models through one reliable API. GPT-5.1, Claude 4.5, Gemini 3, and more. Designed for stable performance, fast responses, and consistent results.",
    images: [
      {
        url: "https://voidai.app/voidai.png",
        width: 1200,
        height: 630,
        alt: "VoidAI - Unified AI API",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@voidai",
    creator: "@voidai",
    title: "VoidAI - Unified AI API",
    description:
      "Access advanced AI models through one reliable API. GPT-5.1, Claude 4.5, Gemini 3, and more. Built for stability, speed, and clarity.",
    images: {
      url: "https://voidai.app/voidai.png",
      alt: "VoidAI - Unified AI API",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://voidai.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Additional meta tags for better preview rendering */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image:width" content="1200" />
        <meta name="twitter:image:height" content="630" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground bg-gradient-radial`}
      >
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}