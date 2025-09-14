import { Hono } from "hono";
import { signupValidator } from "../schemas/signup-schema";
import { getUserByEmail, insertUser } from "../db/queries";
import { dbConn } from "../db/db";
import { cookieOptions, generateToken } from "../helpers";
import { setCookie } from "hono/cookie";

const authRouter = new Hono();

authRouter.post("/signup", signupValidator, async (c) => {
  const db = dbConn();
  const { email, password } = c.req.valid("json");
  try {
    const userId = await insertUser(db, email, password);
    const token = await generateToken(userId);
    setCookie(c, "authToken", token, cookieOptions);
    return c.json({
      message: "User registered successfully!",
      user: { id: userId, email: email },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return c.json({ errors: ["Email already exists"] }, 409);
    }
    console.log("signup error:", error);
    return c.json({ errors: ["Internal server error"] }, 500);
  }
});

authRouter.post("/login", signupValidator, async (c) => {
  const db = dbConn();
  const { email, password } = c.req.valid("json");

  try {
    const user = getUserByEmail(db, email);
    if (!user) return c.json({ errors: ["Invalid credentials"] }, 401);

    const passwordMatch = await Bun.password.verify(
      password,
      user.password_hash
    );
    if (!passwordMatch) return c.json({ errors: ["Invalid credentials"] }, 401);

    const token = await generateToken(user.id);
    setCookie(c, "authToken", token, cookieOptions);

    return c.json({
      message: "Login successful",
      user: { id: user.id, email: email },
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default authRouter;
