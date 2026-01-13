import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private resend: Resend;
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get('RESEND_API_KEY');
        if (!apiKey) {
            this.logger.error('RESEND_API_KEY is not defined in environment variables');
        }
        this.resend = new Resend(apiKey);
    }

    async sendVerificationEmail(email: string, token: string) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

        try {
            await this.resend.emails.send({
                from: 'CodeFit <onboarding@resend.dev>', // Use resend.dev for testing if no domain
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
}
