# Sistem Monitoring dan Pengendalian Pembibitan Padi

Aplikasi web MVP untuk monitoring kondisi pembibitan padi dan kontrol perangkat IoT. Pada tahap ini, data sensor, keputusan fuzzy logic, status perangkat, dan hasil computer vision masih menggunakan data dummy sesuai kebutuhan MVP pada PRD.

## Scope MVP

- Dashboard monitoring kondisi pembibitan.
- REST API dasar untuk sensor, perangkat, pompa, fuzzy logic, dan computer vision.
- Halaman monitoring detail dengan grafik dan histori data.
- Kontrol pompa ON/OFF secara simulasi.
- Tampilan hasil fuzzy logic dan computer vision menggunakan data dummy.
- Struktur backend disiapkan agar nanti bisa diganti ke data real dari ESP32, database, dan modul AI.

## Tech Stack

- Python
- FastAPI
- Jinja2
- Tailwind CSS CDN
- Chart.js CDN
- JavaScript

## Struktur Folder

```text
bibit/
  app/
    main.py
    api/
      routes.py
    web/
      routes.py
    schemas/
      pump.py
    services/
      dummy_data.py
    templates/
    static/
  docs/
    prd.md
  requirements.txt
  README.md
  .gitignore
```

## Kenapa Kode Aplikasi Ada di `app/`

Folder `app/` dipakai sebagai package utama aplikasi Python. Ini layout yang umum untuk FastAPI karena memisahkan kode aplikasi dari file proyek di root.

Root folder idealnya berisi file level proyek seperti `README.md`, `.gitignore`, `requirements.txt`, konfigurasi, dokumentasi, script deployment, dan folder lain seperti `docs/` atau `tests/`. Kode runtime aplikasi ditempatkan di `app/` supaya import lebih jelas, deployment lebih rapi, dan root tidak penuh oleh file route, service, template, cache, atau aset frontend.

Jika semua file diletakkan langsung di root, proyek kecil memang tetap bisa jalan. Masalahnya muncul saat mulai ada database, model, service ESP32, fuzzy logic, computer vision, test, migration, dan konfigurasi environment. Root akan cepat berantakan dan batas antara kode aplikasi, dokumentasi, dependency, dan konfigurasi menjadi kabur.

## Desain Backend

```text
app/main.py
```

Entrypoint FastAPI. File ini hanya membuat instance aplikasi, mount static files, dan mendaftarkan router.

```text
app/api/routes.py
```

REST API untuk integrasi frontend dan calon integrasi ESP32.

```text
app/web/routes.py
```

Route halaman Jinja2 untuk UI dashboard.

```text
app/schemas/
```

Validasi request dan response menggunakan Pydantic.

```text
app/services/
```

Layer bisnis dan sumber data. Saat ini menggunakan `dummy_data.py` untuk MVP. Nanti layer ini bisa diganti atau diperluas menjadi service database, ESP32 client, fuzzy engine, dan computer vision tanpa membongkar route utama.

## Menjalankan Aplikasi

Direkomendasikan menggunakan virtual environment.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Aplikasi berjalan di:

```text
http://127.0.0.1:8000
```

Form login masih dummy. Isi username dan password dengan nilai apa pun untuk masuk ke dashboard.

## Halaman Web

- `/`
- `/dashboard`
- `/monitoring`
- `/control`
- `/vision`
- `/fuzzy`
- `/settings`

## REST API

```http
GET /api/sensors/latest
GET /api/sensors/history?hours=6
GET /api/device/status
POST /api/pump/control
GET /api/fuzzy/latest
GET /api/fuzzy/history
GET /api/vision/latest
GET /api/vision/history
```

Contoh request kontrol pompa:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8000/api/pump/control `
  -ContentType application/json `
  -Body '{"status":"ON","mode":"Manual","duration":45}'
```

## Rencana Integrasi Berikutnya

- Tambahkan konfigurasi environment untuk mode development dan production.
- Tambahkan database SQLite/PostgreSQL dan migration.
- Tambahkan model persistence untuk sensor, perangkat, log pompa, fuzzy result, dan vision result.
- Tambahkan endpoint input data dari ESP32.
- Pindahkan fuzzy logic dummy menjadi engine fuzzy sebenarnya.
- Integrasikan computer vision dengan pipeline kamera atau upload gambar.

## Status

MVP saat ini fokus pada UI, REST API, dan alur sistem. Data masih dummy tetapi struktur backend sudah disiapkan untuk integrasi data real.
