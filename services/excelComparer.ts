import type {
	ComparisonResult,
	RowChange,
	CellValue,
	CellChange,
} from "../types";

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
	const workbook = XLSX.read(buffer, { type: "array" });
	return workbook.SheetNames || [];
};

const getSheetData = (
	buffer: ArrayBuffer,
	sheetName: string,
): CellValue[][] => {
	const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
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
	updatedSheetName: string,
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
			summary: {
				added: 0,
				deleted: 0,
				modified: 0,
				unchanged: 0,
				totalOriginal: 0,
				totalUpdated: 0,
			},
		};
	}

	const rawHeaders =
		(originalData.length > 0 ? originalData[0] : updatedData[0]) || [];
	const headers = rawHeaders.map((cell) => {
		if (cell instanceof Date) {
			return cell.toISOString().split("T")[0];
		}
		if (cell === null || cell === undefined) {
			return "";
		}
		return String(cell);
	});

	const originalRows = originalData.length > 1 ? originalData.slice(1) : [];
	const updatedRows = updatedData.length > 1 ? updatedData.slice(1) : [];

	const comparisonRows: RowChange[] = [];
	const summary = {
		added: 0,
		deleted: 0,
		modified: 0,
		unchanged: 0,
		totalOriginal: originalRows.length,
		totalUpdated: updatedRows.length,
	};

	const maxRows = Math.max(originalRows.length, updatedRows.length);

	for (let i = 0; i < maxRows; i++) {
		const originalRow = originalRows[i];
		const updatedRow = updatedRows[i];
		const rowKey = i + 1; // Use line number as key (1-based)

		if (originalRow && updatedRow) {
			// Both rows exist - check if they're the same
			if (JSON.stringify(originalRow) === JSON.stringify(updatedRow)) {
				comparisonRows.push({
					type: "unchanged",
					key: rowKey,
					rowData: updatedRow,
					originalRowIndex: i + 1,
					updatedRowIndex: i + 1,
				});
				summary.unchanged++;
			} else {
				// Rows are different - track changes
				const changes = new Map<number, CellChange>();
				for (
					let j = 0;
					j < Math.max(originalRow.length, updatedRow.length);
					j++
				) {
					const oldValue = originalRow[j] ?? null;
					const newValue = updatedRow[j] ?? null;
					if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
						changes.set(j, { oldValue, newValue });
					}
				}
				comparisonRows.push({
					type: "modified",
					key: rowKey,
					rowData: updatedRow,
					originalRowData: originalRow,
					changes,
					originalRowIndex: i + 1,
					updatedRowIndex: i + 1,
				});
				summary.modified++;
			}
		} else if (updatedRow && !originalRow) {
			// Row was added in updated file
			comparisonRows.push({
				type: "added",
				key: rowKey,
				rowData: updatedRow,
				updatedRowIndex: i + 1,
			});
			summary.added++;
		} else if (originalRow && !updatedRow) {
			// Row was deleted from original file
			comparisonRows.push({
				type: "deleted",
				key: rowKey,
				rowData: originalRow,
				originalRowIndex: i + 1,
			});
			summary.deleted++;
		}
	}

	comparisonRows.sort((a, b) => {
		const aIndex = a.originalRowIndex ?? a.updatedRowIndex ?? Infinity;
		const bIndex = b.originalRowIndex ?? b.updatedRowIndex ?? Infinity;
		return aIndex - bIndex;
	});

	return { headers, rows: comparisonRows, summary };
};
