import type {
	ComparisonResult,
	RowChange,
	CellValue,
	CellChange,
	KeyColumnConfig,
	HeaderRowConfig,
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

export const getHeadersFromFile = async (
	file: File,
	sheetName: string,
	headerRowNumber: number = 1,
): Promise<string[]> => {
	const buffer = await readFileAsArrayBuffer(file);
	const data = getSheetData(buffer, sheetName);

	if (data.length === 0 || headerRowNumber > data.length) {
		return [];
	}

	const rawHeaders = data[headerRowNumber - 1] || []; // Convert to 0-based index
	return rawHeaders.map((cell, index) => {
		if (cell instanceof Date) {
			return cell.toISOString().split("T")[0];
		}
		if (cell === null || cell === undefined || String(cell).trim() === "") {
			return `Column ${index + 1}`;
		}
		return String(cell).trim();
	});
};

const createCompositeKey = (
	row: CellValue[],
	keyColumnIndexes: number[],
	occurrenceNumber?: number,
): string => {
	const keyValues = keyColumnIndexes.map((index) => {
		const value = row[index];
		if (value instanceof Date) {
			return value.toISOString();
		}
		if (value === null || value === undefined) {
			return "";
		}
		return String(value);
	});
	const baseKey = keyValues.join("|||"); // Using triple pipe as separator to avoid conflicts

	// Add occurrence number for duplicate handling
	if (occurrenceNumber !== undefined) {
		return `${baseKey}|||#${occurrenceNumber}`;
	}
	return baseKey;
};

export const compareExcelFiles = async (
	originalFile: File,
	updatedFile: File,
	originalSheetName: string,
	updatedSheetName: string,
	keyColumns?: KeyColumnConfig,
	headerRowNumber: number = 1,
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

	// Get headers from the specified header row
	const rawHeaders =
		(originalData.length >= headerRowNumber
			? originalData[headerRowNumber - 1]
			: updatedData.length >= headerRowNumber
				? updatedData[headerRowNumber - 1]
				: []) || [];

	const headers = rawHeaders.map((cell, index) => {
		if (cell instanceof Date) {
			return cell.toISOString().split("T")[0];
		}
		if (cell === null || cell === undefined || String(cell).trim() === "") {
			return `Column ${index + 1}`;
		}
		return String(cell).trim();
	});

	// Data rows start after the header row
	const originalRows =
		originalData.length > headerRowNumber
			? originalData.slice(headerRowNumber)
			: [];
	const updatedRows =
		updatedData.length > headerRowNumber
			? updatedData.slice(headerRowNumber)
			: [];

	const comparisonRows: RowChange[] = [];
	const summary = {
		added: 0,
		deleted: 0,
		modified: 0,
		unchanged: 0,
		totalOriginal: originalRows.length,
		totalUpdated: updatedRows.length,
	};

	if (keyColumns && keyColumns.columnIndexes.length > 0) {
		// Use key columns for comparison
		const originalMap = new Map<
			string,
			{ rowData: CellValue[]; rowIndex: number }
		>();

		// First pass: count occurrences of each base key in original data
		const originalKeyOccurrences = new Map<string, number>();
		originalRows.forEach((row) => {
			const baseKey = createCompositeKey(row, keyColumns.columnIndexes);
			if (baseKey.trim() !== "") {
				originalKeyOccurrences.set(
					baseKey,
					(originalKeyOccurrences.get(baseKey) || 0) + 1,
				);
			}
		});

		// Second pass: build map with unique composite keys for original data
		const originalKeyCounters = new Map<string, number>();
		originalRows.forEach((row, index) => {
			const baseKey = createCompositeKey(row, keyColumns.columnIndexes);
			if (baseKey.trim() !== "") {
				const occurrenceCount = originalKeyOccurrences.get(baseKey) || 1;
				let compositeKey = baseKey;

				if (occurrenceCount > 1) {
					// Handle duplicates by adding occurrence number
					const currentCount = (originalKeyCounters.get(baseKey) || 0) + 1;
					originalKeyCounters.set(baseKey, currentCount);
					compositeKey = createCompositeKey(
						row,
						keyColumns.columnIndexes,
						currentCount,
					);
				}

				originalMap.set(compositeKey, { rowData: row, rowIndex: index + 1 });
			}
		});

		// Count occurrences in updated data
		const updatedKeyOccurrences = new Map<string, number>();
		updatedRows.forEach((row) => {
			const baseKey = createCompositeKey(row, keyColumns.columnIndexes);
			if (baseKey.trim() !== "") {
				updatedKeyOccurrences.set(
					baseKey,
					(updatedKeyOccurrences.get(baseKey) || 0) + 1,
				);
			}
		});

		// Process updated rows with duplicate handling
		const updatedKeyCounters = new Map<string, number>();
		updatedRows.forEach((updatedRow, updatedIndex) => {
			const baseKey = createCompositeKey(updatedRow, keyColumns.columnIndexes);
			const occurrenceCount = updatedKeyOccurrences.get(baseKey) || 1;
			let compositeKey = baseKey;

			if (occurrenceCount > 1) {
				// Handle duplicates by adding occurrence number
				const currentCount = (updatedKeyCounters.get(baseKey) || 0) + 1;
				updatedKeyCounters.set(baseKey, currentCount);
				compositeKey = createCompositeKey(
					updatedRow,
					keyColumns.columnIndexes,
					currentCount,
				);
			}

			const originalEntry = originalMap.get(compositeKey);

			if (originalEntry) {
				const { rowData: originalRow, rowIndex: originalIndex } = originalEntry;
				if (JSON.stringify(originalRow) === JSON.stringify(updatedRow)) {
					comparisonRows.push({
						type: "unchanged",
						key: compositeKey,
						rowData: updatedRow,
						originalRowIndex: originalIndex,
						updatedRowIndex: updatedIndex + 1,
					});
					summary.unchanged++;
				} else {
					const changes = new Map<number, CellChange>();
					for (
						let i = 0;
						i < Math.max(originalRow.length, updatedRow.length);
						i++
					) {
						const oldValue = originalRow[i] ?? null;
						const newValue = updatedRow[i] ?? null;
						if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
							changes.set(i, { oldValue, newValue });
						}
					}
					comparisonRows.push({
						type: "modified",
						key: compositeKey,
						rowData: updatedRow,
						originalRowData: originalRow,
						changes,
						originalRowIndex: originalIndex,
						updatedRowIndex: updatedIndex + 1,
					});
					summary.modified++;
				}
				originalMap.delete(compositeKey);
			} else {
				comparisonRows.push({
					type: "added",
					key: compositeKey || `added_${updatedIndex + 1}`,
					rowData: updatedRow,
					updatedRowIndex: updatedIndex + 1,
				});
				summary.added++;
			}
		});

		// Add remaining original rows as deleted
		originalMap.forEach(({ rowData, rowIndex }, key) => {
			comparisonRows.push({
				type: "deleted",
				key,
				rowData,
				originalRowIndex: rowIndex,
			});
			summary.deleted++;
		});
	} else {
		// Use line number comparison (original behavior)
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
	}

	comparisonRows.sort((a, b) => {
		const aIndex = a.originalRowIndex ?? a.updatedRowIndex ?? Infinity;
		const bIndex = b.originalRowIndex ?? b.updatedRowIndex ?? Infinity;
		return aIndex - bIndex;
	});

	return { headers, rows: comparisonRows, summary };
};
