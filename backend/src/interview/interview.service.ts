import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { InterviewStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InterviewService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

  async create(userId: string, createInterviewDto: CreateInterviewDto) {
    const { title, description, scheduledAt, participantIds } = createInterviewDto;

    // Verify user is interviewer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== 'INTERVIEWER') {
      throw new ForbiddenException('Only interviewers can create interviews');
    }

    // Create interview with participants
    const interview = await this.prisma.interview.create({
      data: {
        title,
        description,
        scheduledAt: createInterviewDto.startNow ? new Date() : (scheduledAt ? new Date(scheduledAt) : null),
        startedAt: createInterviewDto.startNow ? new Date() : null,
        status: createInterviewDto.startNow ? InterviewStatus.ACTIVE : InterviewStatus.SCHEDULED,
        participants: {
          create: participantIds.map((participantId) => ({
            interviewerId: userId,
            candidateId: participantId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            candidate: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            interviewer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Send email invitations to candidates
    for (const participant of interview.participants) {
      if (participant.candidate) {
        this.mailService.sendInterviewInvitation(
          participant.candidate.email,
          participant.candidate.firstName,
          interview.title,
          interview.scheduledAt,
          interview.id,
        );
      }
    }

    return interview;
  }

  async findAll(userId: string) {
    const interviews = await this.prisma.interview.findMany({
      where: {
        OR: [
          { participants: { some: { candidateId: userId } } },
          { participants: { some: { interviewerId: userId } } },
        ],
      },
      include: {
        participants: {
          include: {
            candidate: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            interviewer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return interviews;
  }

  async findOne(id: string, userId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            candidate: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            interviewer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    // Check if user is a participant
    const isParticipant = interview.participants.some(
      (p) => p.candidateId === userId || p.interviewerId === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not authorized to view this interview');
    }

    return interview;
  }

  async start(id: string, userId: string) {
    const interview = await this.findOne(id, userId);

    if (interview.status !== InterviewStatus.SCHEDULED) {
      throw new ForbiddenException('Interview cannot be started');
    }

    const updated = await this.prisma.interview.update({
      where: { id },
      data: {
        status: InterviewStatus.ACTIVE,
        startedAt: new Date(),
      },
      include: {
        participants: {
          include: {
            candidate: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            interviewer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  async end(id: string, userId: string) {
    const interview = await this.findOne(id, userId);

    if (interview.status !== InterviewStatus.ACTIVE) {
      throw new ForbiddenException('Interview is not active');
    }

    const updated = await this.prisma.interview.update({
      where: { id },
      data: {
        status: InterviewStatus.COMPLETED,
        endedAt: new Date(),
      },
      include: {
        participants: {
          include: {
            candidate: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            interviewer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const interview = await this.findOne(id, userId);

    // Verify user is interviewer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== 'INTERVIEWER') {
      throw new ForbiddenException('Only interviewers can delete interviews');
    }

    await this.prisma.interview.delete({
      where: { id },
    });

    return { message: 'Interview deleted successfully' };
  }

  async updateState(id: string, data: { codeContent?: string; whiteboardData?: any }) {
    return this.prisma.interview.update({
      where: { id },
      data,
    });
  }
}

