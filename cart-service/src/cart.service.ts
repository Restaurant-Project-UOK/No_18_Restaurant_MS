import { Injectable } from '@nestjs/common';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';

@Injectable()
export class CartService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async deleteUserItems(tableId: string, userId: string): Promise<void> {
    const key = `cart:${tableId}:${userId}`;
    await this.redis.del(key);
  }

  async getUserItems(tableId: string, userId: string): Promise<any> {
    const key = `cart:${tableId}:${userId}`;
    const items = await this.redis.get(key);
    return items ? JSON.parse(items) : [];
  }
}
