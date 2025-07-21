/** biome-ignore-all lint/nursery/useUniqueElementIds: <explanation> */
import React, { useState, useCallback, useEffect } from "react";
import FileUpload from "./components/FileUpload";
import ComparisonTable from "./components/ComparisonTable";
import KeyColumnSelector from "./components/KeyColumnSelector";
import HeaderRowSelector from "./components/HeaderRowSelector";
import Loader from "./components/Loader";
import {
	compareExcelFiles,
	getSheetNamesFromFile,
	getHeadersFromFile,
} from "./services/excelComparer";
import type {
	ComparisonResult,
	KeyColumnConfig,
	FilterState,
	RowChangeType,
} from "./types";
import packageJson from "./package.json";

function App() {
	const [originalFile, setOriginalFile] = useState<File | null>(null);
	const [updatedFile, setUpdatedFile] = useState<File | null>(null);
	const [comparisonResult, setComparisonResult] =
		useState<ComparisonResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [originalSheetNames, setOriginalSheetNames] = useState<string[]>([]);
	const [updatedSheetNames, setUpdatedSheetNames] = useState<string[]>([]);
	const [selectedOriginalSheet, setSelectedOriginalSheet] =
		useState<string>("");
	const [selectedUpdatedSheet, setSelectedUpdatedSheet] = useState<string>("");
	const [headers, setHeaders] = useState<string[]>([]);
	const [selectedKeyColumns, setSelectedKeyColumns] =
		useState<KeyColumnConfig | null>(null);
	const [headerRowNumber, setHeaderRowNumber] = useState<number>(1);
	const [isConfigurationCollapsed, setIsConfigurationCollapsed] =
		useState<boolean>(false);
	const [filters, setFilters] = useState<FilterState>({
		added: true,
		deleted: true,
		modified: true,
		unchanged: true,
	});

	const handleFileSelect = async (
		file: File | null,
		setFile: React.Dispatch<React.SetStateAction<File | null>>,
		setSheetNames: React.Dispatch<React.SetStateAction<string[]>>,
		setSelectedSheet: React.Dispatch<React.SetStateAction<string>>,
	) => {
		setFile(file);
		setComparisonResult(null);
		setError(null);
		setHeaderRowNumber(1); // Reset header row when file changes
		setIsConfigurationCollapsed(false); // Expand configuration when file changes
		if (file) {
			try {
				const names = await getSheetNamesFromFile(file);
				setSheetNames(names);
				if (names.length > 0) {
					setSelectedSheet(names[0]);
				} else {
					setSelectedSheet("");
					setError("The selected file does not contain any sheets.");
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "An unknown error occurred.";
				setError(`Failed to read file: ${errorMessage}`);
				setSheetNames([]);
				setSelectedSheet("");
			}
		} else {
			setSheetNames([]);
			setSelectedSheet("");
		}
	};

	const loadHeaders = useCallback(async () => {
		if (originalFile && selectedOriginalSheet) {
			try {
				const fileHeaders = await getHeadersFromFile(
					originalFile,
					selectedOriginalSheet,
					headerRowNumber,
				);
				setHeaders(fileHeaders);
				setSelectedKeyColumns(null); // Reset key column selection when headers change
			} catch (err) {
				console.error("Failed to load headers:", err);
				setHeaders([]);
				setSelectedKeyColumns(null);
			}
		} else {
			setHeaders([]);
			setSelectedKeyColumns(null);
		}
	}, [originalFile, selectedOriginalSheet, headerRowNumber]);

	const handleCompare = useCallback(async () => {
		if (
			!originalFile ||
			!updatedFile ||
			!selectedOriginalSheet ||
			!selectedUpdatedSheet
		) {
			setError("Please upload both files and select a sheet for each.");
			return;
		}
		setError(null);
		setIsLoading(true);
		setComparisonResult(null);
		setIsConfigurationCollapsed(true); // Collapse configuration when starting comparison

		try {
			const result = await compareExcelFiles(
				originalFile,
				updatedFile,
				selectedOriginalSheet,
				selectedUpdatedSheet,
				selectedKeyColumns || undefined,
				headerRowNumber,
			);
			setComparisonResult(result);
		} catch (err) {
			console.error(err);
			const errorMessage =
				err instanceof Error
					? err.message
					: "An unknown error occurred during comparison.";
			setError(`Comparison failed: ${errorMessage}`);
			setIsConfigurationCollapsed(false); // Expand configuration on error
		} finally {
			setIsLoading(false);
		}
	}, [
		originalFile,
		updatedFile,
		selectedOriginalSheet,
		selectedUpdatedSheet,
		selectedKeyColumns,
		headerRowNumber,
	]);

	// Load headers when original file and sheet are selected
	useEffect(() => {
		loadHeaders();
	}, [loadHeaders]);

	const handleFilterChange = (filterType: RowChangeType) => {
		setFilters((prev) => ({
			...prev,
			[filterType]: !prev[filterType],
		}));
	};

	return (
		<div className="min-h-screen bg-slate-100 font-sans text-slate-800">
			{/* GitHub Stars Badge */}
			<div className="fixed top-4 right-4 z-10">
				<a
					href="https://github.com/JohnnyTheTank/excel-diff-tool"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-block hover:scale-105 transition-transform duration-200"
				>
					<img
						src="https://img.shields.io/github/stars/JohnnyTheTank/excel-diff-tool?style=social"
						alt="GitHub Stars"
						className="h-6"
					/>
				</a>
			</div>
			<main>
				<div className="container mx-auto px-4 pt-8 md:pt-12">
					<div className="max-w-5xl mx-auto">
						<header className="text-center mb-8 md:mb-12">
							<h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
								Excel Diff Tool{" "}
								<span className="text-2xl md:text-3xl font-normal text-slate-600">
									v{packageJson.version}
								</span>
							</h1>
							<p className="mt-4 text-lg text-slate-600">
								Compare a sheet from two{" "}
								<code className="bg-slate-200 text-slate-800 rounded px-1 text-base">
									.xlsx
								</code>{" "}
								files and see the changes.
							</p>
							<p className="text-sm text-slate-500 mt-2">
								100% privacy-focused. All processing is done in your browser. No
								data is uploaded.
							</p>
						</header>

						<div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
							{/* Configuration Section */}
							{(originalSheetNames.length > 0 ||
								updatedSheetNames.length > 0 ||
								comparisonResult) && (
								<div
									className={`${isConfigurationCollapsed ? "mb-4" : "mb-6"}`}
								>
									<div
										className={`flex items-center justify-between ${isConfigurationCollapsed ? "py-3 px-4 bg-slate-50 rounded-lg border" : "mb-4"}`}
									>
										<div className="flex items-center">
											<h3 className="text-lg font-medium text-slate-700 mr-2">
												Configuration
											</h3>
											<svg
												className="w-5 h-5 text-slate-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
										</div>
										<button
											type="button"
											onClick={() =>
												setIsConfigurationCollapsed(!isConfigurationCollapsed)
											}
											className="text-sm text-blue-600 hover:text-blue-800 underline"
										>
											{isConfigurationCollapsed
												? "Show Configuration"
												: "Hide Configuration"}
										</button>
									</div>
								</div>
							)}

							<div
								className={`${isConfigurationCollapsed ? "hidden" : "block"}`}
							>
								<div className="grid md:grid-cols-2 gap-6 md:gap-8">
									<FileUpload
										id="original-file-upload"
										title="Original File"
										onFileSelect={(file) =>
											handleFileSelect(
												file,
												setOriginalFile,
												setOriginalSheetNames,
												setSelectedOriginalSheet,
											)
										}
									/>
									<FileUpload
										id="updated-file-upload"
										title="Updated File"
										onFileSelect={(file) =>
											handleFileSelect(
												file,
												setUpdatedFile,
												setUpdatedSheetNames,
												setSelectedUpdatedSheet,
											)
										}
									/>
								</div>

								{(originalSheetNames.length > 0 ||
									updatedSheetNames.length > 0) && (
									<div className="grid md:grid-cols-2 gap-6 md:gap-8 mt-6 pt-6 border-t border-slate-200">
										<div>
											<label
												htmlFor="original-sheet-select"
												className="block text-sm font-medium text-slate-700 mb-1"
											>
												Sheet to Compare (Original)
											</label>
											<select
												id="original-sheet-select"
												className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
												value={selectedOriginalSheet}
												onChange={(e) =>
													setSelectedOriginalSheet(e.target.value)
												}
												disabled={!originalFile}
											>
												{originalSheetNames.map((name) => (
													<option key={name} value={name}>
														{name}
													</option>
												))}
											</select>
										</div>
										<div>
											<label
												htmlFor="updated-sheet-select"
												className="block text-sm font-medium text-slate-700 mb-1"
											>
												Sheet to Compare (Updated)
											</label>
											<select
												id="updated-sheet-select"
												className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
												value={selectedUpdatedSheet}
												onChange={(e) =>
													setSelectedUpdatedSheet(e.target.value)
												}
												disabled={!updatedFile}
											>
												{updatedSheetNames.map((name) => (
													<option key={name} value={name}>
														{name}
													</option>
												))}
											</select>
										</div>
									</div>
								)}

								{originalFile &&
									updatedFile &&
									(originalSheetNames.length > 0 ||
										updatedSheetNames.length > 0) && (
										<HeaderRowSelector
											headerRowNumber={headerRowNumber}
											onHeaderRowChange={setHeaderRowNumber}
											disabled={isLoading}
										/>
									)}

								{originalFile && updatedFile && headers.length > 0 && (
									<KeyColumnSelector
										headers={headers}
										selectedColumns={selectedKeyColumns}
										onSelectionChange={setSelectedKeyColumns}
										disabled={isLoading}
									/>
								)}

								<div className="mt-8 text-center">
									<button
										type="button"
										onClick={handleCompare}
										disabled={
											!originalFile ||
											!updatedFile ||
											!selectedOriginalSheet ||
											!selectedUpdatedSheet ||
											isLoading
										}
										className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-12 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 disabled:scale-100"
									>
										{isLoading ? "Comparing..." : "Compare Files"}
									</button>
								</div>
							</div>
						</div>

						{error && (
							<div
								className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
								role="alert"
							>
								<strong className="font-bold">Error: </strong>
								<span className="block sm:inline">{error}</span>
							</div>
						)}
					</div>
				</div>

				<div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
					{isLoading && (
						<div className="max-w-5xl mx-auto">
							<Loader />
						</div>
					)}
					{comparisonResult && (
						<ComparisonTable
							result={comparisonResult}
							filters={filters}
							onFilterChange={handleFilterChange}
						/>
					)}
				</div>
			</main>
			<footer className="text-center py-4 text-sm text-slate-500">
				<p>
					Built with React & Tailwind CSS by{" "}
					<a
						href="https://github.com/JohnnyTheTank"
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-600 hover:text-blue-800 underline"
					>
						JohnnyTheTank
					</a>{" "}
					© 2025
				</p>
			</footer>
		</div>
	);
}

export default App;
