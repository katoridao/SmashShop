const crypto = require('crypto');
const { sendEmail } = require('../config/email');

const generateRandomPassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  const allChars = upper + lower + numbers + special;
  let password = '';

  for (let i = 0; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password;
};

const sendPasswordResetEmail = async (email, userName, newPassword) => {
  const subject = 'SmashShop - Mật khẩu mới của bạn';

  const html = `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 10px;">
      <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">SmashShop</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Hệ thống bán cầu lông chính hãng</p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; color: #333;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Xin chào <strong>${userName}</strong>,
        </p>

        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
          Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản SmashShop của bạn.
          Mật khẩu mới của bạn đã được tạo và sẵn sàng sử dụng ngay.
        </p>

        <div style="background: #f0f0f0; border-left: 4px solid #2563EB; padding: 15px; margin: 25px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 13px; color: #666; margin-bottom: 8px;">Mật khẩu mới của bạn:</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace; color: #2563EB; letter-spacing: 2px;">
            ${newPassword}
          </p>
        </div>

        <p style="font-size: 14px; color: #666; margin: 25px 0; line-height: 1.6;">
          <strong>Hướng dẫn:</strong><br>
          1. Đăng nhập với email: <strong>${email}</strong><br>
          2. Sử dụng mật khẩu vừa nhận được ở trên<br>
          3. Sau khi đăng nhập, hãy cập nhật mật khẩu của bạn trong phần "Thông tin cá nhân"
        </p>

        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 13px; color: #856404;">
            ⚠️ <strong>Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay.
          </p>
        </div>

        <p style="font-size: 13px; color: #999; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
          © 2026 SmashShop. All Rights Reserved.<br>
          Email: support@smashshop.vn | Hotline: 0123 456 789
        </p>
      </div>
    </div>
  `;

  await sendEmail(email, subject, html);
};

module.exports = {
  generateRandomPassword,
  sendPasswordResetEmail,
};
