import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "I’m human — Natural rewrites for AI drafts";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f1317",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#16a34a",
            }}
          />
          <span
            style={{
              fontSize: "44px",
              fontWeight: 700,
              color: "#f3f5f7",
              letterSpacing: "-0.03em",
            }}
          >
            I’m human
          </span>
        </div>

        <p
          style={{
            fontSize: "36px",
            lineHeight: 1.35,
            color: "#94a3b8",
            maxWidth: "900px",
            margin: 0,
            fontWeight: 400,
          }}
        >
          Rewrite AI-drafted text so it sounds like you wrote it.
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
