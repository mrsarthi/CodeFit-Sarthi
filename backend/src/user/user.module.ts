import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserActivityService } from './user-activity.service';
import { UserActivityController } from './user-activity.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController, UserActivityController],
  providers: [UserService, UserActivityService],
  exports: [UserService, UserActivityService],
})
export class UserModule { }

