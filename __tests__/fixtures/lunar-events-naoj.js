const NAOJ_LUNAR_EVENT_SOURCE = {
  place: '名古屋(愛知県): Nagoya',
  latitudeDeg: 35.1667,
  longitudeDeg: 136.9167,
  timezone: 'JST',
  timezoneDeg: 135,
  altitudeM: 0,
  accuracy: 'minute and 0.1 degree',
  urls: {
    '2024-01': 'https://eco.mtk.nao.ac.jp/koyomi/dni/2024/m2401.html',
    '2024-03': 'https://eco.mtk.nao.ac.jp/koyomi/dni/2024/m2403.html',
    '2024-06': 'https://eco.mtk.nao.ac.jp/koyomi/dni/2024/m2406.html',
  },
  note: '出入りの時刻は月の中心が地平線に一致する時刻。方位は北を0度とし東回り。',
}

function lunarEvent(
  year,
  month,
  day,
  moonrise,
  moonriseAzimuthDeg,
  transit,
  transitAltitudeDeg,
  moonset,
  moonsetAzimuthDeg,
  moonAge,
) {
  return {
    year,
    month,
    day,
    moonrise,
    moonriseAzimuthDeg,
    transit,
    transitAltitudeDeg,
    moonset,
    moonsetAzimuthDeg,
    moonAge,
  }
}

const NAOJ_LUNAR_EVENT_FIXTURES = [
  lunarEvent(2024, 1, 16, '10:17', 93.4, '16:19', 53.4, '22:32', 270.8, 4.6),
  lunarEvent(2024, 3, 11, '6:41', 92.9, '12:45', 54.0, '19:00', 271.7, 0.7),
  lunarEvent(2024, 6, 21, '18:48', 125.3, '23:29', 25.9, '3:17', 236.2, 14.6),
]

module.exports = {
  NAOJ_LUNAR_EVENT_FIXTURES,
  NAOJ_LUNAR_EVENT_SOURCE,
}
