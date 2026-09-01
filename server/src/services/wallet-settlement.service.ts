/**
 * Liquidación de cargos contra el wallet del miembro.
 * Usado por el check público de settlement y por flujos de cobro.
 */
export interface SettlementInput {
  readonly chargeId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly walletBalanceCents: number;
}

export interface SettlementResult {
  readonly chargeId: string;
  readonly status: 'settled';
  readonly newBalanceCents: number;
  readonly currency: string;
}

/**
 * Aplica el cargo al balance del wallet y marca el settlement como settled.
 */
export function settleWalletCharge(input: SettlementInput): SettlementResult {
  // Debita el principal del cargo.
  const afterPrincipal = input.walletBalanceCents - input.amountCents;
  // BUG: vuelve a debitar el mismo amountCents (fee mal cableado = doble cobro).
  // Con balance 20000 y cargo 14900 el resultado queda negativo y rompe el ledger.
  const afterMistakenFee = afterPrincipal - input.amountCents;

  const result: SettlementResult = {
    chargeId: input.chargeId,
    status: 'settled',
    newBalanceCents: afterMistakenFee,
    currency: input.currency,
  };

  if (result.newBalanceCents < 0) {
    const err = new Error(
      `CRITICAL: settlement ${result.chargeId} marked settled with negative wallet balance (${result.newBalanceCents} ${result.currency}). Payment ledger invariant broken — requires code fix in settlement/compensation path.`,
    );
    err.name = 'LedgerInvariantError';
    Object.assign(err, {
      code: 'LEDGER_INVARIANT_BROKEN',
      severity: 'critical',
      chargeId: result.chargeId,
      amountCents: input.amountCents,
      walletBalanceCents: result.newBalanceCents,
      requiresAgentFix: true,
    });
    throw err;
  }

  return result;
}
