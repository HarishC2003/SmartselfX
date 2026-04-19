import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const isSmtpConfigured = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER !== 'your_smtp_user' &&
    process.env.SMTP_PASS !== 'your_smtp_password'
  );
};

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,      // false = STARTTLS (required for port 587)
  requireTLS: true,   // force TLS upgrade
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getEmailTemplate = (title, content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0F172A; color: #F1F5F9; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #1E293B; padding: 20px; text-align: center; border-bottom: 2px solid #6366F1;">
      <h1 style="color: #6366F1; margin: 0;">SmartShelfX</h1>
      <p style="color: #22D3EE; margin: 5px 0 0 0;">AI-Powered Inventory Intelligence</p>
    </div>
    <div style="padding: 30px; background-color: #0F172A;">
      <h2 style="color: #F1F5F9; margin-top: 0;">${title}</h2>
      ${content}
    </div>
    <div style="text-align: center; padding: 15px; background-color: #1E293B; font-size: 12px; color: #94A3B8;">
      &copy; ${new Date().getFullYear()} SmartShelfX. All rights reserved.
    </div>
  </div>
`;

export const sendVerificationEmail = async (to, name, verificationLink) => {
  const content = `
    <p>Hi ${name},</p>
    <p>Welcome to SmartShelfX! Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" style="background-color: #6366F1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
    </div>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #22D3EE;">${verificationLink}</p>
    <p>This link will expire in 24 hours.</p>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify your SmartShelfX account',
    html: getEmailTemplate('Email Verification', content),
  };

  if (!isSmtpConfigured()) {
    console.warn('[MAIL] SMTP not configured. Skipping verification email to:', to);
    return;
  }
  
  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('[MAIL] SMTP error sending verification email:', error);
    return null;
  }
};

export const sendPasswordResetEmail = async (to, name, resetLink) => {
  const content = `
    <p>Hi ${name},</p>
    <p>We received a request to reset your SmartShelfX password. Click the button below to choose a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #6366F1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #22D3EE;">${resetLink}</p>
    <p>This link will expire in 1 hour.</p>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your SmartShelfX password',
    html: getEmailTemplate('Password Reset', content),
  };

  if (!isSmtpConfigured()) {
    console.warn('[MAIL] SMTP not configured. Skipping password reset email to:', to);
    return;
  }
  
  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('[MAIL] SMTP error sending password reset email:', error);
    return null;
  }
};

export const sendMail = async (to, subject, content) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: getEmailTemplate('Purchase Order Update', content),
  };

  if (!isSmtpConfigured()) {
    console.warn('[MAIL] SMTP not configured. Skipping email to:', to);
    return;
  }
  
  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('[MAIL] SMTP error sending email:', error);
    return null;
  }
};

import {
  getPOCreatedEmailForVendor,
  getPOApprovedEmailForManager,
  getPORejectedEmailForManager,
  getPOReceivedEmailForVendor,
  getPOCancelledEmail
} from './emailTemplates.js';

export const sendPOCreatedToVendor = async (to, data) => {
  if (!isSmtpConfigured()) return console.warn('[MAIL] SMTP off. Skip PO created email:', to);
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
      to, 
      subject: `📦 New Purchase Order ${data.poNumber} — Action Required`, 
      html: getPOCreatedEmailForVendor(data)
    });
    return info;
  } catch (error) {
    console.error('[MAIL] SMTP failure sending PO Created email:', error);
    return null;
  }
};

export const sendPOApprovedToManager = async (to, data) => {
  if (!isSmtpConfigured()) return console.warn('[MAIL] SMTP off. Skip PO approved email:', to);
  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
      to, subject: `✅ PO ${data.poNumber} Approved by Vendor`, html: getPOApprovedEmailForManager(data)
    });
  } catch (error) {
    console.error('[MAIL] SMTP failure sending PO Approved email:', error);
    return null;
  }
};

export const sendPORejectedToManager = async (to, data) => {
  if (!isSmtpConfigured()) return console.warn('[MAIL] SMTP off. Skip PO rejected email:', to);
  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
      to, subject: `❌ PO ${data.poNumber} Rejected by Vendor`, html: getPORejectedEmailForManager(data)
    });
  } catch (error) {
    console.error('[MAIL] SMTP failure sending PO Rejected email:', error);
    return null;
  }
};

export const sendPOReceivedToVendor = async (to, data) => {
  if (!isSmtpConfigured()) return console.warn('[MAIL] SMTP off. Skip PO received email:', to);
  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
      to, subject: `📬 PO ${data.poNumber} Marked as Received`, html: getPOReceivedEmailForVendor(data)
    });
  } catch (error) {
    console.error('[MAIL] SMTP failure sending PO Received email:', error);
    return null;
  }
};

export const sendPOCancelledEmail = async (to, data) => {
  if (!isSmtpConfigured()) return console.warn('[MAIL] SMTP off. Skip PO cancelled email:', to);
  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
      to, subject: `🚫 PO ${data.poNumber} Has Been Cancelled`, html: getPOCancelledEmail(data)
    });
  } catch (error) {
    console.error('[MAIL] SMTP failure sending PO Cancelled email:', error);
    return null;
  }
};

export default sendMail;
