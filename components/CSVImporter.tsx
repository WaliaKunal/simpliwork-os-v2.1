
'use client';

import { useState } from 'react';

export const CSVImporter = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      alert('Please select a file to import.');
      return;
    }
    // Placeholder for import logic
    alert(`Importing ${file.name}...`);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Import Deals from CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleImport} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Import
      </button>
    </div>
  );
};
