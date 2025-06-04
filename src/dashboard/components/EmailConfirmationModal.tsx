import React from "react";
import ustpLogo from "../../assets/ustp-things-logo.png";
import xIcon from "../../assets/ustp thingS/X button.png";

type Props = {
  open: boolean;
  onClose: () => void;
  onResend: () => void;
};

const EmailConfirmationModal: React.FC<Props> = ({ open, onClose, onResend }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur transition-all duration-300" />
      {/* Modal content */}
      <div className="relative bg-white rounded-3xl shadow-2xl px-12 py-10 flex flex-col items-center min-w-[400px] min-h-[350px] border-4 border-[#ECB3A8] animate-fade-in-scale">
        <button
          className="absolute top-4 right-4 text-2xl text-[#F88379] hover:text-red-400"
          onClick={onClose}
        >
          <img src={xIcon} alt="Close" className="w-8 h-8" />
        </button>
        <img src={ustpLogo} alt="USTP Things" className="w-32 mb-4" />
        <h2 className="text-3xl font-bold text-[#F88379] mb-4 text-center">
          Email Confirmation Required
        </h2>
        <p className="text-center text-[#F88379] mb-8">
          We sent you an email.<br />
          Check your inbox to activate the account. If the confirmation email is not in your inbox, please check the Spam. Thank you.
        </p>
        <button
          className="bg-[#F88379] text-white font-semibold px-8 py-2 rounded-full shadow hover:bg-[#f88379cc] transition"
          onClick={onResend}
        >
          Resend Email
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmationModal;
