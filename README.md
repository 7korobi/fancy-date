# fancy-date

[![Build Status](https://travis-ci.org/7korobi/fancy-date.svg?branch=master)](https://travis-ci.org/7korobi/fancy-date)

## インストール

```shell
bun add fancy-date
```

## 今後の検討メモ

- Span: span の各 part を暦 token として内部化し、不断 token の受け入れ、span 同士の演算、parse/format の分離を検討する。
- リアクティブ用途: 相対 span の表示ラベルが次に変化する timestamp を取得できるようにする。
- 数値表現: 暦ごとに設定した数値辞書を使い、日本語、英字、ローマ数字などの入出力に対応する。
- 性能測定: parse、format、to_tempos、span、add/sub、太陰太陽暦、天文現象のベンチマークを追加する。
- 天文モデル: 地球以外の天体向けに NASA 由来の高精度モデルを追加し、楕円軌道、彗星、多星系の暦を検討する。
- 暦の拡張: 世紀・千年紀など太陽暦の上位単位、マヤ長期暦の単位、中東・インド・アフリカの暦を調査する。



1. Span 中核
最優先にするならここです。ここが固まると、その後の UI・リアクティブ・暦追加が全部やりやすくなります。

Span 内部形式の強化
SpanLike の文法拡張
token 拡張
Span 同士の演算
Span formatter/parser 分離
Span での不断の受け入れ
precise に不断を指定
span(timestamp, now) の次回表示変化タイミング計測
方向性としては、Span を単なる表示差分ではなく、Tempos に対応する「暦差分の内部形式」に引き上げるのがよさそうです。

たとえば:

将来的には unit より token が主になりそうです。y/M/d/H/m/s/S だけでなく、A/B/C/E/F/V/a/b/c/f/Z/N/Q/w/G のような不断・暦要素も扱うなら、token を持つ方が自然です。

リアクティブ用途はとても重要です。

これがあると、Svelte 側で「次に更新すべきタイミング」だけ timer を張れます。Tempo.timeout の思想と相性が良いです。

2. 性能測定
これは早めに入れた方がよいです。特に定気法・NAOJ・旧暦は重くなりやすい。

測りたい対象:

parse
format
to_tempos
span/span_obj
add/sub
lunisolar
solar_terms
lunar_phase
find
time_table/monthry_table
追加するなら:

出力はまず JSON でよいです。

今後 metrics:* が天文精度、perf:* が性能、という分担にできます。

3. 数値表現
number.ts を軸にするのは良いです。ここは parse/format の表現力に直結します。

やりたいこと:

number.ts に基づく日本語数値の入出力
英字数値
ローマ数字
旧字体・大字
位取り表現
0 padding との関係整理
候補:

format token にどう載せるかが設計点です。yyyy のような token 長で制御する既存思想と、yo/yr のような mode 制御のどちらに乗せるか。

今の構造なら、Indexer.to_value/to_label/to_ruby に加えて to_number 的な層を作るか、format_by の token mode を増やす方向です。

4. 天文モデル拡張
ここは夢が広いけれど、依存が重いので段階的に。

src/nasa
高精度な他天体の軌道
著しい楕円軌道の天体
彗星居住者にとっての暦
三星体系
複数太陽暦
現実的な順序は:

src/nasa 追加
Mars から始める
惑星の太陽黄経・季節相を高精度化
離心率が大きい軌道の近点/遠点を扱う
彗星・小天体の楕円軌道暦
多星系は最後
OrbitalModel.phaseAt/timeOfPhase は円軌道・周期位相に寄せた抽象なので、楕円軌道をやるなら別能力が必要になりそうです。

三星体系はさらに別物です。重心、複数光源、日の出/南中の定義が揺れます。ここは「暦として何を一日とするか」から設計が必要です。

5. 歴史的時刻表現
これは 定気法 と相性が良いです。

四半刻表現
江戸時代以前の分/秒に相当する表現
漏刻・刻・点・分などの扱い
不定時法と定時法の切り替え
四半刻は入れてよいと思います。m が今は ['', '半'] の 2 分割ですが、4 分割にできます。

ただし歴史的に「秒」のような連続的細分をそのまま入れるより、まずは 刻 / 半刻 / 四半刻 を UI 表現として扱うのが安全です。天文学・暦算上の細分と生活時刻表現は別物なので、s/S は内部精度、m は表現単位、という分離がよさそうです。

6. 暦体系の拡充
これは sample 分割後にやるとよいです。

太陽暦の充実
年の上位: 世紀、千年紀
mayaLongCount の取り込み
中東・インド・アフリカの暦
mayaLongCount は今 helper として外にいますが、暦 token として取り込む価値があります。uinal/tun/katun/baktun は y/M/d とは別の階層なので、Tempos の拡張か、Maya 専用 formatter の整理が必要です。

太陽暦の上位単位は、year の上に century/millennium を追加するより、まず Span token 拡張で扱うのがよさそうです。

ただし全暦で意味があるわけではないので、Calendar ごとの capability として持つ方が安全かもしれません。

中東・インド・アフリカの暦は、候補を分けると進めやすいです。

イスラム暦: 算術暦、観測暦の差
ヘブライ暦: 太陰太陽暦、閏月規則
インド暦: サカ暦、アマンタ/プールニマンタの発展
エチオピア暦/コプト暦
古代エジプト暦
バハイ暦


おすすめ順
直近でやるなら、この順がよいと思います。

sample.ts を sample/ に分割
以後の暦追加の受け皿を作る。

Span の parser/formatter 分離
parse_span, format_span, span_between, add_span を整理。

Span の next_at/timeout
リアクティブ用途に効く。性能測定もしやすくなる。

perf:* scripts 追加
この後の拡張で劣化を見つけやすくする。

数値表現
number.ts から roman/alpha/japanese を拡張。

token 拡張・不断対応
Span 内部形式を Tempos に寄せる。

NASA / 他天体高精度
ここからは別大陸。src/nasa と Mars から。

地域暦・歴史時刻表現
sample 分割後に増やす。

この順なら、基盤を固めながら面白い暦を増やせます。まず sample/ 分割を済ませるのが、次の探索に向けた足場として一番効くと思います。