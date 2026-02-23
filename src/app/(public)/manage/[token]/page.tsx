import { getRegistrationByToken } from "@/lib/usecases/manage-registration";
import { AppError } from "@/lib/errors/app-errors";
import type { RegistrationOutput } from "@/types/registration";
import { ManageForm } from "./ManageForm";
import { getTranslations } from "next-intl/server";

interface ManagePageProps {
  readonly params: Promise<{ token: string }>;
}

async function loadRegistration(
  token: string,
): Promise<{ registration: RegistrationOutput; error: null } | { registration: null; error: string }> {
  const t = await getTranslations("manage");
  try {
    return { registration: await getRegistrationByToken(token), error: null };
  } catch (error: unknown) {
    if (error instanceof AppError && error.statusCode === 404) {
      return { registration: null, error: t("invalidLink") };
    }
    if (error instanceof AppError && error.statusCode === 429) {
      return { registration: null, error: t("tooManyRequests") };
    }
    throw error;
  }
}

export default async function ManagePage({
  params,
}: ManagePageProps): Promise<React.ReactElement> {
  const { token } = await params;
  const result = await loadRegistration(token);
  const t = await getTranslations("manage");

  if (result.error !== null) {
    return (
      <main
        className="min-h-screen bg-dark-secondary"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')",
        }}
      >
        {/* Error section - matches RSVP section structure */}
        <section
          style={{
            backgroundColor: "var(--color-dark-secondary)",
            padding: "80px 0",
            textAlign: "center",
          }}
        >
          <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
            <h1
              className="font-heading"
              style={{
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                lineHeight: "0.9",
              }}
            >
              {t("title")}
            </h1>
            <div
              style={{
                maxWidth: "600px",
                margin: "50px auto 0",
                background: "var(--color-dark-primary)",
                padding: "40px",
                border: "2px solid var(--color-accent)",
                textAlign: "center",
              }}
            >
              <p className="text-lg font-medium text-text-gray">{result.error}</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-dark-secondary"
      style={{
        backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')",
      }}
    >
      {/* Manage section - matches RSVP section structure */}
      <section
        style={{
          backgroundColor: "var(--color-dark-secondary)",
          padding: "80px 0",
          textAlign: "center",
        }}
      >
        <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
          <h1
            className="font-heading"
            style={{
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: "0.9",
            }}
          >
            {t("title")}
          </h1>
          <p
            className="font-body"
            style={{
              marginTop: "10px",
              color: "var(--color-text-gray)",
            }}
          >
            {t("subtitle")}
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
            <ManageForm registration={result.registration} token={token} />
          </div>
        </div>
      </section>
    </main>
  );
}
