import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Lock, Upload, MapPin, 
  GraduationCap, Scale, IndianRupee, FileText,
  Eye, EyeOff, Check, AlertCircle
} from 'lucide-react';
import LocalizedText from './LocalizedText';

const AdvocateRegistration: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    barCouncilNumber: '',
    experience: '',
    specializations: '',
    languages: '',
    education: '',
    courtsPracticing: '',
    consultationFee: '',
    bio: '',
    city: '',
    state: '',
    profilePhoto: null as File | null,
    documents: [] as File[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const specializations = [
    'Criminal Law', 'Civil Law', 'Corporate Law', 'Family Law',
    'Property Law', 'Labor Law', 'Tax Law', 'Constitutional Law',
    'Environmental Law', 'Intellectual Property', 'Immigration Law',
    'Banking Law', 'Insurance Law', 'Consumer Protection'
  ];

  const languages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Tamil', 'Marathi',
    'Gujarati', 'Kannada', 'Malayalam', 'Oriya', 'Punjabi', 'Urdu'
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (name === 'profilePhoto' && files?.[0]) {
      setFormData(prev => ({ ...prev, profilePhoto: files[0] }));
    } else if (name === 'documents' && files) {
      setFormData(prev => ({ ...prev, documents: Array.from(files) }));
    }
  };

  const handleMultiSelect = (name: string, value: string) => {
    const currentValues = formData[name as keyof typeof formData] as string;
    const valuesArray = currentValues ? currentValues.split(',') : [];
    
    if (valuesArray.includes(value)) {
      const newValues = valuesArray.filter(v => v !== value);
      setFormData(prev => ({ ...prev, [name]: newValues.join(',') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: [...valuesArray, value].join(',') }));
    }
  };

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    }

    if (stepNumber === 2) {
      if (!formData.barCouncilNumber.trim()) newErrors.barCouncilNumber = 'Enrollment Number is required';
      if (!formData.experience) newErrors.experience = 'Experience is required';
      if (!formData.specializations) newErrors.specializations = 'At least one specialization is required';
      if (!formData.languages) newErrors.languages = 'At least one language is required';
      if (!formData.education.trim()) newErrors.education = 'Education details are required';
    }

    if (stepNumber === 3) {
      if (!formData.consultationFee) newErrors.consultationFee = 'Consultation fee is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.bio.trim()) newErrors.bio = 'Bio is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const submitData = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'profilePhoto' && value) {
          submitData.append('profilePhoto', value);
        } else if (key === 'documents' && Array.isArray(value)) {
          value.forEach(file => submitData.append('documents', file));
        } else if (typeof value === 'string') {
          submitData.append(key, value);
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-auth/register`, {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        setStep(4); // Success step
        // Store token if provided
        if (data.token) {
          localStorage.setItem('advocateToken', data.token);
        }
      } else {
        setErrors({ submit: data.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        <LocalizedText text="Personal Information" />
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

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
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Phone Number" />
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter your phone number"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

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
              className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Confirm Password" />
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Confirm your password"
            />
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        <LocalizedText text="Professional Information" />
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Enrollment Number" />
          </label>
          <div className="relative">
            <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="barCouncilNumber"
              value={formData.barCouncilNumber}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                errors.barCouncilNumber ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter your Enrollment Number"
            />
          </div>
          {errors.barCouncilNumber && <p className="text-red-500 text-sm mt-1">{errors.barCouncilNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Years of Experience" />
          </label>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            min="0"
            max="50"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
              errors.experience ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="Years of experience"
          />
          {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Specializations" />
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-xl p-3">
            {specializations.map(spec => (
              <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.specializations.split(',').includes(spec)}
                  onChange={() => handleMultiSelect('specializations', spec)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">{spec}</span>
              </label>
            ))}
          </div>
          {errors.specializations && <p className="text-red-500 text-sm mt-1">{errors.specializations}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Languages" />
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border rounded-xl p-3">
            {languages.map(lang => (
              <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.languages.split(',').includes(lang)}
                  onChange={() => handleMultiSelect('languages', lang)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">{lang}</span>
              </label>
            ))}
          </div>
          {errors.languages && <p className="text-red-500 text-sm mt-1">{errors.languages}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Education" />
          </label>
          <textarea
            name="education"
            value={formData.education}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
              errors.education ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="Enter your educational qualifications"
          />
          {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Courts Practicing" />
          </label>
          <input
            type="text"
            name="courtsPracticing"
            value={formData.courtsPracticing}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Supreme Court, High Court, District Court (comma separated)"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        <LocalizedText text="Additional Details" />
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Consultation Fee (₹)" />
          </label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              name="consultationFee"
              value={formData.consultationFee}
              onChange={handleInputChange}
              min="0"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                errors.consultationFee ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter consultation fee"
            />
          </div>
          {errors.consultationFee && <p className="text-red-500 text-sm mt-1">{errors.consultationFee}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="City" />
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter your city"
            />
          </div>
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="State" />
          </label>
          <select
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
              errors.state ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <option value="">Select State</option>
            {indianStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Profile Photo" />
          </label>
          <div className="relative">
            <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="file"
              name="profilePhoto"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Professional Bio" />
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${
              errors.bio ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="Write a brief professional bio"
          />
          {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <LocalizedText text="Supporting Documents" />
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="file"
              name="documents"
              onChange={handleFileChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Upload Bar Council Certificate, Degree Certificate, etc. (PDF, JPG, PNG, DOC, DOCX)
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800">
        <LocalizedText text="Registration Successful!" />
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        <LocalizedText text="Your application has been submitted successfully. Our team will review your profile and documents. You will receive an email notification once your account is approved." />
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-left">
            <h4 className="font-medium text-blue-800">
              <LocalizedText text="What's Next?" />
            </h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• <LocalizedText text="Document verification (1-2 business days)" /></li>
              <li>• <LocalizedText text="Profile review by our legal team" /></li>
              <li>• <LocalizedText text="Account activation email" /></li>
              <li>• <LocalizedText text="Access to advocate dashboard" /></li>
            </ul>
          </div>
        </div>
      </div>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <LocalizedText text="Return to Home" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center">
              <LocalizedText text="Advocate Registration" />
            </h1>
            <p className="text-blue-100 text-center mt-2">
              <LocalizedText text="Join our platform and connect with clients seeking legal assistance" />
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-8 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > stepNumber ? <Check className="w-4 h-4" /> : stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span><LocalizedText text="Personal" /></span>
              <span><LocalizedText text="Professional" /></span>
              <span><LocalizedText text="Details" /></span>
              <span><LocalizedText text="Complete" /></span>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="px-8 py-6 bg-gray-50 flex justify-between">
              <button
                onClick={() => setStep(prev => prev - 1)}
                disabled={step === 1}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LocalizedText text="Previous" />
              </button>
              
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <LocalizedText text="Next" />
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span><LocalizedText text="Submitting..." /></span>
                    </>
                  ) : (
                    <span><LocalizedText text="Submit Application" /></span>
                  )}
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvocateRegistration;