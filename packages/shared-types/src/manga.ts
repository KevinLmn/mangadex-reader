import { Static, Type } from "@sinclair/typebox";

export const MangaRelationship = Type.Object({
  type: Type.String(),
  id: Type.String(),
  attributes: Type.Object(
    {
      fileName: Type.Optional(Type.String()),
      name: Type.Optional(Type.String()),
    },
    { additionalProperties: true }
  ),
});
export type MangaRelationship = Static<typeof MangaRelationship>;

export const Manga = Type.Object({
  id: Type.String(),
  attributes: Type.Object({
    title: Type.Object({ en: Type.String() }),
    description: Type.Object({ en: Type.String() }),
    tags: Type.Array(
      Type.Object({
        attributes: Type.Object({
          name: Type.Object({ en: Type.String() }),
        }),
      })
    ),
    lastChapter: Type.Optional(Type.String()),
    updatedAt: Type.Optional(Type.String()),
  }),
  relationships: Type.Array(MangaRelationship),
});
export type Manga = Static<typeof Manga>;

export const Chapter = Type.Object({
  id: Type.String(),
  attributes: Type.Object({
    chapter: Type.String(),
    title: Type.String(),
    volume: Type.String(),
    pages: Type.Number(),
    publishAt: Type.String(),
    id: Type.String(),
  }),
});
export type Chapter = Static<typeof Chapter>;
