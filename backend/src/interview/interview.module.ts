import { Module } from '@nestjs/common';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { InterviewStatusService } from './interview-status.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [InterviewController],
  providers: [InterviewService, InterviewStatusService],
  exports: [InterviewService],
})
export class InterviewModule { }

