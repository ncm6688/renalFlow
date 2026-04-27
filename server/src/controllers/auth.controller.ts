import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model';
import { generateAccessToken, generateRefreshToken} from '../utils/jwt';
import { redis } from '../lib/redis';
import { HydratedDocument } from 'mongoose';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../config/env';
import { Types } from 'mongoose';

const parseAdminEmails = () => {
    const raw = process.env.ADMIN_EMAILS || "";
    return new Set(
        raw
            .split(",")
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)
    );
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const adminEmails = parseAdminEmails();
        const role: IUser["role"] = adminEmails.has(String(email).trim().toLowerCase()) ? "admin" : "customer";

        const user: HydratedDocument<IUser> = new User({ name, email, password, role });
        await user.save();

        // minimal MVP: return tokens so web/mobile can sign in immediately
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        await redis.set(`refresh_token:${user._id.toString()}`, refreshToken, "EX", 7 * 24 * 60 * 60);

        return res.status(201).json({
            message: 'Registration successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
         });
    } catch (error) {
        console.error("Registration failed", error);
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return res.status(500).json({ message: `Registration failed: ${errorMessage}` });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const ok = await user.comparePassword(password);
        if (!ok) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        await redis.set(`refresh_token:${user._id.toString()}`, refreshToken, "EX", 7 * 24 * 60 * 60);

        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Login failed", error);
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return res.status(500).json({ message: `Login failed: ${errorMessage}` });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Password reset link sent to your email' });
};
export const resetPassword = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Password reset successful' });
};
export const logout = async (req: Request, res: Response) => {
    const { userId } = req.body || {};
    if (userId) {
        await redis.del(`refresh_token:${String(userId)}`);
    }
    res.status(200).json({ message: 'Logout successful' });
};
export const getMe = async (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing access token' });
    }
    const token = auth.slice('Bearer '.length);
    try {
        const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string };
        const user = await User.findById(payload.userId).select('_id name email role');
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json({ user });
    } catch {
        return res.status(401).json({ message: 'Invalid access token' });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }
    
    try {
        const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };
        const savedRefreshToken = await redis.get(`refresh_token:${payload.userId}`);

        if (!savedRefreshToken) {
            return res.status(401).json({ message: 'No refresh token' });
        }
        if (savedRefreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = generateAccessToken(new Types.ObjectId(payload.userId));
        const newRefreshToken = generateRefreshToken(new Types.ObjectId(payload.userId)); //renew refresh token for safety
        
        await redis.set(`refresh_token:${payload.userId}`, newRefreshToken, "EX", 7 * 24 * 60 * 60);
        return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    }catch (error) {
        console.error("Refresh token error", error);
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return res.status(500).json({ message: `Refresh token failed: ${errorMessage}` });
    }
};
