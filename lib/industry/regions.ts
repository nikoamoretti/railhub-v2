// US state codes, names, and regional groupings for advisory map

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  PR: 'Puerto Rico',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
}

// Reverse lookup: full name -> 2-letter code
export const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [name, code])
)

export const REGION_TO_STATES: Record<string, string[]> = {
  Northwest: ['WA', 'OR', 'ID', 'MT', 'WY'],
  Northeast: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'],
  Southeast: ['VA', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'LA', 'AR', 'TN', 'KY', 'WV'],
  Southwest: ['AZ', 'NM', 'TX', 'OK'],
  Midwest: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  Pacific: ['CA', 'OR', 'WA', 'HI', 'AK'],
  Gulf: ['TX', 'LA', 'MS', 'AL', 'FL'],
  Central: ['MO', 'KS', 'NE', 'IA', 'IL', 'IN', 'OH'],
}

// Lookup: which region(s) a state belongs to
export function getRegionsForState(stateCode: string): string[] {
  return Object.entries(REGION_TO_STATES)
    .filter(([, states]) => states.includes(stateCode))
    .map(([region]) => region)
}
