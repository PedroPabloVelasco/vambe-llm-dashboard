export type MeetingStatus = 'pending' | 'processing' | 'done' | 'error';

export const isMeetingStatus = (value: string): value is MeetingStatus =>
  value === 'pending' ||
  value === 'processing' ||
  value === 'done' ||
  value === 'error';
