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
  - (b) 助数詞(appendix)の配線(設計を bind-time 方式に更新): 当初は「`algo()` にトークンごとの appendix 文字列を静的設定し、`format_number(value, size, appendix)` へ都度渡す」案(呼び出し時引数)を検討していたが、多言語の数詞一致(agreement)体系を横断調査した結果(下記「多言語数詞の一致体系の調査」参照)、**appendix 相当の文脈情報はすべて暦トークン単位で生涯固定であり、個々の `parse()` 呼び出しごとに変わる実例は一つも見つからなかった**。したがって「呼び出しごとの引数」という設計は不適切で、**構築時に一度だけ文脈を確定する方式**に変更する。`Numeral` 型は `parse(num): string`(appendix 引数なし)のまま永久に固定し、`DIC` は内部にだけ appendix を取る非公開メソッドを持ち、`inflect(appendix): Numeral` という公開ファクトリで「appendix に応じた語形変化(屈折)を確定済みの、引数なし `parse` を持つ `Numeral`」を返す(例: `old_jpn.rubys.inflect('か')`)。メソッド名は当初 `bind` を検討したが、`Function.prototype.bind`(引数の部分適用によるthis/引数の固定)という汎用JS機構を強く連想させ、ここでやっていること(文脈に応じた語形変化の選択)の実態とズレるため却下し、言語学用語として実態に即した `inflect` に変更した(このファイル自体が `.音便(fix)` のように言語学的に正確な用語をメソッド名に採用してきた前例があり、一貫性もある)。`english`/`roman` のような appendix 不要な実装は `inflect` を持たなくてよく、素の object literal のまま `Numeral` を満たし続ける。これに伴い `algo()` の `IndexerProps`(era/曜日等の list ベーストークン用)は変更不要と判明し、代わりに `.numeral()` を「暦全体で1つの `Numeral`」から「トークンごとに文脈確定済み `Numeral` を割り当てるマップ」も受け付けるよう拡張する方向(例: `{ d: old_jpn.rubys.inflect('か'), ...他トークンは英語の Numeral }`)。呼び出し時引数案を却下した理由は、(1) 大半の実装が使わない `appendix?` を全実装が永久に持ち続けることになる、(2) どのトークンにどの固定文字列を再度渡すかという設定情報を呼び出し側 `fancy-date.ts` の複数箇所に分散させてしまう、(3) アラビア語(性・格・数詞帯)やスワヒリ語(名詞クラス)のような多変数の一致情報を表すには単一の `string` 引数では早晩足りなくなり、公開契約の引数がなし崩し的に増え続ける、の3点。将来、本当に「呼び出しごとに変わる」文脈が見つかった場合は `parse` へ任意引数を追加で足す(非破壊的な変更)余地は残している。
  - (c) 完全往復保証(重要目標として確定): `to_number(parse(num))===num` が屈折確定済みの各 `Numeral` について常に成り立つことを、今回から明確な目標とする。現状の `ensure_number_map()` は `appendix=''` 固定で構築され `DIC` 側の共有キャッシュに乗るため、「はつか」等の逆引きが失敗する、というだけでなく、複数の appendix が同じ `DIC` の共有キャッシュを取り合う潜在的な事故(先に呼ばれた appendix のマップが後続を汚染する)も抱えている。修正方針: 逆引きマップの構築・キャッシュを `DIC` から追い出し、`inflect()` が返す屈折確定済みラッパー(`InflectedNumeral`)がそれぞれ自分自身の `parse()` を呼んでマップを構築する形にする——これにより「屈折確定済みインスタンスごとに、そのインスタンスが実際に生成しうる出力だけを正しく含む完全な逆引きマップを持つ」ことが構造的に保証される。`old_jpn.rubys` の全 tail(`''`/`つ`/`か`/`たり`/`日`)について実際にコードを実行し 0〜130 の範囲で衝突がないことを実証済み(**完全往復は現状のテーブルで数学的に達成可能で、これまでの失敗は設計上の抜け穴であって言語的な曖昧さではない**ことを確認)。この過程で無関係な既存の不具合も1件発見: `case 99: return 'つくも'` は `_calc()` が数値を桁ごとに分解して呼び出す構造上、複合値99が渡ることが構造的に無く、到達不能なデッドコードになっている(`もも`(100)は百の位の寄与として正しく到達可能)。これは appendix 設計とは独立した別課題としてフラグを立てるに留めた。加えて、今後追加されるあらゆる屈折済みバリアントについて「`parse(n)`→`to_number` が実用範囲全体で一致するか」を機械的に検証する共通テストヘルパー(`assertRoundTrips`)の導入を提案する——「はつか」のように個別のケースが検証から漏れる事態を、屈折確定済みインスタンス単位でのテスト網羅により構造的に防ぐ狙い。
  - 低リスクな着手例として、`Romulus` 暦(既存サンプル)に `roman.upper` を割り当てるのがappendix問題を抱えない好例(未着手)。`english` の `regex` はこれまで `[A-Za-z]+` で任意の英字列を無条件に飲み込んでおり、同じ format 文字列内の元号名・曜日名等と衝突しうる不具合があったため、数詞語彙だけに一致する正規表現(語彙を長さ降順で `|` 連結)に修正済み。
- 多言語数詞の一致(agreement)体系の調査(将来、標準ライブラリ化する際の設計材料): `number.ts` の数詞基盤を fancy-date から独立した標準ライブラリへ切り出す構想に向けて、「appendix 相当の文脈情報は本当に暦トークン単位で固定で済むのか」を、日本語以外の実在の数詞一致体系を横断調査して検証した。
  - **CLDR の plural category(zero/one/two/few/many/other)は数値だけの純関数**: Unicode CLDR の複数形選択規則(例: ロシア語 one=`n%10=1 and n%100≠11`)は数値の剰余演算だけで決まり、外部文脈を一切必要としない。
  - **だが数詞そのものの語形変化(inflection)は数値だけでは決まらない**: ロシア語・ポーランド語は数詞自体が格変化する品詞で、文の格(主格/生格/与格/対格/造格/前置格)に応じて数詞の形そのものが変わる(пять→пяти́→пятью́等)上、ポーランド語には人間男性を含む集団かどうかで数詞が変わる「virile/non-virile」の区別と、それとは別の「集合数詞」系列まである。アラビア語は3〜10の数詞が数えられる名詞の性と**逆の**性で現れる「性の極性」があり、さらに1〜2/3〜10/11〜19/20〜99/100以上で名詞の格・定性の要求が変わる。スワヒリ語は名詞クラス(15〜18種)ごとに数詞へ一致接頭辞が付くが、対象は `-moja`(1)〜`-tano`(5)と `-nane`(8)の6語根のみで、6・7・9・10以上の倍数はアラビア語からの借用語で活用せず不変化。
  - **これらの外部文脈情報は、いずれも「暦トークン単位」で固定であり、個々の呼び出しごとに変わる例は一つも実証されなかった**: 一致に必要な性・格・名詞クラス等は「日」「時」のようなカウント対象の名詞そのものの属性であり、暦の生涯を通じて変わらない。韓国語の固有数詞/漢語数詞の使い分け(時=固有数詞、分=漢語数詞、日付は常に漢語数詞)は一見「呼び出しごとに切り替わる」例に見えるが、実際には「時トークン」と「分トークン」という**別々のトークン**にそれぞれ固定のNumeralを割り当てる話に帰着し、むしろ「トークン単位固定」を補強する事例だった。日本語助数詞の音便(いっぽん/さんぼん/ろっぽんの三分岐は、助数詞の頭子音がハ行かどうかと、数詞の末尾が促音か撥音かで決まる)、中国語の声調変化(一/不のみ、量詞そのものの選択自体は数詞に音韻変化を起こさない純粋な語彙選択)も同様に、暦トークンが決まった時点で確定する。
  - この調査結果が上記(b)の「呼び出し時引数ではなく bind-time」という結論の裏付けになっている。
  - Sources: [CLDR Plural Rules](https://cldr.unicode.org/index/cldr-spec/plural-rules) / [UTS #35 Numbers](https://www.unicode.org/reports/tr35/dev/tr35-numbers.html) / [Russian numerals - Wikipedia](https://en.wikipedia.org/wiki/Russian_numerals) / [Polish numerals - Wikipedia](https://en.wikipedia.org/wiki/Polish_numerals) / [Arabic grammar - Wikipedia](https://en.wikipedia.org/wiki/Arabic_grammar) / [No Gender Polarity in Arabic Numeral Phrases (Linguistic Inquiry)](https://direct.mit.edu/ling/article/52/3/441/97424/No-Gender-Polarity-in-Arabic-Numeral-Phrases) / [Swahili grammar - Wikipedia](https://en.wikipedia.org/wiki/Swahili_grammar) / [Japanese counter word - Wikipedia](https://en.wikipedia.org/wiki/Japanese_counter_word) / [Tone sandhi - Wikipedia](https://en.wikipedia.org/wiki/Tone_sandhi) / [Korean numerals - Wikipedia](https://en.wikipedia.org/wiki/Korean_numerals)
- ruby タグ構築に適した format API(調査結果・設計): 読み仮名(ルビ)表現は HTML の `<ruby>` タグでの表示のためにあると言ってよいが、現行の `format()`/`format_by()` は複数トークンをすべて1本のフラット文字列へ `.join('')` してしまい、トークン境界の情報が失われる。実際に svelte-tick-timer の `/fancy` ページは、`'Eo Er'` のようにラベル用/読み用トークンをペアで並べ空白区切りにした format 文字列を組み、`.format(utc, fmt).split(/\s/)` した結果を暦16個ぶん固定位置で分割代入し、テンプレート側で `<ruby data-ruby={Er}>{Eo}<rt>{Er}</rt></ruby>` を手作業で組み立てている。format 文字列の並び・分割代入・テンプレートの3箇所を常に同じ順序に保つ必要があり、トークンを増減するたびに3箇所同時に直す必要がある、という指摘の通りの脆さがある。`Eo`/`Er` は同じ `Indexer` の同じ値を読んでいるだけなので、これは解決可能。追加候補として以下2メソッドを設計した(いずれも既存 `format()`/`format_by()` の戻り値・シグネチャは変更しない加算のみの変更):
  - `format_ruby(utc, token)`: 基底文字1つ(例 `'E'`)を渡すと、その場で `{ label, ruby? }` を返す。ラベル・読みが同一 `Indexer` から同時に取れることを利用した単発 API。
  - `format_parts(utc, fmt)`: 通常の format 文字列(`o`/`r` 接尾辞混在・リテラル文字混在可)を渡すと、トークン順を保った `{ token, text, ruby? }[]` を返す。素の基底トークン(`'E'` 単体)が来た時点でラベルと読みを1エントリにまとめて返し、リテラル文字(`'年'`等)は `token: ''` の別エントリとして素通しする。既存の `'Eo Er'` ペア形式を渡しても壊れない(冗長になるだけで動く)ため、消費側は移行を強制されず、新規に書くなら `'E'` 単体で済む。これにより svelte-tick-timer 側は `{#each c.format_parts(...) as part}` の1ループへ置き換えられ、format 文字列・分割代入・テンプレートの三重管理から解放される見込み(未実装)。appendix 配線((b))とは独立に設計できる(`format_parts` は `to_ruby`/`to_value` の結果をそのまま使うだけなので、(b)が配線されればその修正を自動的に引き継ぐ)。
- 漢数字表現の文化的バリエーション(歴史調査・整理): 数詞のバリエーション切り替え(前述(a))に向けて、日本の漢数字表記が実際にどう歴史的・文脈的に変化するかを調査した。識別した変異軸のうち、暦(日付)表示に関連するもの/しないものを整理する。
  - **関連度が高く、実装候補**: (1) 位取り表記 vs 桁列挙表記——和暦の日付は「十三日」のように位取りで畳むが、西暦4桁年は「二〇二四年」のように桁を独立に読み下し位取りしない(住所・番号の「三〇二号室」と同種の桁列挙)。現行 `jpn.漢字` は位取り式の `DIC` クラスしかなく、西暦年を素通しすると不自然な「二千二十四年」になりうる。位取りロジックの `DIC._calc()` を再利用できないため、`english`/`roman` と同様に `DIC` を継承しない桁ごとの薄い `Numeral` 実装(例: `jpn.桁読み`)を別途用意するのが妥当、というのが最優先の実装候補。(2) 廿・卅・卌(合字)の扱い——現行 `jpn.漢字` の音便は20/30/40だけを常時廿/丗/卌に変換する「選択の余地がない決め打ち」になっている。「廿日→はつか」は現役の暦語彙(廿は人名用漢字として現存)だが、卅・卌は日付という文脈でも事実上絶滅している。合字を使わない対抗ポジション(音便なしの `jpn.漢字` 相当)を並べて用意する程度は低コストで価値があるが、逆方向(合字をもっと積極的に使う拡張)は「合字使用が体系的規則だったという証拠は無い」ことが調査で判明しているため見送るべき。
  - **調査したが日付表示には無関係(レッドヘリング)と判断**: 大字(壱弐参…)は大宝律令701年公式令の簿帳規定に始まり現在も戸籍法施行規則31条・公証人法37条・商業登記規則・日銀券表記等に残るが、一次資料を確認した限り**日付そのものを大字で書く歴史的・現代的用例は無く**、金銭・法的数量の慣習に限定される。命数法の万進/万万進/上数の境界問題(塵劫記1627年初版は極まで十進・以降万進の混在、1631/1634年版で統一)や、仏教由来超大数(恒河沙・阿僧祇・那由他・不可思議・無量大数)の絶対値が経典ごとに異なる問題(華厳経≈10^31.1、倶舎論≈10⁵⁹、算学啓蒙1299年=10¹⁰⁴、塵劫記1634年版=現代標準10⁵⁶)は数学史的に興味深いが、暦の年数(4〜5桁)では万・億以上の桁に到達しないため無関係。「四」の忌避(982年小右記が最古の忌避例、1522年祇園会御見物御成記に「与の重」の実例)は部屋番号・階数等のラベル序数に限定される慣習で、日付の「四日(よっか)」自体は忌避対象ではないと明記されている(ドキュメントに注記する価値はある)。地域方言による漢数字表記の系統的バリエーションは、調査した限り裏付けとなる一次資料が見つからず、追加軸としては採用できない。
  - Sources: [大字(数字) - Wikipedia](https://ja.wikipedia.org/wiki/%E5%A4%A7%E5%AD%97_(%E6%95%B0%E5%AD%97)) / [廿 - Wiktionary](https://ja.wiktionary.org/wiki/%E5%BB%BF) / [塵劫記 - Wikipedia](https://ja.wikipedia.org/wiki/%E5%A1%B5%E5%8A%AB%E8%A8%98) / [阿僧祇 - Wikipedia](https://ja.wikipedia.org/wiki/%E9%98%BF%E5%83%A7%E7%A5%87) / [京(数) - Wikipedia](https://ja.wikipedia.org/wiki/%E4%BA%AC_(%E6%95%B0)) / [四の字 - Wikipedia](https://ja.wikipedia.org/wiki/%E5%9B%9B%E3%81%AE%E5%AD%97) / [縦書きの数字の書き方](https://everydaygoodthing.com/1460.html)
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
- `Calendar` 初期化の遅延化(調査結果): `import { Calendar } from 'fancy-date'` するだけで `src/sample/calendars.ts` の17個の `FancyDate` インスタンスが即座に構築される。実際に Cloudflare Workers のコールドスタートで CPU 予算超過(cpuTime 実測約2010ms)を起こした一因であり、消費側(svelte-tick-timer)では `export const ssr = false` で対症療法済みだが、fancy-date 本体側での恒久対応を検討した。調査の結果、**コストの正体は「暦を何個構築するか」ではなく「モジュール評価そのもの」**だと分かった: `.init()`(`def_regex`/`def_to_idx`/`def_table`等)は正規表現構築や固定長ループによるテーブル構築のみで、天文学的な三角関数計算やイテレーティブな zero 点探索は一切含まれない(そうした本当に重い計算は `to_tempos()`/`lunisolar()` 等、実際の parse/format 呼び出し時まで正しく遅延されている)。支配的コストは `sample/eras.ts` の253件の `元号` 配列や `naoj`(VSOP87/Meeus係数)の巨大なリテラル配列など、**import された時点でパース・アロケーションされる静的データ**であり、これは `Calendar.Maya` しか使わない利用者でも `astro.ts` 経由で `../naoj`/`../nasa` を巻き込んで全額支払う形になっている。検討した3方式:
  - Proxy による遅延ゲッター(`Calendar.X` に初回アクセスした時だけ `.dup().init()` する): 17回の `.init()`・16回の `.dup()`(`cloneValue`)を避けられるが、これは判明した中で最小のコストバケットにしか効かない。しかも同期 API(`Calendar.Gregorian.format()` をそのまま呼べる)を保ったまま `astro.ts`/`eras.ts` の import 自体まで遅延しようとすると、動的 `import()` は本質的に非同期になり両立しない。
  - サブパス分割(`fancy-date/calendars/core` 等への re-export 分割): 現行の `tsc` のみ・CJS のみのビルド(すでにファイル単位でコンパイルされている)と機械的に両立する本物の改善だが、**現行の `Calendar.X` という集約アクセスパターンを使い続ける限り恩恵はゼロ**(集約オブジェクトを提供する限り結局全部 import される)。恩恵を得るには消費側がサブパス import へ移行する非互換な変更が要る。さらに17暦中16暦が共有の `g` を `.dup()` の起点にしているため、どのサブパスを選んでも `g` + `eras.ts` + `locale.ts` の評価コストは避けられない。
  - `FancyDate` 内部(`init()`/`def_zero()` 等)自体の遅延化: 対象が存在しないという結論になった。`init()` 配下はすべて閉形式の算術か小さい固定長ループで、後回しにできるほど重い処理がそもそも無い。`ensure_number_map()`(DIC の数詞逆引きマップ構築)はすでに遅延化済みで、かつどのサンプル暦も `.numeral()` を呼ばないため現状トリガーすらされていない。**このアプローチは見送るべき**という評価で一致した。
  - 単独の決定打はなく、実際に効果があるのはサブパス分割(非互換な移行を要する)。Proxy 方式は補完的だが最小のコストバケットにしか効かない。加えて、svelte-tick-timer の `/fancy` ページ自体が17暦全部を意図的に同時表示するデモであるため、暦単位の遅延化をしても「結局全部使う」用途では恩恵がなく、そのケースへの正しい対処は既に実施済みの `export const ssr = false` のままで良い。**将来、1〜数暦だけを使う利用者が現れた場合**に向けた実装候補として記録し、今回は着手しない。

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
