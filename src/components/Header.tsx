import  { Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity size={24} className="text-primary" />
          <h1 className="text-xl font-bold text-gray-900">FitTrack</h1>
        </div>
      </div>
    </header>
  );
}
 