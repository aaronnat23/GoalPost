// Credit Management Utilities
// Handle credit checks, deductions, and tracking

import { prisma } from "@/lib/db/prisma";
import { ActionType } from "@prisma/client";

export class InsufficientCreditsError extends Error {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}`
    );
    this.name = "InsufficientCreditsError";
  }
}

// Get credit cost for an action
export async function getActionCost(
  action: ActionType,
  units: number = 1
): Promise<number> {
  const pricing = await prisma.pricingMatrix.findUnique({
    where: { action },
  });

  if (!pricing || !pricing.isActive) {
    throw new Error(`No pricing found for action: ${action}`);
  }

  const cost = pricing.creditsPerUnit * units;
  return Math.max(cost, pricing.minCharge);
}

// Check if org has enough credits
export async function checkCredits(
  orgId: string,
  requiredCredits: number
): Promise<boolean> {
  const wallet = await prisma.creditWallet.findUnique({
    where: { orgId },
  });

  if (!wallet) {
    return false;
  }

  return wallet.balance >= requiredCredits;
}

// Deduct credits from wallet (atomic operation)
export async function deductCredits(
  orgId: string,
  amount: number,
  reason: string,
  refId?: string,
  metadata?: any
): Promise<void> {
  // First, verify sufficient credits
  const wallet = await prisma.creditWallet.findUnique({
    where: { orgId },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.balance < amount) {
    throw new InsufficientCreditsError(amount, wallet.balance);
  }

  // Perform atomic deduction
  await prisma.$transaction([
    // Deduct from wallet
    prisma.creditWallet.update({
      where: { orgId },
      data: {
        balance: { decrement: amount },
        lifetimeSpent: { increment: amount },
      },
    }),
    // Record transaction
    prisma.creditTxn.create({
      data: {
        orgId,
        delta: -amount,
        reason: "USAGE",
        refId,
        metadata: {
          reason,
          ...metadata,
        },
      },
    }),
  ]);
}

// Add credits to wallet (for purchases, grants, etc.)
export async function addCredits(
  orgId: string,
  amount: number,
  reason: "PURCHASE" | "REFUND" | "ADMIN_GRANT" | "TRIAL_BONUS",
  refId?: string,
  metadata?: any
): Promise<void> {
  // Ensure wallet exists
  const wallet = await prisma.creditWallet.upsert({
    where: { orgId },
    create: {
      orgId,
      balance: amount,
      lifetimeSpent: 0,
    },
    update: {
      balance: { increment: amount },
    },
  });

  // Record transaction
  await prisma.creditTxn.create({
    data: {
      orgId,
      delta: amount,
      reason,
      refId,
      metadata,
    },
  });
}

// Get wallet balance
export async function getWalletBalance(orgId: string): Promise<number> {
  const wallet = await prisma.creditWallet.findUnique({
    where: { orgId },
  });

  return wallet?.balance || 0;
}

// Estimate credits for content generation
export interface GenerationEstimate {
  outline: number;
  draft: number;
  seoScore: number;
  total: number;
}

export async function estimateGenerationCost(
  wordCount: number = 1500
): Promise<GenerationEstimate> {
  const [outlineCost, draftCost, scoreoCost] = await Promise.all([
    getActionCost("OUTLINE", 1),
    getActionCost("DRAFT", Math.ceil(wordCount / 1000)),
    getActionCost("SEO_SCORE", 1),
  ]);

  return {
    outline: outlineCost,
    draft: draftCost,
    seoScore: scoreoCost,
    total: outlineCost + draftCost + scoreoCost,
  };
}
