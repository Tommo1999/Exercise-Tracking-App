import  { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import WorkoutStorage from '../services/WorkoutStorage';

export default function FileImport({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fileContent = await readFileAsText(file);
      
      if (file.name.endsWith('.json')) {
        // Import JSON file
        const success = await WorkoutStorage.importWorkoutsFromJSON(fileContent);
        if (success) {
          onImportSuccess();
        } else {
          setError('Failed to import JSON data. Please check the file format.');
        }
      } else {
        setError('Unsupported file format. Please upload a JSON file.');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      setError('Error reading file. Please try again with a valid file.');
    } finally {
      setIsLoading(false);
      // Clear the input
      e.target.value = '';
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  return (
    <div>
      <div className="flex flex-col items-center">
        <label 
          htmlFor="file-upload" 
          className="btn btn-outline flex items-center justify-center text-sm cursor-pointer"
        >
          <Upload size={16} className="mr-1" />
          {isLoading ? 'Importing...' : 'Import Data'}
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".json"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-2">
          Import previously exported workout data (JSON format)
        </p>
      </div>
      
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-start">
          <AlertCircle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
 