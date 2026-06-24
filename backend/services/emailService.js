import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function emailAgenda({
  to,
  subject,
  html,
  pdfBuffer,
  pdfFilename,
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to.join(", "),
    subject,
    html,
    attachments: pdfBuffer
      ? [
          {
            filename: pdfFilename || "agenda.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : [],
  });
}
