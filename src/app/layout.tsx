import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Ubuntu } from "next/font/google";
import "./global.css";
import { Suspense } from "react";
import { APP_NAME, APP_TAGLINE, APP_DOMAIN } from "@/config/app";
import { Toaster } from "@/components/ui/sonner";
import { EmailVerifiedToast } from "@/components/auth/email-verified-toast";

const ubuntu = Ubuntu({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-ubuntu",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${APP_DOMAIN}`),
  title: APP_NAME,
  description: APP_TAGLINE,
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: APP_NAME,
    description: APP_TAGLINE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_TAGLINE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${ubuntu.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster />
        <Suspense fallback={null}>
          <EmailVerifiedToast />
        </Suspense>
      </body>
    </html>
  );
}
