export enum DocumentType {
  RESUME = 'RESUME',
  DIPLOMA = 'DIPLOMA',
  CAREER_CERT = 'CAREER_CERT',
  LICENSE = 'LICENSE',
  OTHER = 'OTHER'
}

export interface Document {
  id: number;
  originalName: string;
  fileName: string;
  filePath: string;
  fileExtension: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  description?: string;
  employeeId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  documentType: DocumentType;
  description?: string;
}