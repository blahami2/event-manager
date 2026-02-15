import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Triple Threat 2026",
  description: "Manage your event attendance and preferences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <head>
        {/* Load fonts from Google CDN — same as the v1 design template */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="fixed right-4 top-4 z-50">
          <LanguageSwitcher />
        </div>
        {children}
      </body>
    </html>
  );
}
