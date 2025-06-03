import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import Background from '../components/Background';
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';

export default function Landing() {
  const [activeModal, setActiveModal] = useState<'login' | 'signup' | null>(null);

  const handleLoginClick = () => {
    setActiveModal('login');
  };

  const handleSignupClick = () => {
    setActiveModal('signup');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="fixed left-0 top-0">
        <Sidebar onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
      </div>
      <div className="flex-1 flex flex-col ml-[348px]">
        <div className="fixed top-0 right-0 left-[348px] z-10">
          <Header />
        </div>
        <div className="flex-1 mt-16 overflow-y-auto">
          <div className="relative min-h-[calc(100vh-4rem)]">
            <div className="fade-in">
              <MainContent />
              <Background />
              <LoginModal isOpen={activeModal === 'login'} onClose={handleCloseModal} />
              <SignupModal isOpen={activeModal === 'signup'} onClose={handleCloseModal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
