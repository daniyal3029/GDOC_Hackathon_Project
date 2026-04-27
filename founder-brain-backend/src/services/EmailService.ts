import nodemailer from 'nodemailer';
import config from '../config/environment';
import { ILogger } from '../interfaces/ILogger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private logger: ILogger) {
    const host = process.env.MAIL_HOST || (config.NODE_ENV === 'production' ? '' : 'smtp.ethereal.email');
    const transportConfig: any = {
      host,
      port: parseInt(process.env.MAIL_PORT || '587', 10),
      secure: process.env.MAIL_SECURE === 'true', // port 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    };

    if (host.includes('gmail.com')) {
      transportConfig.service = 'gmail';
      // When using 'service: gmail', host/port/secure are handled by nodemailer
      delete transportConfig.host;
      delete transportConfig.port;
      delete transportConfig.secure;
    }

    this.transporter = nodemailer.createTransport(transportConfig);
    this.logger.info('Email service initialized', { host: process.env.MAIL_HOST || 'ethereal' });
  }

  async sendOTP(email: string, otp: string, type: 'SIGNUP' | 'RESET_PASSWORD'): Promise<void> {
    const subject = type === 'SIGNUP' ? 'Verify your account' : 'Reset your password';
    const message = type === 'SIGNUP' 
      ? `Your verification code is: ${otp}. It will expire in 10 minutes.`
      : `Your password reset code is: ${otp}. It will expire in 10 minutes.`;

    try {
      await this.transporter.sendMail({
        from: '"Founder Brain" <noreply@founderbrain.com>',
        to: email,
        subject: subject,
        text: message,
        html: `<b>${message}</b>`,
      });
      this.logger.info(`OTP sent to ${email}`, { type });
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, { error });
      throw new Error('Failed to send verification email');
    }
  }
}
