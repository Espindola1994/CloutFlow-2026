"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 24,
      fontFamily: "Arial, Helvetica, sans-serif",
      background: "#fff",
      color: "#081126",
    }}>
      <section style={{ textAlign: "center", maxWidth: 460 }}>
        <h1 style={{ fontSize: 34, margin: "0 0 10px" }}>Page not found</h1>
        <p style={{ color: "#66738b", margin: "0 0 22px" }}>
          This page is unavailable or the address has changed.
        </p>
        <Link href="/" style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 42,
          padding: "0 22px",
          borderRadius: 999,
          background: "#1376ff",
          color: "#fff",
          fontWeight: 800,
          textDecoration: "none",
        }}>
          Back to Home
        </Link>
      </section>
    </main>
  );
}
