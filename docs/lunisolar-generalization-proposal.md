# 太陽太陰暦アルゴリズム一般化 仕様案

Status: proposal

この文書は、今回追加したタイ暦公式規則を出発点に、平均太陰太陽暦・観測太陰太陽暦・地域固有の官暦を同じ基盤で扱うための仕様案である。直ちに全アルゴリズムを書き換えるための確定仕様ではなく、境界を先に固定するための設計文書とする。

## 1. 目的と非目的

目的は、次の三つを混同しないことである。

- 天体現象から得られる連続量: 朔、望、太陽位相、中気、太陽年。
- 暦法が現象を日付へ割り当てる規則: 月番号、閏月、閏日、年初、日界。
- 利用者へ見せる座標: 年番号、元号、月名、`8/8` のような別名、数詞。

非目的は、すべての伝統暦を「中気がない月を閏月にする」という一つの規則へ押し込むことである。今回のタイ暦公式モデルのように、天文近似とは別に固定表・計算規則・例外表を持つ暦がある。

## 2. 層構造

### 2.1 天文層

天文層は、指定された近傍に対して境界候補を返す。少なくとも次を分ける。

- `mean`: 周期と epoch による平均境界。
- `observed`: 天体モデルの `timeOfPhase()` と太陽位相探索による境界。
- `solarYear`: 年の基準となる太陽周期または位相座標。

天文層は月に番号を付けない。複数の候補が同じ civil month に入る可能性や、候補が一つもない可能性を上位へ渡す。

### 2.2 Civil policy 層

Civil policy は、天文層の候補または固定日数列を暦座標へ変換する。候補の入力は次のような構造を想定する。

```ts
type LunisolarBoundary = {
  last_at: number
  next_at: number
  source_at?: number
  source_kind?: 'mean' | 'observed' | 'table'
}

`LunisolarBoundary` は `last_at`/`next_at` と天文由来のsource metadataを持つ、月番号付与前の境界候補である。
```

Policy の責務は以下である。

- `yearOf(context, boundary)` による暦年の決定。
- `monthOf(context, boundary)` による月番号の決定。
- `isLeapMonth(context, boundary)` による閏月識別。
- `dayLength(context, month)` による閏日を含む civil day 数の決定。
- 年初と次年初の半開区間 `[last_at, next_at)` の確定。

月境界の生成と policy を一つの関数に閉じ込めず、同じ天文結果に複数の地域 policy を適用できる形を目標にする。

この境界形状は `src/phenomena/calendar-policy.ts` に置き、Phase 4で`PrincipalTermLunisolarPolicy`へ接続した。初期に検討した汎用契約は実装形状と一致しなかったため公開面へ持ち込まず、現在は境界生成と中気による割り当てを担うpolicyを正本とする。

Phase 3では `PeriodicCalendarYearPolicy` を Gregorian/Julian の既存年表へ接続する。これは閏年の年構造だけをpolicy化する最初の実装であり、月境界や太陰太陽暦のpolicyは後続Phaseで分離する。

Phase 4では、平均・観測太陰太陽暦の朔望月境界列を先に生成し、その列へ`PrincipalTermLunisolarPolicy`を適用する。中気による月番号・閏月・年番号の割り当てを境界生成から分離する。PrincipalTerm入力は`LunisolarPhaseBoundary`として`source_at`／`next_source_at`を必須にし、tableなどsource phaseを持たない境界候補とは型を分ける。既存の`LunisolarDate`へ返す結果形状は維持する。

Phase 5では、Thaiの固定年長・固定月配置・閏日/閏月判定を`ThaiModernLunisolarYearPolicy`へ接続する。これはPrincipalTerm policyとは異なる表/規則policyだが、`CalendarYearPolicy`の共通契約を使う。天文月境界からThaiの月を推論することはせず、Thai policyが解決したyear layoutを日付投影へ使う。

Phase 6では、`.division()`へ渡す`HourDivisionInput`を正規化済みの`HourDivisionPolicy`へ変換し、`dayStart()`/`dayBoundary()`とは独立したHour分割軸として実経路へ接続する。入力では`arithmetic`を省略できるが、内部policyでは必須とする。固定境界列は`kind: 'table'`、不定時法は`kind: 'temporal'`、従来の等分は`kind: 'equal'`で表す。`HourArithmeticPolicy`は、`add/span/succ` semanticsを`elapsed-duration`と`boundary-step`に分ける契約である。

Phase 7では、暦日の開始方法を`DayBoundaryPolicy`へ正規化する。`midnight`、`fixed-offset`、`solar-event`をHour分割とは別軸で扱い、`dayStart()`/`dayBoundary()`の既存互換APIから同じpolicyへ接続する。solar eventが指定されている場合にfixed offsetより優先する既存の組み合わせ semanticsも維持する。

Phase 8では、天体現象をcivil dayへ投影する`DayAssignmentPolicy`を追加する。tithiのような現象は、day boundaryを決めるpolicyでも、月番号を決めるlunisolar policyでもなく、各civil dayへ現象indexを割り当てる第三の軸である。必要な天体モデルなどの依存はpolicy factoryへ明示注入し、raw連続indexと表示用`now_idx`、`repeated`/`skipped` flagsを保持する。旧callback型やcalendar全体を渡すadapterは公開しない。

Phase 9では、年ごとの宗教行事を基礎暦へ投影する`FeastPolicy`を追加する。policyは`{ year }`を受けてcivil date付きの行事列を返し、Computusのような計算伝統を基礎暦の天体モデルや市民暦表示から分離する。`ChurchFeastPolicy`が計算結果を返し、`churchFeastDates()`が担う別市民暦への変換とlabel付与はprojection/notation層に置く。将来の`ThaiBuddhistFeastPolicy`も同じ契約へ接続できるが、政府休日の年表や宗派別の採用日はこのpolicyとは別のoverride層とする。

Phase 10では、Hourの区画生成と、Hourを含む相対日時操作の意味を`HourArithmeticPolicy`で分ける。`elapsed-duration`は公称Hour幅を固定durationとして`add()`/`span()`へ適用し、`boundary-step`は不定時法・表形式Hourの実境界を次の区画として扱う。`Tempo.succ()`/`back()`は区画そのものの遷移なので常にruleのboundary stepを使い、calendar-levelの相対操作だけがこのpolicyを参照する。既定値は等分Hourがelapsed、temporal/table Hourがboundaryである。

Phase 11では、Thai近代太陰太陽暦を基礎にした`ThaiBuddhistFeastPolicy`を追加する。policyの入力年は仏暦年、結果の`date`は指定地点の現地Gregorian civil date、`utc`とThai lunar month/dayを併記する。通常年は3/15・6/15・8/15・8/16・11/15を採用し、閏月年は8月の宗教行事を後半の8/8へ移す。現段階では宗教日の計算に限定し、政府休日、週末振替、宗派・地域差は別のtable/override providerの責務とする。

Phase 12では、`ThaiBuddhistFeastPolicy`の結果をsampleのlabel／notes APIへ投影する。`thaiBuddhistFeastDates()`は計算済みのlocal civil dateを再計算せず表示labelを付け、`thaiBuddhistFeastNotes()`は指定した暦日の境界と行事の`utc`を照合する。政府休日の振替日や、宗派・地域ごとの表示名はこのadapterへ固定せず、別のnotation／override層で差し替えられる形を保つ。

季節現象・暦注は、天体イベントを直接返す関数群として増やさず、`CalendarNotePolicy`の実装へ集約する。`SolarTermPolicy`はmean／observedのterm setを返し、`ZassetsuPolicy`はそのterm setから雑節を合成し、`JapaneseFixedDateNotePolicy`は節句・風習、`ReligiousFixedDateNotePolicy`はカトリック・仏教の固定日noteを返す。これらのphaseと固定日制約の定義値は`calendar-note-data.ts`へ集約し、表示labelはlocaleの責務として分離する。`solar.ts`は計算、`calendar-notes.ts`はpolicy実装に留め、`fancy-date.ts`は各policyを呼び出してnoteを合成する。公開APIは`FancyDate.note()`を正本とし、term set・雑節・節句の中間結果はpolicyとnote構築内部に留める。独立した天文primitiveである`solar_phase()`は別責務として維持する。

localeの責務は、tokenのfallback label、span unitのruby、季節注の表示名など、言語へ依存する一般語彙を提供することとする。教会暦やThai feastのID labelのようにfeature固有の語彙は、各sample derived adapterがlabel overrideとともに管理し、core localeへ混ぜない。

### 2.3 座標・表示層

内部計算では、リセットされない `raw_year` と表示用の `year` を分ける。元号、仏暦、地域の年番号は `raw_year` から導出する注釈とし、月の `month_index` と表示月番号も分離する。

表示層は policy の意味を再計算しない。例えばタイ暦の8/8は、月番号8と `is_leap_month=true` を受けて表示する。`閏8`、`เดือนแปดหลัง`、`8/8` などの表記差は notation の責務とする。

## 3. 月境界と日界

すべての境界は半開区間 `[last_at, next_at)` とする。`utc === next_at` は次の月または次の日に属する。

観測朔を暦日に割り当てる policy は `nominal` と `constrained-nominal` を持つ。
`nominal` は代表朔時刻をそのまま日境界へ投影し、日境界から
`boundaryToleranceMsec` 以内の朔には `boundary_ambiguous` を付ける。
`constrained-nominal` は、その前後の日を候補として生成し、朔境界列が厳密に
増加する経路だけを残した上で、月長hard constraint・誤差区間・nominalからの
変更量を辞書順scoreで評価し、決定的な経路を選ぶ。探索窓を太陽年単位で拡張し、
中央境界が安定した場合だけ結果を確定する。同点・制約違反・不安定な窓は専用の
selection metadataまたは例外で表す。固定幅日界と日の出／日没の可変幅日界は同じ
`CivilDayModel`契約へ接続し、朔候補・月長・月内日数が同じ `day_index` を参照する。
以下を実装契約とする。

### 3.1 共通イベント型とpolicy入力

天文層はscalar時刻だけでなく、代表時刻と誤差区間を返す。

```ts
type LunarPhaseEvent = {
  cycle: number
  phase: number
  at: number
  lower_at: number
  upper_at: number
  source_kind: 'mean' | 'observed' | 'table'
  numeric_error_msec: number
  model_error_msec?: number
}

type ConstrainedNominalOptions = {
  kind: 'constrained-nominal'
  boundaryToleranceMsec?: number
  monthLength?:
    | { kind: 'event-derived' }
    | { kind: 'fixed-range'; minDays: number; maxDays: number }
  tieBreak?: 'earlier' | 'later' | 'error'
  maxStabilityExpansions?: number
}

type LunisolarBoundaryPolicyInput = 'nominal' | 'constrained-nominal' | ConstrainedNominalOptions

type LunisolarBoundaryCandidate = {
  last_at: number
  day_index: number
  nominal_day_index: number
  interval_overlap_msec: number
}
```

`lower_at <= at <= upper_at` を必須とする。`lower_at` / `upper_at` は根探索の
数値的な挟み込み区間へ `model_error_msec` を左右に加えた最終区間とする。
既存の文字列指定 `'constrained-nominal'` は、
`{ kind: 'constrained-nominal', monthLength: { kind: 'event-derived' },
tieBreak: 'earlier', maxStabilityExpansions: 4 }` の shorthand とする。
`boundaryToleranceMsec` はscalar時刻しか返せないlegacy resolverを上記イベント型へ
包む互換用であり、新しいイベントモデルでは `lower_at` / `upper_at` を正本にする。
`ObservedLunisolarOptions.boundaryPolicy` は `LunisolarBoundaryPolicyInput` を受ける。
既存のトップレベル `boundaryToleranceMsec` は互換維持し、object形式では
`boundaryPolicy.boundaryToleranceMsec` を優先する。未知のpolicy文字列、負の許容幅、
非整数または `minDays <= 0` / `maxDays < minDays` のfixed rangeは初期化時に弾く。

候補暦日は、誤差区間 `[lower_at, upper_at]` と交わるすべての半開暦日
`[dayStart, nextDayStart)` から生成する。ただし `lower_at === upper_at === dayStart`
なら、その点は半開区間規則により後の暦日だけに属する。区間幅が複数日に及ぶ場合も
候補数を2に固定せず、交わる全日を保持する。候補は時刻だけでなく、同じ
`DayBoundaryPolicy` が返す単調な暦日連番 `day_index` を持つ。midnight／fixedOffsetの
固定幅暦日では `floor((last_at - dayZero) / dayMsec)` と同値にし、sunrise／sunsetの
可変幅暦日では実境界を前後へ辿った通し番号を使う。

### 3.2 手順1: 選択済み境界へ中気・閏月判定を接続する

処理順を次で固定する。

```text
月相イベント列
  -> 候補暦日列
  -> constrained-nominalによる境界列選択
  -> 選択済み[last_at, next_at)への中気包含判定
  -> 月番号・閏月・年番号の割り当て
```

`lunisolar_principal_term()` は `source_at` / `next_source_at` を再度
`local_day_start()` へ通してはならず、必ず選択済みの `boundary.last_at` /
`boundary.next_at` を使う。中気時刻 `term.at` について
`last_at <= term.at && term.at < next_at` の月へ割り当て、`term.at === next_at`
は次月に属する。境界候補を変更した結果、中気を含む月が変わる場合は、その
選択結果に基づいて月番号・閏月・年初をすべて再計算する。

受入条件:

- syntheticな朔境界を1日動かして中気が隣月へ移るfixtureで、月番号と閏月も同時に移る。
- `last_at` / `next_at` と中気判定が異なる基準日を参照する経路を残さない。
- 既存NAOJ旧暦fixtureは無変更で通る。

### 3.3 手順2: 月長hard constraintを追加する

連続する選択済み境界候補を `B_i`, `B_(i+1)` とし、civil month lengthを
`L_i = B_(i+1).day_index - B_i.day_index` とする。すべての `L_i` は正の整数で
なければならない。固定幅暦日では `(next.last_at - current.last_at) / dayMsec` と
同値だが、日の出／日没起点のような可変幅暦日では実時間差を日数として使わない。

固定幅暦日の `event-derived` では、連続する月相イベントの誤差区間から月ごとの
許容範囲を次で導く。

```text
deltaMin = next.lower_at - current.upper_at
deltaMax = next.upper_at - current.lower_at
minDays = max(1, floor(deltaMin / dayMsec))
maxDays = max(minDays, ceil(deltaMax / dayMsec))
```

候補edgeは `minDays <= L_i <= maxDays` を満たす場合だけ有効とする。
可変幅暦日では、両イベントの誤差区間と実際に交わる候補暦日の直積から
`day_index` 差の最小・最大を求める。平均 `dayMsec` への除算で近似しない。
`fixed-range` は暦法が独自に許す月長を指定する。イベント由来範囲も計算できる場合は
両範囲の共通部分を使い、共通部分が空なら設定矛盾として例外にする。地球の29/30日を
他天体へ暗黙適用してはならない。架空天体の既定は `event-derived` とする。

年の月数は `principalTermCount` と中気policyから導き、12/13月を共通hard constraint
にはしない。暦固有に通常年・閏年の月数を固定したい場合だけyear policy側に置く。

受入条件:

- 地球型の29.5日前後のイベント列から29日または30日だけが許可される。
- 創作赤星では、その太陽相対朔間隔から導いた範囲が使われ、29/30日は要求されない。
- 全edgeが除外された場合は補正を捏造せず、`LunisolarBoundaryConstraintError` を返す。

### 3.4 手順3: 選択コストを辞書順で定義する

`constrained-nominal` は「見た目が整う月列」を作るpolicyではなく、hard constraintを
満たす範囲でnominalを最大限保存するpolicyとする。29日・30日の交互配置や、同じ
月長の連続に対する恣意的な賞罰は入れない。

各経路のscoreを次のtupleとして計算し、左から辞書順で最小化する。

```ts
type ConstrainedNominalScore = readonly [
  changedBoundaryCount: number,
  shiftedDayCount: number,
  intervalSupportPenalty: number,
  monthLengthResidual: number,
]
```

- `changedBoundaryCount`: nominal暦日と異なる境界数。
- `shiftedDayCount`: `abs(day_index - nominal_day_index)` の合計。
- `intervalSupportPenalty`: 誤差区間と候補暦日の重なりが小さいほど増える値。
  区間幅が正なら `1 - overlap / intervalWidth`、点イベントならnominal候補を0とする。
- `monthLengthResidual`: 各月について
  `abs(L_i - (next.at - current.at) / dayMsec)` を合計した値。

浮動小数点比較には固定epsilonを使い、scoreの各成分を無根拠なweightで一つの
scalarへ合成しない。nominal経路がhard constraintを満たす場合は
`changedBoundaryCount === 0` のため必ずnominalが勝つ。つまり、このpolicyは
自然さだけを理由に正しいnominal境界を変更しない。

受入条件:

- nominal経路が適法なら、月長残差が小さい代替経路があってもnominalを維持する。
- nominal経路が不適法な場合、変更境界数が同じ候補間では移動日数、区間support、
  月長残差の順で選択される。
- 同じ入力・候補順・query順でscoreと選択結果が常に一致する。

選択器は候補列を層状DAGとして解く。第 `i` 層の候補から第 `i+1` 層の候補へ、
hard constraintを満たす場合だけedgeを張る。各nodeには「そこへ到達する最良score、
同点最良経路数、復元用の直前node、上位8本までの同点経路」を保持する。
候補数を `k_i` とした計算量は `O(sum(k_i * k_(i+1)))`、通常各朔1〜2候補なら
朔数に対して線形である。全経路を列挙してから比較してはならない。

### 3.5 手順4: 同点・曖昧性・探索窓の契約を定める

最良scoreを持つ経路が複数ある場合、情報不足を隠さず結果へ残す。

```ts
type LunisolarBoundarySelection = {
  selected: readonly number[]
  score: ConstrainedNominalScore
  globally_ambiguous: boolean
  optimal_path_count: number
  alternative_boundaries: readonly (readonly number[])[]
}
```

`LunisolarDate` は後方互換の `boundary_ambiguous?: boolean` を維持し、追加で
次のselection要約を返せるようにする。

```ts
type LunisolarBoundarySelectionSummary = {
  policy: 'nominal' | 'constrained-nominal'
  selected_at: number
  nominal_at: number
  changed: boolean
  locally_ambiguous: boolean
  globally_ambiguous: boolean
  optimal_path_count: number
  score?: ConstrainedNominalScore
}
```

`boundary_ambiguous` は `locally_ambiguous` の互換aliasとし、選択済み月初側の情報を
表す。次月初の情報は `next_boundary_selection` として別に保持し、一つのbooleanで
両端をまとめない。`LunisolarBoundaryConstraintError` /
`AmbiguousLunisolarBoundaryError` / `UnstableLunisolarBoundaryError` は共通して
`code`, `source_events`, `candidate_days`, `partial_selection?` を持つ。

`tieBreak: 'earlier'` は境界列を先頭から比較して最初に小さい経路、`later` は大きい
経路を選ぶ。これは物理的に正しいという主張ではなく、カレンダーを必ず成立させる
ためのcanonicalizationである。`error` は最良経路が複数なら
`AmbiguousLunisolarBoundaryError` を返す。どのmodeでも
`globally_ambiguous` と `optimal_path_count` は同じ値を返す。`error` modeの例外は
`selection: LunisolarBoundarySelection` を保持し、呼び出し側が候補を調査できるようにする。

`alternative_boundaries` は既定で最大8経路まで保持し、それ以上はcountだけを返す。
各月の `boundary_ambiguous` は「その朔に複数候補があったか」、
`globally_ambiguous` は「全体最適化後も複数の同点経路が残ったか」を表し、混同しない。

同じ月を異なる `utc` から問い合わせても結果が変わらないことを必須不変条件とする。
初期探索窓と、その前後へ1太陽年相当の朔を追加した拡張窓の両方で解き、返却対象の
中央境界列・score・曖昧性が一致した場合だけ確定する。一致しなければ同じ幅ずつ
最大 `maxStabilityExpansions` 回まで拡張する。収束しなければ
`UnstableLunisolarBoundaryError` とし、有限窓の端の都合で選択を固定しない。
キャッシュkeyにはpolicy全体、誤差区間、月長constraintを含める。

受入条件:

- 同点fixtureで `earlier` / `later` / `error` がそれぞれ契約通りになる。
- 窓を前後へ拡張しても中央12〜13ヶ月の選択結果が変わらない。
- 問い合わせ順・キャッシュhit/miss・異なる基準`utc`で同じ月境界を返す。

### 3.6 手順5: 太陽相対の朔イベントモデルを追加する

衛星単独の公転位相0と、観測地点の惑星から見た太陽・衛星の合を分離する。
`OrbitalModel.timeOfPhase()` は既存互換の軌道位相APIとして維持し、太陰太陽暦は
次の独立能力を優先する。

```ts
interface LunarPhaseEventModel {
  synodicPeriodMsec: number
  lunarPhaseEvent(phase: number, near: number): LunarPhaseEvent
}
```

平均月は平均朔望周期adapter、`EarthMoonOrbital` は既存のMeeus系朔弦望公式adapter、
創作楕円衛星は惑星と衛星の黄経を合成する `RelativeLunarPhaseEventModel` を使う。
後者は同一基準面・同一黄経原点を持つlongitude modelだけを受け付け、位相を

```text
relativePhase(at) = mod((moonLongitude(at) - sunLongitude(at)) / 360, 1)
```

と定義する。惑星の恒星中心黄経しかない場合の観測者から見た太陽黄経は180度反転
させる。基準面が異なる、または高傾斜軌道をlongitude投影だけで扱えないモデルは
暗黙変換せず、将来の3次元方向ベクトルmodelを要求する。

根探索は次の契約とする。

1. `synodicPeriodMsec` から `near` 周辺の探索区間を予測する。
2. 1朔望周期を32分割以上でscanし、角度をunwrapして目標位相を挟む区間を得る。
3. bracket付き二分法またはBrent法で、区間幅が数値許容幅以下になるまで縮める。
4. 区間中央を決定的に丸めた値を `at`、bracket端を `lower_at` / `upper_at` とする。
5. 根がない、複数根から最寄りを一意に選べない、残差が規定値を超える場合は例外にする。

数値許容幅の既定は1msだが、遠い過去・未来ではIEEE 754の隣接表現可能値間隔が
1msを超えうるため、実際には `max(1ms, ulp(bracketStart), ulp(bracketEnd))` を使う。
反復回数上限へ達しただけで中央時刻を成功値として返してはならない。

順行・同一方向の円軌道で周期が既知なら、初期推定は
`1 / P_syn = abs(1 / P_moon - 1 / P_year)` を使える。創作赤星の88日衛星・
730.5日太陽年なら平均朔望周期は約100.05日であり、88日を朔望周期として使わない。
`lunisolar_month_window_counts()` と前後朔探索も `moony.periodMsec` ではなく
`LunarPhaseEventModel.synodicPeriodMsec` を使う。

受入条件:

- 円軌道fixtureが解析的な平均朔望周期・合時刻と一致する。
- 離心率を持つ創作衛星で、返却時刻の太陽・衛星相対黄経差が規定残差以内になる。
- 88日/730.5日のfixtureが約100.05日平均になり、複数周期で朔間隔の変動を示す。
- 既存NAOJ朔弦望fixtureの最大差を悪化させない。
- `phaseAt()` と `timeOfPhase()` が逆関数でない `EarthMoonOrbital` に汎用root探索を
  誤適用しない。

### 3.7 実装順と完了条件

上記は 3.2 -> 3.3 -> 3.4 -> 3.5 -> 3.6 の順で実装する。3.2は現行実装の
内部不整合修正、3.3〜3.5はcivil projectionの完成、3.6は創作天体で入力される
「朔」自体の意味を正す変更である。3.6完了前の創作赤星サンプルは
`constrained-nominal` の境界選択例ではあっても、太陽相対朔による完成した
太陰太陽暦とは呼ばない。

完了条件は、全受入条件に加え、同じ月を窓・query順・cache状態を変えて1000回以上
比較して境界差分0件、全月で `last_at < next_at`、隣接月で
`current.next_at === next.last_at` が成立することとする。

日界は天文層と独立した policy option にする。

- `midnight`: 固定タイムゾーンの現地0時。
- `sunrise`: 実際の日の出。
- `sunset`: 実際の日の入。
- `fixedOffset`: 現地0時からの固定オフセット。

タイムゾーンは日数を生成した後に足し引きするのではなく、境界探索と `day_start_at` の両方へ同じ規約で適用する。極域で成立しない日の出・日の入は、無理に `NaN` へ押し込まず、候補なしを表す結果型を将来導入する。

## 4. 太陽基準と中気

太陽基準は次のパラメータを明示する。

- `principalTermCount`: 一太陽年を分ける位相の数。
- `phaseOrigin`: 0 位相がどの天体イベント・季節に対応するか。
- `phaseDirection`: 増加方向。
- `solarYearModel`: 平均周期、実軌道周期、外部表のいずれか。

一つの朔望月に複数の中気が入る場合は、最初の一つを黙って採用しない。policy が `multipleTerms: 'first' | 'last' | 'error' | 'split'` を選ぶ。中気がない月は、一般 policy では閏月候補になるが、タイ暦公式のような表方式ではその判定を使わない。

## 5. 閏月と閏日

閏月と閏日は、各暦の具体的なyear policyが返すmonth layoutの属性として扱う。未接続の汎用型は置かず、Thaiでは`ThaiModernLunisolarYearPolicy`、平均・観測系では`PrincipalTermLunisolarPolicy`の結果を利用する。

同じ年に閏月と閏日を同時に許すか、閏日を閏月の年に限定するかも policy の明示項目にする。月の物理的長さを29.5日から丸める処理と、暦法上の加日を別にする。

今回のタイ暦規則 policy は次の具体例である。

- 通常年: `[29,30,29,30,29,30,29,30,29,30,29,30]`、354日。
- `อธิกวาร`: 7月を30日にする、355日。
- `อธิกมาส`: 8月を2回置く、384日。後半の8月だけ `is_leap=true`。

年型は1901年基準の偏差 seed、年初アンカー表、次年の閏月判定を組み合わせて計算する。これは天文月の中気判定を代用する近似ではなく、タイ暦固有の civil rule として扱う。1903〜2460年は参照実装と照合済みの範囲、2461年以後は最後の seed/anchor から同じ規則を継続する proleptic range とする。後者は公的な将来年表の保証ではない。

## 6. 探索窓

観測モデルの探索窓は、固定した「過去18、未来19」ではなく、太陽年周期と月周期の比率から次のように求める。

```text
monthsPerSolarYear = ceil(solarPeriod / lunarPeriod)
past = monthsPerSolarYear + pastMargin
future = monthsPerSolarYear + futureMargin
```

ただし、これは候補月を年境界へ到達させるための天文層の探索窓に限る。civil policy が表方式であれば、年初アンカーから必要な年だけを解決し、観測月の探索を行わない。比率が極端な天体では、探索窓の十分性を property test で検証する。

## 7. 表・計算規則・override

policy の実装方式は三つを正式に許容する。

1. `rule`: すべての年を決定的な計算式で解決する。
2. `table`: 公刊された年表をそのまま使用し、対応範囲を明示する。
3. `hybrid`: 計算式を標準とし、歴史的改暦・公式表・既知の例外を override する。

各結果には、将来的に次の provenance を付けられるようにする。

```ts
type CalendarProvenance = {
  policy: string
  source?: string
  supportedFrom?: number
  supportedTo?: number
  override?: string
}
```

検証済み範囲外の日付は、別の近似へ静かにフォールバックしない。規則を継続する `proleptic` モードと、年表だけを受け付ける `validated`/`official-table` モードを区別し、結果の provenance で利用者へ示す。歴史的 seed/anchor がない1903年未満は、現在のタイ規則モデルでは `RangeError` または `unsupported` とする。

## 8. 検証方針

最低限、次のテスト群を暦ごとに持つ。

- 年型ごとの年長: 通常、閏日、閏月。
- 月列: 月番号、閏月の位置、各月の日数、年合計。
- 境界: 年初、月初、月末、次年初の半開区間。
- 公開 fixture: 少なくとも一つの通常年、閏日年、閏月年。
- 逆変換: `format(parse(x))` と `parse(format(t))`。
- 遷移: `succ/back`、`add/sub`、`find(step: 'M'|'y')`。
- 実装独立性: 参照実装または公刊表と別プログラムで比較する。

タイ暦規則については、PyThaiNLP の移植元にある1901年基準偏差表と1902年以降の10年アンカーを入力資料とし、1903〜2460年の年型および代表日を比較する。2461年以後は、同じ入力規則を外挿するテストを別に持つ。資料のライセンス・出典 URL はコードではなくこの文書に記録する。

## 9. API 移行案

短期は既存 API を壊さない。

- `lunisolar()` は現在の平均/観測天文モデルを維持する。
- タイ暦規則のような固有 policy は `thaiOfficialLunisolar()` のような明示 opt-in とする。名称に反して、これは政府公表年表の保証ではなく、既知のタイ固有規則を計算するモデルである。
- `ObservedLunisolarMonthRule` は、天文結果と同じ月境界形状を返す civil policy にも使えるよう、月結果の最小構造を受け取る。
- 各暦固有のyear／month policyを必要な実装形状で接続し、未使用の汎用契約を増やさない。

中期には `FancyDate.to_tempos()` 内の「年」「月」「日」の解決を、天文境界と policy の二段階へ切り出す。既存の `MeanLunisolarMonthRule` と `ObservedLunisolarMonthRule` は、その移行期間の互換アダプターとして残す。

## 10. 未決事項

- 旧暦の歴史的改暦をどの年代境界で切り替えるか。
- タイ暦の公式表と、地域・宗派・占星術上の別規則を同じ名前空間でどう表すか。
- `8/8` のような表示専用別名を `notation()` の既存 list/ruby API へどう注入するか。
- 日の出時点で tithi を割り当てるインド系暦のような、月境界とは別の day assignment をどの層へ置くか。
- 複数中気、無中気、年初が太陽年の途中にある暦での `raw_year` の標準化。

## 11. Computus と宗教暦

教会暦やタイ仏教暦の宗教行事は、基礎暦の日付を変更する別暦ではなく、基礎暦へ行事を投影する独立 policy として扱う。Computus では少なくとも次を分ける。

- `system`: Gregorian computus や Julian Paschalion など、計算に使う伝統。
- `calendarSystem`: 結果の `CivilDate` を表示・parseする市民暦。
- `feast`: 復活祭、四旬節、聖週間、昇天祭、聖霊降臨祭などの固定・可動祝祭日。
- `publicHoliday`: 宗教行事を政府休日として採用するかどうか。

教会暦上の満月は、実際の月の天文学的イベントではなく、epact・Golden Number・補正表などを使う計算上の境界である。そのため、通常の`OrbitalModel`や`SATELLITE`へ直接変換して月の出入り・panchanga・物理的な月相と混同させない。内部で周期モデルが便利な場合も、`EcclesiasticalLunarCycle`のような専用adapterに閉じ込める。

同じ構造をタイ暦にも適用する。`ThaiModernLunisolarYearPolicy`が7月加日・8月重複を解決し、別の`ThaiBuddhistFeastPolicy`がマーカブーチャー、ヴィサーカブーチャー、アーサーンハブーチャー、入安居、出安居などを日付へ投影する。政府の休日指定はさらに別の年表/override層とする。

## 参考資料

- [PyThaiNLP `thai_lunar_date.py`](https://raw.githubusercontent.com/PyThaiNLP/pythainlp/dev/pythainlp/util/thai_lunar_date.py)
- [PyThaiNLP の移植元 gist](https://gist.github.com/touchiep/99f4f5bb349d6b983ef78697630ab78e)
- [Thai lunar calendar](https://en.wikipedia.org/wiki/Thai_lunar_calendar)
- [Buddhist calendar](https://en.wikipedia.org/wiki/Buddhist_calendar)
- [Busyakul, Calendar and era in use in Thailand](https://web.archive.org/web/20140116215240/http://www.royin.go.th/upload/61/FileUpload/33_8433.pdf)
