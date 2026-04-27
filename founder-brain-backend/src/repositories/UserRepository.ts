import { User, IUserDocument } from '../models/User';

export class UserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return await User.findById(id);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await User.findOne({ email });
  }

  async create(userData: any): Promise<IUserDocument> {
    return await User.create(userData);
  }

  async update(id: string, updates: any): Promise<IUserDocument | null> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  async delete(id: string): Promise<IUserDocument | null> {
    return await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}
