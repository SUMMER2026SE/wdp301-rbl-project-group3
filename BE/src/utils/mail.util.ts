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
    subject: 'Xác thực email - MiniMart',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d7a4f;">Xác thực Email của bạn</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản MiniMart.</p>
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
    subject: 'Đặt lại mật khẩu - MiniMart',
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