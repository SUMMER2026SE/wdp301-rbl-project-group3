import nodemailer from 'nodemailer';
import { env } from '../config/env.config';

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
});

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verifyUrl = `${env.clientUrl}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: env.email.from,
    to: email,
    subject: 'Xác thực email - PMAN-Mart',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d7a4f;">Xác thực Email của bạn</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản PMAN-Mart.</p>
        <p>Nhấn vào nút bên dưới để xác thực email:</p>
        <a href="${verifyUrl}" 
           style="display:inline-block; padding:12px 24px; background:#2d7a4f; color:#fff; text-decoration:none; border-radius:6px; margin:16px 0;">
          Xác thực Email
        </a>
        <p>Hoặc copy link này vào trình duyệt:</p>
        <p style="word-break:break-all; color:#555;">${verifyUrl}</p>
        <p style="color:#999; font-size:13px;">Link này sẽ hết hạn sau 24 giờ.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${env.clientUrl}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: env.email.from,
    to: email,
    subject: 'Đặt lại mật khẩu - PMAN-Mart',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d7a4f;">Đặt Lại Mật Khẩu</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
        <a href="${resetUrl}" 
           style="display:inline-block; padding:12px 24px; background:#c0392b; color:#fff; text-decoration:none; border-radius:6px; margin:16px 0;">
          Đặt Lại Mật Khẩu
        </a>
        <p>Hoặc copy link này vào trình duyệt:</p>
        <p style="word-break:break-all; color:#555;">${resetUrl}</p>
        <p style="color:#999; font-size:13px;">Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  console.log(`[Email OTP] Sending OTP to ${email}: ${otp}`);
  await transporter.sendMail({
    from: env.email.from,
    to: email,
    subject: 'Mã OTP Xác thực - PMAN-Mart',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d7a4f;">Mã OTP Xác thực</h2>
        <p>Đây là mã OTP của bạn để xác thực hành động. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <div style="background:#f4f4f4; padding:16px; text-align:center; font-size:24px; font-weight:bold; letter-spacing:4px; color:#333; margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#999; font-size:13px;">Mã OTP này sẽ hết hạn sau 15 phút.</p>
      </div>
    `,
  });
};

export const sendOrderRefundEmail = async (
  email: string,
  orderCode: string,
  amount: number,
  reason: string
): Promise<void> => {
  const formatVND = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  await transporter.sendMail({
    from: env.email.from,
    to: email,
    subject: `[PMAN-Mart] Thông báo Hủy đơn & Hoàn tiền cho đơn hàng #${orderCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 24px; border-radius: 12px;">
        <h2 style="color: #d97706; margin-top: 0;">Thông báo Hủy đơn & Hoàn tiền</h2>
        <p>Kính chào quý khách,</p>
        <p>Chúng tôi rất tiếc phải thông báo rằng đơn hàng <strong>#${orderCode}</strong> đã bị hủy vì lý do:</p>
        <div style="background:#fffbe6; padding:12px 16px; border-left: 4px solid #f59e0b; margin:16px 0; font-weight:bold; color: #b45309;">
          ${reason}
        </div>
        <p>Vì bạn đã thanh toán trực tuyến số tiền <strong>${formatVND(amount)}</strong>, siêu thị đã tiến hành lệnh <strong>Hoàn tiền 100%</strong> cho bạn.</p>
        <p>Tiền hoàn sẽ ghi có vào tài khoản của bạn trong thời gian sớm nhất. Xin chân thành cảm ơn và cáo lỗi vì sự bất tiện này!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color:#888; font-size:12px;">PMAN-Mart Customer Support</p>
      </div>
    `,
  });
};
/**
 * Shared backend utility that keeps this concern consistent across feature modules.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
