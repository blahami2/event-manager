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
        {/* Header */}
        <section
          className="border-b-[5px] border-accent py-20 text-center"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('/images/hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="mx-auto w-[90%] max-w-[1200px]">
            <h1
              className="font-heading text-white"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                lineHeight: "0.9",
                textShadow: "3px 3px 0px #000",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              {t("title")}
            </h1>
          </div>
        </section>

        {/* Error content */}
        <section className="py-20">
          <div className="mx-auto w-[90%] max-w-[600px]">
            <div className="border-2 border-accent bg-dark-primary p-10 text-center">
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
      {/* Header */}
      <section
        className="border-b-[5px] border-accent py-20 text-center"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('/images/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto w-[90%] max-w-[1200px]">
          <h1
            className="font-heading text-white"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: "0.9",
              textShadow: "3px 3px 0px #000",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {t("title")}
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              marginTop: "20px",
              letterSpacing: "4px",
              color: "var(--color-accent)",
              textTransform: "uppercase",
            }}
          >
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Form content */}
      <section className="py-20">
        <div className="mx-auto w-[90%] max-w-[600px]">
          <div className="border-2 border-accent bg-dark-primary p-10 text-left">
            <ManageForm registration={result.registration} token={token} />
          </div>
        </div>
      </section>
    </main>
  );
}
