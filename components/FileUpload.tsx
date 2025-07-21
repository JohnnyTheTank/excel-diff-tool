/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import type React from "react";
import { useCallback, useState } from "react";
import Icon from "./Icon";

interface FileUploadProps {
	title: string;
	onFileSelect: (file: File | null) => void;
	id: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ title, onFileSelect, id }) => {
	const [fileName, setFileName] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const handleFile = useCallback(
		(file: File | null) => {
			if (
				file &&
				(file.type ===
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
					file.name.endsWith(".xlsx"))
			) {
				setFileName(file.name);
				onFileSelect(file);
			} else {
				setFileName(null);
				onFileSelect(null);
				if (file) alert("Please select a valid .xlsx Excel file.");
			}
		},
		[onFileSelect],
	);

	const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFile(e.dataTransfer.files[0]);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			handleFile(e.target.files[0]);
		}
	};

	const handleClear = (e: React.MouseEvent) => {
		e.preventDefault();
		setFileName(null);
		onFileSelect(null);
		const input = document.getElementById(id) as HTMLInputElement;
		if (input) input.value = "";
	};

	return (
		<div className="w-full">
			<h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
			<label
				htmlFor={id}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				className={`flex justify-center items-center w-full h-48 px-6 transition bg-white border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-slate-500 focus:outline-none
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300"}
          ${fileName ? "border-green-500" : ""}
        `}
			>
				<input
					id={id}
					type="file"
					className="hidden"
					accept=".xlsx"
					onChange={handleFileChange}
				/>
				{fileName ? (
					<div className="text-center">
						<Icon name="check" className="w-12 h-12 mx-auto text-green-500" />
						<span className="font-medium text-slate-600 mt-2 block break-all">
							{fileName}
						</span>
						<button
							onClick={handleClear}
							className="text-sm text-red-500 hover:underline mt-1"
						>
							Clear
						</button>
					</div>
				) : (
					<span className="flex flex-col items-center space-y-2">
						<Icon name="upload" className="w-12 h-12 text-slate-400" />
						<span className="font-medium text-slate-600">
							Drop files to attach, or{" "}
							<span className="text-blue-600 underline">browse</span>
						</span>
						<span className="text-xs text-slate-500">Supports: .xlsx</span>
					</span>
				)}
			</label>
		</div>
	);
};

export default FileUpload;
