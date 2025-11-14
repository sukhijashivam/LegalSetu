// src/components/FormFilling/FormFilling.tsx
/// <reference types="vite/client" />

import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { useTranslation } from '../../contexts/TranslationContext';
import { Upload, FileText, Mic, Volume2, Download, Check, Sparkles, Languages } from 'lucide-react';
import LocalizedText from '../LocalizedText';
import ChatHeader from '../ChatHeader.tsx';
import { formAPI } from '../../services/api';
import VoicePlayer from '../VoicePlayer.tsx';


interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  rect: number[];
  page: number;
  value: string;
  required?: boolean;

}
const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  // { code: 'bn', name: 'বাংলা' },
  // { code: 'te', name: 'తెలుగు' },
  // { code: 'ta', name: 'தமிழ்' },
  { code: 'mr', name: 'मराठी' },
  // { code: 'gu', name: 'ગુજરાતી' },
  // { code: 'kn', name: 'ಕನ್ನಡ' },
  // { code: 'ml', name: 'മലയാളം' },
  // { code: 'or', name: 'ଓଡ଼ିଆ' },
  // { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  // { code: 'as', name: 'অসমীয়া' },
  // { code: 'ur', name: 'اُردُو' }
];



const FormFilling: React.FC = () => {
  const { t } = useTranslation()
  const { language, setLanguage } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfHeight, setPdfHeight] = useState<number | null>(null);
  const [scaleFactor, setScaleFactor] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadForm = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('form', file);
      formDataToSend.append('language', language);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/upload`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setFormId(data.formId);
        setFormFields(data.formFields);
        setImageHeight(data.imageHeight);
        setPdfHeight(data.pdfHeight);
        setScaleFactor(data.scaleFactor);


        const initialData: Record<string, string> = {};
        data.formFields.forEach((field: FormField) => {
          initialData[field.id] = '';
        });
        setFormData(initialData);
      } else {
        alert('Failed to process form: ' + data.error);
      }
    } catch (error) {
      // console.error('Form upload error:', error);
      alert('Failed to upload form: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const speakFieldLabel = async (fieldName: string) => {
    try {
      if ('speechSynthesis' in window) {
        const translatedText = await t(fieldName);  // Translate the label

        const utterance = new SpeechSynthesisUtterance(translatedText);

        const languageMap: Record<string, string> = {
          'en': 'en-IN',
          'hi': 'hi-IN',
          'bn': 'bn-IN',
          'te': 'te-IN',
          'ta': 'ta-IN',
          'mr': 'mr-IN',
          'gu': 'gu-IN',
          'kn': 'kn-IN',
          'ml': 'ml-IN',
          'or': 'or-IN',
          'pa': 'pa-IN',
          'as': 'as-IN',
          'ur': 'ur-IN',
        };

        utterance.lang = languageMap[language] || 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      // console.error('Speech error:', error);
    }
  };

  const startRecording = async (fieldId: string) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    setIsRecording(true);
    setActiveFieldId(fieldId);

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Map language codes to BCP-47 format
      const languageMap: Record<string, string> = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN'
      };

      recognition.lang = languageMap[language] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({
          ...prev,
          [fieldId]: transcript
        }));
        setIsRecording(false);
        setActiveFieldId(null);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setActiveFieldId(null);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setActiveFieldId(null);
      };

      recognition.start();
    } catch (error) {
      // console.error('Recording error:', error);
      setIsRecording(false);
      setActiveFieldId(null);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const fillForm = async () => {
    if (!formId) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          formData,
          formFields,
          imageHeight,
          pdfHeight,
          scaleFactor
        })
      });

      const data = await response.json();
      if (data.success) {
        setDownloadUrl(data.downloadUrl);
      } else {
        setFileName(data.fileName || 'filled-form.pdf');
        alert('Failed to fill form: ' + data.error);
      }
    } catch (error) {
      // console.error('Form filling error:', error);
      alert('Failed to fill form');
    } finally {
      setIsProcessing(false);
    }
  };


  const resetForm = () => {
    setFile(null);
    setFormId(null);
    setFormFields([]);
    setFormData({});
    setDownloadUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const [dragActive, setDragActive] = useState(false);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    const fetchPlaceholders = async () => {
      const newPlaceholders: Record<string, string> = {};
      for (const field of formFields) {
        newPlaceholders[field.id] = await t(`Enter ${field.label}...`);
      }
      setPlaceholders(newPlaceholders);
    };
    if (formFields.length > 0) {
      fetchPlaceholders();
    }
  }, [formFields, t, language]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-white to-[#f3e8ff] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        {/* Header Container */}
        <ChatHeader
          title="Form Assistant"
          subtitle="Upload your form. Easily fill in your regional language, and download it."
        />


        {/* Upload Panel / Form Panel */}
        {!formId ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-8 mb-10"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
              ${dragActive ? "border-blue-600 bg-blue-600" : "hover:border-blue-400 hover:bg-blue-50"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
              />
              <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                <LocalizedText text="Upload Form" />
              </h3>
              <p className="text-gray-500 text-sm mt-2 mb-4">
                <LocalizedText text="Click to upload a PDF or image form" />
              </p>
              <div className="flex justify-center space-x-2 text-sm text-gray-600">
                <span className="px-2.5 py-1 bg-gray-100 rounded-md">PDF</span>
                {/* <span className="px-2.5 py-1 bg-gray-100 rounded-md">JPG</span>
                <span className="px-2.5 py-1 bg-gray-100 rounded-md">PNG</span>
                <span className="px-2.5 py-1 bg-gray-100 rounded-md">DOCX</span> */}

              </div>
              <p className="text-gray-500 text-sm mt-2 mb-0 text-center">
                {/* <LocalizedText text="(More languages coming soon)" /> */}
              </p>
            </motion.div>

            {file && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-6"
              >
                <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-gray-800 text-sm">{file.name}</span>
                  </div>
                  <button
                    onClick={uploadForm}
                    disabled={isUploading}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm shadow-md disabled:opacity-50"
                  >
                    {isUploading ? (
                      <LocalizedText text="Processing with AI..." />
                    ) : (
                      <LocalizedText text="Analyze with AI" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-8 mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                <LocalizedText text="AI-Detected Form Fields" />
              </h2>
              <button
                onClick={resetForm}
                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                <LocalizedText text="Upload New Form" />
              </button>
            </div>

            <div className="space-y-6">
              {formFields.map((field) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <VoicePlayer text={placeholders[field.id]} language={language} />




                      <span className="font-medium text-gray-900 ml-2">
                        <LocalizedText text={field.label} />
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => startRecording(field.id)}
                      disabled={isRecording}
                      className={`p-2 rounded-full ${activeFieldId === field.id && isRecording
                          ? "bg-red-100 text-red-600 animate-pulse"
                          : "text-gray-500 hover:text-blue-600"
                        }`}
                      title="Speak"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>
                  <input
                    type={
                      field.type === "date"
                        ? "date"
                        : field.type === "email"
                          ? "email"
                          : field.type === "tel"
                            ? "tel"
                            : "text"
                    }
                    value={formData[field.id] || ""}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder={placeholders[field.id] || `Enter ${field.label}...`}
                    required={field.required}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  download
                  className="px-6 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm shadow-md"
                >
                  <Download className="h-5 w-5 mr-2" />
                  <LocalizedText text="Download Filled Form" />
                </a>
              ) : (
                <button
                  onClick={fillForm}
                  disabled={isProcessing || formFields.length === 0}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm shadow-md disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      <LocalizedText text="Processing..." />
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      <LocalizedText text="Complete Form" />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );


};

export default FormFilling;