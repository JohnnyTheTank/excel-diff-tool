import React from "react";

interface HeaderRowSelectorProps {
	headerRowNumber: number;
	onHeaderRowChange: (rowNumber: number) => void;
	disabled?: boolean;
	maxRows?: number;
}

const HeaderRowSelector: React.FC<HeaderRowSelectorProps> = ({
	headerRowNumber,
	onHeaderRowChange,
	disabled = false,
	maxRows = 50, // Reasonable default limit
}) => {
	const inputId = `header-row-${Math.random().toString(36).substr(2, 9)}`;
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value, 10);
		if (!isNaN(value) && value > 0 && value <= maxRows) {
			onHeaderRowChange(value);
		}
	};

	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = parseInt(e.target.value, 10);
		onHeaderRowChange(value);
	};

	// For small maxRows, show dropdown; for larger, show input
	const useDropdown = maxRows <= 20;

	return (
		<div className="mt-4">
			<label
				htmlFor={inputId}
				className="block text-sm font-medium text-slate-700 mb-2"
			>
				Header Row Number
			</label>
			<div className="flex items-center space-x-2">
				{useDropdown ? (
					<select
						id={inputId}
						value={headerRowNumber}
						onChange={handleSelectChange}
						disabled={disabled}
						className="block w-20 pl-3 pr-8 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
					>
						{Array.from({ length: Math.min(maxRows, 20) }, (_, i) => i + 1).map(
							(num) => (
								<option key={num} value={num}>
									{num}
								</option>
							),
						)}
					</select>
				) : (
					<input
						id={inputId}
						type="number"
						min="1"
						max={maxRows}
						value={headerRowNumber}
						onChange={handleInputChange}
						disabled={disabled}
						className="block w-20 pl-3 pr-2 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
					/>
				)}
				<span className="text-sm text-slate-600">
					(Row {headerRowNumber} contains the column headers)
				</span>
			</div>
			<p className="mt-1 text-xs text-slate-500">
				Specify which row contains the column headers. All rows after this will
				be treated as data rows.
			</p>
		</div>
	);
};

export default HeaderRowSelector;
