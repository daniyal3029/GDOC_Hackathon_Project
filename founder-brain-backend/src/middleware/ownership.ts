import { Request, Response, NextFunction } from 'express';
import { container } from '../config/container';
import { TaskRepository } from '../repositories/TaskRepository';
import { MeetingRepository } from '../repositories/MeetingRepository';

const taskRepository = container.resolve<TaskRepository>('TaskRepository');
const meetingRepository = container.resolve<MeetingRepository>('MeetingRepository');

export const checkTaskOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const task = await taskRepository.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this task' });
    }

    (req as any).task = task;
    next();
  } catch (error) {
    next(error);
  }
};

export const checkMeetingOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (meeting.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this meeting' });
    }

    (req as any).meeting = meeting;
    next();
  } catch (error) {
    next(error);
  }
};
