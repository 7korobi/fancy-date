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

## 天保暦の比較例と実装契約の範囲

国立天文台の[定気法の影響に関する解説](https://eco.mtk.nao.ac.jp/koyomi/wiki/C2C0B1A2C2C0CDDBCEF12FC4EAB5A4CBA1A4CEB1C6B6C1.html)
は、天保暦で冬至を含む月を11月、春分を含む月を2月、夏至を含む月を5月、秋分を含む月を
8月とするアンカー月の制約を説明する。嘉永4/5年（1851–52）の同機関による現代の比較・
再構成には、1851-11-23・1852-01-21のような一月内に中気が二件ある月と、1851-12-23・
1852-03-21のような中気のない月の双方があり、天保暦と時憲暦の割当も異なる。詳細と出典の
種別は[歴史的台帳](historical-lunisolar-ledger.md#定気法の閏月規則と1868年証拠の射程)を参照。

『新法暦書續編』の原文は、無中気月を閏とするだけでなく、一月に二中気がある場合はその前後の
無中気月から選び、二至二分をそれぞれ本月に置く条件を記す。慶應四年の所蔵暦面も閏四月を
直接記録し、全13か月の中気を照合すると閏四月のみ無中気で、二中気の月はない。ただし、
この年は原文の「一月に二中気がある場合」の選択分岐を実例検証する資料ではなく、閏四月の
結果と個別年の判断過程も暦面には説明されない。これは年単位の暦固有 policy を必要とする
史料上の根拠であり、実装契約と個別年の歴史的算法の立証は区別する。規則の翻刻と1868年の
全13か月の中気一覧は[歴史的台帳](historical-lunisolar-ledger.md)を参照。

この例が示すのは一律の `first` / `last` / `error` / `split` 規則ではなく、アンカー月を
含む暦固有の制約に沿った割当である。ここで定めるプログラミング契約はソフトウェアの
インターフェースであり、それだけでは歴史的な暦法や個別年の適用を立証しない。

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
