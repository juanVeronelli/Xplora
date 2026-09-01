import type { RequestHandler } from 'express';
import { settleWalletCharge } from '../../services/wallet-settlement.service.js';

/**
 * Check público de liquidación de wallet (demo operativa).
 * Dispara la ruta de settlement real; si el servicio está roto, responde 500.
 */
export function createPublicWalletSettlementCheckHandler(): RequestHandler {
  return (_req, res) => {
    const settlement = settleWalletCharge({
      chargeId: 'chg_live_xplora_settlement',
      amountCents: 14_900,
      currency: 'ARS',
      walletBalanceCents: 20_000,
    });

    res.json({
      ok: true,
      settlement,
    });
  };
}
