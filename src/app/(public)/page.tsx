import { Button } from "@/components/ui/Button";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { useTranslations } from "next-intl";

const HEADING_FONT = "'Anton', sans-serif";
const BODY_FONT = "'Montserrat', sans-serif";

const HEADLINER_IMAGES = [
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
];

export default function HomePage(): React.ReactElement {
  const t = useTranslations("landing");

  return (
    <main style={{ fontFamily: BODY_FONT }}>
      {/* ===== HERO ===== */}
      {/* #hero { height:100vh; min-height:600px; display:flex; align-items:center; justify-content:center; text-align:center; border-bottom:5px solid accent; background:gradient+image } */}
      <section
        id="hero"
        style={{
          height: "100vh",
          minHeight: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          borderBottom: "5px solid var(--color-accent)",
          backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('/images/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
          {/* #hero h1 { font-size:clamp(4rem,10vw,8rem); line-height:0.9; margin-bottom:20px; text-shadow:3px 3px 0px #000 } */}
          <h1
            style={{
              fontFamily: HEADING_FONT,
              fontSize: "clamp(4rem, 10vw, 8rem)",
              lineHeight: "0.9",
              marginBottom: "20px",
              textShadow: "3px 3px 0px #000",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "#fff",
            }}
          >
            {t("eventName")} <span style={{ color: "var(--color-accent)" }}>2026</span>
          </h1>
          {/* #hero p.subtitle { font-size:1.5rem; font-weight:700; margin-bottom:40px; letter-spacing:4px; color:accent } */}
          <p
            style={{
              fontFamily: BODY_FONT,
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "40px",
              letterSpacing: "4px",
              color: "var(--color-accent)",
              textTransform: "uppercase",
            }}
          >
            {t("eventDescription")}
          </p>
          {/* .btn-rock { display:inline-block; bg:accent; color:white; padding:15px 40px; font-family:heading; font-size:1.5rem; text-transform:uppercase; border:3px solid accent; } */}
          <a
            href="#rsvp"
            className="btn-rock"
            style={{
              display: "inline-block",
              backgroundColor: "var(--color-accent)",
              color: "#fff",
              padding: "15px 40px",
              fontFamily: HEADING_FONT,
              fontSize: "1.5rem",
              textTransform: "uppercase",
              textDecoration: "none",
              border: "3px solid var(--color-accent)",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {t("register")}
          </a>
        </div>
      </section>

      {/* ===== HEADLINERS ===== */}
      {/* #headliners { bg:bg-secondary; text-align:center; padding:80px 0 } */}
      <section
        id="headliners"
        style={{
          backgroundColor: "var(--color-dark-secondary)",
          textAlign: "center",
          padding: "80px 0",
        }}
      >
        <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: HEADING_FONT,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {t("headlinersTitle")}
          </h2>
          {/* .headliner-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:30px; margin-top:50px } */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "30px",
              marginTop: "50px",
            }}
          >
            {[
              { name: t("headliner1Name"), role: t("headliner1Role"), img: HEADLINER_IMAGES[0], num: "01" },
              { name: t("headliner2Name"), role: t("headliner2Role"), img: HEADLINER_IMAGES[1], num: "02" },
              { name: t("headliner3Name"), role: t("headliner3Role"), img: HEADLINER_IMAGES[2], num: "03" },
            ].map((h) => (
              /* .headliner-card { position:relative; border-bottom:5px solid accent; overflow:hidden } */
              <div
                key={h.num}
                className="group"
                style={{
                  position: "relative",
                  borderBottom: "5px solid var(--color-accent)",
                  overflow: "hidden",
                }}
              >
                {/* .headliner-image { width:100%; height:400px; object-fit:cover; filter:grayscale(100%) contrast(120%); transition:all 0.3s } */}
                {/* hover: filter:grayscale(0%) contrast(100%); transform:scale(1.05) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={h.img}
                  alt={h.name}
                  className="grayscale contrast-[1.2] transition-all duration-300 group-hover:scale-105 group-hover:grayscale-0 group-hover:contrast-100"
                  style={{ width: "100%", height: "400px", objectFit: "cover" }}
                />
                {/* .headliner-info { position:absolute; bottom:0; left:0; width:100%; padding:20px; background:gradient; text-align:left } */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    padding: "20px",
                    background: "linear-gradient(to top, rgba(0,0,0,1), transparent)",
                    textAlign: "left",
                  }}
                >
                  {/* .headliner-name { font-size:2rem; margin-bottom:5px } */}
                  <h3
                    style={{
                      fontFamily: HEADING_FONT,
                      fontSize: "2rem",
                      marginBottom: "5px",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                    }}
                  >
                    {h.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: BODY_FONT,
                      color: "var(--color-accent)",
                      textTransform: "uppercase",
                    }}
                  >
                    {h.role}
                  </p>
                </div>
                {/* .headliner-number { font-family:heading; font-size:6rem; color:accent; opacity:0.5; line-height:0.8; position:absolute; bottom:10px; right:10px; z-index:-1 } */}
                <span
                  style={{
                    fontFamily: HEADING_FONT,
                    fontSize: "6rem",
                    color: "var(--color-accent)",
                    opacity: 0.5,
                    lineHeight: "0.8",
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    zIndex: -1,
                  }}
                >
                  {h.num}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DETAILS ===== */}
      {/* #details { bg:bg-main; padding:80px 0; background-image:concrete texture } */}
      <section
        id="details"
        style={{
          backgroundColor: "var(--color-dark-primary)",
          padding: "80px 0",
          backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')",
        }}
      >
        <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
          {/* h2 — left aligned (no text-align:center in template #details) */}
          <h2
            style={{
              fontFamily: HEADING_FONT,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {t("detailsHeading")}
          </h2>
          {/* .details-flex { display:flex; flex-wrap:wrap; justify-content:space-between; margin-top:50px; border:2px solid #333; background:rgba(0,0,0,0.8) } */}
          <div
            className="details-flex"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              marginTop: "50px",
              border: "2px solid #333",
              background: "rgba(0,0,0,0.8)",
            }}
          >
            {/* .detail-box { flex:1 1 300px; padding:40px; border-right:2px solid #333 } */}
            <div
              className="detail-box"
              style={{ flex: "1 1 300px", padding: "40px", borderRight: "2px solid #333" }}
            >
              {/* .detail-box h3 { font-size:2rem; margin-bottom:20px; color:accent } */}
              <h3
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: "2rem",
                  marginBottom: "20px",
                  color: "var(--color-accent)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {t("lineupHeader")}
              </h3>
              {/* .detail-item { margin-bottom:25px } */}
              <div style={{ marginBottom: "25px" }}>
                {/* .detail-label { font-weight:900; display:block; text-transform:uppercase; margin-bottom:5px; color:text-gray } */}
                <span
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 900,
                    display: "block",
                    textTransform: "uppercase",
                    marginBottom: "5px",
                    color: "var(--color-text-gray)",
                  }}
                >
                  12:00
                </span>
                {/* .detail-value { font-size:1.2rem; font-weight:700 } */}
                <span style={{ fontFamily: BODY_FONT, fontSize: "1.2rem", textTransform: "uppercase",fontWeight: 700 }}>
                  {t("detailsLineup1")}
                </span>
              </div>

                {/* .detail-item { margin-bottom:25px } */}
                <div style={{ marginBottom: "25px" }}>
                    {/* .detail-label { font-weight:900; display:block; text-transform:uppercase; margin-bottom:5px; color:text-gray } */}
                    <span
                        style={{
                            fontFamily: BODY_FONT,
                            fontWeight: 900,
                            display: "block",
                            textTransform: "uppercase",
                            marginBottom: "5px",
                            color: "var(--color-text-gray)",
                        }}
                    >
                  14:00
                </span>
                    {/* .detail-value { font-size:1.2rem; font-weight:700 } */}
                    <span style={{ fontFamily: BODY_FONT, fontSize: "1.2rem", textTransform: "uppercase",fontWeight: 700 }}>
                  {t("detailsLineup2")}
                </span>

                </div>
                {/* .detail-item { margin-bottom:25px } */}
                <div style={{ marginBottom: "25px" }}>
                    {/* .detail-label { font-weight:900; display:block; text-transform:uppercase; margin-bottom:5px; color:text-gray } */}
                    <span
                        style={{
                            fontFamily: BODY_FONT,
                            fontWeight: 900,
                            display: "block",
                            textTransform: "uppercase",
                            marginBottom: "5px",
                            color: "var(--color-text-gray)",
                        }}
                    >
                  18:00
                </span>
                    {/* .detail-value { font-size:1.2rem; font-weight:700 } */}
                    <span style={{ fontFamily: BODY_FONT, fontSize: "1.2rem", textTransform: "uppercase",fontWeight: 700 }}>
                  {t("detailsLineup3")}
                </span>
                </div>
            </div>

            <div
              className="detail-box"
              style={{ flex: "1 1 300px", padding: "40px", borderRight: "2px solid #333" }}
            >
              <h3
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: "2rem",
                  marginBottom: "20px",
                  color: "var(--color-accent)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {t("locationHeader")}
              </h3>
              <div style={{ marginBottom: "25px" }}>
                <span
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 900,
                    display: "block",
                    textTransform: "uppercase",
                    marginBottom: "5px",
                    color: "var(--color-text-gray)",
                  }}
                >
                  {t("dateHeader")}
                </span>
                <span style={{ fontFamily: BODY_FONT, fontSize: "1.2rem", textTransform: "uppercase",fontWeight: 700 }}>
                  {t("detailsLocationDate")}
                </span>
              </div>
                <div style={{ marginBottom: "25px" }}>
                <span
                    style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 900,
                        display: "block",
                        textTransform: "uppercase",
                        marginBottom: "5px",
                        color: "var(--color-text-gray)",
                    }}
                >
                  {t("venueHeader")}
                </span>
                    <span style={{ fontFamily: BODY_FONT, fontSize: "1.2rem", textTransform: "uppercase",fontWeight: 700 }}>
                  {t("detailsLocationStage")}
                </span>
                </div>
                <div style={{ marginBottom: "25px" }}>
                <span
                    style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 900,
                        display: "block",
                        textTransform: "uppercase",
                        marginBottom: "5px",
                        color: "var(--color-text-gray)",
                    }}
                >
                  {t("addressHeader")}
                </span>
                    <span style={{ fontFamily: BODY_FONT, fontSize: "1.2rem", textTransform: "uppercase",fontWeight: 700 }}>
                  {t("detailsLocationAddress")}
                </span>
                </div>
            </div>

            {/* last detail-box: no border-right */}
            <div
              className="detail-box"
              style={{ flex: "1 1 300px", padding: "40px" }}
            >
              <h3
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: "2rem",
                  marginBottom: "20px",
                  color: "var(--color-accent)",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {t("infoHeader")}
              </h3>
              <div style={{ marginBottom: "25px" }}>
                <span
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 900,
                    display: "block",
                    textTransform: "uppercase",
                    marginBottom: "5px",
                    color: "var(--color-text-gray)",
                  }}
                >
                  {t("dressCodeHeader")}
                </span>
                <span style={{ fontFamily: BODY_FONT, fontSize: "1.2rem", textTransform: "uppercase",fontWeight: 700 }}>
                  {t("detailsInfoDressCode")}
                </span>
              </div>
                <div style={{ marginBottom: "25px" }}>
                <span
                    style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 900,
                        display: "block",
                        textTransform: "uppercase",
                        marginBottom: "5px",
                        color: "var(--color-text-gray)",
                    }}
                >
                  {t("cateringHeader")}
                </span>
                    <span style={{ fontFamily: BODY_FONT, fontSize: "1.2rem", textTransform: "uppercase",fontWeight: 700 }}>
                  {t("detailsInfoCatering")}
                </span>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== RSVP ===== */}
      {/* #rsvp { bg:bg-secondary; padding:80px 0; text-align:center } */}
      <section
        id="rsvp"
        style={{
          backgroundColor: "var(--color-dark-secondary)",
          padding: "80px 0",
          textAlign: "center",
        }}
      >
        <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: HEADING_FONT,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {t("rsvpHeading")}
          </h2>
          <p style={{ fontFamily: BODY_FONT, marginTop: "10px", color: "var(--color-text-gray)" }}>
            {t("rsvpDescription")}
          </p>
          {/* .rsvp-form { max-width:600px; margin:50px auto 0; background:bg-main; padding:40px; border:2px solid accent } */}
          <div
            style={{
              maxWidth: "600px",
              margin: "50px auto 0",
              background: "var(--color-dark-primary)",
              padding: "40px",
              border: "2px solid var(--color-accent)",
              textAlign: "left",
            }}
          >
            <RegistrationForm />
          </div>
          {/* Already registered link */}
          <div style={{ marginTop: "20px" }}>
            <Button href="/resend-link" variant="secondary">
              {t("alreadyRegistered")}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
