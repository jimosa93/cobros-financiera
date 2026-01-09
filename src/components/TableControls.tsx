"use client";

import React from "react";

export function IconButton({ type, onClick, title }: { type: "edit" | "delete"; onClick?: () => void; title?: string }) {
  const common: React.CSSProperties = {
    padding: 8,
    borderRadius: 6,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  if (type === "edit") {
    return (
      <button aria-label={title || "Editar"} title={title || "Editar"} onClick={onClick} style={{ ...common, border: "1px solid #bbb", background: "white" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="#0070f3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="#0070f3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    );
  }
  return (
    <button aria-label={title || "Eliminar"} title={title || "Eliminar"} onClick={onClick} style={{ ...common, border: "1px solid #e57373", background: "#e57373" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11v6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );
}

export function Pagination({ page, totalPages, onPrev, onNext }: { page: number; totalPages: number; onPrev: () => void; onNext: () => void; }) {
  const disabledPrev = page <= 1;
  const disabledNext = page >= totalPages;
  return (
    <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#666" }}>Página {page} de {Math.max(1, totalPages)}</span>
      <button onClick={onPrev} disabled={disabledPrev} style={{ border: "1px solid #ccc", padding: "6px 12px", borderRadius: 6, background: disabledPrev ? "#f5f5f5" : "white", color: disabledPrev ? "#999" : "#333", cursor: disabledPrev ? "not-allowed" : "pointer" }}>Anterior</button>
      <button onClick={onNext} disabled={disabledNext} style={{ border: "1px solid #ccc", padding: "6px 12px", borderRadius: 6, background: disabledNext ? "#f5f5f5" : "white", color: disabledNext ? "#999" : "#333", cursor: disabledNext ? "not-allowed" : "pointer" }}>Siguiente</button>
    </div>
  );
}

