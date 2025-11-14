import React from 'react';
import { Eye, Trash2, FileText, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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

interface Doc {
  id: string;
  analysisId?: string;
  name: string;
  type: string;
  size: string; // size in bytes, as a string
  uploadDate: Date;
  status: 'analyzing' | 'completed' | 'error';
  analysis?: AnalysisResult;
}

interface Props {
  documents: Doc[];
  onDelete: (id: string) => void;
  onViewAnalysis: (analysisId: string) => void;
  uploadedDocsLabel: string;
  noDocsLabel: string;
}

// 🧠 Utility function to convert bytes to readable format
const formatBytes = (bytes: string | number): string => {
  const size = typeof bytes === "string" ? parseInt(bytes) : bytes;
  if (isNaN(size)) return "Invalid size";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  let index = 0;
  let value = size;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }

  return `${value.toFixed(2)} ${units[index]}`;
};

const DocumentList: React.FC<Props> = ({
  documents,
  onDelete,
  onViewAnalysis,
  uploadedDocsLabel,
  noDocsLabel
}) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-5">
      {uploadedDocsLabel} ({documents.length})
    </h3>

    <AnimatePresence>
      {documents.length === 0 ? (
        <p className="text-center text-gray-500 text-sm">{noDocsLabel}</p>
      ) : (
        documents.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="border border-gray-200 p-4 rounded-lg mb-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="text-sm font-medium text-gray-800">{doc.name}</h4>
                  <p className="text-xs text-gray-500">
                    {formatBytes(doc.size)} • {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {doc.status === 'completed' && doc.analysisId && (
                  <button
                    onClick={() => onViewAnalysis(doc.analysisId!)}
                    title="View Analysis"
                    className="text-blue-600 hover:text-blue-700 transition"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(doc.id)}
                  title="Delete"
                  className="text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-3">
              {doc.status === 'analyzing' && (
                <p className="text-sm text-yellow-500">⏳ Analyzing...</p>
              )}
              {doc.status === 'completed' && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Analysis Complete
                </p>
              )}
              {doc.status === 'error' && (
                <p className="text-sm text-red-600">⚠️ Error during analysis.</p>
              )}
            </div>
          </motion.div>
        ))
      )}
    </AnimatePresence>
  </div>
);

export default DocumentList;
