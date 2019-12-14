{ FancyDate, to_msec, to_tempo_bare } = require "../lib/index.min"
{ Gregorian, MarsGregorian, 平気法 } = FancyDate

format = require "date-fns/format"
locale = require "date-fns/locale/ja"
_ = require 'lodash'


g = FancyDate.Gregorian
mg = FancyDate.MarsGregorian
jg = FancyDate.JupiterGregorian

to_graph = (c, msec)->
  { PI } = Math
  deg_to_rad  = 2 * PI / 360
  { 方向,時角, 真夜中,日の出,南中時刻,日の入 } = c.solor msec
  "#{
    c.format msec, "Gyyyy-MM-dd HH:mm a-Z-E"
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
  for i in [0.. to_msec("20y") / c.calc.msec.moon]
    msec = moon_zero + i * c.calc.msec.moon
    { last_at, next_at } = c.to_tempos(msec).d
    list.push last_at - 1
    list.push last_at
    list.push next_at - 1
    list.push next_at
  for i in [0.. to_msec("20y") / c.calc.msec.season]
    msec = season_zero + i * c.calc.msec.season
    { last_at, next_at } = c.to_tempos(msec).d
    list.push last_at - 1
    list.push last_at
    list.push next_at - 1
    list.push next_at
  _.sortedUniq list.sort()

earth_msecs = deploy( g,
  moon_zero   = to_tempo_bare(  g.calc.msec.moon,    g.calc.zero.moon,   new Date("2013-1-1") - 0 ).last_at
  season_zero = to_tempo_bare(  g.calc.msec.season,  g.calc.zero.season, new Date("2013-1-1") - 0 ).last_at
)

mars_msecs = deploy( mg,
  moon_zero   = to_tempo_bare( mg.calc.msec.moon,   mg.calc.zero.moon,   new Date("2013-1-1") - 0 ).last_at
  season_zero = to_tempo_bare( mg.calc.msec.season, mg.calc.zero.season, new Date("2013-1-1") - 0 ).last_at
)

jupiter_msecs = deploy( jg,
  moon_zero   = to_tempo_bare( jg.calc.msec.moon,   jg.calc.zero.moon,   new Date("2013-1-1") - 0 ).last_at
  season_zero = to_tempo_bare( jg.calc.msec.season, jg.calc.zero.season, new Date("2013-1-1") - 0 ).last_at
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
      day: [[12],[2],[3600]]
      is_legal_solor: true
    expect mg.table.month
    .toMatchSnapshot()

  test '雑節', =>
    expect [
      平気法.to_tempos 100000000000000
      平気法.to_tempos 10000000000000
      平気法.to_tempos 1556636400000
      平気法.to_tempos 1000000000000
      平気法.to_tempos 100000000000
      平気法.to_tempos 10000000000
      平気法.to_tempos 0 
    ].map (o)=>
      list =
        for key, val of o.雑節
          if val
            if val.length
              val.map (d)=>
                平気法.format d.center_at, "Gyy年Mdd日 E Z #{key}"
            else
              平気法.format val.center_at, "Gyy年Md日 E Z #{key}"
          else
            "#{val} #{key}"
      _.flattenDepth(list, 2).sort()
    .toMatchSnapshot()
    return

  test '二十四節季と月相', =>
    dst = []
    for msec in earth_msecs
      dst.push "#{
        g.format msec, "yyyy-a-Z-E-A HH:mm"
      } #{
        平気法.format msec, "a-Z-E-A-F Gy年Mdd日 Hm ssss秒"
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
      day: [[24],[60],[60]]
      is_legal_solor: true
    expect mg.table.month
    .toMatchSnapshot()

  test '雑節', =>
    expect [
      g.to_tempos 100000000000000
      g.to_tempos 10000000000000
      g.to_tempos 1556636400000
      g.to_tempos 1000000000000
      g.to_tempos 100000000000
      g.to_tempos 10000000000
      g.to_tempos 0 
      g.to_tempos g.calc.zero.period
    ].map (o)=>
      list =
        for key, val of o.雑節
          if val.length
            val.map (d)=>
              g.format d.center_at, "yyyy/MM/dd E Z #{key}"
          else
            g.format val.center_at, "yyyy/MM/dd E Z #{key}"
      _.flattenDepth(list, 2).sort()
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
      g.format g.parse("1970年4月27日"), str
      g.format g.parse("1973年3月3日"), str
      g.format g.parse("2001年9月9日"), str
      g.format g.parse("2286年11月21日"), str
      g.format g.parse("5138年11月16日"), str
    ].join("\n")
    .toEqual [
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
        g.format msec, "Y-ww-E aZ\tGyyyy/MM/dd HH:mm:ss J"
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
      day: [[24],[60],[61.625024305555556]]
      is_legal_solor: true
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
        mg.format msec, "a-Z-E\tGyyyy/MM/dd HH:mm:ss"
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
      leap: [1, -5, 105,-2044]
      day: [[24],[60],[24.84]]
      is_legal_solor: true
    expect jg.table.month
    .toMatchSnapshot()

  test '太陽の動き', =>
    dst = []
    for msec in jupiter_msecs
      dst.push to_graph jg, msec
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
        jg.format msec, "a-Z-E\tGyyyy/MM/dd HH:mm:ss"
      }"
    expect dst
    .toMatchSnapshot()
    return
  return
