module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*_test.ts'],
  transform: {
    '^.+\\.tsx?$': require.resolve('ts-jest'),
  },
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
};
