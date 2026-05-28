import axios from 'axios'
import os from 'os'
import sharp from 'sharp'
import { Writable } from 'stream'
import { ImageService } from '../plugins/app/services/image-service.js'
import { ServerError } from '../utils/index.js'

/**
 * Service for handling manga image processing and streaming
 * Handles downloading, resizing, and assembling images into a single stream
 */
// Configuration constants
const WANTED_WIDTH = 1080
const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const CONCURRENT_DOWNLOADS = Math.max(2, Math.min(os.cpus().length - 1, 6)) // Limit concurrency based on CPU cores

export function createImageService(): ImageService {
  return {
    downloadSingleImage: async (
      url: string,
      index: number,
      total: number,
    ): Promise<Buffer> => {
      let retries = 0

      while (retries < MAX_RETRIES) {
        try {
          console.log(`Downloading image ${index + 1}/${total}...`)
          const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000, // 15 second timeout
            headers: {
              Accept: 'image/jpeg, image/png, image/webp, image/*',
              'User-Agent': 'MangaDB/1.0',
            },
          })
          const buffer = Buffer.from(response.data, 'binary')

          if (buffer.length === 0) {
            throw new Error('Empty response received')
          }

          console.log(
            `Successfully downloaded image ${index + 1}/${total} (${(
              buffer.length / 1024
            ).toFixed(1)} KB)`,
          )
          return buffer
        } catch (error) {
          retries++
          console.log(
            `Retry ${retries}/${MAX_RETRIES} for image ${index + 1}/${total}...`,
          )

          if (retries >= MAX_RETRIES) {
            if (axios.isAxiosError(error)) {
              throw new ServerError(
                `Failed to download image ${index + 1}/${total}: ${
                  error.message
                }`,
                error.response?.status || 500,
                error.response?.data,
              )
            }
            throw new ServerError(
              `Failed to download image ${index + 1}/${total}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            )
          }

          // Exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, retries - 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      // This should never be reached due to the throw above, but TypeScript needs it
      throw new ServerError(
        `Failed to download image ${index + 1}/${total}`,
        500,
      )
    },
    async downloadImages(urls: string[]): Promise<Buffer[]> {
      console.log(
        `Starting download of ${urls.length} images with ${CONCURRENT_DOWNLOADS} concurrent downloads...`,
      )

      // Prepare the result array with the correct length
      const results: Buffer[] = new Array(urls.length)
      let completed = 0

      // Process images in batches to control concurrency
      for (let i = 0; i < urls.length; i += CONCURRENT_DOWNLOADS) {
        const batch = urls.slice(i, i + CONCURRENT_DOWNLOADS)
        const batchIndexes = Array.from(
          { length: batch.length },
          (_, idx) => i + idx,
        )

        try {
          // Download batch concurrently
          const batchResults = await Promise.all(
            batch.map((url, idx) =>
              this.downloadSingleImage(url, batchIndexes[idx]!, urls.length),
            ),
          )

          // Store results in the correct position
          batchIndexes.forEach((originalIndex, idx) => {
            results[originalIndex] = batchResults[idx]!
          })

          completed += batch.length
          console.log(`Completed ${completed}/${urls.length} downloads`)
        } catch (error) {
          console.error('Error in download batch:', error)
          throw error
        }
      }

      console.log('All images downloaded successfully')
      return results
    },
    processImages: async (imageBuffers: Buffer[]): Promise<Buffer> => {
      console.log('Processing and assembling images...')

      try {
        // Process image metadata and resize images
        const images = await Promise.all(
          imageBuffers.map(async (buffer: Buffer, index: number) => {
            if (!buffer || buffer.length === 0) {
              throw new ServerError(
                `Image buffer ${index} is empty or invalid`,
                500,
              )
            }

            try {
              const metadata = await sharp(buffer).metadata()
              const { width, height } = metadata

              if (!width || !height) {
                throw new ServerError(
                  `Could not determine dimensions for image ${index}`,
                  500,
                )
              }

              const scaleFactor = WANTED_WIDTH / width
              const scaledHeight = Math.round(height * scaleFactor)

              // Pre-resize the image to save memory during composition
              const resizedBuffer = await sharp(buffer)
                .resize(WANTED_WIDTH, scaledHeight, {
                  fit: 'fill',
                  withoutEnlargement: false,
                })
                .toBuffer()

              return {
                buffer: resizedBuffer,
                width: WANTED_WIDTH,
                height: scaledHeight,
              }
            } catch (error) {
              throw new ServerError(
                `Failed to process image ${index}: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
                500,
              )
            }
          }),
        )

        // Calculate total height
        const totalHeight = images.reduce((sum, img) => sum + img.height, 0)
        console.log(`Creating final image (${WANTED_WIDTH}x${totalHeight})...`)

        // Prepare composite operations
        let yOffset = 0
        const compositeList = images.map((img) => {
          const position = { input: img.buffer, top: yOffset, left: 0 }
          yOffset += img.height
          return position
        })

        // Generate the final image
        return await sharp({
          create: {
            width: WANTED_WIDTH,
            height: totalHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .composite(compositeList)
          .png({ compressionLevel: 6 }) // Balance between size and speed
          .toBuffer()
      } catch (error) {
        console.error('Image processing error:', error)
        throw new ServerError(
          `Failed to process images: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          500,
        )
      }
    },

    async assembleImagesAndStream(
      urls: string[],
      writeStream: Writable,
    ): Promise<void> {
      console.log(`Starting processing of ${urls.length} images...`)

      try {
        // Step 1: Download all images
        const imageBuffers = await this.downloadImages(urls)

        // Step 2: Process and assemble images
        const finalImageBuffer = await this.processImages(imageBuffers)

        // Step 3: Stream the result to the client
        console.log(
          `Streaming final image (${(
            finalImageBuffer.length /
            1024 /
            1024
          ).toFixed(2)} MB)...`,
        )

        // Return a promise that resolves when the stream is finished
        return new Promise((resolve, reject) => {
          writeStream.write(finalImageBuffer, (err) => {
            if (err) {
              console.error('Write stream error:', err)
              reject(
                new ServerError(
                  `Failed to write to stream: ${err.message}`,
                  500,
                ),
              )
              return
            }

            writeStream.end(() => {
              console.log('Stream finished successfully')
              resolve()
            })
          })
        })
      } catch (error) {
        console.error('Assembly/streaming error:', error)
        throw new ServerError(
          `Failed to process and stream images: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          500,
        )
      }
    },
  }
}
