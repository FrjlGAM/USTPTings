import React, { useState } from "react";
import ustpLogo from "../../assets/ustp-things-logo.png";
import closeIcon from "../../assets/ustp thingS/X button.png";
import { deleteUser } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useNavigate } from "react-router-dom";
import { deleteDoc, doc, collection, getDocs, query, where } from "firebase/firestore";

type RequestAccountDeletionProps = {
  onClose: () => void;
};

export default function RequestAccountDeletion({ onClose }: RequestAccountDeletionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) throw new Error("No user is currently signed in");
      const userId = user.uid;

      // Delete from users collection (by UID)
      await deleteDoc(doc(db, "users", userId));

      // Delete from verifiedAccounts collection (by UID)
      await deleteDoc(doc(db, "verifiedAccounts", userId));

      // In case the document ID is not the UID, search by userId field
      // (for legacy or inconsistent data)
      const vAccQuery = query(
        collection(db, "verifiedAccounts"),
        where("userId", "==", userId)
      );
      const vAccSnap = await getDocs(vAccQuery);
      for (const docSnap of vAccSnap.docs) {
        await deleteDoc(doc(db, "verifiedAccounts", docSnap.id));
      }

      // Delete from admin collection if exists
      await deleteDoc(doc(db, "admin", userId));

      // Finally delete the Firebase Auth account
      await deleteUser(user);

      // After successful deletion, navigate to home page
      navigate("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
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
        <img src={ustpLogo} alt="USTP Things" style={{ width: 90, marginBottom: 8 }} />
        <div
          style={{
            color: "#F88379",
            fontWeight: 700,
            fontSize: 28,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Request Account Deletion
        </div>
        <div
          style={{
            background: "#FFF3F3",
            borderRadius: 6,
            padding: "18px 16px",
            color: "#444",
            fontSize: 17,
            marginBottom: 32,
            textAlign: "center",
            width: "100%",
          }}
        >
          We are sad that you want to leave us, but please note that account deletion is irreversible
        </div>
        {error && (
          <div
            style={{
              color: "#dc3545",
              marginBottom: 16,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          style={{
            border: "2px solid #F88379",
            color: "#F88379",
            fontWeight: 600,
            fontSize: 18,
            borderRadius: 6,
            padding: "8px 64px",
            background: "transparent",
            cursor: isDeleting ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: isDeleting ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isDeleting ? (
            <>
              <span
                className="loader"
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  border: "3px solid #F88379",
                  borderTop: "3px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </button>
      </div>
    </div>
  );
}
