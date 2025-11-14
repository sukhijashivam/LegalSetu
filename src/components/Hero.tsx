import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Sparkles, Brain, Shield, Globe, Zap, 
  MessageCircle, FileText, Users, MapPin, FormInput, 
  Search, Star, Award, TrendingUp, Clock, Heart,
  Play, CheckCircle, Rocket, Eye
} from 'lucide-react';
import LocalizedText from './LocalizedText';

interface HeroProps {
  setActiveSection: (section: string) => void;
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ setActiveSection, onGetStarted }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true });

  const features = [
    {
      icon: Brain,
      title: 'AI Legal Assistant',
      description: 'Get instant legal advice powered by advanced AI',
      color: 'from-blue-500 to-cyan-500',
      stats: '50K+ queries solved'
    },
    {
      icon: FileText,
      title: 'Document Analysis',
      description: 'Analyze legal documents with AI precision',
      color: 'from-green-500 to-emerald-500',
      stats: '10K+ documents analyzed'
    },
    {
      icon: Users,
      title: 'Live Advocate Chat',
      description: 'Connect with verified lawyers instantly',
      color: 'from-purple-500 to-violet-500',
      stats: '1000+ verified advocates'
    },
    {
      icon: MapPin,
      title: 'Find Nearby Lawyers',
      description: 'Discover qualified lawyers within 5km',
      color: 'from-orange-500 to-red-500',
      stats: '2000+ lawyers listed'
    }
  ];

  const achievements = [
    { icon: TrendingUp, number: '50K+', label: 'Legal Queries Solved', color: 'from-blue-500 to-blue-600' },
    { icon: Clock, number: '<0.5s', label: 'Response Time', color: 'from-green-500 to-green-600' },
    { icon: Globe, number: '15+', label: 'Indian Languages', color: 'from-purple-500 to-purple-600' },
    { icon: Shield, number: '99.9%', label: 'AI Accuracy', color: 'from-orange-500 to-orange-600' },
    { icon: Award, number: '4.9★', label: 'User Rating', color: 'from-pink-500 to-pink-600' },
    { icon: Heart, number: '100%', label: 'Made in India', color: 'from-red-500 to-red-600' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const currentFeatureData = features[currentFeature];
  const FeatureIcon = currentFeatureData.icon;

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden">
      {/* Advanced Background */}
      <div className="absolute inset-0">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"></div>
        
        {/* Animated Mesh Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        
        {/* Animated Particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/40 rounded-full"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
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

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column - Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-xl rounded-full border border-white/50 shadow-xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-blue-600 mr-3" />
              </motion.div>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <LocalizedText text="AI-Powered Legal Revolution" />
              </span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="ml-3 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-bold"
              >
                NEW
              </motion.div>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-tight">
                <span className="block bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                  <LocalizedText text="Legal Help" />
                </span>
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <LocalizedText text="Reimagined" />
                </span>
              </h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
                className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl"
              >
                <LocalizedText text="Experience India's most advanced AI legal assistant. Get instant advice, analyze documents, and connect with verified advocates - all in your native language." />
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 flex items-center justify-center">
                  <Rocket className="mr-3 w-6 h-6" />
                  <LocalizedText text="Try AI Assistant" />
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
                onClick={() => setActiveSection('advocate-chat')}
                className="group bg-white/80 backdrop-blur-xl text-gray-800 px-10 py-5 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-blue-300 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <span className="flex items-center justify-center">
                  <Users className="mr-3 w-6 h-6 text-blue-600" />
                  <LocalizedText text="Talk to Lawyers" />
                </span>
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1 }}
              className="flex flex-wrap items-center gap-6 text-sm text-gray-600"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-semibold"><LocalizedText text="Free to Use" /></span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-semibold"><LocalizedText text="Bank-Grade Security" /></span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold"><LocalizedText text="4.9★ Rating" /></span>
              </div>
            </motion.div> */}
          </motion.div>

          {/* Right Column - Interactive Dashboard */}
<motion.div
  animate={{ y: [0, -10, 0] }}
  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
>
  <motion.div
    initial={{ opacity: 0, x: 60 }}
    animate={isInView ? { opacity: 1, x: 0 } : {}}
    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
    className="relative"
  >
    <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200 shadow-2xl px-10 py-10 overflow-hidden min-h-[350px] transition-all duration-500 ease-in-out">

      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-gray-800 tracking-tight">
            <LocalizedText text="Live AI Dashboard" />
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
            <span className="text-sm font-semibold text-green-600">
              <LocalizedText text="Online" />
            </span>
          </div>
        </div>

        {/* Feature Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeature}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Icon + Description */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: 'easeInOut' }}
              className="flex items-start gap-5"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentFeatureData.color} flex items-center justify-center shadow-lg`}>
                <FeatureIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">
                  <LocalizedText text={currentFeatureData.title} />
                </h4>
                <p className="text-sm text-gray-600">
                  <LocalizedText text={currentFeatureData.description} />
                </p>
              </div>
            </motion.div>

            {/* Performance Bar */}
            <div className="w-full bg-gray-100 rounded-xl px-5 py-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Performance</span>
                <span className="text-sm font-bold text-green-600">{currentFeatureData.stats}</span>
              </div>
              <div className="relative w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                <motion.div
                  className={`absolute left-0 top-0 h-full bg-gradient-to-r ${currentFeatureData.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-4 gap-2">
          {features.map((_, index) => (
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                index === currentFeature
                  ? 'bg-blue-600 scale-110 shadow-sm'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating Cards */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-5 right-5 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-gray-200 z-10"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-xs font-medium text-gray-700">AI Status</div>
            <div className="text-sm font-semibold text-green-600">Active</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
        className="absolute bottom-5 left-5 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-gray-200 z-10"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <div>
            <div className="text-xs font-medium text-gray-700">Response</div>
            <div className="text-sm font-semibold text-blue-600">&lt;0.5s</div>
          </div>
        </div>
      </motion.div>
    </div>
  </motion.div>
</motion.div>




        </div>

        {/* Achievement Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              <LocalizedText text="Trusted by Thousands" />
            </h3>
            <p className="text-lg text-gray-600">
              <LocalizedText text="Join the legal revolution that's transforming India" />
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {achievements.map((achievement, index) => {
              const AchievementIcon = achievement.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1.4 + index * 0.1, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl group-hover:shadow-2xl transition-all duration-300"></div>
                    <div className="relative p-6">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${achievement.color} rounded-2xl flex items-center justify-center shadow-xl`}
                      >
                        <AchievementIcon className="w-6 h-6 text-white" />
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: 1.6 + index * 0.1, type: "spring", stiffness: 300 }}
                        className="text-2xl font-black bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-1"
                      >
                        {achievement.number}
                      </motion.div>
                      <div className="text-xs font-semibold text-gray-600">
                        <LocalizedText text={achievement.label} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-gray-400 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;