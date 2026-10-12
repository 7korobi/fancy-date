# 同一月内の複数 principal term

## 天文イベントと暦法上の割り当て

天文層は、境界選択と安定性確認が完了した月境界 sequence 全体を対象に、覆われた区間
`[first.last_at, last.next_at)` の principal term を各 phase/cycle ごとに一度だけ列挙し、
時刻順に並べて選択済み月境界へ partition する。各月では `[last_at, next_at)` の
半開区間を使い、イベントは `{ index, longitudeDeg, month, at }` の全値を保持する。
開始時刻は含み、終了時刻は含まないため、境界時刻のイベントは次の月だけに属する。
同一 phase index でも異なる solar cycle にあるイベントは別々に残る。
通常は最初の選択境界 `first.last_at` で各 phase の最寄り occurrence を seed にし、
seed が開始境界より前なら区間へ入るまで前進してから、覆われた区間の末尾まで走査する。
seed が区間より後に返った場合は後続イベントを取りこぼさないよう後ろ向きに列挙する。

低レベル `LunisolarOptions` では `solarPeriodMsec` が必須で、有限かつ正の値でなければ
ならない。この周期は `solarPhase` と同じモデルの権威ある cycle-scale period であり、
境界探索窓の大きさと principal term の前後 cycle 探索の両方に使う。ある phase の
イベント時刻 `t` から `t ± solarPeriodMsec` を使って解決した結果は、直前・直後の
同じ phase の occurrence でなければならず、その間に phase は単調にちょうど一周する
（repeat/skip しない）。この契約は `OrbitalModel.timeOfPhase` にも記載され、root の
数値精度許容値を規定するものではない。`solarPhase(phase, near)` は `near` に最も近い
occurrence を返す（同距離ならどちらでもよい）。

この必須化は、`LunisolarOptions` を直接構築する TypeScript 利用者に対する意図的な
低レベル API tightening である。JavaScript 利用時も period が欠落・非有限・非正なら
明示的に例外となる。従来の `lunarPeriodMsec * 13` を太陽周期の暗黙 fallback として
使わない。`FancyDate` の `lunisolar()` 経路は内部の `dic.sunny.periodMsec` を渡すため、
通常の高レベル利用方法に変更はない。

天文イベントの検出と、暦年・月・閏月の決定は別の責務である。選択された全月の
`principal_terms` を一つの連続 sequence として年 assignment policy へ渡し、policy が
月順の1:1出力で `year`、`month`、`is_leap` を決める。固定月 layout 用の
`CalendarYearPolicy` はこの可変 event sequence には使わない。

一回の `lunisolar()` 解決では、policy は問い合わせ月だけでなく、境界探索が生成した
過去・未来の context 月を含む全 sequence を受け取る。sequence は暦年境界で事前に分割
しない。どの月を年初とするかは policy の割当結果そのものだからである。したがって
sequence は複数の暦年にまたがることがあり、policy は全入力月に対して同じ順序の
割当結果を返す。

## Policy contract

`LunisolarPrincipalTermYearPolicy` は次の入力・出力を持つ。

```ts
type LunisolarPrincipalTermMonthInput = LunisolarPhaseBoundary & {
  principal_terms: readonly LunisolarPrincipalTermLike[]
}

type LunisolarPrincipalTermMonthAssignment = {
  input: LunisolarPrincipalTermMonthInput
  year: number
  month: number
  is_leap: boolean
}

type LunisolarPrincipalTermYearPolicy = {
  assign(
    months: readonly LunisolarPrincipalTermMonthInput[],
    context: { principalTermCount: number; yearOf(at: number): number },
  ): readonly LunisolarPrincipalTermMonthAssignment[]
}
```

- `months` は境界時刻順で、各月の `principal_terms` に完全なイベント配列が入る。
- 戻り値は入力と同じ長さ・順序で、各 `input` は対応位置の入力と同一 object
  reference でなければならない。長さ、identity、順序が違えば明示的にエラーになる。
- `year` は整数、`month` は `1..principalTermCount` の整数、
  `is_leap` は boolean とする。不正な月・年・閏月 label もエラーになる。
- policy は全イベント配列を受け取る。特定の term だけを使うか、複数 term をどう
  月番号・閏月へ反映するかは暦固有の規則として実装する。

## Default と互換 API

標準 assignment は、各月に term が高々1件なら従来と同じ month/year/leap 結果を返す。
いずれかの月に複数 term がある場合、普遍的な割り当て規則がないため、first/last を
暗黙に選ばず、custom `yearAssignmentPolicy` が必要である。

組み込みの一部サンプル暦は既存表示を保つため、phase index 昇順で割り当てる暦固有の
互換 policy を明示設定する。同じ phase index が繰り返す月では、source 月中央に最も近い
イベントを選ぶ。この選択規則は一般 default ではなく、全イベントは引き続き
`principal_terms` に残る。

`LunisolarDate.principal_terms` は全件を返す。既存利用向けの
`LunisolarDate.principal_term` は維持し、単一 term なら従来と同じ値、複数なら時刻順で
最初の term を返す互換 view である。割り当て policy はこの単一値を使わず、
常に `principal_terms` 全体を受け取る。

既存の `PrincipalTermLunisolarPolicy` は、1 boundary あたり最大1件の resolver を受ける
互換 adapter として残る。実際の `lunisolar()` は新しい year-level contract を通る。

```ts
import { Calendar, type LunisolarPrincipalTermYearPolicy } from 'fancy-date'

const yearAssignmentPolicy: LunisolarPrincipalTermYearPolicy = {
  assign(months, { principalTermCount, yearOf }) {
    // 例示用の合成規則。実際には対象暦の year/month/leap 規則で全イベントを評価する。
    return months.map((input, index) => ({
      input,
      year: yearOf(input.last_at) + Math.floor(index / principalTermCount),
      month: (index % principalTermCount) + 1,
      is_leap: input.principal_terms.length > 1,
    }))
  },
}

Calendar.GregorianAstronomical.observedLunisolar({ yearAssignmentPolicy })
```

同じ option は `LunisolarOptions` の `yearAssignmentPolicy` にも指定できる。
`observedLunisolar()` で policy を差し替えると lunisolar cache は破棄される。
