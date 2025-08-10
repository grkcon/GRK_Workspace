import pandas as pd
import json
from datetime import datetime, date
import re

def extract_hr_unit_cost_data(file_path):
    """HR unit cost 시트에서 직원 정보 추출"""
    try:
        # HR unit cost 시트 읽기
        df = pd.read_excel(file_path, sheet_name='03.HR unit cost')
        
        print("📊 HR unit cost 시트 원본 데이터:")
        print(df.to_string())
        print("=" * 100)
        
        # 직원 데이터가 있는 행 찾기 (이름 컬럼이 있는 곳)
        employee_data = []
        
        # 헤더 찾기 (이름, 직급 등이 있는 행)
        header_row = None
        for idx, row in df.iterrows():
            if '이름' in str(row.iloc[0]) or any('이름' in str(cell) for cell in row if pd.notna(cell)):
                header_row = idx
                print(f"✅ 헤더 행 발견: {idx}번째 행")
                break
        
        if header_row is None:
            print("❌ 이름 헤더를 찾을 수 없습니다.")
            return []
        
        # 헤더 행의 컬럼 정보 파악
        headers = {}
        header_row_data = df.iloc[header_row]
        print(f"📋 헤더 행 데이터: {header_row_data.tolist()}")
        
        for col_idx, cell_value in enumerate(header_row_data):
            if pd.notna(cell_value):
                cell_str = str(cell_value).strip()
                print(f"컬럼 {col_idx}: '{cell_str}'")
                
                if '이름' in cell_str:
                    headers['name'] = col_idx
                elif '직급' in cell_str:
                    headers['position'] = col_idx
                elif '입사일' in cell_str:
                    headers['joinDate'] = col_idx
                elif '연봉' in cell_str:
                    headers['monthlySalary'] = col_idx
        
        print(f"📍 컬럼 매핑: {headers}")
        
        # 직원 데이터 추출 (헤더 다음 행부터)
        for idx in range(header_row + 1, len(df)):
            row = df.iloc[idx]
            
            # 이름이 있는 행만 처리
            if 'name' in headers:
                name_value = row.iloc[headers['name']]
                if pd.notna(name_value) and str(name_value).strip() and str(name_value).strip() not in ['합계', '소계', '', 'NaN']:
                    employee = {}
                    
                    # 이름
                    employee['name'] = str(name_value).strip()
                    
                    # 직급
                    if 'position' in headers:
                        position_value = row.iloc[headers['position']]
                        if pd.notna(position_value):
                            employee['position'] = str(position_value).strip()
                    
                    # 입사일
                    if 'joinDate' in headers:
                        joindate_value = row.iloc[headers['joinDate']]
                        if pd.notna(joindate_value):
                            if isinstance(joindate_value, (datetime, date)):
                                employee['joinDate'] = joindate_value.strftime('%Y-%m-%d')
                            else:
                                employee['joinDate'] = str(joindate_value).strip()
                    
                    # 연봉
                    if 'monthlySalary' in headers:
                        salary_value = row.iloc[headers['monthlySalary']]
                        if pd.notna(salary_value):
                            try:
                                # 숫자만 추출해서 월급으로 변환 (연봉 / 12)
                                if isinstance(salary_value, (int, float)):
                                    employee['monthlySalary'] = int(salary_value / 12)
                                else:
                                    cleaned = re.sub(r'[^\d]', '', str(salary_value))
                                    if cleaned:
                                        annual_salary = int(cleaned)
                                        employee['monthlySalary'] = int(annual_salary / 12)
                            except:
                                pass
                    
                    # 기본값 설정
                    set_default_values(employee)
                    
                    employee_data.append(employee)
                    print(f"✅ 직원 추출: {employee['name']}")
        
        return employee_data
        
    except Exception as e:
        print(f"❌ HR 데이터 추출 오류: {e}")
        return []

def set_default_values(employee):
    """기본값 설정"""
    if 'department' not in employee:
        employee['department'] = '일반'
    if 'position' not in employee:
        employee['position'] = '직원'
    if 'rank' not in employee:
        employee['rank'] = '사원'
    if 'tel' not in employee:
        employee['tel'] = '010-0000-0000'
    if 'email' not in employee:
        # 이름을 기반으로 이메일 생성
        name_for_email = employee['name'].replace(' ', '').lower()
        # 한글 이름을 영문으로 변환하는 간단한 방법
        employee['email'] = f"{name_for_email}@grkcon.com"
    if 'joinDate' not in employee:
        employee['joinDate'] = '2025-01-01'

def main():
    file_path = "/Users/sung/user/workspace/GRK/GRK_workspace/2025_CF_management.xlsx"
    
    print("🚀 HR unit cost 시트에서 직원 데이터 추출 시작...")
    
    # HR 데이터 추출
    employee_data = extract_hr_unit_cost_data(file_path)
    
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
    
    # 직급별 통계
    positions = {}
    for emp in employee_data:
        pos = emp.get('position', '미정')
        positions[pos] = positions.get(pos, 0) + 1
    
    print(f"📈 직급별 분포:")
    for pos, count in positions.items():
        print(f"  - {pos}: {count}명")

if __name__ == "__main__":
    main()