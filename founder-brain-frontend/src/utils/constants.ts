import { formatDistanceToNow, format, isAfter, isBefore, addDays } from './dateFormatter';

export { formatDistanceToNow, format, isAfter, isBefore, addDays };

export const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

export const truncate = (str: string, length: number) =>
  str.length > length ? str.substring(0, length) + '...' : str;

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-success';
    case 'processing': return 'text-accent-glow';
    case 'pending': return 'text-warning';
    case 'failed': return 'text-error';
    default: return 'text-text-secondary';
  }
};

export const getStatusDot = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-success';
    case 'processing': return 'bg-accent-glow';
    case 'pending': return 'bg-warning';
    case 'failed': return 'bg-error';
    default: return 'bg-text-muted';
  }
};

export const getDeadlineColor = (deadline: string | null) => {
  if (!deadline) return '';
  const date = new Date(deadline);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'text-error';
  if (diff <= 2) return 'text-error';
  if (diff <= 7) return 'text-warning';
  return 'text-success';
};

export const getDeadlineBg = (deadline: string | null) => {
  if (!deadline) return '';
  const date = new Date(deadline);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'bg-error/10 text-error';
  if (diff <= 2) return 'bg-error/10 text-error';
  if (diff <= 7) return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
};

export const SAMPLE_MEETING_TEXT = `Meeting: Q3 Product Planning
Date: October 15, 2024
Participants: Sarah, John, Alex, Maria

Sarah opened the meeting by reviewing Q2 results. Revenue was up 23% and user engagement increased by 15%.

Key Discussion Points:

1. Mobile App Launch
Sarah proposed launching the mobile app by November 30th. John confirmed the iOS version is 80% complete, and Alex said Android will need 2 more weeks after iOS is done.

Decision: We will launch iOS first on November 30th, followed by Android on December 15th.

2. Pricing Strategy
Maria presented three pricing tiers: Free, Pro ($29/month), and Enterprise ($99/month). After discussion, the team agreed to offer a 14-day free trial for Pro users.

Decision: Implement the three-tier pricing model with a 14-day free trial for Pro.

3. Customer Support
Alex raised concerns about support response times. Current average is 4 hours; target is under 1 hour.

Decision: Hire two additional support agents by end of October.

Action Items:
- John: Complete iOS app testing by November 15th
- Alex: Begin Android development sprint on November 1st  
- Maria: Prepare pricing page mockups by October 22nd
- Sarah: Post job listings for support agents by October 18th
- Alex: Set up automated response system for common queries by October 25th
- Maria: Create onboarding email sequence for free trial users by November 1st`;
