export async function emailAgenda({
  to,
  subject,
  html,
  pdfBuffer,
  pdfFilename,
}) {
  const body = {
    sender: { name: "Agenda Agent", email: process.env.EMAIL_FROM },
    to: (Array.isArray(to) ? to : [to]).map((email) => ({ email })),
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
