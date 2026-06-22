import PDFDocument from "pdfkit";
import { allocateTopicTimes } from "../utils/timeAllocation.js";

function formatDateTime(str) {
  const [date, time] = str.split("T");
  const [year, month, day] = date.split("-");
  const [hour, min] = time.split(":");
  const h = parseInt(hour);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${month}/${day}/${year}, ${h12}:${min} ${ampm}`;
}

export function generateAgendaPDF(meeting, attendees) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text(meeting.title, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Location: ${meeting.location}`);
    if (meeting.startTime)
      doc.text(`Start: ${formatDateTime(meeting.startTime)}`);
    if (meeting.endTime) doc.text(`End:   ${formatDateTime(meeting.endTime)}`);
    doc.moveDown();

    doc.fontSize(14).text("Topics");
    const topics =
      meeting.startTime && meeting.endTime
        ? allocateTopicTimes(meeting.topics, meeting.startTime, meeting.endTime)
        : [...meeting.topics].sort((a, b) => a.priority - b.priority);
    topics.forEach((t) => {
      const timePrefix = t.topicStart ? `${t.topicStart}  ` : "";
      const duration = t.minutes ? ` (${t.minutes} min)` : "";
      doc
        .fontSize(12)
        .text(`  ${timePrefix}[Priority ${t.priority}] ${t.text}${duration}`);
      if (t.notes)
        doc
          .fontSize(10)
          .fillColor("#64748b")
          .text(`    Notes: ${t.notes}`)
          .fillColor("black");
      if (t.actionItems?.length)
        doc.fontSize(10).text(`    Action Items: ${t.actionItems.join(", ")}`);
      doc.moveDown(0.3);
    });
    doc.moveDown();

    doc.fontSize(14).text("Attendees");
    attendees.forEach((a) => {
      doc.fontSize(12).text(`  • ${a.lastName}, ${a.firstName}`);
    });

    doc.end();
  });
}
