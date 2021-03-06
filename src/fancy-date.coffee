_ = require "lodash"
{
  Tempo
  to_tempo_by
  to_tempo_bare
} = require "./time"
{ jpn, old_jpn } = require "./number"


単位系 =
  元: 'G'
  年: 'y'
  月: 'M'
  季: 'Z'
  節: 'Z'
  週: 'w'
  日: 'd'
  時: 'H'
  分: 'm'
  秒: 's'

core_tokens = "GHMSdmpsy"
main_tokens = "ABCEFabcfx" + core_tokens
sub_tokens = "DJNQVYZuw"
all_tokens = main_tokens + sub_tokens

diff_token = /(\d+)(?:([ABCDEFGHJMNQSVYZabcdfmpsuwxy])|[ヶ]?([元年月季節週日時分秒])[間]?([半]?))/g
reg_token = /([ABCEFHMNQVZabcdfms][or]|([ABCDEFGHJMNQSVYZabcdfmpsuwxy])\2*)|''|'(''|[^'])+('|$)|./g

calc_set = (path, o)->
  for key, val of o
    @calc[path][key] = val?[path] || val

sub_define = (msec, size)->
  range = [size]
  msec = msec / size
  { range, msec }

daily_define = (msec, day)->
  range = [msec // day]
  msec = range[0] * day
  { range, msec }

daily_measure = (msec, day)->
  range = [msec // day, Math.ceil(msec / day)]
  msec = msec
  { range, msec }

to_indexs = (zero)->
  A = B = C = D = E = F = G = H = J = M = N = Q = S = V = Y = Z = a = b = c = d = f = m = p = s = u = w = x = y = zero
  { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }

shift_up = (a, b, size)->
  if 0 <= b <= size
    return arguments
  a += b // size
  b %%= size
  [a,b]


class Indexer
  constructor: ([list, rubys, ... , zero ])->
    if list?
      if list.length
        @list = list
        @length = list.length
      else
        @length = list

      if rubys?.length == list.length
        @rubys = rubys

    if zero?
      unless zero.length
        @zero = zero

export class FancyDate
  yeary_table:   (utc)-> @to_table utc, 'y', 'M', true
  monthry_table: (utc)-> @to_table utc, 'M', 'd', true
  weekly_table:  (utc)-> @to_table utc, 'w', 'd', true
  time_table:    (utc)-> @to_table utc, 'd', 'H'

  succ_index: ( diff )-> @get_diff diff, (n)=> n - 0
  back_index: ( diff )-> @get_diff diff, (n)=> 0 - n

  succ_msec: ( utc, diff )-> @succ(utc, diff) - utc
  back_msec: ( utc, diff )-> @back(utc, diff) - utc

  succ: ( utc, diff )-> @slide utc, @succ_index diff
  back: ( utc, diff )-> @slide utc, @back_index diff
  slide: ( utc, diff )-> @slide_by @to_tempos(utc), diff

  parse: ( tgt, str )-> @parse_by @index tgt, str
  format: ( utc, str )-> @format_by @to_tempos(utc), str

  dup: -> new @constructor @

  constructor: (o)->
    if o
      { @dic, @calc } = _.cloneDeep o
    else
      @dic =
        parse: "y年M月d日"
        format: "Gy年M月d日(E)H時m分s秒"

      @calc =
        eras: []
        idx:  {}
        zero: {}
        msec: {}
        range: {}
      do =>
        for key in all_tokens
          @dic[key] = new Indexer []

  lang: ( parse, format )->
    Object.assign @dic, { parse, format }
    @

  spot: ( moon_data, ...geo )->
    [earth_data, moony] = moon_data
    [sun_data, sunny, earthy] = earth_data
    Object.assign @dic, { sunny, moony, earthy, geo }
    @

  era: ( era, past, eras = [] )->
    all_eras = [past, ...eras.map(([s,])=> s)]
    @dic.G = new Indexer [all_eras]
    Object.assign @dic, { era, eras }
    @

  calendar: (start = ["1970-1-1 0:0:0","y-M-d H:m:s", 0], leaps = null, month_divs = null )->
    Object.assign @dic, { month_divs, leaps, start }
    @

  algo: (o)->
    for key, val of o
      @dic[key] = new Indexer val

    # A B C a b c 日の不断、年の不断を構築
    if o.C?[0]?.length && o.B?[0]?.length
      @dic.c = new Indexer o.C
      @dic.b = new Indexer o.B
      @dic.C.zero = @dic.B.zero = @dic.A.zero
      @dic.c.zero = @dic.b.zero = @dic.a.zero

    if @dic.C.list && @dic.B.list
      @dic.A.list = @dic.a.list =
        for idx in [0...@dic.A.length]
          c = @dic.C.list[idx % @dic.C.length]
          b = @dic.B.list[idx % @dic.B.length]
          "#{c}#{b}"

    if @dic.C.rubys && @dic.B.rubys
      @dic.A.rubys = @dic.a.rubys =
        for idx in [0...@dic.a.length]
          c = @dic.C.rubys[idx % @dic.C.length]
          b = @dic.B.rubys[idx % @dic.B.length]
          "#{"#{c.replace /と$/,"との" }#{b}"}"
    @

  daily: (is_solor = false)->
    @dic.is_solor = is_solor
    @

  init: ->
    { sunny, moony, earthy, leaps, month_divs } = @dic
    year = daily_measure sunny[0], earthy[0]
    day = daily_define earthy[0], earthy[0]
    if moony
      moon = daily_measure moony[0], earthy[0]
    calc_set.call @, "range", { year }
    calc_set.call @, "msec",  { year, moon, day }
    @is_table_leap = leaps?
    @is_table_month = @is_table_leap || month_divs?
    @strategy =
      if leaps?
        "SolarTable"
      else
        if month_divs?
          "SeasonTable"
        else
          "SolarLunar"

    @def_regex()
    @def_to_idx()
    @def_to_label()
    @def_calc()

    @def_table()
    @def_idx()
    @def_zero()

    @def_eras()
    @

  def_regex: ->
    strategy = (list)=>
      if list
        if list.join
          "(#{ list.join("|") })"
        else
          "([#{list}])"
      else
        "(\\d+)"

    A = B = C = E = F = G = H = N = V = Z = a = b = c = f = m = p = s = strategy
    M = => "(閏?\\d+)"
    u = => "([-\\d]+)"
    D = Q = S = Y = d = w = y = => "(\\d+)"
    J = x = => "([\\d.]+)"
    for key, f of { A,B,C,D,E,F,G,H,J,M,N,Q,S,V,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
      @dic[key].regex = f @dic[key].list

    H = N = Q = V = d = m = s = strategy
    M = (list)=>
      if list
        if list.join
          "(閏?(?:#{ list.join("|") }))"
        else
          "(閏?[#{list}])"
      else
        "(閏?\\d+)"

    for key, f of { H,M,N,Q,V,Z,d,m,s }
      @dic[key].regex_o = f @dic[key].list

  def_to_idx: ->
    G = (s)-> if ! @list || (idx = @list.indexOf(s)) < 0 then s - 0 else idx
    H = N = m = s = (s)-> if ! @list || (idx = @list.indexOf(s)) < 0 then s - 0 else idx
    A = B = C = E = F = M = V = Z = a = b = c = d = f = (s)-> if ! @list || (idx = @list.indexOf(s)) < 0 then s - 1 else idx
    D = Q = p = w = (s)-> s - 1
    J = S = Y = u = x = y = (s)-> s - 0
    for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,V,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
      @dic[key].to_idx = val

  def_to_label: ->
    integer = (idx)-> (__, val, size)->
      _.padStart val.now_idx + idx , size, '0'

    float = (__, val, size)->
      num = parseInt val.now_idx
      sub = "#{val.now_idx % 1}"[1...]
      _.padStart(num, size, '0') + sub

    at = (cb)-> (list, val, size)->
      if list
        if val.now_idx?
          s = list[val.now_idx]
          if s?
            return s
      cb list, val, size

    month = (cb)-> (list, val, size)->
      "#{ if val.is_leap then "閏" else "" }#{ cb list, val, size }"

    G = (__, val)-> val.label
    M = month integer 1
    H = N = m = s = S = Y = u = y = integer 0
    D = Q = d = p = w = integer 1
    J = x = float
    A = B = C = E = F = V = Z = a = b = c = f = at integer 1
    for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,V,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
      @dic[key].to_value = val

    M = month at integer 1
    H = N = m = s = at integer 0
    A = B = C = E = F = Q = V = Z = a = b = c = d = f = at integer 1
    for key, val of { A,B,C,E,F,H,M,N,Q,V,Z, a,b,c,d,f,m,s }
      @dic[key].to_label = val

    cut = -> ""
    M = month at cut
    A = B = C = E = F = H = N = Q = V = Z = a = b = c = d = f = m = s = at cut
    for key, val of { A,B,C,E,F,H,M,N,Q,V,Z, a,b,c,d,f,m,s }
      @dic[key].to_ruby = val

  def_calc: ->
    season = sub_define    @calc.msec.year, @dic.Z.length
    month  = daily_measure @calc.msec.year / @dic.M.length, @calc.msec.day
    week   = daily_define  @dic.E.length * @calc.msec.day, @calc.msec.day

    hour   = sub_define    @calc.msec.day, @dic.H.length
    minute = sub_define      hour.msec, @dic.m.length
    second = sub_define    minute.msec, @dic.s.length
    msec   = sub_define    second.msec, second.msec
    calc_set.call @, "range", { season, month, week, hour, minute, second, msec }
    calc_set.call @, "msec",  { season, month, week, hour, minute, second, msec }

  def_eras: ->
    zero = @calc.zero.era
    list =
      for [ title, msec ], idx in @dic.eras
        { u } = @to_tempos msec
        @calc.eras.push [ title, msec, u.now_idx ]
        msec - zero
    list.push Infinity
    @table.msec.era = list

  def_year_table: ->
    { range, msec } = @table
    upto = (src)->
      x = 0
      for i in src
        x += i * day

    day = @calc.msec.day

    [...leaps, period] = @dic.leaps
    if period
      range.year =
        for idx in [0...period]
          is_leap = 0
          for div, mode in leaps
            continue if idx % div
            is_leap = ! mode % 2
          @calc.range.year[is_leap]
      range.year[0] = @calc.range.year[1]
    else
      range.year = [@calc.range.year[0]]

    msec.year = upto range.year
    period = msec.year[msec.year.length - 1]
    period = daily_define period, day
    calc_set.call @, "msec", { period }

  def_month_table: ->
    { range, msec } = @table
    upto = (src)->
      x = 0
      for i in src
        x += i * day

    day = @calc.msec.day

    years = @calc.range.year
    { month_divs } = @dic

    # auto month table.
    unless month_divs
      month_divs =
        for str, idx in @dic.M
          @calc.range.month[1 - idx % 2]
      month_divs[1] = null

    month_sum = 0
    for i in month_divs
      month_sum += i

    range.month = {}
    for size in years
      a = Array.from month_divs
      idx = month_divs.indexOf null
      a[idx] = size - month_sum
      range.month[size] = a

    msec.month = {}
    for size in years
      year_size = Math.floor day * size
      msec.month[year_size] = upto range.month[size]

  def_table: ->
    @table =
      range: {}
      msec: {}

    if @is_table_month
      @def_month_table()

    if @is_table_leap
      @def_year_table()

  def_idx: ->
    if @is_table_leap
      [..., period] = @dic.leaps
      @dic.p.length = period || 1

    o = @index ...@dic.start[0..1]
    o.Z = @dic.Z.length * 1 / 8
    year = (period || 0) * o.p + o.y
    year_s = year - o.f
    year10 = year - o.c
    year12 = year - o.b
    year60 = year - o.a
    Object.assign @calc.zero, { year10, year12, year60, year_s }
    Object.assign @calc.idx, o


  def_zero: ->
    zero_size = (idx_path, path)=>
      0 - @calc.idx[idx_path] * @calc.msec[path]

    timezone = @calc.msec.day * (if @dic.geo[2]? then @dic.geo[2] else @dic.geo[1]) / 360
    @dic.x.tempo = x = to_tempo_bare @calc.msec.hour, -0.5 * @calc.msec.hour, timezone
    x.now_idx = timezone

    start_at = @dic.start[2]
    zero   = start_at - x.center_at

    second = zero   + zero_size "s", "second"
    minute = second + zero_size "m", "minute"
    hour   = minute + zero_size "H", "hour"
    day    = hour   + zero_size "d", "day"

    if @is_table_leap
      year_size = Math.floor @calc.msec.day * @table.range.year[ @calc.idx.y ]
      month  = day   - (@table.msec.month[year_size][ @calc.idx.M - 1 ] || 0)
      year   = month - (@table.msec.year[             @calc.idx.y - 1 ] || 0)
      period = year  + zero_size "p", "period"

    else
      if @is_table_month
        month = day   - (Object.values(@table.msec.month)[0][ @calc.idx.M - 1 ] || 0)
      else
        month = day   + zero_size "M", "moon"

      year  = month + zero_size "y", "year"

    # 単純のため平気法。
    啓蟄 = @dic.sunny[1] - (1 / 6 - 1 / 8) * @dic.Z.length * @calc.msec.season
    { last_at } = to_tempo_bare @calc.msec.year, 啓蟄, period || year
    spring = last_at

    立春 = @dic.sunny[1] + zero_size "Z", "season"
    { last_at } = to_tempo_bare @calc.msec.year, 立春, period || year
    season = last_at

    # 元号
    era = @dic.eras[0]?[1] || Infinity
    @calc.eras = []
    era_tgt =
      if @is_table_leap
        period + @table.msec.year[0]
      else
        season + @calc.msec.year

    if era_tgt < era
      era = era_tgt
      @calc.eras = [[@dic.era, era, 1]]

    if @dic.moony
      moon = @dic.moony[1]

    # JD
    day_utc = day + x.center_at
    cjd = to_tempo_bare(@calc.msec.day, day,     -210866803200000).center_at
    jd  = to_tempo_bare(@calc.msec.day, day_utc, -210866803200000).center_at # -2440587.5 * 86400000
    ld  = to_tempo_bare(@calc.msec.day, day_utc,  -12219379200000).last_at   #  -141428   * 86400000
    mjd = to_tempo_bare(@calc.msec.day, day_utc,   -3506716800000).last_at   #   -40587   * 86400000

    # 干支、九星、週
    week  = day + zero_size("E", "day")
    day_9 = day + zero_size("F", "day")
    day10 = day + zero_size("C", "day")
    day12 = day + zero_size("B", "day")
    day60 = day + zero_size("A", "day")
    day28 = day + zero_size("V", "day")
    Object.assign @calc.zero, { period, era, week, season, spring, moon, day, jd,ld,mjd,cjd, day_9, day10, day12, day28, day60 }

  precision: ->
    is_just = (x, n)-> n == n // x * x
    gaps = [( @calc.msec.year / @calc.msec.day ) - @calc.range.year[0]]
    if @dic.leaps
      for v, idx in @dic.leaps
        gap = gaps[gaps.length - 1]
        if idx & 1
          gap += 1 / v
        else
          gap -= 1 / v
        gaps.push gap
    strategy: @strategy
    year: [[@dic.M.length], @calc.range.month ]
    day: [ @calc.range.hour, @calc.range.minute, @calc.range.second ]
    leap: gaps.map (i)=> parseInt 1 / i
    is_legal_solor: is_just( 4, @dic.H.length )
    is_legal_eto: is_just( @dic.c.length, @dic.a.length ) && is_just( @dic.b.length, @dic.a.length )
    is_legal_ETO: is_just( @dic.C.length, @dic.A.length ) && is_just( @dic.B.length, @dic.A.length )

###
http://bakamoto.sakura.ne.jp/buturi/2hinode.pdf
ベクトルで
a1 = e1 * cos(lat/360) + e3 * sin(lat/360)
a2 = e3 * cos(lat/360) - e1 * sin(lat/360)
T = (赤緯, 時角)->
  a1 * sin(赤緯) + cos(赤緯) * (a2 * cos(時角) - e2 * sin(時角))
T = ( lat, 赤緯, 時角 )->
  e1 * ( cos(lat/360) * sin(赤緯) - sin(lat/360) * cos(赤緯) * cos(時角) ) +
  e2 * (-cos(赤緯) * sin(時角)) +
  e3 * ( sin(lat/360) * sin(赤緯) + cos(lat/360) * cos(赤緯) * cos(時角) )

K   = @dic.earthy[2] / 360
高度 = -50/60
時角 = ( lat, 高度, 赤緯 )->
  acos(( sin(高度) - sin(lat/360) * sin(赤緯) ) / cos(lat/360) * cos(赤緯) )
方向 = ( lat, 高度, 赤緯, 時角 )->
  acos(( cos(lat/360) * sin(赤緯) - sin(lat/360) * cos(赤緯) * cos(時角) ) / cos(高度) )
季節 = 春分点からの移動角度
赤緯 = asin( sin(K) * sin(季節) )
赤経 = atan( tan(季節) * cos(K) )
南中時刻 = ->
  正午 + 時角 + ( 赤経 - 季節 ) + 平均値 + timezone
日の出 = ->
  南中時刻 - 時角
日の入 = ->
  南中時刻 + 時角
###

  noon: ( utc, { last_at, center_at } = to_tempo_bare @calc.msec.day, @calc.zero.day, utc )->
    { sin, PI } = Math
    deg_to_day  = @calc.msec.day / 360
    year_to_rad = 2 * PI / @calc.msec.year

    T0  = to_tempo_bare @calc.msec.year, @calc.zero.season, utc

    # 南中差分の計算がテキトウになってしまった。あとで検討。
    南中差分A = deg_to_day * 2.0 * sin( year_to_rad * T0.since )
    南中差分B = deg_to_day * 2.5 * sin( year_to_rad * T0.since * 2 + PI * 0.4 )
    南中差分 = 南中差分A + 南中差分B

    南中時刻 = center_at + 南中差分
    真夜中 = last_at + 南中差分

    T1 = to_tempo_bare @calc.msec.year, @dic.sunny[1], 南中時刻
    季節 = T1.since * year_to_rad

    { T0, T1, 季節, 南中差分, 南中時刻, 真夜中 }

  solor: ( utc, idx = 2, { 季節, 南中時刻, 真夜中 } = @noon utc )->
    days = [
        6      # golden hour end         / golden hour
      -18 / 60 # sunrise bottom edge end / sunset bottom edge start
      -50 / 60 # sunrise top edge start  / sunset top edge end
       -6      # dawn                    / dusk
       -7.36   # 寛政暦 太陽の伏角が7°21′40″
      -12      # nautical dawn           / nautical dusk
      -18      # night end               / night
    ]
    { asin, acos, atan, sin, cos, tan, PI } = Math
    deg_to_rad  = 2 * PI / 360
    rad_to_day  = @calc.msec.day / ( 2 * PI )

    高度 = days[idx]      * deg_to_rad
    K   = @dic.earthy[2] * deg_to_rad
    lat = @dic.geo[0]    * deg_to_rad

    赤緯 = asin( sin(K) * sin(季節) )
    赤経 = atan( tan(季節) * cos(K) )
    時角 = acos(( sin(高度) - sin(lat) * sin(赤緯) ) / (cos(lat) * cos(赤緯)) )
    方向 = acos(( cos(lat) * sin(赤緯) - sin(lat) * cos(赤緯) * cos(時角) ) / cos(高度) )

    日の出 = Math.floor 南中時刻 - 時角 * rad_to_day
    日の入 = Math.floor 南中時刻 + 時角 * rad_to_day

    { K,lat
      時角,方向, 高度
      真夜中, 日の出, 南中時刻, 日の入
    }

  節句: (utc, { M, d, B, E } = @to_tempos(utc))->
    # M,d,B,E
    カトリック:
      万聖節: [11, 1]
      万霊節: [11, 2]
    節句:
      人日: [ 1, 7]
      初午: [ 2,  ,7]
      上巳: [ 3, 3]
      端午: [ 5, 5]
      七夕: [ 7, 7]
      重陽: [ 9, 9]
    仏教:
      灌仏会: [ 4, 8]
      盂蘭盆会: [ 7,15]
    風習:
      小正月: [ 1,15]
      十五夜: [ 8,15]
      十三夜: [ 9,13]
      七五三: [11,15]
      正月事始め: [12,13]


  雑節: (utc, { Zz, u, d } = @to_tempos(utc))->
    d0 = d.reset Zz.zero
    [                   立春, 入梅,
      春分, 半夏生, 夏土用, 立夏,
      夏至,       秋土用, 立秋,
      秋分,       冬土用, 立冬,
      冬至,       春土用, 立春2
    ] = [                  1/8, 80/360,
      2/8, 100/360, 13/40, 3/8,
      4/8,          23/40, 5/8,
      6/8,          33/40, 7/8,
      8/8,          43/40, 9/8
    ].map (n)=>
      now = Zz.last_at + ( n - 1/8 ) * Zz.size
      to_tempo_bare d.size, d0.last_at, now
      
    [ 八十八夜, 二百十日, 二百二十日 ] = [88, 210, 220].map (n)=> 立春.succ(n - 1)

    [春彼岸, 秋彼岸] = [春分, 秋分].map (dd)=>
      Tempo.join dd.back(3), dd.succ(3)
    [春社日, 秋社日] = [春分, 秋分].map (dd)=>
      C = to_tempo_bare @calc.msec.day, @calc.zero.day10, dd.write_at
      C.now_idx %%= @dic.C.length
      C.slide ( @dic.C.length / 2 ) - C.now_idx - 1
  
    春 = Tempo.join 立春,夏土用.back()
    夏節分 = 立夏.back()
    夏 = Tempo.join 立夏,秋土用.back()
    秋節分 = 立秋.back()
    秋 = Tempo.join 立秋,冬土用.back()
    冬節分 = 立冬.back()
    冬 = Tempo.join 立冬,春土用.back()
    春節分 = 立春2.back()
    節分 = 春節分

    夏土用 = Tempo.join 夏土用,夏節分
    秋土用 = Tempo.join 秋土用,秋節分
    冬土用 = Tempo.join 冬土用,冬節分
    春土用 = Tempo.join 春土用,立春2

    {
      立春, 立夏, 立秋, 立冬
      冬至, 春分, 夏至, 秋分
      入梅, 半夏生
      春, 夏, 秋, 冬
      春社日, 秋社日
      春土用, 夏土用, 秋土用, 冬土用
      春節分, 夏節分, 秋節分, 冬節分, 節分
      春彼岸, 秋彼岸
      八十八夜, 二百十日, 二百二十日
    }

  to_tempo_by_solor: (utc, day)->
    { 日の出, 南中時刻, 日の入 } = @solor utc, 4, @noon utc, day
    size = @dic.H.length / 4

    list = []
    next_at = 0
    msec = ( 日の出 - day.last_at ) / size
    for idx in [0        ... 1 * size]
      next_at += msec
      list.push Math.floor next_at

    next_at = 日の出 - day.last_at
    msec = ( 日の入 - 日の出 ) / ( 2 * size )
    for idx in [1 * size ... 3 * size]
      next_at += msec
      list.push Math.floor next_at

    next_at = day.size
    msec = ( day.next_at - 日の入 ) / size

    tails = []
    for idx in [3 * size ... 4 * size]
      tails.push Math.ceil next_at
      next_at -= msec
    list.push ...tails.reverse()
    to_tempo_by list, day.last_at, utc

  note: (utc, tempos = @to_tempos(utc), arg1 = @雑節(utc, tempos), arg2 = @節句(utc, tempos))->
    list = []
    for k, t of arg1 when t.is_cover tempos.d.center_at
      list.push k.match(/.(彼岸|社日|節分|土用)|(.+)/)[1...].join("")
    for root, arg3 of arg2
      for k, [M,d,B,E] of arg3
        continue if M && M != tempos.M.now_idx
        continue if d && d != tempos.d.now_idx 
        continue if B && B != tempos.B.now_idx
        continue if E && E != tempos.E.now_idx
        list.push k
    list

  to_tempos: (utc)->
    unless utc?
      throw new Error "invalid timestamp #{utc}"
    drill_down = (base, path, at = utc)=>
      data = @table.msec[path]
      table = data?[base.size] || data
      if table
        o = to_tempo_by table, base.last_at, at
      else
        b_size = @calc.msec[path]
        o = to_tempo_bare b_size, base.last_at, at
        o.length = base.size / o.size
      o.path = path
      o

    to_tempo = (path, write_at = utc)=>
      to_tempo_bare @calc.msec[path], @calc.zero[path], write_at

    J = to_tempo_bare @calc.msec.day, @calc.zero.jd, utc # ユリウス日

    # season in year_of_planet
    Zz = to_tempo_bare @calc.msec.year, @calc.zero.season, utc # 太陽年
    Z  = drill_down Zz, "season" # 太陽年の二十四節気

    # 今月と中気
    Nn =
      to_tempo_bare @calc.msec.moon, @calc.zero.moon, utc
      .floor @calc.msec.day,  @calc.zero.day
    N  = drill_down Nn, 'day'

    Zs = drill_down Zz, "season", Nn.last_at
    unless Nn.is_cover Zs.moderate_at
      Zs = drill_down Zz, "season", Nn.next_at
      unless Nn.is_cover Zs.moderate_at
        Nn.is_leap = true
    Nn.now_idx = ( Zs.now_idx %% @dic.Z.length ) >> 1

    if @is_table_leap
      p = to_tempo 'period'
      u = drill_down p, "year"
      u.now_idx += p.now_idx * @dic.p.length
      M = drill_down u, "month"
      d = drill_down M, "day"
    else
      if @is_table_month
        u =
          to_tempo_bare @calc.msec.year, @calc.zero.spring, utc
          .floor @calc.msec.day,  @calc.zero.day
        M = drill_down u, "month"
        d = drill_down M, "day"
      else
        u =
          to_tempo_bare @calc.msec.year, @calc.zero.season + @calc.msec.season, utc
          .floor @calc.msec.moon, @calc.zero.moon
          .floor @calc.msec.day,  @calc.zero.day
        M = Nn
        d = N

    # hour minute second  in day
    if @dic.is_solor
      H = @to_tempo_by_solor utc, d
      size = H.size / @dic.m.length
      m = to_tempo_bare size, H.last_at, utc
    else
      H = drill_down d, "hour"
      m = drill_down H, "minute"
    s = drill_down m, "second"
    S = drill_down s, "msec"

    G = {}
    if @table.msec.era?
      G = to_tempo_by @table.msec.era, @calc.zero.era, utc
      era = @calc.eras[G.now_idx]
      if era?[0]
        u.now_idx += 1 - era[2]
        G.label = era[0]

    y = u.copy()
    if y.now_idx < 1
      G.label = "紀元前"
      y.now_idx = 1 - y.now_idx
    x = @dic.x.tempo


    # 年初来番号
    w0 = to_tempo 'week', u.last_at
    w = drill_down w0, "week"
    D = drill_down u, "day"

    Y =
      now_idx: u.now_idx
    if u.next_at < w.next_at
      # 年末最終週は、翌年初週
      Y.now_idx += 1
      w.now_idx  = 0

  
    # 年不断
    a = now_idx: ( u.now_idx - @calc.zero.year60 ) %% @dic.a.length
    b = now_idx: ( u.now_idx - @calc.zero.year12 ) %% @dic.b.length
    c = now_idx: ( u.now_idx - @calc.zero.year10 ) %% @dic.c.length
    f = now_idx: ( u.now_idx - @calc.zero.year_s ) %% @dic.f.length

    # 月不断
    Q = now_idx: 4 * M.now_idx // @dic.M.length

    # 日不断
    A = to_tempo_bare @calc.msec.day, @calc.zero.day60, utc
    B = to_tempo_bare @calc.msec.day, @calc.zero.day12, utc
    C = to_tempo_bare @calc.msec.day, @calc.zero.day10, utc
    E = to_tempo_bare @calc.msec.day, @calc.zero.week,  utc
    F = to_tempo_bare @calc.msec.day, @calc.zero.day_9, utc
    V = to_tempo_bare @calc.msec.day, @calc.zero.day28, utc

    A.now_idx %%= @dic.A.length
    B.now_idx %%= @dic.B.length
    C.now_idx %%= @dic.C.length
    F.now_idx %%= @dic.F.length
    if @is_table_leap # 旧暦では、週は月初にリセットする。
      E.now_idx %%= @dic.E.length
      V.now_idx %%= @dic.V.length
    else
      E.now_idx = ( M.now_idx + d.now_idx ) %% @dic.E.length
      V.now_idx = ( [11,13,15,17,19,21,24,0,2,4,7,9][M.now_idx] + d.now_idx ) %% @dic.V.length

    { Zz, A,B,C,D,E,F,G,H,J,M,N,Q,S,V,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }

  get_dic: (tgt, tokens, reg)->
    data = to_indexs 0
    unless items = tgt.match(reg)
      throw new Error "invalid match #{tgt} #{reg}"
    for s, p in items[1..]
      token = tokens[p]
      [top, mode] = token
      if dic = @dic[top]
        if 'M' == top && '閏' == s[0]
          data.M_is_leap = true
          s = s[1..]
        data[top] = dic.to_idx s
    data

  get_diff: ( src, f )->
    data = to_indexs 0
    src.replace diff_token, (full, num, unit, 単位, 半, offset)=>
      if num = f num
        if 単位
          if 半
            num += 0.5
          unit = 単位系[単位]
        if unit
          data[unit] = num
    data 


  index: ( src, str = @dic.parse )->
    tokens = str.match reg_token
    data = @get_dic src, tokens, @regex tokens

    if @is_table_leap
      data.p = data.y // @dic.p.length
      data.y = data.y - data.p * @dic.p.length
    data.c = data.a %% @dic.c.length
    data.b = data.a %% @dic.b.length
    data.C = data.A %% @dic.C.length
    data.B = data.A %% @dic.B.length
    data

  regex: (tokens)->
    reg = "^" + tokens.map (token)=>
      [top, mode] = token
      if dic = @dic[top]
        if 'or'.includes mode
          dic.regex_o
        else
          dic.regex
      else
        "(#{token.replace(/([\\\[\]().*?])/g,"\\$1")})"
    .join("")
    new RegExp reg

  to_table: (utc, bk, ik, has_notes = false)->
    dic = @dic[ik]
    o = @to_tempos utc
    arg1 = @雑節(utc, o)
    arg2 = @節句(utc, o)
    { last_at } = o[bk]

    o = @to_tempos last_at
    anker = o[bk].now_idx
    list = []
    loop
      o = @to_tempos last_at
      last_at = o[ik].succ().last_at
      break unless anker == o[bk].now_idx

      item = o[ik]
      list.push [
        @format last_at
        dic.to_value null, item, 0
        dic.to_label dic.list, item, 0
        dic.to_ruby dic.rubys, item, 0
        if has_notes
          @note last_at, @to_tempos(last_at), arg1, arg2
      ]
    list

  parse_by: (data, diff = {})->
    unless data
      return null
    for key in main_tokens
      data[key] = ( diff[key] || 0 ) + ( data[key] || 0 )
    for key in sub_tokens
      data[key] = ( diff[key] || 0 )
    { M_is_leap, G, p,y,M,d,H,m,s,S, J, D,Y,Z,N,Q, u,w } = data

    utc =
      ( H * @calc.msec.hour ) +
      ( m * @calc.msec.minute ) +
      ( s * @calc.msec.second ) +
      ( S )

    if J
      return @calc.zero.jd + J * @calc.msec.day + utc

    d += D if D
    d += w * @dic.E.length if w
    M += Q * @dic.M.length / 4 if Q
    y += @calc.eras[G][2] - 1
    y += u if u
    y += Y if Y
    G = 0 if G < 0
    G = @calc.eras.length - 1 if @calc.eras.length <= G

    [m, s] = shift_up m, s, @dic.s.length
    [H, m] = shift_up H, m, @dic.m.length
    [d, H] = shift_up d, H, @dic.H.length
    [y, M] = shift_up y, M, @dic.M.length if @is_table_month
    [p, y] = shift_up p, y, @dic.p.length if @is_table_leap

    utc +=
      ( Z * @calc.msec.season ) +
      ( N * @calc.msec.moon ) +
      ( d * @calc.msec.day )

    # year section
    if @is_table_leap
      utc +=
      @calc.zero.period +
      ( p * @calc.msec.period ) +
      ( @table.msec.year[y - 1] || 0 )

      year_size = Math.floor @calc.msec.day * @table.range.year[y]

    else
      if @is_table_month
        zero = @calc.zero.spring
      else
        zero = @calc.zero.season

      { size, last_at } =
        to_tempo_bare @calc.msec.year, zero, zero + ( y * @calc.msec.year )
        .floor @calc.msec.day, @calc.zero.day
      year_size = size
      utc += last_at

    # month section
    if @is_table_month
      utc +=
      ( @table.msec.month[year_size][M - 1] || 0 )

    else
      base = last_at
      M_utc =
        if M_is_leap
          base + @calc.msec.season * ( M * 2 + 2 ) - @calc.msec.moon
        else
          base + @calc.msec.season * ( M * 2 + 1 )

      { last_at } =
        to_tempo_bare @calc.msec.moon, @calc.zero.moon, M_utc
        .floor @calc.msec.day, @calc.zero.day
      utc += last_at - base
    utc

  format_by: ( tempos, str = @dic.format )->
    str.match reg_token
    .map (token)=>
      [top, mode] = token
      if val = tempos[top]
        dic = @dic[top]

        switch mode
          when 'r'
            dic.to_ruby dic.rubys, val, token.length
          when 'o'
            dic.to_label dic.list, val, token.length
          else
            dic.to_value dic.list, val, token.length
      else
        token
    .join("")

  slide_by: ( o, diff )->
    ret = {}
    for key in main_tokens when val = o[key]
      ret[key] = val.now_idx
    ret.p = 0
    ret.M_is_leap = o.M.is_leap
    @parse_by ret, diff

  tree: ->
    { y,M,d, H,m,s, A,B,C,E,F,V, a,b,c,f } = @dic
    yyyy = [[a,b,c,f,y],['ao ar','bo br','co cr','fo fr','Gy']]
    eeee = [[A,B,C,E,F,V],['Ao Ar','Bo Br','Co Cr','Fo Fr','Vo Vr']]
    [yyyy, M,d, eeee, H,m,s]
    
