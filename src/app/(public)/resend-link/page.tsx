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
    <main className="flex min-h-screen items-center justify-center bg-dark-secondary px-4 py-12">
      <Card className="mx-auto w-full max-w-md border-2 border-accent">
        <h1 className="mb-2 text-center font-heading text-3xl uppercase tracking-wider text-white sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mb-6 text-center text-sm text-text-gray">
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
