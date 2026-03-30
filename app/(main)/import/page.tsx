
import { CSVImporter } from '@/components/CSVImporter';

const ImportPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Import Users</h1>
      <p className="mb-4">Upload a CSV file with the following columns: email, displayName, role, active_status</p>
      <CSVImporter />
    </div>
  );
};

export default ImportPage;
