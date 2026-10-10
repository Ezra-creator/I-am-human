import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1317",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#16a34a",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
