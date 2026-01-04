import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (this.redis.status !== 'ready') {
        console.warn('RedisService.set skipped (client not ready):', key);
        return;
      }
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (err) {
      console.error('RedisService.set error:', err?.message || err);
      // swallow Redis errors to avoid crashing the server
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.redis.status !== 'ready') {
        console.warn('RedisService.get skipped (client not ready):', key);
        return null;
      }
      return await this.redis.get(key);
    } catch (err) {
      console.error('RedisService.get error:', err?.message || err);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis.status !== 'ready') {
        console.warn('RedisService.del skipped (client not ready):', key);
        return;
      }
      await this.redis.del(key);
    } catch (err) {
      console.error('RedisService.del error:', err?.message || err);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.redis.status !== 'ready') {
        console.warn('RedisService.exists skipped (client not ready):', key);
        return false;
      }
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (err) {
      console.error('RedisService.exists error:', err?.message || err);
      return false;
    }
  }

  async setPresence(userId: string, status: 'online' | 'offline'): Promise<void> {
    const key = `presence:${userId}`;
    try {
      if (this.redis.status !== 'ready') {
        console.warn('RedisService.setPresence skipped (client not ready) for', userId);
        return;
      }

      if (status === 'online') {
        await this.redis.set(key, 'online', 'EX', 300); // 5 min TTL
      } else {
        await this.redis.del(key);
      }
    } catch (err) {
      console.error('RedisService.setPresence error:', err?.message || err);
    }
  }

  async getPresence(userId: string): Promise<'online' | 'offline'> {
    try {
      const exists = await this.exists(`presence:${userId}`);
      return exists ? 'online' : 'offline';
    } catch (err) {
      console.error('RedisService.getPresence error:', err?.message || err);
      return 'offline';
    }
  }

  async getAllOnlineUsers(): Promise<string[]> {
    try {
      if (this.redis.status !== 'ready') {
        console.warn('RedisService.getAllOnlineUsers skipped (client not ready)');
        return [];
      }
      const keys = await this.redis.keys('presence:*');
      return keys.map(key => key.replace('presence:', ''));
    } catch (err) {
      console.error('RedisService.getAllOnlineUsers error:', err?.message || err);
      return [];
    }
  }

  getClient(): Redis {
    return this.redis;
  }
}

