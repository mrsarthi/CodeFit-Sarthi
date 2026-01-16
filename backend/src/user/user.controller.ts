import { Controller, Get, UseGuards, Request, Query, Param, Patch, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  async getMe(@Request() req) {
    return this.userService.findById(req.user.id);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Request() req) {
    return this.userService.searchUsers(query, req.user.id);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get(':id/activity')
  async getUserActivity(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const end = endDate ? new Date(endDate) : new Date(); // Default: today

    return this.userService.getUserActivity(id, start, end);
  }

  @Get(':id/statistics')
  async getUserStatistics(@Param('id') id: string) {
    return this.userService.getUserStatistics(id);
  }

  @Get(':id/recent-activity')
  async getRecentActivity(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.userService.getRecentActivity(id, limitNum);
  }

  @Patch(':id')
  async updateUserProfile(
    @Param('id') id: string,
    @Body() data: {
      firstName?: string;
      lastName?: string;
      email?: string;
    },
    @Request() req,
  ) {
    // Only allow users to update their own profile or admin can update anyone
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    return this.userService.updateUserProfile(id, data);
  }
}

