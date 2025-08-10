import pandas as pd
import json
from datetime import datetime, date
import re

def read_and_preview_excel(file_path):
    """Excel 파일을 읽고 직원 데이터만 미리보기"""
    try:
        # Excel 파일의 모든 시트 이름 확인
        excel_file = pd.ExcelFile(file_path)
        print("📊 Excel 파일의 시트 목록:")
        for i, sheet_name in enumerate(excel_file.sheet_names):
            print(f"{i+1}. {sheet_name}")
        
        # 각 시트의 데이터 미리보기
        all_employee_data = []
        
        for sheet_name in excel_file.sheet_names:
            print(f"\n📄 시트: {sheet_name}")
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            print(f"컬럼: {list(df.columns)}")
            print(f"데이터 행 수: {len(df)}")
            
            # 처음 5행 데이터 보기
            print("데이터 미리보기:")
            print(df.head().to_string())
            
            # 직원 정보로 보이는 데이터 추출 시도
            employee_data = extract_employee_data_from_sheet(df, sheet_name)
            if employee_data:
                all_employee_data.extend(employee_data)
                print(f"✅ {len(employee_data)}명의 직원 정보 발견")
            
            print("-" * 100)
        
        return all_employee_data
        
    except Exception as e:
        print(f"❌ Excel 파일 읽기 오류: {e}")
        return []

def extract_employee_data_from_sheet(df, sheet_name):
    """시트에서 직원 정보 추출"""
    employee_data = []
    
    # 이름 컬럼 찾기
    name_columns = [col for col in df.columns if any(keyword in str(col).lower() for keyword in ['이름', 'name', '성명', '직원명', '성함'])]
    
    if not name_columns:
        print(f"❌ {sheet_name}에서 이름 컬럼을 찾을 수 없습니다.")
        return []
    
    print(f"✅ 이름 컬럼 발견: {name_columns[0]}")
    
    # 컬럼 매핑 정의
    column_mapping = {
        'name': ['이름', 'name', '성명', '직원명', '성함'],
        'position': ['직급', 'position', '직책', '포지션', '직위'],
        'rank': ['직책', 'rank', '급수', '직무급'],
        'department': ['부서', 'department', '팀', 'team', '소속', '사업부'],
        'tel': ['전화번호', 'tel', 'phone', '연락처', '휴대폰', '핸드폰', '전화'],
        'email': ['이메일', 'email', 'e-mail', '메일', '전자우편'],
        'joinDate': ['입사일', '입사날짜', 'join_date', 'start_date', '시작일', '입사연월일'],
        'monthlySalary': ['월급', '급여', 'salary', '월급여', '기본급', '월봉'],
        'ssn': ['주민번호', '주민등록번호', 'ssn', '생년월일'],
        'bankAccount': ['계좌번호', '계좌', 'account', '통장번호'],
        'age': ['나이', 'age', '연령']
    }
    
    # 각 행을 직원으로 처리
    for idx, row in df.iterrows():
        name_value = row[name_columns[0]]
        
        # 이름이 있는 경우에만 처리
        if pd.notna(name_value) and str(name_value).strip() and str(name_value).strip() != '':
            employee = {}
            
            # 각 필드별로 해당하는 컬럼 찾아서 값 추출
            for field, possible_columns in column_mapping.items():
                found_value = None
                found_column = None
                
                for col in df.columns:
                    col_lower = str(col).lower()
                    if any(keyword in col_lower for keyword in possible_columns):
                        value = row[col]
                        if pd.notna(value) and str(value).strip():
                            found_value = clean_and_format_value(str(value).strip(), field)
                            found_column = col
                            break
                
                if found_value is not None:
                    employee[field] = found_value
            
            # 이름은 필수
            if 'name' not in employee:
                employee['name'] = str(name_value).strip()
            
            # 기본값 설정
            set_default_values(employee)
            
            employee_data.append(employee)
    
    return employee_data

def clean_and_format_value(value, field_type):
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
        if '@' in value and '.' in value:
            return value.lower()
        return None
    
    elif field_type == 'joinDate':
        # 날짜 형식 변환
        try:
            if isinstance(value, (datetime, date)):
                return value.strftime('%Y-%m-%d')
            elif '/' in value:
                parts = value.split('/')
                if len(parts) == 3:
                    year, month, day = parts[0], parts[1], parts[2]
                    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            elif '-' in value and len(value) >= 8:
                return value[:10]  # YYYY-MM-DD 형태로 자르기
        except:
            pass
        return None
    
    elif field_type == 'monthlySalary':
        # 숫자만 추출
        cleaned = re.sub(r'[^\d]', '', str(value))
        return int(cleaned) if cleaned else None
    
    elif field_type == 'age':
        # 나이 숫자만 추출
        cleaned = re.sub(r'[^\d]', '', str(value))
        return int(cleaned) if cleaned and int(cleaned) > 0 and int(cleaned) < 100 else None
    
    return value

def set_default_values(employee):
    """기본값 설정"""
    if 'department' not in employee or not employee['department']:
        employee['department'] = '일반'
    if 'position' not in employee or not employee['position']:
        employee['position'] = '직원'
    if 'rank' not in employee or not employee['rank']:
        employee['rank'] = '사원'
    if 'tel' not in employee or not employee['tel']:
        employee['tel'] = '010-0000-0000'
    if 'email' not in employee or not employee['email']:
        # 이름을 기반으로 이메일 생성
        name_for_email = employee['name'].replace(' ', '').lower()
        employee['email'] = f"{name_for_email}@grkcon.com"
    if 'joinDate' not in employee or not employee['joinDate']:
        employee['joinDate'] = '2025-01-01'

def main():
    file_path = "/Users/sung/user/workspace/GRK/GRK_workspace/2025_CF_management.xlsx"
    
    print("🚀 Excel 파일에서 직원 데이터 미리보기 시작...")
    
    # Excel 파일 분석 및 직원 데이터 추출
    employee_data = read_and_preview_excel(file_path)
    
    if not employee_data:
        print("❌ 직원 데이터를 찾을 수 없습니다.")
        return
    
    print(f"\n🎉 총 {len(employee_data)}명의 직원 정보를 발견했습니다!")
    print("=" * 100)
    
    # 모든 직원 데이터 출력
    for i, emp in enumerate(employee_data):
        print(f"\n👤 {i+1}번째 직원:")
        print(json.dumps(emp, ensure_ascii=False, indent=2))
        print("-" * 50)
    
    print(f"\n📊 요약:")
    print(f"✅ 총 직원 수: {len(employee_data)}명")
    
    # 부서별 통계
    departments = {}
    for emp in employee_data:
        dept = emp.get('department', '미정')
        departments[dept] = departments.get(dept, 0) + 1
    
    print(f"📈 부서별 분포:")
    for dept, count in departments.items():
        print(f"  - {dept}: {count}명")

if __name__ == "__main__":
    main()