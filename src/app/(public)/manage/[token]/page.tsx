import { Card } from "@/components/ui/Card";
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
      <main className="bg-dark-secondary py-20 text-center">
        <div className="mx-auto w-[90%] max-w-[1200px]">
          <Card className="mx-auto mt-[50px] w-full max-w-[600px]">
            <p className="text-lg font-medium text-text-gray">{result.error}</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-dark-secondary py-20 text-center">
      <div className="mx-auto w-[90%] max-w-[1200px]">
        <h2 className="font-heading text-4xl uppercase tracking-wider text-white">
          {t("title")}
        </h2>
        <Card className="mx-auto mt-[50px] w-full max-w-[600px] border-2 border-accent text-left">
          <ManageForm registration={result.registration} token={token} />
        </Card>
      </div>
    </main>
  );
}
