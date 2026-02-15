import {
  EVENT_NAME,
  EVENT_DATE,
  EVENT_LOCATION,
  EVENT_DESCRIPTION,
} from "@/config/event";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export default function HomePage(): React.ReactElement {
  const t = useTranslations("landing");

  return (
    <main>
      {/* Hero Section */}
      <section
        className="flex min-h-screen items-center justify-center border-b-4 border-accent bg-cover bg-center text-center bg-[linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.8)),url('/images/hero.jpg')]"
      >
        <div className="mx-auto w-[90%] max-w-5xl px-4">
          <h1 className="mb-5 font-heading text-[clamp(4rem,10vw,8rem)] uppercase leading-[0.9] tracking-wider text-white [text-shadow:3px_3px_0px_#000]">
            {EVENT_NAME}
          </h1>
          <p className="mb-10 text-2xl font-bold uppercase tracking-[4px] text-accent">
            {EVENT_DESCRIPTION}
          </p>
          <Button href="/register">{t("register")}</Button>
        </div>
      </section>

      {/* Details Section */}
      <section className="bg-dark-secondary px-4 py-20">
        <div className="mx-auto w-[90%] max-w-5xl">
          <h2 className="mb-12 text-center font-heading text-4xl uppercase tracking-wider text-white">
            {t("date")} & {t("location")}
          </h2>
          <div className="border-2 border-border-dark bg-black/80">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 border-b-2 border-border-dark p-10 md:border-b-0 md:border-r-2">
                <h3 className="mb-5 font-heading text-2xl text-accent">
                  📅 {t("date")}
                </h3>
                <p className="text-lg font-bold">{EVENT_DATE}</p>
              </div>
              <div className="flex-1 p-10">
                <h3 className="mb-5 font-heading text-2xl text-accent">
                  📍 {t("location")}
                </h3>
                <p className="text-lg font-bold">{EVENT_LOCATION}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <Button href="/register">{t("register")}</Button>
            <Button href="/resend-link" variant="secondary">
              {t("alreadyRegistered")}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
