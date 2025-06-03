import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import ustpLogo from '../../assets/ustp-things-logo.png';
import xIcon from '../../assets/ustp thingS/X button.png';
import VerificationTerms from './VerificationTerms';
import { usePreventScroll } from '../../hooks/usePreventScroll';
import { uploadToCloudinary } from '../../lib/cloudinaryUpload';
import { sendEmailVerification } from "firebase/auth";

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  setVerificationRequested: (val: boolean) => void;
  verificationRequested?: boolean;
}

export default function VerificationModal({ open, onClose, setVerificationRequested, verificationRequested }: VerificationModalProps) {
  const [step, setStep] = useState<'select' | 'student' | 'company'>('select');
  const [form, setForm] = useState({ 
    name: '', 
    id: '', 
    email: '',
    agree: false 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmailVerificationOverlay, setShowEmailVerificationOverlay] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [canSubmitVerification, setCanSubmitVerification] = useState(false);

  // Prevent background scrolling when modal is open
  usePreventScroll(open || termsOpen);

  useEffect(() => {
    if (!open) {
      setStep('select'); // Reset step when modal closes
      setForm({ name: '', id: '', email: '', agree: false }); // Reset form
      setSelectedFile(null); // Reset file
    }
    setSuccess(false);
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (step === 'student') {
        // For students: allow image or PDF
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        if ((isImage || isPDF) && file.size <= 5 * 1024 * 1024) {
          setSelectedFile(file);
        } else {
          alert('Please select an image or PDF file less than 5MB');
          e.target.value = '';
        }
      } else {
        // For companies: PDF only
        if (file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
          setSelectedFile(file);
        } else {
          alert('Please select a PDF file less than 5MB');
          e.target.value = '';
        }
      }
    }
  };

  // New: Check if user's email is verified
  const checkEmailVerified = async () => {
    setCheckingVerification(true);
    await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) {
      setEmailVerified(true);
      setShowEmailVerificationOverlay(false);
      setCanSubmitVerification(true);
      // Automatically submit the form after email is verified
      setTimeout(() => {
        document.getElementById('verification-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }, 0);
    } else {
      setEmailVerified(false);
      alert("Your email is not verified yet. Please check your inbox and click the verification link.");
    }
    setCheckingVerification(false);
  };

  // New: Handle confirm verification button
  const handleConfirmVerificationClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("No user logged in");
      return;
    }
    if (!auth.currentUser.emailVerified) {
      setShowEmailVerificationOverlay(true);
      if (!emailSent) {
        await sendEmailVerification(auth.currentUser);
        setEmailSent(true);
      }
      return;
    }
    // If email is verified, proceed to handleSubmit
    handleSubmit(e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please upload your document');
      return;
    }
    setLoading(true);
    try {
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }

      // Upload document to Cloudinary and get URL
      const documentUrl = await uploadToCloudinary(selectedFile, step === 'student' ? 'cor_and_studentid' : 'company_documents');

      await addDoc(collection(db, 'verifications'), {
        userId: auth.currentUser.uid,
        name: form.name,
        studentId: form.id,
        email: form.email,
        documentUrl,
        agreed: form.agree,
        type: step,
        status: 'pending',
        createdAt: new Date(),
      });

      // Update user document with verification request
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        verificationRequested: true,
        verificationRequestedAt: new Date()
      }, { merge: true });
      setSuccess(true);
      setForm({ name: '', id: '', email: '', agree: false });
      setSelectedFile(null);
      setVerificationRequested(true);
    } catch (err) {
      console.error('Failed to submit verification:', err);
      alert('Failed to submit verification.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Show pending verification modal if verification is requested
  if (verificationRequested) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-white/40 backdrop-blur transition-all duration-300" />
        <div className="relative bg-white rounded-3xl shadow-2xl px-8 py-8 flex flex-col items-center w-[400px] h-[350px] border-4 border-[#ECB3A8] animate-fade-in-scale">
          <button onClick={onClose} className="absolute top-4 right-4 focus:outline-none">
            <img src={xIcon} alt="Close" className="w-8 h-8" />
          </button>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <img src={ustpLogo} alt="USTP Things Logo" className="h-20" />
            <h2 className="text-3xl font-bold text-[#F88379] text-center">Verification Pending</h2>
            <p className="text-center text-gray-600 text-lg">
              Your verification request is being processed. Please wait for admin approval.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Blurred background overlay */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur transition-all duration-300" />
        {/* Modal with animation */}
        <div className="relative bg-white rounded-3xl shadow-2xl px-12 py-10 flex flex-col items-center min-w-[400px] min-h-[400px] border-4 border-[#ECB3A8] animate-fade-in-scale">
          <button onClick={onClose} className="absolute top-4 right-4 focus:outline-none">
            <img src={xIcon} alt="Close" className="w-8 h-8" />
          </button>
          <img src={ustpLogo} alt="USTP Things Logo" className="h-20 mb-2" />
          <h2 className="text-3xl font-bold text-[#F88379] mb-8 mt-2 text-center">Account Verification</h2>
          {step === 'select' && (
            <>
              <button className="w-64 bg-[#F88379] hover:bg-[#F88379]/90 text-white font-bold text-xl py-3 rounded-[23.08px] shadow mb-8 transition mt-8" onClick={() => setStep('student')}>I am a student.</button>
              <button className="w-64 bg-[#F88379] hover:bg-[#F88379]/90 text-white font-bold text-xl py-3 rounded-[23.08px] shadow transition" onClick={() => setStep('company')}>I am a company.</button>
            </>
          )}
          {(step === 'student' || step === 'company') && !success && (
            <form
              id="verification-form"
              className="w-full flex flex-col items-center"
              onSubmit={canSubmitVerification ? handleSubmit : handleConfirmVerificationClick}
            >
              <div className="w-full rounded-md mb-6 border border-gray-300">
                <div className="flex flex-col divide-y divide-gray-300">
                  <input
                    type="text"
                    placeholder={step === 'student' ? "Name" : "Name of Authorized Representative"}
                    className="px-4 py-4 outline-none border-0 bg-transparent text-lg"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                  {step === 'student' ? (
                    <input
                      type="text"
                      placeholder="Student ID Number"
                      className="px-4 py-4 outline-none border-0 bg-transparent text-lg"
                      value={form.id}
                      onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                      required
                    />
                  ) : (
                    <input
                      type="email"
                      placeholder="Official Business Email"
                      className="px-4 py-4 outline-none border-0 bg-transparent text-lg"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  )}
                </div>
              </div>

              {/* File Upload Section */}
              <div className="w-full mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={step === 'student' ? "image/*,application/pdf" : "application/pdf"}
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#F88379] transition-colors text-gray-500 hover:text-[#F88379]"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">✓ {selectedFile.name}</span>
                      <span className="text-xs text-gray-400">(Click to change)</span>
                    </div>
                  ) : (
                    <div className="text-sm">
                      {step === 'student' 
                        ? "Upload COR or Student ID (Image or PDF, Max: 5MB)"
                        : "Upload Business Registration Document (PDF only, Max: 5MB)"}
                    </div>
                  )}
                </button>
              </div>

              <label className="flex items-center mb-6 w-full text-xs px-1">
                <input
                  type="checkbox"
                  className="mr-2 accent-pink-400"
                  checked={form.agree}
                  onChange={e => setForm(f => ({ ...f, agree: e.target.checked }))}
                  required
                />
                I agree to the <button type="button" onClick={() => setTermsOpen(true)} className="text-blue-500 underline ml-1">terms and conditions</button>
              </label>
              <button
                type="submit"
                className="w-full bg-[#F88379] hover:bg-[#F88379]/90 text-white font-bold text-lg py-4 rounded-2xl shadow transition disabled:opacity-50"
                disabled={!form.name || !form.agree || !selectedFile || loading || (step === 'student' ? !form.id : !form.email)}
              >
                {loading ? 'Submitting...' : 'Confirm Verification'}
              </button>
            </form>
          )}
          {(step === 'student' || step === 'company') && success && (
            <div className="text-green-600 font-bold text-lg mt-8">Verification submitted successfully!</div>
          )}
        </div>
      </div>
      
      <VerificationTerms 
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAgree={() => {
          setForm(f => ({ ...f, agree: true }));
          setTermsOpen(false);
        }}
      />

      {/* Email Verification Overlay */}
      {showEmailVerificationOverlay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur" />
          <div className="relative bg-white rounded-3xl shadow-2xl px-8 py-8 flex flex-col items-center w-[400px] border-4 border-[#ECB3A8]">
            <img src={ustpLogo} alt="USTP Things Logo" className="h-20 mb-2" />
            <h2 className="text-2xl font-bold text-[#F88379] mb-4 text-center">Verify Your Email</h2>
            <p className="text-center text-gray-600 mb-4">
              We sent a verification link to your email.<br />
              Please check your inbox and click the link to verify your email address.
            </p>
            <button
              onClick={checkEmailVerified}
              className="w-full bg-[#F88379] hover:bg-[#F88379]/90 text-white font-bold text-lg py-3 rounded-2xl shadow transition mb-2"
              disabled={checkingVerification}
            >
              {checkingVerification ? "Checking..." : "I have verified my email"}
            </button>
            <button
              onClick={() => setShowEmailVerificationOverlay(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg py-3 rounded-2xl shadow transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}