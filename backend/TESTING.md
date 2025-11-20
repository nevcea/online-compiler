# Backend Testing Guide

## Overview

The backend test suite uses Jest as the testing framework with TypeScript support via ts-jest. The tests are organized into unit tests and integration tests covering critical components of the online compiler backend.

## Test Structure

```
backend/
├── __tests__/
│   ├── routes/          # Integration tests for API routes
│   │   ├── execute.test.ts
│   │   └── health.test.ts
│   └── utils/           # Unit tests for utility functions
│       ├── errorHandling.test.ts
│       ├── pathUtils.test.ts
│       └── validation.test.ts
├── jest.config.js       # Jest configuration
└── package.json         # Test scripts and dependencies
```

## Running Tests

### Run all tests
```bash
cd backend
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Coverage

### Validation Utilities (`utils/validation.test.ts`)
Tests cover:
- **validateLanguage()**: Ensures only supported languages are accepted
- **validateImage()**: Validates Docker image strings
- **sanitizeCode()**: Tests dangerous pattern detection and code sanitization
- **validateJavaClass()**: Verifies Java class structure validation

### Path Utilities (`utils/pathUtils.test.ts`)
Tests cover:
- **normalizePath()**: Path normalization across platforms
- **validatePath()**: Path validation and security checks
- **convertToDockerPath()**: Windows to Docker path conversion
- **getContainerCodePath()**: Language-specific container path resolution

### Error Handling Utilities (`utils/errorHandling.test.ts`)
Tests cover:
- **filterDockerMessages()**: Filters out Docker pull messages and ANSI codes
- **sanitizeError()**: Sanitizes error messages for logging
- **sanitizeErrorForUser()**: Provides user-friendly error messages in Korean

### Health Route (`routes/health.test.ts`)
Integration tests for the `/api/health` endpoint:
- Returns correct status response
- Handles multiple requests properly
- Returns expected JSON structure

### Execute Route (`routes/execute.test.ts`)
Validation tests for the `/api/execute` endpoint:
- Input validation (required fields, types, lengths)
- Language support verification
- Dangerous pattern detection
- Error handling for invalid requests

## Key Testing Patterns

### 1. Dangerous Pattern Detection
The test suite verifies that security-critical patterns are properly rejected:
- System commands (rm -rf, docker, sudo, etc.)
- Filesystem operations (mount, format, fdisk, etc.)
- Network commands (nc, netcat, nmap, etc.)
- Permission changes (chmod, chown, etc.)

### 2. User-Friendly Error Messages
Tests ensure that technical Docker errors are converted to user-friendly Korean messages:
- Docker not running → "Docker가 실행되지 않았습니다..."
- Docker not installed → "Docker가 설치되지 않았습니다..."
- Image not found → "Docker 이미지를 찾을 수 없습니다..."
- Permission errors → "Docker 권한 오류가 발생했습니다..."

### 3. Cross-Platform Path Handling
Tests verify correct path handling across Windows and Unix-like systems:
- Path normalization
- Docker path format conversion
- Security validation to prevent path traversal

## Test Statistics

Current test results:
- **97 tests total**
- **92 passed**
- **5 skipped** (cache-dependent tests)
- **5 test suites** (all passing)

## Skipped Tests

Some tests related to `kotlinCompilerExistsOnHost()` are skipped because they:
- Depend on filesystem mocking that conflicts with actual cache implementation
- Would require clearing runtime caches between tests
- Are better suited for integration tests with actual filesystem

## Best Practices

### When adding new tests:

1. **Place tests in the appropriate directory**
   - Unit tests for utilities go in `__tests__/utils/`
   - Integration tests for routes go in `__tests__/routes/`

2. **Follow naming conventions**
   - Test files: `*.test.ts`
   - Test descriptions should be clear and specific

3. **Use proper assertions**
   - Use `toBe()` for primitive values
   - Use `toEqual()` for objects/arrays
   - Use `toThrow()` for error testing

4. **Mock external dependencies**
   - Mock file system operations when needed
   - Mock Docker execution for unit tests
   - Keep mocks simple and focused

5. **Test edge cases**
   - Empty strings, null, undefined
   - Maximum length inputs
   - Invalid types
   - Special characters

## Integration with CI/CD

The test suite is integrated into the root test script (`scripts/test.cjs`) and runs as part of:
- Pre-commit checks
- CI/CD pipeline
- Manual testing via `npm test` from root

## Future Improvements

Potential areas for test expansion:
1. Integration tests with actual Docker execution (requires test containers)
2. Performance tests for code execution timeouts
3. Load testing for rate limiting
4. E2E tests for full request/response cycles
5. Tests for Docker image preloading and warmup logic

## Troubleshooting

### Tests failing with "Cannot find module"
- Ensure dependencies are installed: `npm install`
- Check TypeScript configuration in `tsconfig.json`

### Mock-related failures
- Clear Jest cache: `npx jest --clearCache`
- Check that mocks are properly set up in test files

### Coverage not generating
- Ensure Jest configuration includes coverage settings
- Check that `collectCoverageFrom` patterns match your files

## Dependencies

Main testing dependencies:
- `jest`: Testing framework
- `@types/jest`: TypeScript types for Jest
- `ts-jest`: TypeScript preprocessor for Jest
- `supertest`: HTTP assertions (for future route testing)
- `@types/supertest`: TypeScript types for Supertest
