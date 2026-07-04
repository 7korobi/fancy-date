import { Tempo } from './tempo';
export declare const SECOND: number;
export declare const MINUTE: number;
export declare const HOUR: number;
export declare const DAY: number;
type Distance = readonly [limit: number, interval: number, base: number, label: string];
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
 */
export declare function to_tempo(size_str: string, zero_str?: string, write_at?: number | Date): Tempo<{
    write_at: number;
}>;
export declare function to_tempo_bare(size: number, zero: number, write_at_src: number | Date): Tempo<{
    write_at: number;
}>;
export declare function to_tempo_by(table: number[], zero: number, write_at: number): Tempo<{
    write_at: number;
}>;
export type DurationOptions = {
    strict?: boolean;
};
export declare function to_msec(str: string, options?: DurationOptions): number;
export declare function to_sec(str: string, { strict }?: DurationOptions): number;
export declare function to_timer(msec: number, unit_mode?: number): string;
export declare function to_relative_time_distance(msec: number): Distance;
export {};
