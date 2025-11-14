import React from 'react';
import { Languages } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'mr', name: 'Marathi' },
];

interface Props {
  selected: string;
  onChange: (lang: string) => void;
}

const LanguageSelector: React.FC<Props> = ({ selected, onChange }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
    <div className="flex justify-between mb-4">
      <h3 className="font-semibold">Select Language</h3>
      <Languages className="w-5 h-5 text-gray-500" />
    </div>
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border px-3 py-2 rounded-lg"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  </div>
);

export default LanguageSelector;
