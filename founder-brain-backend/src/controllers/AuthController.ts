import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { refreshTokenCookieOptions } from '../config/cookie';

export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      const result = await this.authService.register(email, password, name);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  verifySignup = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const result = await this.authService.verifySignup(email, otp);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await this.authService.login(
        email,
        password,
        req.ip as string,
        req.headers['user-agent'] || 'unknown'
      );

      res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
      res.status(200).json({ success: true, data: { user, accessToken } });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await this.authService.resetPassword(email, otp, newPassword);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token missing' });
      }

      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshAccessToken(
        refreshToken,
        req.ip as string
      );

      res.cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions);
      res.status(200).json({ success: true, data: { accessToken } });
    } catch (error: any) {
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      res.status(401).json({ success: false, message: error.message });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
       const userId = (req as any).user.userId;
       await this.authService.logout(userId);
       res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
       res.status(204).send();
    } catch (error: any) {
       res.status(500).json({ success: false, message: error.message });
    }
  };

  getMe = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const user = await this.userService.getUserById(userId);
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
