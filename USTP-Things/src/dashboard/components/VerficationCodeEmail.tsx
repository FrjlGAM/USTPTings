// import React, { useState } from "react";
import ustpLogo from "../../assets/ustp-things-logo.png";
import closeIcon from "../../assets/ustp thingS/X button.png";

type VerificationCodeEmailModalProps = {
  onClose: () => void;
  onCheckVerification: () => void;
};

export default function VerificationCodeEmail({ onClose, onCheckVerification }: VerificationCodeEmailModalProps) {
  // const [isSaveHovered, setIsSaveHovered] = useState(false);

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   onCheckVerification();
  // };

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 1000,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(180, 180, 255, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          padding: "32px 32px 32px 32px",
          minWidth: 420,
          maxWidth: "90vw",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
          aria-label="Close"
        >
          <img src={closeIcon} alt="Close" style={{ width: 32, height: 32 }} />
        </button>
        {/* Logo */}
        <img src={ustpLogo} alt="USTP Things" style={{ width: 90, marginBottom: 8 }} />
        {/* Title */}
        <div
          style={{
            color: "#F88379",
            fontWeight: 700,
            fontSize: 28,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Enter Verification Code
        </div>
        <div style={{ color: "#F88379", marginBottom: 16, textAlign: "center" }}>
          A verification link has been sent to your email. Please click the link, then click the button below.
        </div>
        <button
          onClick={onCheckVerification}
          style={{
            border: "2px solid #F88379",
            color: "#F88379",
            fontWeight: 600,
            fontSize: 18,
            borderRadius: 6,
            padding: "8px 64px",
            background: "transparent",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          I've Verified My Email
        </button>
      </div>
    </div>
  );
}
