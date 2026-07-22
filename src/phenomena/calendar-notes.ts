import type { CalendarNotePolicy } from './calendar-policy'

/**
 * Fixed-note constraints use the internal zero-based indexes exposed by Tempo:
 * M=month, d=day, B=day-branch, and E=weekday-cycle.
 */
export type DateNoteRule = {
  M?: number
  d?: number
  B?: number
  E?: number
}

export type DateNoteGroups = Readonly<Record<string, Readonly<Record<string, DateNoteRule>>>>

export type SeasonalNote = {
  is_cover(at: number): boolean
}

export type SeasonalNoteMap = Record<string, SeasonalNote>

const JAPANESE_FIXED_DATE_NOTES: DateNoteGroups = {
  節句: {
    人日: { M: 0, d: 6 },
    初午: { M: 1, B: 6 },
    上巳: { M: 2, d: 2 },
    端午: { M: 4, d: 4 },
    七夕: { M: 6, d: 6 },
    重陽: { M: 8, d: 8 },
  },
  風習: {
    小正月: { M: 0, d: 14 },
    十五夜: { M: 7, d: 14 },
    十三夜: { M: 8, d: 12 },
    七五三: { M: 10, d: 14 },
    正月事始め: { M: 11, d: 12 },
  },
}

const RELIGIOUS_FIXED_DATE_NOTES: DateNoteGroups = {
  カトリック: {
    万聖節: { M: 10, d: 0 },
    万霊節: { M: 10, d: 1 },
  },
  仏教: {
    灌仏会: { M: 3, d: 7 },
    盂蘭盆会: { M: 6, d: 14 },
  },
}

export class JapaneseFixedDateNotePolicy implements CalendarNotePolicy<undefined, DateNoteGroups> {
  resolve(_context?: undefined): DateNoteGroups {
    return JAPANESE_FIXED_DATE_NOTES
  }
}

export class ReligiousFixedDateNotePolicy implements CalendarNotePolicy<undefined, DateNoteGroups> {
  resolve(_context?: undefined): DateNoteGroups {
    return RELIGIOUS_FIXED_DATE_NOTES
  }
}
