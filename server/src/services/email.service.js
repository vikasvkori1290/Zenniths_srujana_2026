import nodemailer from 'nodemailer';

/**
 * Get or create Nodemailer transporter
 */
const getTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // If specific SMTP host is provided, use it; otherwise default to Gmail service
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

/**
 * Generate responsive HTML email template
 */
const generateEmailTemplate = ({ title, preheader, headline, bodyText, otp, type }) => {
  const isReset = type === 'reset';
  const accentColor = isReset ? '#d97706' : '#eab308';
  const badgeBg = isReset ? '#fef3c7' : '#fef9c3';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 540px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 28px 32px; text-align: center;">
      <div style="display: inline-block; background-color: ${accentColor}; color: #000000; font-weight: 900; font-size: 14px; padding: 4px 12px; border-radius: 8px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px;">
        FinSafe
      </div>
      <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
        ${headline}
      </h1>
      <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">
        ${preheader}
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 32px 28px 32px; text-align: center;">
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569; text-align: left;">
        ${bodyText}
      </p>

      <!-- 6-Digit OTP Box -->
      <div style="margin: 24px 0; padding: 20px; background: ${badgeBg}; border: 2px dashed ${accentColor}; border-radius: 16px;">
        <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #78350f; margin-bottom: 6px;">
          Your 6-Digit Verification Code
        </span>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f172a; text-indent: 8px;">
          ${otp}
        </div>
      </div>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 12px 16px; margin-top: 20px; text-align: left;">
        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          ⏱ <strong>Valid for 10 minutes.</strong> Never share this code with anyone. FinSafe support representatives will never ask for your verification code.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8;">
        Sent securely by FinSafe Cash Engine & Merchant Ledger
      </p>
      <p style="margin: 0; font-size: 10px; color: #cbd5e1;">
        If you did not initiate this request, you can safely ignore this email.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
};

/**
 * Dispatch OTP email to recipient
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.otp - 6-digit verification code
 * @param {'registration'|'reset'} params.type - Verification type
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export const sendOtpEmail = async ({ to, otp, type = 'registration' }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[EMAIL SERVICE] (Mock / Local Mode) No EMAIL_USER/EMAIL_PASS configured. Code for ${to} is: ${otp}`);
    return {
      sent: false,
      reason: 'No SMTP credentials configured. Set EMAIL_USER and EMAIL_PASS in server/.env for live delivery.',
    };
  }

  const isReset = type === 'reset';
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@finsafe.com';

  const headline = isReset ? 'Reset Your Account Password' : 'Verify Your Email Address';
  const preheader = isReset ? 'FinSafe Account Security' : 'FinSafe Merchant Onboarding';
  const bodyText = isReset
    ? 'We received a request to reset the password for your FinSafe merchant account. Enter the verification code below to establish a new secure password.'
    : 'Welcome to FinSafe! To activate your merchant account and secure your store ledger, please verify your email address using the code below.';

  const mailOptions = {
    from: `"FinSafe Security" <${fromAddress}>`,
    to,
    subject: `${otp} is your FinSafe verification code`,
    text: `Your FinSafe verification code is: ${otp}. It will expire in 10 minutes.`,
    html: generateEmailTemplate({
      title: `FinSafe Verification Code: ${otp}`,
      preheader,
      headline,
      bodyText,
      otp,
      type,
    }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Live email delivered to ${to}. MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
};
