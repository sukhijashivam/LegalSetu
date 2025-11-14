import React from 'react';
import { Scale, Mail, Phone, MapPin, Linkedin, Twitter, Instagram, ArrowRight, Heart, Globe, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import LocalizedText from './LocalizedText';

interface FooterProps {
  setActiveSection: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setActiveSection }) => {
  const quickLinks = [
    { name: 'Legal Advice', section: 'chat', icon: '🤖' },
    { name: 'Document Analysis', section: 'documents', icon: '📄' },
    { name: 'Form Filling', section: 'forms', icon: '📝' },
    { name: 'AdvoTalk', section: 'advocate-chat', icon: '💬' },
    { name: 'Find Advocate', section: 'advocate', icon: '🔍' },
    { name: 'Constitution', section: 'cases', icon: '📜' }
  ];

  const legalAreas = [
    'Property Law', 'Family Law', 'Criminal Law', 'Corporate Law',
    'Labor Law', 'Consumer Rights', 'Constitutional Law', 'Tax Law'
  ];

  const features = [
    { icon: Globe, text: '15+ Languages' },
    { icon: Shield, text: '100% Secure' },
    { icon: Zap, text: 'Instant Results' },
    { icon: Heart, text: 'Made in India' }
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12 mb-12">
          {/* Enhanced Brand Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-4 rounded-2xl shadow-xl">
                    <Scale className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    LegalSetu
                  </h1>
                  <p className="text-blue-300 text-sm font-medium">AI Legal Assistant</p>
                </div>
              </div>
              
              <p className="text-gray-300 leading-relaxed">
                <LocalizedText text="India's first AI-powered legal assistant. Fast, accurate, and multilingual legal services for everyone." />
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-2 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                  >
                    <feature.icon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-xl font-bold mb-6 text-white">
                <LocalizedText text="Quick Access" />
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      className="group flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-200 bg-transparent border-none p-0 w-full text-left"
                      onClick={() => setActiveSection(link.section)}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span className="font-medium">
                        <LocalizedText text={link.name} />
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Legal Areas */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-xl font-bold mb-6 text-white">
                <LocalizedText text="Legal Expertise" />
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {legalAreas.map((area, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                    onClick={() => setActiveSection('chat')}
                  >
                    <span className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                      <LocalizedText text={area} />
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Contact & CTA */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h4 className="text-xl font-bold text-white">
                <LocalizedText text="Get in Touch" />
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <button
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none p-0"
                      onClick={() => setActiveSection('about_us')}
                    >
                      <LocalizedText text="Contact via socials" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-blue-400">+91 7217787725</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-blue-400">Delhi, India</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSection('advocate-registration')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Scale className="w-5 h-5" />
                <span><LocalizedText text="Join as Advocate" /></span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span>&copy; 2025 LegalSetu.</span>
                <LocalizedText text="All rights reserved." />
              </div>
              <div className="flex items-center space-x-1">
                <span><LocalizedText text="Made with" /></span>
                <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                <span><LocalizedText text="in India" /></span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex space-x-4 text-sm text-gray-400">
                <button className="hover:text-white transition-colors bg-transparent border-none p-0">
                  <LocalizedText text="Privacy Policy" />
                </button>
                <button className="hover:text-white transition-colors bg-transparent border-none p-0">
                  <LocalizedText text="Terms of Use" />
                </button>
                <button 
                  className="hover:text-white transition-colors bg-transparent border-none p-0"
                  onClick={() => setActiveSection('easter')}
                >
                  <LocalizedText text="Easter Egg" />
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                <LocalizedText text="Empowering legal access across India with AI technology" />
              </p>
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                <span>🏛️ <LocalizedText text="Constitutional Law" /></span>
                <span>⚖️ <LocalizedText text="Civil & Criminal" /></span>
                <span>🏢 <LocalizedText text="Corporate Law" /></span>
                <span>👨‍👩‍👧‍👦 <LocalizedText text="Family Law" /></span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;