import { Card } from "@/components/ui/Card";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { useTranslations, useLocale } from "next-intl";
import { REGISTRATION_DEADLINE } from "@/config/event";

export default function RegisterPage(): React.ReactElement {
  const t = useTranslations("registration");
  const locale = useLocale();
  const isDeadlinePassed = new Date() > REGISTRATION_DEADLINE;
  const deadlineDateStr = REGISTRATION_DEADLINE.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });

  return (
    // template: #rsvp { bg:bg-secondary; padding:80px 0; text-align:center }
    <main className="bg-dark-secondary py-20 text-center">
      <div className="mx-auto w-[90%] max-w-[1200px]">
        {/* template: h2 heading */}
        <h2 className="font-heading text-4xl uppercase tracking-wider text-white">
          {t("title")}
        </h2>
        {isDeadlinePassed ? (
          <Card className="mx-auto mt-[50px] w-full max-w-[600px] border-2 border-accent text-center">
            <p className="font-heading text-xl uppercase tracking-wider text-accent">
              {t("closed")}
            </p>
          </Card>
        ) : (
          <>
            <p className="mt-5 font-heading text-lg uppercase tracking-wider text-accent">
              {t("deadline", { date: deadlineDateStr })}
            </p>
            <Card className="mx-auto mt-[50px] w-full max-w-[600px] border-2 border-accent text-left">
              <RegistrationForm />
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
