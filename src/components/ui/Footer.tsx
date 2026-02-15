import { useTranslations } from "next-intl";

export function Footer(): React.ReactElement {
  const t = useTranslations("footer");

  return (
    // template: footer { background:#000; padding:40px 0; text-align:center; border-top:5px solid accent }
    <footer
      style={{
        background: "#000",
        padding: "40px 0",
        textAlign: "center",
        borderTop: "5px solid var(--color-accent)",
      }}
    >
      <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
        {/* h3 with heading font */}
        <h3
          style={{
            fontFamily: "'Anton', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {t("title")}
        </h3>
        {/* footer p { color: text-gray } */}
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            color: "var(--color-text-gray)",
            marginTop: "8px",
          }}
        >
          {t("contact")}
        </p>
        {/* accent tagline: margin-top:20px; font-weight:700 */}
        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            color: "var(--color-accent)",
            marginTop: "20px",
            fontWeight: 700,
          }}
        >
          {t("tagline")}
        </p>
      </div>
    </footer>
  );
}
