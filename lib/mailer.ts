import nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM?.endsWith('@gmail.com') 
          ? 'DevManager Pro <onboarding@resend.dev>' 
          : (process.env.EMAIL_FROM || 'DevManager Pro <onboarding@resend.dev>'),
        to: [to],
        subject,
        html,
        attachments: attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
        })),
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Resend catch error:', error);
      // Fallback to SMTP if Resend fails? 
      // For now just rethrow
      throw error;
    }
  }

  // Fallback to SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"DevManager Pro" <noreply@example.com>',
    to,
    subject,
    html,
    attachments,
  });

  return info;
}
