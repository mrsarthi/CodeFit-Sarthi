import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InterviewStatusService {
    private readonly logger = new Logger(InterviewStatusService.name);

    constructor(private prisma: PrismaService) { }

    // Run every 5 minutes
    @Cron(CronExpression.EVERY_5_MINUTES)
    async updateInterviewStatuses() {
        this.logger.log('Running interview status update job...');

        try {
            const now = new Date();
            const expiryThreshold = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

            // Find all SCHEDULED interviews that should be checked
            const scheduledInterviews = await this.prisma.interview.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: {
                        not: null,
                        lte: expiryThreshold, // Scheduled time + 30 min has passed
                    },
                },
                include: {
                    participants: true,
                },
            });

            // Mark interviews as CANCELLED if no one joined
            for (const interview of scheduledInterviews) {
                const hasParticipants = interview.participants.some(
                    (p) => p.joinedAt !== null
                );

                if (!hasParticipants) {
                    await this.prisma.interview.update({
                        where: { id: interview.id },
                        data: { status: 'CANCELLED' },
                    });
                    this.logger.log(
                        `Interview ${interview.id} marked as CANCELLED (no participants joined)`
                    );
                }
            }

            // Find ACTIVE interviews that have ended
            const activeInterviews = await this.prisma.interview.findMany({
                where: {
                    status: 'ACTIVE',
                    endedAt: {
                        not: null,
                    },
                },
                include: {
                    participants: true,
                },
            });

            // Mark interviews as COMPLETED if they have ended and someone joined
            for (const interview of activeInterviews) {
                const hasParticipants = interview.participants.some(
                    (p) => p.joinedAt !== null
                );

                if (hasParticipants) {
                    await this.prisma.interview.update({
                        where: { id: interview.id },
                        data: { status: 'COMPLETED' },
                    });
                    this.logger.log(
                        `Interview ${interview.id} marked as COMPLETED`
                    );
                }
            }

            this.logger.log('Interview status update job completed');
        } catch (error) {
            this.logger.error('Error updating interview statuses:', error);
        }
    }

    // Manual method to update a specific interview status
    async updateInterviewStatus(interviewId: string): Promise<void> {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
            include: { participants: true },
        });

        if (!interview) {
            throw new Error('Interview not found');
        }

        const now = new Date();
        const hasParticipants = interview.participants.some(
            (p) => p.joinedAt !== null
        );

        // Check if interview should be marked as CANCELLED
        if (
            interview.status === 'SCHEDULED' &&
            interview.scheduledAt &&
            new Date(interview.scheduledAt).getTime() + 30 * 60 * 1000 < now.getTime() &&
            !hasParticipants
        ) {
            await this.prisma.interview.update({
                where: { id: interviewId },
                data: { status: 'CANCELLED' },
            });
            this.logger.log(`Interview ${interviewId} marked as CANCELLED`);
        }

        // Check if interview should be marked as COMPLETED
        if (
            interview.status === 'ACTIVE' &&
            interview.endedAt &&
            hasParticipants
        ) {
            await this.prisma.interview.update({
                where: { id: interviewId },
                data: { status: 'COMPLETED' },
            });
            this.logger.log(`Interview ${interviewId} marked as COMPLETED`);
        }
    }
}
