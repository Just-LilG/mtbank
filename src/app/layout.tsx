import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { BankProvider } from "@/components/bank-provider";
import { ConnectionBanner } from "@/components/connection-banner";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UBEX BANK",
  description: "UBEX BANK customer banking and the branch desk.",
  applicationName: "Ubex Bank",
  appleWebApp: { capable: true, title: "Ubex", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c12" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

// Runs before the page paints, so a saved Light or Dark choice never flashes the wrong colours.
const themeScript = `try{var t=localStorage.getItem("ubex:theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t}if(localStorage.getItem("ubex:hide")==="1"){document.documentElement.dataset.hideBalance="1"}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full antialiased">
        <a href="#main" className="sr-skip">
          Skip to content
        </a>
        <ConnectionBanner />
        <ToastProvider>
          <BankProvider>{children}</BankProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
