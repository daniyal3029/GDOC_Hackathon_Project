import mongoose from 'mongoose';

export const createTestMeeting = (overrides = {}) => {
  return {
    _id: new mongoose.Types.ObjectId(),
    rawText: 'Sample meeting notes ' + Math.random().toString(36).substring(7),
    summary: 'Meeting Summary',
    decisions: ['Decision 1'],
    processingStatus: 'completed' as const,
    embeddingStatus: 'completed' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

export const createTestTask = (overrides = {}) => {
  return {
    _id: new mongoose.Types.ObjectId(),
    meetingId: new mongoose.Types.ObjectId(),
    description: 'Task description ' + Math.random().toString(36).substring(7),
    owner: 'Owner' + Math.random().toString(36).substring(7),
    deadline: new Date(Date.now() + 86400000),
    status: 'pending' as const,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

export const createTestUser = () => {
  return {
    id: 'user-' + Math.random().toString(36).substring(7),
    name: 'Test User',
    email: 'test@example.com',
  };
};
