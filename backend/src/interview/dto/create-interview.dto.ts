import { IsString, IsOptional, IsDateString, IsArray, IsUUID } from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];
}

