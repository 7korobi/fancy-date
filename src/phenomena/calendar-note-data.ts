import type { DateNoteGroups } from './calendar-notes'

/**
 * Calendar note definitions that are independent of any specific calendar
 * instance. These describe the *intent* of each note: solar term phases and
 * fixed-date constraints using the same zero-based indexes that Tempo exposes.
 */
export const CALENDAR_NOTE_DATA = {
  solarTermPhases: {
    立春: 1 / 8,
    入梅: 80 / 360,
    春分: 2 / 8,
    半夏生: 100 / 360,
    夏土用: 13 / 40,
    立夏: 3 / 8,
    夏至: 4 / 8,
    秋土用: 23 / 40,
    立秋: 5 / 8,
    秋分: 6 / 8,
    冬土用: 33 / 40,
    立冬: 7 / 8,
    冬至: 8 / 8,
    春土用: 43 / 40,
    次立春: 9 / 8,
  },
  fixedDateNotes: {
    japanese: {
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
    },
    religious: {
      カトリック: {
        万聖節: { M: 10, d: 0 },
        万霊節: { M: 10, d: 1 },
      },
      仏教: {
        灌仏会: { M: 3, d: 7 },
        盂蘭盆会: { M: 6, d: 14 },
      },
    },
  },
} as const satisfies {
  solarTermPhases: Readonly<Record<string, number>>
  fixedDateNotes: {
    japanese: DateNoteGroups
    religious: DateNoteGroups
  }
}
