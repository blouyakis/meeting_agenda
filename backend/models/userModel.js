// { _id, email, passwordHash, createdAt }
export function createUser({ email, passwordHash }) {
  return {
    email,
    passwordHash,
    createdAt: new Date(),
  };
}
