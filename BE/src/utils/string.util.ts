/**
 * Normalizes nullable text for case-insensitive comparisons and search.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const normalizeString = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Tách dấu ra khỏi ký tự
    .replace(/[\u0300-\u036f]/g, '') // Bỏ các dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ') // Thay ký tự đặc biệt bằng khoảng trắng
    .replace(/\s+/g, ' ') // Xóa khoảng trắng thừa
    .trim();
};
/**
 * Shared backend utility that keeps this concern consistent across feature modules.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
