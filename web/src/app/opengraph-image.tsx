import { ImageResponse } from "next/og";

// Link preview for LinkedIn, iMessage and the like. Rendered once at build
// time; colors match --bg, --brand and --text-secondary in globals.css.
export const alt = "PowrFit: log workouts and track your progress";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "radial-gradient(circle at 85% 20%, #2a2405 0%, #0a0a0a 55%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="112" height="112" viewBox="0 0 512 512">
            <rect width="512" height="512" rx="112" fill="#161616" />
            <path
              d="M308.6 52.5 92.2 306.1c-12.4 14.5-2.1 36.9 17 36.9h113.5L195.4 462c-4.8 21 22 34.6 36.2 18.4l204.8-252.2c11.9-14.7 1.5-36.6-17.4-36.6H310.4l34.5-118.5c6-20.7-22.3-36.9-36.3-20.6Z"
              fill="#ffd60a"
            />
          </svg>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3 }}>PowrFit</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 52, fontWeight: 700, lineHeight: 1.15 }}>
          Log every set. See your progress.
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#8e8e93" }}>
          A free workout tracker that installs from your browser.
        </div>
      </div>
    ),
    size,
  );
}
