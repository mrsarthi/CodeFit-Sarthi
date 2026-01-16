import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { InterviewModule } from './interview/interview.module';
import { FriendModule } from './friend/friend.module';
import { WebSocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma/prisma.module';
// import { RedisModule } from './redis/redis.module'; // Temporarily disabled
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    // RedisModule, // Temporarily disabled - enable after installing Redis
    AuthModule,
    UserModule,
    InterviewModule,
    FriendModule,
    WebSocketModule,
    MailModule,
  ],
})
export class AppModule { }

