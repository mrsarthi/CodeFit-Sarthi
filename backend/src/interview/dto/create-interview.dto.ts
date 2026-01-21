import { IsString, IsOptional, IsDateString, IsArray, IsUUID, IsBoolean } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  startNow?: boolean;
}

