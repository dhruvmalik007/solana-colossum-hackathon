import type { Metadata } from "next";
import React from "react";
import localFont from "next/font/local";
import "@repo/ui/globals.css";
import "./globals.css";
import { Header } from "@repo/ui/components/ui/header";
import { ThemeProvider } from "@repo/ui/components/theme-provider";
import { TopLoadingBar } from "@repo/ui/components/top-loading-bar";
import { PageTransition } from "@repo/ui/components/page-transition";
import { SolanaProviders } from "../components/solana/SolanaProviders";
import { UnifiedWalletButton } from "../components/solana/UnifiedWalletButton";
import { PrivyProviders } from "../components/privy/PrivyProviders";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Solana Distribution markets",
  description: "investing in the trends with no binary choices and manipulations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PrivyProviders>
            <SolanaProviders>
              <TopLoadingBar />
              <Header rightSlot={<UnifiedWalletButton />} />
              <PageTransition>
                <main className="container mx-auto px-4 py-6">{children}</main>
              </PageTransition>
            </SolanaProviders>
          </PrivyProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
