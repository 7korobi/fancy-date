const { is_windows } = require('./os')

module.exports = {
  testMatch: ['<rootDir>/__tests__/*.+(js)'],
  moduleFileExtensions: ['js', 'yml'],
  transform: {
    '^.+\\.yml$': 'yaml-jest',
  },
}
