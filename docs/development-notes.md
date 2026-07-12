# 開発メモ

fancy-date の開発者向け検討メモ・調査結果・実装ログ。エンドユーザー向けの使い方は [README](../README.md)、数詞ライブラリの詳しい設計案は [numeral-design.md](numeral-design.md) を参照。

## 今後の検討テーマ

### format / token / span

- 実装済み: `SpanPart` は `token` を持つ。`parse_span()` と `format_span()` は分離済みで、`parse_span()` は現在の `labels()` / `notation(..., relatives)` から文字列を `SpanPart[]` へ戻し、`format_span()` は同じ parts を現在のラベル設定で再表示できる。`Precision = CorePrecision | Token` なので、`precise` には不断 token も指定できる。`format_parts()` / `format_parts_by()` も実装済みで、HTML ruby 用に `{ token, text, ruby? }[]` を返す。
- 部分実装: 不断 token の span は「循環上の差分」として parse/format/find できるが、`add()`/`sub()` では意図的に例外にしている。暦上の実日付移動として解釈できるのは `y/M/d/H/m/s/S` と `Y/w/D` の階層 token だけ。不断 token の加算を許すなら、「次の甲子日」なのか「周期差だけを足す」のか、別の探索 semantics が必要。
- 部分実装: span 同士の symbolic 演算は `span_neg()` / `span_add()` / `span_sub()` で実装済み。同じ token だけを相殺し、異なる token 間の繰り上げ・相殺はしない。残課題は、平均サイズによる lossy な `span_approx()`、anchor 時刻の実暦境界に基づく `span_normalize()`、cyclic token span をどこまで演算対象に含めるかの整理。
- 採用済み token 命名: `dC<number>` は「日不断の number-cycle」、`yC<number>` は「年不断の number-cycle」を表す正本 token とする。干支系は `dC60/dC10/dC12`・`yC60/yC10/yC12` が正本で、既存の `dC/dCS/dCB`・`yC/yCS/yCB` と `A/C/B/a/c/b` は文化的 alias として残す。ルビは `dC60r` / `dC10r` / `dC12r` / `yC60r` など数値付き token に付く。同じ multi-character token registry で `Ha`=午前午後、`da`=paksha のような派生 token も扱える。
- 周期・暦注 token 方針: 九星は `yC9`=年九星、`dC9`=日九星。`E` は一般的な weekday token として、暦ごとの週相当 cycle (`dC7` / `dC8` / `dC10`) を指す。二十八宿のような日不断の宿は `dC28`。六曜は天文現象や lunar mansion ではなく旧暦月日から決まる暦注なので、固有 token `R6`(rokuyo 6)にする。二十七宿は lunar mansion ではあるが日不断ではなく旧暦月日由来なので `LM27` とし、`dC28` と分ける。旧 `f/F/V` alias は廃止し、それぞれ `yC9` / `dC9` / `dC28` または `LM27` を明示する。これらは format/find 表示・検索条件には使うが、通常 parse では日時座標の決定に使わない。干支などの周期 token から候補日時を推定する用途は、parse ではなく将来の find/候補探索 API 拡張で扱う。
- 今後の制約: multi-character token 追加時も、`format_parts()` の `{ token, text, ruby? }` 契約と「`text` 連結が `format()` と一致する」性質を維持する。

### 数詞・ロケール

- `number.ts` には `DIC`/`Numeral` 基盤(`jpn`, `old_jpn`, `english`, `roman`, `angle`)が実装済み。appendix は呼び出し時引数ではなく構築時に一度だけ確定する方式へ変更し、`DIC` に `.語尾(tail)` という日本語専用の公開ファクトリを追加する設計は [numeral-design.md](numeral-design.md) に集約済み。
- 「数詞体系・暦法・地域をまとめたものが暦」という整理に基づくバリエーション切り替えは、ロケール登録簿の設計でカタログ側は解決したが、`.spot()`(地域)側のバリエーション切り替えは未解決。
- 日本語漢数字の文化的バリエーションでは、位取り表記 vs 桁列挙表記が実装候補。和暦の日付は「十三日」のように位取りで畳むが、西暦4桁年は「二〇二四年」のように桁列挙が自然な文脈がある。`jpn.漢字` は位取り式なので、`english`/`roman` と同様に `DIC` を継承しない桁ごとの薄い `Numeral` 実装(例: `jpn.桁読み`)を別途用意する余地がある。
- 廿・卅・卌(合字)は、合字を使わない対抗ポジション(音便なしの `jpn.漢字` 相当)を並べる価値がある。一方、合字をさらに積極的に使う拡張は、体系的規則だった裏付けが薄いため見送るべき。
- 調査したが日付表示には無関係と判断したもの: 大字(壱弐参…)は金銭・法的数量の慣習に限定され、日付そのものを大字で書く歴史的・現代的用例は見つからなかった。命数法の万進/万万進/上数、仏教由来超大数、四の字忌避、地域方言による漢数字表記も、暦日付表示の実装軸としては採用しない。

Sources(多言語数詞一致体系の調査): [CLDR Plural Rules](https://cldr.unicode.org/index/cldr-spec/plural-rules) / [UTS #35 Numbers](https://www.unicode.org/reports/tr35/dev/tr35-numbers.html) / [Russian numerals - Wikipedia](https://en.wikipedia.org/wiki/Russian_numerals) / [Polish numerals - Wikipedia](https://en.wikipedia.org/wiki/Polish_numerals) / [Arabic grammar - Wikipedia](https://en.wikipedia.org/wiki/Arabic_grammar) / [No Gender Polarity in Arabic Numeral Phrases (Linguistic Inquiry)](https://direct.mit.edu/ling/article/52/3/441/97424/No-Gender-Polarity-in-Arabic-Numeral-Phrases) / [Swahili grammar - Wikipedia](https://en.wikipedia.org/wiki/Swahili_grammar) / [Japanese counter word - Wikipedia](https://ja.wikipedia.org/wiki/Japanese_counter_word) / [Tone sandhi - Wikipedia](https://ja.wikipedia.org/wiki/Tone_sandhi) / [Korean numerals - Wikipedia](https://en.wikipedia.org/wiki/Korean_numerals) / [大字(数字) - Wikipedia](<https://ja.wikipedia.org/wiki/%E5%A4%A7%E5%AD%97_(%E6%95%B0%E5%AD%97)>) / [廿 - Wiktionary](https://ja.wiktionary.org/wiki/%E5%BB%BF) / [塵劫記 - Wikipedia](https://ja.wikipedia.org/wiki/%E5%A1%B5%E5%8A%AB%E8%A8%98) / [阿僧祇 - Wikipedia](https://ja.wikipedia.org/wiki/%E9%98%BF%E5%83%A7%E7%A5%87) / [京(数) - Wikipedia](<https://ja.wikipedia.org/wiki/%E4%BA%AC_(%E6%95%B0)>) / [四の字 - Wikipedia](https://ja.wikipedia.org/wiki/%E5%9B%9B%E3%81%AE%E5%AD%97) / [縦書きの数字の書き方](https://everydaygoodthing.com/1460.html)

### 暦法・天文モデルの拡張

- インド系暦を本格対応する場合、日の出始まりの civil day 自体は `.dayStart('sunrise')` で表現できる。ただしヒンドゥー暦・パンチャーンガの実務では「日の出時点で存在する tithi をその日の日付/祭日に割り当てる」層が本体になる。必要な追加要素は、(1) tithi(月太陽離角12度ごとの30分割)・paksha(白分/黒分)・nakshatra/yoga/karana 等の位相トークン、(2) 日の出時点での tithi 採用、欠日(kshaya tithi)・重日(adhika/repeated tithi)の扱い、(3) amanta/purnimanta の月名方式、adhika masa/kshaya masa の月規則、(4) 太陽入宮(sankranti)による sidereal solar month と ayanamsha/黄道基準の選択、(5) 地域・宗派・祭日ごとの「前日/翌日採用」「日の出前後の持続条件」などの判定 DSL。単に `dayStart('sunrise')` を追加するだけでは不十分で、月相日を civil day へ投影する専用 rule/assignment 層が必要。
- 太陽暦の上位単位、マヤ長期暦、中東・インド・アフリカの暦を調査する。
- 歴史的時刻表現として、定気法に四半刻表現を採用するか、江戸時代以前の「分」「秒」に近い時刻表現を調査する。ローマ・ユリウス暦サンプルでは、H を horae temporariae、m を pars minuta として表示し、秒・ミリ秒は標準表示から外した。秒は内部精度としては残すが、古代/中世以前の生活時刻語彙として一般化しない。
- 天文モデルは、地球以外の天体向けに `src/nasa` の高精度モデルを追加済み。今後は楕円軌道、彗星、多星系の暦を検討する。
- 暦外期間は、ロムルス暦のように暦月だけで1年を表現し尽くさない暦は他に類例が見当たらず、`month_divs` の `null` 要素 + `Indexer.list` への `null` 混在で表現した対応をこれ以上汎用化する必要は薄いと思われる。

### 性能・パッケージ構成

- `Calendar` 初期化の遅延化を検討した。`import { Calendar } from 'fancy-date'` だけで `src/sample/calendars.ts` の多数の `FancyDate` インスタンスが即座に構築され、Cloudflare Workers のコールドスタートで CPU 予算超過(cpuTime 実測約2010ms)を起こした一因になった。
- 2026-07-11時点の perf 調査: 明確な劣等は cold require だった。対策前は `require('./lib/sample')`/`require('./lib/index')` が約1.86〜1.97sで、原因は `src/sample/calendars.ts` の全サンプル即時 `.init()` と、`src/index.ts` の sample 再エクスポートだった。`FancyDate.lazy(create)` を追加し、`Calendar` の各サンプルを enumerable lazy proxy 化して参照されたサンプルだけ初期化するようにした後は `require('./lib/index')`/`require('./lib/sample')`/`require('./lib/sample/calendars')` が約10〜14msまで低下した。`tithi()` assignment の per-call cost は現時点では支配的でないため、詳細値は `scripts/perf.js` 側の測定項目に留める。
- 調査の結果、コストの正体は「暦を何個構築するか」ではなく「モジュール評価そのもの」。`.init()` 配下は正規表現構築や固定長ループ中心で、天文学的な反復計算は `to_tempos()`/`lunisolar()` まで遅延されている。支配的コストは `sample/eras.ts` の元号配列や `naoj`/`nasa` の巨大な静的データ。
- Proxy による `Calendar` 遅延化は、サンプル暦の即時 `.init()`/`new FancyDate()` を避ける効果が大きかった。一方、同期 API を保ったまま `astro.ts`/`eras.ts` の import 自体を遅延するのは難しく、そこまで必要ならサブパス分割や動的 import を別途検討する。
- サブパス分割(`fancy-date/calendars/core` 等)は実効性があるが、現行の `Calendar.X` 集約アクセスを使い続ける限り恩恵はゼロ。消費側がサブパス import へ移行する非互換な変更が要る。将来、1〜数暦だけを使う利用者が現れた場合の候補として保留する。
- svelte-tick-timer の `/fancy` ページは複数の重い暦を意図的に同時表示するデモなので、暦単位の遅延化をしても結局多くを使う。その用途への対処は `export const ssr = false` のままでよい。

## 既知課題

- `MeanLunisolarMonthRule` の年末閏月バグ: 閏月が年末に来る場合、`now_idx = mod(season.now_idx, termCount) >> 1` が0に巻き戻り、`parse_by()` の閏月シード式(月始め付近を想定)と噛み合わず round-trip が約1年ズレる。平気法でも再現し、40年間で8回程度。バビロニア暦カスプ/ベールでは `.notation({H:[12]})` による H.length の違いで `def_zero()` のタイムゾーン量子化が1時間ズレ、上記と合わさって稀に閏月の有無自体が食い違う(400ヶ月中7回)。`dusk()`/`dayBoundary()` とは無関係な latent bug。修正には `MeanLunisolarMonthRule`/`parse_by()` の閏月シード式の見直しが必要。
- 元号あり暦の anchor 表記規約: `y` は実在の元号テーブルを持つ暦では元号相対の年数(例: 令和6年)に調整される。一方、`calendar()` の anchor 文字列に書く年数(例: 平気法の「2629年」=皇紀の絶対年)は era 調整前の生値として較正されるため、`format(anchor_epoch, 'y...')` は anchor 自身の絶対年ではなく era 調整後の値を返す。これは明確な二重計算ではなく表記規約の不一致に近い。修正には「anchor の年をどちらの規約として較正するか」という設計判断が要る。
- `dayBoundary()` は固定オフセットを d/N の構築規則だけに適用する。月・年境界まで丸める `dayStart('sunrise' | 'sunset')` とは違い、月頭の切り詰め区間は既知の例外として残る。

## 実装済み・検証済み

### 実装済み: format / span / token 表記

- `format_parts(utc, fmt)` / `format_parts_by(utc, fmt)` を追加した。戻り値は `{ token, text, ruby? }[]`。`token` は元の format token、リテラル片は `''`、`text` の連結は常に `format()` と一致する。`ruby` は本文 token に添える読みがある場合だけ付け、`dC60r`/`Er` のような `r` suffix token は読みそのものを `text` にするため `ruby` を付けない。`format_parts_by()` が内部で `to_tempos_input()` するため、数値・文字列・解決済み `Tempos` のいずれでも使える。
- `format()` は内部的に `format_parts_by(...).map((p) => p.text).join('')` へ委譲する形にしたため、文字列出力と parts API の整合性を実装上保証している。旧 `format_by()` の役割は `format()` と `format_parts_by()` が巻き取った。
- svelte-tick-timer の `/fancy` ページは `format_parts()` ベースへ移行し、空白 split と固定配列分割代入をやめた。`FormatPart` から `{ text, ruby }` を作って `<ruby>{text}<rt>{ruby}</rt></ruby>` に流し込む形になり、format 文字列・分割代入・テンプレートの三重管理を解消した。
- `labels()` と `parse_span()` / `format_span()` を追加し、span の表記を暦ごとに調整できるようにした。
- `Span` の内部 anchor を `{ calendar, at?, msec? }` に整理した。`span_obj(to, from)` 由来の span は `at=from` と `msec=to-from` を持ち、`parse_span(text, { at })` は msec なしの基準時刻だけを持つ。`span_msec(span, { at? })` は anchor の msec を使うか、基準時刻から `add()` して実ミリ秒へ変換する。span 同士の演算後は msec を喪失させる方針。
- `span_neg()` / `span_add()` / `span_sub()` を追加した。これは symbolic な span 演算で、同 token の値だけを足し引きし、異 token 間の繰り上げ・相殺は行わない。混合方向は `1ヶ月後31日前` のように part ごとに方向を表示する。演算後は msec を保持せず、anchor の `at` だけ条件付きで残す。
- `precise` に不断 token を指定できるようにし、SpanPart に token を持たせた。
- 非 `precise` の span も、固定時間ではなく暦の秒・分・時・日境界に基づいて判定するようにした。
- SpanLike の `前` / `後` 省略表現(例: `1年2ヶ月`)を `後` として解釈するようにした。
- `.assign(...)` の受け皿を追加し、最初の具体例として `tithi()` を `assign({ d: tithi() })` に接続した。`tithi()` は `dayStart()` が決めた暦日境界時刻(`context.at`)で月相を30分割し、`d.now_idx` に割り当てる。`d.succ()`/`back()` が壊れないよう、assignment 前の civil day index は `raw_now_idx` に残し、遷移時はそれを使う。tithi 現象側の通し番号は `assignment_raw_now_idx` に分けて保持し、前後の raw tithi と比較して `assignment_flags` に `skipped`/`repeated` を付ける。これは tithi 自体の判定なので `nakshatra()`/`yoga()`/`karana()` は不要で、パンチャーンガの別要素として後回しにできる。assignment は token index の決定、`notation()` は表記、`division()` は時間分割、`dayStart()` は civil day 境界、という責務分離を維持する。サンプルとして `アマンタティティ` / `プールニマンタティティ` を追加し、既存の `アマンタ` / `プールニマンタ` は比較用に残した。tithi サンプルは観測に寄る暦として `天文月` / 満月基準の `天文黒分月` を使い、日の出境界も `hasSolarEvents` を持つ太陽モデルで解決する。祭日判定、parse candidate 化は未着手。

### 実装済み: 数詞・ロケール

- 暦ごとの数値辞書を使った format/parse 入出力に対応した。
- `perf:*` 系の性能測定スクリプトを追加した。入力検証強化(NaN/Infinity ガード追加)後に `bun run perf:core` を実行し、parse/format/to_tempos/span/add-sub/太陰太陽暦/天文現象の既存水準から劣化していないことを確認済み。
- english 数詞の regex が任意の英字列を無条件に飲み込み、元号名・曜日名等と衝突しうる不具合を修正した。数詞語彙だけに一致する正規表現に差し替え、語彙を長さ降順に連結した。

### 天文・観測・入力安全性

- `SolarEventDayTempoRule(..., 'sunrise' | 'sunset')` を追加し、`RealSunsetDayTempoRule` は `sunset` 固定の薄い互換 wrapper にした。日の出/日没境界の差は `solor()` の `日の出`/`日の入` 選択だけに寄せた。
- `LunarObservation`/`SolarObservation` に `has_sunrise`/`has_moonrise`/`has_transit`/`has_moonset` と `is_up_all_day` を追加した。対応する数値フィールドが NaN になりうる理由を型定義に JSDoc で明記した。`number | undefined` 化は内部影響が大きく見送った。
- mean モデル経路の `solor()` に南中高度・日の出方位・日の入方位を補った。日の入方位は日の出方位を北基準で反転して求める。精密モデルとの差は分点付近で最大0.25度程度。
- `format`/`add`/`sub`/`span` は既存の `to_tempos()`/`span_between()` 経由で NaN/Infinity を検出できる。`find()`、`solor()`、`lunar()`、`noon()` にも非有限値ガードを横展開した。

### 暦サンプル・暦日境界

- `sample.ts` を `src/sample/` に分割した。
- `src/nasa` を追加し、Mars の太陽季節モデルを試験的に導入した。
- 地域暦の足場として、ナボナサル紀元を anchor にした365日固定のエジプト民用暦を追加した。
- `calendar()` に閏年 offset を追加し、Alexandria 地点のコプト暦を追加した。
- ロムルス暦・ユリウス暦は、共和政期からユリウス暦採用後の帝政期まで市民生活が不定時法(horae temporariae、日の出・日の入りを基準に昼夜12等分)だったことに合わせ、`.division({ H: 'solar' })` を追加した。標準表示も `Ho mo` に寄せ、H は `hora prima`〜`hora duodecima` / `hora ... noctis`、m のラベルは不定時の第1細分(`pars minuta`)として扱う。夜はローマ軍制の vigiliae(4夜警)という別の数え方もあるが、現行 `H` は24スロット(夜12+昼12)の temporal-hour 表示に統一する。`solor()` の天文計算自体は `is_solor` に関わらず同一で、変化するのは表示規約のみ。
- 極域での不定時法は construction 時点で例外化した。`.init()` 冒頭で `this.dic.is_solor && 66.5 <= Math.abs(this.dic.geo[0])` を検査する。66.5度は「これより先は確実に不可能」という下限であり、手前でも夏至/冬至付近の退化ケースは残る。
- バビロニア暦(カスプ/ベール)・オスマン帝国の時刻制度(季節時法/アラトゥルカ)を追加した。バビロニア暦は平気法と同じ mean モデルの太陰太陽暦を使い、カスプ=不定時法+日没境界、ベール=1日12等分の等時法+固定境界で分けた。オスマン帝国の2暦はユリウス暦の日付構造を流用し、季節時法=不定時法、アラトゥルカ=等時法で分けた。
- `dayBoundary(offsetHours)` は d/N(月内日)構築規則だけに作用する固定オフセットとして実装した。offsetHours は H.length ではなく day 長から換算する。def_zero の hour→day→month→year 連鎖へ直接入れると、月・年の zero 点まで動いてしまい、時刻体系だけが違う対の暦で日番号が大きく食い違うため避けた。
- `.dayStart('sunrise' | 'sunset')` は `SolarEventDayTempoRule` で実際の日の出/日の入を暦日境界にする。`dusk()` は `.dayStart('sunset')` の互換 alias。月・年の開始候補も `StartAlignedTempoRule` で「その後に最初に来る太陽イベント」へ丸め上げ、月初/年初直前の短い区間を前月末/前年末として扱う。これにより、月初の `d.succ()` と `add(..., '1日後')` の意味を一致させた。
- `dayStart()` の d/N では、`CachedTempoRule` に `parent.last_at` を cacheKey として渡し、異なる月親で同じ write_at のキャッシュが混ざらないようにした。
- `find_span_time()` は `month.last_at + dayIndex*msec.day` ではなく `resolve_day_start()` を使うようにした。`dayStart()`/`dayBoundary()` 暦で `add()`/`sub()` が1日早い日付を返す実バグを修正した。`SolarEventDayTempoRule` の `now_idx` は、親境界からの経過ミリ秒ではなく civil day index 差分で求める。日の出が前日より早くなる季節でも `d` が重複しないようにするため。

Sources: [Unequal hours](https://en.wikipedia.org/wiki/Unequal_hours) / [不定時法の説明 - THE SEIKO MUSEUM GINZA](https://museum.seiko.co.jp/knowledge/relation_16/) / [和時計 - Wikipedia](https://ja.wikipedia.org/wiki/%E5%92%8C%E6%99%82%E8%A8%88) / [Danna (Mesopotamian) - Wikipedia](<https://en.wikipedia.org/wiki/Danna_(Mesopotamian)>) / [Hour - Wikipedia (Babylonian hours)](https://en.wikipedia.org/wiki/Babylonian_hours) / [Equinoctial hours - Wikipedia](https://en.wikipedia.org/wiki/Equinoctial_hours) / [Babylonian calendar - Wikipedia](https://en.wikipedia.org/wiki/Babylonian_calendar) / [Witnesses of time: How Ottoman Empire measured time - Türkiye Today](https://www.turkiyetoday.com/culture/witnesses-of-time-how-the-ottoman-empire-measured-regulated-and-lived-time-3212480) / [Our Time: On the Durability of the Alaturka Hour System in the Late Ottoman Empire](https://www.academia.edu/10068187/_Our_Time_On_the_Durability_of_the_Alaturka_Hour_System_in_the_Late_Ottoman_Empire_International_Journal_of_Turkish_Studies_16_2010_47_69)

### バグ修正・仕様整理

- 干支のサンプル初期値の誤りを修正した。定気法の年干支(a)起点値が1968年の「戊申」になっていたが、平気法と同じ起点年(皇紀2629年=西暦1969年)の正しい年干支「己酉」に直した。
- 日干支(A)起点値のズレを調査し、最終的な真因は `def_zero()` の日次巡回トークン二重シフトだった。`dC60/dC12/dC10/E/dC28` などの日次 cycle のゼロ点を、d 自身のシフト分を含まない `hour` 起点で計算するよう修正した。これにより Julian の anchor「1582年10月5日は金曜日」という史実や、同一UTC瞬間を指す複数暦の日干支が一致することを確認した。
- 定気法(観測太陰太陽暦モデル)の `.parse()` 年逆算バグを修正した。観測モデルでは `ObservedLunisolarYearRule` がグレゴリオ暦年を使うため、平気法の連続 index 前提の `zero + y*msec.year` では約660年ズレていた。元号開始 msec を起点に `lunisolar()` 探索で目標年へ収束させる分岐を追加した。
- `export *` の tslib バンドル非互換性を修正した。`src/index.ts`・`src/sample.ts`・`src/sample/index.ts`・`src/naoj.ts`・`src/naoj/index.ts`・`src/nasa/index.ts`・`src/fancy-date.ts` の計7箇所で `export *` を明示的な named export に置き換え、esbuild bundle で `Calendar`/`Tempo`/`to_msec` が undefined にならないことを確認した。

## 調査メモ・教訓

- 干支調査では、暦システム自身の自己無矛盾チェック(「anchor を format() したら anchor の値に戻るか」)だけでは不十分だった。2020年1月22日=甲子、皇紀2629年=西暦1969年で己酉など、独立に検証可能な実世界の事実と複数日付で突き合わせる方が、真の誤りと暦法差を分けやすい。
- 値のズレが複数の実測点で一定の場合、探索アルゴリズムより初期値・zero 点のような加法的較正定数が疑わしい。
- 既存テストが「既知の別課題として対象外」としている箇所を安易に一緒に直すと、無関係な不具合を自分の変更のせいだと誤診しやすい。独立に検証してから結論を出す。
- 不定時法を極域へ正しく拡張する自然な答えは見当たらない。極域先住民の時間認識も「昼をN等分する」発想とは別系統で、南極観測基地も補給元国の標準時に合わせる例が多い。
- 先住民の極域暦の計算機的表現では、イヌイットの13朔望月暦は「極夜明け最初の日の出」を年始にする候補がある。これは `has_sunrise` の false→true 遷移探索に近い。既存 `find()` は format 済み文字列条件しか扱えないため、`has_sunrise`/`is_up_all_day` のような生の太陽・月イベント判定を条件にできる探索 API が必要になりそう。
- サーミの8季節暦は、生態/感覚に基づく季節境界であり、既存の年/月/日階層にそのまま乗せるのは無理がある。太陽黄経ベースの8分割で近似するなら、文化的運用の単純化であると明記する必要がある。

Sources: [Sámi Eight-Season Calendar](https://www.outlooktraveller.com/experiences/in-the-arctic-time-moves-differently-inside-the-s%C3%A1mi-eight-season-calendar) / [Inuit astronomy](https://en.wikipedia.org/wiki/Inuit_astronomy) / [Time in Antarctica](https://grokipedia.com/page/Time_in_Antarctica)
