import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) { }

  @Post()
  async create(@Body() createInterviewDto: CreateInterviewDto, @Request() req) {
    return this.interviewService.create(req.user.id, createInterviewDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.interviewService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.interviewService.findOne(id, req.user.id);
  }

  @Patch(':id/start')
  async start(@Param('id') id: string, @Request() req) {
    return this.interviewService.start(id, req.user.id);
  }

  @Patch(':id/end')
  async end(@Param('id') id: string, @Request() req) {
    return this.interviewService.end(id, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.interviewService.delete(id, req.user.id);
  }
}

