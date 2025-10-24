import React from "react";
import Image from "next/image";

interface KrooloMainLoaderProps {
  message?: string;
}

// Lightweight Poligap splash replacing the Kroolo animation
const KrooloMainLoader = ({ message = "Loading Poligap…" }: KrooloMainLoaderProps) => {
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
        <Image
          src="/assets/Poligap_wide_erased.png"
          alt="Poligap Logo"
          width={340}
          height={120}
          style={{ display: "inline-block", marginBottom: 16, objectFit: 'contain' }}
        />
        <div style={{ color: "#6B7280", fontSize: 14 }}>{message}</div>
      </div>
    </div>
  );
};

export { KrooloMainLoader };
