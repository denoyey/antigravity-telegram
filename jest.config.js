/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testTimeout: 15000,
    maxWorkers: '50%',
    roots: ['<rootDir>/tests'],
    testPathIgnorePatterns: [
        '<rootDir>/tests/services/responseMonitor.test.ts',
        '<rootDir>/tests/services/responseMonitor.stopButtonSelector.test.ts',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};
