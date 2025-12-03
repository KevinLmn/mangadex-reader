import { FastifyRequest } from 'fastify'
import prisma from '../prisma.js'
import { AuthService } from '../services/authService.js'

type RefreshTokenRequestBody = {
  token: string
}

type RefreshTokenReturnType = {
  token: string
}

export const refreshTokenController = async (
  request: FastifyRequest<{ Body: RefreshTokenRequestBody }>
): Promise<RefreshTokenReturnType> => {
  const currentToken = request.body.token

  const databaseToken = await prisma.token.findFirst({
    where: {
      token: currentToken,
    },
  })

  if (!databaseToken) {
    throw new Error('Token not found')
  }

  try {
    const tokens = await AuthService.refreshToken(databaseToken.refreshToken)

    await prisma.token.update({
      where: {
        token: databaseToken.token,
      },
      data: {
        token: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
    })

    return { token: tokens.access_token }
  } catch (error) {
    console.error('Refresh token error:', error)
    throw new Error('Failed to refresh token')
  }
}
