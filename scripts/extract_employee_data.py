import pandas as pd
import requests
import json
from datetime import datetime, date
import re

def read_excel_file(file_path):
    """Excel 파일을 읽고 시트 정보를 확인"""
    try:
        # Excel 파일의 모든 시트 이름 확인
        excel_file = pd.ExcelFile(file_path)
        print("📊 Excel 파일의 시트 목록:")
        for i, sheet_name in enumerate(excel_file.sheet_names):
            print(f"{i+1}. {sheet_name}")
        
        # 각 시트의 데이터 미리보기
        for sheet_name in excel_file.sheet_names:
            print(f"\n📄 시트: {sheet_name}")
            df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=5)
            print(f"컬럼: {list(df.columns)}")
            print("데이터 미리보기:")
            print(df.head())
            print("-" * 80)
        
        return excel_file
    except Exception as e:
        print(f"❌ Excel 파일 읽기 오류: {e}")
        return None

def extract_employee_data(file_path):
    """Excel 파일에서 직원 정보 추출"""
    try:
        # 가능한 직원 정보가 있을 만한 시트들을 확인
        potential_sheets = ['직원', '인사', '사원', '직원명단', 'employee', 'staff']
        
        excel_file = pd.ExcelFile(file_path)
        employee_data = []
        
        for sheet_name in excel_file.sheet_names:
            print(f"\n🔍 {sheet_name} 시트 분석 중...")
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            # 직원 정보로 보이는 컬럼들을 찾기
            columns = [col.lower() for col in df.columns]
            print(f"컬럼들: {df.columns.tolist()}")
            
            # 이름 컬럼 찾기
            name_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['이름', 'name', '성명', '직원명'])]
            if name_columns:
                print(f"✅ 이름 컬럼 발견: {name_columns}")
                
                # 해당 시트의 데이터를 직원 정보로 처리
                for idx, row in df.iterrows():
                    if pd.notna(row[name_columns[0]]) and str(row[name_columns[0]]).strip():
                        employee_info = extract_employee_info_from_row(row, df.columns)
                        if employee_info:
                            employee_data.append(employee_info)
        
        return employee_data
    except Exception as e:
        print(f"❌ 직원 데이터 추출 오류: {e}")
        return []

def extract_employee_info_from_row(row, columns):
    """행에서 직원 정보 추출"""
    employee = {}
    
    # 컬럼 매핑 (Excel 컬럼명 → DB 필드명)
    column_mapping = {
        # 이름
        'name': ['이름', 'name', '성명', '직원명', '성함'],
        # 직급/직책
        'position': ['직급', 'position', '직책', '포지션', '직위'],
        'rank': ['직책', 'rank', '직급', '직위'],
        # 부서
        'department': ['부서', 'department', '팀', 'team', '소속'],
        # 연락처
        'tel': ['전화번호', 'tel', 'phone', '연락처', '휴대폰', '핸드폰'],
        'email': ['이메일', 'email', 'e-mail', '메일', '전자우편'],
        # 날짜
        'joinDate': ['입사일', '입사날짜', 'join_date', 'start_date', '시작일'],
        # 급여
        'monthlySalary': ['월급', '급여', 'salary', '월급여', '기본급'],
        # 기타
        'ssn': ['주민번호', '주민등록번호', 'ssn', '생년월일'],
        'bankAccount': ['계좌번호', '계좌', 'account', '통장번호']
    }
    
    # 각 필드별로 해당하는 컬럼 찾아서 값 추출
    for field, possible_columns in column_mapping.items():
        for col in columns:
            if any(keyword in col.lower() for keyword in possible_columns):
                value = row[col]
                if pd.notna(value) and str(value).strip():
                    employee[field] = clean_value(str(value).strip(), field)
                break
    
    # 필수 필드 확인
    if 'name' in employee and employee['name']:
        # 기본값 설정
        if 'department' not in employee:
            employee['department'] = '미정'
        if 'position' not in employee:
            employee['position'] = '직원'
        if 'rank' not in employee:
            employee['rank'] = '사원'
        if 'tel' not in employee:
            employee['tel'] = '010-0000-0000'
        if 'email' not in employee:
            employee['email'] = f"{employee['name'].replace(' ', '').lower()}@grkcon.com"
        if 'joinDate' not in employee:
            employee['joinDate'] = '2025-01-01'
        
        return employee
    
    return None

def clean_value(value, field_type):
    """값 정리 및 형식 맞추기"""
    if field_type == 'tel':
        # 전화번호 형식 정리
        cleaned = re.sub(r'[^\d]', '', value)
        if len(cleaned) == 11:
            return f"{cleaned[:3]}-{cleaned[3:7]}-{cleaned[7:]}"
        elif len(cleaned) == 10:
            return f"{cleaned[:3]}-{cleaned[3:6]}-{cleaned[6:]}"
        return value
    
    elif field_type == 'email':
        # 이메일 형식 확인
        if '@' in value:
            return value.lower()
        return value
    
    elif field_type == 'joinDate':
        # 날짜 형식 변환
        try:
            if isinstance(value, (datetime, date)):
                return value.strftime('%Y-%m-%d')
            elif '/' in value:
                parts = value.split('/')
                if len(parts) == 3:
                    return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
            elif '-' in value:
                return value
        except:
            pass
        return '2025-01-01'
    
    elif field_type == 'monthlySalary':
        # 숫자만 추출
        cleaned = re.sub(r'[^\d]', '', str(value))
        return int(cleaned) if cleaned else None
    
    return value

def send_to_backend(employee_data):
    """백엔드 API로 직원 데이터 전송"""
    backend_url = "http://localhost:3001/api/employees"
    
    successful_adds = []
    failed_adds = []
    
    for i, employee in enumerate(employee_data):
        try:
            print(f"\n👤 {i+1}/{len(employee_data)} - {employee.get('name', 'Unknown')} 추가 중...")
            
            response = requests.post(
                backend_url, 
                json=employee,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                print(f"✅ 성공: {employee['name']}")
                successful_adds.append(employee['name'])
            else:
                print(f"❌ 실패: {employee['name']} - {response.status_code}")
                print(f"   오류 내용: {response.text}")
                failed_adds.append((employee['name'], response.text))
                
        except Exception as e:
            print(f"❌ 네트워크 오류: {employee['name']} - {e}")
            failed_adds.append((employee['name'], str(e)))
    
    # 결과 요약
    print(f"\n📊 결과 요약:")
    print(f"✅ 성공: {len(successful_adds)}명")
    print(f"❌ 실패: {len(failed_adds)}명")
    
    if failed_adds:
        print(f"\n실패한 직원들:")
        for name, error in failed_adds:
            print(f"  - {name}: {error}")

def main():
    file_path = "/Users/sung/user/workspace/GRK/GRK_workspace/2025_CF_management.xlsx"
    
    print("🚀 Excel 파일에서 직원 데이터 추출 시작...")
    
    # 1. Excel 파일 분석
    excel_file = read_excel_file(file_path)
    if not excel_file:
        return
    
    # 2. 직원 데이터 추출
    employee_data = extract_employee_data(file_path)
    
    if not employee_data:
        print("❌ 직원 데이터를 찾을 수 없습니다.")
        return
    
    print(f"\n📋 추출된 직원 데이터: {len(employee_data)}명")
    
    # 3. 데이터 미리보기
    print("\n🔍 추출된 데이터 미리보기:")
    for i, emp in enumerate(employee_data[:3]):  # 처음 3명만 보기
        print(f"{i+1}. {json.dumps(emp, ensure_ascii=False, indent=2)}")
    
    # 4. 사용자 확인
    if len(employee_data) > 3:
        print(f"... (총 {len(employee_data)}명)")
    
    confirm = input(f"\n백엔드에 {len(employee_data)}명의 직원 데이터를 추가하시겠습니까? (y/n): ")
    
    if confirm.lower() == 'y':
        send_to_backend(employee_data)
    else:
        print("취소되었습니다.")

if __name__ == "__main__":
    main()