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
| `span_obj([from, to], options?)`         | 相対表現を `Span` オブジェクトで返す      |
| `parse_span(text)`                       | 相対表現を `Span` に変換する              |
| `format_span(span, direction?)`          | `SpanLike` を現在の暦の表記へ整える       |
| `add(utc, span)`                         | 暦表現の差分を UTC ミリ秒へ加算する       |
| `sub(utc, span)`                         | 暦表現の差分を UTC ミリ秒から減算する     |
| `find([from, to], conditions, options?)` | 条件に合う暦境界を探す                    |
| `labels(labels)`                         | span の fallback 単位表記を差し替える     |
| `numeral(numeral)`                       | 数値表記辞書を差し替える                  |

## format token

format 文字列では、token 文字を並べて暦の値を出力する。複数文字にすると、数値 token は概ね 0 埋め幅になる。

```ts
g.format(utc, 'yyyy年MM月dd日')
// '2024年03月10日'
```

一部 token は `o` と `r` の suffix を持つ。

| suffix | 意味                                 |
| ------ | ------------------------------------ |
| `o`    | 暦の表示名を使う。例: `Mo`, `Ao`     |
| `r`    | 暦の読み・ルビを使う。例: `Mr`, `Ar` |

`algo()` で表示名や読みが定義されていない場合は、数値表示に戻る。

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

| token | 意味       | 周期の例               | find step 推定 | span precise   |
| ----- | ---------- | ---------------------- | -------------- | -------------- |
| `a`   | 年干支     | 60年周期               | `y`            | 循環差: 年干支 |
| `b`   | 年支       | 12年周期               | `y`            | 循環差: 年支   |
| `c`   | 年干       | 10年周期               | `y`            | 循環差: 年干   |
| `f`   | 年九星など | 暦ごとの年循環         | `y`            | 循環差: 年九星 |
| `A`   | 日干支     | 60日周期               | `d`            | 循環差: 日干支 |
| `B`   | 日支       | 12日周期               | `d`            | 循環差: 日支   |
| `C`   | 日干       | 10日周期               | `d`            | 循環差: 日干   |
| `E`   | 曜日       | 7日周期など            | `d`            | 循環差: 曜日   |
| `F`   | 日九星など | 暦ごとの日循環         | `d`            | 循環差: 日九星 |
| `V`   | 宿         | 二十七宿・二十八宿など | `d`            | 循環差: 宿     |

`A` / `a` は `C+B` / `c+b` から組み立てられる。つまり `B/b` が支、`C/c` が干。

```ts
g.find([g.parse('2020年1月1日'), g.parse('2020年3月1日')], [{ Ao: '甲子' }])
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

`note` は `雑節()` と `節句()` の表示名をまとめた検索用の特別条件。現状の `find()` では `note` 条件は日単位で走査する。

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
g.span([from, to], { precise: 'A' })
// 例: '14日干支後'
```

## add / sub

`add(utc, span)` / `sub(utc, span)` は、階層 span を日時へ適用する。

```ts
g.add(from, '1年2ヶ月9日4時間5分後')
// 2025年3月10日 4時5分
```

`Y` は `y`、`D` は `d`、`w` は 7 日分として扱う。循環 token は日時加算として曖昧なため、`add()` / `sub()` ではエラーにする。

## parse_span / format_span / labels

`parse_span(text)` は現在の暦の `labels()` と `algo(..., relatives)` を使って相対表現を読む。`format_span(span, direction?)` は `SpanLike` を現在の暦の表記へ整える。

```ts
const custom = g.dup().labels({ w: '週目', A: '日巡り' }).init()

custom.parse_span('1日巡り後')
// { unit: 'day', value: -1, label: '1日巡り後', parts: [...] }

custom.format_span({ token: 'A', unit: 'day', value: -1, label: '1A' }).label
// '1日巡り後'
```

`labels()` は fallback の単位表記を差し替える。`algo()` の第3要素に relatives がある場合は、そちらが優先される。

## find

`find([from, to], conditions, options?)` は範囲内で条件に合う暦境界を探す。

```ts
const between = [g.parse('2020年1月1日'), g.parse('2020年3月1日')]

g.find(between, [{ Ao: '甲子' }]).map((utc) => g.format(utc, 'yyyy年MM月dd日 Ao'))
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

推定規則の概要:

| 条件 token                    | 推定 step  |
| ----------------------------- | ---------- |
| `note`, `A/B/C/E/F/V/d/D/w/J` | `d`        |
| `M/N/Q`                       | `M`        |
| `Z`                           | `Z`        |
| `Zz`                          | `Zz`       |
| `y/Y/a/b/c/f`                 | `y`        |
| `H/m/s/S`                     | 同じ token |

`note` は現状では日単位で走査する。将来、`note` の辞書から天文現象や節句を直接解釈する場合は、内部でより適した探索方法を選べる。
