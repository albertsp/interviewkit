import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "InterviewKit — Practica la entrevista técnica antes de que cuente";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [bold, medium] = await Promise.all([
    readFile(join(process.cwd(), "app/og-fonts/Geist-Bold.ttf")),
    readFile(join(process.cwd(), "app/og-fonts/Geist-Medium.ttf")),
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
          background: "#f6f1e6",
          padding: "72px 80px",
          fontFamily: "Geist",
          color: "#1d1a16",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <path
              d="M4.5 17.5c2.2 1.6 4.6 4.6 6.6 8.2C14.6 15.6 20.4 8.4 27.5 4.8"
              stroke="#c8321c"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            InterviewKit
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -3,
            maxWidth: 980,
          }}
        >
          Practica la entrevista técnica antes de que cuente.
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 500,
            color: "#6b6258",
          }}
        >
          Preguntas de código con IA, corrección al instante y cards para repasar.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: bold, weight: 700, style: "normal" },
        { name: "Geist", data: medium, weight: 500, style: "normal" },
      ],
    }
  );
}
