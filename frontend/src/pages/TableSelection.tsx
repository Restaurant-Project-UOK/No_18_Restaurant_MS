import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTable } from "../context/TableContext";

export default function TableSelection() {
  const navigate = useNavigate();
  const { setTableId } = useTable();
  const [selected, setSelected] = useState<string>("" );

  const tables = Array.from({ length: 8 }).map((_, i) => ({ id: `${i + 1}`, name: `Table ${i + 1}` }));

  const choose = (id: string) => {
    setSelected(id);
  };

  const start = () => {
    if (!selected) return;
    setTableId(selected);
    navigate(`/?tableId=${selected}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Table Selection</h2>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">Choose your table to start ordering.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tables.map((t) => (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              className={`p-4 rounded-lg border transition-colors text-left ${selected === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'}`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">Seats: 4</div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button disabled={!selected} onClick={start} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Start</button>
        </div>
      </div>
    </div>
  );
}
