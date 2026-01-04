import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(String(configService.get('REDIS_PORT') || 6379), 10),
          password: configService.get('REDIS_PASSWORD') || undefined,
          // Fail fast and avoid queuing commands when Redis is down
          maxRetriesPerRequest: 0,
          enableOfflineQueue: false,
          // Do not connect automatically at module init so missing Redis won't cause crash during boot
          lazyConnect: true,
          // Throttle reconnect attempts to avoid flooding logs and connection storms when Redis is unreachable
          retryStrategy: (retries: number) => {
            if (retries > 5) return null; // stop reconnect after some attempts
            return Math.min(1000 * retries, 30000);
          },
          connectTimeout: 3000,
        });

        // Attach lifecycle/error handlers early to avoid unhandled exceptions
        client.on('error', (err) => {
          console.error('Redis client error:', err?.message || err);
        });
        client.on('ready', () => {
          console.log('Redis client ready');
        });
        client.on('close', () => {
          console.warn('Redis client connection closed');
        });

        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}

