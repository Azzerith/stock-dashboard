import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
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
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const fetchData = useCallback(async (force = false) => {
    if (isFetching && !force) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsFetching(true);
    
    try {
      const timestamp = force ? `_t=${Date.now()}` : '';
      const [transaksiRes, barangRes] = await Promise.all([
        api.get(`/transaksi${timestamp ? '?' + timestamp : ''}`, {
          signal: abortControllerRef.current.signal,
          headers: { 'Cache-Control': 'no-cache' }
        }),
        api.get(`/barang${timestamp ? '&' + timestamp : ''}`, {
          signal: abortControllerRef.current.signal,
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);
      
      setTransaksi(transaksiRes.data || []);
      setBarang(barangRes.data || []);
      setLastUpdate(Date.now());
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Error fetching data:', error);
        toast.error('Gagal mengambil data');
      }
    } finally {
      setIsFetching(false);
    }
  }, [isFetching]);

  const refreshWithRetry = useCallback(async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await fetchData(true);
        return true;
      } catch (error) {
        if (i === retries - 1) {
          console.error('Failed to refresh:', error);
          toast.error('Gagal memuat data terbaru');
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  }, [fetchData]);

  useEffect(() => {
    refreshWithRetry(2, 500);
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      setFormData(prev => ({ ...prev, id_user: user.id }));
    }
    
    socketService.connect();
    
    const handleStockUpdate = async () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(async () => {
        await refreshWithRetry(2, 300);
        toast.success('Stok telah diupdate secara realtime!', { duration: 2000 });
      }, 100);
    };
    
    socketService.on('stock_updated', handleStockUpdate);
    socketService.on('barang_created', handleStockUpdate);
    socketService.on('barang_updated', handleStockUpdate);
    socketService.on('barang_deleted', handleStockUpdate);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      socketService.off('stock_updated', handleStockUpdate);
      socketService.off('barang_created', handleStockUpdate);
      socketService.off('barang_updated', handleStockUpdate);
      socketService.off('barang_deleted', handleStockUpdate);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshWithRetry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/transaksi', formData);
      toast.success('Transaksi berhasil diproses');
      await refreshWithRetry(3, 500);
      resetForm();
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error(error.response?.data?.error || 'Gagal memproses transaksi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(prev => ({
      id_barang: '',
      tipe_transaksi: 'masuk',
      jumlah: 1,
      id_user: prev.id_user,
    }));
    setShowForm(false);
  };

  const getBarangName = (id) => {
    const item = barang.find(b => b.id === id);
    return item ? `${item.nama} (${item.kode})` : '-';
  };

  return (
    <div>
      {/* Loading Indicator */}
      {isFetching && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm">Memperbarui data...</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transaksi Stok</h1>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Terakhir update: {new Date(lastUpdate).toLocaleTimeString('id-ID')}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refreshWithRetry(2, 500)}
            disabled={isFetching}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Buat Transaksi
          </button>
        </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Memproses...' : 'Proses Transaksi'}
                </button>
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
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
                    <tr key={`${item.id}-${lastUpdate}`}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(item.tanggal), 'dd MMM yyyy HH:mm:ss', { locale: id })}
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
                  {transaksi.length === 0 && !isFetching && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        Belum ada transaksi
                      </td>
                    </tr>
                  )}
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