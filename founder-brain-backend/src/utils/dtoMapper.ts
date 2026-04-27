import { Types } from 'mongoose';

/**
 * Utility for mapping and sanitizing data for DTOs.
 */
export const dtoMapper = {
  /**
   * Safely maps a string to MongoDB ObjectId.
   */
  toObjectId: (id: string): Types.ObjectId => {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId format: ${id}`);
    }
    return new Types.ObjectId(id);
  },

  /**
   * Formats a date to ISO string safely.
   */
  toISODate: (date: Date | string | null | undefined): string | null => {
    if (!date) return null;
    return new Date(date).toISOString();
  },

  /**
   * Truncates text for previews.
   */
  truncateText: (text: string, maxLength: number = 300): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Computes days between now and a date.
   */
  computeDaysDifference: (date: Date | null): number | null => {
    if (!date) return null;
    const diff = date.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 3600 * 24));
  },

  /**
   * Checks if a deadline is in the past.
   */
  isOverdue: (deadline: Date | null): boolean => {
    if (!deadline) return false;
    return deadline.getTime() < Date.now();
  },

  /**
   * Basic sanitizer to remove sensitive fields.
   */
  sanitize: (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    const { _id, __v, password, ...rest } = obj.toObject ? obj.toObject() : obj;
    return { id: _id?.toString() || rest.id, ...rest };
  }
};
