// API response utilities
import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

export function errorResponse(
  message: string,
  status = 500,
  code?: string,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  )
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}

// Legacy aliases kept to avoid breaking existing API handlers
export function apiResponse<T>(data: T, status = 200) {
  return successResponse(data, status)
}

export function apiError(
  message: string,
  status = 500,
  code?: string,
  details?: any
) {
  return errorResponse(message, status, code, details)
}
