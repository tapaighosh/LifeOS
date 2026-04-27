---
description: Standardized unit test generation workflow for LifeOS
---

# Generate Tests Workflow

Use this workflow to generate comprehensive unit tests for any module or file.

## Steps

1. **Identify the target** — Read the source file(s) to be tested.

2. **Read test cases** — Check `.ai-context/test_cases.md` for pre-defined scenarios relevant to this module.

3. **Determine test scope**:
   - **API routes:** Test with mocked MongoDB + mocked AI services
   - **Business logic (lib/):** Test with `mongodb-memory-server` for real DB operations
   - **React components:** Test with React Testing Library + MSW for API mocking
   - **AI layer:** Test with mocked Claude/Gemini responses

4. **Generate tests following AAA pattern**:
   ```
   // Arrange — Set up test data, mocks, fixtures
   // Act — Execute the function/endpoint being tested
   // Assert — Verify the expected outcome
   ```

5. **Test categories to cover**:
   - ✅ **Happy path** — Normal successful operation
   - ❌ **Error cases** — Invalid input, missing data, unauthorized access
   - 🔒 **Auth/session** — NextAuth session enforcement
   - ⏱️ **Edge cases** — Boundary values, empty inputs, time slot overflow
   - 🤖 **AI fallback** — Claude down, Gemini down, both down → rule-based fallback
   - 📊 **Pillar balance** — Verify pillar distribution logic
   - 🔄 **Revision system** — Spaced repetition cycle calculations
   - ⚡ **Energy rules** — High energy tasks blocked in late slots

6. **API route test structure**:
   ```typescript
   // File: tests/api/test-{resource}.ts
   import { createMocks } from 'node-mocks-http';
   
   describe('GET /api/{resource}', () => {
     it('should return data for authenticated user', async () => {
       // Arrange
       const { req, res } = createMocks({ method: 'GET' });
       // ... mock NextAuth session
       
       // Act
       await handler(req, res);
       
       // Assert
       expect(res._getStatusCode()).toBe(200);
     });
   });
   ```

7. **Business logic test structure**:
   ```typescript
   // File: tests/lib/test-{module}.ts
   import { MongoMemoryServer } from 'mongodb-memory-server';
   
   describe('SlotCalculator', () => {
     let mongoServer: MongoMemoryServer;
     
     beforeAll(async () => {
       mongoServer = await MongoMemoryServer.create();
       // connect to in-memory DB
     });
     
     it('should calculate available slots based on wake/sleep time', () => {
       // Arrange
       const settings = { wake_time: '06:00', leave_time: '09:00' };
       
       // Act
       const slots = calculateSlots(settings);
       
       // Assert
       expect(slots.morning.duration).toBe(180); // 3 hours
     });
   });
   ```

8. **Component test structure**:
   ```typescript
   // File: tests/components/test-{Component}.tsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import { describe, it, expect } from 'vitest';
   
   describe('TaskCard', () => {
     it('should render task with correct pillar badge', () => {
       // Arrange
       render(<TaskCard task={mockTask} />);
       
       // Act & Assert
       expect(screen.getByText('System Design Study')).toBeInTheDocument();
       expect(screen.getByText('💰')).toBeInTheDocument();
     });
   });
   ```

9. **Mocking rules**:
   - Mock ALL external services (Claude API, Gemini API, MongoDB in unit tests)
   - Use `mongodb-memory-server` for integration tests that need real DB
   - Use factories for test data — never hardcode inline
   - Create a `tests/fixtures/` directory for reusable test data
   - Mock `fetch` for AI API calls — return realistic but static responses

10. **AI-specific test scenarios**:
    - Claude returns valid JSON → plan saved successfully
    - Claude returns malformed JSON → retry once, then fallback
    - Claude timeout (>30s) → fallback to rule-based scheduler
    - Claude rate limited (429) → switch to Gemini
    - Both AI providers down → rule-based fallback, user notified
    - AI suggests >5.5 hours of tasks → validator rejects, recalculates

11. **Coverage target**: 80% minimum per module.

12. **Log the generation** to `.ai-context/prompt_history.md`.
