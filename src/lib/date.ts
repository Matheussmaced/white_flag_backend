const ISO_DATE_LENGTH = 10;

export const getTodayIn = (timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

export const toDbDate = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);

export const fromDbDate = (date: Date): string => date.toISOString().slice(0, ISO_DATE_LENGTH);
