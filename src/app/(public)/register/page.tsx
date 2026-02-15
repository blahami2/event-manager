import { Card } from "@/components/ui/Card";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { useTranslations } from "next-intl";

export default function RegisterPage(): React.ReactElement {
  const t = useTranslations("registration");

  return (
    <main className="flex min-h-screen items-center justify-center bg-dark-secondary px-4 py-12">
      <Card className="mx-auto w-full max-w-md border-2 border-accent">
        <h1 className="mb-6 text-center font-heading text-3xl uppercase tracking-wider text-white sm:text-4xl">
          {t("title")}
        </h1>
        <RegistrationForm />
      </Card>
    </main>
  );
}
