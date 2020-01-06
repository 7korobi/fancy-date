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

describe "moon phase", =>
  test "2019/12/26", =>
    expect g.format 1577310360000, "N No Nr"
    .toEqual "0 朔 さく"
    return
  
  test "2020/01/06", =>
    expect g.format 1578300000000, "N No Nr"
    .toEqual "11 上弦 じょうげん"
    return
  return

describe "Gregorio calculate", =>
  test "succ 10/10/10", =>
    msec = g.parse "2年2月2日"
    expect g.format g.succ msec, "10年10月10日"
    .toEqual "西暦12年12月12日(水)0時0分0秒"
    return

  test "succ 11/11/11", =>
    msec = g.parse "2年2月2日"
    expect g.format g.succ msec, "11年11月11日"
    .toEqual "西暦14年1月13日(月)0時0分0秒"
    return

  test "back 1/1/1", =>
    msec = g.parse "2年2月2日"
    expect g.format g.back msec, "1年1月1日"
    .toEqual "西暦1年1月1日(月)0時0分0秒"
    return

  test "back 5/5/5", =>
    msec = g.parse "2年2月2日"
    expect g.format g.back msec, "5年5月5日"
    .toEqual "紀元前5年8月28日(水)0時0分0秒"
    return

  test "back 10/10/10", =>
    msec = g.parse "401年1月1日"
    expect g.format g.back msec, "10年"
    .toEqual "西暦391年1月1日(火)0時0分0秒"
    return
  return

describe "平気法 calculate", =>
  test "閏月をまたぐback", =>
    tgt = "明治9年文月1日 暁九ツ"
    ret = 平気法.parse tgt

    expect [
      平気法.format ret
      平気法.format 平気法.parse("明治9年閏文月1日")
      平気法.format 平気法.back(ret, "1ヶ月")
      平気法.format 平気法.back(ret, "2ヶ月")
    ]
    .toEqual [
      "明治9年文月1日(先勝)暁九ツ"
      "明治9年閏文月1日(先勝)暁九ツ"
      "明治9年水無月1日(赤口)暁九ツ"
      "明治9年皐月1日(大安)暁九ツ"
    ]
    return

  test "閏月をまたぐback 2", =>
    tgt = "明治9年文月1日 暁九ツ"
    ret = 平気法.parse tgt

    expect [
      平気法.back(ret, "2ヶ月")
      平気法.back(ret, "1ヶ月")
      平気法.back(ret, "1N") # 閏月
      ret
      平気法.succ(ret, "1ヶ月")
    ]
    .toEqual [
      -2946448800000 - 3 * 2592000000 + 1 * 86400000
      -2946448800000 - 2 * 2592000000 + 1 * 86400000
      -2946448800000 - 1 * 2551442889
      -2946448800000
      -2946448800000 + 1 * 2592000000
    ]
    return

  test "base", =>
    tgt = "明治9年神無月10日(先勝)暁九ツ"
    ret = 平気法.parse tgt

    expect 平気法.format ret
    .toEqual tgt
    return

  test "1月,1年", =>
    tgt  = "明治10年長月10日 暁九ツ"
    goal = 平気法.parse tgt

    msec = 平気法.parse "明治10年神無月10日"
    expect [
      平気法.format 平気法.back(msec, "1年")
      平気法.format 平気法.back(msec, "1月")
      平気法.format 平気法.succ(msec, "1月")
      平気法.format 平気法.succ(msec, "1年")
    ]
    .toEqual [
      "明治9年神無月10日(先勝)暁九ツ"
      "明治10年長月10日(赤口)暁九ツ"
      "明治10年霜月10日(友引)暁九ツ"
      "明治11年神無月10日(先勝)暁九ツ"
    ]
    return

  test "back 昭和 ⇒ 明治", =>
    tgt  = "明治10年神無月10日(先勝)暁九ツ"
    goal = 平気法.parse tgt

    msec = 平気法.parse "昭和10年神無月10日"
    ret  = 平気法.back msec, "2G"
    expect [(ret - goal)/86400000, (ret - goal), 平気法.format ret]
    .toEqual [0,0, tgt]
    return

  test "succ 昭和 ⇒ 令和", =>
    tgt  = "令和10年神無月10日(先勝)暁九ツ"
    goal = 平気法.parse tgt

    msec = 平気法.parse "昭和10年神無月10日"
    ret  = 平気法.succ msec, "2G"
    expect [(ret - goal)/86400000, (ret - goal), 平気法.format ret]
    .toEqual [0,0, tgt]
    return
  return


describe "Dr.Stone", =>
  test 'T = 0', =>
    msec = g.parse("5738年4月1日")
    { 日の出 } = g.solor msec, 6
    note = g.note msec
    expect g.format 日の出, "yyyy/MM/dd(E) HH:mm Z #{ note }"
    .toEqual("5738/04/01(火) 04:20 春分 春")
    expect( msec ).toEqual 118914361200000
    expect( 日の出 ).toEqual 118914376828906
    return
  return

describe "同時性", =>
  test '春分', =>
    msec = g.parse("1年3月22日")
    expect calendars.map ([c, str])=>
      c.format msec, str
    .toMatchSnapshot()
    return
  return

describe "平気法", =>
  test 'calc', =>
    expect 平気法.calc
    .toMatchSnapshot()
    return

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
    return

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
          "#{ 平気法.format val.last_at, "J Gyy年Modd日" } ～ #{ 平気法.format val.next_at - 1, "Modd日 #{ key }" }"
      [..._.flattenDepth(list, 2).sort(), 平気法.note(utc, o, z).join("") ]
    .toMatchSnapshot()
    return

  test '二十四節季と月相', =>
    dst = []
    for msec in earth_msecs
      dst.push "#{
        g.format msec, "yyyy a-A Z-E HH:mm"
      } #{
        平気法.format msec, "a-A f-F Z-E Gy年Modd日 Hm ssss秒"
      }"
    expect dst
    .toMatchSnapshot()
    return
  return

describe "Gregorian", =>
  test 'calc', =>
    expect g.calc
    .toMatchSnapshot()
    return

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
    return

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
    return

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
    return

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
      "西暦194年180月07日(木)05時 乙丑丑乙"
      "西暦172年35月23日(月)09時 癸卯卯癸"
      "西暦168年01月39日(木)00時 己亥亥己"
      "西暦167年255月01日(水)05時 戊戌戌戊"
      "西暦167年248月03日(金)09時 戊戌戌戊"
      "西暦165年80月20日(月)08時 丙申申丙"
      "西暦141年68月35日(木)05時 壬申申壬"
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
    return

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
    return

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
    return

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
    return

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