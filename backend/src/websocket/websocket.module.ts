import { Module } from '@nestjs/common';
import { AppWebSocketGateway, REDIS_SERVICE_TOKEN } from './websocket.gateway';
import { MockRedisService } from './mock-redis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AppWebSocketGateway,
    // Provide a token that resolves to the real RedisService when REDIS_HOST is configured,
    // otherwise fall back to the MockRedisService for local development.
    {
      provide: REDIS_SERVICE_TOKEN,
      useFactory: (configService: ConfigService, redisService: RedisService) => {
        if (!configService.get('REDIS_HOST')) {
          return new MockRedisService();
        }
        return redisService;
      },
      inject: [ConfigService, RedisService],
    },
  ],
  exports: [AppWebSocketGateway],
})
export class WebSocketModule {}

