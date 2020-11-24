
class DIC
  constructor: ( @units, @join_str, @zero_str, ...dic )->
    [ units, items, scales, bigs ] = dic.map (o)=> o.split " "

    unit_str = items[1]
    scale = scales.indexOf(unit_str)
    scales[scale] = ""
    tail = scales[-4..]
    for big, idx in bigs
      scales = [ ...scales, ...tail ]

    item = items.length
    big = item ** 4
    @idxs = { item, big, scale }
    @dic = { units, items, scales, bigs }

  音便: (@fix)->
    @

  fix: (num, str)->
    str

  parse: (num, appendix)->
    base = @idxs.item 
    gap = 0
    scale = 1
    while num * scale != Math.floor( num * scale )
      gap++
      scale *= base
    @_calc Math.floor( num * scale ), -gap, appendix

  _calc: (num, scale_idx, appendix)->
    { join_str } = @
    scale_str = @dic.scales[ scale_idx + @idxs.scale ]

    base = @idxs.item 
    next_num = num // base
    left_str =
      if next_num
        @_calc( next_num, scale_idx + 1, appendix )
      else
        join_str = ""
        ""


    n = num % base
    n_str = @dic.items[ n ]

    big_idx =
      if scale_idx % 4 || !( num % @idxs.big )
        -1
      else
        scale_idx // 4 - 1
    big_str = @dic.bigs[ big_idx ] || ""

    switch n
      when 0
        if left_str
          n_str = ""
        join_str = ""
        scale_str = ""
      when 1
        if 0 < scale_idx
          n_str = ""

    if -1 < scale_idx
      scale_idx %= 4
    fix = @fix base ** scale_idx * n, "#{ n_str }#{ scale_str }", appendix
    "#{ left_str }#{ join_str }#{ fix }#{ big_str }"


jpn =
  漢字: new DIC(
    [ 12, 2,2,2,2, .1 ]
    ""
    "余"
    "打 対 番 足 双 割"
    "〇 一 二 三 四 五 六 七 八 九"
    "清浄 虚空 六徳 刹那 弾指 瞬息 須臾 逡巡 模糊 漠 渺 埃 塵 沙 繊 微 忽 糸 毛 厘 分 一 十 百 千"
    "万 億 兆 京 垓 𥝱 穣 溝 澗 正 載 極 恒河沙 阿僧祇 那由他 不可思議 無量大数"
  ).音便 (num, str, tail)->
    switch num
      when 20
        "廿"
      when 30
        "丗"
      when 40
        "卌"
      else
        str


  大字: new DIC(
    [ 12, 2,2,2,2, .1 ]
    ""
    "余"
    "打 対 番 足 双 割"
    "零 壱 弐 参 肆 伍 陸 漆 捌 玖"
    "清浄 虚空 六徳 刹那 弾指 瞬息 須臾 逡巡 模糊 漠 渺 埃 塵 沙 繊 微 忽 糸 毛 厘 分 壱 拾 佰 阡"
    "萬 億 兆 京 垓 𥝱 穣 溝 澗 正 載 極 恒河沙 阿僧祇 那由他 不可思議 無量大数"
  )

  rubys: new DIC(
    [ 12, 2,2,2,2, .1 ]
    ""
    ""
    "だーす つい つがい そく そう わり"
    "れい いち に さん よん ご ろく なな はち きゅう"
    "せいじょう こくう りっとく せつな だんし しゅんそく しゅゆ しゅんじゅん もこ ばく びょう あい じん しゃ せん び こつ し もう りん ぶ いち じゅう ひゃく せん"
    "まん おく ちょう けい がい じょ じょう こう かん せい さい ごく ごうがしゃ あそうぎ なゆた ふかしぎ むりょうたいすう"
  ).音便 (num, str, tail)->
    switch num
      when 300
        "さんびゃく"
      when 600
        "ろっぴゃく"
      when 800
        "はっぴゃく"
      when 3000
        "さんぜん"
      when 8000
        "はっせん"
      else
        str

old_jpn =
  rubys: new DIC(
    [ 12, 2,2,2,2, .1 ]
    "まり"
    ""
    "だーす つい つがい そく そう わり"
    "れい ひと ふた み よ いつ む なな や ここの"
    "せいじょう こくう りっとく せつな だんし しゅんそく しゅゆ しゅんじゅん もこ ばく びょう あい じん しゃ せん び こつ し もう りん ぶ ひと そ ほ ち"
    "よろづ おく ちょう けい がい じょ じょう こう かん せい さい ごく ごうがしゃ あそうぎ なゆた ふかしぎ むりょうたいすう"
  ).音便 (num, str, tail = "つ" )->
    return "" unless str
    return str if num < 1
    return str if 100 < num
    res =
      switch num
        when 1
          "ついたち" if "か" == tail
        when 2
          "ふつか" if "か" == tail
        when 3
          "みっか" if "か" == tail
        when 4
          "よっか" if "か" == tail
        when 6
          "むいか" if "か" == tail
        when 7
          "なのか" if "か" == tail
        when 8
          "ようか" if "か" == tail
        when 10
          switch tail
            when "つ"
              "とを"
            when "たり"
              "とたり"
            else
              "とを#{tail}"
        when 20
          switch tail
            when "つ"
              "はたち"
            when "か"
              "はつか"
            else
              "はた#{tail}"
        when 30, 40, 50, 60, 70, 80, 90
          tail = "ぢ" if "つ" == tail
          "#{ str }#{ tail }"
        when 99
          "つくも"
        when 100
          "もも"
    res || "#{ str }#{ tail }"

angle =
  basic: new DIC(
    []
    ""
    ""
    ""
    [0..59].join(" ")
    "⁗ ‴ ″ ′ ° 1   "
    ""
  )

export { jpn, old_jpn, angle }

###
DOT = "・"
PLUS = "＋"
MINUS = "−"
REGEXP = /^\s*([-+])?([0-9]+)(?:\.([0-9]+))?/
WIDE_REGEXP = /^[\s　]*([-+−＋])?([0-9０１２３４５６７８９]+)(?:[\.．]([0-9０１２３４５６７８９]+))?/

###