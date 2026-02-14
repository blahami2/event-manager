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
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
        <Card className="mx-auto w-full max-w-md text-center">
          <p className="text-lg font-medium text-gray-700">{result.error}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {t("title")}
        </h1>
        <ManageForm registration={result.registration} token={token} />
      </Card>
    </main>
  );
}
