import React from 'react';
import logo from '../../assets/ustp-things-logo.png';
import xButton from '../../assets/ustp thingS/X button.png';
import { usePreventScroll } from '../../hooks/usePreventScroll';

interface VerificationTermsProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export default function VerificationTerms({ isOpen, onClose, onAgree }: VerificationTermsProps) {
  // Prevent background scrolling when modal is open
  usePreventScroll(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-white/40 backdrop-blur pointer-events-auto" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 flex flex-col items-center border-4 border-[#ECB3A8] pointer-events-auto max-h-[80vh] overflow-hidden">
        {/* Fixed header with X button */}
        <div className="sticky top-0 w-full bg-white z-10 pt-4 px-4 flex justify-end">
          <button
            className="focus:outline-none"
            onClick={onClose}
            aria-label="Close"
          >
            <img src={xButton} alt="Close" className="w-8 h-8" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="w-full p-8 pt-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <img src={logo} alt="USTP Things Logo" className="w-24 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-[#F88379] mb-6 mt-2 text-center">Terms and Conditions</h2>
          <div className="w-full text-left text-gray-600 space-y-6">
            <p className="text-sm font-medium">
              By registering as a seller on USTP Things, you acknowledge and agree to the following terms:
            </p>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Eligibility and Verification</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li className="text-sm">Only verified USTP students and approved businesses may sell on the platform.</li>
                <li className="text-sm">Students must register using valid USTP credentials.</li>
                <li className="text-sm">Businesses must submit the required documents and agree to the platform's revenue-sharing policy.</li>
                <li className="text-sm">USTP Things reserves the right to approve, reject, or revoke seller accounts at its discretion.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2. Listing and Selling Guidelines</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li className="text-sm">Sellers may only post learning materials, uniforms, academic supplies, and other relevant items.</li>
                <li className="text-sm">Listings must be accurate, truthful, and not misleading.</li>
                <li className="text-sm">Items that are no longer available must be removed or marked as sold.</li>
                <li className="text-sm">Duplicate, irrelevant, or inappropriate listings may be removed.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3. Transaction and Payment Policy</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li className="text-sm">Transactions must be completed face-to-face, with payments made via GCash upon meetup.</li>
                <li className="text-sm">USTP Things does not handle or mediate payments. Sellers are solely responsible for ensuring safe and fair transactions.</li>
                <li className="text-sm">Sellers must provide accurate pricing and honor all agreed-upon deals with buyers.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">4. Account Responsibility</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li className="text-sm">Sellers are responsible for managing listings, responding to inquiries, and maintaining professionalism.</li>
                <li className="text-sm">Scamming, fraudulent activity, or dishonest behavior will result in account suspension or a permanent ban.</li>
                <li className="text-sm">Items must be in proper condition before being handed over to buyers.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">5. External Seller Access</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li className="text-sm">Businesses and external sellers must apply for an account and agree to the revenue-sharing policy.</li>
                <li className="text-sm">Non-USTP sellers may be required to pay subscription fees for platform access.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">6. Disputes and Liability</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li className="text-sm">USTP Things is not responsible for disputes between buyers and sellers.</li>
                <li className="text-sm">Sellers must ensure all transactions are conducted fairly and securely.</li>
                <li className="text-sm">In case of disputes, sellers are expected to communicate professionally with buyers to reach a resolution.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">7. Compliance and Agreement</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li className="text-sm">Sellers must comply with all current and future USTP Things policies.</li>
                <li className="text-sm">Failure to comply may result in temporary suspension or permanent removal from the platform.</li>
                <li className="text-sm">By registering as a seller, you confirm that you have read, understood, and agreed to these terms and conditions.</li>
              </ul>
            </div>

            <p className="text-sm text-gray-700 mt-4 font-medium">
              Violations of these terms may result in account suspension or permanent ban from USTP Things.
            </p>
          </div>
        </div>
        
        {/* Fixed footer with agree button */}
        <div className="sticky bottom-0 w-full bg-white p-6 border-t border-gray-100">
          <button
            onClick={onAgree}
            className="w-full bg-[#F88379] hover:bg-[#F88379]/90 text-white font-bold text-lg py-3 rounded-2xl shadow transition"
          >
            I Agree to the Terms
          </button>
        </div>
      </div>
    </div>
  );
} 