"use client";

import React, { useState, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import clsx from "clsx";

interface FileUploadProps {
  onDataParsed: (file: File, rawData: Record<string, any>[]) => void;
  isLoading?: boolean;
}

export default function FileUpload({ onDataParsed, isLoading = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);

    // Dosya boyutu sınırı (Örn: 20 MB = 20 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError("Dosya çok büyük. LLM performansını ve sunucuyu yormamak için lütfen en fazla 20 MB büyüklüğünde bir dosya yükleyin.");
      return;
    }

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError("CSV okuma hatası: Lütfen dosya formatını kontrol edin.");
            return;
          }
          if (results.data.length === 0) {
            setError("Dosya boş görünüyor.");
            return;
          }
          onDataParsed(file, results.data as Record<string, any>[]);
        },
        error: (err) => {
          setError(`Dosya okunamadı: ${err.message}`);
        },
      });
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          
          if (json.length === 0) {
            setError("Excel sayfası boş.");
            return;
          }
          onDataParsed(file, json as Record<string, any>[]);
        } catch (err: any) {
          setError(`Excel okuma hatası: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Desteklenmeyen dosya formatı. Lütfen CSV veya Excel dosyası yükleyin.");
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={clsx(
          "relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-all",
          isDragging ? "border-[#c97b5a] bg-[#f5ede7]" : "border-[rgba(17,17,16,0.22)] bg-[var(--cream)]",
          "hover:border-[var(--rose)] hover:bg-[#f5ede7] cursor-pointer"
        )}
      >
        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={onFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center text-[var(--ink-soft)]">
            <Loader2 className="w-10 h-10 mb-4 animate-spin text-[var(--rose)]" />
            <p className="font-sans text-sm tracking-wide">Dosya işleniyor...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mb-4 rounded-full bg-[var(--cream-dark)] flex items-center justify-center text-[var(--ink-muted)]">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl text-[var(--ink)] mb-2">Verinizi Yükleyin</h3>
            <p className="text-[var(--ink-soft)] font-sans text-sm text-center max-w-md">
              CSV veya Excel dosyanızı buraya sürükleyin veya bilgisayarınızdan seçmek için tıklayın.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-[var(--ink-muted)] tracking-widest uppercase">
              <FileSpreadsheet className="w-4 h-4" />
              <span>.csv, .xlsx</span>
            </div>
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-[#fef3f0] border border-[rgba(201,123,90,0.3)] text-[var(--rose)] rounded text-sm font-sans">
          {error}
        </div>
      )}
    </div>
  );
}
