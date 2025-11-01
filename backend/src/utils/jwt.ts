import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-this-in-production";
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || "30d";

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export class JWTUtils {
    // Generate access token
    static generateAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRE,
            issuer: "eatsy-api",
            audience: "eatsy-app",
        });
    }

    // Generate refresh token
    static generateRefreshToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
        return jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRE,
            issuer: "eatsy-api",
            audience: "eatsy-app",
        });
    }

    // Generate both tokens
    static generateTokenPair(payload: Omit<TokenPayload, "iat" | "exp">): TokenPair {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }

    // Verify access token
    static verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, JWT_SECRET, {
                issuer: "eatsy-api",
                audience: "eatsy-app",
            }) as TokenPayload;
        } catch {
            throw new Error("Invalid or expired access token");
        }
    }

    // Verify refresh token
    static verifyRefreshToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET, {
                issuer: "eatsy-api",
                audience: "eatsy-app",
            }) as TokenPayload;
        } catch {
            throw new Error("Invalid or expired refresh token");
        }
    }

    // Decode token without verification (for expired token info)
    static decodeToken(token: string): TokenPayload | null {
        try {
            return jwt.decode(token) as TokenPayload;
        } catch {
            return null;
        }
    }

    // Check if token is expired
    static isTokenExpired(token: string): boolean {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) return true;

            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch {
            return true;
        }
    }

    // Extract token from Authorization header
    static extractTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader) return null;

        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") return null;

        return parts[1];
    }
}

export default JWTUtils;
