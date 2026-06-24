import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env") });

export async function emailAgenda({
  to,
  subject,
  html,
  pdfBuffer,
  pdfFilename,
}) {
  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({
    email,
  }));

  const body = {
    sender: {
      name: process.env.EMAIL_FROM_NAME,
      email: process.env.EMAIL_FROM,
    },
    to: recipients,
    subject,
    htmlContent: html,
  };

  if (pdfBuffer) {
    body.attachment = [
      {
        name: pdfFilename || "agenda.pdf",
        content: pdfBuffer.toString("base64"),
      },
    ];
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Brevo email failed");
  }
}
