// Mock console.error to suppress debug logs during tests
global.console.error = jest.fn();

// Reset mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});
