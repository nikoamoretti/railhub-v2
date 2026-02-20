export const JOB_CATEGORIES = [
  'Operations',
  'Maintenance of Way',
  'Mechanical',
  'Engineering',
  'Transportation',
  'Management',
  'Safety & Compliance',
  'IT & Technology',
  'Administrative',
  'Sales & Marketing',
] as const

export type JobCategory = (typeof JOB_CATEGORIES)[number]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Operations': ['operations', 'dispatcher', 'yardmaster', 'yard', 'terminal', 'logistics', 'freight', 'shipping', 'warehouse'],
  'Maintenance of Way': ['maintenance of way', 'mow', 'track', 'signal', 'bridge', 'roadway', 'surfacing', 'tie', 'rail welding', 'gandy'],
  'Mechanical': ['mechanical', 'carman', 'car repair', 'locomotive', 'diesel', 'electrician', 'welder', 'machinist', 'car inspector', 'air brake'],
  'Engineering': ['engineer', 'engineering', 'civil engineer', 'design', 'surveyor', 'structural', 'geotechnical', 'project engineer'],
  'Transportation': ['conductor', 'engineer train', 'locomotive engineer', 'trainmaster', 'brakeman', 'switchman', 'train crew', 'transportation'],
  'Management': ['manager', 'director', 'supervisor', 'superintendent', 'vice president', 'chief', 'lead', 'foreman', 'management'],
  'Safety & Compliance': ['safety', 'compliance', 'regulatory', 'fra', 'osha', 'hazmat', 'environmental', 'risk', 'inspection'],
  'IT & Technology': ['software', 'developer', 'data', 'analyst', 'it ', 'technology', 'systems', 'network', 'cyber', 'cloud', 'database'],
  'Administrative': ['administrative', 'admin', 'clerk', 'office', 'accounting', 'finance', 'hr', 'human resources', 'payroll', 'receptionist'],
  'Sales & Marketing': ['sales', 'marketing', 'business development', 'account manager', 'customer', 'commercial', 'revenue'],
}

export function classifyJob(title: string, description: string): string | undefined {
  const text = `${title} ${description}`.toLowerCase()

  let bestCategory: string | undefined
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        // Title matches are worth more
        score += title.toLowerCase().includes(keyword) ? 3 : 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  return bestScore >= 1 ? bestCategory : undefined
}

export const CATEGORY_BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  'Operations':          { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  'Maintenance of Way':  { bg: 'var(--badge-orange-bg)', border: 'var(--badge-orange-border)', text: 'var(--badge-orange-text)' },
  'Mechanical':          { bg: 'var(--badge-purple-bg)', border: 'var(--badge-purple-border)', text: 'var(--badge-purple-text)' },
  'Engineering':         { bg: 'var(--badge-cyan-bg)', border: 'var(--badge-cyan-border)', text: 'var(--badge-cyan-text)' },
  'Transportation':      { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
  'Management':          { bg: 'var(--badge-indigo-bg)', border: 'var(--badge-indigo-border)', text: 'var(--badge-indigo-text)' },
  'Safety & Compliance': { bg: 'var(--badge-red-bg)', border: 'var(--badge-red-border)', text: 'var(--badge-red-text)' },
  'IT & Technology':     { bg: 'var(--badge-pink-bg)', border: 'var(--badge-pink-border)', text: 'var(--badge-pink-text)' },
  'Administrative':      { bg: 'var(--badge-gray-bg)', border: 'var(--badge-gray-border)', text: 'var(--badge-gray-text)' },
  'Sales & Marketing':   { bg: 'var(--badge-yellow-bg)', border: 'var(--badge-yellow-border)', text: 'var(--badge-yellow-text)' },
}

export function getCategoryBadge(category: string) {
  return CATEGORY_BADGE_STYLES[category] || { bg: 'var(--badge-gray-bg)', border: 'var(--badge-gray-border)', text: 'var(--badge-gray-text)' }
}
