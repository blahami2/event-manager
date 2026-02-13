import { Card } from "@/components/ui/Card";
import { getRegistrationByToken } from "@/lib/usecases/manage-registration";
import { AppError } from "@/lib/errors/app-errors";
import { ManageForm } from "./ManageForm";

interface ManagePageProps {
  readonly params: Promise<{ token: string }>;
}

export default async function ManagePage({
  params,
}: ManagePageProps): Promise<React.ReactElement> {
  const { token } = await params;

  try {
    const registration = await getRegistrationByToken(token);

    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
        <Card className="mx-auto w-full max-w-md">
          <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Manage Registration
          </h1>
          <ManageForm registration={registration} token={token} />
        </Card>
      </main>
    );
  } catch (error: unknown) {
    if (error instanceof AppError && error.statusCode === 404) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
          <Card className="mx-auto w-full max-w-md text-center">
            <p className="text-lg font-medium text-gray-700">
              This link is not valid or has expired.
            </p>
          </Card>
        </main>
      );
    }

    if (error instanceof AppError && error.statusCode === 429) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
          <Card className="mx-auto w-full max-w-md text-center">
            <p className="text-lg font-medium text-gray-700">
              Too many requests. Please try again later.
            </p>
          </Card>
        </main>
      );
    }

    throw error;
  }
}
