import React, { useState } from "react";
import homeLogo from "../../assets/ustp thingS/Home.png";
import { useNavigate } from "react-router-dom";
import RequestAccountDeletion from "../components/RequestAccountDeletion";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

type SettingsProps = {
  onAccountSecurityClick: () => void;
  onCommunityRulesClick: () => void;
};

export default function Settings({ onAccountSecurityClick, onCommunityRulesClick }: SettingsProps) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Settings Header */}
      <div
        style={{
          background: "#fff",
          display: "flex",
          alignItems: "center",
          height: 72,
          paddingLeft: 55,
          paddingRight: 24,
          gap: 18,
          borderBottom: "1px solid #ccc",
          boxShadow: "0 2px 4px 0 rgba(0,0,0,0.04)",
        }}
      >
        <img
          src={homeLogo}
          alt="Home Icon"
          className="h-7 w-auto"
          style={{ cursor: "pointer" }}
          onClick={() => navigate('/dashboard')}
        />
        <div style={{
          width: 2,
          height: 36,
          background: "#F48C8C",
          marginLeft: 18,
          marginRight: 18,
        }} />
        <h1 className="text-3xl font-bold" style={{ color: "#F88379" }}>
          Settings
        </h1>
      </div>
      {/* Main content */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        {/* My Account */}
        <div
          style={{
            color: "#7A8A8D",
            fontWeight: 700,
            marginBottom: 8,
            fontSize: 18,
            fontFamily: "inherit",
          }}
        >
          My Account
        </div>
        <div
          style={{
            background: "#FFF3F3",
            borderRadius: 6,
            marginBottom: 24,
            padding: 0,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 17,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onClick={onAccountSecurityClick}
          >
            Account & Security <span style={{ color: "#888" }}>&gt;</span>
          </div>
        </div>
        {/* Support */}
        <div
          style={{
            color: "#7A8A8D",
            fontWeight: 700,
            marginBottom: 8,
            fontSize: 18,
            fontFamily: "inherit",
          }}
        >
          Support
        </div>
        <div
          style={{
            background: "#FFF3F3",
            borderRadius: 6,
            marginBottom: 8,
            padding: 0,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 17,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onClick={onCommunityRulesClick}
          >
            Community Rules <span style={{ color: "#888" }}>&gt;</span>
          </div>
        </div>
        <div
          style={{
            background: "#FFF3F3",
            borderRadius: 6,
            marginBottom: 64,
            padding: 0,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 17,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onClick={() => setShowDeleteModal(true)}
          >
            Request Account Deletion <span style={{ color: "#888" }}>&gt;</span>
          </div>
        </div>
        {/* Logout */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button
            style={{
              border: "2px solid #F48C8C",
              color: "#F48C8C",
              fontWeight: 600,
              fontSize: 18,
              borderRadius: 6,
              padding: "10px 100px",
              background: "transparent",
              cursor: loggingOut ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "background 0.2s, color 0.2s",
              opacity: loggingOut ? 0.6 : 1,
            }}
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              await signOut(auth);
              setTimeout(() => {
                navigate("/");
              }, 800);
            }}
            onMouseOver={e => {
              if (!loggingOut) {
                e.currentTarget.style.background = "#F48C8C";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseOut={e => {
              if (!loggingOut) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#F48C8C";
              }
            }}
          >
            {loggingOut ? (
              <span>
                <span className="loader" style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  border: "3px solid #fff",
                  borderTop: "3px solid #F48C8C",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginRight: 10,
                  verticalAlign: "middle"
                }} />
                Logging out...
              </span>
            ) : "Logout"}
          </button>
        </div>
      </div>
      {showDeleteModal && (
        <RequestAccountDeletion onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}