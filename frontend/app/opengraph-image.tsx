import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "InterviewKit: ensaya tu entrevista técnica con IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [black, medium] = await Promise.all([
    readFile(join(process.cwd(), "app/og-fonts/SchibstedGrotesk-900.ttf")),
    readFile(join(process.cwd(), "app/og-fonts/SchibstedGrotesk-500.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbfbf8",
          padding: "64px 72px",
          fontFamily: "Schibsted Grotesk",
          color: "#0a0a0a",
          borderBottom: "28px solid #1f3bff",
        }}
      >
        <div style={{ display: "flex", fontSize: 46, fontWeight: 900, letterSpacing: -3 }}>
          Interview<span style={{ color: "#1f3bff" }}>/</span>Kit
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 108,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -6,
            maxWidth: 1040,
          }}
        >
          Ensaya la entrevista técnica antes de la real.
        </div>

        <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: "#55554f" }}>
          Cinco preguntas (teoría y código), corrección con IA y cards de repaso.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Schibsted Grotesk", data: black, weight: 900, style: "normal" },
        { name: "Schibsted Grotesk", data: medium, weight: 500, style: "normal" },
      ],
    }
  );
}
