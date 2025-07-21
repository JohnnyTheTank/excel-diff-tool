export type CellValue = string | number | boolean | Date | null;

export interface CellChange {
	oldValue: CellValue;
	newValue: CellValue;
}

export type RowChangeType = "added" | "deleted" | "modified" | "unchanged";

export interface RowChange {
	type: RowChangeType;
	key: CellValue;
	rowData: CellValue[];
	originalRowData?: CellValue[];
	changes?: Map<number, CellChange>;
	originalRowIndex?: number;
	updatedRowIndex?: number;
}

export interface ComparisonResult {
	headers: string[];
	rows: RowChange[];
	summary: {
		added: number;
		deleted: number;
		modified: number;
		unchanged: number;
		totalOriginal: number;
		totalUpdated: number;
	};
}

export interface KeyColumnConfig {
	columnIndexes: number[];
	columnNames: string[];
}

export interface HeaderRowConfig {
	rowNumber: number; // 1-based row number
}
