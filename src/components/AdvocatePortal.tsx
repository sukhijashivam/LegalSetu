import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, User, MessageCircle, Star } from 'lucide-react';
import AdvocateLogin from './AdvocateLogin';
import AdvocateDashboard from './AdvocateDashboard';
import LocalizedText from './LocalizedText';

interface AdvocateData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  specializations: string[];
  languages: string[];
  consultationFee: number;
  rating: number;
  totalConsultations: number;
  isOnline: boolean;
  profilePhotoUrl?: string;
}

const AdvocatePortal: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [advocateData, setAdvocateData] = useState<AdvocateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if advocate is already logged in
    const token = localStorage.getItem('advocateToken');
    const savedData = localStorage.getItem('advocateData');
    
    if (token && savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setAdvocateData(parsed);
        console.log('✅ Advocate auto-login successful:', parsed);
      } catch (error) {
        console.error('❌ Failed to parse saved advocate data:', error);
        localStorage.removeItem('advocateToken');
        localStorage.removeItem('advocateData');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (data: AdvocateData) => {
    setAdvocateData(data);
    console.log('✅ Advocate logged in:', data);
  };

  const handleLogout = () => {
    localStorage.removeItem('advocateToken');
    localStorage.removeItem('advocateData');
    setAdvocateData(null);
    console.log('✅ Advocate logged out');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If advocate is logged in, show dashboard
  if (advocateData) {
    return (
      <AdvocateDashboard 
        advocateData={advocateData} 
        onLogout={handleLogout}
      />
    );
  }

  // Show advocate portal landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <Scale className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <LocalizedText text="Advocate Portal" />
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            <LocalizedText text="Connect with clients, manage consultations, and provide legal assistance through our advanced platform." />
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            {
              icon: MessageCircle,
              title: 'Client Chat',
              description: 'Real-time messaging with clients seeking legal advice',
              color: 'from-blue-500 to-blue-600'
            },
            {
              icon: User,
              title: 'Profile Management',
              description: 'Manage your professional profile and credentials',
              color: 'from-purple-500 to-purple-600'
            },
            {
              icon: Star,
              title: 'Reviews & Ratings',
              description: 'Build your reputation with client feedback',
              color: 'from-green-500 to-green-600'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                <LocalizedText text={feature.title} />
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                <LocalizedText text={feature.description} />
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            <LocalizedText text="Ready to start helping clients?" />
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            <LocalizedText text="Join our platform and connect with clients who need your legal expertise. Sign in to access your advocate dashboard." />
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogin(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <LocalizedText text="Sign In as Advocate" />
            </motion.button>
            
            {/* <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '#advocate-registration'}
              className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-semibold border-2 border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <LocalizedText text="Register as Advocate" />
            </motion.button> */}
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-2">
              <LocalizedText text="Demo Access" />
            </h4>
            <p className="text-sm text-purple-700">
              <LocalizedText text="Use any registered advocate email and password to access the dashboard" />
            </p>
          </div>
        </motion.div>

        {/* Login Modal */}
        {showLogin && (
          <AdvocateLogin
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </motion.div>
    </div>
  );
};

export default AdvocatePortal;