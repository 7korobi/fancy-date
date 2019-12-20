{ FancyDate, to_msec, to_tempo_bare } = require "../lib/index.min"

format = require "date-fns/format"
locale = require "date-fns/locale/ja"
_ = require 'lodash'


g = FancyDate.Gregorian
mg = FancyDate.MarsGregorian
jg = FancyDate.Jupiter
rg = FancyDate.Romulus
fg = FancyDate.フランス革命暦
平気法 = FancyDate.平気法

to_graph = (c, msec, str = "Gyyyy-MM-dd HH:mm a-Z-E")->
  { PI } = Math
  deg_to_rad  = 2 * PI / 360
  { 方向,時角, 真夜中,日の出,南中時刻,日の入 } = c.solor msec
  "#{
    c.format msec, str
  }  真夜中.#{
    c.format 真夜中, "HH:mm"
  } 日の出.#{
    c.format 日の出, "HH:mm"
  } 南中時刻.#{
    c.format 南中時刻, "HH:mm"
  } 日の入.#{
    c.format 日の入, "HH:mm"
  } 方向.#{
    Math.floor 方向 / deg_to_rad
  } 時角.#{
    Math.floor 時角 / deg_to_rad
  }"

deploy = (c, moon_zero, season_zero)->
  list = []
  for i in [0.. to_msec("5y") / c.calc.msec.moon]
    msec = moon_zero + i * c.calc.msec.moon
    { last_at, next_at } = c.to_tempos(msec).d
    list.push last_at - 1
    list.push last_at
    list.push next_at - 1
    list.push next_at
  for i in [0.. to_msec("5y") / c.calc.msec.season]
    msec = season_zero + i * c.calc.msec.season
    { last_at, next_at } = c.to_tempos(msec).d
    list.push last_at - 1
    list.push last_at
    list.push next_at - 1
    list.push next_at
  _.sortedUniq list.sort()

earth_msecs = deploy( g,
  moon_zero   = to_tempo_bare(  g.calc.msec.moon,    g.calc.zero.moon,   new Date("2018-01-01") - 0 ).last_at
  season_zero = to_tempo_bare(  g.calc.msec.season,  g.calc.zero.season, new Date("2018-01-01") - 0 ).last_at
)

mars_msecs = deploy( mg,
  moon_zero   = to_tempo_bare( mg.calc.msec.moon,   mg.calc.zero.moon,   new Date("2018-01-01") - 0 ).last_at
  season_zero = to_tempo_bare( mg.calc.msec.season, mg.calc.zero.season, new Date("2018-01-01") - 0 ).last_at
)

jupiter_msecs = deploy( jg,
  moon_zero   = to_tempo_bare( jg.calc.msec.moon,   jg.calc.zero.moon,   new Date("2018-01-01") - 0 ).last_at
  season_zero = to_tempo_bare( jg.calc.msec.season, jg.calc.zero.season, new Date("2018-01-01") - 0 ).last_at
)

describe "define", =>
  test 'data', =>
    expect g.calc.msec.period
    .toEqual 12622780800000
    expect g.table.msec.year[-1..]
    .toEqual [12622780800000]
    return
  return

describe "平気法", =>
  test 'calc', =>
    expect 平気法.calc
    .toMatchSnapshot()

  test 'precision', =>
    expect 平気法.precision()
    .toEqual
      leap: [4]
      year: [[12],[30,31]]
      day: [[12],[2],[3600]]
      strategy: "SolarLunar"
      is_legal_solor: true
      is_legal_eto: true
      is_legal_ETO: true
    expect mg.table.month
    .toMatchSnapshot()

  test '雑節', =>
    expect [
      100000000000000
      10000000000000
      1556636400000
      1000000000000
      100000000000
      10000000000
      0 
    ].map (utc)=>
      o = 平気法.to_tempos utc
      z = 平気法.雑節 utc, o
      list =
        for key, val of z
          "#{ 平気法.format val.last_at, "J Gyy年Mdd日" } ～ #{ 平気法.format val.next_at - 1, "Mdd日 #{ key }" }"
      [..._.flattenDepth(list, 2).sort(), 平気法.note(utc, o, z).join("") ]
    .toMatchSnapshot()
    return

  test '二十四節季と月相', =>
    dst = []
    for msec in earth_msecs
      dst.push "#{
        g.format msec, "yyyy a-A Z-E HH:mm"
      } #{
        平気法.format msec, "a-A f-F Z-E Gy年Mdd日 Hm ssss秒"
      }"
    expect dst
    .toMatchSnapshot()
    return
  return

describe "Gregorian", =>
  test 'calc', =>
    expect g.calc
    .toMatchSnapshot()

  test 'precision', =>
    expect g.precision()
    .toEqual
      leap: [4, -128, 456, -3217]
      year: [[12],[30,31]]
      day: [[24],[60],[60]]
      strategy: "SolarTable"
      is_legal_solor: true
      is_legal_eto: true
      is_legal_ETO: true
    expect g.table.range.month
    .toMatchSnapshot()

  test '雑節', =>
    expect [
      100000000000000
      10000000000000
      1556636400000
      1000000000000
      100000000000
      10000000000
      0 
    ].map (utc)=>
      o = g.to_tempos utc
      z = g.雑節 utc, o
      list =
        for key, val of z
          "#{ g.format val.last_at, "J yyyy/MM/dd" } ～ #{ g.format val.next_at - 1, "MM/dd #{ key }" }"
      [..._.flattenDepth(list, 2).sort(), g.note(utc, o, z).join("") ]
    .toMatchSnapshot()
    return

  test 'format', =>
    str = "Gy年MM月dd日(E)HH時 Z"
    expect [
      g.format 100000000000000, str
      g.format 10000000000000, str
      g.format 1556636400000, str
      g.format 1000000000000, str
      g.format 100000000000, str
      g.format 10000000000, str
      g.format 0, str 
      g.format g.calc.zero.period, str 
    ].join("\n")
    .toEqual [
      "西暦5138年11月16日(水)18時 立冬"
      "西暦2286年11月21日(日)02時 小雪"
      "西暦2019年05月01日(水)00時 穀雨"
      "西暦2001年09月09日(日)10時 白露"
      "西暦1973年03月03日(土)18時 雨水"
      "西暦1970年04月27日(月)02時 穀雨"
      "西暦1970年01月01日(木)09時 冬至"
      "紀元前1年01月01日(土)00時 冬至"
    ].join("\n")
    return

  test 'parse → fomat cycle', =>
    str = "Gy年MM月dd日(E)H時m分s秒"
    expect [
      g.format g.parse(    "0年4月1日"), str
      g.format g.parse("1970年4月27日"), str
      g.format g.parse("1973年3月3日"), str
      g.format g.parse("2001年9月9日"), str
      g.format g.parse("2286年11月21日"), str
      g.format g.parse("5138年11月16日"), str
    ].join("\n")
    .toEqual [
      "紀元前1年04月01日(土)0時0分0秒"
      "西暦1970年04月27日(月)0時0分0秒"
      "西暦1973年03月03日(土)0時0分0秒"
      "西暦2001年09月09日(日)0時0分0秒"
      "西暦2286年11月21日(日)0時0分0秒"
      "西暦5138年11月16日(水)0時0分0秒"
    ].join("\n")
    return
  test '太陽の動き', =>
    dst = []
    for msec in earth_msecs
      dst.push to_graph g, msec
    expect dst
    .toMatchSnapshot()
    return

  test '二十四節季と月相', =>
    dst = []
    for msec in earth_msecs
      dst.push "#{
        format msec, "yyyy-MM-dd", { locale }
      } #{
        format msec, "Y-ww-EEE", { locale }
      } #{
        g.format msec, "Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J"
      }"
    expect dst
    .toMatchSnapshot()
    return
  return

describe "火星", =>
  test 'calc', =>
    expect mg.calc
    .toMatchSnapshot()
    return

  test 'precision', =>
    expect mg.precision()
    .toEqual
      leap: [1,-7,73,-1554]
      year: [[20],[33,34]]
      day: [[24],[60],[60]]
      strategy: "SolarTable"
      is_legal_solor: true
      is_legal_eto: true
      is_legal_ETO: true
    expect mg.table.month
    .toMatchSnapshot()

  test '太陽の動き', =>
    dst = []
    for msec in mars_msecs
      dst.push to_graph mg, msec
    expect dst
    .toMatchSnapshot()
    return

  test '二十四節季と月相', =>
    dst = []
    for msec in mars_msecs
      dst.push "#{
        format msec, "yyyy-MM-dd HH:mm", { locale }
      }\t#{
        g.format msec, "a-Z-E"
      } #{
        mg.format msec, "a-Z-E\tGyy/MMM/dd HH:mm:ss"
      }"
    expect dst
    .toMatchSnapshot()
    return
  return

describe "木星", =>
  test 'calc', =>
    expect jg.calc
    .toMatchSnapshot()
    return

  test 'precision', =>
    expect jg.precision()
    .toEqual
      leap: [1]
      year: [[260],[40,41]]
      day: [[10],[60],[60]]
      strategy: "SolarLunar"
      is_legal_solor: false
      is_legal_eto: true
      is_legal_ETO: true
    expect jg.table.month
    .toMatchSnapshot()

  test 'format', =>
    str = "Gy年MM月dd日(E)HH時 abc"
    expect [
      jg.format   10000000000000, str
      jg.format    1556636400000, str
      jg.format      10000000000, str
      jg.format                0, str 
      jg.format     -10000000000, str
      jg.format   -1000000000000, str
      jg.format  -10000000000000, str
    ].join("\n")
    .toEqual [
      "西暦194年180月07日(木)04時 乙丑丑乙"
      "西暦172年35月23日(月)08時 癸卯卯癸"
      "西暦168年01月39日(木)00時 己亥亥己"
      "西暦167年255月01日(水)04時 戊戌戌戊"
      "西暦167年248月03日(金)08時 戊戌戌戊"
      "西暦165年80月20日(月)07時 丙申申丙"
      "西暦141年68月35日(木)04時 壬申申壬"
    ].join("\n")
    return

  test '太陽の動き', =>
    dst = []
    for msec in jupiter_msecs
      dst.push to_graph jg, msec, "Gyy-MMM-dd HH:mm a-ZZZ-E"
    expect dst
    .toMatchSnapshot()
    return

  test '二十四節季と月相', =>
    dst = []
    for msec in jupiter_msecs
      dst.push "#{
        format msec, "yyyy-MM-dd HH:mm", { locale }
      }\t#{
        g.format msec, "a-Z-E"
      } #{
        jg.format msec, "a-ZZZ-E\tGyy/MMM/dd HH:mm:ss"
      }"
    expect dst
    .toMatchSnapshot()
    return
  return


describe "フランス革命歴", =>
  test 'calc', =>
    expect fg.calc
    .toMatchSnapshot()

  test 'precision', =>
    expect fg.precision()
    .toEqual
      leap: [4, -128, 456, -3217]
      year: [[13],[28,29]]
      day: [[10],[100],[100]]
      strategy: "SolarTable"
      is_legal_solor: false
      is_legal_eto: true
      is_legal_ETO: true
    expect fg.table.range.month
    .toMatchSnapshot()

  test '太陽の動き', =>
    dst = []
    for msec in earth_msecs
      dst.push to_graph fg, msec
    expect dst
    .toMatchSnapshot()
    return

  test '二十四節季と月相', =>
    dst = []
    for msec in earth_msecs
      dst.push "#{
        format msec, "yyyy-MM-dd", { locale }
      } #{
        format msec, "Y-ww-EEE", { locale }
      } #{
        fg.format msec, "Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J"
      }"
    expect dst
    .toMatchSnapshot()
    return
  return

describe "ロムルス歴", =>
  test 'calc', =>
    expect rg.calc
    .toMatchSnapshot()

  test 'precision', =>
    expect rg.precision()
    .toEqual
      leap: [4]
      year: [[11],[33,34]]
      day: [[24],[60],[60]]
      strategy: "SeasonTable"
      is_legal_solor: true
      is_legal_eto: true
      is_legal_ETO: true
    expect rg.table.range.month
    .toMatchSnapshot()

  test '太陽の動き', =>
    dst = []
    for msec in earth_msecs
      dst.push to_graph rg, msec
    expect dst
    .toMatchSnapshot()
    return

  test '二十四節季と月相', =>
    dst = []
    for msec in earth_msecs
      dst.push "#{
        format msec, "yyyy-MM-dd", { locale }
      } #{
        format msec, "Y-ww-EEE", { locale }
      } #{
        rg.format msec, "Y-ww-E a-A Z\tGyyyy/MM/dd HH:mm:ss J"
      }"
    expect dst
    .toMatchSnapshot()
    return
  return