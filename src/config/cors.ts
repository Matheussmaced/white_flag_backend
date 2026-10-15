export const parseCorsOrigins = (value: string): true | string[] => {
  if (value.trim() === '*') return true;

  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0);
};
