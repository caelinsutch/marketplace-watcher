import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatTimeAgo = (date: Date | string) => {
  return dayjs(date).fromNow();
};

export const formatDate = (date: Date | string) => {
  return dayjs(date).format("MMMM D, YYYY");
};

export const formatDateTime = (date: Date | string) => {
  return dayjs(date).format("MMMM D, YYYY h:mm A");
};

export const isToday = (date: Date | string) => {
  return dayjs(date).isSame(dayjs(), "day");
};

export const isYesterday = (date: Date | string) => {
  return dayjs(date).isSame(dayjs().subtract(1, "day"), "day");
};

export const addDays = (date: Date | string, days: number) => {
  return dayjs(date).add(days, "day").toDate();
};

export const subtractDays = (date: Date | string, days: number) => {
  return dayjs(date).subtract(days, "day").toDate();
};

export const addHours = (date: Date | string, hours: number) => {
  return dayjs(date).add(hours, "hour").toDate();
};

export const subtractHours = (date: Date | string, hours: number) => {
  return dayjs(date).subtract(hours, "hour").toDate();
};

export const addMinutes = (date: Date | string, minutes: number) => {
  return dayjs(date).add(minutes, "minute").toDate();
};

export const subtractMinutes = (date: Date | string, minutes: number) => {
  return dayjs(date).subtract(minutes, "minute").toDate();
};

export const now = () => {
  return dayjs().toDate();
};

export const today = () => {
  return dayjs().startOf("day").toDate();
};

export const yesterday = () => {
  return dayjs().subtract(1, "day").startOf("day").toDate();
};

export const tomorrow = () => {
  return dayjs().add(1, "day").startOf("day").toDate();
};

export { dayjs };
