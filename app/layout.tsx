import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellar Governance Hub",
  description: "A production-style Stellar Testnet governance dApp with proposals, voting, and reputation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
