export const sanitizeText = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/<[^>]*>/g, '').substring(0, 500);
};

export const sanitizeLongText = (input: string, maxLen = 2000): string => {
  if (!input) return '';
  return input.trim().replace(/<[^>]*>/g, '').substring(0, maxLen);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+91[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const validatePrice = (price: string | number): boolean => {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(p)) return false;
  return p > 0 && p <= 50000;
};

export const validateStoreName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z0-9\s]+$/;
  return nameRegex.test(name.trim());
};
