import { NextIntlClientProvider } from "next-intl";
import messages from "@/i18n/messages/en.json";

export function IntlWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
