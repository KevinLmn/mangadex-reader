import axios from "axios";
import type { FastifyBaseLogger } from "fastify";

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export class AuthService {
  private AUTH_URL =
    "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token";

  private credentials = {
    client_id: process.env.MANGADEX_CLIENT_ID!,
    client_secret: process.env.MANGADEX_CLIENT_SECRET!,
    username: process.env.MANGADEX_USERNAME!,
    password: process.env.MANGADEX_PASSWORD!,
  };

  private currentTokens: AuthTokens | null = null;
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  async getAccessToken(): Promise<string> {
    if (!this.currentTokens) {
      this.currentTokens = await this.login();
    }
    return this.currentTokens.access_token;
  }

  async getTokens(): Promise<AuthTokens> {
    if (!this.currentTokens) {
      this.currentTokens = await this.login();
    }
    return this.currentTokens;
  }

  private async login(): Promise<AuthTokens> {
    try {
      const response = await axios.post(
        this.AUTH_URL,
        new URLSearchParams({
          grant_type: "password",
          username: this.credentials.username,
          password: this.credentials.password,
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to authenticate with MangaDex: ${error.response?.data?.error || error.message}`
        );
      }
      throw new Error("Authentication failed");
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await axios.post(
        this.AUTH_URL,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      this.currentTokens = response.data;
      return response.data;
    } catch (error) {
      // If refresh fails, try logging in again
      if (axios.isAxiosError(error)) {
        // Log the refresh error but continue to login
        this.logger.warn(
          `Failed to refresh token: ${error.response?.data?.error || error.message}. Attempting login.`
        );
      }
      return this.login();
    }
  }
}
