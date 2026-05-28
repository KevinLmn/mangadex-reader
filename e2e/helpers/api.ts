import { request, APIRequestContext } from "@playwright/test";

const API = process.env.E2E_API_URL ?? "http://localhost:3022";

export async function apiContext(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API });
}

export async function registerUser(
  email = `e2e_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
  password = "password123"
) {
  const ctx = await apiContext();
  const res = await ctx.post("/api/auth/register", {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`register failed ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  await ctx.dispose();
  return { email, password, token: body.token as string, id: body.user.id as string };
}

export async function getProgress(token: string, mangaId: string) {
  const ctx = await apiContext();
  const res = await ctx.get(`/api/progress/${mangaId}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  await ctx.dispose();
  return body;
}
