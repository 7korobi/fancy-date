import type {
  LunarPhaseEvent,
  LunarPhaseEventResolver,
  OrbitalModel,
  TIMEZONE,
} from '../orbital-model'
import { PrincipalTermLunisolarPolicy } from './calendar-policy'
import type {
  ConstrainedNominalOptions,
  ConstrainedNominalScore,
  LunisolarBoundaryPolicy,
  LunisolarBoundarySelection,
  LunisolarBoundarySelectionSummary,
  LunisolarBoundarySource,
  LunisolarMonthLengthPolicy,
  LunisolarPhaseBoundary,
} from './calendar-policy'

export type { LunarPhaseEvent, LunarPhaseEventResolver } from '../orbital-model'

export type CivilDayBoundary = {
  day_index: number
  last_at: number
  next_at: number
}

export type CivilDayModel = {
  at(utc: number): CivilDayBoundary
  atIndex(dayIndex: number): CivilDayBoundary
}

export type LunisolarPrincipalTerm = {
  index: number
  longitudeDeg: number
  month: number
  at: number
}

export type LunisolarDate = {
  year: number
  month: number
  day: number
  is_leap: boolean
  year_start_at: number
  next_year_start_at: number
  day_start_at: number
  last_at: number
  next_at: number
  new_moon_at: number
  next_new_moon_at: number
  boundary_ambiguous?: boolean
  boundary_selection?: LunisolarBoundarySelection
  boundary_selection_summary?: LunisolarBoundarySelectionSummary
  principal_term?: LunisolarPrincipalTerm
}

type LunisolarBoundaryErrorDetails = {
  source_events: readonly LunarPhaseEvent[]
  candidate_days: readonly (readonly number[])[]
  partial_selection?: LunisolarBoundarySelection
}

export class LunisolarBoundaryError extends Error {
  readonly source_events: readonly LunarPhaseEvent[]
  readonly candidate_days: readonly (readonly number[])[]
  readonly partial_selection?: LunisolarBoundarySelection

  constructor(
    readonly code: string,
    message: string,
    details: LunisolarBoundaryErrorDetails,
  ) {
    super(message)
    this.name = 'LunisolarBoundaryError'
    this.source_events = details.source_events
    this.candidate_days = details.candidate_days
    this.partial_selection = details.partial_selection
  }
}

export class LunisolarBoundaryConstraintError extends LunisolarBoundaryError {
  constructor(details: LunisolarBoundaryErrorDetails) {
    super(
      'LUNISOLAR_BOUNDARY_CONSTRAINT',
      'failed to resolve constrained lunisolar boundaries',
      details,
    )
    this.name = 'LunisolarBoundaryConstraintError'
  }
}

export class AmbiguousLunisolarBoundaryError extends LunisolarBoundaryError {
  constructor(details: LunisolarBoundaryErrorDetails) {
    super('AMBIGUOUS_LUNISOLAR_BOUNDARY', 'ambiguous constrained lunisolar boundaries', details)
    this.name = 'AmbiguousLunisolarBoundaryError'
  }
}

export class UnstableLunisolarBoundaryError extends LunisolarBoundaryError {
  constructor(details: LunisolarBoundaryErrorDetails) {
    super(
      'UNSTABLE_LUNISOLAR_BOUNDARY',
      'constrained lunisolar boundaries are unstable across search windows',
      details,
    )
    this.name = 'UnstableLunisolarBoundaryError'
  }
}

type LunisolarMonth = Omit<
  LunisolarDate,
  'year' | 'day' | 'day_start_at' | 'year_start_at' | 'next_year_start_at'
> & {
  year?: number
}

type PhaseResolver = (phase: number, near: number) => number
type YearResolver = (at: number) => number

const LUNISOLAR_MONTH_WINDOW_PAST_MARGIN = 5
const LUNISOLAR_MONTH_WINDOW_FUTURE_MARGIN = 6
const LUNISOLAR_BOUNDARY_TOLERANCE_MSEC = 1

export type LunisolarOptions = {
  moony?: OrbitalModel
  solarPeriodMsec?: number
  principalTermCount?: number
  solarYear?: YearResolver
  boundarySource?: LunisolarBoundarySource
  boundaryPolicy?: LunisolarBoundaryPolicy
  boundaryToleranceMsec?: number
  monthLength?: LunisolarMonthLengthPolicy
  geo: TIMEZONE
  dayMsec: number
  dayZero: number
  civilDay?: CivilDayModel
  lunarPhase: PhaseResolver
  lunarPhaseEvent?: LunarPhaseEventResolver
  lunarSynodicPeriodMsec?: number
  solarPhase: PhaseResolver
}

export function lunisolar_month_window_counts(
  options: Pick<LunisolarOptions, 'moony' | 'solarPeriodMsec' | 'lunarSynodicPeriodMsec'>,
) {
  if (!options.moony) {
    throw new Error('lunisolar requires a satellite orbital model')
  }
  const monthMsec = options.lunarSynodicPeriodMsec ?? options.moony.periodMsec
  const yearMsec = options.solarPeriodMsec ?? monthMsec * 13
  if (!Number.isFinite(monthMsec) || monthMsec <= 0) {
    throw new Error(`invalid lunar period ${monthMsec}`)
  }
  if (!Number.isFinite(yearMsec) || yearMsec <= 0) {
    throw new Error(`invalid solar period ${yearMsec}`)
  }
  const monthsPerSolarYear = Math.max(1, Math.ceil(yearMsec / monthMsec))
  return {
    past: monthsPerSolarYear + LUNISOLAR_MONTH_WINDOW_PAST_MARGIN,
    future: monthsPerSolarYear + LUNISOLAR_MONTH_WINDOW_FUTURE_MARGIN,
  }
}

export function lunisolar(options: LunisolarOptions, utc: number): LunisolarDate {
  const months = lunisolar_months_around(options, utc)
  const month = months.find(({ last_at, next_at }) => last_at <= utc && utc < next_at)
  if (!month || month.year == null) {
    throw new Error('failed to resolve lunisolar month')
  }
  const currentMonth = month
  const currentYear = month.year
  const yearStartAt =
    months.find(({ year, month, is_leap }) => year === currentYear && month === 1 && !is_leap)
      ?.last_at ?? currentMonth.last_at
  const nextYearStartAt =
    months.find(({ year, month, is_leap }) => year === currentYear + 1 && month === 1 && !is_leap)
      ?.last_at ?? currentMonth.next_at
  const day = civil_day_at(options, utc)
  const monthDay = civil_day_at(options, month.last_at)
  return {
    ...month,
    year: month.year,
    year_start_at: yearStartAt,
    next_year_start_at: nextYearStartAt,
    day: day.day_index - monthDay.day_index + 1,
    day_start_at: day.last_at,
  }
}

function lunisolar_months_around(options: LunisolarOptions, utc: number): LunisolarMonth[] {
  const boundaries = lunisolar_boundaries_around(options, utc)
  const yearOf = (at: number) =>
    options.solarYear?.(at) ?? new Date(at + local_timezone_msec(options)).getUTCFullYear()
  const policy = new PrincipalTermLunisolarPolicy(
    (boundary) => lunisolar_principal_term(options, boundary),
    yearOf,
  )
  return policy.assign(boundaries).map((item) => ({
    month: item.month,
    is_leap: item.is_leap,
    year: item.year,
    last_at: item.last_at,
    next_at: item.next_at,
    new_moon_at: item.source_at,
    next_new_moon_at: item.next_source_at,
    boundary_ambiguous: item.boundary_ambiguous,
    boundary_selection: item.boundary_selection,
    boundary_selection_summary: item.boundary_selection_summary,
    principal_term: item.principal_term,
  }))
}

type BoundaryCandidate = {
  last_at: number
  nominal_at: number
  day_index: number
  nominal_day_index: number
  interval_overlap_msec: number
}

type BoundaryResolution = {
  last_at: number
  ambiguous: boolean
  boundary_selection?: LunisolarBoundarySelection
  boundary_selection_summary?: LunisolarBoundarySelectionSummary
}

type BoundaryEventInput = LunarPhaseEvent | number

type BoundaryPath = {
  score: ConstrainedNominalScore
  starts: number[]
  optimal_path_count: number
  alternatives: number[][]
}

function constrained_nominal_options(
  options: LunisolarOptions,
): ConstrainedNominalOptions | undefined {
  if (options.boundaryPolicy === 'constrained-nominal') {
    return { kind: 'constrained-nominal' }
  }
  if (typeof options.boundaryPolicy === 'object') {
    if (options.boundaryPolicy.kind !== 'constrained-nominal') {
      throw new Error(`invalid lunisolar boundary policy ${options.boundaryPolicy.kind}`)
    }
    return options.boundaryPolicy
  }
  return undefined
}

function boundary_tolerance(options: LunisolarOptions) {
  return (
    constrained_nominal_options(options)?.boundaryToleranceMsec ??
    options.boundaryToleranceMsec ??
    LUNISOLAR_BOUNDARY_TOLERANCE_MSEC
  )
}

function boundary_event(options: LunisolarOptions, input: BoundaryEventInput, cycle: number) {
  if (typeof input !== 'number') {
    const modelError = input.model_error_msec ?? 0
    if (
      !Number.isFinite(input.at) ||
      !Number.isFinite(input.lower_at) ||
      !Number.isFinite(input.upper_at) ||
      !Number.isFinite(modelError) ||
      modelError < 0 ||
      input.lower_at > input.upper_at
    ) {
      throw new Error('invalid lunar phase event')
    }
    return {
      ...input,
      lower_at: input.lower_at - modelError,
      upper_at: input.upper_at + modelError,
    }
  }
  const tolerance = boundary_tolerance(options)
  return {
    cycle,
    phase: 0,
    at: input,
    lower_at: input - tolerance,
    upper_at: input + tolerance,
    source_kind: options.boundarySource ?? 'observed',
    numeric_error_msec: tolerance,
  }
}

function lunar_phase_event(options: LunisolarOptions, phase: number, near: number, cycle: number) {
  if (options.lunarPhaseEvent) return options.lunarPhaseEvent(phase, near)
  return boundary_event(options, options.lunarPhase(phase, near), cycle)
}

function boundary_day_index(options: LunisolarOptions, utc: number) {
  return civil_day_at(options, utc).day_index
}

function boundary_candidates(
  options: LunisolarOptions,
  event: LunarPhaseEvent,
): BoundaryCandidate[] {
  const nominal = civil_day_at(options, event.at)
  const nominal_day_index = nominal.day_index
  const nominal_at = nominal.last_at
  const lower = Math.min(event.lower_at, event.upper_at)
  const upper = Math.max(event.lower_at, event.upper_at)
  const candidates: BoundaryCandidate[] = []
  const add = (day_index: number) => {
    const day = civil_day_at_index(options, day_index)
    const last_at = day.last_at
    if (candidates.some((candidate) => candidate.day_index === day_index)) return
    const next_at = day.next_at
    const interval_overlap_msec = Math.max(0, Math.min(upper, next_at) - Math.max(lower, last_at))
    candidates.push({ last_at, nominal_at, day_index, nominal_day_index, interval_overlap_msec })
  }
  if (lower === upper) {
    add(nominal_day_index)
    return candidates
  }
  const first = civil_day_at(options, lower).day_index
  const last = civil_day_at(options, upper).day_index
  for (let day_index = first; day_index <= last; day_index++) add(day_index)
  return candidates
}

function score_compare(a: ConstrainedNominalScore, b: ConstrainedNominalScore) {
  for (let index = 0; index < a.length; index++) {
    const difference = a[index] - b[index]
    if (index < 2 ? difference !== 0 : Math.abs(difference) > 1e-9) {
      return difference < 0 ? -1 : 1
    }
  }
  return 0
}

function compare_path_order(a: number[], b: number[], tieBreak: 'earlier' | 'later') {
  for (let index = 0; index < a.length; index++) {
    if (a[index] === b[index]) continue
    return tieBreak === 'earlier' ? (a[index] < b[index] ? -1 : 1) : a[index] > b[index] ? -1 : 1
  }
  return 0
}

function month_length_range(
  options: LunisolarOptions,
  current: LunarPhaseEvent,
  next: LunarPhaseEvent,
) {
  const policy = constrained_nominal_options(options)?.monthLength ??
    options.monthLength ?? { kind: 'event-derived' as const }
  if (policy.kind === 'fixed-range') {
    if (
      !Number.isInteger(policy.minDays) ||
      !Number.isInteger(policy.maxDays) ||
      policy.minDays <= 0 ||
      policy.maxDays < policy.minDays
    ) {
      throw new Error('invalid lunisolar month length range')
    }
    return [policy.minDays, policy.maxDays] as const
  }
  if (options.civilDay) {
    const minDays =
      civil_day_at(options, next.lower_at).day_index -
      civil_day_at(options, current.upper_at).day_index
    const maxDays =
      civil_day_at(options, next.upper_at).day_index -
      civil_day_at(options, current.lower_at).day_index
    return [Math.max(1, minDays), Math.max(1, maxDays)] as const
  }
  const deltaMin = next.lower_at - current.upper_at
  const deltaMax = next.upper_at - current.lower_at
  return [
    Math.max(1, Math.floor(deltaMin / options.dayMsec)),
    Math.max(1, Math.ceil(deltaMax / options.dayMsec)),
  ] as const
}

function path_score(
  previous: BoundaryPath | undefined,
  candidate: BoundaryCandidate,
  event: LunarPhaseEvent,
  previousEvent: LunarPhaseEvent | undefined,
  options: LunisolarOptions,
): ConstrainedNominalScore {
  const previousCandidate = previous?.starts[previous.starts.length - 1]
  const previousDayIndex =
    previousCandidate == null ? undefined : boundary_day_index(options, previousCandidate)
  const changed = candidate.day_index === candidate.nominal_day_index ? 0 : 1
  const shifted = Math.abs(candidate.day_index - candidate.nominal_day_index)
  const intervalWidth = Math.max(0, event.upper_at - event.lower_at)
  const support =
    intervalWidth === 0 ? (changed ? 1 : 0) : 1 - candidate.interval_overlap_msec / intervalWidth
  const predictedDays = options.civilDay
    ? civil_day_at(options, event.at).day_index -
      civil_day_at(options, previousEvent?.at ?? event.at).day_index
    : (event.at - (previousEvent?.at ?? event.at)) / options.dayMsec
  const residual =
    previousDayIndex == null || previousEvent == null
      ? 0
      : Math.abs(candidate.day_index - previousDayIndex - predictedDays)
  return [
    (previous?.score[0] ?? 0) + changed,
    (previous?.score[1] ?? 0) + shifted,
    (previous?.score[2] ?? 0) + support,
    (previous?.score[3] ?? 0) + residual,
  ]
}

function constrained_boundary_selection(
  options: LunisolarOptions,
  events: readonly LunarPhaseEvent[],
  candidateSets: readonly BoundaryCandidate[][],
): LunisolarBoundarySelection {
  const policy = constrained_nominal_options(options)
  const requestedTieBreak = policy?.tieBreak ?? 'earlier'
  const tieBreak = requestedTieBreak === 'later' ? 'later' : 'earlier'
  let states: BoundaryPath[] = []
  for (let index = 0; index < candidateSets.length; index++) {
    const candidates = candidateSets[index]
    const nextStates: BoundaryPath[] = []
    for (const candidate of candidates) {
      const incoming: BoundaryPath[] = []
      if (index === 0)
        incoming.push({
          score: [0, 0, 0, 0],
          starts: [],
          optimal_path_count: 1,
          alternatives: [[]],
        })
      for (const previous of states) {
        const previousStart = previous.starts[previous.starts.length - 1]
        if (previousStart >= candidate.last_at) continue
        const previousDayIndex = boundary_day_index(options, previousStart)
        const [minDays, maxDays] = month_length_range(options, events[index - 1], events[index])
        const monthDays = candidate.day_index - previousDayIndex
        if (monthDays < minDays || maxDays < monthDays) continue
        incoming.push(previous)
      }
      let best: BoundaryPath | undefined
      for (const previous of incoming) {
        const score = path_score(previous, candidate, events[index], events[index - 1], options)
        const path: BoundaryPath = {
          score,
          starts: [...previous.starts, candidate.last_at],
          optimal_path_count: previous.optimal_path_count,
          alternatives: previous.alternatives.map((alternative) => [
            ...alternative,
            candidate.last_at,
          ]),
        }
        if (!best || score_compare(path.score, best.score) < 0) {
          best = path
        } else if (score_compare(path.score, best.score) === 0) {
          best.optimal_path_count += path.optimal_path_count
          best.alternatives = [...best.alternatives, ...path.alternatives].slice(0, 8)
          if (compare_path_order(path.starts, best.starts, tieBreak) < 0) {
            best.starts = path.starts
          }
        }
      }
      if (best) nextStates.push(best)
    }
    states = nextStates
    if (states.length === 0) {
      throw new LunisolarBoundaryConstraintError({
        source_events: events,
        candidate_days: candidateSets.map((set) => set.map(({ day_index }) => day_index)),
      })
    }
  }
  let selected = states[0]
  for (const state of states.slice(1)) {
    const comparison = score_compare(state.score, selected.score)
    if (
      comparison < 0 ||
      (comparison === 0 && compare_path_order(state.starts, selected.starts, tieBreak) < 0)
    ) {
      selected = state
    } else if (comparison === 0) {
      selected = {
        ...selected,
        optimal_path_count: selected.optimal_path_count + state.optimal_path_count,
        alternatives: [...selected.alternatives, ...state.alternatives].slice(0, 8),
      }
    }
  }
  if (requestedTieBreak === 'error' && selected.optimal_path_count > 1) {
    throw new AmbiguousLunisolarBoundaryError({
      source_events: events,
      candidate_days: candidateSets.map((set) => set.map(({ day_index }) => day_index)),
      partial_selection: {
        selected: selected.starts,
        score: selected.score,
        globally_ambiguous: true,
        optimal_path_count: selected.optimal_path_count,
        alternative_boundaries: selected.alternatives,
      },
    })
  }
  return {
    selected: selected.starts,
    score: selected.score,
    globally_ambiguous: selected.optimal_path_count > 1,
    optimal_path_count: selected.optimal_path_count,
    alternative_boundaries: selected.alternatives,
  }
}

export function resolve_lunisolar_boundary_starts(
  options: LunisolarOptions,
  sourceTimes: readonly BoundaryEventInput[],
): BoundaryResolution[] {
  const tolerance = boundary_tolerance(options)
  if (!Number.isFinite(tolerance) || tolerance < 0 || options.dayMsec <= tolerance) {
    throw new Error(`invalid lunar boundary tolerance ${tolerance}`)
  }
  const events = sourceTimes.map((source, index) => boundary_event(options, source, index))
  for (let index = 1; index < events.length; index++) {
    if (events[index - 1].at >= events[index].at) {
      throw new Error('lunar boundary times must be strictly increasing')
    }
  }
  if (events.length === 0) return []
  const candidateSets = events.map((event) => boundary_candidates(options, event))
  const ambiguous = candidateSets.map((candidates) => 1 < candidates.length)
  if (
    options.boundaryPolicy !== 'constrained-nominal' &&
    typeof options.boundaryPolicy !== 'object'
  ) {
    return candidateSets.map((candidates, index) => ({
      last_at:
        candidates.find((candidate) => candidate.day_index === candidate.nominal_day_index)
          ?.last_at ?? candidates[0].last_at,
      ambiguous: ambiguous[index],
      boundary_selection_summary: nominal_boundary_selection_summary(
        candidates.find((candidate) => candidate.day_index === candidate.nominal_day_index) ??
          candidates[0],
        ambiguous[index],
      ),
    }))
  }
  const selection = constrained_boundary_selection(options, events, candidateSets)
  return selection.selected.map((last_at, index) => ({
    boundary_selection_summary: constrained_boundary_selection_summary(
      candidateSets[index],
      last_at,
      ambiguous[index],
      selection,
    ),
    last_at,
    ambiguous: ambiguous[index],
    boundary_selection: selection,
  }))
}

function nominal_boundary_selection_summary(
  selected: BoundaryCandidate,
  ambiguous: boolean,
): LunisolarBoundarySelectionSummary {
  return {
    policy: 'nominal',
    selected_at: selected.last_at,
    nominal_at: selected.nominal_at,
    changed: false,
    locally_ambiguous: ambiguous,
    globally_ambiguous: false,
    optimal_path_count: 1,
  }
}

function constrained_boundary_selection_summary(
  candidates: readonly BoundaryCandidate[],
  selectedAt: number,
  ambiguous: boolean,
  selection: LunisolarBoundarySelection,
): LunisolarBoundarySelectionSummary {
  const selected = candidates.find((candidate) => candidate.last_at === selectedAt) ?? candidates[0]
  return {
    policy: 'constrained-nominal',
    selected_at: selectedAt,
    nominal_at: selected.nominal_at,
    changed: selectedAt !== selected.nominal_at,
    locally_ambiguous: ambiguous,
    globally_ambiguous: selection.globally_ambiguous,
    optimal_path_count: selection.optimal_path_count,
    score: selection.score,
  }
}

function lunisolar_boundaries_around(
  options: LunisolarOptions,
  utc: number,
): LunisolarPhaseBoundary[] {
  if (!options.moony) {
    throw new Error('lunisolar requires a satellite orbital model')
  }
  const periodMsec = options.lunarSynodicPeriodMsec ?? options.moony.periodMsec
  const newMoon = lunar_phase_event(options, 0, utc, 0)

  // 前後の探索幅は「太陽年に含まれる朔望月数 + 安全マージン」から導く。
  // 地球の月では ceil(太陽年/朔望月)=13 なので従来と同じ過去18/未来19ヶ月
  // (中心を含む37ヶ月区間)になる。月が地球より短い場合は年境界を見失わない
  // よう探索幅を広げ、長い場合は不要な探索を減らす。
  const window = lunisolar_month_window_counts(options)
  const constrained = constrained_nominal_options(options)
  const solarYearMsec = options.solarPeriodMsec ?? periodMsec * 13
  const monthsPerSolarYear = Math.max(1, Math.ceil(solarYearMsec / periodMsec))
  const maxStabilityExpansions = constrained?.maxStabilityExpansions ?? 4
  if (!Number.isInteger(maxStabilityExpansions) || maxStabilityExpansions < 0) {
    throw new Error(`invalid lunar boundary stability expansions ${maxStabilityExpansions}`)
  }

  const buildEvents = (past: number, future: number) => {
    const events = [newMoon]
    for (let i = 0; i < past; i++) {
      events.unshift(lunar_phase_event(options, 0, events[0].at - periodMsec, 0))
    }
    for (let i = 0; i < future; i++) {
      events.push(lunar_phase_event(options, 0, events[events.length - 1].at + periodMsec, 0))
    }
    return events
  }

  let previous:
    | { events: LunarPhaseEvent[]; resolutions: BoundaryResolution[]; extraPast: number }
    | undefined
  let finalEvents: LunarPhaseEvent[] | undefined
  let finalResolutions: BoundaryResolution[] | undefined
  for (let expansion = 0; expansion <= (constrained ? maxStabilityExpansions : 0); expansion++) {
    const extraPast = expansion * monthsPerSolarYear
    const events = buildEvents(window.past + extraPast, window.future + extraPast)
    let resolutions: BoundaryResolution[]
    try {
      resolutions = resolve_lunisolar_boundary_starts(options, events)
    } catch (error) {
      if (!(error instanceof LunisolarBoundaryConstraintError) || !constrained) throw error
      if (expansion === maxStabilityExpansions) throw error
      continue
    }
    finalEvents = events
    finalResolutions = resolutions
    if (!constrained || maxStabilityExpansions === 0) break
    // すべての朔イベントが1つのcivil day候補に確定している場合、探索窓を
    // 広げても中央の候補選択は変わらない。制約選択自体は既に完了している
    // ため、重複した天文イベントの再計算を省略できる。
    if (!resolutions.some(({ ambiguous }) => ambiguous)) break
    if (
      previous &&
      boundary_resolution_window_matches(
        previous.resolutions,
        previous.extraPast,
        resolutions,
        extraPast,
        window.past + window.future + 1,
      )
    ) {
      break
    }
    previous = { events, resolutions, extraPast }
    if (expansion === maxStabilityExpansions) {
      throw new UnstableLunisolarBoundaryError({
        source_events: events,
        candidate_days: [],
        partial_selection: resolutions[0]?.boundary_selection,
      })
    }
  }
  if (!finalEvents || !finalResolutions) {
    throw new UnstableLunisolarBoundaryError({
      source_events: [],
      candidate_days: [],
    })
  }
  const source_kind = options.boundarySource ?? 'observed'
  return finalEvents.slice(0, -1).map((event, index) => {
    const nextAt = finalEvents[index + 1]
    const resolution = finalResolutions[index]
    const nextResolution = finalResolutions[index + 1]
    return {
      index,
      last_at: resolution.last_at,
      next_at: nextResolution.last_at,
      source_at: event.at,
      next_source_at: nextAt.at,
      source_kind: event.source_kind ?? source_kind,
      boundary_ambiguous: resolution.ambiguous,
      boundary_selection: resolution.boundary_selection,
      boundary_selection_summary: resolution.boundary_selection_summary,
    }
  })
}

function boundary_resolution_window_matches(
  previous: readonly BoundaryResolution[],
  previousExtraPast: number,
  current: readonly BoundaryResolution[],
  currentExtraPast: number,
  centralEventCount: number,
) {
  for (let index = 0; index < centralEventCount; index++) {
    const previousResolution = previous[previousExtraPast + index]
    const currentResolution = current[currentExtraPast + index]
    if (!previousResolution || !currentResolution) return false
    if (
      previousResolution.last_at !== currentResolution.last_at ||
      previousResolution.ambiguous !== currentResolution.ambiguous
    ) {
      return false
    }
  }
  return true
}

function lunisolar_principal_term(options: LunisolarOptions, boundary: LunisolarPhaseBoundary) {
  const termCount = options.principalTermCount ?? 12
  if (!Number.isInteger(termCount) || termCount <= 0) {
    throw new Error(`invalid principal term count ${termCount}`)
  }
  const near = (boundary.source_at + boundary.next_source_at) / 2
  const startAt = boundary.last_at
  const nextAt = boundary.next_at
  // principalTermCount は「月名を決める中気の数」。地球型なら12、木星・
  // カリストのように1太陽年あたり約260朔望月ある暦では260にできる。
  // 探索窓は lunisolar_month_window_counts() が月/年比率から広げ、ここでは
  // その年を principalTermCount 等分した中気のうち、この月に入るものを探す。
  for (let index = 0; index < termCount; index++) {
    const at = options.solarPhase(index / termCount, near)
    if (startAt <= at && at < nextAt) {
      return {
        index,
        longitudeDeg: (index * 360) / termCount,
        month: ((index + 1) % termCount) + 1,
        at,
      }
    }
  }
  return undefined
}

function local_timezone_msec({ dayMsec, geo }: LunisolarOptions) {
  return (dayMsec * (geo[2] != null ? geo[2] : geo[1])) / 360
}

function civil_day_at(options: LunisolarOptions, utc: number): CivilDayBoundary {
  if (options.civilDay) return options.civilDay.at(utc)
  const day_index = Math.floor((utc - options.dayZero) / options.dayMsec)
  const last_at = day_index * options.dayMsec + options.dayZero
  return { day_index, last_at, next_at: last_at + options.dayMsec }
}

function civil_day_at_index(options: LunisolarOptions, dayIndex: number): CivilDayBoundary {
  if (options.civilDay) return options.civilDay.atIndex(dayIndex)
  const last_at = dayIndex * options.dayMsec + options.dayZero
  return { day_index: dayIndex, last_at, next_at: last_at + options.dayMsec }
}
