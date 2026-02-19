// Glossary
export interface GlossaryTerm {
  slug: string
  term: string
  abbreviation?: string
  definition: string
  category: string
  relatedTerms?: string[]
}

// Car Types
export interface CarTypeVariant {
  name: string
  description: string
}

export interface CarType {
  designation: string
  name: string
  aarCodes: string[]
  description: string
  commonCommodities: string[]
  dimensions: {
    length?: string
    width?: string
    height?: string
    capacity?: string
    loadLimit?: string
  }
  variants: CarTypeVariant[]
  useCases: string
}

// Reporting Marks
export interface ReportingMark {
  mark: string
  name: string
  type: 'Class I' | 'Class II' | 'Class III' | 'Shortline' | 'Terminal' | 'Leasing' | 'Private'
  parentCompany?: string
  headquarters?: string
  milesOperated?: number
}

// Interchange Rules
export interface InterchangeRuleSection {
  heading: string
  content: string
}

export interface InterchangeRule {
  slug: string
  title: string
  topic: string
  summary: string
  sections: InterchangeRuleSection[]
  aarRuleRef?: string
}

// Commodity Codes
export interface CommodityItem {
  name: string
  nmfcClass?: string
}

export interface CommoditySubgroup {
  stccCode: string
  name: string
  nmfcClass?: string
  items?: CommodityItem[]
}

export interface CommodityGroup {
  stccPrefix: string
  name: string
  description: string
  subgroups: CommoditySubgroup[]
}

// Guides
export interface GuideSection {
  id: string
  heading: string
  content: string
}

export interface Guide {
  slug: string
  title: string
  publishDate: string
  readingTimeMin: number
  category: string
  tags: string[]
  excerpt: string
  sections: GuideSection[]
}

// Rail 101
export interface Rail101Section {
  id: string
  title: string
  order: number
  content: string
  keyTakeaways?: string[]
}

export interface Rail101Data {
  title: string
  subtitle: string
  sections: Rail101Section[]
}
