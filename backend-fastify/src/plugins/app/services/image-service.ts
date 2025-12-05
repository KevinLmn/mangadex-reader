import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Writable } from "stream";
import { createImageService } from "../../../services/image-service.js";

export interface ImageService {
  downloadSingleImage: (url: string, index: number, total: number) => Promise<Buffer>;
  downloadImages: (urls: string[]) => Promise<Buffer[]>;
  processImages: (imageBuffers: Buffer[]) => Promise<Buffer>;
  assembleImagesAndStream: (urls: string[], writeStream: Writable) => Promise<void>;
}

declare module "fastify" {
  interface FastifyInstance {
    imageService: ImageService;
  }
}

const imageServicePlugin: FastifyPluginAsync = async (fastify) => {
  const imageService = createImageService();
  fastify.decorate("imageService", imageService);
};

export default fp(imageServicePlugin, {
  name: "image-service",
});
