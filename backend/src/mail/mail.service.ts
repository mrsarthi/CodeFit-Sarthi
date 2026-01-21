import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) {
        const user = this.configService.get('MAIL_USER');
        const pass = this.configService.get('MAIL_PASS');

        if (!user || !pass) {
            this.logger.error('MAIL_USER or MAIL_PASS is not defined in environment variables');
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass,
            },
        });
    }

    async sendVerificationEmail(email: string, token: string) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

        try {
            await this.transporter.sendMail({
                from: `"CodeFit" <${this.configService.get('MAIL_USER')}>`,
                to: email,
                subject: 'Verify your CodeFit Email',
                html: `
          <h1>Welcome to CodeFit!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>Or copy and paste this link:</p>
          <p>${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
        `,
            });
            this.logger.log(`Verification email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${email}`, error);
            throw error;
        }
    }

    async sendInterviewInvitation(email: string, candidateName: string, interviewTitle: string, scheduledAt: Date | null, interviewId: string) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const joinUrl = `${frontendUrl}/interview/${interviewId}`;

        const timeString = scheduledAt
            ? new Date(scheduledAt).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Happening Now';

        try {
            await this.transporter.sendMail({
                from: `"CodeFit" <${this.configService.get('MAIL_USER')}>`,
                to: email,
                subject: `Interview Invitation: ${interviewTitle}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Interview Invitation</h2>
            <p>Hello ${candidateName},</p>
            <p>You have been invited to an interview on CodeFit.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Topic:</strong> ${interviewTitle}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${timeString}</p>
            </div>

            <p>You can join the interview directly using the button below:</p>
            
            <a href="${joinUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
                Join Interview
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">Or copy this link: <br>${joinUrl}</p>
          </div>
        `,
            });
            this.logger.log(`Interview invitation sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send interview invitation to ${email}`, error);
            // Don't throw error here to avoid blocking interview creation if email fails
        }
    }
}
