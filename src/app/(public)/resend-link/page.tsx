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
    <main
      style={{
        backgroundColor: "var(--color-dark-secondary)",
        padding: "80px 0",
        textAlign: "center",
      }}
    >
      <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {t("title")}
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            marginTop: "10px",
            color: "var(--color-text-gray)",
          }}
        >
          {t("description")}
        </p>
        <div
          style={{
            maxWidth: "600px",
            margin: "50px auto 0",
            background: "var(--color-dark-primary)",
            padding: "40px",
            border: "2px solid var(--color-accent)",
            textAlign: "left",
          }}
        >
          <ResendLinkForm />
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <Button href="/" variant="secondary">
              {t("backToEvent")}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
