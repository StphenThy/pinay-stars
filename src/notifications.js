import { createContext, useContext } from 'react';

export const NotificationContext = createContext({ unread: 0, open: () => {} });

export const useNotifications = () => useContext(NotificationContext);

export function timeAgo(stamp) {
  const mins = Math.round((Date.now() - stamp) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}
