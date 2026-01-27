import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CodeExecutionService } from './code-execution.service';
import { CodeExecutionController } from './code-execution.controller';

@Module({
    imports: [ConfigModule],
    controllers: [CodeExecutionController],
    providers: [CodeExecutionService],
    exports: [CodeExecutionService],
})
export class CodeExecutionModule { }
