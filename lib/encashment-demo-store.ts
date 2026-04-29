"use client";

import * as React from "react";
import { DEMO_ACCOUNTANT, type EncashmentRowData } from "@/lib/data/encashment";
import type { EncashmentRouting } from "@/lib/encashment-cash-position";

const STORAGE_LEGACY = "dms-encashment-demo-v1";
const STORAGE = "dms-encashment-demo-v2";

export type AuditEntry = {
  at: string;
  userId: string;
  displayName: string;
  action: string;
};

export type ManualAdjustment = {
  id: string;
  amount: number;
  note?: string;
};

export type EncashmentRowWorkflow = {
  reviewed: boolean;
  approved: boolean;
  exceptionFlag: boolean;
  manualAdjustments: ManualAdjustment[];
  audit: AuditEntry[];
};

export type BankDepositEntry = {
  id: string;
  amount: number;
  depositedAt: string;
  /** When set, this deposit line is linked to an encashment table row (Bank column). */
  sourceEncashmentRowId?: string;
  /** When set, deposit was created from an office-safe bundle relay */
  sourceSafeAddId?: string;
  /** Third control: controller confirms deposit hit the bank account */
  depositConfirmed?: boolean;
  confirmedAt?: string;
};

export type SafeAddEntry = {
  id: string;
  amount: number;
  at: string;
  /** From encashment table row — prevents duplicate routing */
  sourceEncashmentRowId?: string;
  kioskLabel?: string;
  /** Linked safe→bank ledger line after relay */
  safeToBankEntryId?: string;
  relayAt?: string;
};

export type SafeToBankEntry = {
  id: string;
  amount: number;
  depositedAt: string;
  /** e.g. which collection day / correction reason */
  note?: string;
  /** Linked office-safe bundle when created via relay */
  sourceSafeAddId?: string;
  recordedByUserId?: string;
  recordedByDisplayName?: string;
};

export type ReportLedger = {
  bankDeposits: BankDepositEntry[];
  safeAdds: SafeAddEntry[];
  safeToBank: SafeToBankEntry[];
};

type StoredBlob = {
  byReport: Record<string, Record<string, EncashmentRowWorkflow>>;
  ledgerByReport: Record<string, ReportLedger>;
};

function emptyLedger(): ReportLedger {
  return { bankDeposits: [], safeAdds: [], safeToBank: [] };
}

function emptyWorkflow(): EncashmentRowWorkflow {
  return {
    reviewed: false,
    approved: false,
    exceptionFlag: false,
    manualAdjustments: [],
    audit: [],
  };
}

function normalizeWorkflow(w: EncashmentRowWorkflow | undefined): EncashmentRowWorkflow {
  if (!w) return emptyWorkflow();
  return {
    ...emptyWorkflow(),
    ...w,
    manualAdjustments: Array.isArray(w.manualAdjustments) ? w.manualAdjustments : [],
    audit: Array.isArray(w.audit) ? w.audit : [],
  };
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function migrateLegacyRow(w: unknown): EncashmentRowWorkflow {
  const o = w as Record<string, unknown>;
  const manualAdjustments = Array.isArray(o.manualAdjustments)
    ? (o.manualAdjustments as ManualAdjustment[])
    : [];
  return {
    reviewed: Boolean(o.reviewed),
    approved: Boolean(o.approved),
    exceptionFlag: Boolean(o.exceptionFlag),
    manualAdjustments,
    audit: Array.isArray(o.audit) ? (o.audit as AuditEntry[]) : [],
  };
}

function normalizeBankDeposit(b: BankDepositEntry): BankDepositEntry {
  const depositConfirmed =
    typeof b.depositConfirmed === "boolean" ? b.depositConfirmed : true;
  return {
    ...b,
    depositConfirmed,
    confirmedAt: b.confirmedAt,
  };
}

function normalizeLedger(ledger: ReportLedger): ReportLedger {
  return {
    ...ledger,
    bankDeposits: ledger.bankDeposits.map(normalizeBankDeposit),
    safeAdds: ledger.safeAdds.map((s) => normalizeSafeAdd(s, ledger)),
  };
}

function normalizeSafeAdd(
  s: SafeAddEntry & { bankRelayDepositId?: string; bankRelayAt?: string },
  ledger: ReportLedger
): SafeAddEntry {
  let safeToBankEntryId = s.safeToBankEntryId;
  if (!safeToBankEntryId && s.bankRelayDepositId) {
    const match = ledger.safeToBank.find((x) => x.sourceSafeAddId === s.id);
    if (match) safeToBankEntryId = match.id;
  }
  const relayAt = s.relayAt ?? s.bankRelayAt;
  return {
    id: s.id,
    amount: s.amount,
    at: s.at,
    sourceEncashmentRowId: s.sourceEncashmentRowId,
    kioskLabel: s.kioskLabel,
    safeToBankEntryId,
    relayAt,
  };
}

function normalizeStoredBlob(b: StoredBlob): StoredBlob {
  const ledgerByReport: Record<string, ReportLedger> = {};
  for (const rk of Object.keys(b.ledgerByReport)) {
    ledgerByReport[rk] = normalizeLedger(b.ledgerByReport[rk]);
  }
  return { ...b, ledgerByReport };
}

function loadBlob(): StoredBlob {
  if (typeof window === "undefined") {
    return { byReport: {}, ledgerByReport: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const p = JSON.parse(raw) as StoredBlob;
      if (p.byReport && p.ledgerByReport) return normalizeStoredBlob(p);
    }
    const legacyRaw = localStorage.getItem(STORAGE_LEGACY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as {
        byReport?: Record<string, Record<string, unknown>>;
        bankByReport?: Record<
          string,
          { batchId: string; at: string; totalAmount: number } | null
        >;
      };
      const byReport: Record<string, Record<string, EncashmentRowWorkflow>> = {};
      if (legacy.byReport) {
        for (const rk of Object.keys(legacy.byReport)) {
          const m = legacy.byReport[rk];
          const next: Record<string, EncashmentRowWorkflow> = {};
          for (const id of Object.keys(m)) {
            next[id] = migrateLegacyRow(m[id]);
          }
          byReport[rk] = next;
        }
      }
      const ledgerByReport: Record<string, ReportLedger> = {};
      if (legacy.bankByReport) {
        for (const rk of Object.keys(legacy.bankByReport)) {
          const b = legacy.bankByReport[rk];
          const ledger = emptyLedger();
          if (b && b.totalAmount > 0) {
            ledger.bankDeposits.push({
              id: newId("bank"),
              amount: b.totalAmount,
              depositedAt: b.at,
              depositConfirmed: true,
            });
          }
          ledgerByReport[rk] = ledger;
        }
      }
      const migrated = { byReport, ledgerByReport };
      saveBlob(migrated);
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return { byReport: {}, ledgerByReport: {} };
}

function saveBlob(b: StoredBlob) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

export function getOpeningSafeDefault(): number {
  return 85_000;
}

function pushAudit(
  w: EncashmentRowWorkflow,
  action: string
): EncashmentRowWorkflow {
  return {
    ...w,
    audit: [
      ...w.audit,
      {
        at: new Date().toISOString(),
        userId: DEMO_ACCOUNTANT.userId,
        displayName: DEMO_ACCOUNTANT.displayName,
        action,
      },
    ],
  };
}

export function mergeWorkflow(
  row: EncashmentRowData,
  w: EncashmentRowWorkflow | undefined
): EncashmentRowWorkflow & {
  effectiveException: boolean;
  routing: EncashmentRouting;
} {
  const base = normalizeWorkflow(w);
  const reviewed = base.approved ? true : base.reviewed;
  const effectiveException =
    base.exceptionFlag || (row.hasNumericMismatch && !base.approved);
  return { ...base, reviewed, effectiveException, routing: "standard" };
}

export function sumManualAdjustmentsForRow(w: EncashmentRowWorkflow): number {
  return w.manualAdjustments.reduce((a, m) => a + m.amount, 0);
}

export function useEncashmentDemoStore(reportKey: string, rows: EncashmentRowData[]) {
  const [blob, setBlob] = React.useState<StoredBlob>(() =>
    typeof window !== "undefined"
      ? loadBlob()
      : { byReport: {}, ledgerByReport: {} }
  );
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setBlob(loadBlob());
    setHydrated(true);
  }, [reportKey]);

  const getLedger = React.useCallback((): ReportLedger => {
    return blob.ledgerByReport[reportKey] ?? emptyLedger();
  }, [blob.ledgerByReport, reportKey]);

  const updateLedger = React.useCallback(
    (fn: (cur: ReportLedger) => ReportLedger) => {
      setBlob((b) => {
        const cur = b.ledgerByReport[reportKey] ?? emptyLedger();
        const ledgerByReport = {
          ...b.ledgerByReport,
          [reportKey]: fn(cur),
        };
        const next = { ...b, ledgerByReport };
        saveBlob(next);
        return next;
      });
    },
    [reportKey]
  );

  const updateRow = React.useCallback(
    (
      rowId: string,
      fn: (w: EncashmentRowWorkflow) => EncashmentRowWorkflow
    ) => {
      setBlob((b) => {
        const byReport = { ...b.byReport };
        const map = { ...(byReport[reportKey] ?? {}) };
        const cur = normalizeWorkflow(map[rowId]);
        map[rowId] = fn(cur);
        byReport[reportKey] = map;
        const next = { ...b, byReport };
        saveBlob(next);
        return next;
      });
    },
    [reportKey]
  );

  const toggleReview = React.useCallback(
    (rowId: string) => {
      updateRow(rowId, (w) => {
        if (w.approved) return w;
        const reviewed = !w.reviewed;
        return pushAudit(
          { ...w, reviewed },
          reviewed ? "Marked as reviewed" : "Review cleared"
        );
      });
    },
    [updateRow]
  );

  const setExceptionFlag = React.useCallback(
    (rowId: string, value: boolean) => {
      updateRow(rowId, (w) =>
        pushAudit(
          { ...w, exceptionFlag: value },
          value ? "Exception flagged" : "Exception cleared"
        )
      );
    },
    [updateRow]
  );

  const approveRow = React.useCallback(
    (rowId: string) => {
      updateRow(rowId, (w) => {
        if (w.approved) return w;
        const next = { ...w, reviewed: true, approved: true };
        return pushAudit(next, "Approved");
      });
    },
    [updateRow]
  );

  const addManualAdjustment = React.useCallback(
    (rowId: string, amount: number, note?: string) => {
      updateRow(rowId, (w) => {
        if (w.approved) return w;
        const adj: ManualAdjustment = {
          id: newId("adj"),
          amount,
          note,
        };
        return pushAudit(
          {
            ...w,
            manualAdjustments: [...w.manualAdjustments, adj],
          },
          `Manual adjustment ${amount}${note ? `: ${note}` : ""}`
        );
      });
    },
    [updateRow]
  );

  const removeManualAdjustment = React.useCallback(
    (rowId: string, adjustmentId: string) => {
      updateRow(rowId, (w) =>
        pushAudit(
          {
            ...w,
            manualAdjustments: w.manualAdjustments.filter((x) => x.id !== adjustmentId),
          },
          "Manual adjustment removed"
        )
      );
    },
    [updateRow]
  );

  const addBankDeposit = React.useCallback(
    (
      amount: number,
      depositedAt: string,
      opts?: { sourceEncashmentRowId?: string }
    ) => {
      updateLedger((cur) => ({
        ...cur,
        bankDeposits: [
          ...cur.bankDeposits,
          {
            id: newId("bank"),
            amount,
            depositedAt,
            depositConfirmed: false,
            ...(opts?.sourceEncashmentRowId
              ? { sourceEncashmentRowId: opts.sourceEncashmentRowId }
              : {}),
          },
        ],
      }));
    },
    [updateLedger]
  );

  /** One ledger line per encashment row (Bank column); skips if a row-linked line already exists. */
  const recordBankDepositFromEncashmentRow = React.useCallback(
    (rowId: string, amount: number, depositedAt: string) => {
      updateLedger((cur) => {
        if (
          cur.bankDeposits.some((d) => d.sourceEncashmentRowId === rowId)
        ) {
          return cur;
        }
        if (cur.safeAdds.some((s) => s.sourceEncashmentRowId === rowId)) {
          return cur;
        }
        return {
          ...cur,
          bankDeposits: [
            ...cur.bankDeposits,
            {
              id: newId("bank"),
              amount,
              depositedAt,
              depositConfirmed: false,
              sourceEncashmentRowId: rowId,
            },
          ],
        };
      });
    },
    [updateLedger]
  );

  /**
   * Operator confirms cash from one office-safe bundle was deposited at the bank:
   * records safe→bank movement only (single path — no duplicate bank deposit line).
   */
  const relaySafeAddToBank = React.useCallback(
    (safeAddId: string) => {
      setBlob((b) => {
        const ledger = b.ledgerByReport[reportKey] ?? emptyLedger();
        const idx = ledger.safeAdds.findIndex((s) => s.id === safeAddId);
        if (idx < 0) return b;
        const sa = ledger.safeAdds[idx];
        if (sa.safeToBankEntryId) return b;

        const stbId = newId("stb");
        const today = new Date();
        const depositedAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T12:00:00.000Z`;

        const who = DEMO_ACCOUNTANT.displayName;
        const stLine: SafeToBankEntry = {
          id: stbId,
          amount: sa.amount,
          depositedAt,
          sourceSafeAddId: safeAddId,
          recordedByUserId: DEMO_ACCOUNTANT.userId,
          recordedByDisplayName: DEMO_ACCOUNTANT.displayName,
          note:
            sa.kioskLabel != null
              ? `Office safe → bank (${sa.kioskLabel}) · ${who}`
              : `Office safe bundle → bank · ${who}`,
        };

        const nextSafeAdds = [...ledger.safeAdds];
        nextSafeAdds[idx] = {
          ...sa,
          safeToBankEntryId: stbId,
          relayAt: new Date().toISOString(),
        };

        const safeToBank = [...ledger.safeToBank, stLine];

        let byReport = b.byReport;
        const auditMsg = `Sent ${sa.amount.toFixed(2)} TRY from office safe to bank`;
        if (sa.sourceEncashmentRowId) {
          const map = { ...(b.byReport[reportKey] ?? {}) };
          const curW = normalizeWorkflow(map[sa.sourceEncashmentRowId]);
          map[sa.sourceEncashmentRowId] = pushAudit(curW, auditMsg);
          byReport = { ...byReport, [reportKey]: map };
        }

        const ledgerByReport = {
          ...b.ledgerByReport,
          [reportKey]: {
            ...ledger,
            safeAdds: nextSafeAdds,
            safeToBank,
          },
        };
        const next = { ...b, byReport, ledgerByReport };
        saveBlob(next);
        return next;
      });
    },
    [reportKey]
  );

  const confirmBankDeposit = React.useCallback(
    (depositId: string) => {
      setBlob((b) => {
        const ledger = b.ledgerByReport[reportKey] ?? emptyLedger();
        const dep = ledger.bankDeposits.find((x) => x.id === depositId);
        if (!dep) return b;
        const bankDeposits = ledger.bankDeposits.map((d) =>
          d.id === depositId
            ? {
                ...d,
                depositConfirmed: true,
                confirmedAt: new Date().toISOString(),
              }
            : d
        );
        const ledgerByReport = {
          ...b.ledgerByReport,
          [reportKey]: { ...ledger, bankDeposits },
        };
        let byReport = b.byReport;
        if (dep.sourceEncashmentRowId) {
          const rowId = dep.sourceEncashmentRowId;
          const map = { ...(b.byReport[reportKey] ?? {}) };
          const curW = normalizeWorkflow(map[rowId]);
          map[rowId] = pushAudit(
            curW,
            `Bank deposit confirmed: ${dep.amount.toFixed(2)} TRY (statement verified)`
          );
          byReport = { ...b.byReport, [reportKey]: map };
        } else if (dep.sourceSafeAddId) {
          const sa = ledger.safeAdds.find((s) => s.id === dep.sourceSafeAddId);
          if (sa?.sourceEncashmentRowId) {
            const rowId = sa.sourceEncashmentRowId;
            const map = { ...(b.byReport[reportKey] ?? {}) };
            const curW = normalizeWorkflow(map[rowId]);
            map[rowId] = pushAudit(
              curW,
              `Bank deposit confirmed: ${dep.amount.toFixed(2)} TRY (office safe relay, statement verified)`
            );
            byReport = { ...b.byReport, [reportKey]: map };
          }
        }
        const next = { ...b, byReport, ledgerByReport };
        saveBlob(next);
        return next;
      });
    },
    [reportKey]
  );

  const removeBankDeposit = React.useCallback(
    (depositId: string) => {
      updateLedger((cur) => ({
        ...cur,
        bankDeposits: cur.bankDeposits.filter((x) => x.id !== depositId),
      }));
    },
    [updateLedger]
  );

  const addSafeDeposit = React.useCallback(
    (amount: number) => {
      updateLedger((cur) => ({
        ...cur,
        safeAdds: [
          ...cur.safeAdds,
          { id: newId("safe"), amount, at: new Date().toISOString() },
        ],
      }));
    },
    [updateLedger]
  );

  /** Book approved line total (MPS + manual adjustments) into office safe; one entry per encashment row. */
  const routeRowToOfficeSafe = React.useCallback(
    (rowId: string, amount: number, kioskLabel: string): boolean => {
      let ok = false;
      setBlob((b) => {
        const ledger = b.ledgerByReport[reportKey] ?? emptyLedger();
        if (ledger.safeAdds.some((s) => s.sourceEncashmentRowId === rowId)) {
          return b;
        }
        if (ledger.bankDeposits.some((d) => d.sourceEncashmentRowId === rowId)) {
          return b;
        }
        const map = { ...(b.byReport[reportKey] ?? {}) };
        const curW = normalizeWorkflow(map[rowId]);
        map[rowId] = pushAudit(
          curW,
          `Booked to office safe: ${amount.toFixed(2)} TRY (effective line)`
        );
        const byReport = { ...b.byReport, [reportKey]: map };
        const ledgerByReport = {
          ...b.ledgerByReport,
          [reportKey]: {
            ...ledger,
            safeAdds: [
              ...ledger.safeAdds,
              {
                id: newId("safe"),
                amount,
                at: new Date().toISOString(),
                sourceEncashmentRowId: rowId,
                kioskLabel,
              },
            ],
          },
        };
        ok = true;
        const next = { ...b, byReport, ledgerByReport };
        saveBlob(next);
        return next;
      });
      return ok;
    },
    [reportKey]
  );

  const removeSafeDeposit = React.useCallback(
    (id: string) => {
      updateLedger((cur) => {
        const s = cur.safeAdds.find((x) => x.id === id);
        if (s?.safeToBankEntryId) return cur;
        return {
          ...cur,
          safeAdds: cur.safeAdds.filter((x) => x.id !== id),
        };
      });
    },
    [updateLedger]
  );

  const addSafeToBank = React.useCallback(
    (amount: number, depositedAt: string, note?: string) => {
      updateLedger((cur) => ({
        ...cur,
        safeToBank: [
          ...cur.safeToBank,
          { id: newId("stb"), amount, depositedAt, note },
        ],
      }));
    },
    [updateLedger]
  );

  const removeSafeToBank = React.useCallback(
    (id: string) => {
      updateLedger((cur) => ({
        ...cur,
        safeToBank: cur.safeToBank.filter((x) => x.id !== id),
      }));
    },
    [updateLedger]
  );

  const resetReportDemo = React.useCallback(() => {
    setBlob((b) => {
      const byReport = { ...b.byReport };
      delete byReport[reportKey];
      const ledgerByReport = { ...b.ledgerByReport };
      delete ledgerByReport[reportKey];
      const next = { ...b, byReport, ledgerByReport };
      saveBlob(next);
      return next;
    });
  }, [reportKey]);

  const ledger = getLedger();

  const withWorkflow = React.useMemo(() => {
    const map = blob.byReport[reportKey] ?? {};
    return rows.map((r) => {
      const w = mergeWorkflow(r, map[r.id]);
      return { row: r, workflow: w };
    });
  }, [rows, blob.byReport, reportKey]);

  return {
    hydrated,
    openingSafeBalance: getOpeningSafeDefault(),
    ledger,
    withWorkflow,
    toggleReview,
    setExceptionFlag,
    approveRow,
    addManualAdjustment,
    removeManualAdjustment,
    addBankDeposit,
    recordBankDepositFromEncashmentRow,
    confirmBankDeposit,
    removeBankDeposit,
    addSafeDeposit,
    routeRowToOfficeSafe,
    removeSafeDeposit,
    addSafeToBank,
    removeSafeToBank,
    relaySafeAddToBank,
    resetReportDemo,
  };
}
