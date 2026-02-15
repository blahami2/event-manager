import type { Metadata } from "next";
import { Anton, Montserrat } from "next/font/google";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import "./globals.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Birthday Celebration",
  description: "Manage your event attendance and preferences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body className={`${anton.variable} ${montserrat.variable} font-body bg-dark-primary text-white`}>
        <div className="fixed right-4 top-4 z-50">
          <LanguageSwitcher />
        </div>
        {children}
      </body>
    </html>
  );
}
