import React, { useState, useRef } from 'react';
import {
  MessageSquare, FileText, Search, Languages, Shield, Clock, Mic, Brain,
  ArrowRight, Sparkles, Users, MapPin, FormInput, Zap, Globe, Star,
  CheckCircle, Award, TrendingUp, Rocket, Heart, Eye, Play, Pause
} from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import LocalizedText from './LocalizedText';

interface FeaturesProps {
  onGetStarted?: () => void;
}

const Features: React.FC<FeaturesProps> = ({ onGetStarted }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const mainFeatures = [
    {
      icon: MessageSquare,
      title: 'Neeti - AI Legal Assistant',
      description: 'Revolutionary AI trained on Indian law providing instant, accurate legal guidance in your native language.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      stats: '50K+ queries solved',
      demo: 'Ask: "What are my rights as a tenant?"',
      features: ['Instant responses', 'Multi-language support', '99.2% accuracy', 'Available 24/7'],
      badge: 'Most Popular'
    },
    {
      icon: FileText,
      title: 'Smart Document Analysis',
      description: 'Advanced AI-powered document analysis that breaks down complex legal documents into simple, understandable insights.',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      stats: '10K+ documents analyzed',
      demo: 'Upload contracts, agreements, or legal notices',
      features: ['Risk identification', 'Clause explanation', 'Suggestion engine', 'Multi-format support'],
      badge: 'AI-Powered'
    },
    {
      icon: Users,
      title: 'AdvoTalk - Live Consultations',
      description: 'Connect with verified advocates for real-time legal consultations. Professional advice when you need it most.',
      color: 'from-purple-500 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50',
      stats: '1000+ verified advocates',
      demo: 'Chat with lawyers in real-time',
      features: ['Verified lawyers', 'Real-time chat', 'Secure payments', 'Review system'],
      badge: 'Live'
    },
    {
      icon: MapPin,
      title: 'Find Nearby Advocates',
      description: 'Discover qualified lawyers within 5km radius with integrated maps, ratings, and instant contact options.',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      stats: '2000+ lawyers listed',
      demo: 'Find lawyers near you instantly',
      features: ['GPS integration', 'Lawyer ratings', 'Direct contact', 'Specialization filter'],
      badge: 'Location-Based'
    },
    {
      icon: FormInput,
      title: 'AI Form Assistant',
      description: 'Intelligent form filling with voice input and smart question-based data collection for complex legal forms.',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-50 to-rose-50',
      stats: '200+ form types supported',
      demo: 'Upload any form and fill it easily',
      features: ['Voice input', 'Smart detection', 'Auto-fill', 'Multi-language'],
      badge: 'Voice-Enabled'
    },
    {
      icon: Search,
      title: 'Constitution Explorer',
      description: 'Explore the Indian Constitution with AI-powered search and insights. Understand your fundamental rights.',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'from-indigo-50 to-blue-50',
      stats: '395 articles searchable',
      demo: 'Search: "Article 14" or "Right to equality"',
      features: ['Article search', 'Right explanations', 'Case references', 'Historical context'],
      badge: 'Educational'
    }
  ];

  const supportFeatures = [
    { icon: Languages, title: 'Multi-language Support', description: '15+ Indian languages', color: 'from-blue-500 to-blue-600' },
    { icon: Mic, title: 'Voice Interaction', description: 'Speak and listen in your language', color: 'from-green-500 to-green-600' },
    { icon: Shield, title: 'Bank-Grade Security', description: 'End-to-end encryption', color: 'from-purple-500 to-purple-600' },
    { icon: Clock, title: '24/7 Availability', description: 'Always here when you need us', color: 'from-orange-500 to-orange-600' },
    { icon: Brain, title: 'Advanced AI', description: 'Powered by cutting-edge ML', color: 'from-pink-500 to-pink-600' },
    { icon: Zap, title: 'Lightning Fast', description: 'Get answers in under 0.5 seconds', color: 'from-yellow-500 to-yellow-600' }
  ];

  const achievements = [
    { icon: Award, number: '50K+', label: 'Users Served', color: 'from-blue-500 to-blue-600' },
    { icon: TrendingUp, number: '99.2%', label: 'Accuracy Rate', color: 'from-green-500 to-green-600' },
    { icon: Globe, number: '15+', label: 'Languages', color: 'from-purple-500 to-purple-600' },
    { icon: Rocket, number: '<0.5s', label: 'Response Time', color: 'from-orange-500 to-orange-600' }
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Advanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[150vw] h-96 bg-gradient-to-br from-blue-100/60 via-white/40 to-purple-100/60 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-100/40 to-pink-100/40 rounded-full blur-3xl"></div>
        
        {/* Animated Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:30px_30px] opacity-30"></div>
        
        {/* Floating Orbs */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 8,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Revolutionary Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-xl rounded-full border border-white/50 mb-8 shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-blue-600 mr-3" />
            </motion.div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <LocalizedText text="Complete Legal Ecosystem" />
            </span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-3 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold"
            >
              NEW
            </motion.div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-6xl md:text-7xl font-black mb-8 leading-tight"
          >
            <span className="block bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              <LocalizedText text="Everything You Need" />
            </span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
              <LocalizedText text="For Legal Success" />
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
          >
            <LocalizedText text="From AI-powered legal advice to real advocate consultations - experience the most comprehensive legal assistance platform designed for modern India." />
          </motion.p>
        </motion.div>

        {/* Main Features Showcase */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1 + index * 0.1, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
                className="group relative overflow-hidden"
              >
                {/* Card Background */}
                <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl group-hover:shadow-2xl transition-all duration-500"></div>
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl`}
                />
                
                {/* Badge */}
                {feature.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg"
                    >
                      {feature.badge}
                    </motion.div>
                  </div>
                )}

                <div className="relative p-8">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    <LocalizedText text={feature.title} />
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6">
                    <LocalizedText text={feature.description} />
                  </p>

                  {/* Features List */}
                  <div className="space-y-2 mb-6">
                    {feature.features.map((feat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={hoveredCard === index ? { opacity: 1, x: 0 } : { opacity: 0.7, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{feat}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-semibold text-gray-700">{feature.stats}</span>
                    </div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="text-blue-600"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Demo */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Play className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600">DEMO</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">
                      <LocalizedText text={feature.demo} />
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Support Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-800 mb-4">
              <LocalizedText text="Why Choose LegalSetu?" />
            </h3>
            <p className="text-xl text-gray-600">
              <LocalizedText text="Built with cutting-edge technology for the modern legal landscape" />
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {supportFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1.7 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="group text-center p-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h4 className="font-bold text-gray-800 mb-2 text-sm group-hover:text-blue-600 transition-colors">
                  <LocalizedText text={feature.title} />
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <LocalizedText text={feature.description} />
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 2, duration: 0.8 }}
          className="mb-20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 2.2 + index * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl group-hover:shadow-2xl transition-all duration-300"></div>
                  <div className="relative p-8">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${achievement.color} rounded-2xl flex items-center justify-center shadow-xl`}
                    >
                      <achievement.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{ delay: 2.5 + index * 0.1, type: "spring", stiffness: 300 }}
                      className="text-4xl font-black bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-2"
                    >
                      {achievement.number}
                    </motion.div>
                    <div className="text-sm font-semibold text-gray-600">
                      <LocalizedText text={achievement.label} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Revolutionary CTA Section */}
        {onGetStarted && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 2.5, duration: 1 }}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl"></div>
            <motion.div
              animate={{
                background: [
                  "linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)",
                  "linear-gradient(45deg, #8b5cf6, #ec4899, #3b82f6)",
                  "linear-gradient(45deg, #ec4899, #3b82f6, #8b5cf6)",
                  "linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)"
                ]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl"
            />
            
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:30px_30px] opacity-30"></div>
            
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-8 right-8 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <Rocket className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, delay: 2 }}
              className="absolute bottom-8 left-8 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
            >
              <Heart className="w-6 h-6 text-white" />
            </motion.div>

            <div className="relative z-10 p-16 text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: 2.7, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 2.9, duration: 0.8 }}
                className="text-5xl md:text-6xl font-black mb-8 leading-tight"
              >
                <LocalizedText text="Ready to Transform Your Legal Journey?" />
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 3.1, duration: 0.8 }}
                className="text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed"
              >
                <LocalizedText text="Join thousands of users who trust LegalSetu for their legal needs. Experience the future of legal assistance today." />
              </motion.p>
              
              {/* Enhanced CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 3.3, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-6 justify-center"
              >
                <motion.button 
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onGetStarted}
                  className="group relative bg-white text-blue-600 px-12 py-6 rounded-2xl font-black text-xl shadow-2xl overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 flex items-center justify-center">
                    <Rocket className="mr-3 w-6 h-6" />
                    <LocalizedText text="Start Free Trial" />
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="ml-3 w-6 h-6" />
                    </motion.div>
                  </span>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-white/10 backdrop-blur-sm text-white px-12 py-6 rounded-2xl font-black text-xl border-2 border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <span className="flex items-center justify-center">
                    <Eye className="mr-3 w-6 h-6" />
                    <LocalizedText text="Watch Demo" />
                  </span>
                </motion.button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 3.5, duration: 0.8 }}
                className="mt-12 flex flex-wrap items-center justify-center gap-8 text-blue-100"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold"><LocalizedText text="No Credit Card Required" /></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold"><LocalizedText text="Bank-Grade Security" /></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span className="font-semibold"><LocalizedText text="4.9★ Rating" /></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold"><LocalizedText text="Award Winning" /></span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Features;