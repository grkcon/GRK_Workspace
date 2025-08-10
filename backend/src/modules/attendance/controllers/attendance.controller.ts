import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from '../dto';
import { RequestStatus } from '../../../entities';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('leave-requests')
  @ApiOperation({ summary: 'Create a new leave request' })
  @ApiResponse({ status: 201, description: 'Leave request created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() createLeaveRequestDto: CreateLeaveRequestDto) {
    return this.attendanceService.create(createLeaveRequestDto);
  }

  @Get('leave-requests')
  @ApiOperation({ summary: 'Get all leave requests' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Return all leave requests.' })
  findAllLeaveRequests(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: RequestStatus,
  ) {
    if (employeeId) {
      return this.attendanceService.findByEmployee(parseInt(employeeId));
    }
    if (status) {
      return this.attendanceService.findByStatus(status);
    }
    return this.attendanceService.findAll();
  }

  @Get('leave-requests/:id')
  @ApiOperation({ summary: 'Get leave request by ID' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiResponse({ status: 200, description: 'Return the leave request.' })
  @ApiResponse({ status: 404, description: 'Leave request not found.' })
  findOneLeaveRequest(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOne(id);
  }

  @Patch('leave-requests/:id')
  @ApiOperation({ summary: 'Update leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiResponse({ status: 200, description: 'Leave request updated successfully.' })
  @ApiResponse({ status: 404, description: 'Leave request not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
  ) {
    return this.attendanceService.update(id, updateLeaveRequestDto);
  }

  @Delete('leave-requests/:id')
  @ApiOperation({ summary: 'Delete leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiResponse({ status: 200, description: 'Leave request deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Leave request not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.remove(id);
  }

  @Patch('leave-requests/:id/approve')
  @ApiOperation({ summary: 'Approve leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiResponse({ status: 200, description: 'Leave request approved successfully.' })
  @ApiResponse({ status: 404, description: 'Leave request not found.' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body('approver') approver: string,
  ) {
    return this.attendanceService.approveRequest(id, approver);
  }

  @Patch('leave-requests/:id/reject')
  @ApiOperation({ summary: 'Reject leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiResponse({ status: 200, description: 'Leave request rejected successfully.' })
  @ApiResponse({ status: 404, description: 'Leave request not found.' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('rejectReason') rejectReason: string,
  ) {
    return this.attendanceService.rejectRequest(id, rejectReason);
  }

  @Get('leave-balance/:employeeId')
  @ApiOperation({ summary: 'Get leave balance for employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Return leave balance.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  getLeaveBalance(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.attendanceService.getLeaveBalance(employeeId);
  }
}