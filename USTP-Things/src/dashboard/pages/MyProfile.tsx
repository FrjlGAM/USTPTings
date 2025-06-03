import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import homeLogo from "../../assets/ustp thingS/Home.png";
import profilePic from "../../assets/ustp thingS/Person.png"; // Using Person.png instead of sample-profile.png
import pencilIcon from "../../assets/ustp thingS/Pencil.png";
// import editIcon from "../../assets/ustp thingS/Edit.png"; // If you want a small edit icon
import Name from "../components/Name"; // adjust the path if needed
import Gender from "../components/Gender"; // adjust the path if needed
import { auth, db } from "../../lib/firebase"; // adjust path as needed
import { doc, getDoc, setDoc } from "firebase/firestore";

type MyProfileProps = {
  onSettingsClick: () => void;
  setView: (view: string) => void;
};

export default function MyProfile({ onSettingsClick, setView }: MyProfileProps) {
  const navigate = useNavigate();
  const [showNameModal, setShowNameModal] = useState(false);
  const [name, setName] = useState(""); // user's name
  const [loadingName, setLoadingName] = useState(true);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [gender, setGender] = useState<"Female" | "Male" | "">(""); // user's gender
  const [loadingGender, setLoadingGender] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      setLoadingName(true);
      setLoadingGender(true);
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setName(userDoc.data().name || "");
        setGender(userDoc.data().gender || "");
        setProfileImage(userDoc.data().profileImage || null);
      }
      setLoadingName(false);
      setLoadingGender(false);
    };
    fetchProfile();
  }, []);

  const handleSaveName = async (newName: string) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { name: newName }, { merge: true });
    setName(newName);
    setShowNameModal(false);
  };

  const handleSaveGender = async (newGender: "Female" | "Male") => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { gender: newGender }, { merge: true });
    setGender(newGender);
    setShowGenderModal(false);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !auth.currentUser) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'profile_picture'); // your unsigned preset name

      // Use your actual Cloudinary cloud name here
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dr7t6evpc/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (!data.secure_url) {
        throw new Error("No secure_url returned from Cloudinary");
      }
      const url = data.secure_url;

      setProfileImage(url);
      await setDoc(doc(db, "users", auth.currentUser.uid), { profileImage: url }, { merge: true });
      alert("Profile image updated!");
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload image. Check console for details.");
    }
    setUploading(false);
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
          <span className="text-3xl font-bold" style={{ color: "#F88379", opacity: 0.63 }}>
            &gt;
          </span>
          <span
            className="text-3xl font-bold"
            style={{ color: "#F88379", opacity: 0.63, cursor: "pointer" }}
            onClick={() => setView("account")}
          >
            Account & Security
          </span>
          <span className="text-3xl font-bold" style={{ color: "#F88379" }}>
            &gt; <span style={{ fontWeight: 700 }}>My Profile</span>
          </span>
        </div>
      </div>
      {/* Main content */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ textAlign: "center", fontWeight: 600, color: "#444", marginBottom: 16 }}>
          Edit Profile
        </div>
        <div
          style={{
            background: "#FFE9E9",
            borderRadius: 8,
            marginBottom: 24,
            padding: "32px 0 24px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <img
              src={profileImage || profilePic}
              alt="Profile"
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #fff",
                boxShadow: "0 2px 8px #0001",
                filter: uploading ? "blur(3px) brightness(0.8)" : "none",
                transition: "filter 0.2s",
              }}
            />
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <img
              src={pencilIcon}
              alt="Edit"
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.5 : 1,
                pointerEvents: uploading ? "none" : "auto",
              }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            />
            {uploading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 70,
                  height: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.3)",
                  borderRadius: "50%",
                  zIndex: 2,
                  fontWeight: "bold",
                  color: "#F88379",
                  fontSize: 14,
                  backdropFilter: "blur(2px)",
                }}
              >
                Uploading...
              </div>
            )}
          </div>
        </div>
        {/* Profile fields */}
        <div style={{ background: "#FFF3F3", borderRadius: 6, marginBottom: 8 }}>
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 17,
              fontFamily: "inherit",
              borderBottom: "1px solid #f5cccc",
              cursor: "pointer",
            }}
            onClick={() => setShowNameModal(true)}
          >
            Name
            <span style={{ color: "#888", fontSize: 15 }}>
              {loadingName ? "Loading..." : name ? name : "Set now"} <span style={{ marginLeft: 8, color: "#888" }}>&gt;</span>
            </span>
          </div>
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
            onClick={() => setShowGenderModal(true)}
          >
            Gender
            <span style={{ color: "#888", fontSize: 15 }}>
              {loadingGender ? "Loading..." : gender ? gender : "Set now"} <span style={{ marginLeft: 8, color: "#888" }}>&gt;</span>
            </span>
          </div>
        </div>
      </div>
      {showNameModal && (
        <Name
          onClose={() => setShowNameModal(false)}
          onSave={handleSaveName}
          initialName={name}
        />
      )}
      {showGenderModal && (
        <Gender
          onClose={() => setShowGenderModal(false)}
          onSave={handleSaveGender}
          initialGender={gender === "Female" || gender === "Male" ? gender : "Female"}
        />
      )}

      {uploading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            background: "rgba(255,255,255,0.3)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.85)",
              padding: "32px 48px",
              borderRadius: 16,
              boxShadow: "0 2px 16px #0002",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontWeight: "bold",
              color: "#F88379",
              fontSize: 20,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 38 38"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#F88379"
              style={{ marginBottom: 16 }}
            >
              <g fill="none" fillRule="evenodd">
                <g transform="translate(1 1)" strokeWidth="3">
                  <circle strokeOpacity=".3" cx="18" cy="18" r="18"/>
                  <path d="M36 18c0-9.94-8.06-18-18-18">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 18 18"
                      to="360 18 18"
                      dur="1s"
                      repeatCount="indefinite"/>
                  </path>
                </g>
              </g>
            </svg>
            Uploading profile image...
          </div>
        </div>
      )}
    </div>
  );
}
