import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { CollegeData } from '@/types/college';

interface FileUploadProps {
  onDataExtracted: (data: CollegeData[]) => void;
}

export const FileUpload = ({ onDataExtracted }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const processExcelFile = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and process data
      const processedData: CollegeData[] = jsonData
        .slice(1)
        .filter((row: any) => row && row.length >= 6)
        .map((row: any, index: number) => ({
          id: `college-${Date.now()}-${index}`,
          srNo: Number(row[0]) || index + 1,
          collegeName: String(row[1] || ''),
          branch: String(row[2] || ''),
          cutoff: Number(row[3]) || 0,
          numberOutsideBracket: Number(row[4]) || 0,
          numberInsideBracket: Number(row[5]) || 0,
          order: index
        }))
        .filter(college => college.collegeName.trim() !== '');

      if (processedData.length === 0) {
        throw new Error('No valid data found in the Excel file');
      }

      // Sort by Number Inside Bracket (percentile) by default
      processedData.sort((a, b) => a.numberInsideBracket - b.numberInsideBracket);
      processedData.forEach((college, index) => {
        college.order = index;
      });

      onDataExtracted(processedData);
      
      toast({
        title: "File uploaded successfully",
        description: `Extracted ${processedData.length} college records`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: "Please ensure the file has the correct format with columns: SR no, College Name, Branch, Cutoff, Number Outside Bracket, Number Inside Bracket",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onDataExtracted, toast]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    processExcelFile(file);
  }, [processExcelFile, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <Card className="p-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-primary bg-academic-blue-light'
            : 'border-table-border hover:border-primary hover:bg-academic-blue-light/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload College Cutoff Data</h3>
        <p className="text-muted-foreground mb-4">
          Drag and drop your Excel file here, or click to browse
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Expected columns: SR no, College Name, Branch, Cutoff, Number Outside Bracket, Number Inside Bracket
        </p>
        
        <Button
          variant="outline"
          disabled={isUploading}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls';
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              handleFileSelect(target.files);
            };
            input.click();
          }}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Processing...' : 'Choose File'}
        </Button>
      </div>
    </Card>
  );
};