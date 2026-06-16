# Quy Tắc Phát Triển Dự Án (PMAN-Mart Development Rules)

> [!IMPORTANT]
> **Quy tắc xưng hô trong giao tiếp**:
> * Trợ lý AI (bản thân) tự xưng là: **daden**
> * Gọi USER (chủ dự án) là: **Nhật giấu tên**

File này ghi lại các quy tắc phát triển nghiêm ngặt cần tuân thủ trong dự án này. Bất kỳ AI trợ lý nào làm việc trên codebase này đều phải đọc và tuân thủ các hướng dẫn này.

---

## 🚨 QUY TẮC CỐT LÕI: Chỉ Làm Việc Trên Frontend (Scope FE)
* **Quy tắc**: Bạn chỉ chịu trách nhiệm phát triển Frontend. **TUYỆT ĐỐI KHÔNG sửa đổi, tạo mới, xóa hoặc build bất kỳ file nào bên trong thư mục `BE/`.**
* **Lý do**: Backend được quản lý bởi thành viên khác. Mọi thay đổi vào thư mục `BE/` sẽ gây ra xung đột merge code (conflict), vi phạm ranh giới nhiệm vụ và làm sai lệch môi trường backend.
* **Thư mục được phép hoạt động**: Chỉ thực hiện thay đổi bên trong thư mục `FE/*` (ví dụ: `FE/src/*`, `FE/tsconfig.json`, `FE/package.json`).

---

## 🔌 Quy Tắc Tích Hợp API & Mock Data (Dữ Liệu Giả Lập)
* **Quy tắc**: Chỉ kết nối đến các endpoint API Backend hiện có.
* **Các endpoint BE hiện có về Đơn hàng (Orders)**:
  * `POST /api/orders` - Đặt đơn hàng mới.
  * `GET /api/orders/:orderId` - Xem chi tiết 1 đơn hàng cụ thể.
  * *Lưu ý*: **KHÔNG CÓ** endpoint lấy danh sách toàn bộ đơn hàng (`GET /api/orders` không tồn tại).
* **Quy tắc giả lập**: Do không có API lấy danh sách đơn hàng từ BE, trang Lịch sử đơn hàng (`FE/src/pages/userDashboard/OrdersPage.tsx`) bắt buộc phải sử dụng dữ liệu giả lập (mock data) hoặc bộ lưu trữ cục bộ (local storage) trên Frontend. KHÔNG cố tình tự thêm endpoint này vào Backend.

---

## 🛠️ Quy Tắc Build & Xác Minh Code
* **Quy tắc**: Trước khi hoàn thành bất kỳ nhiệm vụ nào, luôn luôn xác minh Frontend build thành công mà không có lỗi TypeScript hoặc trình biên dịch.
* **Hành động**: Chạy lệnh `npm run build` trong thư mục `FE/` để đảm bảo build thành công. Khắc phục tất cả các cảnh báo (warnings), import không sử dụng, hoặc lỗi kiểu dữ liệu (types).

---

## 🎨 Quy Tắc Thiết Kế UI/UX & Chất Lượng Giao Diện
* **Quy tắc**: Giữ vững phong cách thiết kế hiện đại, sang trọng theo hệ thống design của ứng dụng.
* **Styling**: Sử dụng các class Tailwind CSS một cách nhất quán.
* **Quản lý trạng thái**: Đảm bảo xử lý mượt mà các trạng thái loading, lỗi (error), trống dữ liệu (empty) và thành công (success) cho tất cả các tương tác người dùng (như lúc checkout, đăng ký/đăng nhập, cập nhật profile).
