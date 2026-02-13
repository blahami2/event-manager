import {
  EVENT_NAME,
  EVENT_DATE,
  EVENT_LOCATION,
  EVENT_DESCRIPTION,
} from "@/config/event";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-xl text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {EVENT_NAME}
        </h1>

        <p className="mb-6 text-base text-gray-500 sm:text-lg">
          {EVENT_DESCRIPTION}
        </p>

        <dl className="mb-8 space-y-3 text-left text-gray-700">
          <div className="flex items-start gap-3">
            <dt className="font-semibold">📅 Date</dt>
            <dd>{EVENT_DATE}</dd>
          </div>
          <div className="flex items-start gap-3">
            <dt className="font-semibold">📍 Location</dt>
            <dd>{EVENT_LOCATION}</dd>
          </div>
        </dl>

        <div className="flex flex-col items-center gap-4">
          <Button href="/register">Register</Button>
          <Button href="/resend-link" variant="secondary">
            Already registered?
          </Button>
        </div>
      </Card>
    </main>
  );
}
