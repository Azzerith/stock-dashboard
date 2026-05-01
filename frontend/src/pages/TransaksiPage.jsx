import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Search } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function TransaksiPage() {
  const [transaksi, setTransaksi] = useState([]);
  const [barang, setBarang] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id_barang: '',
    tipe_transaksi: 'masuk',
    jumlah: 1,
    id_user: 1,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const controller = new AbortController();
  fetchTransaksi(controller.signal);
  fetchBarang(controller.signal);

  const interval = setInterval(() => {
    fetchTransaksi();
    fetchBarang();
  }, 2000);

  return () => {
    controller.abort();
    clearInterval(interval);
  };
}, []);

  const fetchTransaksi = async (signal) => {
  try {
    const response = await api.get('/transaksi', { signal });
    setTransaksi(response.data);
  } catch (error) {
    if (error.name === 'CanceledError') return;
    toast.error('Gagal mengambil data transaksi');
  }
};

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
      await api.post('/transaksi', formData);
      toast.success('Transaksi berhasil diproses');
      resetForm();
      fetchTransaksi();
      fetchBarang();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal memproses transaksi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id_barang: '',
      tipe_transaksi: 'masuk',
      jumlah: 1,
      id_user: formData.id_user,
    });
    setShowForm(false);
  };

  const getBarangName = (id) => {
    const item = barang.find(b => b.id === id);
    return item ? `${item.nama} (${item.kode})` : '-';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Transaksi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          {formData.tipe_transaksi === 'masuk' ? (
            <ArrowDownCircle className="w-4 h-4" />
          ) : (
            <ArrowUpCircle className="w-4 h-4" />
          )}
          Buat Transaksi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Transaksi */}
        {showForm && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Form Transaksi</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Barang
                  </label>
                  <select
                    value={formData.id_barang}
                    onChange={(e) => setFormData({ ...formData, id_barang: parseInt(e.target.value) })}
                    className="input-field"
                    required
                  >
                    <option value="">Pilih Barang</option>
                    {barang.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama} (Stok: {item.stok})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Transaksi
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="masuk"
                        checked={formData.tipe_transaksi === 'masuk'}
                        onChange={(e) => setFormData({ ...formData, tipe_transaksi: e.target.value })}
                        className="form-radio"
                      />
                      <span className="text-green-600">Barang Masuk</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="keluar"
                        checked={formData.tipe_transaksi === 'keluar'}
                        onChange={(e) => setFormData({ ...formData, tipe_transaksi: e.target.value })}
                        className="form-radio"
                      />
                      <span className="text-red-600">Barang Keluar</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah
                  </label>
                  <input
                    type="number"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 btn-primary" disabled={loading}>
                  {loading ? 'Memproses...' : 'Proses Transaksi'}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 btn-secondary">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Transaksi */}
        <div className={showForm ? '' : 'lg:col-span-2'}>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">History Transaksi</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Barang
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipe
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jumlah
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transaksi.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(item.tanggal), 'dd MMM yyyy HH:mm', { locale: id })}
                       </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.barang?.nama || getBarangName(item.id_barang)}
                       </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          item.tipe_transaksi === 'masuk' 
                            ? 'text-green-700 bg-green-100' 
                            : 'text-red-700 bg-red-100'
                        }`}>
                          {item.tipe_transaksi === 'masuk' ? 'Masuk' : 'Keluar'}
                        </span>
                       </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {item.jumlah}
                       </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.user?.name || '-'}
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransaksiPage;