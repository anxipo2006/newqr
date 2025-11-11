export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const getWeekRange = (date: Date): { weekStart: Date; weekEnd: Date } => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diffToMonday));

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
};

export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
};

export const formatTimeToHHMM = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const calculateHours = (startTime: number | null, endTime: number | null): number => {
    if (!startTime || !endTime || endTime < startTime) {
        return 0;
    }
    const diffMs = endTime - startTime;
    return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

export const getTimeToday = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
};