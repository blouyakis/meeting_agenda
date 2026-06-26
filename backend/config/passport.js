import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { getDB } from "./database.js";
 
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false,
    },
    async (email, password, done) => {
      try {
        const user = await getDB().collection("users").findOne({ email });
        if (!user) {
          return done(null, false, { message: "Cannot find user" });
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: "Invalid password" });
        }
        const safeUser = { ...user };
        delete safeUser.passwordHash;
        return done(null, safeUser);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
export default passport;
