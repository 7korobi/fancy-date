FancyDate = require './fancy-date'

七曜 = ['月','火','水','木','金','土','日']
六曜 = ["先勝","友引","先負","仏滅","大安","赤口"]
和風月名 = ['睦月','如月','弥生','卯月','皐月','水無月','文月','葉月','長月','神無月','霜月','師走']
二十四節季 = ["立春","雨水","啓蟄","春分","清明","穀雨",
           "立夏","小満","芒種","夏至","小暑","大暑",
           "立秋","処暑","白露","秋分","寒露","霜降",
           "立冬","小雪","大雪","冬至","小寒","大寒"]
月相 = ['朔'  ,'既朔','三日月','上弦' ,'上弦','上弦' ,'上弦'  ,'上弦' ,'上弦'  ,'上弦' ,
       '上弦','上弦','十三夜','小望月','満月','十六夜','立待月','居待月','臥待月','更待月',
       '下限','下限','下限'  ,'下限' ,'下限','下限' ,'下限'  ,'下限' ,'晦'    ,'晦'  ]
時の鐘 = ['夜九つ','夜八つ','暁七つ',
        '明六つ','朝五つ','昼四つ',
        '昼九つ','昼八つ','夕七つ',
        '暮六つ','宵五つ','夜四つ']

十干 = [
  ["甲","きのえ"]
  ["乙","きのと"]
  ["丙","ひのえ"]
  ["丁","ひのと"]
  ["戊","つちのえ"]
  ["己","つちのと"]
  ["庚","かのえ"]
  ["辛","かのと"]
  ["壬","みずのえ"]
  ["癸","みずのと"]
]
十二支 = [
  ["子","ね"]
  ["丑","うし"]
  ["寅","とら"]
  ["卯","う"]
  ["辰","たつ"]
  ["巳","み"]
  ["午","うま"]
  ["未","ひつじ"]
  ["申","さる"]
  ["酉","とり"]
  ["戌","いぬ"]
  ["亥","い"]
]

六十干支 =
  for idx in [0...60]
    a = 十干[idx % 十干.length] 
    b = 十二支[idx % 十二支.length]
    "#{a[0]}#{b[0]}"

六十干支よみ =
  for idx in [0...60]
    a = 十干[idx % 十干.length] 
    b = 十二支[idx % 十二支.length]
    "#{"#{a[1].replace /と$/,"との" }#{b[1]}"}"

元号 = [# 号, 開始時刻
  ["大化", -41795611200000 - 75600000]
  ["白雉", -41647953600000 - 75600000]
  ["朱鳥", -40499352000000 - 75600000]
  ["大宝", -40034865600000 - 75600000]
  ["慶雲", -39936369600000 - 75600000]
  ["和銅", -39821371200000 - 75600000]
  ["霊亀", -39579883200000 - 75600000]
  ["養老", -39509640000000 - 75600000]
  ["神亀", -39314289600000 - 75600000]
  ["天平", -39140712000000 - 75600000]
  ["天平感宝", -38520014400000 - 75600000]
  ["天平勝宝", -38510769600000 - 75600000]
  ["天平宝字", -38256753600000 - 75600000]
  ["天平神護", -38023041600000 - 75600000]
  ["神護景雲", -37940616000000 - 75600000]
  ["宝亀", -37842465600000 - 75600000]
  ["天応", -37518292800000 - 75600000]
  ["延暦", -37465761600000 - 75600000]
  ["大同", -36718228800000 - 75600000]
  ["弘仁", -36580420800000 - 75600000]
  ["天長", -36160603200000 - 75600000]
  ["承和", -35844465600000 - 75600000]
  ["嘉祥", -35389483200000 - 75600000]
  ["仁寿", -35298763200000 - 75600000]
  ["斉衡", -35186356800000 - 75600000]
  ["天安", -35115681600000 - 75600000]
  ["貞観", -35047339200000 - 75600000]
  ["元慶", -34478222400000 - 75600000]
  ["仁和", -34232846400000 - 75600000]
  ["寛平", -34099704000000 - 75600000]
  ["昌泰", -33816571200000 - 75600000]
  ["延喜", -33712977600000 - 75600000]
  ["延長", -33026875200000 - 75600000]
  ["承平", -32775537600000 - 75600000]
  ["天慶", -32551416000000 - 75600000]
  ["天暦", -32270702400000 - 75600000]
  ["天徳", -31938667200000 - 75600000]
  ["応和", -31834987200000 - 75600000]
  ["康保", -31725864000000 - 75600000]
  ["安和", -31597905600000 - 75600000]
  ["天禄", -31545892800000 - 75600000]
  ["天延", -31428907200000 - 75600000]
  ["貞元", -31347864000000 - 75600000]
  ["天元", -31272523200000 - 75600000]
  ["永観", -31133419200000 - 75600000]
  ["寛和", -31071124800000 - 75600000]
  ["永延", -31009262400000 - 75600000]
  ["永祚", -30935044800000 - 75600000]
  ["正暦", -30896856000000 - 75600000]
  ["長徳", -30760344000000 - 75600000]
  ["長保", -30638606400000 - 75600000]
  ["寛弘", -30464510400000 - 75600000]
  ["長和", -30196152000000 - 75600000]
  ["寛仁", -30061108800000 - 75600000]
  ["治安", -29940494400000 - 75600000]
  ["万寿", -29832408000000 - 75600000]
  ["長元", -29706264000000 - 75600000]
  ["長暦", -29430993600000 - 75600000]
  ["長久", -29317204800000 - 75600000]
  ["寛徳", -29190974400000 - 75600000]
  ["永承", -29145873600000 - 75600000]
  ["天喜", -28934366400000 - 75600000]
  ["康平", -28756814400000 - 75600000]
  ["治暦", -28537185600000 - 75600000]
  ["延久", -28421409600000 - 75600000]
  ["承保", -28252152000000 - 75600000]
  ["承暦", -28150545600000 - 75600000]
  ["永保", -28046606400000 - 75600000]
  ["応徳", -27952516800000 - 75600000]
  ["寛治", -27852984000000 - 75600000]
  ["嘉保", -27609854400000 - 75600000]
  ["永長", -27548424000000 - 75600000]
  ["承徳", -27517492800000 - 75600000]
  ["康和", -27463320000000 - 75600000]
  ["長治", -27321969600000 - 75600000]
  ["嘉承", -27253195200000 - 75600000]
  ["天仁", -27179755200000 - 75600000]
  ["天永", -27120139200000 - 75600000]
  ["永久", -27023284800000 - 75600000]
  ["元永", -26876059200000 - 75600000]
  ["保安", -26811691200000 - 75600000]
  ["天治", -26684683200000 - 75600000]
  ["大治", -26629560000000 - 75600000]
  ["天承", -26470670400000 - 75600000]
  ["長承", -26421336000000 - 75600000]
  ["保延", -26335627200000 - 75600000]
  ["永治", -26140708800000 - 75600000]
  ["康治", -26116084800000 - 75600000]
  ["天養", -26057937600000 - 75600000]
  ["久安", -26014564800000 - 75600000]
  ["仁平", -25840728000000 - 75600000]
  ["久寿", -25720718400000 - 75600000]
  ["保元", -25674840000000 - 75600000]
  ["平治", -25581009600000 - 75600000]
  ["永暦", -25556385600000 - 75600000]
  ["応保", -25505928000000 - 75600000]
  ["長寛", -25455211200000 - 75600000]
  ["永万", -25385918400000 - 75600000]
  ["仁安", -25348248000000 - 75600000]
  ["嘉応", -25265649600000 - 75600000]
  ["承安", -25200763200000 - 75600000]
  ["安元", -25067534400000 - 75600000]
  ["治承", -25003252800000 - 75600000]
  ["養和", -24877368000000 - 75600000]
  ["寿永", -24850756800000 - 75600000]
  ["元暦", -24790449600000 - 75600000]
  ["文治", -24749841600000 - 75600000]
  ["建久", -24602097600000 - 75600000]
  ["正治", -24317496000000 - 75600000]
  ["建仁", -24259953600000 - 75600000]
  ["元久", -24164913600000 - 75600000]
  ["建永", -24095448000000 - 75600000]
  ["承元", -24049742400000 - 75600000]
  ["建暦", -23941396800000 - 75600000]
  ["建保", -23854910400000 - 75600000]
  ["承久", -23685998400000 - 75600000]
  ["貞応", -23591476800000 - 75600000]
  ["元仁", -23509310400000 - 75600000]
  ["嘉禄", -23496523200000 - 75600000]
  ["安貞", -23413147200000 - 75600000]
  ["寛喜", -23375304000000 - 75600000]
  ["貞永", -23278622400000 - 75600000]
  ["天福", -23244321600000 - 75600000]
  ["文暦", -23196715200000 - 75600000]
  ["嘉禎", -23167425600000 - 75600000]
  ["暦仁", -23067633600000 - 75600000]
  ["延応", -23061326400000 - 75600000]
  ["仁治", -23017176000000 - 75600000]
  ["寛元", -22934664000000 - 75600000]
  ["宝治", -22806878400000 - 75600000]
  ["建長", -22741387200000 - 75600000]
  ["康元", -22505342400000 - 75600000]
  ["正嘉", -22491691200000 - 75600000]
  ["正元", -22426891200000 - 75600000]
  ["文応", -22392331200000 - 75600000]
  ["弘長", -22366238400000 - 75600000]
  ["文永", -22271112000000 - 75600000]
  ["建治", -21919204800000 - 75600000]
  ["弘安", -21829694400000 - 75600000]
  ["正応", -21508286400000 - 75600000]
  ["永仁", -21341880000000 - 75600000]
  ["正安", -21161563200000 - 75600000]
  ["乾元", -21049675200000 - 75600000]
  ["嘉元", -21025483200000 - 75600000]
  ["徳治", -20920075200000 - 75600000]
  ["延慶", -20861841600000 - 75600000]
  ["応長", -20783563200000 - 75600000]
  ["正和", -20753668800000 - 75600000]
  ["文保", -20599531200000 - 75600000]
  ["元応", -20531016000000 - 75600000]
  ["元亨", -20472782400000 - 75600000]
  ["正中", -20354068800000 - 75600000]
  ["嘉暦", -20309227200000 - 75600000]
  ["元徳", -20204424000000 - 75600000]
  ["元弘", -20142302400000 - 75600000]
  ["正慶", -20120270400000 - 75600000]
  ["建武", -20064024000000 - 75600000]
  ["延元", -19997668800000 - 75600000]
  ["興国", -19867636800000 - 75600000]
  ["正平", -19657598400000 - 75600000]
  ["建徳", -18913780800000 - 75600000]
  ["文中", -18859867200000 - 75600000]
  ["天授", -18760420800000 - 75600000]
  ["弘和", -18580708800000 - 75600000]
  ["元中", -18479707200000 - 75600000]
  ["暦応", -19918785600000 - 75600000]
  ["康永", -19803960000000 - 75600000]
  ["貞和", -19694836800000 - 75600000]
  ["観応", -19556510400000 - 75600000]
  ["文和", -19474862400000 - 75600000]
  ["延文", -19364961600000 - 75600000]
  ["康安", -19206763200000 - 75600000]
  ["貞治", -19161403200000 - 75600000]
  ["応安", -18990849600000 - 75600000]
  ["永和", -18768110400000 - 75600000]
  ["康暦", -18640929600000 - 75600000]
  ["永徳", -18579499200000 - 75600000]
  ["至徳", -18484891200000 - 75600000]
  ["嘉慶", -18373003200000 - 75600000]
  ["康応", -18328161600000 - 75600000]
  ["明徳", -18293515200000 - 75600000]
  ["応永", -18157608000000 - 75600000]
  ["正長", -17089185600000 - 75600000]
  ["永享", -17047713600000 - 75600000]
  ["嘉吉", -16686907200000 - 75600000]
  ["文安", -16593595200000 - 75600000]
  ["宝徳", -16420708800000 - 75600000]
  ["享徳", -16326532800000 - 75600000]
  ["康正", -16229592000000 - 75600000]
  ["長禄", -16162977600000 - 75600000]
  ["寛正", -16058952000000 - 75600000]
  ["文正", -15897643200000 - 75600000]
  ["応仁", -15863860800000 - 75600000]
  ["文明", -15795518400000 - 75600000]
  ["長享", -15222168000000 - 75600000]
  ["延徳", -15155726400000 - 75600000]
  ["明応", -15064056000000 - 75600000]
  ["文亀", -14792760000000 - 75600000]
  ["永正", -14698238400000 - 75600000]
  ["大永", -14145278400000 - 75600000]
  ["享禄", -13926081600000 - 75600000]
  ["天文", -13800283200000 - 75600000]
  ["弘治", -13068475200000 - 75600000]
  ["永禄", -12993998400000 - 75600000]
  ["元亀", -12609259200000 - 75600000]
  ["天正", -12506788800000 - 75600000]
  ["文禄", -11896113600000 - 75600000]
  ["慶長", -11772043200000 - 75600000]
  ["元和", -11181326400000 - 75600000]
  ["寛永", -10909425600000 - 75600000]
  ["正保", -10254859200000 - 75600000]
  ["慶安", -10152907200000 - 75600000]
  ["承応", -10009742400000 - 75600000]
  ["明暦", -9928526400000 - 75600000]
  ["万治", -9825624000000 - 75600000]
  ["寛文", -9738705600000 - 75600000]
  ["延宝", -9346190400000 - 75600000]
  ["天和", -9092865600000 - 75600000]
  ["貞享", -9017006400000 - 75600000]
  ["元禄", -8873409600000 - 75600000]
  ["宝永", -8384990400000 - 75600000]
  ["正徳", -8159313600000 - 75600000]
  ["享保", -7996363200000 - 75600000]
  ["元文", -7370654400000 - 75600000]
  ["寛保", -7217726400000 - 75600000]
  ["延享", -7123809600000 - 75600000]
  ["寛延", -6986865600000 - 75600000]
  ["宝暦", -6880939200000 - 75600000]
  ["明和", -6485054400000 - 75600000]
  ["安永", -6218510400000 - 75600000]
  ["天明", -5954299200000 - 75600000]
  ["寛政", -5707454400000 - 75600000]
  ["享和", -5326430400000 - 75600000]
  ["文化", -5231476800000 - 75600000]
  ["文政", -4784097600000 - 75600000]
  ["天保", -4384497600000 - 75600000]
  ["弘化", -3943857600000 - 75600000]
  ["嘉永", -3842078400000 - 75600000]
  ["安政", -3627806400000 - 75600000]
  ["万延", -3462782400000 - 75600000]
  ["文久", -3432110400000 - 75600000]
  ["元治", -3337588800000 - 75600000]
  ["慶応", -3303028800000 - 75600000]
  ["明治", -3216715200000 - 75600000]
  ["大正", -1812110400000 - 75600000]
  ["昭和", -1357560000000 - 75600000]
  ["平成",   600264000000 - 75600000]
  ["令和",  1556712000000 - 75600000]
];

日本 = [ 35, 135 ]

地球 = [
  [31556925147.0, new Date("2019/03/21 06:58").getTime()]
  [ 2551442889.6, new Date("2019/01/06 10:28").getTime()]
  [   86400000  , 0] # LOD ではなく、暦上の1日。Unix epoch では閏秒を消し去るため。
  23.4397
  日本
]


GREGORIO = 
  calendar: [
    "1970年1月1日(木)0時0分0秒"
    0
    [4, 100, 400]
    [31, 0,31,30,31,30,31,31,30,31,30,31]
  ]
  rolls: [
    ["曜",  3, 七曜]
    ["", 56, 六十干支,六十干支よみ]
  ]
  yeary: [
    ["月", 0, 12]
    ["日", 0]
  ]
  seasonly: [
    #   節    中     節    中     節    中 
    ["", 3, 二十四節季]
  ]
  moony: [
    ["", 0, 月相]
  ]
  daily: [
    ["時", 0, 24]
    ["分", 0, 60]
    ["秒", 0]
  ]

平気法 =
  calendar: [
    "1970年1月1日(木)0時0分0秒"
    0
  ]
  rolls: [
    ["", null, 六曜]
    ["",    0, 六十干支,六十干支よみ]
  ]
  yeary: [
    ["月", 0,和風月名]
    ["日", 0]
  ]
  daily: [
    ["時", 0, 時の鐘]
    ["分", 0, ['','半']]
    ["秒", 0]
    true
  ]

FastEarth = [ # 天体が地球の百倍速のケース
  [315569251.470, new Date("2019/03/21 06:58").getTime() / 100]
  [ 25514428.896, new Date("2019/01/06 10:28").getTime() / 100]
  [   864000    , 0] # LOD ではなく、暦上の1日。Unix epoch では閏秒を消し去るため。
  23.4397
  日本
]

FancyDate.Gregorian = g = new FancyDate()
  .planet   ...地球
  .calendar ...GREGORIO.calendar
  .rolls    ...GREGORIO.rolls
  .era "西暦"
  .yeary    ...GREGORIO.yeary
  .seasonly ...GREGORIO.seasonly
  .moony    ...GREGORIO.moony
  .daily    ...GREGORIO.daily
  .init()

FancyDate.平気法 = FancyDate.Gregorian.dup()
  .planet   ...地球
  .calendar ...平気法.calendar
  .rolls    ...平気法.rolls
  .era "西暦", 元号
  .yeary    ...平気法.yeary
  .daily    ...平気法.daily
  .init()

FancyDate.Fast = FancyDate.Gregorian.dup()
  .planet   ...FastEarth
  .era "fast", 元号
  .init()


火星 = [
  [59354347573.5373, new Date("2018/10/28 09:00").getTime()]
  null
  [ 88775000, 0] # 24時間39分35秒。
  25.19
  [ 35, 0 ]
]

MARS_GREGORIO =
  calendar: [
    "1年1月1日(木)0時0分0秒"
    g.parse "0年9月1日" # 春分が３月くらいになるよう、恣意的に決めました。
    [1,2,10,100,300]
  ]
  yeary: [
    ["月", 1, 12]
    ["日", 1]
  ]
  daily: [
    ["時", 0,24]
    ["分", 0,62]
    ["秒", 0]
  ]

FancyDate.MarsGregorian = FancyDate.Gregorian.dup()
  .planet   ...火星
  .calendar ...MARS_GREGORIO.calendar
  .era "西暦"
  .yeary    ...MARS_GREGORIO.yeary
  .daily    ...MARS_GREGORIO.daily
  .init()
