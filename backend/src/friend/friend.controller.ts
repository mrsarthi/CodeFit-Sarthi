import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request/:receiverId')
  async sendFriendRequest(@Param('receiverId') receiverId: string, @Request() req) {
    return this.friendService.sendFriendRequest(req.user.id, receiverId);
  }

  @Get('requests')
  async getFriendRequests(@Request() req) {
    return this.friendService.getFriendRequests(req.user.id);
  }

  @Patch('request/:requestId/accept')
  async acceptFriendRequest(@Param('requestId') requestId: string, @Request() req) {
    return this.friendService.acceptFriendRequest(requestId, req.user.id);
  }

  @Patch('request/:requestId/reject')
  async rejectFriendRequest(@Param('requestId') requestId: string, @Request() req) {
    return this.friendService.rejectFriendRequest(requestId, req.user.id);
  }

  @Get()
  async getFriends(@Request() req) {
    return this.friendService.getFriends(req.user.id);
  }
}

