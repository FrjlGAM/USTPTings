import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import homeLogo from "../../assets/ustp thingS/Home.png";
import Username from "../components/Username"; // adjust the path if needed
import PhoneNumber from "../components/PhoneNumber"; // adjust the path if needed
import Email from "../components/Email";
import VerificationCodeEmail from "../components/VerficationCodeEmail";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { updateEmail, sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import SecurityCheck from "../components/SecurityCheck";

type AccountandSecurityProps = {
  onSettingsClick: () => void;
  onMyProfileClick: () => void;
};

export default function AccountandSecurity({ onSettingsClick, onMyProfileClick }: AccountandSecurityProps) {
  const navigate = useNavigate();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [username, setUsername] = useState("N/A");
  const [loadingUsername, setLoadingUsername] = useState(true);
  const [showPhoneNumberModal, setShowPhoneNumberModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("N/A");
  const [loadingPhoneNumber, setLoadingPhoneNumber] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showVerificationCodeModal, setShowVerificationCodeModal] = useState(false);
  const [showSecurityCheckModal, setShowSecurityCheckModal] = useState(false);
  const [email, setEmail] = useState("N/A");
  // @ts-ignore
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      setLoadingUsername(true);
      setLoadingPhoneNumber(true);
      try {
        // Set email from auth user
        setEmail(auth.currentUser.email || "N/A");
        
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || "N/A");
          setPhoneNumber(userData.phoneNumber || "N/A");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUsername("N/A");
        setPhoneNumber("N/A");
      } finally {
        setLoadingUsername(false);
        setLoadingPhoneNumber(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveUsername = async (newUsername: string) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { username: newUsername }, { merge: true });
    setUsername(newUsername);
    setShowUsernameModal(false);
  };

  const handleSavePhoneNumber = async (newPhoneNumber: string) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { phoneNumber: newPhoneNumber }, { merge: true });
    setPhoneNumber(newPhoneNumber);
    setShowPhoneNumberModal(false);
  };

  const handleSaveEmail = async (newEmail: string, password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    try {
      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. Update email
      await updateEmail(auth.currentUser, newEmail);

      // 3. Send verification link
      await sendEmailVerification(auth.currentUser);

      setEmail(newEmail);
      setShowEmailModal(false);
      setShowVerificationCodeModal(true);
      // Optionally, show a message: "A verification link has been sent to your email."
    } catch (error: any) {
      alert(error.message);
    }
  };
  // @ts-ignore
  const handleSaveVerificationCode = (code: string) => {
    setVerificationCode(code);
    setShowVerificationCodeModal(false);
    // Here, you would verify the code with your backend/Firebase
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      setShowVerificationCodeModal(false);
      alert("Email verified successfully!");
      // Optionally, update Firestore or UI here
    } else {
      alert("Email not verified yet. Please check your inbox and click the verification link.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Header */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="text-3xl font-bold"
            style={{ color: "#F88379", opacity: 0.63, cursor: "pointer" }}
            onClick={onSettingsClick}
          >
            Settings
          </span>
          <span
            className="text-3xl font-bold"
            style={{ color: "#F88379", opacity: 0.63 }}
          >
            &gt;
          </span>
          <span className="text-3xl font-bold" style={{ color: "#F88379" }}>
            Account & Security
          </span>
        </div>
      </div>
      {/* Main content */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        {/* Account Section */}
        <div
          style={{
            color: "#7A8A8D",
            fontWeight: 700,
            marginBottom: 8,
            fontSize: 18,
            fontFamily: "inherit",
          }}
        >
          Account
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
            onClick={onMyProfileClick}
          >
            My Profile <span style={{ color: "#888" }}>&gt;</span>
          </div>
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
              fontFamily: "inherit",
              cursor: "pointer",
            }}
            onClick={() => setShowUsernameModal(true)}
          >
            Username
            <span style={{ color: "#888", fontSize: 15 }}>
              {loadingUsername ? "Loading..." : username} <span style={{ marginLeft: 8, color: "#888" }}>&gt;</span>
            </span>
          </div>
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
              fontFamily: "inherit",
              cursor: "pointer",
            }}
            onClick={() => setShowPhoneNumberModal(true)}
          >
            Phone
            <span style={{ color: "#888", fontSize: 15 }}>
              {loadingPhoneNumber ? "Loading..." : phoneNumber} <span style={{ marginLeft: 8, color: "#888" }}>&gt;</span>
            </span>
          </div>
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
              fontFamily: "inherit",
              cursor: "pointer",
            }}
            onClick={() => setShowEmailModal(true)}
          >
            Email
            <span style={{ color: "#888", fontSize: 15 }}>
              {loadingUsername ? "Loading..." : email} <span style={{ marginLeft: 8, color: "#888" }}>&gt;</span>
            </span>
          </div>
        </div>
        <div
          style={{
            background: "#FFF3F3",
            borderRadius: 6,
            marginBottom: 8,
            padding: 0,
          }}
        >
          <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17, cursor: "pointer", fontFamily: "inherit" }}
            onClick={() => setShowSecurityCheckModal(true)}
          >
            Change Password <span style={{ color: "#888" }}>&gt;</span>
          </div>
        </div>
      </div>
      {/* No visible back button */}
      {showUsernameModal && (
        <Username
          onClose={() => setShowUsernameModal(false)}
          onSave={handleSaveUsername}
          initialUsername={username}
        />
      )}
      {showPhoneNumberModal && (
        <PhoneNumber
          onClose={() => setShowPhoneNumberModal(false)}
          onSave={handleSavePhoneNumber}
          initialPhoneNumber={phoneNumber}
        />
      )}
      {showEmailModal && (
        <Email
          onClose={() => setShowEmailModal(false)}
          onSave={handleSaveEmail}
          initialEmail={email}
        />
      )}
      {showVerificationCodeModal && (
        <VerificationCodeEmail
          onClose={() => setShowVerificationCodeModal(false)}
          onCheckVerification={handleCheckVerification}
        />
      )}
      {showSecurityCheckModal && (
        <SecurityCheck
          open={showSecurityCheckModal}
          onClose={() => setShowSecurityCheckModal(false)}
          onVerify={() => setShowSecurityCheckModal(false)}
        />
      )}
    </div>
  );
}
