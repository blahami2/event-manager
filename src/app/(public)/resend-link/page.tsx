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
    <main className="bg-dark-secondary py-20 text-center">
      <div className="mx-auto w-[90%] max-w-[1200px]">
        <h2 className="font-heading text-4xl uppercase tracking-wider text-white">
          {t("title")}
        </h2>
        <p className="mt-4 text-text-gray">{t("description")}</p>
        <Card className="mx-auto mt-[50px] w-full max-w-[600px] border-2 border-accent text-left">
          <ResendLinkForm />
          <div className="mt-6 text-center">
            <Button href="/" variant="secondary">
              {t("backToEvent")}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
