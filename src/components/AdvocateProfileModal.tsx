import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Star, MapPin, Clock, GraduationCap, Scale, 
  Phone, Mail, FileText, Download, Eye, Calendar,
  Award, Languages, Briefcase, User, Shield
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import LocalizedText from './LocalizedText';

interface Advocate {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  bar_council_number?: string;
  experience: number;
  specializations: string[];
  languages: string[];
  education?: string;
  courts_practicing?: string[];
  consultation_fee: number;
  bio?: string;
  city: string;
  state: string;
  profile_photo_url?: string;
  document_urls?: string[];
  rating: number;
  total_consultations: number;
  total_reviews?: number;
  is_online: boolean;
  last_seen?: string;
  created_at?: string;
}

interface AdvocateProfileModalProps {
  advocate: Advocate | null;
  isOpen: boolean;
  onClose: () => void;
  onStartConsultation: (advocateId: number) => void;
}

const AdvocateProfileModal: React.FC<AdvocateProfileModalProps> = ({
  advocate,
  isOpen,
  onClose,
  onStartConsultation
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'reviews'>('overview');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [translatedAdvocate, setTranslatedAdvocate] = useState<Advocate | null>(null);
  useEffect(() => {
    if (advocate && language) {
      const translateAdvocateContent = async () => {
        try {
          const [translatedBio, translatedName, translatedCity, translatedState] = await Promise.all([
            t(advocate.bio || '').catch(() => advocate.bio || ''),
            t(advocate.full_name).catch(() => advocate.full_name),
            t(advocate.city).catch(() => advocate.city),
            t(advocate.state).catch(() => advocate.state)
          ]);

          setTranslatedAdvocate({
            ...advocate,
            bio: translatedBio,
            full_name: translatedName,
            city: translatedCity,
            state: translatedState
          });
        } catch (error) {
          console.error('Translation error:', error);
          setTranslatedAdvocate(advocate);
        }
      };

      translateAdvocateContent();
    }
  }, [advocate, language, t]);

  // Helper functions for safe data handling
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return defaultValue;
    }
    return Number(value);
  };

  const formatRating = (rating: any): string => {
    return safeNumber(rating, 0).toFixed(1);
  };

  const safeArray = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
    }
    return [];
  };

  // ✅ NEW: Safe image component with error handling for S3 URLs
  const SafeImage: React.FC<{
    src?: string | null;
    alt: string;
    className?: string;
    fallbackIcon?: React.ReactNode;
  }> = ({ src, alt, className = "", fallbackIcon }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
      setImageError(false);
      setImageLoading(true);
    }, [src]);

    if (!src || imageError) {
      return (
        <div className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}>
          {fallbackIcon || <User className="w-12 h-12 text-white/70" />}
        </div>
      );
    }

    return (
      <div className={`${className} relative overflow-hidden`}>
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            console.warn('❌ Profile image failed to load:', src);
            setImageError(true);
            setImageLoading(false);
          }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  useEffect(() => {
    if (isOpen && advocate && activeTab === 'reviews') {
      fetchReviews();
    }
  }, [isOpen, advocate, activeTab]);

  const fetchReviews = async () => {
    if (!advocate) return;
    
    setLoadingReviews(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/advocates/${advocate.id}/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleDocumentView = (documentUrl: string) => {
    // ✅ S3 URLs are already complete pre-signed URLs, open directly
    window.open(documentUrl, '_blank');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDocumentName = (url: string) => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    
    // Try to make filename more readable
    if (filename.includes('profile')) return 'Profile Photo';
    if (filename.includes('documents')) return 'Legal Document';
    if (filename.includes('certificate')) return 'Certificate';
    if (filename.includes('degree')) return 'Degree Certificate';
    if (filename.includes('bar')) return 'Bar Council Certificate';
    
    return filename.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '');
  };

  if (!isOpen || !advocate) return null;

  const specializations = safeArray(advocate.specializations);
  const languages = safeArray(advocate.languages);
  const courtsPracticing = safeArray(advocate.courts_practicing);
  const documentUrls = safeArray(advocate.document_urls);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start space-x-6">
              {/* Profile Photo */}
              <div className="relative">
                <SafeImage
                  src={advocate.profile_photo_url}
                  alt={advocate.full_name}
                  className="w-24 h-24 rounded-2xl border-2 border-white/30"
                  fallbackIcon={<User className="w-12 h-12 text-white/70" />}
                />
                {/* {advocate.is_online && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                )} */}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{translatedAdvocate?.full_name || advocate?.full_name}</h2>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{formatRating(advocate.rating)}</span>
                    <h2 className="text-2xl font-bold mb-2">{translatedAdvocate?.full_name || advocate?.full_name}</h2>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <Briefcase className="w-4 h-4 mr-1" />
                    <span>{safeNumber(advocate.total_consultations)} <LocalizedText text="consultations" /></span>

                  </div>
                </div>
                <div className="flex items-center space-x-4 text-blue-100">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{translatedAdvocate?.city || advocate?.city}, {translatedAdvocate?.state || advocate?.state}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{safeNumber(advocate.experience)} <LocalizedText text="years experience" /></span>
                  </div>
                </div>
              </div>

              {/* Consultation Fee */}
              <div className="text-right">
                <div className="text-2xl font-bold text-white">₹{safeNumber(advocate.consultation_fee)}</div>
                <div className="text-blue-100 text-sm"><LocalizedText text='per minute'/></div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  advocate.is_online 
                    ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                    : 'bg-gray-500/20 text-gray-100 border border-gray-400/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${advocate.is_online ? 'bg-green-400' : 'bg-gray-400'}`} />
                  {advocate.is_online ? <LocalizedText text="Online" /> : <LocalizedText text="Offline" />}

                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'reviews', label: 'Reviews', icon: Star }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium"><LocalizedText text={tab.label} /></span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Bio */}
                {advocate.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      <LocalizedText text="About" />
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{translatedAdvocate?.bio || advocate?.bio}</p>

                  </div>
                )}

                {/* Professional Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Phone className="w-5 h-5 mr-2 text-blue-600" />
                      <LocalizedText text="Contact Information" />
                    </h3>
                    <div className="space-y-3">
                      {advocate.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-gray-600">{advocate.email}</span>
                        </div>
                      )}
                      {advocate.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-gray-600">{advocate.phone}</span>
                        </div>
                      )}
                      {advocate.bar_council_number && (
                        <div className="flex items-center">
                          <Scale className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-gray-600"><LocalizedText text='Bar Council:'/> {advocate.bar_council_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-blue-600" />
                      <LocalizedText text="Professional Details" />
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-600">{safeNumber(advocate.experience)} <LocalizedText text="years of experience" /></span>

                      </div>
                      {advocate.created_at && (
                        <div className="flex items-center">
                          <GraduationCap className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-gray-600"><LocalizedText text="Joined" /> {formatDate(advocate.created_at)}</span>

                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education */}
                {advocate.education && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                      <LocalizedText text="Education" />
                    </h3>
                    <p className="text-gray-600">{advocate.education}</p>
                  </div>
                )}

                {/* Specializations */}
                {specializations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                      <LocalizedText text="Specializations" />
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((spec, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          <LocalizedText text={spec} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Languages className="w-5 h-5 mr-2 text-blue-600" />
                      <LocalizedText text="Languages" />
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                        >
                         <LocalizedText text={lang} />

                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courts Practicing */}
                {courtsPracticing.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Scale className="w-5 h-5 mr-2 text-blue-600" />
                      <LocalizedText text="Courts Practicing" />
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {courtsPracticing.map((court, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          <LocalizedText text={court} />

                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  <LocalizedText text="Uploaded Documents" />
                </h3>
                
                {documentUrls.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {documentUrls.map((docUrl, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {getDocumentName(docUrl)}
                              </h4>
                              <p className="text-sm text-gray-500"><LocalizedText text="Document" /> {index + 1}</p>

                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDocumentView(docUrl)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDocumentView(docUrl)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download Document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      <LocalizedText text="No documents uploaded yet" />
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-blue-600" />
                  <LocalizedText text="Client Reviews" />
                </h3>
                
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500">
                      <LocalizedText text="Loading reviews..." />
                    </p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-800">{review.user_name}</span>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < safeNumber(review.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                                  }`}

                              />
                            ))}
                          </div>
                        </div>
                        {review.review_text && (
                          <p className="text-gray-600 text-sm">{review.review_text}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(review.created_at || review.review_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      <LocalizedText text="No reviews yet" />
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Shield className="w-4 h-4 mr-1" />
                  <LocalizedText text="Verified Advocate" />
                </div>
                {advocate.last_seen && (
                  <div className="text-sm text-gray-500">
                    <LocalizedText text="Last seen" />: {formatDate(advocate.last_seen)}
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LocalizedText text="Close" />
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onStartConsultation(advocate.id);
                    onClose();
                  }}
                  disabled={!advocate.is_online}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span><LocalizedText text="Start Consultation" /></span>
                  <span className="text-lg">₹{safeNumber(advocate.consultation_fee)}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdvocateProfileModal;