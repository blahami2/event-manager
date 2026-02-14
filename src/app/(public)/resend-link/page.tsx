import { Card } from "@/components/ui/Card";
import { ResendLinkForm } from "@/components/forms/ResendLinkForm";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export const metadata = {
  title: "Resend Manage Link",
  description: "Request a new manage link for your registration.",
};

export default function ResendLinkPage(): React.ReactElement {
  const t = useTranslations("resend");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          {t("description")}
        </p>

        <ResendLinkForm />

        <div className="mt-6 text-center">
          <Button href="/" variant="secondary">
            {t("backToEvent")}
          </Button>
        </div>
      </Card>
    </main>
  );
}
