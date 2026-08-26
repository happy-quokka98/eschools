import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../App.css";

export const metadata: Metadata = {
  title: "სკოლის ელექტრონული ჟურნალი - eSchools",
  description: "სასკოლო მართვის სისტემა",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
