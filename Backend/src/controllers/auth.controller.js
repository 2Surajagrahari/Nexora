import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { upsertStreamUser } from "../lib/stream.js";

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



        try {
            await upsertStreamUser({
                id: newUser._id.toString(),
                name: newUser.fullName,
                image: newUser.ProfilePic || "",
            });
            console.log(`Stream user created/updated for ${newUser.fullName}`);
        } catch (error) {
            console.error("Error creating Stream user:", error);
        }

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
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isPasswordCorrect = await user.matchPassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })

        res.cookie("jwt", token, {
            httpOnly: true, //prevent XSS attacks
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict", // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        res.status(201).json({
            success: true, user
        });


    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export function logout(req, res) {
    res.clearCookie("jwt")
    res.status(200).json({ success: true, message: "Logged out successfully" });
}

export async function onboard(req, res) {
    try {
        const userId = req.user._id;
        const { bio, nativeLanguage, learningLanguage, location, fullName } = req.body;
        if (!bio || !nativeLanguage || !learningLanguage || !location || !fullName) {
            return res.status(400).json({
                message: "All fields are required",
                missingFields: [
                    !bio && "bio",
                    !nativeLanguage && "nativeLanguage",
                    !learningLanguage && "learningLanguage",
                    !location && "location",
                    !fullName && "fullName"
                ].filter(Boolean),
            });
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {
            ...req.body,
            isOnboarded: true
        }, { new: true }).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        try {
            await upsertStreamUser({
                id: updatedUser._id.toString(),
                name: updatedUser.fullName,
                image: updatedUser.ProfilePic || "",
            })

            console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);

        } catch (streamError) {
            console.log("Error updating Stream user after onboarding:", streamError.message);
        }

        res.status(200).json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("onboarding error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}