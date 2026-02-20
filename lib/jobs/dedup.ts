import { createHash } from 'crypto'

export function generateContentHash(title: string, company: string, city?: string): string {
  const normalized = [
    title.toLowerCase().trim(),
    company.toLowerCase().trim(),
    (city || '').toLowerCase().trim(),
  ].join('|')

  return createHash('md5').update(normalized).digest('hex')
}
