import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        priceUsd: 'asc',
      },
    });

    // Convert Decimal to number for JSON serialization
    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      priceUsd: Number(pkg.priceUsd),
    }));

    return NextResponse.json({ packages: formattedPackages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
