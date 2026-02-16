import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";
import UpdateNotification from "@/components/UpdateNotification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    default: "JobAISearch — Быстрый поиск работы с ИИ",
    template: "%s | JobAISearch",
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
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/apple-touch-icon-180x180.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const webAppJsonLd = {
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

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "JobAISearch",
    url: siteUrl,
    description:
      "Быстрый поиск работы с ИИ. Вакансии с hh.ru, Avito, SuperJob.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/vacancies?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JobAISearch",
    url: siteUrl,
    logo: `${siteUrl}/favicon-master-512.png`,
    description:
      "Платформа для поиска работы с помощью искусственного интеллекта.",
  };

  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/favicon-master-512.png?v=2" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* RSS/Atom Feed Auto-discovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="JobAISearch - Вакансии"
          href={`${siteUrl}/api/vacancies/rss`}
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          title="JobAISearch - Вакансии"
          href={`${siteUrl}/api/vacancies/atom`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
        <UpdateNotification />
      </body>
    </html>
  );
}
