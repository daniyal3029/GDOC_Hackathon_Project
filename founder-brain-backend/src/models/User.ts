import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../config/environment';

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  refreshTokenHash: string | null;
  refreshTokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  hashRefreshToken(token: string): string;
  verifyRefreshToken(token: string): boolean;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    refreshTokenHash: { type: String, default: null },
    refreshTokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ refreshTokenVersion: 1 });

// Methods
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.hashRefreshToken = function (token: string): string {
  // We'll use a simple sha256 or similar if needed, but bcrypt is overkill for refresh tokens
  // if we rotate them often. However, the prompt says "Simple sha256 hash (for storage)"
  // Let's use crypto for that
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
