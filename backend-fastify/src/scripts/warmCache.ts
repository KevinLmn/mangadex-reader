import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') })

const BACK_END_URL = process.env.BACK_END_URL || 'http://localhost:3012'

const CACHE_DIR = path.resolve(import.meta.dirname, '../../cache')

async function ensureCacheDirectory() {
  try {
    await fs.access(CACHE_DIR)
  } catch {
    console.log('📁 Creating cache directory...')
    await fs.mkdir(CACHE_DIR, { recursive: true })
  }
}

async function warmCache() {
  console.log('🔄 Warming cache...')

  // Ensure cache directory exists
  await ensureCacheDirectory()

  const includes = ['author', 'cover_art']
  const contentRating = ['safe']
  const loginResponse = await axios.post(`${BACK_END_URL}/api/login`, {
    email: 'notneeded@gmail.com',
    password: 'notneeded',
  })
  const token = loginResponse.data.access_token

  try {
    const latestMangaResponse = await axios.get(
      `${process.env.MANGADEX_BASE_URL}/manga`,
      {
        params: {
          includes,
          contentRating,
          limit: 20,
          'order[updatedAt]': 'desc',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    const latestManga = JSON.stringify(latestMangaResponse.data, null, 2)
    const latestOutPath = path.join(CACHE_DIR, 'latest.json')

    // Check if file exists to determine action
    try {
      await fs.access(latestOutPath)
      console.log('📝 Updating existing latest.json...')
    } catch {
      console.log('📄 Creating new latest.json...')
    }

    await fs.writeFile(latestOutPath, latestManga)
    console.log('✅ Latest manga cache updated successfully')
  } catch (error) {
    console.error('❌ Error updating latest manga cache:', error)
    throw new Error('Something went wrong with the latest manga search')
  }
  try {
    const order = {
      rating: 'desc',
      followedCount: 'desc',
    }

    const finalOrderQuery: Record<string, string> = {}

    for (const [key, value] of Object.entries(order)) {
      finalOrderQuery[`order[${key}]`] = value
    }
    const popularMangaResponse = await axios.get(
      `${process.env.MANGADEX_BASE_URL}/manga`,
      {
        params: {
          includes,
          contentRating,
          limit: 20,
          ...finalOrderQuery,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    console.log(popularMangaResponse.data)
    const popularManga = JSON.stringify(popularMangaResponse.data, null, 2)
    const popularOutPath = path.join(CACHE_DIR, 'popular.json')

    try {
      await fs.access(popularOutPath)
      console.log('📝 Updating existing popular.json...')
    } catch {
      console.log('📄 Creating new popular.json...')
    }

    await fs.writeFile(popularOutPath, popularManga)
    console.log('✅ Popular manga cache updated successfully')
  } catch (error) {
    console.error('❌ Error updating popular manga cache:', error)
    throw new Error('Something went wrong with the popular manga search')
  }

  console.log('🎉 Cache warming completed successfully!')
}

async function waitForServer() {
  const MAX_RETRIES = 10
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await axios.get(`${BACK_END_URL}/healthz`)
      return
    } catch {
      console.log(`Waiting for backend... (${i + 1}/${MAX_RETRIES})`)
      await new Promise((res) => setTimeout(res, 2000))
    }
  }
  throw new Error('Backend did not start in time.')
}

await waitForServer()
await warmCache()
