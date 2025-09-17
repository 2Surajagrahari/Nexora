import User from "../models/User.js";
import jwt from "jsonwebtoken";
export async function signup(req, res) {
    const { email, password, fullName } = req.body

    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use, Please use a different one" });
        }

        const idx = Math.floor(Math.random() * 100) + 1; // Random number between 1 and 100
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`

        const newUser = await User.create({
            email,
            password,
            fullName,
            ProfilePic: randomAvatar
        });



        //TODO: CREATE THE USER IN STREAM AS WELL

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })

        res.cookie("jwt", token, {
            httpOnly: true, //prevent XSS attacks
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict", // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        res.status(201).json({
            success: true,
            user: newUser,
        });

    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function login(req, res) {
    res.send("Login route");
}

export function logout(req, res) {
    res.send("Logout route");
}