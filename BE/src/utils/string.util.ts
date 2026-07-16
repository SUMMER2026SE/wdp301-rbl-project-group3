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
