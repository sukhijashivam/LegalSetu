import React from 'react';
import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onFiles: (files: File[]) => void;
  dragActive: boolean;
  setDragActive: (val: boolean) => void;
  uploadLabel: string;
  chooseFileLabel: string;
  fileTypesLabel: string;
}

const FileUploader: React.FC<Props> = ({
  onFiles,
  dragActive,
  setDragActive,
  uploadLabel,
  chooseFileLabel,
  fileTypesLabel
}) => {
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    onFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`transition-all duration-300 p-8 rounded-xl border-2 border-dashed shadow-sm ${
        dragActive
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-300 bg-white'
      }`}
    >
      <div className="text-center flex flex-col items-center justify-center gap-3">
        <Upload className="w-14 h-14 text-blue-600 mb-2" />
        <h3 className="text-lg font-semibold text-gray-800">{uploadLabel}</h3>

        <input
          type="file"
          id="fileInput"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          onChange={(e) => onFiles(Array.from(e.target.files || []))}
          className="hidden"
        />

        <label
          htmlFor="fileInput"
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition"
        >
          {chooseFileLabel}
        </label>

        <div className="flex justify-center space-x-2 text-sm text-gray-600">
            <p className="px-2.5 py-1 bg-gray-100 rounded-md">{fileTypesLabel}</p>
        </div>
        
      </div>
    </motion.div>
  );
};

export default FileUploader;
