import type React from "react";
import type {
	CellValue,
	ComparisonResult,
	FilterState,
	RowChangeType,
} from "../types";
import Icon from "./Icon";

const getRowClass = (type: RowChangeType): string => {
	switch (type) {
		case "added":
			return "bg-green-100";
		case "deleted":
			return "bg-red-50";
		case "modified":
			return "bg-yellow-50";
		default:
			return "bg-white";
	}
};

const getChangeIndicator = (type: RowChangeType): React.ReactNode => {
	const baseClass = "w-5 h-5 mr-2 font-bold";
	switch (type) {
		case "added":
			return (
				<span title="Added" className={`${baseClass} text-green-600`}>
					+
				</span>
			);
		case "deleted":
			return (
				<span title="Deleted" className={`${baseClass} text-red-600`}>
					-
				</span>
			);
		case "modified":
			return (
				<span title="Modified" className={`${baseClass} text-yellow-600`}>
					~
				</span>
			);
		default:
			return <span className={baseClass}></span>;
	}
};

const formatValue = (value: CellValue): string => {
	if (value instanceof Date) {
		return value.toISOString().split("T")[0];
	}
	if (value === null || value === undefined) {
		return "";
	}
	return String(value);
};

const SummaryCard: React.FC<{
	label: string;
	value: number;
	color: string;
	isActive: boolean;
	onClick: () => void;
}> = ({ label, value, color, isActive, onClick }) => (
	<button
		type="button"
		className={`flex-1 p-4 rounded-lg shadow-sm text-center cursor-pointer transition-all duration-200 ${color} ${
			isActive
				? "border-4 border-black transform scale-[1.02]"
				: "border-4 border-transparent opacity-60 hover:opacity-80"
		}`}
		onClick={onClick}
	>
		<div className="flex items-center justify-center mb-2">
			<p className="text-2xl font-bold mr-2">{value}</p>
			{isActive ? (
				<svg
					className="w-5 h-5 text-white"
					fill="currentColor"
					viewBox="0 0 20 20"
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clipRule="evenodd"
					/>
				</svg>
			) : (
				<svg
					className="w-5 h-5 text-white"
					fill="currentColor"
					viewBox="0 0 20 20"
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
			)}
		</div>
		<p className="text-sm uppercase tracking-wider">{label}</p>
	</button>
);

const ComparisonTable: React.FC<{
	result: ComparisonResult;
	filters: FilterState;
	onFilterChange: (filterType: RowChangeType) => void;
}> = ({ result, filters, onFilterChange }) => {
	const { headers, rows, summary } = result;

	// Filter rows based on active filters
	const filteredRows = rows.filter((row) => filters[row.type]);

	if (
		rows.length === 0 &&
		summary.totalOriginal > 0 &&
		summary.totalUpdated > 0
	) {
		return (
			<div className="mt-8 text-center bg-white p-10 rounded-lg shadow-md">
				<Icon name="check" className="w-16 h-16 mx-auto text-green-500" />
				<h3 className="text-2xl font-bold text-slate-800 mt-4">
					Files are Identical!
				</h3>
				<p className="text-slate-600 mt-2">
					No differences were found between selected sheets of the two files.
				</p>
			</div>
		);
	}

	return (
		<div className="mt-8">
			<h3 className="text-2xl font-bold text-slate-800 mb-4">
				Comparison Result
			</h3>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6 text-white">
				<SummaryCard
					label="Added"
					value={summary.added}
					color="bg-green-500"
					isActive={filters.added}
					onClick={() => onFilterChange("added")}
				/>
				<SummaryCard
					label="Deleted"
					value={summary.deleted}
					color="bg-red-500"
					isActive={filters.deleted}
					onClick={() => onFilterChange("deleted")}
				/>
				<SummaryCard
					label="Modified"
					value={summary.modified}
					color="bg-yellow-500"
					isActive={filters.modified}
					onClick={() => onFilterChange("modified")}
				/>
				<SummaryCard
					label="Unchanged"
					value={summary.unchanged}
					color="bg-slate-500"
					isActive={filters.unchanged}
					onClick={() => onFilterChange("unchanged")}
				/>
			</div>

			<div className="bg-white rounded-lg shadow-md max-h-[90vh] overflow-auto">
				<table className="w-full text-sm text-left text-slate-500">
					<thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
						<tr>
							<th scope="col" className="px-4 py-3 w-8 bg-slate-100"></th>
							{headers.map((header, index) => (
								<th
									key={index}
									scope="col"
									className="px-6 py-3 min-w-[150px] bg-slate-100"
								>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{filteredRows.map((row, rowIndex) => (
							<tr
								key={rowIndex}
								className={`border-b ${getRowClass(row.type)}`}
							>
								<td className="px-4 py-3">{getChangeIndicator(row.type)}</td>
								{headers.map((_, colIndex) => {
									const cellData = row.rowData[colIndex];
									const isModified =
										row.type === "modified" && row.changes?.has(colIndex);
									return (
										<td
											key={colIndex}
											className={`px-6 py-4 font-mono ${isModified ? "bg-yellow-200 rounded-md" : ""}`}
										>
											{isModified && row.originalRowData ? (
												<div className="flex flex-col">
													<span className="text-xs text-red-600 line-through">
														{formatValue(row.originalRowData[colIndex])}
													</span>
													<span className="text-green-700">
														{formatValue(cellData)}
													</span>
												</div>
											) : (
												<span
													className={`${row.type === "deleted" ? "line-through text-red-700" : ""} ${row.type === "added" ? "text-green-700" : ""}`}
												>
													{formatValue(cellData)}
												</span>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default ComparisonTable;
