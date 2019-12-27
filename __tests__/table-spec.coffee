{ FancyDate, to_msec, to_tempo_bare } = require "../lib/index.min"

format = require "date-fns/format"
locale = require "date-fns/locale/ja"
_ = require 'lodash'

calendars = [
  [utc = FancyDate.UTC, "J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G"]
  [g = FancyDate.Gregorian, "J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G"]
  [fg = FancyDate.フランス革命暦, "J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G"]
  [j = FancyDate.Julian, "J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G"]
  [rg = FancyDate.Romulus, "J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G"]
  [平気法 = FancyDate.平気法, "J Z aA yyyy年MM月dd日(E) Homo ssss:S G"]
  [am = FancyDate.アマンタ, "J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G"]
  [pm = FancyDate.プールニマンタ, "J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G"]
  [b = FancyDate.Beat, "J Z a-A yyyy年MM月dd日(E) @H.m"]
  [mg = FancyDate.MarsGregorian, "J Z a-A yyyy年MM月dd日(E) HH:mm:ss:SS G"]
  [jg = FancyDate.Jupiter, "J Z a-A yyyy年MMM月dd日(E) HH:mm:ss:SS G"]
]


describe "テーブル", =>
  test '日間', =>
    msec = g.parse("2020年3月22日")
    expect calendars.map ([c, str])=>
      c.time_table(msec).join("/")
    .toMatchSnapshot()
    return
  test '週間', =>
    msec = g.parse("2020年3月22日")
    expect calendars.map ([c, str])=>
      c.weekly_table(msec).join("/")
    .toMatchSnapshot()
    return
  test '月間', =>
    msec = g.parse("2020年3月22日")
    expect calendars.map ([c, str])=>
      c.monthry_table(msec).join("/")
    .toMatchSnapshot()
    return
  test '年間', =>
    msec = g.parse("2020年3月22日")
    expect calendars.map ([c, str])=>
      c.yeary_table(msec).join("/")
    .toMatchSnapshot()
    return
  return
