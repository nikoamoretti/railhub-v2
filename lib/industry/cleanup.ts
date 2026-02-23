import { prisma } from '@/lib/db'

export async function expireOldAdvisories(): Promise<number> {
  try {
    const result = await prisma.serviceAdvisory.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
      },
      data: { isActive: false },
    })
    return result.count
  } catch (err) {
    console.error('expireOldAdvisories error:', err)
    return 0
  }
}
