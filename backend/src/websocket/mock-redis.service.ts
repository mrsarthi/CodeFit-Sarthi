import { Injectable } from '@nestjs/common';

@Injectable()
export class MockRedisService {
  async set(key: string, value: string, ttl?: number): Promise<void> {
    // Mock implementation - does nothing
    console.log(`Mock Redis: set(${key}, ${value}, ${ttl})`);
  }

  async get(key: string): Promise<string | null> {
    // Mock implementation - returns null
    console.log(`Mock Redis: get(${key})`);
    return null;
  }

  async del(key: string): Promise<void> {
    // Mock implementation - does nothing
    console.log(`Mock Redis: del(${key})`);
  }

  async exists(key: string): Promise<boolean> {
    // Mock implementation - returns false
    console.log(`Mock Redis: exists(${key})`);
    return false;
  }

  async setPresence(userId: string, status: 'online' | 'offline'): Promise<void> {
    // Mock implementation - does nothing
    console.log(`Mock Redis: setPresence(${userId}, ${status})`);
  }

  async getPresence(userId: string): Promise<'online' | 'offline'> {
    // Mock implementation - returns offline
    console.log(`Mock Redis: getPresence(${userId})`);
    return 'offline';
  }

  async getAllOnlineUsers(): Promise<string[]> {
    // Mock implementation - returns empty array
    console.log(`Mock Redis: getAllOnlineUsers()`);
    return [];
  }

  getClient() {
    // Mock implementation - returns null
    console.log(`Mock Redis: getClient()`);
    return null;
  }
}

