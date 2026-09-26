import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { BankProvider } from "@/components/bank-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UBEX BANK",
  description: "UBEX BANK customer banking and the branch desk.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full antialiased">
        <BankProvider>{children}</BankProvider>
      </body>
    </html>
  );
}
