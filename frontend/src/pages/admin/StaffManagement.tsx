import { useState } from "react";

interface StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  active: boolean;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 1, name: "Amara Perera", role: "Waiter", email: "amara@demo.com", active: true },
    { id: 2, name: "Kamal Silva", role: "Chef", email: "kamal@demo.com", active: true },
    { id: 3, name: "Nimal Fernando", role: "Cleaner", email: "nimal@demo.com", active: false },
  ]);

  const toggleActive = (id: number) => {
    setStaff((s) => s.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  };

  const removeStaff = (id: number) => {
    setStaff((s) => s.filter((m) => m.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Staff Management</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage staff roles, activation and contact details.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Staff Directory</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="text-sm text-gray-500 uppercase">
                <th className="py-2">Name</th>
                <th className="py-2">Role</th>
                <th className="py-2">Email</th>
                <th className="py-2">Status</th>
                <th className="py-2" style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {staff.map((m) => (
                <tr key={m.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-3">{m.name}</td>
                  <td className="py-3">{m.role}</td>
                  <td className="py-3">{m.email}</td>
                  <td className="py-3">
                    <button className={`px-3 py-1 rounded-full text-sm font-semibold ${m.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} onClick={() => toggleActive(m.id)}>
                      {m.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 flex gap-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => alert('Edit not implemented in demo')}>Edit</button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => removeStaff(m.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
