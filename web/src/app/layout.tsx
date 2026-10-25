import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { AuthProvider } from "@/components/auth-provider";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

const description =
  "Log every set and see your progress. A free workout tracker that installs from your browser.";

export const metadata: Metadata = {
  // Makes the generated opengraph-image URL absolute, which link previews need.
  metadataBase: new URL("https://powrfit-andylafleur.netlify.app"),
  title: "PowrFit — Train smarter",
  description,
  openGraph: {
    type: "website",
    siteName: "PowrFit",
    title: "PowrFit — Train smarter",
    description,
  },
  twitter: { card: "summary_large_image" },
  // Home-screen install on iOS (P1-08). The status bar overlays the page, so
  // the shell pads its top bar with env(safe-area-inset-top).
  appleWebApp: {
    capable: true,
    title: "PowrFit",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
