import { Module, DynamicModule, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YearlyOpex, MonthlyOpex, OpexItem } from '../../entities';
import { OpexService } from './services/opex.service';
import { OpexController } from './controllers/opex.controller';
import { OpexDebugController } from './controllers/opex-debug.controller';
import { EmployeeModule } from '../employee/employee.module';

@Module({})
export class OpexModule {
  static forRoot(): DynamicModule {
    const controllers: any[] = [OpexController];

    // 개발 환경에서만 디버그 컨트롤러 추가
    if (process.env.NODE_ENV !== 'production') {
      controllers.push(OpexDebugController);
    }

    return {
      module: OpexModule,
      imports: [
        TypeOrmModule.forFeature([YearlyOpex, MonthlyOpex, OpexItem]),
        forwardRef(() => EmployeeModule),
      ],
      controllers,
      providers: [OpexService],
      exports: [OpexService],
    };
  }
}
