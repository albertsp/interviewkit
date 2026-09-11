import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "InterviewKit — Practica para tu próxima entrevista técnica";
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
          alignItems: "center",
          justifyContent: "center",
          background: "#05070a",
          backgroundImage:
            "radial-gradient(circle at 50% 32%, rgba(0,198,201,0.22) 0%, rgba(0,198,201,0) 60%)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 132,
            height: 132,
            borderRadius: 28,
            background: "#0b0f14",
            border: "2px solid rgba(0,198,201,0.35)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <svg width="76" height="76" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              ry="2"
              stroke="#00c6c9"
              strokeWidth="2"
            />
            <path
              d="m7 11 2-2-2-2"
              stroke="#00c6c9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 13h4"
              stroke="#00c6c9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            color: "#f8f8f8",
            fontFamily: "Geist",
            letterSpacing: -2,
          }}
        >
          Interview<span style={{ color: "#00c6c9" }}>Kit</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 32,
            fontWeight: 500,
            color: "rgba(248,248,248,0.6)",
            fontFamily: "Geist",
          }}
        >
          Practica para tu próxima entrevista técnica
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
