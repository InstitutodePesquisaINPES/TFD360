module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!node_modules/**',
    '!scripts/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['./tests/helpers/setup.js']
}; 