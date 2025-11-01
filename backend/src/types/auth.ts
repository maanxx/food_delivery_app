import { Request } from "express";
import { TokenPayload } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
    user: TokenPayload;
    userId: string;
}
