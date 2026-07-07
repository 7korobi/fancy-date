# fancy-date

[![Build Status](https://travis-ci.org/7korobi/fancy-date.svg?branch=master)](https://travis-ci.org/7korobi/fancy-date)

## インストール

```shell
bun add fancy-date
```

## API 利用例

```ts
import { Calendar } from 'fancy-date'

const g = Calendar.Gregorian
```

`Calendar` には、Gregorian / Julian / 定気法 / Maya / エジプト民用暦 / コプト暦などのサンプル暦が入っている。各暦は `FancyDate` インスタンスなので、同じ API で parse、format、span、add/sub を使える。

token の意味、format / find / span での使い分け、`precise` や循環 token の詳しい扱いは [docs/manual.md](docs/manual.md) にまとめている。

### parse / format

`parse()` は暦表現を UTC ミリ秒へ変換し、`format()` は UTC ミリ秒や暦オブジェクトを文字列へ戻す。

```ts
const utc = g.parse('2024年3月10日')

g.format(utc, 'Gy年MM月dd日(E)')
// '西暦2024年03月10日(日)'
```

書式は `y/M/d/H/m/s/S` のような階層 token と、`G` 元号、`E` 曜日、`a/A` 干支などの暦 token を組み合わせる。`G` を含めない古い年は、符号付き通年として出る。

```ts
const nabonassar = Calendar.Julian.parse('紀元前747年2月26日')

Calendar.Julian.format(nabonassar, 'Gy年MM月dd日')
// '紀元前747年02月26日'

Calendar.Julian.format(nabonassar, 'y年M月d日')
// '-746年2月26日'
```

### span / add / sub

`span([from, to])` は相対表現を返す。`span_obj()` は `parts`、`next_at`、`timeout` を含むオブジェクトを返す。

```ts
const from = g.parse('2024年1月1日 0時0分0秒', 'y年M月d日 H時m分s秒')
const to = g.parse('2025年3月10日 4時5分6秒', 'y年M月d日 H時m分s秒')

g.span([from, to], { precise: 'm' })
// '1年2ヶ月9日4時間5分後'

g.span([from, to], { precise: 'w' })
// '1年10週後'
```

`precise` の階層 token は `y/M/d/H/m/s/S` と `Y/w/D`。`w` は週年 `Y` と組になり、`D` は年初からの日番号として `y` と組になる。

```ts
g.add(from, '1年2ヶ月9日4時間5分後')
// 2025年3月10日 4時5分

g.sub(to, '1年2ヶ月9日4時間5分後')
// 2024年1月1日 0時0分
```

`a/b/c/f/A/B/C/E/F/V` などの循環 token は、干支・曜日・宿のような循環位相の差を表す。日時加算としては曖昧なので、`add()` / `sub()` では使わない。

### find

`find([from, to], conditions)` は範囲内で条件に合う暦境界を探す。探索 step は条件から推定される。

```ts
const between = [g.parse('2020年1月1日'), g.parse('2020年3月1日')]

g.find(between, [{ Ao: '甲子' }]).map((utc) => g.format(utc, 'yyyy年MM月dd日 Ao'))
// ['2020年01月22日 甲子']
```

`note` 条件は `note()` の表示名から探す。正規表現も使える。

```ts
g.find([g.parse('2020年3月1日'), g.parse('2020年10月1日')], [{ note: /春分|秋分/ }])
```

必要なら `step` を明示できる。
無制限の範囲では `limit` を指定し、昇順なら `from`、降順なら `to` を有限値にする。

```ts
g.find([g.parse('2020年3月1日'), g.parse('2020年3月2日')], [{ H: '12' }], {
  step: 'H',
})

g.find([g.parse('2020年1月23日'), Infinity], [{ Ao: '甲子' }], { limit: 1 })
// 次の甲子日

g.find([-Infinity, g.parse('2020年3月1日')], [{ Ao: '甲子' }], {
  order: -1,
  limit: 1,
})
// 前の甲子日
```

### parse_span / format_span / labels

`parse_span()` は相対表現を `Span` にし、`format_span()` は `SpanLike` を現在の暦の表記へ整える。

```ts
const custom = g.dup().labels({ w: '週目', A: '日巡り' }).init()

custom.span([from, to], { precise: 'w' })
// '1年10週目後'

custom.parse_span('1日巡り後')
// { unit: 'day', value: -1, label: '1日巡り後', parts: [...] }

custom.format_span({ token: 'A', unit: 'day', value: -1, label: '1A' }).label
// '1日巡り後'
```

`labels()` は fallback の単位表記を差し替える。`algo()` の第3要素で token ごとの相対表現を定義している場合は、そちらが優先される。

### サンプル暦

```ts
Calendar.エジプト民用暦.format(Calendar.エジプト民用暦.parse('1年1月1日'), 'Gy年Mod日')
// 'ナボナサル紀元1年トート1日'

Calendar.コプト暦.format(Calendar.コプト暦.parse('1739年1月1日'), 'Gy年Mod日')
// 'コプト暦1739年トウト1日'
```

## 今後の検討メモ

- Span: span の各 part を暦 token として内部化し、不断 token の受け入れ、span 同士の演算、parse/format の分離を検討する。同じ unit/token を複数持たないなら、配列ではなく Record 形式に寄せる余地もある。
- 数値表現(調査結果): `number.ts` に `DIC`/`Numeral` 基盤(`jpn`(漢字/大字/rubys)、`old_jpn`(みっか/はつか等の古い日本語数え方)、`english`、`roman`、`angle`)は既に実装済みで、`jpn`/`english`/`roman` の format/parse 往復は `__tests__/fancy-date-spec.js`(「numeral dictionaries format numeric tokens」)で検証済み。だが `sample/calendars.ts` にはこれを使うサンプル暦が1つもない(`.numeral()` 自体は `fancy-date.ts` にあるが呼び出し箇所ゼロ)。さらに `old_jpn` の目玉である助数詞依存の不規則形(3日→みっか等)は `format_number()` の全呼び出し箇所(5箇所)で `appendix` 引数が渡されておらず、`format()` 経由では構造的に到達不能(`Numeral.parse()` を直接呼べば動く)。課題は主に次の3点:
  - (a) 現行 `.numeral()` は暦1つに数詞1系統しか割り当てられない。史実では年は漢数字・日は古語数え方のようにトークンごとに数詞が異なるのが普通。一方で「数詞体系・暦法・地域(緯度経度・タイムゾーン)をまとめたものが暦」という整理に立てば、数詞違いは既存の `.dup().numeral(x).init()` のような**バリエーション切り替え**として扱うのが自然で、地域(`.spot()`)についても同様にバリエーション切り替えを認めてよいのではないか、という方向で検討中。似た暦の組み合わせ爆発を避けつつ、サンプル暦を増殖させない設計にできる見込み。
  - (b) 助数詞(appendix)の配線: `old_jpn` のような「接尾辞込みで1つの読みが決まる」表現は、接尾辞の読みを暦の補助情報として与える形(既存の `algo({H: [時鐘, 時鐘かな, '刻']})` のようにトークン設定の第3要素に助数詞を持たせる形)が有力な方向性。ゼロ埋め前提トークン(`yyyy`/`MM`等)は算用数字のみ対応でよく、単語数詞は横幅不定で構わない(ロムルス暦11月(暦外期間)のように `M`/`MM` が数値としては機能しても意味的に「暦外」を表せない、という既知の制約は残る)。
  - (c) 逆引き parse map(`ensure_number_map()`)は `appendix=''` 固定で構築されるため、(b)を配線した後は appendix ごとの逆引きも合わせて設計する必要がある。(b)が固まってから着手すべき。
  - 低リスクな着手例として、`Romulus` 暦(既存サンプル)に `roman.upper` を割り当てるのがappendix問題を抱えない好例(未着手)。`english` の `regex` はこれまで `[A-Za-z]+` で任意の英字列を無条件に飲み込んでおり、同じ format 文字列内の元号名・曜日名等と衝突しうる不具合があったため、数詞語彙だけに一致する正規表現(語彙を長さ降順で `|` 連結)に修正済み。
- token 拡張: 不断 token を span に受け入れ、`precise` に不断を指定できるようにする。世紀・千年紀・マヤ長期暦のような年上位単位は、元号ではなく `G` token との関係も検討する。
- 天文モデル: 地球以外の天体向けに `src/nasa` の高精度モデルを追加し、楕円軌道、彗星、多星系の暦を検討する。
- 歴史的時刻表現: 定気法に四半刻表現を採用するか、江戸時代以前の「分」「秒」に近い時刻表現を調査する。
- 暦の拡張: 太陽暦の上位単位、マヤ長期暦、中東・インド・アフリカの暦を調査する。
- 暦外期間: ロムルス暦のように暦月だけで1年を表現し尽くさない暦は他に類例が見当たらず、`month_divs` の `null` 要素 + `Indexer.list` への `null` 混在で表現した今回の対応(暦外期間ラベル)をこれ以上汎用化する必要は薄いと思われる。
- 日干支(A)の epoch 自己不整合: `calendar()` の epoch(第3引数、通常 0)を `format()` した結果が、多くの暦(Julian/Romulus/平気法/定気法/アマンタ等)で初期値文字列の日付そのものと一致しない(実測: 平気法/定気法とも `format(0, 'y年M月d日')` が初期値文字列の日付と無関係な値を返す)。タイムゾーン(`geo[2]` 非ゼロ)を持つ暦でのみ発生し、原因は未特定。ただし実日付(2020年1月22日等、日付境界から離れた時刻)における日干支そのものはグレゴリオ暦・平気法・定気法の間で正しく一致することを確認済み(`__tests__/fancy-date-spec.js` の「日干支(A)はグレゴリオ暦・平気法・定気法の間で実日付について一致する」)。utc=0 という特定の瞬間の年月日ラベルだけが壊れているため、影響範囲は限定的と思われるが、`def_zero()` 周りの調査が必要。
- 極域現象での不定時法(`SolarDayHourTempoRule`)の扱い(調査結果): 不定時法(バビロニア/ギリシャ/ローマ起源、中世後期に定時法へ置き換わった)を極域で採用した実例は調査した限り見当たらなかった。極域の先住民の時間認識も「昼をN等分する」という発想自体を持たず、サーミ人は生態(トナカイ等)基準の8季節暦(季節の境界は日付ではなく感覚的なもの)、イヌイットは極夜明け最初の日の出を年始とする13朔望月の太陰暦(月名は動物の生態等に基づき地域ごとに異なる)を用いる。現代の南極観測基地群も統一タイムゾーンを持たず補給元国の標準時に合わせており(例: マクマード基地はニュージーランド時間)、理由は「南極点では経線が収束し太陽基準の時刻が意味をなさなくなる」ため。**不定時法を極域に「正しく拡張する」自然な答えは無いと考えてよく**、`SolarDayHourTempoRule`(または `.spot()`)の construction 時点で、緯度が極圏(概ね北緯/南緯66.5度)以遠なら例外を投げる形が妥当。ただし66.5度ちょうどが唯一の閾値ではなく、その手前でも夏至/冬至付近で1時(とき)が極端に短くなる退化ケースは残るため、閾値は「これより先は確実に不可能」という下限として扱う。
- 先住民の極域暦の計算機的表現(調査結果、将来実装候補): 上記調査で見つかった2つの実例は、いずれも既存の仕組みを拡張すれば表現できる可能性がある。
  - イヌイットの13朔望月暦: 年始が「極夜明け最初の日の出」であり、これは今回追加した `has_sunrise`(false→trueへの遷移)そのもの。既存の `find()` は format 済み文字列条件でしか探索できないため、`has_sunrise`/`is_up_all_day` のような `solor()`/`lunar()` の生の判定結果を条件にできる探索 API が必要になりそうだ。月自体は朔望月ベースで、既存の 定気法/平気法 の閏月挿入(`ObservedLunisolarMonthRule` 等)と同系統の仕組みで扱えるはずだが、挿入トリガーが「太陽の運行」ではなく「極夜期間中の朔望月には名前がない(great darkness月)」という別条件になる。月名が地域ごとに異なる点は既存の `.labels()`/`.algo()` で対応できる範囲。
  - サーミの8季節暦: 季節境界が天文学的に厳密でなく生態/感覚に基づく(「昼が戻るのは日付ではなく感覚」という一次資料の表現通り)ため、既存の暦モデル(年/月/日の階層構造)にそのまま乗せるのは無理がある。二十四節気と同種の「太陽黄経ベースの8分割」で近似することはできるが、それは実際の文化的運用を単純化した近似である、と明記した上で実装する必要がある。

Sources: [Unequal hours](https://en.wikipedia.org/wiki/Unequal_hours) / [Sámi Eight-Season Calendar](https://www.outlooktraveller.com/experiences/in-the-arctic-time-moves-differently-inside-the-s%C3%A1mi-eight-season-calendar) / [Inuit astronomy](https://en.wikipedia.org/wiki/Inuit_astronomy) / [Time in Antarctica](https://grokipedia.com/page/Time_in_Antarctica)
- `export *` の tslib バンドル非互換性: `src/index.ts` の `export * from './xxx'` は TypeScript が `tslib.__exportStar(require(...), exports)` という実行時関数呼び出しにコンパイルする。Node/Vite dev では問題ないが、静的な named export 解析に依存するバンドラ(Cloudflare Workers 等、esbuild/Rollup 系)では再エクスポートされた名前(`to_msec`/`Calendar`/`Tempo` 等)が検出できず `undefined` になる(実測: svelte-tick-timer を Cloudflare Workers にデプロイした際に "Cannot read properties of undefined (reading 'to_msec')" で発覚。呼び出し側で namespace import に変更して回避したが、fancy-date 本体は未修正のため他の利用者も同じ罠を踏む)。`export *` をやめて明示的な named export にするか、`isolatedModules`/ビルド設定を見直す必要がある。

実装済みの下地:

1. `sample.ts` を `src/sample/` に分割する。
2. Span の parser/formatter を内部的に分離する。
3. Span に次回表示変化時刻・timeout を持たせる(`with_span_anchor()` が `next_at`/`timeout` を設定、`Tempo.timeout`/`Tempo.sleep()` も同様に「最も近い変化まで待つ」を実装済み。`svelte-tick-timer` のデモは実際にこの `Tempo.sleep(minutes)` を使ってポーリングではなく最小 timeout まで待つ形になっている。表示更新が頻繁に見えるのは、同時表示している16暦の中で Beat(インターネット時間)の「分」相当の境界が実測で約0.4秒ごとに来ており、複数暦をまとめて1つの sleep で待つ設計上、最短の暦に律速されるため。これは設計通りの挙動でありバグではない)。
4. `perf:*` 系の性能測定スクリプトを追加する。今回の入力検証強化(NaN/Infinity ガード追加)後に `bun run perf:core` を実行し、parse/format/to_tempos/span/add-sub/太陰太陽暦/天文現象のいずれも既存水準(数万〜数十万 ops/sec)から劣化していないことを確認済み。
5. 暦ごとの数値辞書を使った format 出力に対応する。
6. 暦ごとの数値辞書を使った parse 入力に対応する。
7. `precise` に不断 token を指定できるようにし、SpanPart に token を持たせる。
8. 非 `precise` の span も固定時間ではなく暦の秒・分・時・日境界に基づいて判定する。
9. `src/nasa` を追加し、Mars の太陽季節モデルを試験的に導入する。
10. 地域暦の足場として、ナボナサル紀元を anchor にした365日固定のエジプト民用暦を追加する。
11. `calendar()` に閏年 offset を追加し、Alexandria 地点のコプト暦を追加する。
12. `labels()` と `parse_span()` / `format_span()` を追加し、span の表記を暦ごとに調整できるようにする。
13. 干支のサンプル初期値の誤り: 定気法の年干支(a)起点値が「戊申」(1968年の干支)になっており、平気法と同じ起点年(皇紀2629年=西暦1969年)の正しい年干支「己酉」と1年ずれていた(実測: 2024年3月10日時点でグレゴリオ暦・平気法が「甲辰」なのに定気法だけ「癸卯」)。加えて日干支(A)の起点値も平気法・定気法とも「辛巳」になっており、グレゴリオ暦(2020年1月22日=甲子という既知の事実と一致確認済み)に対して常に平気法+6日・定気法+23日(いずれも60日周期)ずれていた。年干支・日干支ともに暦の計算方式に依存しない実日/実年の事実であるべきなので、平気法は「己酉-乙亥」、定気法は「己酉-戊午」に修正し、実日付でグレゴリオ暦と一致することを確認した。この修正は十干(`C`)・十二支(`B`)の zero も連動して動かす(`algo()` が `C.zero = B.zero = A.zero` と共有しているため)ため、社日・初午などその暦日を参照する雑節/節句の該当日もあわせて数日ずれて正しい位置に移動した(既存スナップショットを更新済み)。
14. NaN 許容設計の型安全化: `LunarObservation`/`SolarObservation` に `has_sunrise`/`has_moonrise`/`has_transit`/`has_moonset` の各フラグを追加し、対応する数値フィールドが NaN になりうる理由を型定義に JSDoc で明記した。`number | undefined` 化も検討したが、日の出/日の入を直接算術に使う `SolarDayHourTempoRule`(不定時法)など内部の非 null 前提コードへの影響範囲が大きく、リスクに見合わないため見送った。
15. 入力値検証の横展開: `format`/`add`/`sub`/`span` は既存の `to_tempos()`/`span_between()` 経由のガードで NaN/Infinity を検出できることを確認した。`find()`(non-anchor 側の端点が NaN のとき limit 指定時に無言で空配列を返す抜け道があった)、`solor()`/`lunar()`/`noon()`(NaN を渡しても例外にならず一部フィールドだけ NaN の中途半端なオブジェクトを返していた。デフォルト引数の式が本体より先に評価されるため本体先頭のガードでは間に合わず、仮引数化して対応)を修正した。
16. 極域現象(終日昇らない/沈まない)の表現力: `SolarObservation`/`LunarObservation` に `is_up_all_day` を追加した。南中高度(その暦日で天体が最も高く昇る瞬間の高度)の符号から判定しており、`has_sunrise`(または `has_moonrise`/`has_moonset` の両方)が false のときに白夜相当(true)か極夜相当(false)かを区別できる。北緯78度(スヴァールバル諸島相当)での夏至/冬至で実際に区別できることをテストで確認済み。mean モデル経路(`phenomena/solar.ts`)にも同じ公式(90°-|緯度-赤緯|)で南中高度を補った(この経路にはこれまで南中高度自体が実装されておらず、`SolarObservation` 型との不整合が型チェックされずに見過ごされていた)。
17. デバッグ教訓(追記): 今回の干支調査では、暦システム自身の自己無矛盾チェック(「anchor を format() したら anchor の値に戻るか」)だけでは不十分で、**独立に検証可能な実世界の事実**(「2020年1月22日は甲子の日である」「皇紀2629年は西暦1969年で己酉の年である」等)に照らして複数の実日付・実年で暦間の値を突き合わせる方が、真の誤りと「暦の計算方式による正当な差異」を見分けるのに有効だった。また、値のズレが複数の実測点で完全に一定のオフセットになっている場合は、探索アルゴリズムのバグではなく初期値・zero 点のような加法的な較正定数の誤りである可能性が高い、という判断材料も得られた。逆に、既存のテストが「これは既知の別課題として検証対象から外す」と明記している箇所を安易に一緒くたに直そうとすると、無関係な不具合(今回で言えば timezone 起因の epoch 自己不整合)を誤って自分の変更のせいだと早合点しかねない。両者を独立に検証してから結論を出すべき。
18. SpanLike 文法拡張: `前` / `後` を省略した表現(例: `'1年2ヶ月'`)を `後` として解釈するようにした。`parse_span_parts()` が前/後 の接尾辞を必須としていたのを、見つからない場合は本文全体をそのまま解釈しつつ方向を `後` にフォールバックする形に変更。`add()`/`sub()`/`format_span()` など `SpanLike` を受け取る経路すべてに自動的に効く。
19. mean モデル経路の SolarObservation 補完(続き): `hasSolarEvents` を持たない簡易(mean)太陽モデル経由の `solor()` に `日の出方位`/`日の入方位` を追加した。既存の `方向`(=日の出方位の値)を日の入側は真北基準で反転(`2π - 方向`)して求める。`cos(時角)` が偶関数であるため日の出側の式では日の入との判別ができないが、精密モデル(`EarthSolarOrbital`)の実測値と比較して分点付近で最大0.25°程度(赤緯を1日一定とみなす近似の範囲内)しか乖離しないことを確認済み。
20. english 数詞の衝突回避: `english.lower`/`english.title` の `regex` が `[A-Za-z]+(?:[- ][A-Za-z]+)*` で任意の英字列を無条件に飲み込んでおり、同じ format 文字列内の元号名・曜日名等の他の英字トークンと衝突しうる不具合を修正した。数詞語彙(`ENGLISH_ONES`/`ENGLISH_TENS`/`hundred`/`thousand`)だけに一致する正規表現に差し替え、`seventeen` が `seven` の接頭辞を含む等の理由で語彙を長さ降順に `|` 連結する形にした(先頭文字のみ大小両対応、`englishize()`/title 版のいずれも先頭大文字化しか行わないため)。

直近の実装順:

1. エチオピア暦など、コプト暦と同系統の地域暦を検討する。
