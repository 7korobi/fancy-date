const NAOJ_LUNAR_PHASE_SOURCE = {
  title: '国立天文台 暦要項 朔弦望',
  timezone: 'JST',
  accuracy: 'minute',
  urls: {
    2020: 'https://eco.mtk.nao.ac.jp/koyomi/yoko/2020/rekiyou203.html',
    2021: 'https://eco.mtk.nao.ac.jp/koyomi/yoko/2021/rekiyou213.html',
    2024: 'https://eco.mtk.nao.ac.jp/koyomi/yoko/2024/rekiyou243.html',
    2026: 'https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou263.html',
  },
}

const LUNAR_PHASES = {
  朔: 0,
  上弦: 0.25,
  望: 0.5,
  下弦: 0.75,
}

function lunarPhase(year, name, month, day, hour, minute) {
  return {
    year,
    name,
    phase: LUNAR_PHASES[name],
    jst: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(
      hour,
    ).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`,
  }
}

const NAOJ_LUNAR_PHASE_FIXTURES = [
  lunarPhase(2020, '上弦', 1, 3, 13, 45),
  lunarPhase(2020, '望', 1, 11, 4, 21),
  lunarPhase(2020, '下弦', 1, 17, 21, 58),
  lunarPhase(2020, '朔', 1, 25, 6, 42),
  lunarPhase(2020, '朔', 3, 24, 18, 28),
  lunarPhase(2020, '朔', 6, 21, 15, 41),
  lunarPhase(2020, '望', 10, 31, 23, 49),

  lunarPhase(2021, '下弦', 1, 6, 18, 37),
  lunarPhase(2021, '朔', 1, 13, 14, 0),
  lunarPhase(2021, '上弦', 1, 21, 6, 2),
  lunarPhase(2021, '望', 1, 29, 4, 16),
  lunarPhase(2021, '望', 5, 26, 20, 14),
  lunarPhase(2021, '朔', 12, 4, 16, 43),

  lunarPhase(2024, '下弦', 1, 4, 12, 30),
  lunarPhase(2024, '朔', 1, 11, 20, 57),
  lunarPhase(2024, '上弦', 1, 18, 12, 53),
  lunarPhase(2024, '望', 1, 26, 2, 54),
  lunarPhase(2024, '下弦', 3, 4, 0, 23),
  lunarPhase(2024, '朔', 3, 10, 18, 0),
  lunarPhase(2024, '上弦', 3, 17, 13, 11),
  lunarPhase(2024, '望', 3, 25, 16, 0),
  lunarPhase(2024, '朔', 4, 9, 3, 21),
  lunarPhase(2024, '望', 4, 24, 8, 49),
  lunarPhase(2024, '朔', 7, 6, 7, 57),
  lunarPhase(2024, '望', 7, 21, 19, 17),
  lunarPhase(2024, '朔', 12, 31, 7, 27),

  lunarPhase(2026, '望', 1, 3, 19, 3),
  lunarPhase(2026, '下弦', 1, 11, 0, 48),
  lunarPhase(2026, '朔', 1, 19, 4, 52),
  lunarPhase(2026, '上弦', 1, 26, 13, 47),
  lunarPhase(2026, '朔', 3, 19, 10, 23),
  lunarPhase(2026, '望', 12, 24, 10, 28),
]

module.exports = {
  LUNAR_PHASES,
  NAOJ_LUNAR_PHASE_FIXTURES,
  NAOJ_LUNAR_PHASE_SOURCE,
}
