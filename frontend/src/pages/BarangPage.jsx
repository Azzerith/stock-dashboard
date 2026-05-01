import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

function BarangPage() {
  const [barang, setBarang] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    stok: 0,
    lokasi_rak: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const controller = new AbortController();
  fetchBarang(controller.signal);

  // Poll setiap 5 detik sebagai pengganti WebSocket
  const interval = setInterval(() => fetchBarang(), 5000);

  return () => {
    controller.abort();
    clearInterval(interval);
  };
}, []);

  const fetchBarang = async (signal) => {
  try {
    const response = await api.get('/barang', { signal });
    setBarang(response.data);
  } catch (error) {
    if (error.name === 'CanceledError') return;
    toast.error('Gagal mengambil data barang');
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        await api.put(`/barang/${editingId}`, formData);
        toast.success('Barang berhasil diupdate');
      } else {
        await api.post('/barang', formData);
        toast.success('Barang berhasil ditambahkan');
      }
      
      resetForm();
      fetchBarang();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan barang');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus barang ini?')) {
      try {
        await api.delete(`/barang/${id}`);
        toast.success('Barang berhasil dihapus');
        fetchBarang();
      } catch (error) {
        toast.error('Gagal menghapus barang');
      }
    }
  };

  const handleEdit = (item) => {
    setFormData({
      kode: item.kode,
      nama: item.nama,
      stok: item.stok,
      lokasi_rak: item.lokasi_rak,
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      kode: '',
      nama: '',
      stok: 0,
      lokasi_rak: '',
    });
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Master Barang</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Barang
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lokasi Rak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {barang.map((item) => (
                <tr key={item.id} className={item.stok < 10 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.kode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${item.stok < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.stok}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.lokasi_rak}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.stok < 10 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Stok Menipis
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm drop-shadow-lg bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Barang' : 'Tambah Barang'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Barang
                  </label>
                  <input
                    type="text"
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: parseInt(e.target.value) })}
                    className="input-field"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lokasi Rak
                  </label>
                  <input
                    type="text"
                    value={formData.lokasi_rak}
                    onChange={(e) => setFormData({ ...formData, lokasi_rak: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 btn-primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 btn-secondary">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarangPage;