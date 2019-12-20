  
{
  Tempo
  to_tempo_by
  to_tempo_bare
} = require "./time"
_ = require "lodash"

reg_token = /([ABCabcGuYyMdHmsSEQZNDwJ])(o|\1*)|''|'(''|[^'])+('|$)|./g
default_parse_format  = "y年M月d日"
default_format_format = "Gy年M月d日(E)H時m分s秒"

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

export class FancyDic
  constructor: (o)->
    if o
      { @dic, @calc } = _.cloneDeep o
    else
      @dic = {}
      @calc =
        eras: []
        divs: {}
        idx:  {}
        zero: {}
        msec: {}
        range: {}
      do =>
        G = []
        A = B = C = D = E = F = H = J = K = M = N = Q = S = Y = Z = []
        a = b = c = d = f = m = p = s = u = w = x = y = []
        for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
          @dic[key] = new Indexer val

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

export class FancyDate
  yeary_table:   (utc)-> @to_table utc, 'y', 'M', true
  monthry_table: (utc)-> @to_table utc, 'M', 'd', true
  weekly_table:  (utc)-> @to_table utc, 'w', 'd', true
  time_table:    (utc)-> @to_table utc, 'd', 'H'

  succ_index: ( diff, str = default_parse_format )-> @get_diff diff, str, 'to_succ'
  back_index: ( diff, str = default_parse_format )-> @get_diff diff, str, 'to_back'
  index: ( tgt, str = default_parse_format )-> @get_dic tgt, str

  succ: ( utc, diff, str = default_parse_format )-> @slide_by utc, @succ_index diff, str
  back: ( utc, diff, str = default_parse_format )-> @slide_by utc, @back_index diff, str

  parse: ( tgt, str )-> @parse_by @index tgt, str
  format: ( utc, str )-> @format_by @to_tempos(utc), str

  dup: -> new @constructor @

  constructor: (o)->
    if o
      { @dic, @calc } = _.cloneDeep o
    else
      @dic = {}
      @calc =
        eras: []
        divs: {}
        idx:  {}
        zero: {}
        msec: {}
        range: {}
      do =>
        G = []
        A = B = C = D = E = F = H = J = K = M = N = Q = S = Y = Z = []
        a = b = c = d = f = m = p = s = u = w = x = y = []
        for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
          @dic[key] = new Indexer val

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
    @def_to_diff()
    @def_to_label()
    @def_calc()

    @def_table()
    @def_idx()
    @def_zero()

    @def_eras()
    @

  def_regex: ->
    A = B = C = E = F = G = H = M = N = Z = a = b = c = f = m = p = s = (list)=>
      if list
        if list.join
          "(#{ list.join("|") })"
        else
          "([#{list}])"
      else
        "(\\d+)"
    u = => "([-\\d]+)"
    D = Q = S = Y = d = w = y = => "(\\d+)"
    J = x = => "([\\d.]+)"
    for key, f of { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
      @dic[key].regex = f @dic[key].list

  def_to_idx: ->
    G = (s)-> if ! @list || (idx = @list.indexOf(s)) < 0 then s - 0 else idx
    H = m = s = (s)-> if ! @list || (idx = @list.indexOf(s)) < 0 then s - 0 else idx
    A = B = C = E = F = M = N = Z = a = b = c = d = f = (s)-> if ! @list || (idx = @list.indexOf(s)) < 0 then s - 1 else idx
    D = Q = p = w = (s)-> s - 1
    J = S = Y = u = x = y = (s)-> s - 0
    for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
      @dic[key].to_idx = val

  def_to_diff: ->
    A = B = C = D = E = F = G = H = J = M = N = Q = S = Y = Z = a = b = c = d = f = m = p = s = u = w = x = y = (s)-> s - 0
    for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
      @dic[key].to_succ = val

    A = B = C = D = E = F = G = H = J = M = N = Q = S = Y = Z = a = b = c = d = f = m = p = s = u = w = x = y = (s)-> 0 - s
    for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
      @dic[key].to_back = val

  def_to_label: ->
    at = ->
      if @list
        s = @list[@now_idx]
        if s?
          s
    num_0 = ( size )-> _.padStart @now_idx    , size, '0'
    num_1 = ( size )-> _.padStart @now_idx + 1, size, '0'
    f_0 = ( size )->
      num = parseInt @now_idx
      sub = "#{@now_idx % 1}"[1...]
      _.padStart(num, size, '0') + sub

    G = -> @label
    S = ( size )-> "#{ @now_idx }"[1..]
    M = ( size )-> "#{ if @is_leap then "閏" else "" }#{ at.call(@) ? num_1.call(@, size) }"
    H = m = s = ( size )-> at.call(@) ? num_0.call @, size
    A = B = C = E = F = N = Z = a = b = c = d = f = ( size )-> at.call(@) ? num_1.call @, size
    D = Q = p = w = num_1
    Y = u = y = num_0
    J = x = f_0
    for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
      @dic[key].to_label = val

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
      @calc.divs.period = period || 1

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
    春分 = @dic.sunny[1]
    { last_at } = to_tempo_bare @calc.msec.year, 春分, period || year
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
      moon = 0 - @dic.moony[1]

    # JD
    day_utc = day + x.center_at
    cjd = to_tempo_bare(@calc.msec.day, day,     -210866803200000).center_at
    jd  = to_tempo_bare(@calc.msec.day, day_utc, -210866803200000).center_at # -2440587.5 * 86400000
    ld  = to_tempo_bare(@calc.msec.day, day_utc,  -12219379200000).last_at   #  -141428   * 86400000
    mjd = to_tempo_bare(@calc.msec.day, day_utc,   -3506716800000).last_at   #   -40587   * 86400000

    # 干支、九星、週
    day_s = day + zero_size("F", "day")
    week  = day + zero_size("E", "day")
    day10 = day + zero_size("C", "day")
    day12 = day + zero_size("B", "day")
    day60 = day + zero_size("A", "day")
    Object.assign @calc.zero, { period, era, week, season, spring, moon, day, jd,ld,mjd,cjd, day10, day12, day60, day_s }

  bless: (o)->
    for key, val of o when val && @dic[key]
      val.list     = @dic[key].list
      val.to_label = @dic[key].to_label
    o

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

  note: (utc, tempos = @to_tempos(utc), o = @雑節(utc, tempos))->
    for k, t of o when t.is_cover tempos.d.center_at
      k.match(/.(彼岸|社日|節分|土用)|(.+)/)[1...].join("")

  to_tempos: (utc)->
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

    to_tempo_floor = (o, sub)=>
      o.floor @calc.msec[sub], @calc.zero[sub]

    J = to_tempo_bare @calc.msec.day, @calc.zero.jd, utc # ユリウス日

    # season in year_of_planet
    Zz = to_tempo_bare @calc.msec.year, @calc.zero.season, utc # 太陽年
    Z  = drill_down Zz, "season" # 太陽年の二十四節気

    # 正月中気と正月
    N0_p = Zz.last_at + @calc.msec.season
    N0 = to_tempo "moon", N0_p
    N0 = to_tempo_floor N0, "day"

    # 今月と中気
    Nn = to_tempo "moon"
    Nn = to_tempo_floor Nn, "day"
    N  = drill_down Nn, 'day'

    Zs = drill_down Zz, "season", Nn.last_at
    unless Nn.is_cover Zs.moderate_at
      Zs = drill_down Zz, "season", Nn.next_at
      unless Nn.is_cover Zs.moderate_at
        Nn.is_leap = true

    switch Zs.now_idx >> 1
      when -1
        # 太陽年初に0月が出てしまう。昨年末にする。
        Zu = Zz.reset Zs.last_at
      when @dic.Z.length >> 1
        # 太陽年末に13月が出てしまう。年初にする。
        Zu = Zz.reset Zs.next_at
      else
        Zu = Zz
    Nn.now_idx = ( Zs.now_idx %% @dic.Z.length ) >> 1

    if @is_table_leap
      p = to_tempo 'period'
      u = drill_down p, "year"
      u.now_idx += p.now_idx * @calc.divs.period
      M = drill_down u, "month"
      d = drill_down M, "day"
    else
      if @is_table_month
        u = to_tempo_bare @calc.msec.year, @calc.zero.spring, utc
        u = to_tempo_floor u, "day"
        M = drill_down u, "month"
        d = drill_down M, "day"
      else
        u = Zu
        M = Nn
        d = N.reset utc

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
    F = to_tempo_bare @calc.msec.day, @calc.zero.day_s, utc

    A.now_idx %%= @dic.A.length
    B.now_idx %%= @dic.B.length
    C.now_idx %%= @dic.C.length
    F.now_idx %%= @dic.F.length
    if @is_table_leap # 旧暦では、週は月初にリセットする。
      E.now_idx %%= @dic.E.length
    else
      E.now_idx = ( M.now_idx + d.now_idx ) %% @dic.E.length

    { Zz, A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }

  get_dic_base: (tgt, mode, tokens, reg)->
    data = null
    do =>
      A = B = C = D = E = F = G = H = J = M = N = Q = S = Y = Z = a = b = c = d = f = m = p = s = u = w = x = y = 0
      data = { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }


    items = tgt.match(reg)[1..]
    for s, p in items
      token = tokens[p][0]
      if dic = @dic[token]
        val = dic[mode] s
        data[token] = val
    data

  get_diff: (tgt, str, mode)->
    tokens = str.match reg_token
    data = @get_dic_base tgt, mode, tokens, @regex_diff tokens


  get_dic: (tgt, str)->
    tokens = str.match reg_token
    data = @get_dic_base tgt, "to_idx", tokens, @regex tokens

    if @is_table_leap
      data.p = data.y // @calc.divs.period
      data.y = data.y - data.p * @calc.divs.period
    data.c = data.a %% @dic.c.length
    data.b = data.a %% @dic.b.length
    data.C = data.A %% @dic.C.length
    data.B = data.A %% @dic.B.length
    data

  regex_diff: (tokens)->
    reg = "^" + tokens.map (token)=>
      if val = @dic[token[0]]
        "(\\d+)"
      else
        "(#{token.replace(/([\\\[\]().*?])/g,"\\$1")})"
    .join("")
    new RegExp reg

  regex: (tokens)->
    reg = "^" + tokens.map (token)=>
      if val = @dic[token[0]]
        val.regex
      else
        "(#{token.replace(/([\\\[\]().*?])/g,"\\$1")})"
    .join("")
    new RegExp reg

  to_table: (utc, bk, ik, has_notes = false)->
    o = @to_tempos utc
    @bless o

    if has_notes
      雑節 = @雑節 utc, o
      for a in o[bk].to_list o[ik]
        a.notes =
          for k, t of 雑節 when t.is_hit a
            k.match(/.(彼岸|社日|節分|土用)|(.+)/)[1...].filter(s => s)
    else
      o[bk].to_list o[ik]

  parse_by: ({ G, p,y,M,d,H,m,s,S, J })->
    if J
      return @calc.zero.jd + J * @calc.msec.day 

    if G < 0
      G = 0
    if @calc.eras.length <= G
      G = @calc.eras.length - 1
    y += @calc.eras[G][2] - 1

    if @is_table_month
      month_range = @dic.M.length
      unless 0 < M <= month_range
        y += M // month_range
        M %%= month_range

    if @is_table_leap
      year_range = @calc.divs.period
      unless 0 < y <= year_range
        p += y // year_range
        y %%= year_range

    utc =
      ( d * @calc.msec.day ) +
      ( H * @calc.msec.hour ) +
      ( m * @calc.msec.minute ) +
      ( s * @calc.msec.second ) +
      ( S )


    if @is_table_leap
      utc +=
      @calc.zero.period +
      ( p * @calc.msec.period ) +
      ( @table.msec.year[y - 1] || 0 )

      year_size = Math.floor @calc.msec.day * @table.range.year[y]

    else
      utc +=
      @calc.zero.spring +
      ( y * @calc.msec.year)

      year_size =
        to_tempo_bare @calc.msec.year, @calc.zero.spring, utc
        .floor @calc.msec.day, @calc.zero.day
        .size

    if @is_table_month
      utc +=
      ( @table.msec.month[year_size][M - 1] || 0 )

    else
      utc +=
      ( M * @calc.msec.month )

    utc

  format_by: ( tempos, str = default_format_format )->
    @bless tempos
    str.match reg_token
    .map (token)=>
      val = tempos[token[0]]
      if val?.to_label?
        val.to_label token.length
      else
        token
    .join("")

  slide_by: ( utc, diff )->
    o = @to_tempos utc
    o.p?.now_idx = 0
    ret = {}
    for key, val of o when val
      ret[key] = val.now_idx + ( diff[key] || 0 )
    unless diff.J
      ret.J = null
    @parse_by ret

