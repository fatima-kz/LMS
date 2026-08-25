import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS | Learning Management System",
  description: "A general-purpose Learning Management System for schools.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
