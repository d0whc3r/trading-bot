// Jest extended => https://github.com/jest-community/jest-extended
require('jest-extended');

// Jest chain => https://github.com/mattphillips/jest-chain
require('jest-chain');

const JEST_TIMEOUT = 35 * 60 * 1000;

jest.setTimeout(JEST_TIMEOUT);
jest.useFakeTimers();

/**
 * Add beforeEach in general jest setup to ensure all tests have at least one expect() call
 */
beforeEach(() => {
  expect.hasAssertions();
});
