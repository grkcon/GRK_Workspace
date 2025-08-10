import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { PPEService } from '../services/ppe.service';
import { CreatePPEDto } from '../dto/create-ppe.dto';
import { UpdatePPEDto } from '../dto/update-ppe.dto';

@Controller('ppe')
export class PPEController {
  constructor(private readonly ppeService: PPEService) {}

  @Post('project/:projectId')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createPPEDto: CreatePPEDto,
  ) {
    return this.ppeService.create(projectId, createPPEDto);
  }

  @Get()
  findAll() {
    return this.ppeService.findAll();
  }

  @Get('summary')
  getProjectSummary() {
    return this.ppeService.getProjectSummary();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ppeService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.ppeService.findByProjectId(projectId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePPEDto: UpdatePPEDto,
  ) {
    return this.ppeService.update(id, updatePPEDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ppeService.remove(id);
  }
}