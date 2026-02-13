import { Card } from "@/components/ui/Card";
import { ResendLinkForm } from "@/components/forms/ResendLinkForm";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Resend Manage Link",
  description: "Request a new manage link for your registration.",
};

export default function ResendLinkPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Resend Manage Link
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Enter the email you registered with and we&apos;ll send you a new
          manage link.
        </p>

        <ResendLinkForm />

        <div className="mt-6 text-center">
          <Button href="/" variant="secondary">
            Back to Event
          </Button>
        </div>
      </Card>
    </main>
  );
}
