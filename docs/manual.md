# fancy-date manual

この文書は、`fancy-date` の API と token の意味をまとめる。短い利用例は [README](../README.md) を参照する。

## 基本モデル

`FancyDate` は、UTC ミリ秒を暦ごとの `Tempos` に分解し、format / find / span / add / sub で同じ token を使う。

```ts
import { Calendar } from 'fancy-date'

const g = Calendar.Gregorian
const utc = g.parse('2024年3月10日')

g.format(utc, 'Gy年MM月dd日(E)')
// '西暦2024年03月10日(日)'
```

主な API は次の通り。

| API                                      | 役割                                      |
| ---------------------------------------- | ----------------------------------------- |
| `parse(text, format?)`                   | 暦表現を UTC ミリ秒へ変換する             |
| `parse_obj(text, format?)`               | 暦表現を token 値のオブジェクトへ変換する |
| `format(utc, format?)`                   | UTC ミリ秒や `Tempos` を暦表現へ変換する  |
| `span([from, to], options?)`             | 範囲の相対表現を文字列で返す              |
| `span_obj([from, to], options?)`         | 相対表現を `Span` / `SpanMeasure` で返す  |
| `parse_span(text, options?)`             | 相対表現を正規化した `Span` に変換する    |
| `format_span(span, direction?)`          | `SpanLike` を現在の暦の表記へ整える       |
| `format_span_parts(span, direction?)`    | span表示を `RichText` として返す          |
| `span_msec(span, options?)`              | anchor 付き span を実ミリ秒へ変換する     |
| `span_add(left, right)`                  | span 同士を token ごとに足す              |
| `span_sub(left, right)`                  | span/連続cycleラベルを引く                |
| `span_neg(span)`                         | span の向きを反転する                     |
| `span_from_labels(token, from, to)`      | `span_sub` の互換wrapper                  |
| `add(utc, span)`                         | 暦表現の差分を UTC ミリ秒へ加算する       |
| `sub(utc, span)`                         | 暦表現の差分を UTC ミリ秒から減算する     |
| `find([from, to], conditions, options?)` | 条件に合う暦境界を探す                    |
| `find_span(at, condition, options?)`     | 条件に合う次/前の時刻までをSpanで返す     |
| `periods([from, to], { step })`          | 指定 step の `Tempo` 範囲を列挙する       |
| `labels(labels)`                         | span の fallback 単位表記を差し替える     |
| `numeral(numeral)`                       | 数値表記辞書を差し替える                  |

Computus と教会祝祭日は、暦の天体モデルとは独立した計算層として扱う。

```ts
import { Calendar, churchFeastDates, churchFeastNotes } from 'fancy-date'

const easter = churchFeastDates(Calendar.Gregorian, 2024).find(({ id }) => id === 'easter-sunday')

Calendar.Gregorian.format(easter.utc, 'y年M月d日')
// '2024年3月31日'

churchFeastNotes(Calendar.Gregorian, easter.utc)
// ['復活祭']
```

`system` はComputusの伝統(`'gregorian'` / `'julian'`)、`calendarSystem` は返された
`CivilDate`を解釈する市民暦である。例えばJulian系の復活祭をGregorian日付へ変換する
場合は、両方を明示する。実際の天文学的な月相ではなく、教会暦上の満月表と復活祭規則を
使うため、Computusの結果を通常の`OrbitalModel`や物理衛星として扱わない。

## format token

format 文字列では、token 文字を並べて暦の値を出力する。複数文字にすると、数値 token は概ね 0 埋め幅になる。

```ts
g.format(utc, 'yyyy年MM月dd日')
// '2024年03月10日'
```

一部 token は `o` と `r` の suffix を持つ。

| suffix | 意味                                    |
| ------ | --------------------------------------- |
| `o`    | 暦の表示名を使う。例: `Mo`, `dC60o`     |
| `r`    | 暦の読み・ルビを使う。例: `Mr`, `dC60r` |

`notation()` で表示名や読みが定義されていない場合は、数値表示に戻る。`algo()` は互換 alias として残している。

HTML の `<ruby>` を組み立てる用途では、文字列化済みの `format()` ではなく
`format_parts()` を使うと token 境界と ruby を同時に取得できる。

### `format_parts()` の仕様

```ts
format_parts(utc: DateLike, format?: string): FormatPart[]
format_parts_by(utc: DateLike, format?: string): FormatPart[]

type FormatPart = {
  token: string
  text: string
  ruby?: string
}

type RichPart = { text: string; ruby?: string }
type RichText<Part extends RichPart = RichPart> = readonly Part[]
```

入力は `format(utc, fmt)` と同じ `DateLike` と format 文字列。`format` を省略した場合は
`this.dic.format` を使う。`DateLike` にはすでに解決済みの `Tempos` も含まれるため、
`format_parts_by()` は内部で `to_tempos_input()` して、数値・文字列・`Tempos` のいずれも受け取る。

戻り値は `{ token, text, ruby? }[]` で、各要素は format token またはリテラル片を表す。

- `token`: 元の token 文字列。リテラル片は空文字 `''`。
- `text`: その part が出力する文字列。`parts.map((p) => p.text).join('') === format(utc, fmt)`。
- `ruby`: token に読みが定義されている場合の読み。`r` suffix token は `text` 自体が読みなので `ruby` は付かない。

つまり `format_parts()` は `format()` の構造化版であり、文字列としての出力は必ず
`text` の連結で再現できる。リテラル文字(`年`, `/`, 空白, 括弧など)も順序を保った
part として返るが、`token` は `''` になる。

`ruby` は「この token の本文に添える読み」がある場合だけ入る。`dC60r` や `Er` のような
`r` suffix は、読みそのものを表示する token なので、`{ token: 'dC60r', text: '...' }` となり
`ruby` は付かない。

spanのruby表示は `format_span_parts()` で必要時に導出する。`Span` 自体は表示用part列を保持せず、
`RichText` の `text` 連結は `format_span(...).label` と一致する。

```ts
g.format_parts(utc, 'Gy年MM月dd日(E) dC60o dC60r')
// [
//   { token: 'G', text: '西暦' },
//   { token: 'yyyy', text: '2024' },
//   { token: '', text: '年' },
//   ...,
//   { token: 'E', text: '日', ruby: 'にち' },
//   ...,
//   { token: 'dC60o', text: '癸酉', ruby: 'みずのとのとり' },
//   { token: '', text: ' ' },
//   { token: 'dC60r', text: 'みずのとのとり' }
// ]
```

HTML では次のように使える。

```svelte
{#each calendar.format_parts(utc, 'Gy年MM月dd日(E) dC60o') as part}
  {#if part.ruby}
    <ruby>{part.text}<rt>{part.ruby}</rt></ruby>
  {:else}
    {part.text}
  {/if}
{/each}
```

周期系 token は `yC<number>` / `dC<number>` を正本にする。たとえば `yC60` は年干支、`dC60` は日干支、`dC7` は七曜。旧 token `a/c/b/A/C/B` や `yC/yCS/yCB/dC/dCS/dCB` も互換 alias として使える。

### 年・元号

| token | 意味                         | format / parse の注意                                                 | find step 推定 | span precise         |
| ----- | ---------------------------- | --------------------------------------------------------------------- | -------------- | -------------------- |
| `G`   | 元号・時代名                 | `era()` の現在元号。最初の元号より前は `.era()` 第2引数のラベルになる | `y`            | 条件用               |
| `y`   | 暦年                         | `G` なしの紀元前は符号付き通年。`紀元前747年` は `-746年`             | `y`            | 階層: `y年`          |
| `Y`   | 週年                         | `w` と組で使う。年末最終週が翌年扱いになる場合に `y` とずれる         | `y`            | 階層: `Y年`          |
| `u`   | 通年・元号補正前の年 index   | 高度な用途向け。`parse` では `y` への差分として働く                   | `y`            | 循環ではない年 token |
| `p`   | 閏周期 table の period index | table-leap 暦の内部周期                                               | `y`            | 条件用               |

紀元前の例:

```ts
const nabonassar = Calendar.Julian.parse('紀元前747年2月26日')

Calendar.Julian.format(nabonassar, 'Gy年MM月dd日')
// '紀元前747年02月26日'

Calendar.Julian.format(nabonassar, 'y年M月d日')
// '-746年2月26日'
```

### 月・日・時刻

| token | 意味             | format / parse の注意                                     | find step 推定 | span precise      |
| ----- | ---------------- | --------------------------------------------------------- | -------------- | ----------------- |
| `M`   | 月               | 月名がある暦では `Mo` / `Mr` が使える。閏月は `閏` prefix | `M`            | 階層: `y年M月`    |
| `d`   | 月内日           | 月内の日番号                                              | `d`            | 階層: `y年M月d日` |
| `D`   | 年初からの日番号 | day-of-year                                               | `d`            | 階層: `y年D日`    |
| `w`   | 年内週番号       | 週年 `Y` と組で使う                                       | `d`            | 階層: `Y年w週`    |
| `H`   | 時               | 暦ごとに 24時制以外にもできる                             | `H`            | 階層: `...H時`    |
| `m`   | 分               | 暦ごとに分割数を変えられる                                | `m`            | 階層: `...m分`    |
| `s`   | 秒               | 暦ごとに分割数を変えられる                                | `s`            | 階層: `...s秒`    |
| `S`   | ミリ秒           | 最小の core precision                                     | `S`            | 階層: `...S`      |
| `J`   | Julian day       | 通し日数。日単位の検索に寄せる                            | `d`            | 条件用            |

## 循環 token

循環 token は干支・曜日・宿のような周期位相を表す。`span({ precise })` では「循環上で何ステップ離れているか」を返す。実際の日付加算としては曖昧なので、`add()` / `sub()` では使わない。

| token  | 意味       | 周期の例     | find step 推定 | span precise   |
| ------ | ---------- | ------------ | -------------- | -------------- |
| `yC60` | 年干支     | 60年周期     | `y`            | 循環差: 年干支 |
| `yC12` | 年支       | 12年周期     | `y`            | 循環差: 年支   |
| `yC10` | 年干       | 10年周期     | `y`            | 循環差: 年干   |
| `yC9`  | 年九星など | 9年周期      | `y`            | 循環差: 年九星 |
| `dC60` | 日干支     | 60日周期     | `d`            | 循環差: 日干支 |
| `dC12` | 日支       | 12日周期     | `d`            | 循環差: 日支   |
| `dC10` | 日干       | 10日周期     | `d`            | 循環差: 日干   |
| `dC7`  | 曜日       | 7日周期      | `d`            | 循環差: 曜日   |
| `dC9`  | 日九星など | 9日周期      | `d`            | 循環差: 日九星 |
| `dC28` | 日不断の宿 | 二十八宿など | `d`            | 循環差: 宿     |

token 方針では、`dC<number>` を日不断 cycle、`yC<number>` を年不断 cycle の正本とする。既存の `yC/yCS/yCB/dC/dCS/dCB` は、それぞれ `yC60/yC10/yC12/dC60/dC10/dC12` の文化的 alias として残す。`E` は一般的な weekday token として、暦ごとの週相当 cycle (`dC7` / `dC8` / `dC10`) を指す。旧 `f` / `F` / `V` は廃止し、それぞれ必要に応じて `yC9` / `dC9` / `dC28` または `LM27` を使う。六曜は不断でも lunar mansion でもない旧暦月日由来の暦注なので、固有 token `R6` を使う。

これらの周期・暦注 token は format/find の表示・検索条件として使える。一方、通常の parse では日時座標の決定に使わない。干支などの周期 token から候補日時を推定する用途は、parse ではなく将来の find/候補探索 API 拡張で扱う。

`dC` / `yC` は `dCS+dCB` / `yCS+yCB` から組み立てられる。旧 `a/c/b/A/C/B` は
それぞれ `yC/yCS/yCB/dC/dCS/dCB` の互換 alias。

```ts
g.find([g.parse('2020年1月1日'), g.parse('2020年3月1日')], [{ dC60o: '甲子' }])
// 甲子日を探す
```

## 天文・季節 token

| token | 意味                               | find step 推定 | span precise   |
| ----- | ---------------------------------- | -------------- | -------------- |
| `Z`   | 二十四節気など、太陽年内の季節区分 | `Z`            | 循環・条件用   |
| `Zz`  | 太陽年                             | `Zz`           | 条件用         |
| `N`   | 月相・月齢系 token                 | `M`            | 循環・条件用   |
| `Q`   | 年内の四半期                       | `M`            | 循環・条件用   |
| `x`   | 時差・経度由来の補助 token         | `y`            | 高度な用途向け |

`note` は季節注・雑節・節句・宗教固定日などの表示名をまとめた検索用の公開結果。現状の `find()` では `note` 条件は日単位で走査する。個別のterm setや固定日catalogは内部policyの結果であり、公開APIの正本ではない。

## span

`span([from, to], { precise })` は、範囲 `[from, to]` を相対表現へ変換する。

```ts
const from = g.parse('2024年1月1日 0時0分0秒', 'y年M月d日 H時m分s秒')
const to = g.parse('2025年3月10日 4時5分6秒', 'y年M月d日 H時m分s秒')

g.span([from, to], { precise: 'm' })
// '1年2ヶ月9日4時間5分後'

g.span([from, to], { precise: 'w' })
// '1年10週後'
```

### 階層 precise

| precise | 出力の階層            |
| ------- | --------------------- |
| `y`     | `y年`                 |
| `Y`     | `Y年`                 |
| `w`     | `Y年w週`              |
| `D`     | `y年D日`              |
| `M`     | `y年M月`              |
| `d`     | `y年M月d日`           |
| `H`     | `y年M月d日H時`        |
| `m`     | `y年M月d日H時m分`     |
| `s`     | `y年M月d日H時m分s秒`  |
| `S`     | `y年M月d日H時m分s秒S` |

### 循環 precise

循環 token の `precise` は単独の周期差になる。

```ts
g.span([from, to], { precise: 'dC' })
// 例: '14日干支後'
```

## add / sub

`add(utc, span)` / `sub(utc, span)` は、階層spanを日時へ適用する。`SpanLike` は文字列または
正規化済みの `SpanDiff` で、正数は `add()` で未来へ進む量を表す。

```ts
g.add(from, '1年2ヶ月9日4時間5分後')
// 2025年3月10日 4時5分

g.add(from, { y: 1, M: 2, d: 9, H: 4, m: 5 })
g.sub(from, { M: 1 })
```

```ts
type SpanToken = 'y' | 'M' | 'w' | 'd' | 'H' | 'm' | 's' | 'S'
type SpanDiff = Partial<Record<SpanToken, number>>
type SpanLike = string | SpanDiff
type Span = SpanDiff & { label: string; next_at?: number; timeout?: number }
type SpanMeasurePrecision = Exclude<Precision, SpanToken | 'Y' | 'D'>
type SpanMeasure = { precision: SpanMeasurePrecision; value: number; label: string }
```

ラベルは地球的な期間の大きさを受け入れ、`y → M → w → d → H → m → s → S` の順で表示する。`w` は週数。`Y` はspan計測時に `y` へ、`D` は年初通日を使って測定した後に通常の日数 `d` へ正規化される。したがって `D` は `SpanToken` には入らない。循環token・暦注tokenは日時加算として曖昧なため、`SpanLike` と `add()` / `sub()` には入らない。

## parse_span / format_span / labels

`parse_span(text, { at? })` は現在の暦の `labels()` と `notation(..., relatives)` を使って相対表現を読む。`at` を渡した場合は、その基準時刻を span の anchor として保持する。`format_span(span, direction?)` は `SpanLike` を現在の暦の表記へ整える。

```ts
const custom = new FancyDate(g).labels({ w: '週目', dC: '日巡り' }).init()

custom.parse_span('1年2ヶ月後')
// { y: 1, M: 2, label: '1年2ヶ月後' }

custom.add(from, { y: 1, M: 2 })

const parsed = g.parse_span('1ヶ月後', { at: g.parse('2024年1月31日') })
g.span_msec(parsed)
// 2024年1月31日から1ヶ月後までの実ミリ秒

g.span_add('3日後', '1日前').label
// '2日後'

g.span_add('1ヶ月後', '31日前').label
// '1ヶ月後31日前'

custom.format_span_parts({ y: 1, M: 2 })
// [{ text: '1年' }, { text: '2ヶ月' }, { text: '後' }]

custom.span_sub({ dC60: '乙丑' }, { dC60: '甲子' })
// { d: 1, label: '1日後' }
```

`span_add()` / `span_sub()` は symbolic な演算で、同じtokenだけを相殺する。月と日のような異なるtoken間の繰り上げ・相殺は行わない。`span_sub()` は通常の `SpanLike` 同士に加えて、同じ連続cycleのラベルoperandも受ける。演算後のspanは `msec` anchorを失い、`at` が残っていれば `span_msec()` がその時点から再計算する。

`span_sub({ dC60: '乙丑' }, { dC60: '甲子' })` のようなラベルoperandは、`yC<number>` /
`dC<number>` とそのaliasのような不断cycleだけを受ける。ラベル差をcycle上の順方向の
非負ステップとして計算し、年cycleは `y`、日cycleは `d` の代表Spanへ変換する。これは
実時刻差を測定するAPIではないため、結果にanchorは付かない。同じラベルは `今` (差分0) に
なる。実際の次回・前回の一致時刻や、閏月・不定時法を含む厳密な差分が必要な場合は
`find_span()` を使う。`R6` / `LM27` / `Q` のような不断でないラベルは、ラベル差だけから
Spanへ変換できないためinvalidになる。`span_from_labels(token, from, to)` はこの形式の
互換wrapperとして残る。

循環token・暦注tokenを `precise` に指定した `span_obj()` は、再適用できない `SpanMeasure` を返す。

```ts
custom.span_obj(g.parse('2024年1月2日'), from, { precise: 'dC60' })
// { precision: 'dC60', value: 1, label: '1日巡り後' }
```

`labels()` は fallback の単位表記を差し替える。`notation()` の第3要素に relatives がある場合は、そちらが優先される。

`前` / `後` を省略した表現(例: `'1年2ヶ月'`)は `後` として解釈される。`parse_span('1年2ヶ月')` と `parse_span('1年2ヶ月後')` は同じ結果になる。

## find

`find([from, to], conditions, options?)` は範囲内で条件に合う暦境界を探す。

```ts
const between = [g.parse('2020年1月1日'), g.parse('2020年3月1日')]

g.find(between, [{ dC60o: '甲子' }]).map((utc) => g.format(utc, 'yyyy年MM月dd日 dC60o'))
// ['2020年01月22日 甲子']
```

conditions は format 指示と同じ token をキーにできる。値は文字列または正規表現。

```ts
g.find([g.parse('2020年3月1日'), g.parse('2020年10月1日')], [{ note: /春分|秋分/ }])
```

step は条件から推定される。必要なら明示できる。

```ts
g.find([g.parse('2020年3月1日'), g.parse('2020年3月2日')], [{ H: '12' }], {
  step: 'H',
})
```

結果の並びは `order` で制御する。`1` が昇順、`-1` が降順。`limit` で件数を制限できる。無制限の範囲を使う場合は `limit` が必須になる。昇順では `from`、降順では `to` が探索開始点になるため、その側は有限値にする。

```ts
g.find([g.parse('2020年1月23日'), Infinity], [{ dC60o: '甲子' }], { limit: 1 })
// 次の甲子日

g.find([-Infinity, g.parse('2020年3月1日')], [{ dC60o: '甲子' }], {
  order: -1,
  limit: 1,
})
// 前の甲子日
```

推定規則の概要:

| 条件 token                             | 推定 step  |
| -------------------------------------- | ---------- |
| `note`, `dC<number>/R6/LM27/E/d/D/w/J` | `d`        |
| `M/N/Q`                                | `M`        |
| `Z`                                    | `Z`        |
| `Zz`                                   | `Zz`       |
| `y/Y/yC<number>`                       | `y`        |
| `H/m/s/S`                              | 同じ token |

`note` は現状では日単位で走査する。将来、`note` の辞書から天文現象や節句を直接解釈する場合は、内部でより適した探索方法を選べる。

### find_span

`find_span(at, condition, options?)` は、基準時刻 `at` から条件に合う暦境界を探し、
その時刻との差を `Span` として返す。条件は `find()` と同じ形式で、単一条件または条件配列を渡せる。
現在の一致を含めず、次または前の境界を探す。

```ts
const condition = { dC60o: '甲子' }

const next = g.find_span(g.parse('2020年1月23日'), condition)
// add(at, next) が次の甲子日になる

const previous = g.find_span(g.parse('2020年1月23日'), condition, { order: -1 })
// add(at, previous) が前の甲子日になる
```

`order` は `1` が未来側、`-1` が過去側、`0` が両側を調べた近い側。`order: 0` の距離比較は
実際のUTCミリ秒差で行い、同距離なら未来側を選ぶ。`base` は `at` が既定で、`match` にすると
一致時刻をSpanの基準にする。

```ts
const elapsed = g.find_span(at, condition, { order: -1, base: 'match' })
// add(previousMatch, elapsed) === at
```

`base: 'at'` は `add(at, span) === match`、`base: 'match'` は
`add(match, span) === at` になる。`R6` / `LM27` のような暦注や不断ラベルも、日境界を
走査して一致時刻を求めるため、同じAPIで扱える。
