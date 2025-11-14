import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext.tsx';
import LanguageSelector from './Document/LanguageSelector';
import FileUploader from './Document/FileUploader.tsx';
import DocumentList from './Document/DocumentList.tsx';
import AnalysisModal from './Document/AnalysisModal.tsx';
import ChatHeader from './ChatHeader.tsx';
import LocalizedText from './LocalizedText.tsx';

interface AnalysisResult {
  summary: string;
  clauses: string[];
  risks: string[];
  suggestions: string[];
  fullText: string;
  _meta?: {
    pages: number;
    pageMetadata: Record<string, any>;
  };
}

interface UploadedDocument {
  id: string;
  analysisId?: string;  // Changed from docId to analysisId
  name: string;
  type: string;
  size: string;
  uploadDate: Date;
  status: 'analyzing' | 'completed' | 'error';
  analysis?: AnalysisResult;
}

const DocumentUpload: React.FC = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisView, setAnalysisView] = useState<string | null>(null);

  const { language, t } = useTranslation();
  const [localizedText, setLocalizedText] = useState({
    headerTitle: 'Document Analysis',
    headerSubtitle: 'Upload documents and get AI-powered insights.',
    uploadLabel: 'Upload Document',
    chooseFileLabel: 'Choose File',
    fileTypesLabel: 'PDF, JPG, PNG, DOCX (Max 10MB)',
    uploadedDocsLabel: 'Uploaded Documents',
    noDocsLabel: 'No documents uploaded'
  });

  useEffect(() => {
    const translateUI = async () => {
      try {
        const translations = await Promise.all([
          t('Document Analysis'),
          t('Upload documents and get AI-powered insights.'),
          t('Upload Document'),
          t('Choose File'),
          t('PDF, JPG, PNG, DOCX (Max 10MB)'),
          t('Uploaded Documents'),
          t('No documents uploaded')
        ]);
        setLocalizedText({
          headerTitle: translations[0],
          headerSubtitle: translations[1],
          uploadLabel: translations[2],
          chooseFileLabel: translations[3],
          fileTypesLabel: translations[4],
          uploadedDocsLabel: translations[5],
          noDocsLabel: translations[6]
        });
      } catch (error) {
        // console.error('Translation error:', error);
      }
    };
    translateUI();
  }, [language, t]);

  const handleFiles = async (files: File[]) => {
    try {
      for (const file of files) {
        const id = Date.now().toString() + Math.random();
        const newDoc: UploadedDocument = {
          id,
          name: file.name,
          type: file.type,
          size: file.size.toString(),
          uploadDate: new Date(),
          status: 'analyzing'
        };

        setDocuments(prev => [...prev, newDoc]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', language);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Analysis request failed');

        const result = await response.json();

        setDocuments(prev =>
          prev.map(doc =>
            doc.id === id
              ? {
                ...doc,
                analysisId: result.analysisId, // Store backend analysisId
                status: 'completed',
                analysis: result.analysis ? {
                  summary: result.analysis.summary || '',
                  clauses: result.analysis.clauses || [],
                  risks: result.analysis.risks || [],
                  suggestions: result.analysis.suggestions || [],
                  fullText: result.analysis.fullText || '',
                  _meta: result.analysis._meta || { pages: 0, pageMetadata: {} }
                } : undefined
              }
              : doc
          )
        );
      }
    } catch (error) {
      // console.error('File processing error:', error);
      setDocuments(prev =>
        prev.map(doc =>
          doc.status === 'analyzing'
            ? { ...doc, status: 'error', analysis: undefined }
            : doc
        )
      );
    }
  };

  // Fetch analysis by analysisId when viewing
  const fetchAnalysisById = async (analysisId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analysis/${analysisId}?lang=${language}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      const data = await response.json();

      setDocuments(prev =>
        prev.map(doc =>
          doc.analysisId === analysisId
            ? { ...doc, analysis: data, status: 'completed' }
            : doc
        )
      );
    } catch (error) {
      // console.error('Error fetching analysis:', error);
    }
  };

  // When user selects a document to view analysis
  useEffect(() => {
    if (analysisView) {
      fetchAnalysisById(analysisView);
    }
  }, [analysisView, language]);


  // Restore documents and analysisView on first load
  useEffect(() => {
    const savedDocs = sessionStorage.getItem('uploadedDocuments');
    const savedView = sessionStorage.getItem('analysisViewId');

    if (savedDocs) {
      try {
        const parsed: UploadedDocument[] = JSON.parse(savedDocs);
        if (Array.isArray(parsed)) {
          setDocuments(parsed);
          // console.log('✅ Restored documents from session:', parsed);
        }
      } catch (error) {
        // console.error('❌ Failed to parse saved documents:', error);
      }
    }

    if (savedView) {
      setAnalysisView(savedView);
    }
  }, []);

  // Save documents to sessionStorage when they change
  useEffect(() => {
    const timeout = setTimeout(() => {
      sessionStorage.setItem('uploadedDocuments', JSON.stringify(documents));
      // console.log('✅ Saved documents to session:', documents);
    }, 400);

    return () => clearTimeout(timeout);
  }, [documents]);

  // Save selected analysisView when it changes
  useEffect(() => {
    if (analysisView) {
      sessionStorage.setItem('analysisViewId', analysisView);
      // console.log('✅ Saved analysisView to session:', analysisView);
    } else {
      sessionStorage.removeItem('analysisViewId');
    }
  }, [analysisView]);




  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-white to-[#f3e8ff] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <ChatHeader
          title={localizedText.headerTitle}
          subtitle={localizedText.headerSubtitle}
        />

        {/* File Uploader */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6"
        >
          <FileUploader
            onFiles={handleFiles}
            dragActive={dragActive}
            setDragActive={setDragActive}
            uploadLabel={localizedText.uploadLabel}
            chooseFileLabel={localizedText.chooseFileLabel}
            fileTypesLabel={localizedText.fileTypesLabel}
          />
          <p className="text-gray-500 text-sm mt-2 mb-0 text-center">
            <LocalizedText text='(More Languages coming soon.)'/>
          </p>

        </motion.div>

        {/* Document List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <DocumentList
            documents={documents}
            onDelete={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
            onViewAnalysis={(analysisId) => setAnalysisView(analysisId)}
            uploadedDocsLabel={localizedText.uploadedDocsLabel}
            noDocsLabel={localizedText.noDocsLabel}
          />
        </motion.div>

        {/* Analysis Modal */}
        {analysisView && (
          <AnalysisModal
            analysis={documents.find(d => d.analysisId === analysisView)?.analysis}
            onClose={() => setAnalysisView(null)}
          />
        )}
      </motion.div>
    </div>

  );
};

export default DocumentUpload;
