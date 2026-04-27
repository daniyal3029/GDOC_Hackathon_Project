import { UserRepository } from '../repositories/UserRepository';
import { IUserDocument } from '../models/User';
import bcrypt from 'bcrypt';
import config from '../config/environment';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUserById(id: string): Promise<any> {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  async getUserByEmail(email: string): Promise<IUserDocument | null> {
    return await this.userRepository.findByEmail(email);
  }

  async updateUser(id: string, updates: any): Promise<any> {
    const user = await this.userRepository.update(id, updates);
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('User not found');

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) throw new Error('Invalid old password');

    const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);
    await this.userRepository.update(id, { passwordHash });
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.userRepository.delete(id);
    return true;
  }

  private sanitizeUser(user: IUserDocument) {
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.refreshTokenHash;
    return userObj;
  }
}
