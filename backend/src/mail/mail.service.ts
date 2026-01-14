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
}
