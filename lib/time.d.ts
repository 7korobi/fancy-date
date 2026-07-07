import { Tempo } from './tempo'
export declare const SECOND: number
export declare const MINUTE: number
export declare const HOUR: number
export declare const DAY: number
/**
 * Tempo(旧 TempoView。class Tempo は本ファイルから削除され、
 * tempo.ts(旧 tempo-model.ts)の TempoView が Tempo としてリネームされた)は
 * envelope(zero/now_idx/last_at/next_at)+base(write_at)+rule の
 * 組み合わせで succ()/back()/slide() を実現する。
 *
 * round/ceil/to_list/upto(探索を伴う旧 Tempo のメソッド)は、
 * 呼び出し元がゼロ(コードベース内で一切使われていなかった)と確認の上、
 * FloorTempoRule 等の新設計に役割が引き継がれたため移植していない。
 * deg/is_hit/tick/sleep(呼び出し元は同様にゼロだが、単純な式のため
 * 後方互換のために温存)は TempoView 側に移植済み。
 *
 * WEEK/YEAR/tempo_zero/to_tempo(文字列指定版)は、かつてここに存在したが
 * 削除した。SECOND/MINUTE/HOUR/DAY(上記、本体が実際に使う物理定数)とは異なり、
 * これらは実質的にグレゴリオ暦(1週=7日という文化的な区切り、暦の平均年、
 * 曜日起点でタイムゾーンを考慮した zero 値)を暗黙の前提にした値であり、
 * fancy-date 自身が「暦は FancyDate のインスタンスとして表現する」という
 * 思想と矛盾していた(実際、本体からは一切参照されておらず、外部向けの
 * 飾りとして残っていただけだった)。これらが必要な場面では
 * Calendar.Gregorian.calc.msec.{year,week} /
 * Calendar.Gregorian.calc.zero.{day,week,...} を直接使う(暦の定義から
 * 導出された値を使うことで、YEAR=31556925.147(固定近似)のような不正確さも
 * 生まれない)。
 */
export declare function to_tempo_bare(
  size: number,
  zero: number,
  write_at_src: number | Date,
): Tempo<{
  write_at: number
}>
export declare function to_tempo_by(
  table: number[],
  zero: number,
  write_at: number,
): Tempo<{
  write_at: number
}>
export type DurationOptions = {
  strict?: boolean
}
export declare function to_msec(str: string, options?: DurationOptions): number
export declare function to_sec(str: string, { strict }?: DurationOptions): number
