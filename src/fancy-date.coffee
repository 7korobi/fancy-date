  
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
  range = [Math.floor(msec / day)]
  msec = range[0] * day
  { range, msec }

daily_measure = (msec, day)->
  range = [Math.floor(msec / day), Math.ceil(msec / day)]
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

export class FancyDate
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
        G = ["紀元前"]
        A = B = C = D = E = F = H = J = K = M = N = Q = S = Y = Z = []
        a = b = c = d = f = m = p = s = u = w = x = y = []
        for key, val of { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
          @dic[key] = new Indexer val

  dup: ->
    new @constructor @

  planet: (
    sunny
    moony
    earthy
    geo
  )->
    year = daily_measure sunny[0], earthy[0]
    day = daily_define earthy[0], earthy[0]
    if moony
      moon = daily_measure moony[0], earthy[0]

    calc_set.call @, "range", { year }
    calc_set.call @, "msec",  { year, moon, day }

    Object.assign @dic, { sunny, moony, earthy, geo }
    @

  era: ( era, eras = [] )->
    all_eras = ["紀元前", ...eras.map(([s,])=> s)]
    @dic.G = new Indexer [all_eras]
    Object.assign @dic, { era, eras }
    @

  calendar: (start = ["1970-1-1 0:0:0","y-M-d H:m:s", 0], leaps = null, month_divs = null )->
    Object.assign @dic, { month_divs, leaps, start }
    @is_table_leap = leaps?
    @is_table_month = month_divs?
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
    A = B = C = E = F = G = H = M = N = Z = a = b = c = f = m = p = s = (list)=>
      if list
        if list.join
          "(#{ list.join("|") })"
        else
          "([#{list}])"
      else
        "(\\d+)"
    D = Q = S = Y = d = u = w = y = => "(\\d+)"
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
    minute = sub_define      hour.msec,  @dic.m.length
    second = sub_define    minute.msec,  minute.msec / 1000
    calc_set.call @, "range", { month, hour, minute, second }
    calc_set.call @, "msec",  { season, month, week, hour, minute, second }

  def_eras: ->
    zero = @calc.zero.era
    list =
      for [ title, msec ], idx in @dic.eras
        { u } = @to_tempos msec
        @calc.eras.push [ title, msec, u.now_idx ]
        msec - zero
    list.push Infinity
    @table.msec.era = list

  def_table_by_leap_day: ->
    day = @calc.msec.day
    upto = (src)->
      msec = 0
      for i in src
        msec += i * day

    [...leaps, period] = @dic.leaps

    range =
      year:
        for idx in [0...period]
          is_leap = 0
          for div, mode in leaps
            continue if idx % div
            is_leap = ! mode % 2
          @calc.range.year[is_leap]
    range.year[0] = @calc.range.year[1]
    years = @calc.range.year

    { month_divs } = @dic
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

    year = upto range.year
    period = year[year.length - 1]
    period = daily_define period, day
    calc_set.call @, "msec", { period }

    month = {}
    for size in years
      year_size = Math.floor day * size
      month[year_size] = upto range.month[size]

    @table = { range, msec: { year, month } }

  def_table_by_leap_month: ->
    day = @calc.msec.day
    upto = (src)->
      msec = 0
      for i in src
        msec += i * day

    years = @calc.range.year

    { month_divs } = @dic
    month_sum = 0
    for i in month_divs
      month_sum += i

    range =
      month: {}
    for size in years
      a = Array.from month_divs
      idx = month_divs.indexOf 0
      a[idx] = size - month_sum
      range.month[size] = a

    month = {}
    for size in years
      year_size = Math.floor day * size
      month[year_size] = upto range.month[size]

    @table = { range, msec: { month } }

  def_table_by_season: ->
    @table = { range: {}, msec: {} }

  def_table: ->
    if @is_table_leap
      @def_table_by_leap_day()
    else
      if @is_table_month
        @def_table_by_leap_month()
      else
        @def_table_by_season()

  def_idx: ->
    if @is_table_leap
      [..., period] = @dic.leaps
      @calc.divs.period = period

    o = @index ...@dic.start
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

    timezone = @calc.msec.day * (@dic.geo[2] || @dic.geo[1]) / 360
    @dic.x.tempo = 
      x = to_tempo_bare @calc.msec.hour / 4, -@calc.msec.hour / 8, timezone
    x.now_idx /= 4

    start_at = @dic.start[2]
    zero   = start_at - x.center_at

    second = zero   + zero_size "s", "second"
    minute = second + zero_size "m", "minute"
    hour   = minute + zero_size "H", "hour"
    day    = hour   + zero_size "d", "day"

    # 単純のため平気法。
    season = @dic.sunny[1] + zero_size "Z", "season" # 立春点
    { since } = to_tempo_bare @calc.msec.year, start_at, season
    season = since + zero_size "y", "year"

    if @is_table_leap
      year_size = Math.floor @calc.msec.day * @table.range.year[ @calc.idx.y %% @calc.divs.period ]
      zero_size_M_month = - (@table.msec.month[year_size][ @calc.idx.M - 1 ] || 0)
      zero_size_y_year  = - (@table.msec.year[             @calc.idx.y - 1 ] || 0)

      month  = day   + zero_size_M_month
      year   = month + zero_size_y_year
      period = year  + zero_size "p", "period"

      season += zero_size "p", "period"
    else

    # 元号
    era = @dic.eras[0]?[1] || Infinity
    @calc.eras = []
    if @is_table_leap
      if period < era
        era = period + @table.msec.year[0]
        @calc.eras = [[@dic.era, era, 1]]
    else
      if season < era
        era = season + @calc.msec.year
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
    Object.assign @calc.zero, { period, era, week, season, moon, day, jd,ld,mjd,cjd, day10, day12, day60, day_s }

  precision: ->
    is_just = (x, n)-> n == Math.floor( n / x ) * x
    gaps = [( @calc.msec.year / @calc.msec.day ) - @calc.range.year[0]]
    if @dic.leaps
      for v, idx in @dic.leaps
        gap = gaps[gaps.length - 1]
        if idx & 1
          gap += 1 / v
        else
          gap -= 1 / v
        gaps.push gap
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

  雑節: ({ Zz, u, d })->
    d0 = d.dup Zz.zero
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
      Tempo.join(dd.back(3), dd.succ(3))
    [春社日, 秋社日] = [春分, 秋分].map (dd)=>
      C = to_tempo_bare @calc.msec.day, @calc.zero.day10, dd.write_at
      C.now_idx %%= @dic.C.length
      C.slide ( @dic.C.length / 2 ) - C.now_idx - 1
  
    春 = Tempo.join(立春,夏土用.back())
    夏節分 = 立夏.back()
    夏 = Tempo.join(立夏,秋土用.back())
    秋節分 = 立秋.back()
    秋 = Tempo.join(立秋,冬土用.back())
    冬節分 = 立冬.back()
    冬 = Tempo.join(立冬,春土用.back())
    春節分 = 立春2.back()
    節分 = 春節分

    夏土用 = Tempo.join(夏土用,夏節分)
    秋土用 = Tempo.join(秋土用,秋節分)
    冬土用 = Tempo.join(冬土用,冬節分)
    春土用 = Tempo.join(春土用,立春2)


    o = {
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
    o.covers =
      for k, t of o when t.is_cover d.center_at
        k.match(/.(彼岸|社日|節分|土用)|(.+)/)[1...].join("")
    o

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
        Zu = Zz.dup Zs.last_at
      when @dic.Z.length >> 1
        # 太陽年末に13月が出てしまう。年初にする。
        Zu = Zz.dup Zs.next_at
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
      u = Zu
      M = Nn
      d = N.dup utc

    G = {}

    # day in year appendix
    if @dic.is_solor
      # hour   in day
      H = @to_tempo_by_solor utc, d
      size = H.size / @dic.m.length
      m = to_tempo_bare size, H.last_at, utc
      s = to_tempo_bare 1000, m.last_at, utc
    else
      # hour   in day
      H = drill_down d, "hour"
      m = drill_down H, "minute"
      s = drill_down m, "second"

    # minute in day
    now_idx = ( utc - s.last_at ) / 1000
    S = { now_idx }

    if @table.msec.era?
      era_base = to_tempo_by @table.msec.era, @calc.zero.era, utc
      era = @calc.eras[era_base.now_idx]
      if era?[0]
        u.now_idx += 1 - era[2]
        G.label = era[0]

    y = Object.assign {}, u
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
    Q = now_idx: Math.floor 4 * M.now_idx / @dic.M.length

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

    result = { Zz, A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }
    for key, val of result when val && @dic[key]
      val.list     = @dic[key].list
      val.to_label = @dic[key].to_label
    result

  index: (tgt, str = default_parse_format)->
    data = null
    do =>
      A = B = C = D = E = F = G = H = J = M = N = Q = S = Y = Z = a = b = c = d = f = m = p = s = u = w = x = y = 0
      data = { A,B,C,D,E,F,G,H,J,M,N,Q,S,Y,Z, a,b,c,d,f,m,p,s,u,w,x,y }

    tokens = str.match reg_token
    reg = @regex tokens

    items = tgt.match(reg)[1..]
    for s, p in items
      token = tokens[p][0]
      if dic = @dic[token]
        val = dic.to_idx s
        data[token] = val
        switch token
          when 'a'
            [,c,b] = s.match @regex ['c','b']
            data.c = @dic.c.to_idx c
            data.b = @dic.b.to_idx b
          when 'A'
            [,C,B] = s.match @regex ['C','B']
            data.C = @dic.C.to_idx C
            data.B = @dic.B.to_idx B

    if @is_table_leap
      data.p = Math.floor( data.y / @calc.divs.period )
      data.y = data.y - data.p * @calc.divs.period
    data

  regex: (tokens)->
    reg = "^" + tokens.map (token)=>
      if val = @dic[token[0]]
        val.regex
      else
        "(#{token.replace(/([\\\[\]().*?])/g,"\\$1")})"
    .join("")
    new RegExp reg

  tempo_list: (tempos, token)->
    switch token[0]
      when 'G'
        throw new Error "request token can't tempos. [#{token}]"

    unless tempo = tempos[token[0]]
      throw new Error "request token can't tempos. [#{token}]"

    { table, length, now_idx, last_at, size, zero } = tempo
    list = []
    if table
      last_at = zero
      for next_at, now_idx in table
        next_at += zero
        size = next_at - last_at
        list.push { now_idx, size, last_at, next_at, last_time: new Date(last_at), next_time: new Date(next_at) }
        last_at = next_at

    if length
      base = last_at - size * now_idx
      for now_idx in [0...length]
        last_at = (now_idx + 0) * size + zero
        next_at = (now_idx + 1) * size + zero
        list.push { now_idx, size, last_at, next_at, last_time: new Date(last_at), next_time: new Date(next_at) }
    list

  ranges: (utc, token)->
    @tempo_list @to_tempos(utc), token

  parse: (tgt, str = default_parse_format)->
    { G, p,y,M,d,H,m,s,S, J } = @index tgt, str
    y += @calc.eras[G][2] - 1
    if J
      return @calc.zero.jd + J * @calc.msec.day 

    ( d * @calc.msec.day ) +
    ( H * @calc.msec.hour ) +
    ( m * @calc.msec.minute ) +
    ( s * @calc.msec.second ) +
    ( S ) +
    if @is_table_leap
      year_size = Math.floor @calc.msec.day * @table.range.year[y]

      @calc.zero.period +
      ( p * @calc.msec.period ) +
      ( @table.msec.year[y - 1] || 0 ) +
      ( @table.msec.month[year_size][M - 1] || 0 )
    else
      @calc.zero.season +
      ( y * @calc.msec.year) +
      ( M * @calc.msec.month )

  format: (utc, str = default_format_format)->
    o = @to_tempos utc
    str.match reg_token
    .map (token)=>
      val = o[token[0]]
      if val?.to_label?
        val.to_label token.length
      else
        token
    .join("")

