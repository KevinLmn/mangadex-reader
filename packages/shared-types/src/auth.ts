import { Static, Type } from "@sinclair/typebox";

export const AuthCredentials = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 }),
});
export type AuthCredentials = Static<typeof AuthCredentials>;

export const AuthUser = Type.Object({
  id: Type.String(),
  email: Type.String(),
});
export type AuthUser = Static<typeof AuthUser>;

export const AuthSuccessResponse = Type.Object({
  user: AuthUser,
  token: Type.String(),
});
export type AuthSuccessResponse = Static<typeof AuthSuccessResponse>;

export const AuthErrorResponse = Type.Object({
  error: Type.String(),
});
export type AuthErrorResponse = Static<typeof AuthErrorResponse>;
