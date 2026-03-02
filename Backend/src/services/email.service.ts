import nodemailer from 'nodemailer';

/**
 * Email Service for StockConnect using Nodemailer
 */

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (params: { to: string; subject: string; text: string }) => {
  const { to, subject, text } = params;
  
  // If no credentials are provided, fall back to mock logging
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('----------------------------------------------------------');
    console.log('📧 MOCK EMAIL (No SMTP credentials found in .env)');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${text}`);
    console.log('----------------------------------------------------------');
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"StockConnect" <noreply@stockconnect.com>',
      to,
      subject,
      text,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">StockConnect</h2>
          <p>${text}</p>
          <hr />
          <small>If you did not request this code, please ignore this email.</small>
        </div>
      `,
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error };
  }
};

export default { sendEmail };
