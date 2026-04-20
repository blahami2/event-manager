import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Footer } from "@/components/ui/Footer";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}
