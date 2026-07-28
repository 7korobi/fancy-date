import type { CalendarNotePolicy } from './calendar-policy'
import { CALENDAR_NOTE_DATA } from './calendar-note-data'

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

export class JapaneseFixedDateNotePolicy implements CalendarNotePolicy<undefined, DateNoteGroups> {
  resolve(_context?: undefined): DateNoteGroups {
    return CALENDAR_NOTE_DATA.fixedDateNotes.japanese
  }
}

export class ReligiousFixedDateNotePolicy implements CalendarNotePolicy<undefined, DateNoteGroups> {
  resolve(_context?: undefined): DateNoteGroups {
    return CALENDAR_NOTE_DATA.fixedDateNotes.religious
  }
}
