import nodemailer from 'nodemailer';
import config from '../config/environment';
import { ILogger } from '../interfaces/ILogger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private logger: ILogger) {
    this.transporter = nodemailer.createTransport({
      host: config.NODE_ENV === 'production' ? process.env.MAIL_HOST : 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER || 'shahzadkhichi996@gmail.com',
        pass: process.env.MAIL_PASS || 'yowt kkwr tufq rgan',
      },
    });
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
