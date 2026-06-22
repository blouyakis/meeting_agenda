import { Router } from "express";
import { requireAuth } from "../utils/auth.js";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

const router = Router();

router.use(requireAuth);
router.get("/", getEmployees);
router.post("/", addEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
