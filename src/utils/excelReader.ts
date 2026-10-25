import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export type Row = Record<string, unknown>;

/** Convert raw cell values into useful JS types: 'true'/'false' -> boolean, JSON-looking text -> object, '' -> undefined. */
function normalise(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const v = value.trim();
  if (v === '') return undefined;
  if (/^true$/i.test(v)) return true;
  if (/^false$/i.test(v)) return false;
  if ((v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'))) {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

/** Synchronous so it can be used at spec-file load time to generate data-driven tests. */
export function readExcel<T extends Row = Row>(filePath: string, sheetName?: string): T[] {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Excel file not found: ${abs} (run "npm run data:generate" to create the sample data)`);
  }
  const workbook = XLSX.readFile(abs);
  const name = sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    throw new Error(`Sheet "${name}" not found in ${abs}. Available: ${workbook.SheetNames.join(', ')}`);
  }
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: '', raw: true });
  return rows.map((row) => {
    const out: Row = {};
    for (const [key, val] of Object.entries(row)) {
      const n = normalise(val);
      if (n !== undefined) out[key.trim()] = n;
    }
    return out as T;
  });
}

/** Read every sheet into { sheetName: rows[] }. */
export function readExcelWorkbook(filePath: string): Record<string, Row[]> {
  const wb = XLSX.readFile(path.resolve(filePath));
  const result: Record<string, Row[]> = {};
  for (const name of wb.SheetNames) result[name] = readExcel(filePath, name);
  return result;
}

/** Convert an Excel sheet to a .json file on disk and return the objects. */
export function excelToJsonFile<T extends Row = Row>(filePath: string, outFile: string, sheetName?: string): T[] {
  const data = readExcel<T>(filePath, sheetName);
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
  return data;
}
