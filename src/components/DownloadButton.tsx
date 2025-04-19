import  { useState } from 'react';
import { Download, FileText, Database } from 'lucide-react';
import WorkoutStorage from '../services/WorkoutStorage';

export default function DownloadButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const downloadCSV = async () => {
    setIsLoading(true);
    try {
      const csvContent = await WorkoutStorage.exportWorkoutsAsCSV();
      
      if (!csvContent) {
        alert('No workout data to download');
        return;
      }
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `fittrack_workouts_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Hide the options menu
      setShowOptions(false);
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Failed to download workout data');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJSON = async () => {
    setIsLoading(true);
    try {
      const jsonContent = await WorkoutStorage.exportWorkoutsAsJSON();
      
      if (!jsonContent) {
        alert('No workout data to download');
        return;
      }
      
      // Create and download the file
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `fittrack_workouts_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Hide the options menu
      setShowOptions(false);
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Failed to download workout data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOptions}
        disabled={isLoading}
        className="btn btn-outline flex items-center justify-center text-sm"
        title="Download your workout data"
      >
        <Download size={16} className="mr-1" />
        {isLoading ? 'Processing...' : 'Download Data'}
      </button>
      
      {showOptions && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 overflow-hidden border border-gray-200">
          <button
            onClick={downloadCSV}
            className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
          >
            <FileText size={16} className="mr-2 text-green-600" />
            <span>CSV (Excel Compatible)</span>
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-t border-gray-100"
          >
            <Database size={16} className="mr-2 text-blue-600" />
            <span>JSON (Full Data)</span>
          </button>
        </div>
      )}
    </div>
  );
}
 