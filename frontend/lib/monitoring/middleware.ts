// API logging middleware
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

export function withLogging(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const path = req.nextUrl.pathname;
    const method = req.method;

    try {
      logger.apiRequest(method, path);

      const response = await handler(req, ...args);

      const duration = Date.now() - start;
      logger.apiResponse(method, path, response.status, duration);

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('API error', {
        method,
        path,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      throw error;
    }
  };
}

export function withErrorHandling(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      logger.error('Unhandled API error', error instanceof Error ? error : new Error(String(error)));

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
        },
        { status: 500 }
      );
    }
  };
}
