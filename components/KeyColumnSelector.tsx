/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
import type React from "react";
import type { KeyColumnConfig } from "../types";

interface KeyColumnSelectorProps {
	headers: string[];
	selectedColumns: KeyColumnConfig | null;
	onSelectionChange: (keyColumns: KeyColumnConfig | null) => void;
	disabled?: boolean;
}

const KeyColumnSelector: React.FC<KeyColumnSelectorProps> = ({
	headers,
	selectedColumns,
	onSelectionChange,
	disabled = false,
}) => {
	const handleColumnToggle = (columnIndex: number, columnName: string) => {
		// Ensure we have a proper column name
		const displayName = columnName || `Column ${columnIndex + 1}`;

		if (!selectedColumns) {
			// Create new selection
			onSelectionChange({
				columnIndexes: [columnIndex],
				columnNames: [displayName],
			});
		} else {
			const currentIndexes = selectedColumns.columnIndexes;
			const currentNames = selectedColumns.columnNames;

			const isSelected = currentIndexes.includes(columnIndex);

			if (isSelected) {
				// Remove column
				const newIndexes = currentIndexes.filter((idx) => idx !== columnIndex);
				const newNames = currentNames.filter(
					(_, idx) => currentIndexes[idx] !== columnIndex,
				);

				if (newIndexes.length === 0) {
					onSelectionChange(null);
				} else {
					onSelectionChange({
						columnIndexes: newIndexes,
						columnNames: newNames,
					});
				}
			} else {
				// Add column
				onSelectionChange({
					columnIndexes: [...currentIndexes, columnIndex],
					columnNames: [...currentNames, displayName],
				});
			}
		}
	};

	const clearSelection = () => {
		onSelectionChange(null);
	};

	if (headers.length === 0) {
		return null;
	}

	return (
		<div className="mt-6 pt-6 border-t border-slate-200">
			<div className="mb-4">
				<h3 className="text-lg font-medium text-slate-700 mb-2">
					Key Columns for Row Identification
				</h3>
				<p className="text-sm text-slate-600 mb-3">
					Select one or more columns that uniquely identify each row. If no
					columns are selected, rows will be compared by their position (line
					number).
				</p>

				{selectedColumns && selectedColumns.columnNames.length > 0 && (
					<div className="mb-3 p-3 bg-blue-50 rounded-md">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-sm font-medium text-blue-800">
									Selected Key Columns:
								</span>
								<span className="text-sm text-blue-700 ml-1">
									{selectedColumns.columnNames
										.filter((name) => name?.trim())
										.join(", ")}
								</span>
							</div>
							<button
								type="button"
								onClick={clearSelection}
								disabled={disabled}
								className="text-sm text-blue-600 hover:text-blue-800 underline disabled:text-slate-400 disabled:no-underline"
							>
								Clear Selection
							</button>
						</div>
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-md p-3 bg-slate-50">
				{headers.map((header, index) => {
					const isSelected =
						selectedColumns?.columnIndexes.includes(index) || false;
					return (
						<label
							key={header || `empty-header-${Math.random()}`}
							className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors min-w-0 ${
								isSelected
									? "bg-blue-100 border-blue-300 text-blue-800"
									: "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
							} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							<input
								type="checkbox"
								checked={isSelected}
								onChange={() => handleColumnToggle(index, header)}
								disabled={disabled}
								className="sr-only"
							/>
							<div
								className={`flex-shrink-0 w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
									isSelected
										? "bg-blue-600 border-blue-600"
										: "border-slate-300"
								}`}
							>
								{isSelected && (
									<svg
										className="w-3 h-3 text-white"
										fill="currentColor"
										viewBox="0 0 20 20"
										aria-label="Selected"
									>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<div
									className="text-sm font-medium truncate"
									title={header || `Column ${index + 1}`}
								>
									{header || `Column ${index + 1}`}
								</div>
								<div className="text-xs text-slate-500">Column {index + 1}</div>
							</div>
						</label>
					);
				})}
			</div>
		</div>
	);
};

export default KeyColumnSelector;
