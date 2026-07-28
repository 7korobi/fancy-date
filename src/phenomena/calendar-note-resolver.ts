import { hasSolarEvents } from '../orbital-model'
import type { OrbitalModel } from '../orbital-model'
import type { TempoLike } from '../tempo'
import type { Tempos } from '../tempo'
import type { CalendarNotePolicy } from './calendar-policy'
import { CALENDAR_NOTE_DATA } from './calendar-note-data'
import type { DateNoteGroups, SeasonalNoteMap } from './calendar-notes'
import { SolarTermPolicy, ZassetsuPolicy } from './solar'

type SeasonalNoteLabels = Record<string, string>

const seasonal_note_label_map = Symbol('seasonal_note_label_map')

type SeasonalNoteMapWithLabels = SeasonalNoteMap & {
  [seasonal_note_label_map]?: SeasonalNoteLabels
}

function with_seasonal_note_labels<T extends SeasonalNoteMapWithLabels>(
  notes: T,
  labels: SeasonalNoteLabels,
): T {
  Object.defineProperty(notes, seasonal_note_label_map, {
    configurable: true,
    enumerable: false,
    value: labels,
  })
  return notes
}

type NoteProvider = (utc: number, tempos: Tempos) => readonly string[]

export type CalendarNoteResolverDeps = {
  sunny?: OrbitalModel
  dayMsec: number
  dayZero: number
  day10Zero: number
  stemLength: number
  seasonalNoteLabels: SeasonalNoteLabels
}

export class CalendarNoteResolver {
  private readonly observed_solar_term_policy = new SolarTermPolicy('observed')
  private readonly mean_solar_term_policy = new SolarTermPolicy('mean')
  private readonly zassetsu_policy = new ZassetsuPolicy()

  private readonly japanese_fixed_date_note_policy: CalendarNotePolicy<undefined, DateNoteGroups> =
    {
      resolve: () => CALENDAR_NOTE_DATA.fixedDateNotes.japanese,
    }

  private readonly religious_fixed_date_note_policy: CalendarNotePolicy<undefined, DateNoteGroups> =
    {
      resolve: () => CALENDAR_NOTE_DATA.fixedDateNotes.religious,
    }

  constructor(private readonly deps: CalendarNoteResolverDeps) {}

  resolve(utc: number, tempos: Tempos): readonly string[] {
    return this.note_at(
      utc,
      tempos,
      this.resolve_zassetsu(utc, tempos),
      this.resolve_fixed_date_notes(),
    )
  }

  /**
   * Resolve the raw seasonal and fixed note groups for reuse across multiple
   * timestamps, such as in to_table().
   */
  resolveRaw(
    utc: number,
    tempos: Tempos,
  ): {
    seasonalNotes: SeasonalNoteMapWithLabels
    dateNoteGroups: DateNoteGroups
  } {
    return {
      seasonalNotes: this.resolve_zassetsu(utc, tempos),
      dateNoteGroups: this.resolve_fixed_date_notes(),
    }
  }

  note_at(
    utc: number,
    tempos: Tempos,
    seasonalNotes: SeasonalNoteMapWithLabels,
    dateNoteGroups: DateNoteGroups,
  ): string[] {
    const list: string[] = []
    for (const provider of this.note_providers(seasonalNotes, dateNoteGroups)) {
      list.push(...provider(utc, tempos))
    }
    return list
  }

  private resolve_fixed_date_notes(): DateNoteGroups {
    const japanese = this.japanese_fixed_date_note_policy.resolve(undefined)
    const religious = this.religious_fixed_date_note_policy.resolve(undefined)
    return {
      カトリック: religious.カトリック,
      節句: japanese.節句,
      仏教: religious.仏教,
      風習: japanese.風習,
    }
  }

  private resolve_zassetsu(utc: number, { Zz, d }: Tempos): SeasonalNoteMapWithLabels {
    if (this.deps.sunny && hasSolarEvents(this.deps.sunny))
      return this.resolve_zassetsu_by_phase(utc)
    return with_seasonal_note_labels(
      this.zassetsu_policy.resolve({
        terms: this.mean_solar_term_policy.resolve({ kind: 'mean', Zz, d }),
        dayMsec: this.deps.dayMsec,
        day10Zero: this.deps.day10Zero,
        stemLength: this.deps.stemLength,
      }),
      this.deps.seasonalNoteLabels,
    )
  }

  private resolve_zassetsu_by_phase(utc: number): SeasonalNoteMapWithLabels {
    const sunny = this.deps.sunny!
    return with_seasonal_note_labels(
      this.zassetsu_policy.resolve({
        terms: this.observed_solar_term_policy.resolve({
          kind: 'observed',
          sunny,
          dayMsec: this.deps.dayMsec,
          dayZero: this.deps.dayZero,
          utc,
        }),
        dayMsec: this.deps.dayMsec,
        day10Zero: this.deps.day10Zero,
        stemLength: this.deps.stemLength,
      }),
      this.deps.seasonalNoteLabels,
    )
  }

  private note_providers(
    seasonalNotes: SeasonalNoteMapWithLabels,
    dateNoteGroups: DateNoteGroups,
  ): NoteProvider[] {
    return [
      (_utc, tempos) => this.seasonal_note_labels(seasonalNotes, tempos),
      (_utc, tempos) => this.date_note_labels(dateNoteGroups, tempos),
    ]
  }

  private seasonal_note_labels(notes: SeasonalNoteMapWithLabels, tempos: Tempos) {
    const list: string[] = []
    const labels = notes[seasonal_note_label_map]
    for (const name in notes) {
      const note = notes[name]
      if (note.is_cover(tempos.d.center_at)) {
        list.push(labels?.[name] ?? name)
      }
    }
    return list
  }

  private date_note_labels(groups: DateNoteGroups, tempos: Tempos) {
    const list: string[] = []
    for (const root in groups) {
      const group = groups[root]
      for (const name in group) {
        const { M, d, B, E } = group[name]
        if (M != null && M !== tempos.M.now_idx) continue
        if (d != null && d !== tempos.d.now_idx) continue
        if (B != null && B !== tempos.B.now_idx) continue
        if (E != null && E !== tempos.E.now_idx) continue
        list.push(name)
      }
    }
    return list
  }
}
