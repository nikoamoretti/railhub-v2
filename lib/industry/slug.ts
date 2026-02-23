import { createId } from '@paralleldrive/cuid2'

export function generateAdvisorySlug(title: string, railroad: string): string {
  const base = `${railroad}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  const id = createId().slice(0, 8)
  return `${base}-${id}`
}

export function generateRegulatorySlug(title: string, agency: string): string {
  const base = `${agency}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  const id = createId().slice(0, 8)
  return `${base}-${id}`
}
