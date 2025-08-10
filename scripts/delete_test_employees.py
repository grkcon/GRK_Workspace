import requests
import json

def get_all_employees():
    """모든 직원 목록 조회"""
    try:
        response = requests.get("http://localhost:3001/api/employees")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ 직원 목록 조회 실패: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ 네트워크 오류: {e}")
        return []

def delete_employee(employee_id, employee_name):
    """특정 직원 삭제"""
    try:
        response = requests.delete(f"http://localhost:3001/api/employees/{employee_id}")
        if response.status_code == 200:
            print(f"✅ 삭제 성공: {employee_name} (ID: {employee_id})")
            return True
        else:
            print(f"❌ 삭제 실패: {employee_name} (ID: {employee_id}) - {response.status_code}")
            print(f"   응답: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 삭제 오류: {employee_name} - {e}")
        return False

def main():
    print("🗑️ 테스트 직원 데이터 삭제 시작...")
    
    # 삭제할 직원 이름 목록
    target_names = ['김영희', '홍길동_수정테스트', '이철111', '이철수111']
    
    # 모든 직원 조회
    employees = get_all_employees()
    
    if not employees:
        print("❌ 직원 목록을 가져올 수 없습니다.")
        return
    
    print(f"📋 현재 등록된 직원 수: {len(employees)}명")
    
    # 삭제 대상 찾기
    targets_to_delete = []
    
    for employee in employees:
        if employee['name'] in target_names:
            targets_to_delete.append({
                'id': employee['id'],
                'name': employee['name'],
                'empNo': employee.get('empNo', 'N/A'),
                'department': employee.get('department', 'N/A')
            })
    
    if not targets_to_delete:
        print("✅ 삭제할 대상이 없습니다. 이미 정리되어 있는 것 같습니다.")
        return
    
    print(f"\n🎯 삭제 대상 {len(targets_to_delete)}명:")
    for target in targets_to_delete:
        print(f"  - {target['name']} (사번: {target['empNo']}, 부서: {target['department']}, ID: {target['id']})")
    
    # 삭제 실행
    print(f"\n🗑️ 삭제 작업 시작...")
    
    success_count = 0
    fail_count = 0
    
    for target in targets_to_delete:
        if delete_employee(target['id'], target['name']):
            success_count += 1
        else:
            fail_count += 1
    
    # 결과 요약
    print(f"\n" + "="*60)
    print(f"📊 삭제 작업 완료:")
    print(f"✅ 성공: {success_count}명")
    print(f"❌ 실패: {fail_count}명")
    
    if success_count > 0:
        print(f"\n🎉 테스트 데이터 정리가 완료되었습니다!")
        print(f"📱 프론트엔드에서 직원관리 페이지를 새로고침해서 확인해보세요.")

if __name__ == "__main__":
    main()