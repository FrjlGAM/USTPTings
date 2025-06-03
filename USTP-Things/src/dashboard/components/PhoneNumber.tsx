import React, { useState } from "react";
import ustpLogo from "../../assets/ustp-things-logo.png";
import closeIcon from "../../assets/ustp thingS/X button.png";

type PhoneNumberModalProps = {
  onClose: () => void;
  onSave: (phoneNumber: string) => void;
  initialPhoneNumber?: string;
};

export default function PhoneNumber({ onClose, onSave, initialPhoneNumber = "" }: PhoneNumberModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [isSaveHovered, setIsSaveHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(phoneNumber);
  };

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
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Phone Number
        </div>
        {/* Phone Number Input */}
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <input
            type="tel"
            placeholder="Enter Phone Number"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 300,
              padding: "12px 16px",
              border: "none",
              borderBottom: "2px solid #F88379",
              outline: "none",
              fontSize: 16,
              color: "#888",
              marginBottom: 32,
              background: "transparent",
              textAlign: "center",
              fontFamily: "inherit",
            }}
            required
          />
          <button
            type="submit"
            style={{
              border: "2px solid #F88379",
              color: isSaveHovered ? "#fff" : "#F88379",
              background: isSaveHovered ? "#F88379" : "transparent",
              fontWeight: 600,
              fontSize: 18,
              borderRadius: 6,
              padding: "8px 64px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={() => setIsSaveHovered(true)}
            onMouseLeave={() => setIsSaveHovered(false)}
          >
            Next
          </button>
        </form>
      </div>
    </div>
  );
}
