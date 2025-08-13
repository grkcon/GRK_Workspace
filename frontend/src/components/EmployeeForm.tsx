import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { Employee } from '../types/employee';
import { Document, DocumentType } from '../types/document';
import { documentApi } from '../services/documentApi';

// 한국 주민등록번호 유효성 검증 함수
function validateKoreanSSN(ssn: string): boolean {
  if (!ssn || typeof ssn !== 'string') return false;
  
  // 형식 체크: 6자리-7자리
  const ssnRegex = /^(\d{6})-(\d{7})$/;
  const match = ssn.match(ssnRegex);
  if (!match) return false;
  
  const [, front, back] = match;
  
  // 생년월일 유효성 검사
  const year = parseInt(front.substring(0, 2));
  const month = parseInt(front.substring(2, 4));
  const day = parseInt(front.substring(4, 6));
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // 월별 일수 체크
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // 윤년 계산 (1900년대, 2000년대 고려)
  const genderCode = parseInt(back.charAt(0));
  let fullYear: number;
  
  if (genderCode === 1 || genderCode === 2) {
    fullYear = 1900 + year;
  } else if (genderCode === 3 || genderCode === 4) {
    fullYear = 2000 + year;
  } else {
    return false; // 유효하지 않은 성별 코드
  }
  
  // 윤년 체크
  const isLeapYear = (fullYear % 4 === 0 && fullYear % 100 !== 0) || (fullYear % 400 === 0);
  if (month === 2 && isLeapYear) {
    daysInMonth[1] = 29;
  }
  
  if (day > daysInMonth[month - 1]) return false;
  
  // 체크섬 검증
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  const digits = (front + back.substring(0, 6)).split('').map(Number);
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights[i];
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  const lastDigit = parseInt(back.charAt(6));
  
  return checkDigit === lastDigit;
}

interface EmployeeFormProps {
  employee?: Employee;
  isEditing: boolean;
  mode: 'view' | 'edit' | 'new';
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
}

// 폼에서 사용하는 간단한 타입들
export interface EducationFormData {
  school?: string;
  major?: string;
  degree?: string;
  startDate?: string;
  graduationDate?: string;
}

export interface ExperienceFormData {
  company?: string;
  department?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  annualSalary?: string;
}

export interface EmployeeFormData {
  empNo: string;
  name: string;
  position: string;
  rank: string;
  department: string;
  tel: string;
  email: string;
  joinDate: string;
  endDate?: string;
  monthlySalary?: string;
  status: string;
  ssn?: string;
  bankName?: string;
  bankAccount?: string;
  consultantIntroduction?: string;
  education: EducationFormData[];
  experience: ExperienceFormData[];
}

// 직급 리스트 (높은 직급 → 낮은 직급 순서)
const POSITION_OPTIONS = [
  '대표이사',
  '부장',
  '차장',
  '과장',
  '대리',
  'Principal',
  'Manager',
  'Senior Business Analyst',
  'Business Analyst',
  'Associate',
  '사원',
  'RA (인턴)'
];

const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  employee, 
  isEditing, 
  mode, 
  onSubmit, 
  onCancel 
}) => {
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = React.useState<string>('');
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // 문서 관련 상태
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newDocument, setNewDocument] = useState<{
    file: File | null;
    documentType: DocumentType;
    description: string;
  }>({
    file: null,
    documentType: DocumentType.RESUME,
    description: ''
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeFormData>({
    defaultValues: {
      empNo: '',
      name: '',
      position: '',
      rank: '',
      department: '',
      tel: '',
      email: '',
      joinDate: '',
      endDate: '',
      monthlySalary: '',
      status: 'ACTIVE',
      ssn: '',
      bankName: '',
      bankAccount: '',
      consultantIntroduction: '',
      education: [],
      experience: []
    }
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation
  } = useFieldArray({
    control,
    name: 'education'
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience
  } = useFieldArray({
    control,
    name: 'experience'
  });

  // 문서 업로드 함수
  const handleDocumentUpload = async () => {
    if (!newDocument.file || !employee?.id) return;

    try {
      setUploadingDoc(true);
      const uploadedDoc = await documentApi.uploadDocument(
        employee.id,
        newDocument.file,
        {
          documentType: newDocument.documentType,
          description: newDocument.description
        }
      );
      
      // 업로드 성공 후 문서 목록 다시 로드
      const updatedDocs = await documentApi.getEmployeeDocuments(employee.id);
      setDocuments(updatedDocs);
      
      setNewDocument({
        file: null,
        documentType: DocumentType.RESUME,
        description: ''
      });
      
      // 파일 input 초기화
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      alert('문서가 성공적으로 업로드되었습니다.');
    } catch (error) {
      console.error('Document upload failed:', error);
      alert('문서 업로드에 실패했습니다.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentDelete = async (documentId: number) => {
    if (!window.confirm('이 문서를 삭제하시겠습니까?')) return;

    try {
      await documentApi.deleteDocument(documentId);
      
      // 삭제 성공 후 문서 목록 다시 로드
      if (employee?.id) {
        const updatedDocs = await documentApi.getEmployeeDocuments(employee.id);
        setDocuments(updatedDocs);
      }
      
      alert('문서가 삭제되었습니다.');
    } catch (error) {
      console.error('Document delete failed:', error);
      alert('문서 삭제에 실패했습니다.');
    }
  };

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels = {
      [DocumentType.RESUME]: '이력서',
      [DocumentType.DIPLOMA]: '졸업증명서',
      [DocumentType.CAREER_CERT]: '경력증명서',
      [DocumentType.LICENSE]: '자격증',
      [DocumentType.OTHER]: '기타'
    };
    return labels[type];
  };

  // 직원 데이터가 변경되면 폼 리셋
  useEffect(() => {
    if (employee) {
      // 기존 프로필 이미지 설정
      if (employee.profileImageUrl) {
        setProfileImagePreview(`http://localhost:3001${employee.profileImageUrl}`);
      } else {
        setProfileImagePreview('');
      }
      
      reset({
        empNo: employee.empNo || '',
        name: employee.name || '',
        position: employee.position || '',
        rank: employee.rank || '',
        department: employee.department || '',
        tel: employee.tel || '',
        email: employee.email || '',
        joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
        endDate: employee.endDate ? new Date(employee.endDate).toISOString().split('T')[0] : '',
        monthlySalary: employee.monthlySalary ? (employee.monthlySalary * 12).toLocaleString() : '',
        status: employee.status || 'ACTIVE',
        ssn: employee.ssn || '',
        bankName: employee.bankName || '',
        bankAccount: employee.bankAccount || '',
        consultantIntroduction: employee.consultantIntroduction || '',
        education: (employee.education && Array.isArray(employee.education)) ? employee.education.map(edu => ({
          school: edu.school,
          major: edu.major,
          degree: edu.degree,
          startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : '',
          graduationDate: edu.graduationDate ? new Date(edu.graduationDate).toISOString().split('T')[0] : ''
        })) : [],
        experience: (employee.experience && Array.isArray(employee.experience)) ? employee.experience.map(exp => ({
          company: exp.company,
          department: exp.department,
          position: exp.position,
          startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
          endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
          annualSalary: exp.annualSalary ? exp.annualSalary.toLocaleString() : ''
        })) : []
      });

      // 문서 목록 로드
      if (employee.id) {
        documentApi.getEmployeeDocuments(employee.id)
          .then(docs => setDocuments(docs))
          .catch(error => console.error('Failed to load documents:', error));
      }
    } else if (mode === 'new') {
      reset({
        empNo: '',
        name: '',
        position: '',
        rank: '',
        department: '',
        tel: '',
        email: '',
          joinDate: '',
        endDate: '',
        monthlySalary: '',
        status: 'ACTIVE',
        ssn: '',
        bankName: '',
        bankAccount: '',
        consultantIntroduction: '',
        education: [],
        experience: []
      });
    }
  }, [employee, mode, reset]);

  const onFormSubmit: SubmitHandler<EmployeeFormData> = (data) => {
    console.log('Form submitted:', data);
    
    // 빈 문자열을 undefined로 변환 (선택사항 필드들)
    const cleanedData: EmployeeFormData = {
      ...data,
      ssn: data.ssn?.trim() || undefined,
      bankName: data.bankName?.trim() || undefined,
      bankAccount: data.bankAccount?.trim() || undefined,
      consultantIntroduction: data.consultantIntroduction?.trim() || undefined,
      endDate: data.endDate?.trim() || undefined,
      // monthlySalary는 문자열로 유지 (백엔드에서 처리)
      monthlySalary: data.monthlySalary?.trim() || undefined
    };

    // age 필드가 있다면 제거 (혹시라도 포함된 경우 대비)
    const { age, ...finalData } = cleanedData as any;
    
    onSubmit(finalData);
  };

  const addEducation = () => {
    appendEducation({ school: '', major: '', degree: '', startDate: '', graduationDate: '' } as EducationFormData);
  };

  const addExperience = () => {
    appendExperience({ company: '', department: '', position: '', startDate: '', endDate: '', annualSalary: '' } as ExperienceFormData);
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 타입 검사
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 검사 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      setProfileImage(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !employee?.id) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', profileImage);

      const response = await fetch(`http://localhost:3001/api/employees/${employee.id}/profile-image`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const updatedEmployee = await response.json();
        alert('프로필 사진이 업데이트되었습니다.');
        
        // 미리보기를 업데이트된 이미지로 설정
        setProfileImagePreview(`http://localhost:3001${updatedEmployee.profileImageUrl}`);
        setProfileImage(null);
        
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert('프로필 사진 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Profile image upload error:', error);
      alert('프로필 사진 업로드 중 오류가 발생했습니다.');
    }
    setUploadingImage(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const inputClass = (hasError?: boolean) => `
    w-full px-3 py-2 border rounded-md
    ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'}
    ${!isEditing ? 'bg-slate-50 text-slate-600' : ''}
    focus:outline-none focus:ring-2 transition-colors
  `;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 text-sm">
        {/* 기본 정보 섹션 */}
        <section>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-base">기본 정보</h3>
            {isEditing && (
              <div className="flex items-center space-x-2">
                {profileImage && (
                  <button
                    type="button"
                    onClick={uploadProfileImage}
                    disabled={uploadingImage}
                    className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploadingImage ? '업로드 중...' : '업로드'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                >
                  프로필 사진 변경
                </button>
              </div>
            )}
          </div>
          
          {/* 숨겨진 파일 입력 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfileImageChange}
            accept="image/*"
            className="hidden"
          />
          
          {/* 프로필 이미지 미리보기 */}
          {(profileImagePreview || profileImage) && (
            <div className="mt-4 flex justify-center">
              <div className="relative">
                <img
                  src={profileImagePreview}
                  alt="프로필 이미지 미리보기"
                  className="w-32 h-32 object-cover rounded-full border-4 border-slate-200"
                />
                {profileImage && !uploadingImage && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    업로드 대기
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="text-white text-xs">업로드 중...</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-600 mb-1">이름 *</label>
              <input
                type="text"
                {...register('name', { 
                  required: '이름은 필수 입력 항목입니다.',
                  minLength: { value: 2, message: '이름은 최소 2자 이상이어야 합니다.' },
                  maxLength: { value: 50, message: '이름은 최대 50자 이하여야 합니다.' },
                  pattern: { 
                    value: /^[가-힣a-zA-Z\s]+$/, 
                    message: '이름은 한글, 영문, 공백만 입력 가능합니다.' 
                  }
                })}
                readOnly={!isEditing}
                className={inputClass(!!errors.name)}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">
                사번 {mode === 'new' && <span className="text-xs text-slate-500">(자동 생성)</span>}
              </label>
              <input
                type="text"
                {...register('empNo')}
                readOnly={true}
                value={mode === 'new' ? '자동 생성됩니다' : undefined}
                placeholder={mode === 'new' ? '자동 생성됩니다' : ''}
                className={`${inputClass(false)} bg-slate-50 text-slate-600`}
              />
              {mode === 'new' && (
                <p className="mt-1 text-xs text-slate-500">입사 연도 + 순번으로 자동 생성됩니다 (예: 2025001)</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">직급 *</label>
              {isEditing ? (
                <div>
                  <select
                    {...register('position', {
                      required: '직급은 필수 선택 항목입니다.'
                    })}
                    className={inputClass(!!errors.position)}
                  >
                    <option value="">직급을 선택하세요</option>
                    {POSITION_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={watch('position') || ''}
                    readOnly
                    className={`${inputClass(false)} bg-slate-50 text-slate-600`}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">부서 *</label>
              <input
                type="text"
                {...register('department', {
                  required: '부서는 필수 입력 항목입니다.',
                  minLength: { value: 1, message: '부서는 최소 1자 이상이어야 합니다.' },
                  maxLength: { value: 50, message: '부서는 최대 50자 이하여야 합니다.' }
                })}
                readOnly={!isEditing}
                className={inputClass(!!errors.department)}
              />
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">직책</label>
              <input
                type="text"
                {...register('rank', {
                  maxLength: { value: 50, message: '직책은 최대 50자 이하여야 합니다.' }
                })}
                readOnly={!isEditing}
                className={inputClass(!!errors.rank)}
              />
              {errors.rank && (
                <p className="mt-1 text-sm text-red-600">{errors.rank.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">전화번호 *</label>
              <input
                type="text"
                {...register('tel', {
                  required: '전화번호는 필수 입력 항목입니다.',
                  pattern: { value: /^[0-9-]+$/, message: '전화번호는 숫자와 하이픈만 입력 가능합니다.' },
                  minLength: { value: 10, message: '전화번호는 최소 10자 이상이어야 합니다.' },
                  maxLength: { value: 20, message: '전화번호는 최대 20자 이하여야 합니다.' }
                })}
                readOnly={!isEditing}
                className={inputClass(!!errors.tel)}
                placeholder="예: 010-1234-5678"
                onInput={(e) => {
                  if (isEditing) {
                    const target = e.target as HTMLInputElement;
                    // 숫자만 추출
                    let value = target.value.replace(/[^\d]/g, '');
                    
                    // 길이에 따라 하이픈 추가
                    if (value.length <= 3) {
                      // 3자리 이하: 그대로
                      target.value = value;
                    } else if (value.length <= 7) {
                      // 4-7자리: 010-1234 형태
                      target.value = `${value.slice(0, 3)}-${value.slice(3)}`;
                    } else {
                      // 8자리 이상: 010-1234-5678 형태
                      target.value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
                    }
                  }
                }}
              />
              {errors.tel && (
                <p className="mt-1 text-sm text-red-600">{errors.tel.message}</p>
              )}
            </div>


            <div className="md:col-span-2">
              <label className="block font-medium text-slate-600 mb-1">이메일 주소 *</label>
              <input
                type="email"
                {...register('email', {
                  required: '이메일은 필수 입력 항목입니다.',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '올바른 이메일 형식이 아닙니다.' }
                })}
                readOnly={!isEditing}
                className={inputClass(!!errors.email)}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">주민등록번호</label>
              <input
                type="text"
                {...register('ssn', {
                  pattern: { 
                    value: /^\d{6}-\d{7}$/, 
                    message: '주민등록번호는 "123456-1234567" 형식이어야 합니다.' 
                  },
                  validate: (value) => {
                    if (!value || value.trim() === '') return true; // 선택사항이므로 빈 값 허용
                    return validateKoreanSSN(value) || '유효하지 않은 주민등록번호입니다.';
                  }
                })}
                readOnly={!isEditing}
                className={inputClass(!!errors.ssn)}
                placeholder="예: 900101-1234567"
                maxLength={14}
                onInput={(e) => {
                  if (isEditing) {
                    const target = e.target as HTMLInputElement;
                    // 숫자만 추출
                    let value = target.value.replace(/[^\d]/g, '');
                    
                    // 길이에 따라 하이픈 추가
                    if (value.length <= 6) {
                      target.value = value;
                    } else {
                      // 6자리 이후에 하이픈 추가: 123456-1234567
                      target.value = `${value.slice(0, 6)}-${value.slice(6, 13)}`;
                    }
                  }
                }}
              />
              {errors.ssn && (
                <p className="mt-1 text-sm text-red-600">{errors.ssn.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">연봉</label>
              <input
                type="text"
                {...register('monthlySalary', {
                  pattern: { 
                    value: /^[\d,]+$/, 
                    message: '연봉은 숫자와 콤마만 입력 가능합니다.' 
                  },
                  validate: (value) => {
                    if (!value) return true; // 선택사항이므로 빈 값 허용
                    const numValue = parseInt(value.replace(/,/g, ''));
                    if (numValue < 0) return '연봉은 0원 이상이어야 합니다.';
                    if (numValue > 999999999999) return '연봉이 너무 큽니다.';
                    return true;
                  }
                })}
                readOnly={!isEditing}
                className={inputClass(!!errors.monthlySalary)}
                placeholder="예: 48,000,000"
                onInput={(e) => {
                  if (isEditing) {
                    const target = e.target as HTMLInputElement;
                    // 숫자만 추출
                    const value = target.value.replace(/[^\d]/g, '');
                    // 세자리마다 콤마 추가
                    const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    target.value = formattedValue;
                  }
                }}
              />
              {errors.monthlySalary && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlySalary.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">입사일 *</label>
              <input
                type="date"
                {...register('joinDate', { required: '입사일은 필수 입력 항목입니다.' })}
                readOnly={!isEditing}
                className={inputClass(!!errors.joinDate)}
              />
              {errors.joinDate && (
                <p className="mt-1 text-sm text-red-600">{errors.joinDate.message}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">퇴사일</label>
              <input
                type="date"
                {...register('endDate')}
                readOnly={!isEditing}
                className={inputClass(!!errors.endDate)}
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">은행명</label>
              <select
                {...register('bankName')}
                disabled={!isEditing}
                className={inputClass(!!errors.bankName)}
              >
                <option value="">은행 선택</option>
                <option value="국민은행">국민은행</option>
                <option value="신한은행">신한은행</option>
                <option value="우리은행">우리은행</option>
                <option value="하나은행">하나은행</option>
                <option value="농협은행">농협은행</option>
                <option value="기업은행">기업은행</option>
                <option value="SC제일은행">SC제일은행</option>
                <option value="씨티은행">씨티은행</option>
                <option value="대구은행">대구은행</option>
                <option value="부산은행">부산은행</option>
                <option value="경남은행">경남은행</option>
                <option value="광주은행">광주은행</option>
                <option value="전북은행">전북은행</option>
                <option value="제주은행">제주은행</option>
                <option value="산업은행">산업은행</option>
                <option value="수협은행">수협은행</option>
                <option value="우체국예금">우체국예금</option>
                <option value="새마을금고">새마을금고</option>
                <option value="신협">신협</option>
                <option value="카카오뱅크">카카오뱅크</option>
                <option value="토스뱅크">토스뱅크</option>
                <option value="케이뱅크">케이뱅크</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">계좌번호</label>
              <input
                type="text"
                {...register('bankAccount', {
                  pattern: {
                    value: /^[0-9-]*$/,
                    message: '계좌번호는 숫자와 하이픈만 입력 가능합니다.'
                  },
                  minLength: { value: 10, message: '계좌번호는 최소 10자 이상이어야 합니다.' },
                  maxLength: { value: 50, message: '계좌번호는 최대 50자 이하여야 합니다.' }
                })}
                readOnly={!isEditing}
                className={inputClass(!!errors.bankAccount)}
                placeholder="예: 123-456-789012"
                onInput={(e) => {
                  if (isEditing) {
                    const target = e.target as HTMLInputElement;
                    // 숫자와 하이픈만 허용
                    target.value = target.value.replace(/[^0-9-]/g, '');
                  }
                }}
              />
              {errors.bankAccount && (
                <p className="mt-1 text-sm text-red-600">{errors.bankAccount.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-600 mb-1">컨설턴트 소개</label>
              <textarea
                {...register('consultantIntroduction', {
                  maxLength: { value: 500, message: '컨설턴트 소개는 500자 이내로 입력해주세요.' }
                })}
                readOnly={!isEditing}
                className={`${inputClass(!!errors.consultantIntroduction)} min-h-[100px] resize-none`}
                placeholder="컨설턴트의 전문 분야, 경력, 특징 등을 소개해주세요. (최대 500자)"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.consultantIntroduction && (
                  <p className="text-sm text-red-600">{errors.consultantIntroduction.message}</p>
                )}
                <p className="text-xs text-slate-500 ml-auto">
                  {isEditing && (
                    <span>
                      {(watch('consultantIntroduction') || '').length}/500자
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 학력 정보 섹션 */}
        <section>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-base">학력</h3>
            {isEditing && (
              <button
                type="button"
                onClick={addEducation}
                className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
              >
                + 추가
              </button>
            )}
          </div>
          
          <div className="mt-2 border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr className="text-left">
                  <th className="p-2 font-medium">학교명</th>
                  <th className="p-2 font-medium">전공</th>
                  <th className="p-2 font-medium">학위</th>
                  <th className="p-2 font-medium">입학일</th>
                  <th className="p-2 font-medium">졸업일</th>
                  {isEditing && <th className="w-12 p-2"></th>}
                </tr>
              </thead>
              <tbody>
                {educationFields.map((field, index) => (
                  <tr key={field.id} className="border-t">
                    <td className="p-1">
                      <input
                        type="text"
                        {...register(`education.${index}.school`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        {...register(`education.${index}.major`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        {...register(`education.${index}.degree`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        {...register(`education.${index}.startDate`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent text-xs"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        {...register(`education.${index}.graduationDate`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent text-xs"
                      />
                    </td>
                    {isEditing && (
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          &times;
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {educationFields.length === 0 && (
                  <tr>
                    <td colSpan={isEditing ? 6 : 5} className="p-4 text-center text-slate-500 text-sm">
                      학력 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 경력 정보 섹션 */}
        <section>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-base">경력</h3>
            {isEditing && (
              <button
                type="button"
                onClick={addExperience}
                className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
              >
                + 추가
              </button>
            )}
          </div>
          
          <div className="mt-2 border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr className="text-left">
                  <th className="p-2 font-medium">회사명</th>
                  <th className="p-2 font-medium">부서</th>
                  <th className="p-2 font-medium">직급</th>
                  <th className="p-2 font-medium">입사일</th>
                  <th className="p-2 font-medium">퇴사일</th>
                  <th className="p-2 font-medium">연봉</th>
                  {isEditing && <th className="w-12 p-2"></th>}
                </tr>
              </thead>
              <tbody>
                {experienceFields.map((field, index) => (
                  <tr key={field.id} className="border-t">
                    <td className="p-1">
                      <input
                        type="text"
                        {...register(`experience.${index}.company`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        {...register(`experience.${index}.department`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent"
                      />
                    </td>
                    <td className="p-1">
                      {isEditing ? (
                        <select
                          {...register(`experience.${index}.position`)}
                          className="w-full border-0 rounded-md bg-transparent text-xs"
                        >
                          <option value="">선택</option>
                          {POSITION_OPTIONS.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          {...register(`experience.${index}.position`)}
                          readOnly
                          className="w-full border-0 rounded-md bg-transparent"
                        />
                      )}
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        {...register(`experience.${index}.startDate`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent text-xs"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        {...register(`experience.${index}.endDate`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent text-xs"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        {...register(`experience.${index}.annualSalary`)}
                        readOnly={!isEditing}
                        className="w-full border-0 rounded-md bg-transparent text-xs"
                        placeholder="예: 48,000,000"
                        onInput={(e) => {
                          if (isEditing) {
                            const target = e.target as HTMLInputElement;
                            // 숫자만 추출
                            const value = target.value.replace(/[^\d]/g, '');
                            // 세자리마다 콤마 추가
                            const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                            target.value = formattedValue;
                          }
                        }}
                      />
                    </td>
                    {isEditing && (
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          &times;
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {experienceFields.length === 0 && (
                  <tr>
                    <td colSpan={isEditing ? 7 : 6} className="p-4 text-center text-slate-500 text-sm">
                      경력 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 첨부문서 섹션 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-800">첨부문서</h3>
          </div>

          {/* 기존 문서 목록 */}
          {documents.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">업로드된 문서</h4>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {getDocumentTypeLabel(doc.documentType)}
                        </span>
                        <span className="text-sm text-slate-700">{doc.originalName}</span>
                        <span className="text-xs text-slate-500">
                          ({(doc.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-slate-500 mt-1">{doc.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={documentApi.getDownloadUrl(doc.id)}
                        download
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        다운로드
                      </a>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleDocumentDelete(doc.id)}
                          className="text-rose-600 hover:text-rose-800 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 새 문서 업로드 (편집 모드에서만) */}
          {isEditing && employee?.id && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">새 문서 업로드</h4>
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      문서 유형
                    </label>
                    <select
                      value={newDocument.documentType}
                      onChange={(e) => setNewDocument(prev => ({ 
                        ...prev, 
                        documentType: e.target.value as DocumentType 
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    >
                      <option value={DocumentType.RESUME}>이력서</option>
                      <option value={DocumentType.DIPLOMA}>졸업증명서</option>
                      <option value={DocumentType.CAREER_CERT}>경력증명서</option>
                      <option value={DocumentType.LICENSE}>자격증</option>
                      <option value={DocumentType.OTHER}>기타</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      파일
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            alert('파일 크기는 10MB 이하여야 합니다.');
                            return;
                          }
                          setNewDocument(prev => ({ ...prev, file }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    설명 (선택사항)
                  </label>
                  <textarea
                    value={newDocument.description}
                    onChange={(e) => setNewDocument(prev => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))}
                    maxLength={500}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    placeholder="문서에 대한 간단한 설명을 입력하세요..."
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    {newDocument.description.length}/500
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDocumentUpload}
                  disabled={!newDocument.file || uploadingDoc}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {uploadingDoc && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {uploadingDoc ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 액션 버튼 */}
        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {mode === 'new' ? '직원 추가' : '수정 완료'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

// 기존 getEmployeeFormData 함수는 제거되고 폼 제출 시 onSubmit으로 데이터 전달
export default EmployeeForm;