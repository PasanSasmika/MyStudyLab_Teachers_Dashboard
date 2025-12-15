import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Plus, Users, LogOut } from 'lucide-react'; // Icons
import { useNavigate } from 'react-router-dom';

interface Batch {
  _id: string;
  name: string;
  code: string;
  students: string[];
}

export default function Dashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      setBatches(res.data);
    } catch (error) {
      console.error('Failed to fetch batches');
    }
  };

  const createBatch = async () => {
    const name = prompt('Enter Batch Name (e.g., 2026 Revision):');
    if (!name) return;
    await api.post('/batches', { name });
    fetchBatches(); // Refresh list
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="px-6 py-4 bg-white shadow">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-blue-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <button onClick={logout} className="p-2 text-red-600 hover:bg-red-50 rounded">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Batches</h2>
          <div className="flex gap-2">
  <button 
    onClick={() => navigate('/create-exam')}
    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
  >
    <Plus size={18} /> New Exam
  </button>
  
  <button 
    onClick={createBatch}
    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
  >
    <Plus size={18} /> New Batch
  </button>
</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div key={batch._id} className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900">{batch.name}</h3>
              <div className="mt-2 text-sm text-gray-500">
                Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-black">{batch.code}</span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-gray-600">
                <Users size={16} />
                <span>{batch.students.length} Students</span>
              </div>
              <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
                Manage Exams
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}