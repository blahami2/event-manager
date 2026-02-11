export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
      }}
    >
      <main
        style={{
          textAlign: "center",
          padding: "2rem",
          maxWidth: "600px",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Birthday Celebration
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "#666",
            marginBottom: "2rem",
          }}
        >
          Event registration and management coming soon.
        </p>
      </main>
    </div>
  );
}
