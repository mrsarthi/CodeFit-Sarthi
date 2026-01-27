import { IsString, IsOptional, IsNumber } from 'class-validator';

export class ExecuteCodeDto {
    @IsString()
    sourceCode: string;

    @IsNumber()
    languageId: number;

    @IsOptional()
    @IsString()
    stdin?: string;
}
