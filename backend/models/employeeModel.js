// { _id, userId, firstName, lastName, email, phone, department }
export function createEmployee({
  userId,
  firstName,
  lastName,
  email,
  phone,
  department,
}) {
  return {
    userId,
    firstName,
    lastName,
    email: email || "",
    phone: phone || "",
    department: department || "",
  };
}
