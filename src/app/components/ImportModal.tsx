"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
} from "lucide-react";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface MappedRow {
  title: string;
  description: string;
  project: string;
}

const NONE = "__none__";

const stepTitles = ["Upload File", "Map Columns", "Preview & Import"];

export default function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  // Step 1 state
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");

  // Step 2 state
  const [titleCol, setTitleCol] = useState("");
  const [descCol, setDescCol] = useState(NONE);
  const [projectCol, setProjectCol] = useState(NONE);

  // Step 3 state
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const reset = () => {
    setStep(0);
    setDragging(false);
    setFileName("");
    setColumns([]);
    setRows([]);
    setParseError("");
    setTitleCol("");
    setDescCol(NONE);
    setProjectCol(NONE);
    setImporting(false);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseFile = useCallback((file: File) => {
    setParseError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows: ParsedRow[] = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          raw: false,
        });

        if (jsonRows.length === 0) {
          setParseError("The file appears to be empty.");
          return;
        }

        const cols = Object.keys(jsonRows[0]);
        setColumns(cols);
        setRows(jsonRows);
        setTitleCol(cols[0]);
        setDescCol(NONE);
        setProjectCol(NONE);
        setFileName(file.name);
        setStep(1);
      } catch {
        setParseError("Could not read the file. Make sure it is a valid .xlsx, .xls, or .csv file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const getMappedRows = (): MappedRow[] =>
    rows.map((row) => ({
      title: titleCol ? String(row[titleCol] ?? "").trim() : "",
      description: descCol !== NONE ? String(row[descCol] ?? "").trim() : "",
      project: projectCol !== NONE ? String(row[projectCol] ?? "").trim() : "",
    })).filter((r) => r.title.length > 0);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: getMappedRows() }),
      });
      const data = await res.json();
      setResult({ imported: data.imported, skipped: data.skipped });
      setStep(3);
      onImported();
    } catch {
      setParseError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const previewRows = getMappedRows().slice(0, 8);
  const totalValid = getMappedRows().length;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-violet-400" />
                    Import from XLSX
                  </h2>
                  <p className="text-white/40 text-xs mt-0.5">{stepTitles[Math.min(step, 2)]}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicator */}
              {step < 3 && (
                <div className="flex gap-1.5 px-6 py-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= step ? "bg-violet-500" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              )}

              <div className="px-6 pb-6">
                <AnimatePresence mode="wait">
                  {/* ── Step 0: Upload ── */}
                  {step === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center gap-3 w-full min-h-[200px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                          dragging
                            ? "border-violet-400/70 bg-violet-500/10"
                            : "border-white/15 hover:border-violet-400/40 hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={handleFilePick}
                        />
                        <div className={`p-4 rounded-2xl transition-all duration-200 ${dragging ? "bg-violet-500/20" : "bg-white/5"}`}>
                          <Upload className={`w-8 h-8 transition-colors duration-200 ${dragging ? "text-violet-400" : "text-white/30"}`} />
                        </div>
                        <div className="text-center">
                          <p className="text-white/70 font-medium text-sm">
                            {dragging ? "Drop it here!" : "Drag & drop your file"}
                          </p>
                          <p className="text-white/35 text-xs mt-1">or click to browse — .xlsx, .xls, .csv</p>
                        </div>
                      </label>

                      {parseError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
                        >
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {parseError}
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  {/* ── Step 1: Map Columns ── */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <p className="text-white/50 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="text-violet-300 font-medium">{fileName}</span>
                        {" "}— {rows.length} row{rows.length !== 1 ? "s" : ""} detected
                      </p>

                      {[
                        { label: "Title", required: true, value: titleCol, setter: setTitleCol, allowNone: false },
                        { label: "Description", required: false, value: descCol, setter: setDescCol, allowNone: true },
                        { label: "Project", required: false, value: projectCol, setter: setProjectCol, allowNone: true },
                      ].map(({ label, required, value, setter, allowNone }) => (
                        <div key={label}>
                          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                            {label}
                            {required
                              ? <span className="text-red-400 text-xs">required</span>
                              : <span className="text-white/30 text-xs font-normal">(optional)</span>}
                          </label>
                          <select
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-400/60 transition-all duration-200"
                          >
                            {allowNone && <option value={NONE} className="bg-slate-800">— None —</option>}
                            {columns.map((col) => (
                              <option key={col} value={col} className="bg-slate-800">{col}</option>
                            ))}
                          </select>
                        </div>
                      ))}

                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => setStep(0)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={!titleCol}
                          onClick={() => setStep(2)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Preview
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Preview & Confirm ── */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold">
                          {totalValid} to import
                        </span>
                        <span className="text-white/35 text-xs">from {rows.length} rows in the file</span>
                      </div>

                      {totalValid === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-white/40">
                          <AlertCircle className="w-8 h-8" />
                          <p className="text-sm">No valid rows found. Make sure the Title column has data.</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/10 overflow-hidden">
                          <div className="grid grid-cols-3 gap-0 bg-white/5 px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wide">
                            <span>Title</span>
                            <span>Project</span>
                            <span>Description</span>
                          </div>
                          <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                            {previewRows.map((row, i) => (
                              <div key={i} className="grid grid-cols-3 gap-0 px-3 py-2.5 text-xs hover:bg-white/3 transition-colors">
                                <span className="text-white/80 truncate pr-2 flex items-center gap-1.5">
                                  <Tag className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />
                                  {row.title || <span className="text-white/25 italic">empty</span>}
                                </span>
                                <span className="text-white/45 truncate pr-2">{row.project || <span className="text-white/20">—</span>}</span>
                                <span className="text-white/45 truncate">{row.description || <span className="text-white/20">—</span>}</span>
                              </div>
                            ))}
                            {totalValid > 8 && (
                              <div className="px-3 py-2 text-xs text-white/30 text-center">
                                + {totalValid - 8} more rows
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {parseError && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
                        >
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {parseError}
                        </motion.p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => setStep(1)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </button>
                        <motion.button
                          whileHover={{ scale: totalValid > 0 ? 1.02 : 1 }}
                          whileTap={{ scale: totalValid > 0 ? 0.98 : 1 }}
                          disabled={importing || totalValid === 0}
                          onClick={handleImport}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {importing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {importing ? "Importing..." : `Import ${totalValid} Task${totalValid !== 1 ? "s" : ""}`}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 3: Success ── */}
                  {step === 3 && result && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center gap-4 py-6 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                        className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/25"
                      >
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </motion.div>
                      <div>
                        <p className="text-white font-bold text-lg">Import Complete!</p>
                        <p className="text-white/50 text-sm mt-1">
                          <span className="text-emerald-400 font-semibold">{result.imported} task{result.imported !== 1 ? "s" : ""}</span> added to Pending
                          {result.skipped > 0 && (
                            <>, <span className="text-amber-400 font-semibold">{result.skipped}</span> skipped (duplicates)</>
                          )}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleClose}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg transition-all duration-200"
                      >
                        Done
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
