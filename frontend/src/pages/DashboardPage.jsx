import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';

function DashboardPage() {
  const [stats, setStats] = useState({
    totalBarang: 0,
    totalStok: 0,
    stokMenipis: 0,
    transaksiHariIni: 0,
  });
  const [barangData, setBarangData] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const barangRes = await api.get('/barang');
      const barang = barangRes.data;
      
      const totalStok = barang.reduce((sum, item) => sum + item.stok, 0);
      const stokMenipis = barang.filter(item => item.stok < 10).length;
      
      setStats({
        totalBarang: barang.length,
        totalStok: totalStok,
        stokMenipis: stokMenipis,
        transaksiHariIni: 0, // Would need separate API
      });
      
      setBarangData(barang);
      
      // Prepare chart data (top 10 barang by stock)
      const chart = barang
        .sort((a, b) => b.stok - a.stok)
        .slice(0, 10)
        .map(item => ({
          name: item.nama.length > 10 ? item.nama.substring(0, 10) + '...' : item.nama,
          stok: item.stok,
        }));
      setChartData(chart);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const pieData = [
    { name: 'Stok Normal (>10)', value: stats.totalBarang - stats.stokMenipis },
    { name: 'Stok Menipis (<10)', value: stats.stokMenipis },
  ];
  
  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Barang</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalBarang}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Stok</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStok}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Stok Menipis</p>
              <p className="text-2xl font-bold text-red-600">{stats.stokMenipis}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Transaksi Hari Ini</p>
              <p className="text-2xl font-bold text-gray-800">{stats.transaksiHariIni}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Top 10 Stok Barang</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stok" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Status Stok</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Low Stock Warning Table */}
      {barangData.filter(item => item.stok < 10).length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Peringatan Stok Menipis
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Kode</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Nama Barang</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Stok Saat Ini</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Lokasi Rak</th>
                </tr>
              </thead>
              <tbody>
                {barangData
                  .filter(item => item.stok < 10)
                  .map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-2 text-sm">{item.kode}</td>
                      <td className="px-4 py-2 text-sm">{item.nama}</td>
                      <td className="px-4 py-2 text-sm font-bold text-red-600">{item.stok}</td>
                      <td className="px-4 py-2 text-sm">{item.lokasi_rak}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;