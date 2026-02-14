import { Card } from "@/components/ui/Card";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { useTranslations } from "next-intl";

export default function RegisterPage(): React.ReactElement {
  const t = useTranslations("registration");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {t("title")}
        </h1>
        <RegistrationForm />
      </Card>
    </main>
  );
}
