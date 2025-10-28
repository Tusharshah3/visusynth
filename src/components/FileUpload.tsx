import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

const FileUpload = ({ onFilesSelected, maxFiles = 10 }: FileUploadProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.tiff', '.webp']
    },
    maxFiles,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
        isDragActive
          ? "border-primary bg-primary/5 shadow-glow"
          : "border-border hover:border-primary/50 hover:shadow-elegant"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <Upload className="w-16 h-16 text-primary animate-bounce" />
        ) : (
          <FileImage className="w-16 h-16 text-muted-foreground" />
        )}
        <div>
          <p className="text-lg font-semibold mb-2">
            {isDragActive
              ? "Drop your files here"
              : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports JPG, PNG, TIFF, WEBP • Max {maxFiles} files
          </p>
        </div>
        {acceptedFiles.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="font-medium text-primary">
              {acceptedFiles.length} file(s) selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
