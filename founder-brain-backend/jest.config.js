module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts',
    '**/tests/e2e/**/*.test.ts',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': require.resolve('uuid')
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/app.ts',
    '!src/server.ts',
    '!src/types/**',
    '!src/config/environment.ts',
    '!src/monitoring/health/HealthChecker.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json', 'clover'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setup.ts'],
  globalTeardown: '<rootDir>/tests/setup/teardown.ts',
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid)/)',
  ],
};
