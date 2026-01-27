import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { CodeExecutionService } from './code-execution.service';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('code')
@UseGuards(JwtAuthGuard)
export class CodeExecutionController {
    constructor(private readonly codeExecutionService: CodeExecutionService) { }

    @Post('execute')
    async executeCode(@Body() dto: ExecuteCodeDto) {
        return this.codeExecutionService.executeCode(dto);
    }

    @Get('languages')
    getLanguages() {
        return this.codeExecutionService.getLanguages();
    }
}
