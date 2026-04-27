const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const format = (date: string | Date, pattern: string = 'MMM dd, yyyy'): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes();

  return pattern
    .replace('yyyy', String(year))
    .replace('MMM', MONTHS[month])
    .replace('MM', String(month + 1).padStart(2, '0'))
    .replace('dd', String(day).padStart(2, '0'))
    .replace('HH', String(hours).padStart(2, '0'))
    .replace('mm', String(minutes).padStart(2, '0'));
};

export const formatDistanceToNow = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs < 0;

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  let result: string;
  if (minutes < 1) result = 'just now';
  else if (minutes < 60) result = `${minutes}m`;
  else if (hours < 24) result = `${hours}h`;
  else if (days < 30) result = `${days}d`;
  else result = format(date, 'MMM dd');

  if (minutes < 1) return result;
  return isPast ? `${result} ago` : `in ${result}`;
};

export const isAfter = (date: string | Date, ref: Date = new Date()) =>
  new Date(date).getTime() > ref.getTime();

export const isBefore = (date: string | Date, ref: Date = new Date()) =>
  new Date(date).getTime() < ref.getTime();

export const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
