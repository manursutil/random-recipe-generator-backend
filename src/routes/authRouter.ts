import { Hono } from "hono";
import { signupValidator } from "../schemas/signup-schema";
import { getUserByEmail, getUserById, insertUser } from "../db/queries";
import { dbConn } from "../db/db";
import { cookieOptions, generateToken } from "../helpers";
import { deleteCookie, setCookie } from "hono/cookie";

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

authRouter.post("/logout", async (c) => {
  deleteCookie(c, "authToken", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    httpOnly: true,
  });

  return c.json({ message: "Logout successful" });
});

authRouter.get("/me", async (c) => {
  const db = dbConn();
  const payload = c.get("jwtPayload");

  try {
    const user = getUserById(db, payload.sub);
    if (!user) return c.json({ error: "User not found" }, 400);

    return c.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error("Error fetching user data: ", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default authRouter;
