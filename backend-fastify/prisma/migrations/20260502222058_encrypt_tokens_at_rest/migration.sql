-- Encrypt-at-rest for MangaDex tokens.
-- The `token` column is no longer searchable (random IV per write), so we add
-- `tokenHash` (HMAC-SHA256 hex digest) as the new unique lookup key.
--
-- Existing rows hold plaintext tokens that we cannot re-encrypt without the new
-- key, and MangaDex access tokens expire after ~15 minutes anyway, so the
-- safest path is to drop the existing rows and let clients re-login.

TRUNCATE TABLE "Token" RESTART IDENTITY;

ALTER TABLE "Token" DROP CONSTRAINT IF EXISTS "Token_token_key";
DROP INDEX IF EXISTS "Token_token_key";

ALTER TABLE "Token" ADD COLUMN "tokenHash" TEXT NOT NULL;

CREATE UNIQUE INDEX "Token_tokenHash_key" ON "Token"("tokenHash");
