import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserActivityService } from './user-activity.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private userActivityService: UserActivityService,
  ) { }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });
  }

  async searchUsers(query: string, excludeUserId: string) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { email: { contains: query } },
            ],
          },
          { id: { not: excludeUserId } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      take: 20,
    });
  }

  async getUserActivity(userId: string, startDate: Date, endDate: Date) {
    // Get platform time spent from UserActivity table
    const platformTimeData = await this.userActivityService.getTimeSpentByDateRange(userId, startDate, endDate);

    // Get interview count from InterviewParticipant table
    const interviews = await this.prisma.interviewParticipant.findMany({
      where: {
        OR: [
          { candidateId: userId },
          { interviewerId: userId },
        ],
        interview: {
          scheduledAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        interview: true,
      },
    });

    // Count interviews by date
    const interviewCountMap = new Map<string, number>();
    interviews.forEach((participant) => {
      if (participant.interview.scheduledAt) {
        const dateStr = participant.interview.scheduledAt.toISOString().split('T')[0];
        interviewCountMap.set(dateStr, (interviewCountMap.get(dateStr) || 0) + 1);
      }
    });

    // Combine both datasets
    return platformTimeData.map(({ date, timeSpent }) => ({
      date,
      interviews: interviewCountMap.get(date) || 0,
      timeSpent, // Platform time in minutes
    }));
  }

  async getUserStatistics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        interviewsAsCandidate: {
          include: { interview: true },
        },
        interviewsAsInterviewer: {
          include: { interview: true },
        },
        friends: true,
        friendOf: true,
        sentFriendRequests: {
          where: { status: 'PENDING' },
        },
        receivedFriendRequests: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Combine all interviews
    const allInterviews = [
      ...user.interviewsAsCandidate.map(p => p.interview),
      ...user.interviewsAsInterviewer.map(p => p.interview),
    ];

    // Remove duplicates
    const uniqueInterviews = Array.from(
      new Map(allInterviews.map(i => [i.id, i])).values()
    );

    const totalInterviews = uniqueInterviews.length;
    const completedInterviews = uniqueInterviews.filter(i => i.status === 'COMPLETED').length;
    const upcomingInterviews = uniqueInterviews.filter(i =>
      i.status === 'SCHEDULED' && i.scheduledAt && new Date(i.scheduledAt) > new Date()
    ).length;
    const cancelledInterviews = uniqueInterviews.filter(i => i.status === 'CANCELLED').length;

    const totalFriends = user.friends.length + user.friendOf.length;
    const pendingRequests = user.sentFriendRequests.length + user.receivedFriendRequests.length;

    return {
      totalInterviews,
      completedInterviews,
      upcomingInterviews,
      cancelledInterviews,
      totalFriends,
      pendingRequests,
      memberSince: user.createdAt,
    };
  }

  async updateUserProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async getRecentActivity(userId: string, limit: number = 10) {
    const recentInterviews = await this.prisma.interviewParticipant.findMany({
      where: {
        OR: [
          { candidateId: userId },
          { interviewerId: userId },
        ],
      },
      include: {
        interview: true,
      },
      orderBy: {
        interview: {
          createdAt: 'desc',
        },
      },
      take: limit,
    });

    return recentInterviews.map(p => ({
      id: p.interview.id,
      title: p.interview.title,
      status: p.interview.status,
      scheduledAt: p.interview.scheduledAt,
      createdAt: p.interview.createdAt,
      role: p.candidateId === userId ? 'candidate' : 'interviewer',
    }));
  }

  async completeOnboarding(userId: string, role: 'JOB_SEEKER' | 'INTERVIEWER') {
    console.log(`UserService.completeOnboarding called for userId: ${userId} with role: ${role}`);
    try {
      const updateResult = await this.prisma.user.update({
        where: { id: userId },
        data: {
          role,
          onboardingCompleted: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          onboardingCompleted: true,
          organizationId: true,
          createdAt: true,
        },
      });
      console.log('UserService.completeOnboarding successful update:', JSON.stringify(updateResult));
      return updateResult;
    } catch (err) {
      console.error('UserService.completeOnboarding Prisma Error:', err);
      throw err;
    }
  }
}

