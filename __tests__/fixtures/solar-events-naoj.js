const NAOJ_SOLAR_EVENT_SOURCE = {
  place: '名古屋(愛知県): Nagoya',
  latitudeDeg: 35.1667,
  longitudeDeg: 136.9167,
  timezone: 'JST',
  timezoneDeg: 135,
  altitudeM: 0,
  accuracy: 'minute and 0.1 degree',
  urls: {
    '2024-03': 'https://eco.mtk.nao.ac.jp/koyomi/dni/2024/s2403.html',
    '2024-06': 'https://eco.mtk.nao.ac.jp/koyomi/dni/2024/s2406.html',
    '2024-12': 'https://eco.mtk.nao.ac.jp/koyomi/dni/2024/s2412.html',
  },
  note: '出入りの時刻は太陽の上辺が地平線に一致する時刻。方位は北を0度とし東回り。',
}

function solarEvent(
  year,
  month,
  day,
  sunrise,
  sunriseAzimuthDeg,
  transit,
  transitAltitudeDeg,
  sunset,
  sunsetAzimuthDeg,
) {
  return {
    year,
    month,
    day,
    sunrise,
    sunriseAzimuthDeg,
    transit,
    transitAltitudeDeg,
    sunset,
    sunsetAzimuthDeg,
  }
}

const NAOJ_SOLAR_EVENT_FIXTURES = [
  solarEvent(2024, 3, 20, '5:56', 89.5, '12:00', 54.8, '18:04', 270.7),
  solarEvent(2024, 6, 21, '4:38', 60.2, '11:54', 78.3, '19:10', 299.8),
  solarEvent(2024, 12, 21, '6:56', 118.4, '11:50', 31.4, '16:44', 241.6),
]

module.exports = {
  NAOJ_SOLAR_EVENT_FIXTURES,
  NAOJ_SOLAR_EVENT_SOURCE,
}
