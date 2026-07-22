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

Phase 4では、平均・観測太陰太陽暦の朔望月境界列を先に生成し、その列へ`PrincipalTermLunisolarPolicy`を適用する。中気による月番号・閏月・年番号の割り当てを境界生成から分離するが、既存の`LunisolarDate`へ返す結果形状は維持する。

Phase 5では、Thaiの固定年長・固定月配置・閏日/閏月判定を`ThaiModernLunisolarYearPolicy`へ接続する。これはPrincipalTerm policyとは異なる表/規則policyだが、`CalendarYearPolicy`の共通契約を使う。天文月境界からThaiの月を推論することはせず、Thai policyが解決したyear layoutを日付投影へ使う。

Phase 6では、`.division({ H: 'equal' | 'solar' })`を`HourDivisionPolicy`へ正規化し、`dayStart()`/`dayBoundary()`とは独立したHour分割軸として実経路へ接続する。固定境界列は`kind: 'table'`、不定時法は`kind: 'temporal'`、従来の等分は`kind: 'equal'`で表す。`HourArithmeticPolicy`は、後続の`add/span/succ` semanticsを`elapsed-duration`と`boundary-step`に分けるための予約契約であり、今回のPhaseでは既存挙動を変更しない。

Phase 7では、暦日の開始方法を`DayBoundaryPolicy`へ正規化する。`midnight`、`fixed-offset`、`solar-event`をHour分割とは別軸で扱い、`dayStart()`/`dayBoundary()`の既存互換APIから同じpolicyへ接続する。solar eventが指定されている場合にfixed offsetより優先する既存の組み合わせ semanticsも維持する。

Phase 8では、天体現象をcivil dayへ投影する`DayAssignmentPolicy`を追加する。tithiのような現象は、day boundaryを決めるpolicyでも、月番号を決めるlunisolar policyでもなく、各civil dayへ現象indexを割り当てる第三の軸である。既存の`AssignmentRule`は互換adapterとして残し、raw連続indexと表示用`now_idx`、`repeated`/`skipped` flagsを保持する。

Phase 9では、年ごとの宗教行事を基礎暦へ投影する`FeastPolicy`を追加する。policyは`{ year }`を受けてcivil date付きの行事列を返し、Computusのような計算伝統を基礎暦の天体モデルや市民暦表示から分離する。`ChurchFeastPolicy`が計算結果を返し、`churchFeastDates()`が担う別市民暦への変換とlabel付与はprojection/notation層に置く。将来の`ThaiBuddhistFeastPolicy`も同じ契約へ接続できるが、政府休日の年表や宗派別の採用日はこのpolicyとは別のoverride層とする。

Phase 10では、Hourの区画生成と、Hourを含む相対日時操作の意味を`HourArithmeticPolicy`で分ける。`elapsed-duration`は公称Hour幅を固定durationとして`add()`/`span()`へ適用し、`boundary-step`は不定時法・表形式Hourの実境界を次の区画として扱う。`Tempo.succ()`/`back()`は区画そのものの遷移なので常にruleのboundary stepを使い、calendar-levelの相対操作だけがこのpolicyを参照する。既定値は等分Hourがelapsed、temporal/table Hourがboundaryである。

Phase 11では、Thai近代太陰太陽暦を基礎にした`ThaiBuddhistFeastPolicy`を追加する。policyの入力年は仏暦年、結果の`date`は指定地点の現地Gregorian civil date、`utc`とThai lunar month/dayを併記する。通常年は3/15・6/15・8/15・8/16・11/15を採用し、閏月年は8月の宗教行事を後半の8/8へ移す。現段階では宗教日の計算に限定し、政府休日、週末振替、宗派・地域差は別のtable/override providerの責務とする。

Phase 12では、`ThaiBuddhistFeastPolicy`の結果をsampleのlabel／notes APIへ投影する。`thaiBuddhistFeastDates()`は計算済みのlocal civil dateを再計算せず表示labelを付け、`thaiBuddhistFeastNotes()`は指定した暦日の境界と行事の`utc`を照合する。政府休日の振替日や、宗派・地域ごとの表示名はこのadapterへ固定せず、別のnotation／override層で差し替えられる形を保つ。

### 2.3 座標・表示層

内部計算では、リセットされない `raw_year` と表示用の `year` を分ける。元号、仏暦、地域の年番号は `raw_year` から導出する注釈とし、月の `month_index` と表示月番号も分離する。

表示層は policy の意味を再計算しない。例えばタイ暦の8/8は、月番号8と `is_leap_month=true` を受けて表示する。`閏8`、`เดือนแปดหลัง`、`8/8` などの表記差は notation の責務とする。

## 3. 月境界と日界

すべての境界は半開区間 `[last_at, next_at)` とする。`utc === next_at` は次の月または次の日に属する。

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
