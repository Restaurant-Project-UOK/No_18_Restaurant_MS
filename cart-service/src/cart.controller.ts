import { CartService } from './cart.service';
import { Controller, Delete, Get, Headers, HttpException, HttpStatus } from '@nestjs/common';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Delete('user-items')
  async deleteUserItems(
    @Headers('table-id') tableId: string,
    @Headers('user-id') userId: string,
  ) {
    if (!tableId || !userId) {
      throw new HttpException('Missing table-id or user-id header', HttpStatus.BAD_REQUEST);
    }
    await this.cartService.deleteUserItems(tableId, userId);
    return { message: 'User items deleted successfully' };
  }

  @Get('user-items')
  async getUserItems(
    @Headers('table-id') tableId: string,
    @Headers('user-id') userId: string,
  ) {
    if (!tableId || !userId) {
      throw new HttpException('Missing table-id or user-id header', HttpStatus.BAD_REQUEST);
    }
    return await this.cartService.getUserItems(tableId, userId);
  }
}
