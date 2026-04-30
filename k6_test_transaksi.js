//command testing: k6 run --vus 50 --iterations 50 k6_test_transaksi.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // Test sederhana: 50 user concurrently update stok yang sama
    vus: 50,
    duration: '30s',
    thresholds: {
        'http_req_failed': ['rate<0.10'], // Maksimal 10% error
    },
};

const BASE_URL = 'http://localhost:8080/api';

// Setup - dijalankan sekali di awal untuk mendapatkan stok awal dan token
export function setup() {
    // Login untuk setup
    const loginRes = http.post(`${BASE_URL}/login`, JSON.stringify({
        username: 'admin',
        password: 'admin123'
    }), { headers: { 'Content-Type': 'application/json' } });
    
    const token = loginRes.json('token');
    
    // Ambil stok awal barang ID 1
    const barangRes = http.get(`${BASE_URL}/barang/1`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const stokAwal = barangRes.json('stok');
    console.log(`📦 Stok awal barang ID 1: ${stokAwal}`);
    
    return {
        token: token,
        stokAwal: stokAwal,
        totalVUs: __ENV.VUS || 50 // Jumlah VU yang digunakan
    };
}

// Main test - setiap VU menjalankan ini
export default function (data) {
    // Gunakan token dari setup
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`,
    };
    
    const transaksiRes = http.post(`${BASE_URL}/transaksi`, JSON.stringify({
        id_barang: 1,        // Semua user pake barang ID 1
        tipe_transaksi: 'keluar',
        jumlah: 1,           // Masing-masing kurangi 1 stok
        id_user: 1
    }), { headers });
    
    // Cek response
    check(transaksiRes, {
        'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
        'if 400, error is stok tidak mencukupi': (r) => {
            if (r.status === 400) {
                return r.json('error') === 'stok tidak mencukupi';
            }
            return true;
        }
    });
    
    // Delay kecil untuk mengurangi beban berlebihan
    sleep(0.05);
}

// Teardown - verifikasi stok akhir setelah test selesai
export function teardown(data) {
    console.log('\n=== VERIFIKASI AKHIR ===');
    
    // Ambil stok akhir
    const barangRes = http.get(`${BASE_URL}/barang/1`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
    });
    
    if (barangRes.status === 200) {
        const stokAkhir = barangRes.json('stok');
        const vus = parseInt(data.totalVUs) || 50;
        const stokDiharapkan = data.stokAwal - vus;
        
        console.log(`📊 Hasil Verifikasi:`);
        console.log(`   Stok awal: ${data.stokAwal}`);
        console.log(`   Stok akhir: ${stokAkhir}`);
        console.log(`   Stok diharapkan: ${stokDiharapkan} (stok awal - ${vus} VU)`);
        console.log(`   Selisih: ${stokAkhir - stokDiharapkan}`);
        
        if (stokAkhir === stokDiharapkan) {
            console.log('\n✅ PASSED: STOK AKURAT! Tidak ada race condition');
            console.log(`   ${data.stokAwal} - ${vus} = ${stokAkhir}`);
        } else {
            console.log('\n❌ FAILED: RACE CONDITION TERDETEKSI!');
            console.log(`   Stok akhir tidak sesuai dengan yang diharapkan`);
            console.log(`   Selisih: ${stokAkhir - stokDiharapkan} (kelebihan/ kekurangan stok)`);
        }
        
        // Hitung persentase sukses dari laporan sebelumnya (estimasi)
        const perubahanStok = data.stokAwal - stokAkhir;
        const transaksiSukses = perubahanStok;
        const persenSukses = (transaksiSukses / vus) * 100;
        
        console.log(`\n📈 Statistik Transaksi:`);
        console.log(`   Total transaksi yang dicoba: ${vus}`);
        console.log(`   Transaksi sukses: ${transaksiSukses}`);
        console.log(`   Rate sukses: ${persenSukses.toFixed(2)}%`);
        
        if (persenSukses <= 100 && transaksiSukses <= data.stokAwal) {
            console.log(`   ✅ Valid: Tidak melebihi stok yang tersedia`);
        } else {
            console.log(`   ❌ Invalid: Terjadi kelebihan stok!`);
        }
    } else {
        console.error('❌ Gagal mengambil data stok akhir');
    }
    
    console.log('\n=== TEST SELESAI ===');
}