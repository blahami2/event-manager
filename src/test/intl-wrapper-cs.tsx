import { NextIntlClientProvider } from "next-intl";
import messages from "@/i18n/messages/cs.json";

export function CsIntlWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <NextIntlClientProvider locale="cs" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
