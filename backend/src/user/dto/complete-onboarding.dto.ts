import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CompleteOnboardingDto {
    @IsNotEmpty()
    @IsString()
    @IsIn(['JOB_SEEKER', 'INTERVIEWER'])
    role: 'JOB_SEEKER' | 'INTERVIEWER';
}
