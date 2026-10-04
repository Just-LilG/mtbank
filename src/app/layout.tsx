import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { BankProvider } from "@/components/bank-provider";
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
  themeColor: "#f6f6f8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full antialiased">
        <BankProvider>{children}</BankProvider>
      </body>
    </html>
  );
}
