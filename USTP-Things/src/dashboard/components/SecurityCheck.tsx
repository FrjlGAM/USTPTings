import React, { useState } from "react";
import ustpLogo from "../../assets/ustp-things-logo.png";
import closeIcon from "../../assets/ustp thingS/X button.png";
import { auth } from "../../lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

interface SecurityCheckProps {
  open: boolean;
  onClose: () => void;
  onVerify: () => void;
}

const SecurityCheck: React.FC<SecurityCheckProps> = ({ open, onClose, onVerify }) => {
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showNewPasswordInput, setShowNewPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!open) return null;

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("No user is currently signed in");
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Password verified successfully
      setShowPasswordInput(false);
      setShowNewPasswordInput(true);
      setPassword("");
    } catch (error: any) {
      setError(error.message || "Invalid password. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Validate passwords
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setUpdating(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user is currently signed in");
      }

      await updatePassword(user, newPassword);
      
      // Password updated successfully
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPasswordInput(false);
      onVerify(); // Close the modal
    } catch (error: any) {
      setError(error.message || "Failed to update password. Please try again.");
    } finally {
      setUpdating(false);
    }
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
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {showNewPasswordInput ? "Change Password" : "Security Check"}
        </div>
        {/* Description */}
        <div
          style={{
            color: "#F88379",
            fontSize: 15,
            marginBottom: 32,
            textAlign: "center",
            maxWidth: 350,
          }}
        >
          {showNewPasswordInput 
            ? "Please enter your new password below."
            : "To protect your account security, please verify your identity with one of the methods below."}
        </div>

        {showNewPasswordInput ? (
          <>
            <div style={{ width: "100%", marginBottom: 16 }}>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #F88379",
                  borderRadius: 6,
                  fontSize: 16,
                  color: "#333",
                  outline: "none",
                  marginBottom: 12,
                }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #F88379",
                  borderRadius: 6,
                  fontSize: 16,
                  color: "#333",
                  outline: "none",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleUpdatePassword();
                  }
                }}
              />
              {error && (
                <div style={{ color: "#ff4444", fontSize: 14, marginTop: 8 }}>
                  {error}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setShowNewPasswordInput(false);
                  setShowPasswordInput(true);
                  setNewPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                style={{
                  border: "2px solid #F88379",
                  color: "#F88379",
                  background: "transparent",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 6,
                  padding: "8px 32px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                Back
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={updating}
                style={{
                  border: "2px solid #F88379",
                  color: updating ? "#999" : "#fff",
                  background: updating ? "#eee" : "#F88379",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 6,
                  padding: "8px 32px",
                  cursor: updating ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {updating ? "Updating..." : "Update Password"}
              </button>
            </div>
          </>
        ) : showPasswordInput ? (
          <>
            <div style={{ width: "100%", marginBottom: 16 }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #F88379",
                  borderRadius: 6,
                  fontSize: 16,
                  color: "#333",
                  outline: "none",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleVerifyPassword();
                  }
                }}
              />
              {error && (
                <div style={{ color: "#ff4444", fontSize: 14, marginTop: 8 }}>
                  {error}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setShowPasswordInput(false);
                  setPassword("");
                  setError("");
                }}
                style={{
                  border: "2px solid #F88379",
                  color: "#F88379",
                  background: "transparent",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 6,
                  padding: "8px 32px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPassword}
                disabled={verifying}
                style={{
                  border: "2px solid #F88379",
                  color: verifying ? "#999" : "#fff",
                  background: verifying ? "#eee" : "#F88379",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 6,
                  padding: "8px 32px",
                  cursor: verifying ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setShowPasswordInput(true)}
            style={{
              border: "2px solid #F88379",
              color: "#F88379",
              background: "transparent",
              fontWeight: 600,
              fontSize: 18,
              borderRadius: 6,
              padding: "8px 64px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#F88379";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#F88379";
            }}
          >
            Verify my Password
          </button>
        )}
      </div>
    </div>
  );
};

export default SecurityCheck;
