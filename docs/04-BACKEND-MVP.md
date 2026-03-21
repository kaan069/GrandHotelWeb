# GrandHotel PMS - Django Backend MVP

> **Bu doküman ne?**
> Backend'in tüm yapısını tanımlayan "mimari plan". Hangi tablolar olacak, hangi API endpoint'leri
> olacak, kim neye erişebilecek — hepsini burada tanımlıyoruz. Kod yazmadan önce bu planı
> sağlam yapmak, sonra "aa bunu unutmuşuz" dememizi engeller.

---

## 1. Teknoloji Stack

> **Neden bu teknolojiler?**
> Django + DRF = Python dünyasının en olgun REST framework'ü. ORM sayesinde SQL yazmadan
> veritabanı işlemleri yapabilirsin. SimpleJWT ile token bazlı auth, Channels ile WebSocket,
> Celery ile arka plan görevleri — hepsi Django ekosisteminde hazır.

| Katman | Teknoloji | Neden |
|---|---|---|
| **Backend Framework** | Django 5.x + Django REST Framework | Hızlı geliştirme, ORM, admin panel |
| **Realtime** | Django Channels + Redis | WebSocket ile anlık oda durumu senkronizasyonu |
| **Veritabanı** | PostgreSQL 16 | JSONB, full-text search, güvenilirlik |
| **Cache / Broker** | Redis 7 | Channel layer, cache, Celery broker |
| **Task Queue** | Celery + Celery Beat | PDF oluşturma, e-posta gönderimi, zamanlanmış görevler |
| **PDF** | WeasyPrint | Firma borç özeti, konaklama raporu PDF |
| **E-posta** | Django SMTP (SendGrid/SES) | Firma borç özeti mail gönderimi |
| **Auth** | SimpleJWT | Access + Refresh token (web & mobil) |
| **Storage** | Django Storages + S3/MinIO | Arıza fotoğrafları, PDF arşivi |
| **API Docs** | drf-spectacular (OpenAPI 3) | Swagger/Redoc otomatik dokümantasyon |
| **Deploy** | Docker Compose | PostgreSQL + Redis + Django + Celery tek komutla |

---

## 2. Proje Yapısı

> **Neden bu kadar klasör var?**
> Django'da her "app" bir modüldür. Her modül kendi models, views, serializers, urls dosyasına
> sahiptir. Bu sayede kod organize kalır. Örneğin fatura ile ilgili bir şey ararken sadece
> `apps/invoices/` klasörüne bakarsın.

```
grandhotel-backend/
├── config/
│   ├── settings/
│   │   ├── base.py          # Ortak ayarlar
│   │   ├── development.py   # Geliştirme
│   │   └── production.py    # Üretim
│   ├── urls.py               # Ana URL routing
│   ├── asgi.py               # ASGI (WebSocket desteği)
│   ├── wsgi.py               # WSGI (HTTP)
│   └── celery.py             # Celery konfigürasyonu
│
├── apps/
│   ├── accounts/             # Kullanıcı & Auth
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── permissions.py    # RBAC permission sınıfları
│   │   └── signals.py
│   │
│   ├── hotels/               # Otel & Oda yönetimi
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── consumers.py      # WebSocket consumer (oda durumu)
│   │   ├── routing.py        # WebSocket URL routing
│   │   └── signals.py        # Oda durumu değişince WS broadcast
│   │
│   ├── guests/               # Misafir & Firma
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── reservations/         # Rezervasyon & Check-in/out
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py       # Check-in/out iş mantığı
│   │
│   ├── billing/              # Folio & Ödeme & Borç takibi
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py       # Borç hesaplama
│   │   └── pdf.py            # PDF oluşturma (WeasyPrint)
│   │
│   ├── invoices/             # Fatura yönetimi ← YENİ
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── shifts/               # Vardiya devir teslim ← YENİ
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── night_audit/          # Gece denetimi ← YENİ
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py       # Night audit iş mantığı
│   │
│   ├── staff/                # Personel yönetimi (mobil)
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── operations/           # Housekeeping, Arıza, Oda servisi
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── consumers.py      # Arıza bildirimi WS (opsiyonel)
│   │
│   ├── reports/              # Raporlama
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py       # Rapor hesaplama sorguları
│   │
│   ├── notifications/        # E-posta & bildirim
│   │   ├── tasks.py          # Celery task'ları
│   │   ├── templates/        # E-posta HTML şablonları
│   │   └── services.py       # Mail gönderim servisi
│   │
│   └── activity_logs/        # İşlem logları
│       ├── models.py
│       ├── middleware.py      # Otomatik log middleware
│       └── views.py
│
├── templates/
│   └── pdf/
│       ├── company_debt_summary.html   # Firma borç özeti PDF
│       ├── stay_detail.html            # Konaklama detay PDF
│       └── daily_report.html           # Günlük rapor PDF
│
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## 3. Veritabanı Şeması (PostgreSQL)

> **ER Diyagramı nedir?**
> Entity-Relationship diyagramı, tabloların birbirleriyle nasıl ilişkili olduğunu gösterir.
> `─<` işareti "bir-çok" ilişkiyi gösterir: Bir Hotel'in birden çok Room'u olabilir.

### 3.1 ER Diyagramı (Özet)

```
Hotel ─┬─< User (staff)
       ├─< Room ──< RoomStatusLog
       │    └──< RoomType
       ├─< Guest ──< GuestCompanyLink
       ├─< Company ──< CompanyDebtSummary (view)
       ├─< Reservation ─┬─< ReservationGuest (kiminle kaldığı)
       │                 ├─< RoomChange (oda değişiklikleri)
       │                 ├─< FolioItem (harcamalar + ödemeler)
       │                 └─< Payment (ayrı ödeme kayıtları)
       ├─< Invoice ──< InvoiceItem ← YENİ
       ├─< ShiftHandover ← YENİ
       ├─< NightAuditLog ──< NightAuditDetail ← YENİ
       ├─< Fault (arıza)
       ├─< RoomServiceOrder
       └─< ActivityLog
```

### 3.2 Tablo Tanımları

> **SQL'deki CHECK ne işe yarar?**
> Bir kolona sadece belirli değerlerin girmesini sağlar. Örneğin `role` kolonu sadece
> 'patron', 'manager' vs. olabilir, başka bir şey yazarsan veritabanı hata verir.
> Bu, veri bütünlüğünü sağlar — frontend'den yanlış değer gelse bile DB reddeder.

```sql
-- ============================================================
-- OTEL
-- ============================================================
CREATE TABLE hotels (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(200),
    tax_office      VARCHAR(100),
    tax_number      VARCHAR(20),
    star_rating     SMALLINT DEFAULT 0,
    logo_url        VARCHAR(500),
    settings        JSONB DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Otel Belgeleri (işletme ruhsatı, vergi levhası, turizm belgesi) ───
-- Neden ayrı tablo? Bir otelin birden fazla belgesi olabilir ve her belgenin
-- kendi dosya yolu, yüklenme tarihi vs. bilgisi var.
CREATE TABLE hotel_documents (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    doc_type        VARCHAR(30) NOT NULL CHECK (doc_type IN (
                        'business_license','tax_certificate','tourism_license','other'
                    )),
    file_url        VARCHAR(500) NOT NULL,
    file_name       VARCHAR(200),
    uploaded_by     BIGINT REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Otel Görselleri ───
CREATE TABLE hotel_images (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    image_url       VARCHAR(500) NOT NULL,
    caption         VARCHAR(200),
    sort_order      SMALLINT DEFAULT 0,
    uploaded_by     BIGINT REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KULLANICI & PERSONEL
-- ============================================================
-- Frontend login flow: branchCode + staffNumber + password
-- Bu yüzden branch_code alanı ŞART. Frontend bu 3 alanla giriş yapıyor.
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    branch_code     VARCHAR(10) NOT NULL DEFAULT '001',
    email           VARCHAR(200),
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN (
                        'patron','manager','reception',
                        'waiter','chef','technician','housekeeper'
                    )),
    staff_number    VARCHAR(20) NOT NULL,
    hire_date       DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, branch_code, staff_number)
);
CREATE INDEX idx_users_hotel ON users(hotel_id);
CREATE INDEX idx_users_role ON users(hotel_id, role);
CREATE INDEX idx_users_login ON users(branch_code, staff_number);

-- ============================================================
-- ODA TİPİ & ODA
-- ============================================================
CREATE TABLE room_types (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    name            VARCHAR(100) NOT NULL,  -- Standart, Deluxe, Suite
    base_price      DECIMAL(10,2) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    room_type_id    BIGINT REFERENCES room_types(id),
    room_number     VARCHAR(10) NOT NULL,
    floor           SMALLINT NOT NULL,
    capacity_adult  SMALLINT NOT NULL DEFAULT 2,
    capacity_child  SMALLINT NOT NULL DEFAULT 1,
    bed_type        VARCHAR(10) NOT NULL CHECK (bed_type IN ('single','double','twin','king')),
    view_type       VARCHAR(10) DEFAULT 'none' CHECK (view_type IN ('sea','city','garden','none')),
    nightly_price   DECIMAL(10,2) NOT NULL,
    status          VARCHAR(15) NOT NULL DEFAULT 'available' CHECK (status IN (
                        'available','occupied','dirty','maintenance','blocked'
                    )),
    features        JSONB DEFAULT '[]',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, room_number)
);
CREATE INDEX idx_rooms_status ON rooms(hotel_id, status);

-- Oda durum değişiklik logu
CREATE TABLE room_status_logs (
    id              BIGSERIAL PRIMARY KEY,
    room_id         BIGINT NOT NULL REFERENCES rooms(id),
    old_status      VARCHAR(15) NOT NULL,
    new_status      VARCHAR(15) NOT NULL,
    changed_by      BIGINT NOT NULL REFERENCES users(id),
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_room_status_logs_room ON room_status_logs(room_id, created_at DESC);

-- ============================================================
-- MİSAFİR
-- ============================================================
CREATE TABLE guests (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    identity_number VARCHAR(20),           -- TC Kimlik / Pasaport
    nationality     VARCHAR(50) DEFAULT 'TC',
    phone           VARCHAR(20) NOT NULL,
    email           VARCHAR(200),
    birth_date      DATE,
    address         TEXT,
    is_vip          BOOLEAN DEFAULT FALSE,
    is_blocked      BOOLEAN DEFAULT FALSE,
    blocked_reason  TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_guests_identity ON guests(hotel_id, identity_number);
CREATE INDEX idx_guests_name ON guests(hotel_id, last_name, first_name);
CREATE INDEX idx_guests_phone ON guests(hotel_id, phone);

-- ============================================================
-- FİRMA (ŞİRKET)
-- ============================================================
-- Frontend'de company ekleme formu basit (sadece name zorunlu).
-- Backend'de daha fazla alan var ama çoğu opsiyonel bırakıyoruz
-- ki frontend formu kırmadan çalışsın. İleride frontend genişletilir.
CREATE TABLE companies (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    name            VARCHAR(200) NOT NULL,
    tax_office      VARCHAR(100),
    tax_number      VARCHAR(20),
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(200),
    contact_name    VARCHAR(200),          -- Yetkili kişi
    contact_phone   VARCHAR(20),
    contact_email   VARCHAR(200),
    contracted_rate DECIMAL(10,2),         -- Anlaşmalı gecelik fiyat
    credit_limit    DECIMAL(12,2),         -- Borç limiti
    payment_term_days SMALLINT DEFAULT 30, -- Vade süresi (gün)
    is_active       BOOLEAN DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_companies_tax ON companies(hotel_id, tax_number);

-- Firma-Misafir ilişkisi (bir misafir birden fazla firmada çalışabilir)
CREATE TABLE guest_company_links (
    id              BIGSERIAL PRIMARY KEY,
    guest_id        BIGINT NOT NULL REFERENCES guests(id),
    company_id      BIGINT NOT NULL REFERENCES companies(id),
    is_primary      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guest_id, company_id)
);

-- ============================================================
-- REZERVASYON
-- ============================================================
CREATE TABLE reservations (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    reservation_no  VARCHAR(20) NOT NULL UNIQUE,  -- Otomatik: GH-20260311-001
    guest_id        BIGINT NOT NULL REFERENCES guests(id),
    room_id         BIGINT NOT NULL REFERENCES rooms(id),
    company_id      BIGINT REFERENCES companies(id),
    check_in_date   DATE NOT NULL,
    check_out_date  DATE NOT NULL,
    actual_check_in TIMESTAMPTZ,
    actual_check_out TIMESTAMPTZ,
    adult_count     SMALLINT NOT NULL DEFAULT 1,
    child_count     SMALLINT NOT NULL DEFAULT 0,
    nightly_rate    DECIMAL(10,2) NOT NULL,
    total_amount    DECIMAL(12,2) NOT NULL,
    status          VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending','confirmed','checked_in','checked_out','cancelled','no_show'
                    )),
    payment_status  VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
                        'unpaid','partial','paid'
                    )),
    source          VARCHAR(10) DEFAULT 'walkin' CHECK (source IN (
                        'walkin','phone','web','ota'
                    )),
    notes           TEXT,
    checked_in_by   BIGINT REFERENCES users(id),
    checked_out_by  BIGINT REFERENCES users(id),
    created_by      BIGINT NOT NULL REFERENCES users(id),
    cancelled_at    TIMESTAMPTZ,
    cancelled_by    BIGINT REFERENCES users(id),
    cancel_reason   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reservations_dates ON reservations(hotel_id, check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(hotel_id, status);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_company ON reservations(company_id) WHERE company_id IS NOT NULL;

-- Rezervasyon misafirleri (kiminle kaldığı)
CREATE TABLE reservation_guests (
    id              BIGSERIAL PRIMARY KEY,
    reservation_id  BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    guest_id        BIGINT NOT NULL REFERENCES guests(id),
    is_primary      BOOLEAN DEFAULT FALSE,
    added_at        TIMESTAMPTZ DEFAULT NOW(),
    added_by        BIGINT REFERENCES users(id),
    UNIQUE(reservation_id, guest_id)
);

-- ============================================================
-- ODA DEĞİŞİKLİĞİ
-- ============================================================
CREATE TABLE room_changes (
    id              BIGSERIAL PRIMARY KEY,
    reservation_id  BIGINT NOT NULL REFERENCES reservations(id),
    from_room_id    BIGINT NOT NULL REFERENCES rooms(id),
    to_room_id      BIGINT NOT NULL REFERENCES rooms(id),
    reason          TEXT,
    changed_at      TIMESTAMPTZ DEFAULT NOW(),
    changed_by      BIGINT NOT NULL REFERENCES users(id),
    old_nightly_rate DECIMAL(10,2),
    new_nightly_rate DECIMAL(10,2)
);
CREATE INDEX idx_room_changes_res ON room_changes(reservation_id);

-- ============================================================
-- FOLİO (HARCAMA & ÖDEME KALEMLERİ) ← GENİŞLETİLDİ
-- ============================================================
-- Folio = Misafirin otel hesabı. Her harcama ve ödeme burada tutulur.
--
-- ÖNEMLİ KURAL: amount pozitif = misafirin borcu (harcama),
--               amount negatif = ödeme/iade (alacak)
--
-- Kategori mantığı:
-- HARCAMALAR (pozitif amount):
--   room_charge     → Gecelik oda ücreti (night audit ile otomatik eklenir)
--   extra_room      → Ek yatak, extra kişi ücreti
--   board_charge    → Pansiyon ücreti (yarım/tam pansiyon)
--   phone           → Telefon ücreti
--   internet        → İnternet ücreti
--   minibar         → Minibar tüketimi
--   restaurant      → Restoran/yemek bedeli
--   laundry         → Kuru temizleme
--   service         → Diğer hizmetler (spa, transfer vs.)
--   discount        → İndirim (negatif amount olarak girilir)
--
-- ÖDEMELER (negatif amount):
--   payment_cash       → Nakit ödeme
--   payment_card       → Kredi kartı ile ödeme
--   payment_transfer   → Havale/EFT/dekont ile ödeme
--   payment_other      → Diğer ödeme türleri
--   cash_refund        → Nakit iade
--   company_debit      → Cari hesaba borçlu olarak kaydet
--   company_credit     → Cari hesaba alacaklı olarak kaydet

CREATE TABLE folio_items (
    id              BIGSERIAL PRIMARY KEY,
    reservation_id  BIGINT NOT NULL REFERENCES reservations(id),
    guest_id        BIGINT REFERENCES guests(id),
    category        VARCHAR(20) NOT NULL CHECK (category IN (
                        -- Harcamalar
                        'room_charge','extra_room','board_charge',
                        'phone','internet','minibar','restaurant',
                        'laundry','service','discount',
                        -- Ödemeler
                        'payment_cash','payment_card','payment_transfer',
                        'payment_other','cash_refund',
                        'company_debit','company_credit'
                    )),
    description     VARCHAR(300) NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,  -- Pozitif=borç, Negatif=ödeme
    date            DATE NOT NULL,
    created_by      BIGINT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_folio_reservation ON folio_items(reservation_id);

-- ============================================================
-- ÖDEME (Ayrı tablo - detaylı ödeme kaydı)
-- ============================================================
-- Neden hem folio_items'da ödeme var hem payments tablosu?
-- folio_items → Misafirin hesap özetindeki satır (basit kayıt)
-- payments   → Ödemenin detayı (dekont no, POS slip no, banka bilgisi vs.)
-- Bir ödeme yapıldığında HEM folio_items'a HEM payments'a kayıt atılır.
CREATE TABLE payments (
    id              BIGSERIAL PRIMARY KEY,
    reservation_id  BIGINT NOT NULL REFERENCES reservations(id),
    folio_item_id   BIGINT REFERENCES folio_items(id),   -- Hangi folio satırına ait
    company_id      BIGINT REFERENCES companies(id),
    amount          DECIMAL(10,2) NOT NULL,
    method          VARCHAR(20) NOT NULL CHECK (method IN (
                        'cash','credit_card','debit_card','bank_transfer',
                        'company_credit','other'
                    )),
    reference_no    VARCHAR(100),       -- Dekont/fiş/POS slip no
    note            TEXT,
    paid_at         TIMESTAMPTZ DEFAULT NOW(),
    received_by     BIGINT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_company ON payments(company_id) WHERE company_id IS NOT NULL;

-- ============================================================
-- FİRMA BORÇ TAKİBİ
-- ============================================================
CREATE VIEW company_debt_summary AS
SELECT
    c.id AS company_id,
    c.hotel_id,
    c.name AS company_name,
    c.tax_number,
    c.email,
    COUNT(DISTINCT r.id) AS total_reservations,
    COUNT(DISTINCT r.guest_id) AS unique_guests,
    COALESCE(SUM(CASE WHEN fi.amount > 0 THEN fi.amount ELSE 0 END), 0) AS total_charges,
    COALESCE(SUM(CASE WHEN fi.amount < 0 THEN ABS(fi.amount) ELSE 0 END), 0) AS total_payments,
    COALESCE(SUM(fi.amount), 0) AS outstanding_debt,
    MAX(r.check_out_date) AS last_checkout
FROM companies c
LEFT JOIN reservations r ON r.company_id = c.id AND r.status != 'cancelled'
LEFT JOIN folio_items fi ON fi.reservation_id = r.id
GROUP BY c.id, c.hotel_id, c.name, c.tax_number, c.email;

CREATE TABLE company_debt_reports (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES companies(id),
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    total_charges   DECIMAL(12,2) NOT NULL,
    total_payments  DECIMAL(12,2) NOT NULL,
    outstanding     DECIMAL(12,2) NOT NULL,
    pdf_url         VARCHAR(500),
    sent_to_email   VARCHAR(200),
    sent_at         TIMESTAMPTZ,
    generated_by    BIGINT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FATURA SİSTEMİ ← YENİ MODÜL
-- ============================================================
-- Neden folio'dan ayrı?
-- Folio = misafirin otel içi hesap özeti (iç kayıt)
-- Fatura = resmi mali belge (vergi dairesi, muhasebe, yasal zorunluluk)
-- Bir folio kapatıldığında fatura KESİLİR, ama her fatura bir folio'ya bağlı olmak zorunda değil
-- (örn: satın alma faturası, iade faturası)
--
-- Frontend'de 4 fatura tipi var:
-- sales    → Satış faturası (misafire/firmaya kesilen)
-- purchase → Alış faturası (tedarikçiden gelen)
-- return   → İade faturası (iade edilen ürün/hizmet)
-- incoming → Gelen fatura (otele kesilen faturalar)

CREATE TABLE invoices (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    invoice_no      VARCHAR(30) NOT NULL,     -- Otomatik: INV-20260315-001
    type            VARCHAR(10) NOT NULL CHECK (type IN ('sales','purchase','return','incoming')),
    date            DATE NOT NULL,
    due_date        DATE,                      -- Vade tarihi
    customer_type   VARCHAR(10) NOT NULL CHECK (customer_type IN ('individual','company')),
    customer_name   VARCHAR(200) NOT NULL,
    tax_number      VARCHAR(20),
    address         TEXT,
    subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 20,    -- KDV oranı (%)
    tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL DEFAULT 0,
    status          VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN (
                        'draft','issued','paid','cancelled'
                    )),
    notes           TEXT,
    related_reservation_id  BIGINT REFERENCES reservations(id),
    related_company_id      BIGINT REFERENCES companies(id),
    created_by      BIGINT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, invoice_no)
);
CREATE INDEX idx_invoices_type ON invoices(hotel_id, type);
CREATE INDEX idx_invoices_status ON invoices(hotel_id, status);
CREATE INDEX idx_invoices_date ON invoices(hotel_id, date);

CREATE TABLE invoice_items (
    id              BIGSERIAL PRIMARY KEY,
    invoice_id      BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    category        VARCHAR(20) NOT NULL CHECK (category IN (
                        'konaklama','yiyecek','icecek','minibar','hizmet','diger'
                    )),
    description     VARCHAR(300) NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,   -- quantity * unit_price
    sort_order      SMALLINT DEFAULT 0
);
CREATE INDEX idx_invoice_items ON invoice_items(invoice_id);

-- ============================================================
-- VARDİYA DEVİR TESLİM ← YENİ MODÜL
-- ============================================================
-- Otel resepsiyonunda vardiya değişiminde yapılan devir teslim kaydı.
-- Kim kimden devraldı, o vardiyada ne kadar satış yapıldı,
-- kaç oda satıldı, kasa durumu neydi — hepsi burada.
--
-- Frontend'de bir vardiya "active" olarak başlar, vardiya bittiğinde "closed" yapılır.
-- Bir otel için aynı anda sadece 1 aktif vardiya olabilir.

CREATE TABLE shift_handovers (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    date            DATE NOT NULL,
    from_user_id    BIGINT NOT NULL REFERENCES users(id),   -- Devir eden
    to_user_id      BIGINT REFERENCES users(id),            -- Devir alan (kapatılınca set edilir)
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    cash_sales      DECIMAL(12,2) NOT NULL DEFAULT 0,
    card_sales      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_sales     DECIMAL(12,2) NOT NULL DEFAULT 0,
    rooms_sold      SMALLINT NOT NULL DEFAULT 0,
    cash_in_drawer  DECIMAL(12,2) DEFAULT 0,      -- Kasadaki nakit
    notes           TEXT,
    status          VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
    closed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shifts_hotel_date ON shift_handovers(hotel_id, date);
CREATE INDEX idx_shifts_active ON shift_handovers(hotel_id, status) WHERE status = 'active';

-- ============================================================
-- GECE DENETİMİ (NIGHT AUDIT) ← YENİ MODÜL
-- ============================================================
-- Night audit = Her gece yapılan "gün sonu kapanışı".
-- Ne yapar?
-- 1. Dolu tüm odaların gecelik ücretini folio'ya otomatik ekler
-- 2. No-show kontrol eder (check-in tarihi geçmiş ama gelmemiş)
-- 3. Günlük özet rapor oluşturur
--
-- Frontend'de resepsiyonist butona basarak tetikler.
-- Aynı gün için 2 kez çalıştırılamaz (date UNIQUE).

CREATE TABLE night_audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    date            DATE NOT NULL,
    rooms_charged   SMALLINT NOT NULL DEFAULT 0,      -- Ücret eklenen oda sayısı
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0, -- Toplam eklenen ücret
    no_shows_marked SMALLINT NOT NULL DEFAULT 0,      -- No-show yapılan rezervasyon sayısı
    processed_by    BIGINT NOT NULL REFERENCES users(id),
    processed_at    TIMESTAMPTZ NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, date)
);

CREATE TABLE night_audit_details (
    id              BIGSERIAL PRIMARY KEY,
    audit_log_id    BIGINT NOT NULL REFERENCES night_audit_logs(id) ON DELETE CASCADE,
    reservation_id  BIGINT NOT NULL REFERENCES reservations(id),
    room_id         BIGINT NOT NULL REFERENCES rooms(id),
    room_number     VARCHAR(10) NOT NULL,
    guest_name      VARCHAR(200) NOT NULL,
    charge_amount   DECIMAL(10,2) NOT NULL,
    charge_type     VARCHAR(20) DEFAULT 'room_charge',   -- room_charge, board_charge
    folio_item_id   BIGINT REFERENCES folio_items(id)     -- Oluşturulan folio kaydı
);
CREATE INDEX idx_audit_details ON night_audit_details(audit_log_id);

-- ============================================================
-- ONLINE REZERVASYON KANALI ← YENİ
-- ============================================================
-- Frontend'de HotelManagement sayfasındaki "Online Kanal" bölümü.
-- Hangi oda tipleri online'da açık, kaç kontenjan var, fiyat ne?

CREATE TABLE channel_room_configs (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    room_type       VARCHAR(20) NOT NULL CHECK (room_type IN (
                        'standard','deluxe','suite','family','economy'
                    )),
    total_rooms     SMALLINT NOT NULL DEFAULT 0,
    open_quota      SMALLINT NOT NULL DEFAULT 0,
    price_per_night DECIMAL(10,2) NOT NULL,
    description     TEXT,
    features        JSONB DEFAULT '[]',
    valid_until     DATE,
    reservations_open BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE channel_room_images (
    id              BIGSERIAL PRIMARY KEY,
    config_id       BIGINT NOT NULL REFERENCES channel_room_configs(id) ON DELETE CASCADE,
    image_url       VARCHAR(500) NOT NULL,
    sort_order      SMALLINT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OPERASYONLAR (MOBİL)
-- ============================================================
CREATE TABLE faults (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    room_id         BIGINT REFERENCES rooms(id),
    room_number     VARCHAR(10),
    category        VARCHAR(20) NOT NULL CHECK (category IN (
                        'electrical','plumbing','furniture','ac',
                        'tv_electronics','door_lock','bathroom','other'
                    )),
    description     TEXT NOT NULL,
    status          VARCHAR(15) NOT NULL DEFAULT 'open' CHECK (status IN (
                        'open','in_progress','resolved'
                    )),
    photos          JSONB DEFAULT '[]',
    resolution_photos JSONB DEFAULT '[]',
    resolution_note TEXT,
    reported_by     BIGINT NOT NULL REFERENCES users(id),
    assigned_to     BIGINT REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    resolved_by     BIGINT REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_faults_status ON faults(hotel_id, status);

CREATE TABLE room_service_orders (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    room_id         BIGINT NOT NULL REFERENCES rooms(id),
    item            VARCHAR(200) NOT NULL,
    category        VARCHAR(15) CHECK (category IN ('drink','food','amenity','other')),
    quantity        SMALLINT NOT NULL DEFAULT 1,
    note            TEXT,
    status          VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending','preparing','delivered','cancelled'
                    )),
    ordered_by      BIGINT NOT NULL REFERENCES users(id),
    delivered_by    BIGINT REFERENCES users(id),
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_items (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(20) CHECK (category IN (
                        'food','drink','cleaning','office','maintenance','other'
                    )),
    quantity         DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit            VARCHAR(10) CHECK (unit IN ('kg','lt','adet','paket','kutu','koli')),
    min_stock       DECIMAL(10,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meal_programs (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    date            DATE NOT NULL,
    meal_type       VARCHAR(10) NOT NULL CHECK (meal_type IN ('lunch','dinner')),
    menu_text       TEXT NOT NULL,
    created_by      BIGINT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, date, meal_type)
);

CREATE TABLE shopping_items (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    name            VARCHAR(200) NOT NULL,
    quantity         VARCHAR(50),
    unit            VARCHAR(20),
    is_completed    BOOLEAN DEFAULT FALSE,
    added_by        BIGINT NOT NULL REFERENCES users(id),
    completed_by    BIGINT REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_attendance (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    check_in        TIMESTAMPTZ,
    check_out       TIMESTAMPTZ,
    date            DATE NOT NULL,
    UNIQUE(user_id, date)
);
CREATE INDEX idx_attendance_date ON staff_attendance(hotel_id, date);

CREATE TABLE leave_records (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    leave_type      VARCHAR(15) CHECK (leave_type IN ('annual','sick','unpaid','other')),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    days            SMALLINT NOT NULL,
    status          VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    approved_by     BIGINT REFERENCES users(id),
    note            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- İŞLEM LOGLARI
-- ============================================================
CREATE TABLE activity_logs (
    id              BIGSERIAL PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotels(id),
    user_id         BIGINT REFERENCES users(id),
    action          VARCHAR(30) NOT NULL,
    entity_type     VARCHAR(30) NOT NULL,
    entity_id       BIGINT,
    details         JSONB DEFAULT '{}',
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_logs_hotel_date ON activity_logs(hotel_id, created_at DESC);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);
```

---

## 4. Auth & Login Flow

> **Frontend nasıl login yapıyor?**
> Frontend'de kullanıcı 3 alan girer: `branchCode` (şube kodu, örn: "001"),
> `staffNumber` (personel no, örn: "1003"), `password` (şifre, örn: "1234").
> Backend bu 3 alanla kullanıcıyı bulup JWT token döndürmelidir.
>
> **JWT nedir?**
> JSON Web Token. Login başarılı olunca backend 2 token verir:
> - **Access Token** (15dk): Her API isteğinde `Authorization: Bearer <token>` header'ına eklenir
> - **Refresh Token** (7gün): Access token süresi dolunca yeni access token almak için kullanılır

### 4.1 Login Endpoint

```python
# apps/accounts/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password

class LoginView(APIView):
    """
    Frontend'den gelen login isteğini karşılar.

    POST /api/auth/login/
    Body:
    {
        "branch_code": "001",
        "staff_number": "1003",
        "password": "1234"
    }

    Başarılı yanıt:
    {
        "access": "eyJhbGciOiJ...",
        "refresh": "eyJhbGciOiJ...",
        "user": {
            "id": 3,
            "firstName": "Ayşe",
            "lastName": "Kaya",
            "role": "reception",
            "branchCode": "001",
            "staffNumber": "1003",
            "hotelId": 1,
            "hotelName": "Grand Hotel"
        }
    }
    """
    permission_classes = []  # Login'e herkes erişebilir (auth gerekmez)

    def post(self, request):
        branch_code = request.data.get('branch_code')
        staff_number = request.data.get('staff_number')
        password = request.data.get('password')

        if not all([branch_code, staff_number, password]):
            return Response(
                {'error': 'branch_code, staff_number ve password gereklidir'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # branch_code + staff_number ile kullanıcıyı bul
            user = User.objects.select_related('hotel').get(
                branch_code=branch_code,
                staff_number=staff_number,
                is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Geçersiz kimlik bilgileri'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Şifre kontrolü
        if not check_password(password, user.password_hash):
            return Response(
                {'error': 'Geçersiz kimlik bilgileri'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # JWT token oluştur
        refresh = RefreshToken.for_user(user)

        # Son giriş zamanını güncelle
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'role': user.role,
                'branchCode': user.branch_code,
                'staffNumber': user.staff_number,
                'hotelId': user.hotel_id,
                'hotelName': user.hotel.name,
            }
        })
```

### 4.2 Auth Endpoint'leri

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/auth/login/` | JWT login (branchCode + staffNumber + password) |
| POST | `/api/auth/refresh/` | Access token yenile |
| POST | `/api/auth/logout/` | Refresh token blacklist |
| GET | `/api/auth/me/` | Mevcut kullanıcı bilgisi |
| POST | `/api/auth/change-password/` | Şifre değiştir |

---

## 5. Folio Sistemi (Detaylı)

> **Folio nedir?**
> Misafirin oteldeki "hesap defteri". Konaklama boyunca yapılan her harcama (oda ücreti,
> minibar, telefon vs.) ve her ödeme (nakit, kart vs.) burada tutulur.
> Hesap = Toplam Harcamalar - Toplam Ödemeler = Kalan Borç

### 5.1 Kategori Haritası

```
┌─────────────────────────────────────────────────────────────┐
│                    FOLİO KATEGORİLERİ                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HARCAMALAR (amount > 0)          ÖDEMELER (amount < 0)     │
│  ─────────────────────            ─────────────────────     │
│  room_charge    Oda ücreti        payment_cash    Nakit     │
│  extra_room     Ek oda ücreti     payment_card    Kredi kartı│
│  board_charge   Pansiyon ücreti   payment_transfer Dekont   │
│  phone          Telefon ücreti    payment_other   Diğer     │
│  internet       İnternet ücreti   cash_refund     Nakit iade│
│  minibar        Minibar bedeli    company_debit   Cari borç │
│  restaurant     Yemek bedeli      company_credit  Cari alacak│
│  laundry        Kuru temizleme                              │
│  service        Diğer hizmet                                │
│  discount       İndirim (negatif)                           │
│                                                             │
│  Bakiye = SUM(tüm amount'lar)                               │
│  Bakiye > 0 → Misafir borçlu                                │
│  Bakiye = 0 → Hesap kapalı                                  │
│  Bakiye < 0 → Otelin borcu (fazla ödeme)                    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Folio Servisi

```python
# apps/billing/services.py

class FolioService:
    """
    Folio işlemlerinin iş mantığı (business logic).

    Neden ayrı servis dosyası? → View'da sadece HTTP işlemleri olmalı,
    iş mantığı serviste olmalı. Bu sayede aynı mantığı
    hem API'den hem Celery task'tan hem WebSocket'ten çağırabiliriz.
    """

    @staticmethod
    def add_charge(reservation_id, category, description, amount, user):
        """Misafir hesabına harcama ekle."""
        folio_item = FolioItem.objects.create(
            reservation_id=reservation_id,
            category=category,
            description=description,
            amount=abs(amount),   # Harcamalar her zaman pozitif
            date=date.today(),
            created_by=user
        )
        # Ödeme durumunu güncelle
        FolioService.update_payment_status(reservation_id)
        return folio_item

    @staticmethod
    def add_payment(reservation_id, category, description, amount, user,
                    method=None, reference_no=None, company_id=None):
        """
        Misafir hesabına ödeme ekle.
        Hem folio_items'a hem payments'a kayıt atar.
        """
        # Folio kaydı (negatif amount)
        folio_item = FolioItem.objects.create(
            reservation_id=reservation_id,
            category=category,
            description=description,
            amount=-abs(amount),  # Ödemeler her zaman negatif
            date=date.today(),
            created_by=user
        )

        # Detaylı ödeme kaydı
        payment = Payment.objects.create(
            reservation_id=reservation_id,
            folio_item=folio_item,
            company_id=company_id,
            amount=abs(amount),
            method=method or 'cash',
            reference_no=reference_no,
            received_by=user
        )

        FolioService.update_payment_status(reservation_id)
        return folio_item, payment

    @staticmethod
    def get_balance(reservation_id):
        """Misafirin kalan borcunu hesapla."""
        result = FolioItem.objects.filter(
            reservation_id=reservation_id
        ).aggregate(balance=Sum('amount'))
        return result['balance'] or Decimal('0.00')

    @staticmethod
    def update_payment_status(reservation_id):
        """Folio bakiyesine göre ödeme durumunu güncelle."""
        balance = FolioService.get_balance(reservation_id)
        reservation = Reservation.objects.get(id=reservation_id)

        if balance <= 0:
            reservation.payment_status = 'paid'
        elif balance < reservation.total_amount:
            reservation.payment_status = 'partial'
        else:
            reservation.payment_status = 'unpaid'

        reservation.save(update_fields=['payment_status', 'updated_at'])
```

### 5.3 Folio API Yanıt Formatı

```json
{
    "reservation_id": 1,
    "guest_name": "Ali Yılmaz",
    "room_number": "201",
    "items": [
        { "id": 1, "date": "2026-03-15", "category": "room_charge", "description": "Oda Ücreti (201)", "amount": 750.00 },
        { "id": 2, "date": "2026-03-15", "category": "minibar", "description": "Minibar - Kola, Su", "amount": 85.00 },
        { "id": 3, "date": "2026-03-15", "category": "phone", "description": "Telefon Ücreti", "amount": 25.00 },
        { "id": 4, "date": "2026-03-15", "category": "payment_cash", "description": "Nakit Ödeme", "amount": -500.00 },
        { "id": 5, "date": "2026-03-16", "category": "room_charge", "description": "Oda Ücreti (201)", "amount": 750.00 },
        { "id": 6, "date": "2026-03-16", "category": "restaurant", "description": "Akşam Yemeği", "amount": 320.00 },
        { "id": 7, "date": "2026-03-16", "category": "laundry", "description": "Kuru Temizleme - 2 takım", "amount": 150.00 },
        { "id": 8, "date": "2026-03-16", "category": "payment_card", "description": "Kredi Kartı Ödeme", "amount": -1000.00 }
    ],
    "summary": {
        "total_charges": 2080.00,
        "total_payments": 1500.00,
        "balance": 580.00,
        "payment_status": "partial"
    }
}
```

---

## 6. Fatura Sistemi

> **Folio vs Fatura farkı:**
> - Folio → Otel iç kaydı, misafir hesap özeti
> - Fatura → Resmi mali belge, vergi hesaplamalı, yasal geçerliliği var
>
> Otel dışından bir tedarikçiden mal aldığında "alış faturası" (purchase) kesersin.
> Misafire hesap kapatırken "satış faturası" (sales) kesersin.
> Bir ürün iade edildiğinde "iade faturası" (return) kesersin.

### 6.1 Fatura Servisi

```python
# apps/invoices/services.py

class InvoiceService:

    @staticmethod
    def generate_invoice_no(hotel_id, date):
        """
        Otomatik fatura numarası üret.
        Format: INV-20260315-001 (tarih + sıra no)

        Django ORM'de aggregate kullanarak o güne ait son numarayı bulur,
        1 artırır. Thread-safe olması için select_for_update kullanılabilir.
        """
        today_count = Invoice.objects.filter(
            hotel_id=hotel_id,
            date=date
        ).count()
        return f"INV-{date.strftime('%Y%m%d')}-{today_count + 1:03d}"

    @staticmethod
    def create_invoice(hotel_id, data, user):
        """
        Yeni fatura oluştur.
        data = { type, customer_type, customer_name, tax_number, items: [...], ... }
        """
        invoice = Invoice.objects.create(
            hotel_id=hotel_id,
            invoice_no=InvoiceService.generate_invoice_no(hotel_id, data['date']),
            type=data['type'],
            date=data['date'],
            due_date=data.get('due_date'),
            customer_type=data['customer_type'],
            customer_name=data['customer_name'],
            tax_number=data.get('tax_number'),
            address=data.get('address'),
            tax_rate=data.get('tax_rate', 20),
            notes=data.get('notes'),
            related_reservation_id=data.get('related_reservation_id'),
            related_company_id=data.get('related_company_id'),
            created_by=user
        )

        # Fatura kalemleri
        subtotal = Decimal('0')
        for i, item in enumerate(data['items']):
            amount = Decimal(str(item['quantity'])) * Decimal(str(item['unit_price']))
            InvoiceItem.objects.create(
                invoice=invoice,
                category=item['category'],
                description=item['description'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                amount=amount,
                sort_order=i
            )
            subtotal += amount

        # Toplamları hesapla
        tax_amount = subtotal * (invoice.tax_rate / 100)
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total = subtotal + tax_amount
        invoice.save()

        return invoice
```

### 6.2 Fatura Endpoint'leri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/invoices/` | Fatura listesi (filtre: type, status, tarih aralığı) |
| POST | `/api/invoices/` | Yeni fatura oluştur |
| GET | `/api/invoices/{id}/` | Fatura detay (kalemler dahil) |
| PUT | `/api/invoices/{id}/` | Fatura güncelle (sadece draft durumundayken) |
| PATCH | `/api/invoices/{id}/issue/` | Faturayı onayla (draft → issued) |
| PATCH | `/api/invoices/{id}/cancel/` | Faturayı iptal et |
| DELETE | `/api/invoices/{id}/` | Fatura sil (sadece draft durumundayken) |

---

## 7. Vardiya Devir Teslim

> **Vardiya sistemi nedir?**
> Otel resepsiyonunda genellikle 3 vardiya çalışılır (sabah/akşam/gece).
> Her vardiya değişiminde devir eden kişi:
> - O vardiyada yapılan toplam satışları bildirir
> - Kasadaki nakit miktarını sayar
> - Açık notları yeni vardiyaya aktarır
>
> Bu, muhasebe kontrolü ve sorumluluk takibi için kritik.

### 7.1 Vardiya Servisi

```python
# apps/shifts/services.py

from django.utils import timezone

class ShiftService:

    @staticmethod
    def start_shift(hotel_id, user):
        """
        Yeni vardiya başlat.
        Bir otelde aynı anda sadece 1 aktif vardiya olabilir.
        Eğer zaten aktif vardiya varsa hata döndür.
        """
        # Aktif vardiya kontrolü
        active = ShiftHandover.objects.filter(
            hotel_id=hotel_id, status='active'
        ).first()

        if active:
            raise ValidationError(
                f"Aktif vardiya zaten var. "
                f"Önce {active.from_user.first_name}'ın vardiyasını kapatın."
            )

        return ShiftHandover.objects.create(
            hotel_id=hotel_id,
            date=timezone.now().date(),
            from_user=user,
            start_time=timezone.now(),
            status='active'
        )

    @staticmethod
    def close_shift(shift_id, to_user, cash_sales, card_sales,
                    rooms_sold, cash_in_drawer, notes=None):
        """
        Vardiyayı kapat ve devir teslim yap.

        Parametreler:
        - to_user: Devir alan kişi
        - cash_sales: Vardiyada yapılan nakit satış toplamı
        - card_sales: Vardiyada yapılan kart satış toplamı
        - rooms_sold: Satılan oda sayısı
        - cash_in_drawer: Kasadaki nakit miktarı
        """
        shift = ShiftHandover.objects.get(id=shift_id, status='active')
        shift.to_user = to_user
        shift.end_time = timezone.now()
        shift.cash_sales = cash_sales
        shift.card_sales = card_sales
        shift.total_sales = cash_sales + card_sales
        shift.rooms_sold = rooms_sold
        shift.cash_in_drawer = cash_in_drawer
        shift.notes = notes
        shift.status = 'closed'
        shift.closed_at = timezone.now()
        shift.save()
        return shift
```

### 7.2 Vardiya Endpoint'leri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/shifts/` | Vardiya geçmişi listesi |
| GET | `/api/shifts/active/` | Aktif vardiyayı getir |
| POST | `/api/shifts/` | Yeni vardiya başlat |
| PATCH | `/api/shifts/{id}/close/` | Vardiyayı kapat (devir teslim) |
| GET | `/api/shifts/{id}/` | Vardiya detayı |

---

## 8. Night Audit (Gece Denetimi)

> **Night Audit nedir?**
> Her gece (genellikle 00:00-02:00 arası) yapılan gün sonu kapanışı.
> Bu işlem otelde kritiktir çünkü:
> 1. Dolu odaların gecelik ücreti otomatik olarak folio'ya eklenir
> 2. Check-in tarihi geçmiş ama gelmemiş misafirler "no-show" yapılır
> 3. Günlük mali özet oluşturulur
>
> Frontend'de resepsiyonist bir butona basarak bunu tetikler.
> Aynı gün için 2 kez yapılamaz (güvenlik).

### 8.1 Night Audit Servisi

```python
# apps/night_audit/services.py

from django.utils import timezone
from django.db import transaction
from decimal import Decimal

class NightAuditService:

    @staticmethod
    @transaction.atomic   # ← Tüm işlemler ya hep olur ya hiç (atomik)
    def run_audit(hotel_id, user):
        """
        Night audit çalıştır.

        @transaction.atomic ne demek?
        Eğer işlem ortasında bir hata olursa, o ana kadar yapılan
        tüm değişiklikler geri alınır (rollback). Bu sayede
        "yarım kalmış" night audit olmaz.

        Adımlar:
        1. Bugün için daha önce yapılmış mı kontrol et
        2. Tüm dolu odaları bul
        3. Her odanın gecelik ücretini folio'ya ekle
        4. No-show kontrolü yap
        5. Audit log oluştur
        """
        today = timezone.now().date()

        # Aynı gün kontrolü
        if NightAuditLog.objects.filter(hotel_id=hotel_id, date=today).exists():
            raise ValidationError(f"{today} tarihi için gece denetimi zaten yapılmış.")

        # Audit log oluştur
        audit_log = NightAuditLog.objects.create(
            hotel_id=hotel_id,
            date=today,
            processed_by=user,
            processed_at=timezone.now()
        )

        total_amount = Decimal('0')
        rooms_charged = 0

        # 1. Dolu odaların ücretlerini folio'ya ekle
        checked_in_reservations = Reservation.objects.filter(
            hotel_id=hotel_id,
            status='checked_in'
        ).select_related('room', 'guest')

        for reservation in checked_in_reservations:
            # Folio'ya oda ücreti ekle
            folio_item = FolioItem.objects.create(
                reservation=reservation,
                guest=reservation.guest,
                category='room_charge',
                description=f"Oda Ücreti ({reservation.room.room_number})",
                amount=reservation.nightly_rate,
                date=today,
                created_by=user
            )

            # Audit detay kaydı
            NightAuditDetail.objects.create(
                audit_log=audit_log,
                reservation=reservation,
                room=reservation.room,
                room_number=reservation.room.room_number,
                guest_name=f"{reservation.guest.first_name} {reservation.guest.last_name}",
                charge_amount=reservation.nightly_rate,
                charge_type='room_charge',
                folio_item=folio_item
            )

            total_amount += reservation.nightly_rate
            rooms_charged += 1

        # 2. No-show kontrolü
        no_shows = Reservation.objects.filter(
            hotel_id=hotel_id,
            status='confirmed',
            check_in_date__lt=today   # Check-in tarihi bugünden önce
        )
        no_show_count = no_shows.update(status='no_show')

        # Audit log'u güncelle
        audit_log.rooms_charged = rooms_charged
        audit_log.total_amount = total_amount
        audit_log.no_shows_marked = no_show_count
        audit_log.save()

        return audit_log
```

### 8.2 Night Audit Endpoint'leri

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/night-audit/` | Night audit çalıştır (günde 1 kez) |
| GET | `/api/night-audit/` | Night audit log geçmişi |
| GET | `/api/night-audit/{id}/` | Night audit detayı (hangi odalara ne eklendi) |

### 8.3 Night Audit API Yanıt Formatı

```json
{
    "id": 1,
    "date": "2026-03-15",
    "rooms_charged": 28,
    "total_amount": 18750.00,
    "no_shows_marked": 2,
    "processed_by": "Ayşe Kaya",
    "processed_at": "2026-03-16T00:15:00+03:00",
    "details": [
        {
            "room_number": "101",
            "guest_name": "Ali Yılmaz",
            "charge_amount": 500.00,
            "charge_type": "room_charge"
        },
        {
            "room_number": "201",
            "guest_name": "Mehmet Demir",
            "charge_amount": 750.00,
            "charge_type": "room_charge"
        }
    ]
}
```

---

## 9. WebSocket - Anlık Oda Durumu Senkronizasyonu

> **WebSocket nedir?**
> Normal HTTP "istek-yanıt" mantığıyla çalışır: sen istersin, sunucu cevap verir.
> WebSocket ise kalıcı bir bağlantı açar — sunucu istediği zaman sana mesaj gönderebilir.
>
> Otel senaryosu: Housekeeping odayı temizleyip "temiz" diye işaretlediğinde,
> resepsiyondaki ekran anında güncellenmeli. Polling (her 5 sn sorma) yerine
> WebSocket ile anlık bildirim gönderilir.

### 9.1 WebSocket Endpoint'leri

| Endpoint | Açıklama | Kimler Bağlanır |
|---|---|---|
| `ws/rooms/{hotel_id}/` | Oda durumu değişiklikleri | Web + Mobil |
| `ws/faults/{hotel_id}/` | Arıza bildirimi (opsiyonel) | Teknisyen + Müdür |

### 9.2 Django Channels Implementasyonu

```python
# apps/hotels/consumers.py

import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

class RoomStatusConsumer(AsyncJsonWebsocketConsumer):
    """
    Oda durumu WebSocket consumer.

    Bağlantı: ws/rooms/{hotel_id}/
    """

    async def connect(self):
        self.hotel_id = self.scope['url_route']['kwargs']['hotel_id']
        self.group_name = f'hotel_{self.hotel_id}_rooms'

        user = self.scope.get('user')
        if not user or user.is_anonymous:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Mevcut tüm oda durumlarını gönder
        rooms = await self.get_all_rooms()
        await self.send_json({
            'type': 'room_status_snapshot',
            'rooms': rooms
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        msg_type = content.get('type')
        if msg_type == 'room_status_update':
            room_data = await self.update_room_status(
                room_id=content['room_id'],
                new_status=content['new_status'],
                user_id=self.scope['user'].id
            )
            await self.channel_layer.group_send(
                self.group_name,
                {'type': 'room_status_changed', **room_data}
            )

    async def room_status_changed(self, event):
        await self.send_json(event)

    @database_sync_to_async
    def get_all_rooms(self):
        from apps.hotels.models import Room
        rooms = Room.objects.filter(hotel_id=self.hotel_id).values(
            'id', 'room_number', 'status', 'floor', 'bed_type'
        )
        return list(rooms)

    @database_sync_to_async
    def update_room_status(self, room_id, new_status, user_id):
        from apps.hotels.models import Room, RoomStatusLog
        from django.utils import timezone

        room = Room.objects.get(id=room_id, hotel_id=self.hotel_id)
        old_status = room.status
        room.status = new_status
        room.save(update_fields=['status', 'updated_at'])

        RoomStatusLog.objects.create(
            room=room, old_status=old_status,
            new_status=new_status, changed_by_id=user_id
        )

        return {
            'room_id': room.id,
            'room_number': room.room_number,
            'old_status': old_status,
            'new_status': new_status,
            'changed_by': f'{self.scope["user"].first_name} {self.scope["user"].last_name}',
            'changed_at': timezone.now().isoformat()
        }
```

```python
# apps/hotels/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/rooms/(?P<hotel_id>\d+)/$', consumers.RoomStatusConsumer.as_asgi()),
]
```

### 9.3 Signal ile Otomatik Broadcast

```python
# apps/hotels/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Room

@receiver(post_save, sender=Room)
def broadcast_room_status(sender, instance, **kwargs):
    """REST API ile oda durumu güncellendiğinde de WS broadcast yap."""
    if instance.tracker.has_changed('status'):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'hotel_{instance.hotel_id}_rooms',
            {
                'type': 'room_status_changed',
                'room_id': instance.id,
                'room_number': instance.room_number,
                'old_status': instance.tracker.previous('status'),
                'new_status': instance.status,
                'changed_at': instance.updated_at.isoformat()
            }
        )
```

---

## 10. Firma Borç Takibi & PDF Mail Sistemi

### 10.1 Borç Hesaplama Servisi

```python
# apps/billing/services.py

class CompanyDebtService:

    @staticmethod
    def get_debt_summary(company_id, period_start=None, period_end=None):
        """
        Firma borç özeti hesapla.

        Returns:
        {
            "company": { name, tax_number, email, ... },
            "period": { start, end },
            "reservations": [
                {
                    "reservation_no": "GH-20260301-005",
                    "guest_name": "Ali Yılmaz",
                    "room_number": "201",
                    "check_in": "2026-03-01",
                    "check_out": "2026-03-05",
                    "nights": 4,
                    "room_charges": 3000.00,
                    "extra_charges": 450.00,
                    "total": 3450.00,
                    "paid": 1000.00,
                    "balance": 2450.00
                }
            ],
            "summary": {
                "total_charges": 15200.00,
                "total_payments": 8000.00,
                "outstanding_debt": 7200.00
            }
        }
        """
        ...

    @staticmethod
    def get_overdue_companies(hotel_id):
        """Vadesi geçmiş borcu olan firmaları listele."""
        ...
```

### 10.2 PDF & Mail (Celery Task)

```python
# apps/notifications/tasks.py

from celery import shared_task

@shared_task
def send_company_debt_report(company_id, period_start, period_end, generated_by_id):
    """
    Firma borç özetini PDF olarak oluştur ve mail at.
    Celery task olarak arka planda çalışır.
    """
    ...

@shared_task
def send_auto_monthly_debt_reports(hotel_id):
    """
    Celery Beat ile her ayın 1'inde otomatik çalışır.
    Borcu olan tüm firmalara aylık özet gönderir.
    """
    ...
```

---

## 11. Check-in / Check-out / Oda Değişikliği

```python
# apps/reservations/services.py

class ReservationService:

    @staticmethod
    def check_in(reservation_id, user, extra_guests=None):
        """
        Check-in işlemi:
        1. Rezervasyonu checked_in yap (saat:dakika kaydet)
        2. Odayı occupied yap
        3. Yanında kalanları kaydet (reservation_guests)
        4. Activity log oluştur
        5. WebSocket broadcast
        """
        reservation = Reservation.objects.get(id=reservation_id)
        reservation.status = 'checked_in'
        reservation.actual_check_in = timezone.now()
        reservation.checked_in_by = user
        reservation.save()

        reservation.room.status = 'occupied'
        reservation.room.save()

        # Ana misafir
        ReservationGuest.objects.create(
            reservation=reservation, guest=reservation.guest,
            is_primary=True, added_by=user
        )
        # Yanındakiler
        if extra_guests:
            for guest_id in extra_guests:
                ReservationGuest.objects.create(
                    reservation=reservation, guest_id=guest_id,
                    is_primary=False, added_by=user
                )

    @staticmethod
    def change_room(reservation_id, new_room_id, reason, user):
        """
        Oda değişikliği:
        1. Eski odayı dirty yap
        2. Yeni odayı occupied yap
        3. room_changes tablosuna kaydet (tarih+saat+dakika)
        4. Rezervasyonu güncelle
        """
        reservation = Reservation.objects.get(id=reservation_id)
        old_room = reservation.room
        new_room = Room.objects.get(id=new_room_id)

        RoomChange.objects.create(
            reservation=reservation,
            from_room=old_room, to_room=new_room,
            reason=reason, changed_at=timezone.now(),
            changed_by=user,
            old_nightly_rate=reservation.nightly_rate,
            new_nightly_rate=new_room.nightly_price
        )

        old_room.status = 'dirty'
        old_room.save()
        new_room.status = 'occupied'
        new_room.save()

        reservation.room = new_room
        reservation.nightly_rate = new_room.nightly_price
        reservation.save()

    @staticmethod
    def check_out(reservation_id, user):
        """
        Check-out:
        1. Folio toplamını kontrol et
        2. Ödeme durumunu güncelle
        3. Odayı dirty yap
        4. Firma rezervasyonuysa → borç tablosuna yansıt
        """
        ...
```

---

## 12. Otel Bilgi Yönetimi & Online Kanal

### 12.1 Otel Bilgi Endpoint'leri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/hotel/info/` | Otel bilgilerini getir |
| PUT | `/api/hotel/info/` | Otel bilgilerini güncelle |
| GET | `/api/hotel/documents/` | Otel belgelerini listele |
| POST | `/api/hotel/documents/` | Belge yükle (ruhsat, vergi levhası vs.) |
| DELETE | `/api/hotel/documents/{id}/` | Belge sil |
| GET | `/api/hotel/images/` | Otel görsellerini listele |
| POST | `/api/hotel/images/` | Görsel yükle |
| DELETE | `/api/hotel/images/{id}/` | Görsel sil |

### 12.2 Online Kanal Endpoint'leri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/channels/rooms/` | Kanal oda konfigürasyonlarını listele |
| POST | `/api/channels/rooms/` | Yeni oda tipi konfigürasyonu ekle |
| PUT | `/api/channels/rooms/{id}/` | Konfigürasyon güncelle |
| DELETE | `/api/channels/rooms/{id}/` | Konfigürasyon sil |
| POST | `/api/channels/rooms/{id}/images/` | Oda tipi görseli yükle |

### 12.3 Public Booking Endpoint'leri (Auth gerektirmez)

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/booking/hotels/` | Otel arama (şehir, fiyat, yıldız filtreli) |
| GET | `/api/booking/hotels/{id}/` | Otel detay + müsait odalar |
| POST | `/api/booking/reserve/` | Online rezervasyon oluştur |

---

## 13. Tüm API Endpoint'leri (Tam Liste)

### Auth
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/auth/login/` | JWT login (branchCode + staffNumber + password) |
| POST | `/api/auth/refresh/` | Access token yenile |
| POST | `/api/auth/logout/` | Refresh token blacklist |
| GET | `/api/auth/me/` | Mevcut kullanıcı bilgisi |
| POST | `/api/auth/change-password/` | Şifre değiştir |

### Dashboard
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/dashboard/summary/` | Özet metriker (doluluk, ciro, oda durumları) |
| GET | `/api/dashboard/today-checkins/` | Bugünkü check-in'ler |
| GET | `/api/dashboard/today-checkouts/` | Bugünkü check-out'lar |

### Hotel Info & Documents
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/hotel/info/` | Otel bilgilerini getir |
| PUT | `/api/hotel/info/` | Otel bilgilerini güncelle |
| GET | `/api/hotel/documents/` | Belge listesi |
| POST | `/api/hotel/documents/` | Belge yükle |
| DELETE | `/api/hotel/documents/{id}/` | Belge sil |
| GET | `/api/hotel/images/` | Görsel listesi |
| POST | `/api/hotel/images/` | Görsel yükle |
| DELETE | `/api/hotel/images/{id}/` | Görsel sil |

### Rooms
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/rooms/` | Oda listesi (filtrelenebilir: status, floor, bed_type) |
| POST | `/api/rooms/` | Oda ekle |
| GET | `/api/rooms/{id}/` | Oda detay |
| PUT | `/api/rooms/{id}/` | Oda güncelle |
| DELETE | `/api/rooms/{id}/` | Oda sil |
| PATCH | `/api/rooms/{id}/status/` | Durum güncelle (WS broadcast tetikler) |
| GET | `/api/rooms/available/` | Müsait odalar (tarih aralığına göre) |
| GET | `/api/rooms/{id}/status-logs/` | Oda durum değişiklik geçmişi |

### Room Types
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/room-types/` | Oda tipi listesi |
| POST | `/api/room-types/` | Oda tipi ekle |
| PUT | `/api/room-types/{id}/` | Oda tipi güncelle |
| DELETE | `/api/room-types/{id}/` | Oda tipi sil |

### Reservations
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/reservations/` | Liste (filtre: status, payment_status, tarih aralığı) |
| POST | `/api/reservations/` | Yeni rezervasyon |
| POST | `/api/reservations/bulk/` | Toplu firma rezervasyonu |
| GET | `/api/reservations/{id}/` | Detay (misafirler, oda değişiklikleri, folio dahil) |
| PUT | `/api/reservations/{id}/` | Güncelle |
| POST | `/api/reservations/{id}/check-in/` | Check-in |
| POST | `/api/reservations/{id}/check-out/` | Check-out |
| POST | `/api/reservations/{id}/change-room/` | Oda değiştir |
| PATCH | `/api/reservations/{id}/cancel/` | İptal |
| GET | `/api/reservations/calendar/` | Takvim görünümü verisi |

### Guests
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/guests/` | Misafir listesi (arama: ad, TC, telefon) |
| POST | `/api/guests/` | Misafir ekle |
| GET | `/api/guests/{id}/` | Detay + konaklama geçmişi |
| PUT | `/api/guests/{id}/` | Güncelle |
| PATCH | `/api/guests/{id}/block/` | Engelle/kaldır |
| GET | `/api/guests/{id}/stays/` | Konaklama geçmişi detay |

### Companies
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/companies/` | Firma listesi |
| POST | `/api/companies/` | Firma ekle |
| GET | `/api/companies/{id}/` | Firma detay |
| PUT | `/api/companies/{id}/` | Güncelle |
| GET | `/api/companies/{id}/guests/` | Firma çalışanı misafirler |
| GET | `/api/companies/{id}/stays/` | Firma konaklama geçmişi |
| GET | `/api/companies/{id}/debt/` | Borç özeti |
| POST | `/api/companies/{id}/send-debt-report/` | PDF borç özeti & mail at |
| GET | `/api/companies/{id}/debt-reports/` | Gönderilen rapor geçmişi |
| GET | `/api/companies/overdue/` | Vadesi geçmiş borçlu firmalar |

### Billing (Folio & Payments)
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/reservations/{id}/folio/` | Folio kalemleri |
| POST | `/api/reservations/{id}/folio/` | Folio kalemi ekle (harcama veya ödeme) |
| DELETE | `/api/folio/{id}/` | Folio kalemi sil |
| GET | `/api/reservations/{id}/payments/` | Ödeme listesi |
| POST | `/api/reservations/{id}/payments/` | Ödeme ekle |

### Invoices (Fatura)
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/invoices/` | Fatura listesi (filtre: type, status, tarih) |
| POST | `/api/invoices/` | Yeni fatura oluştur |
| GET | `/api/invoices/{id}/` | Fatura detay (kalemler dahil) |
| PUT | `/api/invoices/{id}/` | Fatura güncelle (sadece draft) |
| PATCH | `/api/invoices/{id}/issue/` | Faturayı onayla |
| PATCH | `/api/invoices/{id}/cancel/` | Faturayı iptal et |
| DELETE | `/api/invoices/{id}/` | Fatura sil (sadece draft) |

### Shifts (Vardiya)
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/shifts/` | Vardiya geçmişi |
| GET | `/api/shifts/active/` | Aktif vardiya |
| POST | `/api/shifts/` | Yeni vardiya başlat |
| PATCH | `/api/shifts/{id}/close/` | Vardiya kapat (devir teslim) |
| GET | `/api/shifts/{id}/` | Vardiya detayı |

### Night Audit
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/night-audit/` | Night audit çalıştır |
| GET | `/api/night-audit/` | Audit log geçmişi |
| GET | `/api/night-audit/{id}/` | Audit detayı |

### Online Kanal
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/channels/rooms/` | Kanal oda konfigürasyonları |
| POST | `/api/channels/rooms/` | Konfigürasyon ekle |
| PUT | `/api/channels/rooms/{id}/` | Konfigürasyon güncelle |
| DELETE | `/api/channels/rooms/{id}/` | Konfigürasyon sil |
| POST | `/api/channels/rooms/{id}/images/` | Oda tipi görseli yükle |

### Public Booking (Auth gerektirmez)
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/booking/hotels/` | Otel arama |
| GET | `/api/booking/hotels/{id}/` | Otel detay + müsait odalar |
| POST | `/api/booking/reserve/` | Online rezervasyon |

### Staff (Personel - Mobil)
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/staff/` | Personel listesi |
| POST | `/api/staff/` | Personel ekle |
| DELETE | `/api/staff/{id}/` | Personel sil |
| POST | `/api/staff/attendance/check-in/` | QR ile giriş |
| POST | `/api/staff/attendance/check-out/` | QR ile çıkış |
| GET | `/api/staff/{id}/leave/` | İzin bilgisi |

### Operations (Mobil)
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/faults/` | Arıza listesi |
| POST | `/api/faults/` | Arıza bildir |
| PATCH | `/api/faults/{id}/status/` | Durumu güncelle |
| GET | `/api/room-service/` | Oda servisi siparişleri |
| POST | `/api/room-service/` | Sipariş oluştur |
| PATCH | `/api/room-service/{id}/deliver/` | Teslim edildi |
| GET | `/api/stock/` | Stok listesi |
| POST | `/api/stock/` | Stok ekle |
| PUT | `/api/stock/{id}/` | Stok güncelle |
| GET | `/api/meal-program/` | Yemek programı |
| POST | `/api/meal-program/` | Yemek programı ekle/güncelle |
| GET | `/api/shopping-list/` | Alışveriş listesi |
| POST | `/api/shopping-list/` | Alışveriş ekle |
| PATCH | `/api/shopping-list/{id}/complete/` | Tamamlandı |

### Reports
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/reports/daily/` | Günlük özet |
| GET | `/api/reports/occupancy/` | Doluluk raporu |
| GET | `/api/reports/revenue/` | Gelir raporu |
| GET | `/api/reports/company-debts/` | Tüm firma borçları |
| GET | `/api/reports/guest-stats/` | Misafir istatistikleri |

### Activity Logs
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/activity-logs/` | İşlem geçmişi |

---

## 14. RBAC (Rol Bazlı Erişim Kontrolü)

> **RBAC nedir?**
> Role-Based Access Control. Kim neye erişebilir sorusunun cevabı.
> Django REST Framework'te her view'a `permission_classes` eklenir.
> İstek geldiğinde önce token doğrulanır (kim?), sonra permission kontrol edilir (yetkisi var mı?).

### 14.1 Django Permission Sınıfları

```python
# apps/accounts/permissions.py

from rest_framework.permissions import BasePermission

class IsPatron(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'patron'

class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('patron', 'manager')

class IsReception(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('patron', 'manager', 'reception')

class CanViewFinancials(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ('patron', 'manager')

class CanManageRooms(BasePermission):
    """GET herkes görebilir, CRUD sadece patron/manager."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user.role in ('patron', 'manager', 'reception')
        return request.user.role in ('patron', 'manager')

class CanUpdateRoomStatus(BasePermission):
    """Housekeeping de oda durumu güncelleyebilir."""
    def has_permission(self, request, view):
        return request.user.role in ('patron', 'manager', 'reception', 'housekeeper')
```

### 14.2 Yetki Matrisi

| Endpoint Grubu | Patron | Müdür | Resepsiyon | Garson | Aşçı | Teknisyen | Housekeeping |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard (tam) | R | R | R (cirosuz) | - | - | - | - |
| Oda CRUD | CRUD | CRUD | R | - | - | - | - |
| Oda Durum Güncelle | W | W | W | - | - | - | W |
| Rezervasyon | CRUD | CRUD | CRUD | - | - | - | - |
| Check-in/out | W | W | W | - | - | - | - |
| Misafir | CRUD | CRUD | CRUD | - | - | - | - |
| Firma | CRUD | CRUD | R | - | - | - | - |
| Folio & Ödeme | CRUD | CRUD | CRUD | - | - | - | - |
| Fatura | CRUD | CRUD | R | - | - | - | - |
| Vardiya | CRUD | CRUD | CRUD | - | - | - | - |
| Night Audit | W | W | W | - | - | - | - |
| Borç Raporu/PDF | RW | RW | R | - | - | - | - |
| Personel Yönetimi | CRUD | R | - | - | - | - | - |
| Otel Bilgi/Kanal | CRUD | CRUD | - | - | - | - | - |
| Arıza Bildir | W | W | W | W | W | W | W |
| Arıza Listesi | R | R | - | - | - | RW | - |
| Oda Servisi | RW | RW | RW | RW | - | - | - |
| Stok | RW | RW | - | - | - | - | - |
| Yemek Programı | RW | - | - | - | RW | - | - |
| Alışveriş | RW | RW | - | RW | RW | - | - |
| Raporlar | R | R | - | - | - | - | - |
| Activity Logs | R | R | - | - | - | - | - |

---

## 15. Celery Zamanlanmış Görevler

```python
# config/celery.py

CELERY_BEAT_SCHEDULE = {
    # Her ayın 1'inde firma borç özetlerini otomatik gönder
    'monthly-company-debt-reports': {
        'task': 'apps.notifications.tasks.send_auto_monthly_debt_reports',
        'schedule': crontab(day_of_month='1', hour='9', minute='0'),
    },

    # Her gün gece 00:05'te otomatik oda ücretlerini folio'ya ekle
    # NOT: Bu, night audit'in otomatik versiyonu. Manuel tetikleme de var.
    'daily-room-charges': {
        'task': 'apps.billing.tasks.generate_daily_room_charges',
        'schedule': crontab(hour='0', minute='5'),
    },

    # Her gün 08:00'de bugünkü check-in/out hatırlatması
    'daily-reminders': {
        'task': 'apps.notifications.tasks.send_daily_reminders',
        'schedule': crontab(hour='8', minute='0'),
    },

    # No-show kontrolü: Check-in tarihi geçmiş ama gelmemiş
    'no-show-check': {
        'task': 'apps.reservations.tasks.mark_no_shows',
        'schedule': crontab(hour='23', minute='59'),
    },
}
```

---

## 16. Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: grandhotel
      POSTGRES_USER: grandhotel
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  web:
    build: .
    command: daphne -b 0.0.0.0 -p 8000 config.asgi:application
    environment:
      - DATABASE_URL=postgres://grandhotel:${DB_PASSWORD}@db:5432/grandhotel
      - REDIS_URL=redis://redis:6379/0
      - DJANGO_SETTINGS_MODULE=config.settings.production
    volumes:
      - .:/app
      - media_data:/app/media
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis

  celery:
    build: .
    command: celery -A config worker -l info
    environment:
      - DATABASE_URL=postgres://grandhotel:${DB_PASSWORD}@db:5432/grandhotel
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  celery-beat:
    build: .
    command: celery -A config beat -l info
    environment:
      - DATABASE_URL=postgres://grandhotel:${DB_PASSWORD}@db:5432/grandhotel
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  media_data:
```

---

## 17. Performans & Güvenlik

### Performans
| Önlem | Uygulama |
|---|---|
| **DB Indexing** | Tüm FK'lar, status, tarih alanları indexli |
| **Query Optimization** | `select_related` / `prefetch_related` ile N+1 önleme |
| **Pagination** | Tüm liste endpoint'lerinde `PageNumberPagination` (25/sayfa) |
| **Redis Cache** | Dashboard metrikleri 60sn cache, oda durumları cache |
| **DB Connection Pool** | `django-db-connection-pool` ile bağlantı havuzu |
| **Async WS** | Django Channels async consumer (bloklama yok) |
| **Bulk Operations** | Günlük oda ücreti ekleme `bulk_create` ile |

### Güvenlik
| Önlem | Uygulama |
|---|---|
| **JWT** | Access (15dk) + Refresh (7gün), blacklist |
| **RBAC** | Her endpoint'te permission class kontrolü |
| **Hotel Isolation** | QuerySet her zaman `hotel_id` filtreli (multi-tenant) |
| **Rate Limiting** | `django-ratelimit`: login 5/dk, API 100/dk |
| **CORS** | `django-cors-headers` ile whitelist |
| **Input Validation** | DRF serializer validation + custom validators |
| **SQL Injection** | Django ORM (raw SQL yok) |
| **Audit Trail** | Her değişiklik activity_logs'a yazılır |
| **Sensitive Data** | TC kimlik maskeleme, şifre bcrypt hash |

---

## 18. requirements/base.txt

```
Django==5.1
djangorestframework==3.15
djangorestframework-simplejwt==5.3
django-cors-headers==4.3
django-filter==24.3
drf-spectacular==0.27

# Channels & WebSocket
channels==4.1
channels-redis==4.2
daphne==4.1

# Database
psycopg[binary]==3.2
django-db-connection-pool==1.2

# Task Queue
celery==5.4
django-celery-beat==2.6
redis==5.0

# PDF
weasyprint==62.3

# Storage
django-storages==1.14
boto3==1.34

# Utils
django-model-utils==4.5    # FieldTracker (signal'da eski değer takibi)
django-ratelimit==4.1
Pillow==10.4               # Fotoğraf işleme
python-decouple==3.8       # .env yönetimi
gunicorn==22.0             # Production WSGI
```

---

## 19. Geliştirme Fazları

```
Hafta 1-2  │████████│ Proje kurulum, Docker, Auth (branchCode+staffNumber+password), User modeli, JWT, RBAC
Hafta 3-4  │████████│ Hotel modeli (bilgi/belge/görsel), Room & RoomType CRUD, WebSocket (oda durumu)
Hafta 5-6  │████████│ Guest, Company modeli, CRUD API, firma-misafir ilişkileri
Hafta 7-8  │████████│ Reservation, Check-in/out, Reservation guests, Room change
Hafta 9-10 │████████│ Folio (genişletilmiş kategoriler), Payment, Borç takibi, PDF, Mail
Hafta 11   │████████│ Fatura sistemi, Vardiya devir teslim, Night audit
Hafta 12   │████████│ Online kanal, Public booking API
Hafta 13   │████████│ Operations (arıza, oda servisi, stok, yemek), Staff
Hafta 14   │████████│ Reports, Activity logs, Celery tasks, test & deploy
```
