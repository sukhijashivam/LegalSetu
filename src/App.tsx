import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features.tsx';
import ChatInterface from './components/ChatInterface';
import DocumentUpload from './components/DocumentUpload';
import FormFilling from './components/FormFilling/FormFilling';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/Signup';
import AboutUs from './components/AboutUs.tsx';
import Advocate from './components/Advocate.tsx';
import AdvocateRegistration from './components/AdvocateRegistration';
import AdvocateChat from './components/AdvocateChat';
import AdvocatePortal from './components/AdvocatePortal';
import { TranslationProvider } from './contexts/TranslationContext';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import CaseLaws from './components/CaseLaws';
import EasterEgg from './components/EasterEgg.tsx';
import { TTSProvider } from './contexts/ttsContext';

const App: React.FC = () => {
  // Firebase authentication state
  const [user, setUser] = useState<{
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    uid: string;
  } | null>(null);

  // UI state for navigation and modals
  const [activeSection, setActiveSection] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL, 
          uid: firebaseUser.uid,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);
  

  // Centralized auth check
  const requireAuth = (callback: () => void) => {
    if (!user) {
      setShowLogin(true);
    } else {
      callback();
    }
  };

  // Section change handler
  const handleSectionChange = (section: string) => {
    if (section === 'home') {
      setActiveSection('home');
    } else if (section === 'advocate-registration') {
      setActiveSection('advocate-registration');
    } else if (section === 'advocate-portal') {
      setActiveSection('advocate-portal');
    } else if (section === 'advocate-chat') {
      requireAuth(() => setActiveSection('advocate-chat'));
    } else {
      requireAuth(() => setActiveSection(section));
    }
  };

  // Modal handlers
  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  const handleCloseAuth = () => {
    setShowLogin(false);
    setShowSignup(false);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setActiveSection('home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <TTSProvider>
      <TranslationProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
          <Header
            activeSection={activeSection}
            setActiveSection={handleSectionChange}
            onGetStarted={() => requireAuth(() => setActiveSection('chat'))}
            user={user} 
            onLogout={handleLogout}
          />

          {/* Main Content */}
          <main className="flex-1 mt-16">
            {activeSection === 'home' && (
              <>
                <Hero setActiveSection={handleSectionChange} onGetStarted={() => requireAuth(() => setActiveSection('chat'))} />
                <Features onGetStarted={()=> setActiveSection('documents')} />
              </>
            )}
            {activeSection === 'chat' && <ChatInterface />}
            {activeSection === 'documents' && <DocumentUpload />}
            {activeSection === 'forms' && <FormFilling />}
            {activeSection === 'about_us' && <AboutUs />}
            {activeSection === 'cases' && <CaseLaws />}
            {activeSection === 'advocate' && <Advocate/>}
            {activeSection === 'advocate-registration' && <AdvocateRegistration />}
            {activeSection === 'advocate-chat' && <AdvocateChat />}
            {activeSection === 'advocate-portal' && <AdvocatePortal />}
            {activeSection === 'easter' && <EasterEgg />}
          </main>

          <Footer setActiveSection={setActiveSection} />

          {/* Auth Modals */}
          {showLogin && (
            <Login
              onSwitchToSignup={handleSwitchToSignup}
              onClose={handleCloseAuth}
              onLogin={() => setActiveSection('home')}
            />
          )}
          {showSignup && (
            <Signup
              onSwitchToLogin={handleSwitchToLogin}
              onClose={handleCloseAuth}
              onSignup={() => setActiveSection('home')}
            />
          )}
        </div>
      </TranslationProvider>
    </TTSProvider>
  );
};

export default App;