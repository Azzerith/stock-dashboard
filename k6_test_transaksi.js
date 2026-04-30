import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ─── Custom Metrics ────────────────────────────────────────────────────────────
const loginDuration    = new Trend('login_duration',    true);
const barangDuration   = new Trend('barang_duration',   true);
const transaksiDuration = new Trend('transaksi_duration', true);
const errorRate        = new Rate('error_rate');
const totalRequests    = new Counter('total_requests');

// ─── Konfigurasi Beban ─────────────────────────────────────────────────────────
// Jalankan dengan   : k6 run k6_test_transaksi.js
// Smoke test        : k6 run --vus 1 --duration 30s k6_test_transaksi.js
// Load test (default): sesuai stages di bawah
export const options = {
    stages: [
        { duration: '15s', target: 10 },   // warm-up: naik ke 10 VU
        { duration: '30s', target: 20 },   // sustain: steady 20 VU
        { duration: '15s', target: 0  },   // cool-down: turun ke 0
    ],
    thresholds: {
        // 95% request harus < 2 detik
        'http_req_duration': ['p(95)<2000'],
        // Error rate tidak boleh melebihi 5%
        'error_rate': ['rate<0.05'],
        // Semua checks harus lulus > 95%
        'checks': ['rate>0.95'],
    },
};

const BASE_URL = 'http://localhost:8080/api';

// ─── SETUP — dijalankan SEKALI di awal ────────────────────────────────────────
export function setup() {
    const start = Date.now();
    const res = http.post(
        `${BASE_URL}/login`,
        JSON.stringify({ username: 'admin', password: 'admin123' }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    loginDuration.add(Date.now() - start);
    totalRequests.add(1);

    const ok = check(res, {
        '[SETUP] login status 200': (r) => r.status === 200,
        '[SETUP] token ada':        (r) => r.json('token') !== undefined,
    });
    if (!ok) {
        console.error(`Login gagal! Status: ${res.status} Body: ${res.body}`);
    }

    return { token: res.json('token') };
}

// ─── DEFAULT — dijalankan oleh setiap VU ──────────────────────────────────────
export default function (data) {
    if (!data.token) {
        console.error('Token tidak tersedia, skip iterasi.');
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`,
    };

    // ── Grup 1 : CRUD Barang ─────────────────────────────────────────────────
    let createdBarangId = null;

    group('CRUD Barang', () => {

        // ── CREATE Barang (POST) ──────────────────────────────────────────────
        group('POST /barang', () => {
            const body = JSON.stringify({
                kode:        `BRG${__VU}${__ITER}`,
                nama:        `Barang-K6-${__VU}-${__ITER}`,
                stok:        100,
                lokasi_rak:  `RACK-${__VU}`,
            });
            const start = Date.now();
            const res = http.post(`${BASE_URL}/barang`, body, { headers });
            barangDuration.add(Date.now() - start);
            totalRequests.add(1);

            const ok = check(res, {
    'POST /barang status 201': (r) => r.status === 201,
    'POST /barang ada id':     (r) => r.json('id') !== undefined,
});
            errorRate.add(!ok);

            if (ok) createdBarangId = res.json('id');
        });

        sleep(0.5);

        // ── READ ALL Barang (GET) ─────────────────────────────────────────────
        group('GET /barang', () => {
            const start = Date.now();
            const res = http.get(`${BASE_URL}/barang`, { headers });
            barangDuration.add(Date.now() - start);
            totalRequests.add(1);

            const ok = check(res, {
                'GET /barang status 200': (r) => r.status === 200,
                'GET /barang is array':   (r) => Array.isArray(r.json()),
            });
            errorRate.add(!ok);
        });

        sleep(0.5);

        // ── READ ONE Barang (GET /:id) ────────────────────────────────────────
        group('GET /barang/:id', () => {
            if (!createdBarangId) return;
            const start = Date.now();
            const res = http.get(`${BASE_URL}/barang/${createdBarangId}`, { headers });
            barangDuration.add(Date.now() - start);
            totalRequests.add(1);

            const ok = check(res, {
                'GET /barang/:id status 200': (r) => r.status === 200,
                'GET /barang/:id id cocok':   (r) => r.json('id') === createdBarangId,
            });
            errorRate.add(!ok);
        });

        sleep(0.5);

        // ── UPDATE Barang (PUT /:id) ──────────────────────────────────────────
        group('PUT /barang/:id', () => {
            if (!createdBarangId) return;
            const body = JSON.stringify({
            kode:        `BRG${__VU}${__ITER}UPD`,
            nama:        `Barang-K6-Updated-${__VU}-${__ITER}`,
            stok:        200,
            lokasi_rak:  `RACK-${__VU}-UPD`,
            });
            const start = Date.now();
            const res = http.put(`${BASE_URL}/barang/${createdBarangId}`, body, { headers });
            barangDuration.add(Date.now() - start);
            totalRequests.add(1);

            const ok = check(res, {
                'PUT /barang/:id status 200': (r) => r.status === 200,
            });
            errorRate.add(!ok);
        });

        sleep(0.5);

        // ── DELETE Barang (DELETE /:id) ───────────────────────────────────────
        group('DELETE /barang/:id', () => {
            if (!createdBarangId) return;
            const start = Date.now();
            const res = http.del(`${BASE_URL}/barang/${createdBarangId}`, null, { headers });
            barangDuration.add(Date.now() - start);
            totalRequests.add(1);

            const ok = check(res, {
                'DELETE /barang/:id status 200': (r) => r.status === 200,
            });
            errorRate.add(!ok);
            if (ok) createdBarangId = null;
        });
    });

    sleep(1);

    // ── Grup 2 : CRUD Transaksi ───────────────────────────────────────────────
    group('CRUD Transaksi', () => {

        // ── CREATE Transaksi (POST) ───────────────────────────────────────────
        group('POST /transaksi (masuk)', () => {
            const body = JSON.stringify({
                id_barang:      1,       // Pastikan barang id=1 ada di DB
                tipe_transaksi: 'masuk',
                jumlah:         1,
                id_user:        1,
            });
            const start = Date.now();
            const res = http.post(`${BASE_URL}/transaksi`, body, { headers });
            transaksiDuration.add(Date.now() - start);
            totalRequests.add(1);

            const ok = check(res, {
                'POST /transaksi status 200':    (r) => r.status === 200,
                'POST /transaksi pesan berhasil':(r) => r.json('message') === 'Transaksi berhasil',
            });
            errorRate.add(!ok);
        });

        sleep(0.5);

        // ── READ ALL Transaksi (GET) ──────────────────────────────────────────
        group('GET /transaksi', () => {
            const start = Date.now();
            const res = http.get(`${BASE_URL}/transaksi`, { headers });
            transaksiDuration.add(Date.now() - start);
            totalRequests.add(1);

            const ok = check(res, {
                'GET /transaksi status 200': (r) => r.status === 200,
                'GET /transaksi is array':   (r) => Array.isArray(r.json()),
            });
            errorRate.add(!ok);
        });
    });

    sleep(1);
}

// ─── TEARDOWN — dijalankan SEKALI di akhir ───────────────────────────────────
export function teardown(data) {
    console.log('=== Pengujian selesai ===');
    console.log(`Token yang digunakan: ${data.token ? 'ADA' : 'TIDAK ADA'}`);
}
