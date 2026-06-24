import { getDB } from "../config/database.js";
import { ObjectId } from "mongodb";
import { createMeeting } from "../models/meetingModel.js";

export async function getMeetings(req, res) {
  const db = getDB();
  const meetings = await db
    .collection("meetings")
    .find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(meetings);
}

export async function getMeeting(req, res) {
  const db = getDB();
  const meeting = await db.collection("meetings").findOne({
    _id: new ObjectId(req.params.id),
    userId: req.userId,
  });
  if (!meeting) return res.status(404).json({ error: "Not found" });
  res.json(meeting);
}

export async function createMeetingDoc(req, res) {
  const db = getDB();
  const meeting = createMeeting({ userId: req.userId, ...req.body });
  const result = await db.collection("meetings").insertOne(meeting);
  res.status(201).json({ _id: result.insertedId, ...meeting });
}

export async function deleteMeeting(req, res) {
  const db = getDB();
  await db.collection("meetings").deleteOne({
    _id: new ObjectId(req.params.id),
    userId: req.userId,
  });
  res.json({ message: "Deleted" });
}

export async function updateMeeting(req, res) {
  const db = getDB();
  const {
    title,
    location,
    startTime,
    endTime,
    topics,
    attendeeIds,
    steepness,
  } = req.body;
  await db.collection("meetings").updateOne(
    { _id: new ObjectId(req.params.id), userId: req.userId },
    {
      $set: {
        title,
        location,
        startTime,
        endTime,
        topics,
        attendeeIds,
        steepness,
      },
    },
  );
  res.json({
    _id: req.params.id,
    title,
    location,
    startTime,
    endTime,
    topics,
    attendeeIds,
    steepness,
  });
}
