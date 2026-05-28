import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { MangaDexService } from "../plugins/app/services/manga-dex-service.js";
import { ServerError } from "../utils/index.js";
import { AuthService } from "./auth-service.js";
import { decrypt, encrypt, hmac } from "./crypto.js";

const BASE_URL = process.env.MANGADEX_BASE_URL || "https://api.mangadex.org";

export function createMangaDexService(
  prisma: PrismaClient,
  authService: AuthService
): MangaDexService {
  return {
    getAuthHeaders: async () => {
      // First, try to retrieve token from database
      console.log("Getting latest token from database...");
      const latestToken = await prisma.token.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!latestToken) {
        // No token in DB, get a new one
        console.log("No token found in database, getting new access token...");
        const accessToken = await authService.getAccessToken();
        return { Authorization: `Bearer ${accessToken}` };
      }

      // Check if token is still valid (MangaDex tokens typically expire after 15 minutes)
      const tokenAge = Date.now() - latestToken.createdAt.getTime();
      const tokenAgeMinutes = Math.floor(tokenAge / 1000 / 60);
      console.log("Found token created at:", latestToken.createdAt);
      console.log("Token age (minutes):", tokenAgeMinutes);

      // If token is less than 14 minutes old, use it
      if (tokenAgeMinutes < 14) {
        return { Authorization: `Bearer ${decrypt(latestToken.token)}` };
      }

      // Token is expired or close to expiry, try to refresh it
      if (latestToken.refreshToken) {
        console.log("Token expired, attempting to refresh...");
        try {
          const newTokens = await authService.refreshToken(
            decrypt(latestToken.refreshToken)
          );
          await prisma.token.update({
            where: { id: latestToken.id },
            data: {
              token: encrypt(newTokens.access_token),
              refreshToken: encrypt(newTokens.refresh_token),
              tokenHash: hmac(newTokens.access_token),
            },
          });
          return { Authorization: `Bearer ${newTokens.access_token}` };
        } catch (error) {
          console.log("Refresh failed, getting new token...");
        }
      }

      // Refresh failed or no refresh token, get a new one
      const accessToken = await authService.getAccessToken();
      return { Authorization: `Bearer ${accessToken}` };
    },

    async getMangaChapters(
      mangaId: string,
      limit: number = 100,
      offset: number = 0
    ) {
      try {
        const response = await axios.get(
          `${BASE_URL}/manga/${mangaId}/feed?includeFuturePublishAt=0`,
          {
            params: {
              limit,
              offset,
              "translatedLanguage[]": "en",
              includeEmptyPages: 0,
            },

            headers: await this.getAuthHeaders(),
          }
        );
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new ServerError(
            `Failed to fetch manga chapters: ${error.message}`,
            error.response?.status || 500,
            error.response?.data
          );
        }
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new ServerError(
          `Failed to fetch manga chapters: ${errorMessage}`
        );
      }
    },

    async getChapterDownloadLinks(chapterId: string): Promise<string[]> {
      try {
        console.log("Getting auth headers for chapter download...");
        const headers = await this.getAuthHeaders();
        console.log("Fetching chapter data from MangaDex...");

        const response = await axios.get(
          `${BASE_URL}/at-home/server/${chapterId}`,
          { headers }
        );

        if (!response.data?.chapter?.data) {
          console.error("Invalid response format:", response.data);
          throw new Error("Invalid response format from MangaDex");
        }

        const links = response.data.chapter.data.map(
          (scanData: string) =>
            `${response.data.baseUrl}/data/${response.data.chapter.hash}/${scanData}`
        );

        console.log(`Generated ${links.length} download links`);
        return links;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error("MangaDex API error:", {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
          });
          throw new ServerError(
            `Failed to fetch chapter download links: ${error.message}`,
            error.response?.status || 500,
            error.response?.data
          );
        }
        console.error("Non-Axios error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new ServerError(
          `Failed to fetch chapter download links: ${errorMessage}`
        );
      }
    },
  };
}
