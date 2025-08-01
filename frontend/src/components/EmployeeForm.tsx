import React from 'react';
import { Employee, Education, Experience } from '../types/employee';

interface EmployeeFormProps {
  employee?: Employee;
  isEditing: boolean;
  mode: 'view' | 'edit' | 'new';
}

export const getEmployeeFormData = (): any => {
  const form = document.getElementById('employee-form') as HTMLFormElement;
  if (!form) return null;
  
  const formData = new FormData(form);
  
  const data: any = {
    empNo: formData.get('empNo') as string,
    name: formData.get('name') as string,
    position: formData.get('position') as string,
    rank: formData.get('rank') as string,
    department: formData.get('department') as string,
    tel: formData.get('tel') as string,
    email: formData.get('email') as string,
    age: parseInt(formData.get('age') as string) || 0,
    joinDate: formData.get('joinDate') as string,
    endDate: formData.get('endDate') as string || undefined,
    monthlySalary: parseInt(formData.get('monthlySalary') as string) || 0,
    status: 'ACTIVE',
    ssn: formData.get('ssn') as string,
    bankAccount: formData.get('bankAccount') as string,
  };

  // 학력 정보 수집
  const educationRows = document.querySelectorAll('#education-container tbody tr');
  data.education = Array.from(educationRows).map(row => {
    const inputs = row.querySelectorAll('input');
    return {
      school: inputs[0]?.value || '',
      major: inputs[1]?.value || '',
      degree: inputs[2]?.value || '',
      graduationYear: new Date().getFullYear()
    };
  }).filter(edu => edu.school || edu.major || edu.degree);

  // 경력 정보 수집
  const experienceRows = document.querySelectorAll('#experience-container tbody tr');
  data.experience = Array.from(experienceRows).map(row => {
    const inputs = row.querySelectorAll('input');
    return {
      company: inputs[0]?.value || '',
      description: inputs[1]?.value || '',
      position: inputs[2]?.value || '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };
  }).filter(exp => exp.company || exp.position);

  return data;
};

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, isEditing, mode }) => {

  const addEducation = () => {
    const tbody = document.querySelector('#education-container tbody');
    const template = document.querySelector('#education-template') as HTMLTemplateElement;
    if (tbody && template) {
      tbody.appendChild(template.content.cloneNode(true));
    }
  };

  const addExperience = () => {
    const tbody = document.querySelector('#experience-container tbody');
    const template = document.querySelector('#experience-template') as HTMLTemplateElement;
    if (tbody && template) {
      tbody.appendChild(template.content.cloneNode(true));
    }
  };

  const removeRow = (button: HTMLButtonElement) => {
    button.closest('tr')?.remove();
  };

  const inputClass = `w-full px-3 py-2 border border-slate-300 rounded-md ${
    !isEditing ? 'readonly-input' : ''
  }`;

  return (
    <form id="employee-form" className="space-y-8 text-sm">
      <section>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-base">기본 정보</h3>
          {isEditing && (
            <button
              type="button"
              className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
            >
              프로필 사진 변경
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-600 mb-1">이름</label>
            <input
              type="text"
              name="name"
              defaultValue={employee?.name || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">사번</label>
            <input
              type="text"
              name="empNo"
              defaultValue={employee?.empNo || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">직급</label>
            <input
              type="text"
              name="position"
              defaultValue={employee?.position || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">직무</label>
            <input
              type="text"
              name="department"
              defaultValue={employee?.department || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">직책</label>
            <input
              type="text"
              name="rank"
              defaultValue={employee?.rank || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">전화번호</label>
            <input
              type="text"
              name="tel"
              defaultValue={employee?.tel || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">나이</label>
            <input
              type="number"
              name="age"
              defaultValue={employee?.age?.toString() || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium text-slate-600 mb-1">이메일 주소</label>
            <input
              type="email"
              name="email"
              defaultValue={employee?.email || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">주민등록번호</label>
            <input
              type="text"
              name="ssn"
              defaultValue={employee?.ssn || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">월급</label>
            <input
              type="text"
              name="monthlySalary"
              defaultValue={employee?.monthlySalary?.toString() || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">입사일</label>
            <input
              type="date"
              name="joinDate"
              defaultValue={employee?.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-medium text-slate-600 mb-1">퇴사일</label>
            <input
              type="date"
              name="endDate"
              defaultValue={employee?.endDate ? new Date(employee.endDate).toISOString().split('T')[0] : ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium text-slate-600 mb-1">계좌번호</label>
            <input
              type="text"
              name="bankAccount"
              defaultValue={employee?.bankAccount || ''}
              readOnly={!isEditing}
              className={inputClass}
            />
          </div>
        </div>
      </section>

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
        <div id="education-container" className="mt-2 border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr className="text-left">
                <th className="p-2 font-medium">학교명</th>
                <th className="p-2 font-medium">전공</th>
                <th className="p-2 font-medium">학위</th>
                {isEditing && <th className="w-12 p-2"></th>}
              </tr>
            </thead>
            <tbody>
              {employee?.education?.map((edu, index) => (
                <tr key={index} className="border-t">
                  <td className="p-1">
                    <input
                      type="text"
                      defaultValue={edu.school}
                      readOnly={!isEditing}
                      className="w-full border-0 rounded-md"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      defaultValue={edu.major}
                      readOnly={!isEditing}
                      className="w-full border-0 rounded-md"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      defaultValue={edu.degree}
                      readOnly={!isEditing}
                      className="w-full border-0 rounded-md"
                    />
                  </td>
                  {isEditing && (
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={(e) => removeRow(e.target as HTMLButtonElement)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        &times;
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <template id="education-template">
            <tr className="border-t">
              <td className="p-1">
                <input type="text" className="w-full border-0 rounded-md" />
              </td>
              <td className="p-1">
                <input type="text" className="w-full border-0 rounded-md" />
              </td>
              <td className="p-1">
                <input type="text" className="w-full border-0 rounded-md" />
              </td>
              <td className="p-1 text-center">
                <button
                  type="button"
                  onClick={(e) => removeRow(e.target as HTMLButtonElement)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  &times;
                </button>
              </td>
            </tr>
          </template>
        </div>
      </section>

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
        <div id="experience-container" className="mt-2 border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr className="text-left">
                <th className="p-2 font-medium">회사명</th>
                <th className="p-2 font-medium">직무</th>
                <th className="p-2 font-medium">직급</th>
                {isEditing && <th className="w-12 p-2"></th>}
              </tr>
            </thead>
            <tbody>
              {employee?.experience?.map((exp, index) => (
                <tr key={index} className="border-t">
                  <td className="p-1">
                    <input
                      type="text"
                      defaultValue={exp.company}
                      readOnly={!isEditing}
                      className="w-full border-0 rounded-md"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      defaultValue={exp.description}
                      readOnly={!isEditing}
                      className="w-full border-0 rounded-md"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      defaultValue={exp.position}
                      readOnly={!isEditing}
                      className="w-full border-0 rounded-md"
                    />
                  </td>
                  {isEditing && (
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={(e) => removeRow(e.target as HTMLButtonElement)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        &times;
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <template id="experience-template">
            <tr className="border-t">
              <td className="p-1">
                <input type="text" className="w-full border-0 rounded-md" />
              </td>
              <td className="p-1">
                <input type="text" className="w-full border-0 rounded-md" />
              </td>
              <td className="p-1">
                <input type="text" className="w-full border-0 rounded-md" />
              </td>
              <td className="p-1 text-center">
                <button
                  type="button"
                  onClick={(e) => removeRow(e.target as HTMLButtonElement)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  &times;
                </button>
              </td>
            </tr>
          </template>
        </div>
      </section>

    </form>
  );
};

export default EmployeeForm;