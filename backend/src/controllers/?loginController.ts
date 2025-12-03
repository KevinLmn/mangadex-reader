import axios from "axios";
import dotenv from "dotenv";
import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../prisma.js";
import { AuthService } from "../services/authService.js";
dotenv.config();

type LoginRequestBody = {
  username: string;
  password: string;
};

type LoginControllerReturnType = {
  success: boolean;
  access_token?: string;
  error?: string;
};

export const loginController = async (
  request: FastifyRequest<{ Body: LoginRequestBody }>,
  reply: FastifyReply
): Promise<LoginControllerReturnType> => {
  try {
    console.log("Starting login process...");

    if (
      !process.env.MANGADEX_USERNAME ||
      !process.env.MANGADEX_PASSWORD ||
      !process.env.MANGADEX_CLIENT_ID ||
      !process.env.MANGADEX_CLIENT_SECRET
    ) {
      throw new Error(
        "MangaDex credentials not found in environment variables"
      );
    }

    console.log("Making request to MangaDex auth endpoint...");
    const tokens = await AuthService.getTokens();

    console.log("Saving token to database...");
    await prisma.token.create({
      data: {
        token: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
    });

    return { success: true, access_token: tokens.access_token };
  } catch (error) {
    console.error("Login error details:", {
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      data: axios.isAxiosError(error) ? error.response?.data : undefined,
      headers: axios.isAxiosError(error) ? error.response?.headers : undefined,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      error: axios.isAxiosError(error)
        ? error.response?.data?.error_description
        : error instanceof Error
        ? error.message
        : "Unknown error",
    };
  }
};
