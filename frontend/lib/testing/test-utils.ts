// Testing utilities
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock user for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER' as const,
};

export const mockAdmin = {
  id: 'test-admin-id',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'ADMIN' as const,
};

// Mock organization
export const mockOrg = {
  id: 'test-org-id',
  name: 'Test Organization',
  ownerUserId: mockUser.id,
  createdAt: new Date(),
};

// Mock project
export const mockProject = {
  id: 'test-project-id',
  orgId: mockOrg.id,
  name: 'Test Project',
  niche: 'Technology',
  locale: 'en-US',
  createdAt: new Date(),
};

// Custom render function for React Testing Library
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

export * from '@testing-library/react';
export { customRender as render };

// API mocking helpers
export function mockFetch(response: any, status = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
    } as Response)
  );
}

export function mockFetchError(error: string) {
  global.fetch = jest.fn(() => Promise.reject(new Error(error)));
}

// Prisma mock helpers
export function createMockPrismaClient() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    org: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    creditWallet: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    creditTxn: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(this)),
  };
}
