import type { CalendarNotePolicy } from './calendar-policy'

export type DateNoteRule = readonly (number | undefined)[]

export type DateNoteGroups = Readonly<Record<string, Readonly<Record<string, DateNoteRule>>>>

export type SeasonalNote = {
  is_cover(at: number): boolean
}

export type SeasonalNoteMap = Record<string, SeasonalNote>

const JAPANESE_FIXED_DATE_NOTES: DateNoteGroups = {
  節句: {
    人日: [1, 7],
    初午: [2, undefined, 7],
    上巳: [3, 3],
    端午: [5, 5],
    七夕: [7, 7],
    重陽: [9, 9],
  },
  風習: {
    小正月: [1, 15],
    十五夜: [8, 15],
    十三夜: [9, 13],
    七五三: [11, 15],
    正月事始め: [12, 13],
  },
}

const RELIGIOUS_FIXED_DATE_NOTES: DateNoteGroups = {
  カトリック: {
    万聖節: [11, 1],
    万霊節: [11, 2],
  },
  仏教: {
    灌仏会: [4, 8],
    盂蘭盆会: [7, 15],
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
