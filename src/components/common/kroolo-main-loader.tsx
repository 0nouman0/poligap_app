import React from "react";

type Props = {};

// Lightweight Poligap splash replacing the Kroolo animation
const KrooloMainLoader = (props: Props) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img
          src="/assets/poligap-high-resolution-logo.png"
          alt="Poligap"
          width={160}
          height={160}
          style={{ display: "inline-block", marginBottom: 16, objectFit: 'contain' }}
        />
        <div style={{ color: "#6B7280", fontSize: 14 }}>Loading Poligap…</div>
      </div>
    </div>
  );
};

export default KrooloMainLoader;
