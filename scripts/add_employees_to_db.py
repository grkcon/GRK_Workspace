import pandas as pd
import requests
import json
from datetime import datetime, date
import re

def extract_real_employees(file_path):
    """실제 직원만 추출 (직급 템플릿 제외)"""
    try:
        df = pd.read_excel(file_path, sheet_name='03.HR unit cost')
        
        print("🚀 실제 직원 데이터만 추출 중...")
        
        # 헤더 찾기
        header_row = 2  # 이미 확인한 헤더 위치
        
        # 컬럼 매핑
        headers = {
            'name': 1,
            'position': 2, 
            'joinDate': 4,
            'monthlySalary': 7
        }
        
        # 실제 직원만 추출 (직급 템플릿 제외)
        real_employees = []
        exclude_names = ['합계', '소계', 'Manager', 'Associate', 'SBA', 'BA', 'RA']
        
        for idx in range(header_row + 1, len(df)):
            row = df.iloc[idx]
            name_value = row.iloc[headers['name']]
            
            if (pd.notna(name_value) and 
                str(name_value).strip() and 
                str(name_value).strip() not in exclude_names):
                
                employee = {}
                
                # 이름
                employee['name'] = str(name_value).strip()
                
                # 직급
                position_value = row.iloc[headers['position']]
                if pd.notna(position_value):
                    employee['position'] = str(position_value).strip()
                else:
                    employee['position'] = '직원'
                
                # 입사일
                joindate_value = row.iloc[headers['joinDate']]
                if pd.notna(joindate_value):
                    if isinstance(joindate_value, (datetime, date)):
                        employee['joinDate'] = joindate_value.strftime('%Y-%m-%d')
                    else:
                        employee['joinDate'] = str(joindate_value)[:10]
                else:
                    employee['joinDate'] = '2025-01-01'
                
                # 연봉 → 월급 변환
                salary_value = row.iloc[headers['monthlySalary']]
                if pd.notna(salary_value):
                    try:
                        if isinstance(salary_value, (int, float)):
                            employee['monthlySalary'] = int(salary_value / 12)
                        else:
                            cleaned = re.sub(r'[^\d]', '', str(salary_value))
                            if cleaned:
                                annual_salary = int(cleaned)
                                employee['monthlySalary'] = int(annual_salary / 12)
                    except:
                        employee['monthlySalary'] = 3000000  # 기본값
                else:
                    employee['monthlySalary'] = 3000000
                
                # 기본값 설정
                employee['department'] = map_department(employee['position'])
                employee['rank'] = map_rank(employee['position'])
                employee['tel'] = generate_phone_number(employee['name'])
                employee['email'] = generate_email(employee['name'])
                
                real_employees.append(employee)
                print(f"✅ 추가 대상: {employee['name']} ({employee['position']})")
        
        return real_employees
        
    except Exception as e:
        print(f"❌ 직원 데이터 추출 오류: {e}")
        return []

def map_department(position):
    """직급에 따른 부서 매핑"""
    if position in ['EP']:
        return '경영진'
    elif position in ['PR']:
        return '프로젝트관리팀'  
    elif position in ['ACC']:
        return '회계팀'
    elif position in ['BA', 'SBA']:
        return '분석팀'
    elif position in ['Manager']:
        return '관리팀'
    else:
        return '일반'

def map_rank(position):
    """직급에 따른 직책 매핑"""
    if position == 'EP':
        return '임원'
    elif position == 'PR':
        return '프로젝트매니저'
    elif position in ['Manager']:
        return '매니저'  
    elif position in ['SBA']:
        return '선임'
    elif position in ['BA', 'ACC']:
        return '사원'
    else:
        return '사원'

def generate_phone_number(name):
    """이름을 기반으로 가상의 전화번호 생성"""
    # 간단한 해시를 이용해서 고유한 번호 생성
    hash_val = hash(name) % 10000
    return f"010-{hash_val:04d}-{(hash_val * 13) % 10000:04d}"

def generate_email(name):
    """이름을 기반으로 영문 이메일 생성"""
    # 한글 이름을 영문으로 변환하는 간단한 매핑
    name_mapping = {
        '윤승현': 'yoonsh',
        '김낙범': 'kimnb', 
        '박영훈': 'parkyh',
        '유원선': 'yoows',
        '임하늬': 'limhn',
        '조윤상': 'joys',
        '딜라라': 'dilara',
        '김양지': 'kimyj',
        '김성배': 'kimsb',
        '엘리자베타': 'elizaveta',
        '김민지': 'kimmj'
    }
    
    english_name = name_mapping.get(name, name.lower().replace(' ', ''))
    return f"{english_name}@grkcon.com"

def send_to_backend(employee_data):
    """백엔드 API로 직원 데이터 전송"""
    backend_url = "http://localhost:3001/api/employees"
    
    successful_adds = []
    failed_adds = []
    
    print(f"\n🚀 백엔드 서버({backend_url})로 직원 데이터 전송 시작...")
    
    for i, employee in enumerate(employee_data):
        try:
            print(f"\n👤 {i+1}/{len(employee_data)} - {employee['name']} 추가 중...")
            print(f"   데이터: {json.dumps(employee, ensure_ascii=False)}")
            
            response = requests.post(
                backend_url, 
                json=employee,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 201:
                print(f"✅ 성공: {employee['name']}")
                successful_adds.append(employee['name'])
            else:
                print(f"❌ 실패: {employee['name']} - HTTP {response.status_code}")
                print(f"   응답: {response.text}")
                failed_adds.append((employee['name'], f"HTTP {response.status_code}: {response.text}"))
                
        except requests.exceptions.ConnectionError:
            print(f"❌ 연결 오류: 백엔드 서버가 실행 중인지 확인하세요 (http://localhost:3001)")
            failed_adds.append((employee['name'], "백엔드 서버 연결 실패"))
        except Exception as e:
            print(f"❌ 네트워크 오류: {employee['name']} - {e}")
            failed_adds.append((employee['name'], str(e)))
    
    # 결과 요약
    print(f"\n" + "="*80)
    print(f"📊 결과 요약:")
    print(f"✅ 성공: {len(successful_adds)}명")
    print(f"❌ 실패: {len(failed_adds)}명")
    
    if successful_adds:
        print(f"\n✅ 성공한 직원들:")
        for name in successful_adds:
            print(f"  - {name}")
    
    if failed_adds:
        print(f"\n❌ 실패한 직원들:")
        for name, error in failed_adds:
            print(f"  - {name}: {error}")

def main():
    file_path = "/Users/sung/user/workspace/GRK/GRK_workspace/2025_CF_management.xlsx"
    
    print("🚀 Excel 파일에서 실제 직원 데이터 추출 및 DB 추가 시작...")
    
    # 실제 직원 데이터만 추출
    employee_data = extract_real_employees(file_path)
    
    if not employee_data:
        print("❌ 추가할 직원 데이터를 찾을 수 없습니다.")
        return
    
    print(f"\n📋 추출된 실제 직원: {len(employee_data)}명")
    print("="*80)
    
    # 데이터 미리보기
    for i, emp in enumerate(employee_data):
        print(f"\n👤 {i+1}. {emp['name']}")
        print(f"   직급: {emp['position']} | 부서: {emp['department']} | 직책: {emp['rank']}")
        print(f"   입사일: {emp['joinDate']} | 월급: {emp['monthlySalary']:,}원")
        print(f"   전화: {emp['tel']} | 이메일: {emp['email']}")
    
    # 바로 DB에 추가
    print("="*80)
    print(f"\n🚀 백엔드 DB에 {len(employee_data)}명의 직원 데이터를 추가합니다...")
    
    send_to_backend(employee_data)
    print(f"\n🎉 직원 데이터 추가 작업이 완료되었습니다!")
    print(f"📱 프론트엔드에서 직원관리 페이지를 확인해보세요!")

if __name__ == "__main__":
    main()