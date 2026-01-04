import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:3000';

  // Enable Socket.IO adapter. If Redis is configured, attempt to use the Redis adapter so broadcasts
  // propagate across multiple backend instances. Otherwise fall back to the default adapter.
  const redisHost = configService.get('REDIS_HOST');
  if (redisHost) {
    // Prefer using the provider-managed Redis client if available
    const providerClient: Redis | undefined = app.get('REDIS_CLIENT');

    // Helper to connect with a timeout
    const connectWithTimeout = async (client: any, timeoutMs = 3000) => {
      // Only attempt connect if not already connecting/ready
      if (client.status === 'ready' || client.status === 'connecting') return;
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
      }, timeoutMs);
      try {
        await client.connect();
        if (timedOut) throw new Error('Redis connect timed out');
      } finally {
        clearTimeout(timer);
      }
    };

    let redisAdapterInitialized = false;
    let subClient: any | null = null;

    try {
      if (!providerClient) {
        throw new Error('REDIS_CLIENT provider not found');
      }

      // Attach error handlers (safe to attach multiple times)
      providerClient.on('error', (err: any) => {
        console.error('Main: REDIS_CLIENT error:', err?.message || err);
      });

      // Try to connect provider client with a short timeout.
      await connectWithTimeout(providerClient, 3000);

      // Duplicate and connect the subscriber (lazy duplicate does not auto-connect)
      subClient = providerClient.duplicate();
      subClient.on('error', (err: any) => {
        console.error('Main: Redis subClient error:', err?.message || err);
      });
      await connectWithTimeout(subClient, 3000);

      class RedisIoAdapter extends IoAdapter {
        createIOServer(port?: number, options?: any) {
          const server = super.createIOServer(port, options);
          server.adapter(createAdapter(providerClient as any, subClient as any));
          return server;
        }
      }

      app.useWebSocketAdapter(new RedisIoAdapter(app));
      redisAdapterInitialized = true;
      console.log('Main: Redis adapter initialized for Socket.IO (using provider client)');
    } catch (err) {
      console.warn('Main: Failed to initialize Redis adapter, falling back to default IoAdapter:', err?.message || err);

      // Fallback adapter
      app.useWebSocketAdapter(new IoAdapter(app));

      // Clean up subscriber if partially connected
      try {
        if (subClient) await subClient.disconnect();
      } catch (_) {}
    }
  } else {
    app.useWebSocketAdapter(new IoAdapter(app));
  }

  // Enable CORS for both HTTP and WebSocket
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${port}`);
}

bootstrap();

