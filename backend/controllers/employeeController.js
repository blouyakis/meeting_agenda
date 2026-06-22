import { getDB } from "../config/database.js";
import { ObjectId } from "mongodb";
import { createEmployee } from "../models/employeeModel.js";

export async function getEmployees(req, res) {
  const db = getDB();
  const employees = await db
    .collection("employees")
    .find({ userId: req.userId })
    .sort({ lastName: 1, firstName: 1 })
    .toArray();
  res.json(employees);
}

export async function addEmployee(req, res) {
  const db = getDB();
  const employee = createEmployee({ userId: req.userId, ...req.body });
  const result = await db.collection("employees").insertOne(employee);
  res.status(201).json({ _id: result.insertedId, ...employee });
}

export async function updateEmployee(req, res) {
  const db = getDB();
  const { id } = req.params;
  const { firstName, lastName, email, phone, department } = req.body;
  await db
    .collection("employees")
    .updateOne(
      { _id: new ObjectId(id), userId: req.userId },
      { $set: { firstName, lastName, email, phone, department } },
    );
  res.json({ message: "Updated" });
}

export async function deleteEmployee(req, res) {
  const db = getDB();
  const { id } = req.params;
  await db
    .collection("employees")
    .deleteOne({ _id: new ObjectId(id), userId: req.userId });
  await db
    .collection("meetings")
    .updateMany({ userId: req.userId }, { $pull: { attendeeIds: id } });
  res.json({ message: "Deleted" });
}
