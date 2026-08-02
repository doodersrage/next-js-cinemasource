export function normalizeList<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

export function combineValues(value: string | string[] | undefined): string {
  if (value == null) {
    return '';
  }
  return Array.isArray(value) ? value.join(', ') : value;
}

export function mdYToYmd(date: string): string {
  const parts = date.split('/');
  if (parts.length !== 3) {
    return '';
  }
  const [month, day, year] = parts;
  return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;
}
