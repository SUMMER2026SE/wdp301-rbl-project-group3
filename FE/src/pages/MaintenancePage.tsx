import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * Trang thông báo bảo trì hệ thống.
 * Được hiển thị khi toàn bộ hệ thống hoặc các chức năng phía người dùng đang được bảo trì.
 * Ngăn chặn người dùng truy cập vào các trang chính, nhưng vẫn cung cấp đường dẫn để quản trị viên (Admin/Manager) có thể đăng nhập.
 * Tính năng này được kiểm soát thông qua Settings từ phía Admin.
 *
 * @author MinhLD
 */
export const MaintenancePage = () => {
  /** 
   * Trạng thái (state) cục bộ lưu trữ tên của cửa hàng.
   * Dữ liệu mặc định (fallback) là 'PMAN-Mart' đề phòng trường hợp API cấu hình cũng bị sập/bảo trì.
   */
  const [storeName, setStoreName] = useState('PMAN-Mart')

  /**
   * Hook vòng đời (Lifecycle hook) chạy một lần duy nhất khi component được gắn vào DOM (mount).
   * Nhiệm vụ: Gọi API lấy thông tin cài đặt chung public (chẳng hạn như tên hiển thị của cửa hàng)
   * để cập nhật lên giao diện bảo trì, giúp trang bảo trì trông chuyên nghiệp và đúng thương hiệu.
   */
  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        // Cập nhật tên cửa hàng nếu API trả về thành công và có dữ liệu
        if (data?.success && data?.data?.settings?.store_name) {
          setStoreName(data.data.settings.store_name)
        }
      })
      .catch(() => {
        // Bỏ qua lỗi nếu không fetch được, giữ nguyên tên mặc định
      })
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-center">
      {/* Animated gear icon */}
      <div className="mb-8 flex items-center justify-center">
        <div className="relative">
          <div className="h-28 w-28 animate-spin rounded-full border-4 border-primary/30 border-t-primary [animation-duration:3s]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12 text-primary"
            >
              <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
              <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </div>
        </div>
      </div>

      {/* Text */}
      <h1 className="mb-3 text-3xl font-black text-white sm:text-4xl">
        Hệ thống đang bảo trì
      </h1>
      <p className="mb-2 max-w-md text-base text-slate-400">
        Chúng tôi đang thực hiện nâng cấp để mang lại trải nghiệm tốt hơn cho bạn.
      </p>
      <p className="mb-8 text-sm text-slate-500">
        Vui lòng quay lại sau ít phút. Xin lỗi vì sự bất tiện này.
      </p>

      {/* Divider */}
      <div className="mb-8 h-px w-24 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

      {/* Store info */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {storeName}
        </p>
        <p className="text-xs text-slate-600">
          Nếu cần hỗ trợ gấp, vui lòng liên hệ hotline hoặc email của chúng tôi.
        </p>
        <Link
          to="/login"
          className="mt-6 text-xs text-slate-500 hover:text-primary transition-colors hover:underline"
        >
          Đăng nhập hệ thống (Quản lý)
        </Link>
      </div>

      {/* Animated dots */}
      <div className="mt-10 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
