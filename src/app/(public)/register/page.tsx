import { Card } from "@/components/ui/Card";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { useTranslations } from "next-intl";

export default function RegisterPage(): React.ReactElement {
  const t = useTranslations("registration");

  return (
    // template: #rsvp { bg:bg-secondary; padding:80px 0; text-align:center }
    <main className="bg-dark-secondary py-20 text-center">
      <div className="mx-auto w-[90%] max-w-[1200px]">
        {/* template: h2 heading */}
        <h2 className="font-heading text-4xl uppercase tracking-wider text-white">
          {t("title")}
        </h2>
        {/* template: <p> description below heading */}
        <p className="mt-4 text-text-gray">{t("description")}</p>
        {/* template: .rsvp-form { max-width:600px; margin:50px auto 0; bg:bg-main; padding:40px; border:2px solid accent } */}
        <Card className="mx-auto mt-[50px] w-full max-w-[600px] border-2 border-accent text-left">
          <RegistrationForm />
        </Card>
      </div>
    </main>
  );
}
