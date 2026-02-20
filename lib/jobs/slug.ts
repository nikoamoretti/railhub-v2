import { createId } from '@paralleldrive/cuid2'

export function generateJobSlug(title: string, company: string, city?: string, state?: string): string {
  const parts = [title, company]
  if (city) parts.push(city)
  if (state) parts.push(state)

  const base = parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  const id = createId().slice(0, 8)
  return `${base}-${id}`
}

export function generateCompanySlug(company: string): string {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}
