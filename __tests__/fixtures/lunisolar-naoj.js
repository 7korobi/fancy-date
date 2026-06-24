const NAOJ_LUNISOLAR_SOURCE = {
  title: '国立天文台 暦要項 朔弦望・二十四節気から導く旧暦日付',
  timezone: 'JST',
  accuracy: 'day',
  urls: {
    '2023-solar-terms': 'https://eco.mtk.nao.ac.jp/koyomi/yoko/2023/rekiyou232.html',
    '2023-lunar-phases': 'https://eco.mtk.nao.ac.jp/koyomi/yoko/2023/rekiyou233.html',
    '2024-solar-terms': 'https://eco.mtk.nao.ac.jp/koyomi/yoko/2024/rekiyou242.html',
    '2024-lunar-phases': 'https://eco.mtk.nao.ac.jp/koyomi/yoko/2024/rekiyou243.html',
  },
  note: '朔を月初日とし、月内の中気で月名を定め、中気を含まない月を閏月とする。',
}

function lunisolar(gregorian, year, month, day, isLeap, principalLongitudeDeg) {
  return {
    gregorian,
    year,
    month,
    day,
    isLeap,
    principalLongitudeDeg,
  }
}

const NAOJ_LUNISOLAR_FIXTURES = [
  lunisolar('2023-02-20', 2023, 2, 1, false, 0),
  lunisolar('2023-03-22', 2023, 2, 1, true, null),
  lunisolar('2023-04-20', 2023, 3, 1, false, 30),

  lunisolar('2024-02-10', 2024, 1, 1, false, 330),
  lunisolar('2024-03-10', 2024, 2, 1, false, 0),
  lunisolar('2024-03-25', 2024, 2, 16, false, 0),
  lunisolar('2024-07-06', 2024, 6, 1, false, 120),
  lunisolar('2024-12-01', 2024, 11, 1, false, 270),
  lunisolar('2024-12-31', 2024, 12, 1, false, 300),
  lunisolar('2025-01-01', 2024, 12, 2, false, 300),
]

module.exports = {
  NAOJ_LUNISOLAR_FIXTURES,
  NAOJ_LUNISOLAR_SOURCE,
}
