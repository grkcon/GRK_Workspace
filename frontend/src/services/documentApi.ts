import { apiClient as api } from './api';
import { Document, CreateDocumentRequest } from '../types/document';

export const documentApi = {
  // 직원의 문서 목록 조회
  getEmployeeDocuments: async (employeeId: number): Promise<Document[]> => {
    return await api.get<Document[]>(`/employees/${employeeId}/documents`);
  },

  // 문서 업로드
  uploadDocument: async (
    employeeId: number,
    file: File,
    documentData: CreateDocumentRequest
  ): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentData.documentType);
    if (documentData.description) {
      formData.append('description', documentData.description);
    }

    const token = localStorage.getItem('accessToken');
    const response = await fetch(`http://localhost:3001/api/employees/${employeeId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  },

  // 문서 다운로드 URL 생성
  getDownloadUrl: (documentId: number): string => {
    return `http://localhost:3001/api/employees/documents/${documentId}/download`;
  },

  // 문서 정보 수정
  updateDocument: async (
    documentId: number,
    documentData: Partial<CreateDocumentRequest>
  ): Promise<Document> => {
    return await api.patch<Document>(`/employees/documents/${documentId}`, documentData);
  },

  // 문서 삭제
  deleteDocument: async (documentId: number): Promise<void> => {
    await api.delete<void>(`/employees/documents/${documentId}`);
  },
};