"use client";

import * as React from "react";
import { DEMO_ACCOUNTANT, type EncashmentRowData } from "@/lib/data/encashment";
import {
  routeEncashment,
  type EncashmentRouting,
} from "@/lib/encashment-cash-position";

const STORAGE = "dms-encashment-demo-v1";
const CARRY_KEY = "dms-encashment-carry-v1";

export type AuditEntry = {
  at: string;
  userId: string;
  displayName: string;
  action: string;
};

export type EncashmentRowWorkflow = {
  reviewed: boolean;
  approved: boolean;
  /** User override: force exception on/off */
  exceptionFlag: boolean;
  /** Included in same-day bank batch */
  deposited: boolean;
  audit: AuditEntry[];
};

export type BankDepositInfo = {
  batchId: string;
  at: string;
  totalAmount: number;
};

type StoredBlob = {
  byReport: Record<string, Record<string, EncashmentRowWorkflow>>;
  bankByReport: Record<string, BankDepositInfo | null>;
};

function emptyWorkflow(): EncashmentRowWorkflow {
  return {
    reviewed: false,
    approved: false,
    exceptionFlag: false,
    deposited: false,
    audit: [],
  };
}

function loadBlob(): StoredBlob {
  if (typeof window === "undefined") {
    return { byReport: {}, bankByReport: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { byReport: {}, bankByReport: {} };
    const p = JSON.parse(raw) as StoredBlob;
    if (!p.byReport || !p.bankByReport) {
      return { byReport: {}, bankByReport: {} };
    }
    return p;
  } catch {
    return { byReport: {}, bankByReport: {} };
  }
}

function saveBlob(b: StoredBlob) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

export function getCarryForwardSafe(): number {
  if (typeof window === "undefined") return 85_000;
  const v = localStorage.getItem(CARRY_KEY);
  if (v == null) return 85_000;
  const n = Number(v);
  return Number.isFinite(n) ? n : 85_000;
}

export function setCarryForwardSafe(n: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARRY_KEY, String(n));
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
  w: EncashmentRowWorkflow | undefined,
  cutoff: string
): EncashmentRowWorkflow & { effectiveException: boolean; routing: EncashmentRouting } {
  const base = w ?? emptyWorkflow();
  const routing = routeEncashment(row.encashmentAt, cutoff);
  /** A signed-off row is always "reviewed"; avoids approved + review cleared breaking the UI. */
  const reviewed = base.approved ? true : base.reviewed;
  const effectiveException =
    base.exceptionFlag || (row.hasNumericMismatch && !base.approved);
  return { ...base, reviewed, effectiveException, routing };
}

export function useEncashmentDemoStore(
  reportKey: string,
  rows: EncashmentRowData[],
  cutoff: string
) {
  const [blob, setBlob] = React.useState<StoredBlob>(() =>
    typeof window !== "undefined" ? loadBlob() : { byReport: {}, bankByReport: {} }
  );
  const [carry, setCarry] = React.useState(() =>
    typeof window !== "undefined" ? getCarryForwardSafe() : 85_000
  );
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setBlob(loadBlob());
    setCarry(getCarryForwardSafe());
    setHydrated(true);
  }, [reportKey]);

  const getRowMap = React.useCallback(() => {
    return blob.byReport[reportKey] ?? {};
  }, [blob, reportKey]);

  const updateRow = React.useCallback(
    (
      rowId: string,
      fn: (w: EncashmentRowWorkflow) => EncashmentRowWorkflow
    ) => {
      setBlob((b) => {
        const byReport = { ...b.byReport };
        const map = { ...(byReport[reportKey] ?? {}) };
        const cur = map[rowId] ?? emptyWorkflow();
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
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const isPost = routeEncashment(row.encashmentAt, cutoff) === "post_cutoff_safe";
      updateRow(rowId, (w) => {
        if (w.deposited) return w;
        if (w.approved) return w;
        const next = { ...w, reviewed: true, approved: true };
        const action = isPost
          ? "Approved for office safe"
          : "Approved for same-day bank batch reconciliation";
        return pushAudit(next, action);
      });
    },
    [rows, updateRow, cutoff]
  );

  const resetReportDemo = React.useCallback(() => {
    setBlob((b) => {
      const byReport = { ...b.byReport };
      delete byReport[reportKey];
      const bankByReport = { ...b.bankByReport };
      delete bankByReport[reportKey];
      const next = { ...b, byReport, bankByReport };
      saveBlob(next);
      return next;
    });
  }, [reportKey]);

  const confirmBulkBankDeposit = React.useCallback((): {
    ok: true;
    batchId: string;
    at: string;
    totalAmount: number;
  } | { ok: false; reason: string } => {
    let out:
      | { ok: true; batchId: string; at: string; totalAmount: number }
      | { ok: false; reason: string } = { ok: false, reason: "No rows" };
    setBlob((b) => {
      const map = b.byReport[reportKey] ?? {};
      const eligible = rows.filter((r) => {
        const w = map[r.id] ?? emptyWorkflow();
        if (routeEncashment(r.encashmentAt, cutoff) !== "pre_cutoff_bank") {
          return false;
        }
        if (!w.reviewed || !w.approved || w.deposited) return false;
        return true;
      });

      if (eligible.length === 0) {
        out = { ok: false, reason: "No approved pre-cutoff rows" };
        return b;
      }

      const totalAmount = eligible.reduce((a, r) => a + r.mpsTotal, 0);
      const batchId = `BANK-${Date.now()}`;
      const at = new Date().toISOString();

      const byReport = { ...b.byReport };
      const m = { ...(byReport[reportKey] ?? {}) };
      for (const r of eligible) {
        const w = m[r.id] ?? emptyWorkflow();
        m[r.id] = pushAudit(
          { ...w, deposited: true, approved: true, reviewed: true },
          "Included in bank deposit batch"
        );
      }
      byReport[reportKey] = m;
      const bankByReport = {
        ...b.bankByReport,
        [reportKey]: { batchId, at, totalAmount },
      };
      const next = { ...b, byReport, bankByReport };
      saveBlob(next);
      out = { ok: true, batchId, at, totalAmount };
      return next;
    });
    return out;
  }, [rows, reportKey, cutoff]);

  const bankInfo = blob.bankByReport[reportKey] ?? null;

  const withWorkflow = React.useMemo(() => {
    const map = blob.byReport[reportKey] ?? {};
    return rows.map((r) => {
      const w = mergeWorkflow(r, map[r.id], cutoff);
      return { row: r, workflow: w };
    });
  }, [rows, blob.byReport, reportKey, cutoff]);

  return {
    hydrated,
    carryForwardOpening: carry,
    setCarryForwardOpening: (n: number) => {
      setCarry(n);
      setCarryForwardSafe(n);
    },
    rowMap: getRowMap(),
    withWorkflow,
    bankInfo,
    toggleReview,
    setExceptionFlag,
    approveRow,
    confirmBulkBankDeposit,
    resetReportDemo,
  };
}
