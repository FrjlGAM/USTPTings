import logo from '../../assets/ustp-things-logo.png';
import xButton from '../../assets/ustp thingS/X button.png';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 flex flex-col items-center border border-[#F88379] pointer-events-auto max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          className="absolute top-4 right-4 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          <img src={xButton} alt="Close" className="w-8 h-8" />
        </button>
        <img src={logo} alt="USTP Things Logo" className="w-24 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-[#F88379] mb-6 mt-2">Terms and Conditions</h2>
        <div className="w-full text-left text-gray-600 space-y-4">
          <p className="text-sm">
            By proceeding with the verification process on USTP Things, you confirm and agree to the following terms and conditions
          </p>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">1. Accuracy of Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm">You confirm that all details provided during registration (including USTP credentials, name, and contact information) are accurate, complete, and up-to-date.</li>
              <li className="text-sm">Any false, misleading, or incorrect information may result in the suspension or termination of your account.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">2. Verification Process</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm">USTP students must register using valid USTP credentials to gain access as buyers and sellers.</li>
              <li className="text-sm">Sellers, including businesses, must provide the necessary documents for approval and agree to the platform's policies.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">3. Use of Account</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm">Your verified account is personal and non-transferable.</li>
              <li className="text-sm">You are responsible for maintaining the confidentiality of your account credentials and ensuring that your account is used only by you.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">4. Compliance with Platform Rules</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm">You agree to comply with all USTP Things policies, including but not limited to guidelines on posting, transactions, and interactions with other users.</li>
              <li className="text-sm">Any misuse of the platform may result in account suspension or permanent removal.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">5. Liability</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm">USTP Things is a facilitator for buying and selling learning materials and is not responsible for the quality, condition, or legitimacy of the items listed.</li>
              <li className="text-sm">Users must ensure safe and secure transactions</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">6. Agreement to Terms</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm">By completing the verification process, you acknowledge that you have read, understood, and agreed to these terms and conditions.</li>
            </ul>
          </div>

          <p className="text-sm text-gray-700 mt-4">
            Failure to adhere to these terms may result in restrictions on your account or removal from the platform.
          </p>
        </div>
      </div>
    </div>
  );
} 