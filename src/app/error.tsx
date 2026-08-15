"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 24,
      fontFamily: "Arial, Helvetica, sans-serif",
    }}>
      <section style={{ textAlign: "center" }}>
        <h2 style={{ marginBottom: 14 }}>Something went wrong</h2>
        <button
          type="button"
          onClick={reset}
          style={{
            border: 0,
            borderRadius: 999,
            padding: "11px 20px",
            background: "#1376ff",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
