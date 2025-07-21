import type { ComparisonResult, RowChange, CellValue, CellChange } from '../types';

// SheetJS is loaded from a CDN script in index.html, so we declare it as a global
declare var XLSX: any;

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const getSheetNamesFromFile = async (file: File): Promise<string[]> => {
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames || [];
};

const getSheetData = (buffer: ArrayBuffer, sheetName: string): CellValue[][] => {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`Sheet "${sheetName}" was not found in the file.`);
  }
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
};

export const compareExcelFiles = async (
  originalFile: File,
  updatedFile: File,
  originalSheetName: string,
  updatedSheetName: string
): Promise<ComparisonResult> => {
  const [originalBuffer, updatedBuffer] = await Promise.all([
    readFileAsArrayBuffer(originalFile),
    readFileAsArrayBuffer(updatedFile),
  ]);

  const originalData = getSheetData(originalBuffer, originalSheetName);
  const updatedData = getSheetData(updatedBuffer, updatedSheetName);
  
  if (originalData.length === 0 && updatedData.length === 0) {
    return {
      headers: [],
      rows: [],
      summary: { added: 0, deleted: 0, modified: 0, unchanged: 0, totalOriginal: 0, totalUpdated: 0 },
    };
  }

  const rawHeaders = (originalData.length > 0 ? originalData[0] : updatedData[0]) || [];
  const headers = rawHeaders.map(cell => {
    if (cell instanceof Date) {
      return cell.toISOString().split('T')[0];
    }
    if (cell === null || cell === undefined) {
      return '';
    }
    return String(cell);
  });
  
  const originalRows = originalData.length > 1 ? originalData.slice(1) : [];
  const updatedRows = updatedData.length > 1 ? updatedData.slice(1) : [];

  const originalMap = new Map<CellValue, { rowData: CellValue[], rowIndex: number }>();
  originalRows.forEach((row, index) => {
    if (row[0] !== null && row[0] !== undefined) {
      originalMap.set(row[0], { rowData: row, rowIndex: index + 1 });
    }
  });

  const comparisonRows: RowChange[] = [];
  const summary = { added: 0, deleted: 0, modified: 0, unchanged: 0, totalOriginal: originalRows.length, totalUpdated: updatedRows.length };

  updatedRows.forEach((updatedRow, updatedIndex) => {
    const key = updatedRow[0];
    const originalEntry = originalMap.get(key);

    if (originalEntry) {
      const { rowData: originalRow, rowIndex: originalIndex } = originalEntry;
      if (JSON.stringify(originalRow) === JSON.stringify(updatedRow)) {
        comparisonRows.push({ type: 'unchanged', key, rowData: updatedRow, originalRowIndex: originalIndex, updatedRowIndex: updatedIndex + 1 });
        summary.unchanged++;
      } else {
        const changes = new Map<number, CellChange>();
        for (let i = 0; i < Math.max(originalRow.length, updatedRow.length); i++) {
          const oldValue = originalRow[i] ?? null;
          const newValue = updatedRow[i] ?? null;
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.set(i, { oldValue, newValue });
          }
        }
        comparisonRows.push({ type: 'modified', key, rowData: updatedRow, originalRowData: originalRow, changes, originalRowIndex: originalIndex, updatedRowIndex: updatedIndex + 1 });
        summary.modified++;
      }
      originalMap.delete(key);
    } else {
      comparisonRows.push({ type: 'added', key, rowData: updatedRow, updatedRowIndex: updatedIndex + 1 });
      summary.added++;
    }
  });

  originalMap.forEach(({ rowData, rowIndex }) => {
    comparisonRows.push({ type: 'deleted', key: rowData[0], rowData, originalRowIndex: rowIndex });
    summary.deleted++;
  });

  comparisonRows.sort((a, b) => {
    const aIndex = a.originalRowIndex ?? a.updatedRowIndex ?? Infinity;
    const bIndex = b.originalRowIndex ?? b.updatedRowIndex ?? Infinity;
    return aIndex - bIndex;
  });

  return { headers, rows: comparisonRows, summary };
};