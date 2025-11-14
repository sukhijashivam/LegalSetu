import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Eye, EyeOff, Mail, Lock, User, ArrowRight, Chrome, Check } from 'lucide-react';
import LocalizedText from './LocalizedText';
import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';

// SignUp for new users
interface SignupProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
  onSignup: (userData: { email: string; fullName: string }) => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin, onClose, onSignup }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.fullName.trim()) throw new Error('Full name is required');
      if (!formData.email.includes('@')) throw new Error('Invalid email');
      if (formData.password.length < 6) throw new Error('Password must be at least 6 characters');
      if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
      if (!formData.agreeToTerms) throw new Error('You must agree to the terms');

      // Firebase signup
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Set display name and force re-authentication to update state
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: formData.fullName });
        await auth.currentUser.reload();
        await auth.signOut();
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }

      onSignup({ email: formData.email, fullName: formData.fullName });
      onClose();
    } catch (err: any) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'Email already registered'
          : err.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : err.code === 'auth/weak-password'
          ? 'Password should be at least 6 characters'
          : err.message || 'Signup failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // No manual setUser; let onAuthStateChanged handle it
      onSignup({
        email: auth.currentUser?.email || '',
        fullName: auth.currentUser?.displayName || ''
      });
      onClose();
    } catch (err) {
      setError('Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            ×
          </button>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Scale className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">
              <LocalizedText text="Create Account" />
            </h2>
            <p className="text-blue-100">
              <LocalizedText text="Start your legal journey with AI-powered assistance" />
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LocalizedText text="Full Name" />
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LocalizedText text="Email Address" />
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LocalizedText text="Password" />
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LocalizedText text="Confirm Password" />
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <div className="relative">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  required
                  disabled={loading}
                />
                {formData.agreeToTerms && (
                  <Check className="absolute top-0.5 left-0 w-5 h-5 text-blue-600 pointer-events-none" />
                )}
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">
                <LocalizedText text="I agree to the" />{' '}
                <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
                  <LocalizedText text="Terms of Service" />
                </button>{' '}
                <LocalizedText text="and" />{' '}
                <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
                  <LocalizedText text="Privacy Policy" />
                </button>
              </div>
            </div>

            {/* Sign Up Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!formData.agreeToTerms || loading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LocalizedText text="Create Account" />
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  <LocalizedText text="Or continue with" />
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Chrome className="w-5 h-5 mr-2" />
                <LocalizedText text="Google" />
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <span className="text-gray-600">
              <LocalizedText text="Already have an account?" />
            </span>
            <button
              onClick={onSwitchToLogin}
              className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              disabled={loading}
            >
              <LocalizedText text="Sign in" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
