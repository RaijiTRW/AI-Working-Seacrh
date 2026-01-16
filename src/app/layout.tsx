import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JobSearch — Умный поиск работы с ИИ",
    template: "%s | JobSearch",
  },
  description:
    "Найдите работу быстрее с помощью искусственного интеллекта. Вакансии с hh.ru, Avito, SuperJob в одном месте. Персональный подбор без дубликатов.",
  keywords: [
    "поиск работы",
    "вакансии",
    "работа в России",
    "hh.ru",
    "avito работа",
    "superjob",
    "ИИ поиск вакансий",
    "найти работу",
    "трудоустройство",
    "карьера",
    "работа Москва",
    "удаленная работа",
  ],
  authors: [{ name: "JobAISearch" }],
  creator: "JobAISearch",
  publisher: "JobAISearch",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "JobAISearch",
    title: "JobAISearch — Умный поиск работы с ИИ",
    description:
      "Найдите работу быстрее с помощью искусственного интеллекта. Вакансии с hh.ru, Avito, SuperJob в одном месте.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JobAISearch — Умный поиск работы",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobAISearch — Умный поиск работы с ИИ",
    description:
      "Найдите работу быстрее с помощью искусственного интеллекта. Вакансии с hh.ru, Avito, SuperJob в одном месте.",
    images: ["/og-image.png"],
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
    canonical: siteUrl,
  },
  category: "technology",
  verification: {
    yandex: process.env.YANDEX_VERIFICATION,
    google: process.env.GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "JobAISearch",
    description:
      "Умный поиск работы с помощью искусственного интеллекта. Вакансии с hh.ru, Avito, SuperJob в одном месте.",
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "RUB",
      description: "Бесплатный пробный период 3 дня",
    },
  };

  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
