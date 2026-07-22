const THAI_OFFICIAL_SOURCE = {
  name: 'PyThaiNLP thai_lunar_date.py and its porting source',
  url: 'https://raw.githubusercontent.com/PyThaiNLP/pythainlp/dev/pythainlp/util/thai_lunar_date.py',
  portUrl: 'https://gist.github.com/touchiep/99f4f5bb349d6b983ef78697630ab78e',
}

const THAI_OFFICIAL_YEAR_FIXTURES = [
  { year: 2024, type: 'normal', length: 354 },
  { year: 2025, type: 'intercalary-day', length: 355 },
  { year: 2026, type: 'intercalary-month', length: 384 },
]

const THAI_OFFICIAL_DATE_FIXTURES = [
  {
    iso: '1970-01-01T00:00:00Z',
    year: 2513,
    month: 1,
    day: 24,
    isLeap: false,
  },
  {
    iso: '2026-07-14T17:00:00Z',
    year: 2569,
    month: 8,
    day: 1,
    isLeap: true,
  },
]

module.exports = {
  THAI_OFFICIAL_DATE_FIXTURES,
  THAI_OFFICIAL_SOURCE,
  THAI_OFFICIAL_YEAR_FIXTURES,
}
