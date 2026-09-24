"use client";

import { useEffect } from "react";

// Fallback for errors thrown by the root layout itself; must render its own <html>/<body>.
export default function GlobalError({
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
    <html lang="pt-BR">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fff",
          color: "#111",
          padding: 16,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: "#555", marginBottom: 24 }}>
            Ocorreu um erro inesperado. Tente novamente em instantes.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#2f6b3a", color: "#fff", cursor: "pointer", marginRight: 8 }}
          >
            Tentar novamente
          </button>
          <a href="/marketplace" style={{ color: "#2f6b3a" }}>
            Ir para o Mercado
          </a>
        </div>
      </body>
    </html>
  );
}
