import { Controller, Post, UseGuards, Request, HttpCode } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user-activity')
@UseGuards(JwtAuthGuard)
export class UserActivityController {
    constructor(private readonly userActivityService: UserActivityService) { }

    @Post('heartbeat')
    @HttpCode(200)
    async heartbeat(@Request() req) {
        await this.userActivityService.recordHeartbeat(req.user.id);
        return { success: true };
    }

    @Post('end')
    @HttpCode(200)
    async endSession(@Request() req) {
        await this.userActivityService.endSession(req.user.id);
        return { success: true };
    }
}
