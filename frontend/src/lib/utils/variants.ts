export const slugifyCode = (value: string): string => {
  if (!value?.trim()) return 'VAR';
  return (
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20) || 'VAR'
  );
};
