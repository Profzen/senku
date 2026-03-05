"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type TradeExportRow = {
  date: string;
  pair: string;
  orderType: string;
  strategy: string;
  session: string;
  rrRatio: number;
  issue: string;
  resultDollar: number;
};

const normalizeRows = (rows: TradeExportRow[]) =>
  rows.map((row) => ({
    Date: new Date(row.date).toLocaleString("fr-FR"),
    Paire: row.pair,
    Type: row.orderType.toUpperCase(),
    Strategie: row.strategy,
    Session: row.session,
    RR: row.rrRatio.toFixed(2),
    Issue: row.issue.toUpperCase(),
    Resultat: row.resultDollar.toFixed(2),
  }));

export function exportTradesCsv(rows: TradeExportRow[]) {
  const normalized = normalizeRows(rows);
  const headers = Object.keys(normalized[0] ?? {
    Date: "",
    Paire: "",
    Type: "",
    Strategie: "",
    Session: "",
    RR: "",
    Issue: "",
    Resultat: "",
  });

  const content = [
    headers.join(","),
    ...normalized.map((row) => headers.map((header) => JSON.stringify(String(row[header as keyof typeof row] ?? ""))).join(",")),
  ].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `senku-trades-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportTradesXlsx(rows: TradeExportRow[]) {
  const normalized = normalizeRows(rows);
  const worksheet = XLSX.utils.json_to_sheet(normalized);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Trades");
  XLSX.writeFile(workbook, `senku-trades-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportTradesPdf(rows: TradeExportRow[]) {
  const doc = new jsPDF({ orientation: "landscape" });

  const tableRows = rows.map((row) => [
    new Date(row.date).toLocaleString("fr-FR"),
    row.pair,
    row.orderType.toUpperCase(),
    row.strategy,
    row.session,
    row.rrRatio.toFixed(2),
    row.issue.toUpperCase(),
    row.resultDollar.toFixed(2),
  ]);

  doc.setFontSize(12);
  doc.text("Senku - Export Trades", 14, 12);

  autoTable(doc, {
    startY: 18,
    head: [["Date", "Paire", "Type", "Strategie", "Session", "RR", "Issue", "Resultat"]],
    body: tableRows,
    styles: { fontSize: 8 },
  });

  doc.save(`senku-trades-${new Date().toISOString().slice(0, 10)}.pdf`);
}
