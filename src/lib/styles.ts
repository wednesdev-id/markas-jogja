import { ReactElement, CSSProperties } from "react";
import { C } from "./utils";

export const cardStyle: CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 1px 2px rgba(29,39,64,0.05)" };
export const inputStyle: CSSProperties = { border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: C.ink, boxSizing: "border-box" };
export const btnPrimary: CSSProperties = { background: C.ink, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 600 };
export const btnSmall: CSSProperties = { ...btnPrimary, padding: "5px 13px", fontSize: 15 };
export const btnGhost: CSSProperties = { background: "none", border: "none", color: "#9AA3B8", fontSize: 13, padding: "2px 6px" };
export const badge: CSSProperties = { fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: "3px 11px", whiteSpace: "nowrap" };
export const eyebrow: CSSProperties = { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: C.inkSoft };
export const fieldLabel: CSSProperties = { fontSize: 12, color: C.inkSoft, fontWeight: 600, display: "block" };
export const h1: CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 30, margin: "4px 0 0", fontWeight: 800 };
