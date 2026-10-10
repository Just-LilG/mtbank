"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f6f6f8", color: "#14161c" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 360 }}>
            <h1 style={{ fontSize: 24, margin: 0 }}>Ubex Bank is having a moment</h1>
            <p style={{ color: "#6b7180" }}>Your money is safe. Please try again.</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 16, background: "#e10600", color: "#fff", border: 0, borderRadius: 999, padding: "12px 24px", fontSize: 16 }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
