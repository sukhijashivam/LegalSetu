import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, MapPin, Clock, MessageCircle,
  Phone, Video, User, Send, ArrowLeft, MoreVertical,
  CheckCircle, Circle, Heart, Shield, RefreshCw, AlertCircle,
  Wifi, WifiOff, Trash2, Archive, Clock12
} from 'lucide-react';
import LocalizedText from './LocalizedText';
import ChatHeader from './ChatHeader';
import AdvocateProfileModal from './AdvocateProfileModal';
import { auth } from '../firebase';
import { io, Socket } from 'socket.io-client';

interface Advocate {
  id: number;
  full_name: string;
  specializations: string[];
  languages: string[];
  experience: number;
  consultation_fee: number;
  rating: number;
  total_consultations: number;
  is_online: boolean;
  profile_photo_url?: string;
  bio: string;
  city: string;
  state: string;
  last_seen?: string;
  email: string;
  phone: string;
  bar_council_number: string;
  education: string;
  courts_practicing: string[];
  document_urls: string[];
  total_reviews: number;
  created_at: string;
}

interface Message {
  id: number;
  consultation_id: number;
  sender_id: number;
  sender_type: 'user' | 'advocate';
  message: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  is_read: boolean;
}

interface Consultation {
  id: number;
  advocate_id: number;
  advocate_name: string;
  profile_photo_url?: string;
  consultation_type: string;
  fee_amount: number;
  status: string;
  started_at: string;
  chat_room_id: number;
  last_message?: string;
  last_message_time?: string;
}

interface ChatHistory {
  id: number;
  consultation_id: number;
  advocate_id: number;
  advocate_name: string;
  advocate_photo_url?: string;
  advocate_is_online: boolean;
  advocate_rating: number;
  consultation_fee: number;
  last_message?: string;
  last_message_time?: string;
  message_count: number;
  consultation_status: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const AdvocateChat: React.FC = () => {
  const [view, setView] = useState<'list' | 'chat' | 'history' | 'profile'>('list');
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [advocatesLoading, setAdvocatesLoading] = useState(true);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileAdvocate, setProfileAdvocate] = useState<Advocate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    specialization: '',
    language: '',
    minRating: '',
    maxFee: '',
    isOnline: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const specializations = [
    'Criminal Law', 'Civil Law', 'Corporate Law', 'Family Law',
    'Property Law', 'Labor Law', 'Tax Law', 'Constitutional Law'
  ];

  const languages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Tamil', 'Marathi',
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'
  ];

  // Helper function to safely format rating
  const formatRating = (rating: any): string => {
    if (rating === null || rating === undefined || isNaN(Number(rating))) {
      return '0.0';
    }
    return Number(rating).toFixed(1);
  };

  // Helper function to safely get number value
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return defaultValue;
    }
    return Number(value);
  };

  // Safe image component with error handling
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
          {fallbackIcon || <User className="w-8 h-8 text-white" />}
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
            console.warn('❌ Image failed to load:', src);
            setImageError(true);
            setImageLoading(false);
          }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (authReady && currentUser) {
      console.log('🔌 Initializing Socket.IO connection...');
      
      const socket = io(import.meta.env.VITE_API_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        setIsConnected(true);
        
        // Join user room for real-time notifications
        socket.emit('join-room', {
          userId: currentUser.uid,
          userType: 'user'
        });
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
        setIsConnected(false);
      });

      // Listen for real-time advocate status updates
      socket.on('advocate-status-update', (data) => {
        console.log('📡 Advocate status update:', data);
        setAdvocates(prev => prev.map(advocate => 
          advocate.id === data.advocateId 
            ? { ...advocate, is_online: data.isOnline }
            : advocate
        ));
      });

      // Listen for advocate deletion
      socket.on('advocate-deleted', (data) => {
        console.log('🗑️ Advocate deleted:', data);
        setAdvocates(prev => prev.filter(advocate => advocate.id !== data.advocateId));
      });

      // ✅ FIXED: Listen for new messages from advocates
      socket.on('new-message', (data) => {
        console.log('📨 New message received:', data);
        if (activeConsultation && data.consultationId === activeConsultation.id) {
          // Only add message if it's from the advocate (not our own message)
          if (data.senderType === 'advocate') {
            const newMessage: Message = {
              id: data.id,
              consultation_id: data.consultationId,
              sender_id: data.senderId,
              sender_type: data.senderType,
              message: data.message,
              message_type: data.messageType,
              created_at: data.timestamp,
              is_read: false
            };
            
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (!exists) {
                return [...prev, newMessage];
              }
              return prev;
            });
          }
        }
      });

      // Listen for typing indicators
      socket.on('user-typing', (data) => {
        if (data.userType === 'advocate') {
          setTypingUsers(prev => new Set([...prev, `${data.userType}-${data.userId}`]));
        }
      });

      socket.on('user-stopped-typing', (data) => {
        if (data.userType === 'advocate') {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(`${data.userType}-${data.userId}`);
            return newSet;
          });
        }
      });

      // Listen for consultation ended
      socket.on('consultation-ended', (data) => {
        console.log('🔚 Consultation ended:', data);
        if (activeConsultation && data.consultationId === activeConsultation.id) {
          setActiveConsultation(prev => prev ? { ...prev, status: 'completed' } : null);
        }
      });

      return () => {
        console.log('🔌 Cleaning up Socket.IO connection');
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [authReady, currentUser, activeConsultation]);

  // Join consultation room when active consultation changes
  useEffect(() => {
    if (socketRef.current && activeConsultation) {
      console.log('🏠 Joining consultation room:', activeConsultation.id);
      socketRef.current.emit('join-consultation', activeConsultation.id);
    }
  }, [activeConsultation]);

  // Get Firebase token for authentication
  const getAuthToken = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        console.log('🔑 Firebase token obtained for:', auth.currentUser.email);
        return token;
      } else {
        console.log('❌ No Firebase user found');
        setAuthError('Please login to access this feature');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting Firebase token:', error);
      setAuthError('Authentication failed. Please login again.');
      return null;
    }
  };

  // Wait for auth state and then fetch data
  useEffect(() => {
    console.log('🔍 Setting up auth state listener...');
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('🔍 Auth state changed:', user ? user.email : 'No user');
      
      if (user) {
        console.log('✅ User is authenticated:', user.email);
        setCurrentUser(user);
        setAuthError('');
        setAuthReady(true);
        
        // Wait for token to be ready and fetch data
        setTimeout(async () => {
          await fetchAdvocates();
          await fetchConsultations();
          await fetchChatHistory();
        }, 1000);
      } else {
        console.log('❌ User is not authenticated');
        setAuthError('Please login to access advocate chat');
        setAdvocatesLoading(false);
        setAuthReady(false);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Refetch when filters change (only if auth is ready)
  useEffect(() => {
    if (authReady && currentUser) {
      fetchAdvocates();
    }
  }, [filters, authReady, currentUser]);


  const fetchAdvocates = async () => {
    if (!authReady || !currentUser) {
      console.log('⏳ Auth not ready, skipping advocate fetch');
      return;
    }

    try {
      setAdvocatesLoading(true);
      setError('');
      
      console.log('🔄 Getting auth token...');
      const token = await getAuthToken();
      if (!token) {
        console.log('❌ No token available');
        setAuthError('Failed to get authentication token');
        return;
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const url = `${import.meta.env.VITE_API_URL}/api/advocate-chat/advocates?${params}`;
      console.log('🔍 Fetching advocates from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        
        if (response.status === 401) {
          setAuthError('Authentication failed. Please refresh and login again.');
          await auth.signOut();
          return;
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📡 Response data:', data);

      if (data.success) {
        const processedAdvocates = data.advocates.map((advocate: any) => ({
          ...advocate,
          rating: safeNumber(advocate.rating, 0),
          consultation_fee: safeNumber(advocate.consultation_fee, 0),
          total_consultations: safeNumber(advocate.total_consultations, 0),
          experience: safeNumber(advocate.experience, 0),
          specializations: Array.isArray(advocate.specializations) ? advocate.specializations : [],
          languages: Array.isArray(advocate.languages) ? advocate.languages : []
        }));
        
        setAdvocates(processedAdvocates);
        console.log(`✅ Successfully loaded ${processedAdvocates.length} advocates`);
      } else {
        setError(data.error || 'Failed to load advocates');
        console.error('❌ API error:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching advocates:', error);
      setError(`Network error: ${error.message}`);
    } finally {
      setAdvocatesLoading(false);
    }
  };

  const fetchConsultations = async () => {
    if (!authReady || !currentUser) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/consultations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setConsultations(data.consultations);
        console.log('✅ Consultations loaded:', data.consultations.length);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  const fetchChatHistory = async () => {
    if (!authReady || !currentUser) return;

    try {
      setChatHistoryLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/user-chat-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setChatHistory(data.chatHistory);
        console.log('✅ Chat history loaded:', data.chatHistory.length);
      }
    } catch (error) {
      console.error('❌ Error fetching user chat history:', error);
    } finally {
      setChatHistoryLoading(false);
    }
  };

  const fetchMessages = async (consultationId: number) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/consultations/${consultationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        console.log('📨 Messages loaded:', data.messages.length);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  };

  const startConsultation = async (advocateId: number) => {
    console.log('🚀 Starting consultation with advocate:', advocateId);
    setLoading(true);
    setError('');
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      console.log('📡 Sending consultation request...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/consultations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ advocateId, consultationType: 'chat' })
      });

      console.log('📡 Consultation response status:', response.status);
      const data = await response.json();
      console.log('📡 Consultation response data:', data);

      if (data.success && data.consultation) {
        console.log('✅ Consultation created successfully:', data.consultation);
        
        await fetchConsultations();
        
        const newConsultation: Consultation = {
          id: data.consultation.id,
          advocate_id: data.consultation.advocateId,
          advocate_name: data.consultation.advocateName,
          consultation_type: data.consultation.consultationType,
          fee_amount: data.consultation.feeAmount,
          status: data.consultation.status,
          started_at: new Date().toISOString(),
          chat_room_id: data.consultation.id,
          profile_photo_url: advocates.find(a => a.id === advocateId)?.profile_photo_url
        };
        
        console.log('🔄 Setting active consultation and switching to chat view...');
        setActiveConsultation(newConsultation);
        setView('chat');
        setMessages([]);
        
        // Fetch existing messages for this consultation
        await fetchMessages(newConsultation.id);
        
        console.log('✅ Successfully transitioned to chat view');
      } else {
        console.error('❌ Consultation creation failed:', data.error);
        setError(data.error || 'Failed to start consultation');
      }
    } catch (error) {
      console.error('❌ Error starting consultation:', error);
      setError('Failed to start consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation || sendingMessage) {
      console.log('❌ Cannot send message:', { 
        hasMessage: !!newMessage.trim(), 
        hasConsultation: !!activeConsultation, 
        isSending: sendingMessage 
      });
      return;
    }

    console.log('📤 Sending message:', newMessage);
    setSendingMessage(true);
    
    // Stop typing indicator
    if (socketRef.current && activeConsultation) {
      socketRef.current.emit('typing-stop', {
        consultationId: activeConsultation.id,
        userId: currentUser?.uid,
        userType: 'user'
      });
    }
    
    // Optimistically add the message to the UI
    const tempMessage: Message = {
      id: Date.now(),
      consultation_id: activeConsultation.id,
      sender_id: currentUser?.uid || 0,
      sender_type: 'user',
      message: newMessage,
      message_type: 'text',
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    const messageToSend = newMessage;
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('❌ No auth token available');
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setNewMessage(messageToSend);
        setSendingMessage(false);
        return;
      }

      console.log('📡 Sending message to API...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          consultationId: activeConsultation.id,
          message: messageToSend,
          messageType: 'text'
        })
      });

      console.log('📡 Message response status:', response.status);
      const data = await response.json();
      console.log('📡 Message response data:', data);

      if (data.success) {
        console.log('✅ Message sent successfully');
        // Remove the temporary message and let the real one come through Socket.IO
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        
        // Fetch messages to ensure we have the latest
        setTimeout(() => {
          fetchMessages(activeConsultation.id);
        }, 100);
      } else {
        console.error('❌ Failed to send message:', data.error);
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setNewMessage(messageToSend);
        setError('Failed to send message: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageToSend);
      setError('Network error while sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (socketRef.current && activeConsultation && e.target.value.trim()) {
      socketRef.current.emit('typing-start', {
        consultationId: activeConsultation.id,
        userId: currentUser?.uid,
        userType: 'user'
      });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing-stop', {
            consultationId: activeConsultation.id,
            userId: currentUser?.uid,
            userType: 'user'
          });
        }
      }, 1000);
    }
  };

  const handleViewProfile = async (advocate: Advocate) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/advocates/${advocate.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setProfileAdvocate(data.advocate);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching advocate details:', error);
      setProfileAdvocate(advocate);
      setShowProfileModal(true);
    }
  };

  const handleDeleteChatHistory = async (consultationId: number) => {
    if (!confirm('Are you sure you want to delete this chat history?')) return;
    
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/user-chat-history/${consultationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setChatHistory(prev => prev.filter(ch => ch.consultation_id !== consultationId));
        alert('Chat history deleted successfully');
      } else {
        alert('Failed to delete chat history: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error deleting chat history:', error);
      alert('Error deleting chat history');
    }
  };

  const loadChatFromHistory = async (history: ChatHistory) => {
    setActiveConsultation({
      id: history.consultation_id,
      advocate_id: history.advocate_id,
      advocate_name: history.advocate_name,
      profile_photo_url: history.advocate_photo_url,
      consultation_type: 'chat',
      fee_amount: history.consultation_fee,
      status: history.consultation_status,
      started_at: history.created_at,
      chat_room_id: history.consultation_id
    });
    
    setMessages(history.messages);
    setView('chat');
  };

  // ✅ FIXED: Load messages when switching to chat view
  useEffect(() => {
    if (view === 'chat' && activeConsultation) {
       fetchMessages(activeConsultation.id);
      const interval = setInterval(() => {
        fetchMessages(activeConsultation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [view, activeConsultation]);

  const filteredAdvocates = advocates.filter(advocate =>
    advocate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advocate.specializations.some(spec => 
      spec.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderAdvocateCard = (advocate: Advocate) => (
    <motion.div
      key={advocate.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <SafeImage
            src={advocate.profile_photo_url}
            alt={advocate.full_name}
            className="w-16 h-16 rounded-2xl"
            fallbackIcon={<User className="w-8 h-8 text-white" />}
          />
          {advocate.is_online && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{advocate.full_name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">{formatRating(advocate.rating)}</span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-600">{safeNumber(advocate.total_consultations)} consultations</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">₹{safeNumber(advocate.consultation_fee)}</div>
              <div className="text-xs text-gray-500">per consultation</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {advocate.city}, {advocate.state}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {advocate.specializations.slice(0, 3).map((spec, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {spec}
                </span>
              ))}
              {advocate.specializations.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{advocate.specializations.length - 3} more
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{advocate.bio}</p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              {advocate.languages.slice(0, 3).map((lang, index) => (
                <span key={index} className="text-xs text-gray-500">{lang}</span>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewProfile(advocate)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <LocalizedText text="View Profile" />
              </button>
              <button
                onClick={() => startConsultation(advocate.id)}
                disabled={!advocate.is_online || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span><LocalizedText text="Chat Now" /></span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderChatHistoryCard = (history: ChatHistory) => (
    <motion.div
      key={history.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <SafeImage
            src={history.advocate_photo_url}
            alt={history.advocate_name}
            className="w-16 h-16 rounded-2xl"
            fallbackIcon={<User className="w-8 h-8 text-white" />}
          />
          {history.advocate_is_online && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{history.advocate_name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">{formatRating(history.advocate_rating)}</span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-600">{history.message_count} messages</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                history.consultation_status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {history.consultation_status}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(history.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="mt-3">
            {history.last_message && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {history.last_message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end mt-4 space-x-2">
            <button
              onClick={() => handleDeleteChatHistory(history.consultation_id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => loadChatFromHistory(history)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span><LocalizedText text="View Chat" /></span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAdvocateList = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                <LocalizedText text="Connected - Real-time updates active" />
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                <LocalizedText text="Disconnected - Reconnecting..." />
              </span>
            </>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {advocates.filter(a => a.is_online).length} advocates online
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LocalizedText text="Find Advocates" />
          </button>
          <button
            onClick={() => {
              setView('history');
              fetchChatHistory();
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'history' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LocalizedText text="Chat History" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search advocates by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.specialization}
              onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <select
              value={filters.language}
              onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <label className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl">
              <input
                type="checkbox"
                checked={filters.isOnline}
                onChange={(e) => setFilters(prev => ({ ...prev, isOnline: e.target.checked }))}
                className="rounded text-blue-600"
              />
              <span className="text-sm">Online Only</span>
            </label>
            <button
              onClick={fetchAdvocates}
              disabled={advocatesLoading}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${advocatesLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Auth Error */}
      {authError && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            <LocalizedText text="Authentication Required" />
          </h3>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LocalizedText text="Refresh Page" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {advocatesLoading && !authError && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            <LocalizedText text="Loading advocates..." />
          </h3>
        </div>
      )}

      {/* Advocates Grid */}
      {view === 'list' && !advocatesLoading && !error && !authError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAdvocates.map(renderAdvocateCard)}
        </div>
      )}

      {/* Chat History */}
      {view === 'history' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800">
            <LocalizedText text="Your Chat History" />
          </h3>
          
          {chatHistoryLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                <LocalizedText text="Loading chat history..." />
              </h3>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                <LocalizedText text="No chat history found" />
              </h3>
              <p className="text-gray-600">
                <LocalizedText text="Start a conversation with an advocate to see your chat history here" />
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {chatHistory.map(renderChatHistoryCard)}
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {view === 'list' && !advocatesLoading && !error && !authError && filteredAdvocates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            <LocalizedText text="No advocates found" />
          </h3>
          <p className="text-gray-600">
            <LocalizedText text="Try adjusting your search criteria or filters" />
          </p>
        </div>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setView('list');
              setActiveConsultation(null);
              setMessages([]);
              setError('');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <SafeImage
            src={activeConsultation?.profile_photo_url}
            alt={activeConsultation?.advocate_name || 'Advocate'}
            className="w-10 h-10 rounded-xl"
            fallbackIcon={<User className="w-6 h-6 text-white" />}
          />
          <div>
            <h3 className="font-semibold text-gray-800">{activeConsultation?.advocate_name}</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                <p className="text-sm text-green-600">Online</p>
              </div>
              {isConnected && (
                <span className="text-xs text-gray-500">• Real-time</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              <LocalizedText text="Start your conversation with the advocate" />
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender_type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sendingMessage}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingMessage ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-white to-[#f3e8ff] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <ChatHeader
          title="Connect with Legal Experts"
          subtitle="Get instant legal advice from verified advocates"
        />

        {view === 'list' || view === 'history' ? renderAdvocateList() : null}
        {view === 'chat' && renderChat()}

        {/* Advocate Profile Modal */}
        <AdvocateProfileModal
          advocate={profileAdvocate}
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setProfileAdvocate(null);
          }}
          onStartConsultation={startConsultation}
        />
      </motion.div>
    </div>
  );
};

export default AdvocateChat;