import { prisma } from '@/lib/db'

const MAX_AGE_DAYS = 45

export async function expireOldJobs(): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS)

  // Expire jobs past expiresAt or older than MAX_AGE_DAYS
  const result = await prisma.job.updateMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: { lt: new Date() } },
        { postedAt: { lt: cutoff } },
      ],
    },
    data: { isActive: false },
  })

  return result.count
}
