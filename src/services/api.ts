// src/services/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
  data?: T;
}

export interface User {
  id: number;
  email: string;
  name: string;
  preferredLanguage: string;
  storageUsed?: number;
  maxStorage?: number;
}

export interface Document {
  id: number;
  original_name: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: string;
  upload_date: string;
  analysis_date?: string;
  access_count: number;
  tags?: string[];
  summary?: string;
  clauses?: string[];
  risks?: string[];
  suggestions?: string[];
  s3_url?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: string;
  rect: number[];
  pdfCoordinates?: number[];
  imageCoordinates?: number[];
  required?: boolean;
}

export interface FormUploadResponse {
  success: boolean;
  formId: string;
  formFields: FormField[];
  imageHeight: number;
  imageWidth: number;
  pdfHeight: number;
  pdfWidth: number;
  scaleFactor: { x: number; y: number };
  originalName: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_URL}` || 'https://legalsetu.onrender.com';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authAPI = {
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(userData: { email: string; password: string; name: string; preferredLanguage?: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.json();
  }
};

export const documentAPI = {
  async uploadDocument(formData: FormData): Promise<ApiResponse<Document>> {
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders()
    });
    return response.json();
  },

  async getMyDocuments(params: { page?: number; limit?: number; status?: string; search?: string; documentType?: string } = {}): Promise<ApiResponse<{ documents: Document[]; total: number; pages: number }>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const response = await fetch(`${API_BASE_URL}/api/documents/my-documents?${queryString}`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  async getDocument(documentId: number | string): Promise<ApiResponse<Document>> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  async downloadDocument(documentId: number | string): Promise<ApiResponse<{ downloadUrl: string }>> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/download`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.success && data.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
    }
    return data;
  },

  async deleteDocument(documentId: number | string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

export const formAPI = {
  uploadForm: async (formData: FormData): Promise<FormUploadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/forms/upload`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders()
    });
    return response.json();
  },

  speakField: async (text: string, language: string): Promise<ApiResponse<{ audioUrl: string }>> => {
    const response = await fetch(`${API_BASE_URL}/api/forms/speak`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });
    return response.json();
  },

  recognizeSpeech: async (audioData: FormData): Promise<ApiResponse<{ transcription: string }>> => {
    const response = await fetch(`${API_BASE_URL}/api/forms/recognize`, {
      method: 'POST',
      body: audioData,
      headers: getAuthHeaders()
    });
    return response.json();
  },

  fillForm: async (
    formId: string, 
    formData: Record<string, string>, 
    formFields: FormField[], 
    conversionData: {
      imageHeight: number;
      pdfHeight: number;
      scaleFactor: { x: number; y: number };
    }
  ): Promise<ApiResponse<{ downloadUrl: string }>> => {
    const response = await fetch(`${API_BASE_URL}/api/forms/fill`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        formId, 
        formData, 
        formFields, 
        ...conversionData 
      })
    });
    return response.json();
  },
  
  downloadFilledForm: async (downloadUrl: string, fileName: string): Promise<void> => {
    try {
      // Fetch the file from the pre-signed URL
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Convert the response to a blob
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'filled-form.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};
