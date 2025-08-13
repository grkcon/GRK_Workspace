import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EmployeeService } from './modules/employee/services/employee.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const employeeService = app.get(EmployeeService);

  try {
    // 기존 직원 확인
    const employees = await employeeService.findAll();

    if (employees.length === 0) {
      console.log('Creating seed data...');

      // 테스트 직원 데이터 생성
      await employeeService.create({
        empNo: 'GRK-001',
        name: '홍길동',
        position: 'Manager',
        rank: '팀장',
        department: 'Engineering',
        tel: '010-1234-5678',
        email: 'hong@grk.com',
        joinDate: '2020-01-15',
        monthlySalary: 5000000,
        status: 'ACTIVE',
        education: [
          {
            degree: '학사',
            major: '컴퓨터공학',
            school: '서울대학교',
          },
        ],
        experience: [
          {
            company: '삼성전자',
            department: 'SW개발팀',
            position: '선임연구원',
          },
        ],
      });

      await employeeService.create({
        empNo: 'GRK-002',
        name: '김영희',
        position: 'Developer',
        rank: '대리',
        department: 'Engineering',
        tel: '010-2345-6789',
        email: 'kim@grk.com',
        joinDate: '2021-03-01',
        monthlySalary: 3500000,
        status: 'ACTIVE',
      });

      await employeeService.create({
        empNo: 'GRK-003',
        name: '이철수',
        position: 'Designer',
        rank: '사원',
        department: 'Design',
        tel: '010-3456-7890',
        email: 'lee@grk.com',
        joinDate: '2022-06-01',
        monthlySalary: 3000000,
        status: 'ON_LEAVE',
      });

      console.log('Seed data created successfully!');
    } else {
      console.log(
        `Found ${employees.length} existing employees. Skipping seed.`,
      );
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await app.close();
  }
}

seed();
