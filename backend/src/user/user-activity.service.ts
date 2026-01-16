import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserActivityService {
    constructor(private prisma: PrismaService) { }

    async recordHeartbeat(userId: string): Promise<void> {
        // Find the most recent session WITHOUT a duration (active session)
        const activeSession = await this.prisma.userActivity.findFirst({
            where: {
                userId,
                duration: null  // Only find sessions that aren't closed
            },
            orderBy: { startTime: 'desc' },
        });

        const now = new Date();
        const twoMinutes = 2 * 60 * 1000;

        if (activeSession) {
            // Check time since last update
            const lastUpdate = activeSession.endTime || activeSession.startTime;
            const timeSinceLastUpdate = now.getTime() - new Date(lastUpdate).getTime();

            console.log(`[Heartbeat] User: ${userId}, Time since last update: ${Math.floor(timeSinceLastUpdate / 1000)}s`);

            if (timeSinceLastUpdate < twoMinutes) {
                // Session is still active, just update endTime (DON'T set duration)
                await this.prisma.userActivity.update({
                    where: { id: activeSession.id },
                    data: { endTime: now },
                });
                const currentDuration = Math.floor((now.getTime() - new Date(activeSession.startTime).getTime()) / 1000);
                console.log(`[Heartbeat] Updated existing session: ${activeSession.id}, current duration: ${currentDuration}s`);
            } else {
                // Session expired, close it with final duration and start new one
                const sessionDuration = Math.floor(
                    (new Date(lastUpdate).getTime() - new Date(activeSession.startTime).getTime()) / 1000
                );
                await this.prisma.userActivity.update({
                    where: { id: activeSession.id },
                    data: {
                        endTime: lastUpdate,
                        duration: sessionDuration
                    },
                });
                console.log(`[Heartbeat] Closed expired session: ${activeSession.id}, duration: ${sessionDuration}s`);

                // Create new session (no duration, will be set when closed)
                const newSession = await this.prisma.userActivity.create({
                    data: {
                        userId,
                        startTime: now,
                        endTime: now,
                    },
                });
                console.log(`[Heartbeat] Created new session: ${newSession.id}`);
            }
        } else {
            // No active session, create first one (no duration)
            const newSession = await this.prisma.userActivity.create({
                data: {
                    userId,
                    startTime: now,
                    endTime: now,
                },
            });
            console.log(`[Heartbeat] Created first session: ${newSession.id}`);
        }
    }

    async endSession(userId: string): Promise<void> {
        // Find the most recent session without duration (active session)
        const activeSession = await this.prisma.userActivity.findFirst({
            where: {
                userId,
                duration: null
            },
            orderBy: { startTime: 'desc' },
        });

        if (activeSession) {
            const now = new Date();
            const duration = Math.floor((now.getTime() - new Date(activeSession.startTime).getTime()) / 1000);

            await this.prisma.userActivity.update({
                where: { id: activeSession.id },
                data: {
                    endTime: now,
                    duration,
                },
            });
            console.log(`[EndSession] Closed session: ${activeSession.id}, duration: ${duration}s`);
        }
    }

    async getTimeSpentByDateRange(userId: string, startDate: Date, endDate: Date) {
        console.log(`[TimeSpent] Fetching activity for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Get all activities within date range
        const activities = await this.prisma.userActivity.findMany({
            where: {
                userId,
                startTime: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        console.log(`[TimeSpent] Found ${activities.length} activity sessions`);

        // Group by date and sum duration
        const timeMap = new Map<string, number>();

        // Initialize all dates in range with 0
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            timeMap.set(dateStr, 0);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate time spent per day
        activities.forEach((activity) => {
            const dateStr = activity.startTime.toISOString().split('T')[0];

            let duration = 0;
            if (activity.duration) {
                // Closed session - use stored duration
                duration = activity.duration;
                console.log(`[TimeSpent] Session ${activity.id.substring(0, 8)} (${dateStr}): Using stored duration = ${duration}s`);
            } else if (activity.endTime) {
                // Active session - calculate current duration
                duration = Math.floor((new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) / 1000);
                console.log(`[TimeSpent] Session ${activity.id.substring(0, 8)} (${dateStr}): Active session, calculated duration = ${duration}s`);
            } else {
                console.log(`[TimeSpent] Session ${activity.id.substring(0, 8)} (${dateStr}): No endTime, skipping`);
            }

            const currentTime = timeMap.get(dateStr) || 0;
            timeMap.set(dateStr, currentTime + duration);
            console.log(`[TimeSpent] Date ${dateStr}: Total time now = ${currentTime + duration}s (${Math.floor((currentTime + duration) / 60)}min)`);
        });

        // Convert seconds to minutes and return array
        const result = Array.from(timeMap.entries()).map(([date, seconds]) => ({
            date,
            timeSpent: Math.floor(seconds / 60), // Convert to minutes
        }));

        console.log(`[TimeSpent] Final result:`, result);
        return result;
    }
}
