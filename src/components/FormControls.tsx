"use client";

import React from "react";

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.5rem",
  color: "#555",
  fontWeight: 500,
};

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  border: "1px solid #ddd",
  borderRadius: 4,
  fontSize: "1rem",
  background: "#f1f1f1",
  color: "#232323",
  boxSizing: "border-box" as const,
};

const errorStyle: React.CSSProperties = {
  marginTop: "1rem",
  marginBottom: "1rem",
  padding: "0.75rem",
  backgroundColor: "#fee",
  color: "#c33",
  borderRadius: 4,
  fontSize: "0.9rem",
};

export function Field({ label, required, children }: { label?: string; required?: boolean; children: React.ReactNode; }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {label && <label style={labelStyle}>{label}{required ? " *" : ""}</label>}
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return <input {...rest} style={{ ...baseInputStyle, ...style }} />;
}

export function ReadonlyInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return <input {...rest} readOnly style={{ ...baseInputStyle, ...style }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { style, ...rest } = props;
  return <select {...rest} style={{ ...baseInputStyle, ...style, background: "#fff" }} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { style, ...rest } = props;
  return <textarea {...rest} style={{ ...baseInputStyle, ...style, minHeight: 80 }} />;
}

export { labelStyle, baseInputStyle, errorStyle };

