import type { Metadata } from "next";
import "./globals.css";
import "../App.css";

export const metadata: Metadata = {
  title: "eSchools - ონლაინ ჟურნალი",
  description: "სასკოლო მართვის სისტემა",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
