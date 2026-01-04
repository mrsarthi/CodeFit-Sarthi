import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@Request() req) {
    return this.userService.findById(req.user.id);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Request() req) {
    return this.userService.searchUsers(query, req.user.id);
  }
}

