import nodemailer from "nodemailer";

// Use Gmail App Password or transactional email service
const transporter = nodemailer.createTransport({
  service: "gmail", // or "Brevo"/"SendGrid" SMTP
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.EMAIL_PASS, // Gmail App Password required
  },
});

// Send email function
const sendMail = async ({ to, subject, body }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      html: body, // Use 'html' instead of 'body'
    });
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

export default sendMail;
