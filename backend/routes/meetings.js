import { Router } from "express";
import { ObjectId } from "mongodb";
import { requireAuth } from "../utils/auth.js";
import {
  getMeetings,
  getMeeting,
  createMeetingDoc,
  updateMeeting,
  deleteMeeting,
} from "../controllers/meetingController.js";
import { generateAgendaPDF } from "../services/pdfService.js";
import { emailAgenda } from "../services/emailService.js";
import { getDB } from "../config/database.js";
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

const router = Router();
router.use(requireAuth);

router.get("/", getMeetings);
router.get("/:id", getMeeting);
router.post("/", createMeetingDoc);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);

router.get("/:id/pdf", async (req, res) => {
  const db = getDB();
  const meeting = await db
    .collection("meetings")
    .findOne({ _id: new ObjectId(req.params.id), userId: req.userId });
  if (!meeting) return res.status(404).json({ error: "Not found" });
  const attendees = await db
    .collection("employees")
    .find({ _id: { $in: meeting.attendeeIds.map((id) => new ObjectId(id)) } })
    .toArray();
  const pdf = await generateAgendaPDF(
    meeting,
    attendees,
    meeting.steepness ?? 0.5,
  );
  const safeTitle = (meeting.title || "agenda").replace(/[^a-z0-9]/gi, "_");
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
  });
  res.send(pdf);
});

router.post("/:id/email", async (req, res) => {
  const db = getDB();
  const meeting = await db
    .collection("meetings")
    .findOne({ _id: new ObjectId(req.params.id), userId: req.userId });
  if (!meeting) return res.status(404).json({ error: "Not found" });
  const attendees = await db
    .collection("employees")
    .find({ _id: { $in: meeting.attendeeIds.map((id) => new ObjectId(id)) } })
    .toArray();
  const withEmail = attendees.filter((a) => a.email);
  const withoutEmail = attendees.filter((a) => !a.email);
  const emails = withEmail.map((a) => a.email);
  if (!emails.length)
    return res
      .status(400)
      .json({ error: "No attendees have an email address on file." });
  const topics =
    meeting.startTime && meeting.endTime
      ? allocateTopicTimes(
          meeting.topics.filter((t) => t.text?.trim()),
          meeting.startTime,
          meeting.endTime,
          meeting.steepness ?? 0.5,
        )
      : [...meeting.topics]
          .filter((t) => t.text?.trim())
          .sort((a, b) => a.priority - b.priority);
  const topicList = topics
    .map(
      (t) => `
    <li style="margin-bottom:0.75rem">
      ${t.topicStart ? `<b>${t.topicStart}</b> &nbsp; ` : ""}[Priority ${t.priority}] ${t.text}${t.minutes ? ` <i>(${t.minutes} min)</i>` : ""}
      ${t.notes ? `<br/><span style="color:#64748b;font-size:0.9em">Notes: ${t.notes}</span>` : ""}
      ${t.actionItems?.length ? `<br/><span style="font-size:0.9em">Action Items: ${t.actionItems.join(", ")}</span>` : ""}
    </li>`,
    )
    .join("");
  const attendeeList = attendees
    .map((a) => `<li>${a.lastName}, ${a.firstName}</li>`)
    .join("");
  const timeLine = meeting.startTime
    ? `<p><b>Start:</b> ${formatDateTime(meeting.startTime)}</p>${meeting.endTime ? `<p><b>End:</b> ${formatDateTime(meeting.endTime)}</p>` : ""}`
    : "";
  const pdfBuffer = await generateAgendaPDF(
    meeting,
    attendees,
    meeting.steepness ?? 0.5,
  );
  try {
    await emailAgenda({
      to: emails,
      subject: `Meeting Agenda: ${meeting.title}`,
      html: `<h2>${meeting.title}</h2><p><b>Location:</b> ${meeting.location}</p>${timeLine}<h3>Topics</h3><ul>${topicList}</ul><h3>Attendees</h3><ul>${attendeeList}</ul>`,
      pdfBuffer,
      pdfFilename: `${meeting.title.replace(/[^a-z0-9]/gi, "_")}_agenda.pdf`,
    });
    const skipped = withoutEmail.map((a) => `${a.lastName}, ${a.firstName}`);
    res.json({ message: "Emails sent", skipped });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({
      error: "Failed to send email. Check your email credentials in .env.",
    });
  }
});

export default router;
