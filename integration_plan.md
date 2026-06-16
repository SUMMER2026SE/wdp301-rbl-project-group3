# Kế Hoạch Đồng Bộ Hóa & Phát Triển Hệ Thống (FE & BE Integration Plan)

> **Người thực hiện**: daden (AI)  
> **Chủ dự án**: Nhật giấu tên  
> **Dự án**: PMAN-Mart E-Commerce Platform

---

## 📌 1. Đánh giá hiện trạng hệ thống

### 🟢 Những phần đã hoạt động tốt
*   **Database**: Kết nối thành công đến MongoDB Atlas, kết nối ổn định và truy vấn dữ liệu bình thường.
*   **Xác thực (Auth)**: Các chức năng đăng nhập, đăng ký, xác thực OTP qua email, quên mật khẩu đã hoàn tất ở cả FE và BE.
*   **Cấu trúc dữ liệu (Models)**: Đã định nghĩa đầy đủ các Schema quan trọng (User, Product, Branch, Inventory, Order, Cart, Promotion, Voucher).

### 🔴 Các lỗ hổng cần xử lý (Gaps)
1.  **Thiếu Route chính cho Giỏ hàng & Khuyến mãi**: Module `cart` và `promotion` trên Backend chưa được đăng ký trong `BE/src/routes/index.ts`. *(Đã giải quyết xong)*
2.  **Thiếu API Khách hàng trên BE**: 
    *   API lấy sản phẩm (`GET /api/products`) hiện đang bắt buộc quyền Back-office, khách hàng không thể gọi được để hiển thị trang chủ.
    *   Chưa có API để khách hàng tự đặt hàng (`POST /api/orders` cho customer) và xem lịch sử đơn hàng của cá nhân (`GET /api/orders/my-orders`).
3.  **Thiếu Giao diện Admin/Staff trên FE**: Backend đã viết đầy đủ API duyệt đơn, quản lý kho, chi nhánh nhưng FE mới chỉ có giao diện của Khách hàng.

---

## 🛠️ 2. Kế hoạch triển khai chi tiết

### 📍 Giai đoạn 1: Hoàn thiện & Khai báo API trên Backend (BE)

#### 🚀 Bước 1.1: Đăng ký các Route thiếu vào `BE/src/routes/index.ts`
*   Import `cartRoutes` và `promotionRoutes`.
*   Đăng ký endpoints: `/api/cart` và `/api/promotions`. *(Đã giải quyết xong)*

#### 🚀 Bước 1.2: Cấu hình lại phân quyền Product Catalog
*   Chỉnh sửa `BE/src/modules/product/product.routes.ts` để cho phép Khách hàng (`customer`) và Khách vãng lai (Guest - không cần token) có thể gọi `GET /api/products` để hiển thị sản phẩm trên trang chủ.

#### 🚀 Bước 1.3: Phát triển API đặt hàng cho Khách hàng
*   Viết endpoint `POST /api/orders` dành cho khách hàng:
    *   Lấy danh sách các sản phẩm từ Cart của customer.
    *   Kiểm tra số lượng tồn kho tại chi nhánh được chọn.
    *   Tạo tài liệu Order mới trong DB, trừ số lượng tồn kho tương ứng.
    *   Xóa sạch các item đã đặt khỏi Giỏ hàng (`cart`).
*   Viết endpoint `GET /api/orders/my-orders` dành cho khách hàng để lấy danh sách các đơn hàng của riêng họ.

---

### 📍 Giai đoạn 2: Tích hợp API thực tế vào Frontend (FE)

#### 🚀 Bước 2.1: Đồng bộ hóa Giỏ hàng (Cart)
*   Thay thế các xử lý lưu giỏ hàng local trên FE bằng cách gọi API thông qua `cartService` (đã viết sẵn) đến endpoint `/api/cart` của BE.

#### 🚀 Bước 2.2: Đồng bộ hóa Đặt hàng (Checkout)
*   Kết nối trang `CheckoutPage` với API `POST /api/orders` thực tế của BE thay vì dùng dữ liệu giả định.

#### 🚀 Bước 2.3: Đồng bộ hóa Lịch sử đơn hàng (Orders History)
*   Kết nối trang `OrdersPage` của Dashboard với API `GET /api/orders/my-orders` để lấy danh sách đơn hàng thực tế của khách hàng từ DB thay vì hiển thị mảng tĩnh.

---

### 📍 Giai đoạn 3: Phát triển Trang quản trị (Back-office Dashboard) trên FE

Xây dựng các màn hình dành riêng cho người dùng có role: `admin`, `manager`, `staff`:
*   **Trang Quản lý đơn hàng**:
    *   Xem danh sách các đơn hàng mới đặt.
    *   Nút "Xác nhận đơn hàng" (Confirm) để hệ thống tự động trừ kho.
    *   Cập nhật trạng thái chuẩn bị hàng, giao hàng hoặc hủy đơn.
*   **Trang Quản lý kho hàng & Nhập kho**:
    *   Xem số lượng tồn kho từng sản phẩm theo chi nhánh.
    *   Tạo phiếu nhập kho (`Import Receipt`) để tăng số lượng sản phẩm trong kho.
*   **Trang Quản lý chi nhánh**: CRUD chi nhánh.

---

## 📈 3. Ký duyệt & Bắt đầu

| Vai trò | Tên | Trạng thái |
| :--- | :--- | :--- |
| **Chủ dự án** | Nhật giấu tên | *Đang chờ duyệt kế hoạch* |
| **Trợ lý AI** | daden | **Sẵn sàng triển khai** |
