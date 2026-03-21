# GrandHotel PMS - MVP (Minimum Viable Product)

## MVP Kapsamı

MVP, bir otelin **temel günlük operasyonlarını** dijital ortamda yürütebilmesi için gereken minimum özellikleri içerir. Hedef: **12 haftada çalışan bir ürün.**

---

## 1. MVP Modülleri

### 1.1 Kimlik Doğrulama & Yetkilendirme (Auth & RBAC)

**Ekranlar:**
| Ekran | Açıklama |
|---|---|
| Login | E-posta/telefon + şifre ile giriş |
| Şifre Sıfırlama | SMS/e-posta ile şifre yenileme |

**Özellikler:**
- JWT tabanlı kimlik doğrulama
- Refresh token mekanizması
- Rol bazlı erişim kontrolü (RBAC)
- Oturum yönetimi (tek cihaz / çoklu cihaz)
- Başarısız giriş denemesi limiti

**Roller (MVP):**
| Rol | Web | Mobil | Açıklama |
|---|:---:|:---:|---|
| Patron | ✅ | ✅ | Tam yetki, tüm modüllere erişim |
| Müdür | ✅ | ✅ | Patron gibi, eleman silme hariç |
| Resepsiyon | ✅ | ❌ | Rezervasyon, müşteri, oda işlemleri |

> **Not:** Garson, aşçı, teknik, housekeeping rolleri Faz 2'de mobil uygulama ile birlikte gelecek.

---

### 1.2 Dashboard

**Patron/Müdür Dashboard:**
```
┌──────────────────────────────────────────────────────┐
│  GrandHotel Dashboard                    👤 Admin ▾  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Toplam   │ │ Dolu    │ │ Boş     │ │ Bakımda │   │
│  │ Oda: 45  │ │ 32      │ │ 11      │ │ 2       │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Bugünkü  │ │ Günlük  │ │ Aylık   │ │ Check-in│   │
│  │ Rez: 5   │ │ Ciro    │ │ Ciro    │ │ Bekle:3 │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                      │
│  ┌─────────────────────┐ ┌────────────────────────┐  │
│  │ Bugünkü Check-in'ler│ │ Bugünkü Check-out'lar │  │
│  │ - Ali Yılmaz  #201  │ │ - Mehmet Kaya  #305   │  │
│  │ - Ayşe Demir  #102  │ │ - Fatma Şahin #410   │  │
│  │ - ...               │ │ - ...                 │  │
│  └─────────────────────┘ └────────────────────────┘  │
│                                                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Doluluk Grafiği (Son 30 Gün)                   │  │
│  │ ▓▓▓▓▓▓▓░░░ %72                                │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Resepsiyon Dashboard:**
- Aynı kartlar AMA ciro/kazanç bilgileri **gizli**
- Sadece oda durumu, bugünkü check-in/out, bekleyen rezervasyonlar

**Veri Kartları:**
| Kart | Patron/Müdür | Resepsiyon |
|---|:---:|:---:|
| Toplam/Dolu/Boş/Bakımda Oda | ✅ | ✅ |
| Bugünkü Rezervasyonlar | ✅ | ✅ |
| Bugünkü Check-in Listesi | ✅ | ✅ |
| Bugünkü Check-out Listesi | ✅ | ✅ |
| Günlük Ciro | ✅ | ❌ |
| Aylık Ciro | ✅ | ❌ |
| Doluluk Oranı | ✅ | ✅ |
| Son İşlemler | ✅ | ✅ |

---

### 1.3 Oda Yönetimi

**Ekranlar:**
| Ekran | Açıklama |
|---|---|
| Oda Listesi | Tüm odalar, filtre ve arama |
| Oda Ekleme/Düzenleme | Oda bilgileri formu |
| Oda Tipi Yönetimi | Tip tanımlama (standart, suite vb.) |
| Oda Durum Paneli | Görsel oda haritası |

**Oda Durumları:**
```
🟢 Boş & Temiz     → Satışa hazır
🔴 Dolu            → Misafir var
🟡 Kirli           → Temizlik bekliyor
🔵 Bakımda         → Teknik bakımda
⚫ Bloke           → Satışa kapalı
```

**Oda Bilgileri:**
| Alan | Tip | Zorunlu |
|---|---|:---:|
| Oda No | Text | ✅ |
| Oda Tipi | Select (Standart, Deluxe, Suite, vb.) | ✅ |
| Kat | Number | ✅ |
| Kapasite (Yetişkin) | Number | ✅ |
| Kapasite (Çocuk) | Number | ❌ |
| Yatak Tipi | Select (Tek, Çift, Twin, King) | ✅ |
| Gecelik Fiyat (TL) | Currency | ✅ |
| Durum | Select | ✅ |
| Manzara | Select (Deniz, Şehir, Bahçe, Yok) | ❌ |
| Oda Özellikleri | Multi-select (Balkon, Minibar, Küvet, vb.) | ❌ |
| Açıklama/Not | Textarea | ❌ |

**İşlemler & Yetkiler:**
| İşlem | Patron | Müdür | Resepsiyon |
|---|:---:|:---:|:---:|
| Oda Görüntüleme | ✅ | ✅ | ✅ |
| Oda Ekleme | ✅ | ✅ | ❌ |
| Oda Düzenleme | ✅ | ✅ | ❌ |
| Oda Silme | ✅ | ✅ | ❌ |
| Fiyat Değiştirme | ✅ | ✅ | ❌ |
| Durum Değiştirme | ✅ | ✅ | ✅ (sınırlı) |

---

### 1.4 Rezervasyon Sistemi

**Ekranlar:**
| Ekran | Açıklama |
|---|---|
| Rezervasyon Listesi | Tablo görünümü, filtre, arama |
| Takvim Görünümü | Aylık/haftalık oda doluluk takvimi |
| Yeni Rezervasyon | Adım adım rezervasyon formu |
| Rezervasyon Detay | Tüm detaylar, işlem geçmişi |
| Check-in Ekranı | Giriş işlemleri |
| Check-out Ekranı | Çıkış işlemleri, folio özeti |

**Rezervasyon Durumları:**
```
📝 Beklemede       → Oluşturuldu, onay bekliyor
✅ Onaylandı       → Kesinleşti
🏨 Check-in       → Misafir otelde
🚪 Check-out      → Çıkış yapıldı
❌ İptal           → İptal edildi
🚫 No-show        → Gelmedi
```

**Yeni Rezervasyon Formu:**
```
┌──────────────────────────────────────────────────────┐
│  Yeni Rezervasyon                                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Adım 1: Tarih & Oda Seçimi                         │
│  ┌────────────────┐  ┌────────────────┐              │
│  │ Giriş Tarihi   │  │ Çıkış Tarihi   │             │
│  │ 📅 15.03.2026  │  │ 📅 18.03.2026  │             │
│  └────────────────┘  └────────────────┘              │
│  Yetişkin: [2]  Çocuk: [1]                           │
│                                                      │
│  Müsait Odalar:                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ ☐ #201 Standart - Çift Kişilik  500 TL/gece│    │
│  │ ☐ #305 Deluxe - King Size      750 TL/gece │    │
│  │ ☐ #410 Suite - Deniz Manzara  1200 TL/gece │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Adım 2: Misafir Bilgileri                          │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ Ad           │  │ Soyad        │                  │
│  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ Telefon      │  │ E-posta      │                  │
│  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ TC Kimlik No │  │ Uyruk        │                  │
│  └──────────────┘  └──────────────┘                  │
│  ☐ Firma Reservasyonu                                │
│  └─ Firma Seç: [▾ Firma Listesi]                    │
│                                                      │
│  Adım 3: Ödeme & Onay                              │
│  Toplam: 3 gece × 750 TL = 2,250 TL                │
│  Ödeme Durumu: [ ] Ödenmedi [ ] Kısmi [ ] Tam      │
│  Not: [________________________]                     │
│                                                      │
│  [İptal]                      [Rezervasyon Oluştur] │
└──────────────────────────────────────────────────────┘
```

**Rezervasyon Alanları:**
| Alan | Tip | Zorunlu |
|---|---|:---:|
| Giriş Tarihi | Date | ✅ |
| Çıkış Tarihi | Date | ✅ |
| Oda | Select | ✅ |
| Yetişkin Sayısı | Number | ✅ |
| Çocuk Sayısı | Number | ❌ |
| Misafir Adı | Text | ✅ |
| Misafir Soyadı | Text | ✅ |
| Telefon | Phone | ✅ |
| E-posta | Email | ❌ |
| TC Kimlik No | Text | ✅ (check-in'de) |
| Uyruk | Select | ❌ |
| Firma | Select | ❌ |
| Ödeme Durumu | Select | ✅ |
| Gecelik Fiyat | Currency | ✅ (otomatik) |
| Toplam Tutar | Currency | ✅ (otomatik) |
| Not | Textarea | ❌ |
| Kaynak | Select (Walk-in, Telefon, Web, OTA) | ❌ |

**Check-in İşlemi:**
1. Rezervasyon seçilir
2. TC Kimlik kontrolü yapılır
3. Oda anahtarı teslim edilir
4. Durum "Check-in" olarak güncellenir
5. Oda durumu "Dolu" olur

**Check-out İşlemi:**
1. Oda seçilir
2. Folio özeti görüntülenir (oda ücreti + ekstra harcamalar)
3. Ödeme alınır / onaylanır
4. Durum "Check-out" olarak güncellenir
5. Oda durumu "Kirli" olur
6. Firma rezervasyonuysa → firmaya otomatik rapor (Faz 4'te)

---

### 1.5 Müşteri Yönetimi

**Ekranlar:**
| Ekran | Açıklama |
|---|---|
| Müşteri Listesi | Tüm bireysel müşteriler |
| Müşteri Detay | Kişi bilgileri + konaklama geçmişi |
| Firma Listesi | Tüm kurumsal müşteriler |
| Firma Detay | Firma bilgileri + yetkili + müşteri listesi |
| Firma Ekleme | Firma kayıt formu |

**Müşteri (Şahıs) Alanları:**
| Alan | Tip | Zorunlu |
|---|---|:---:|
| Ad | Text | ✅ |
| Soyad | Text | ✅ |
| TC Kimlik / Pasaport No | Text | ❌ |
| Telefon | Phone | ✅ |
| E-posta | Email | ❌ |
| Uyruk | Select | ❌ |
| Doğum Tarihi | Date | ❌ |
| Adres | Textarea | ❌ |
| Not | Textarea | ❌ |
| VIP | Boolean | ❌ |

**Firma Alanları:**
| Alan | Tip | Zorunlu |
|---|---|:---:|
| Firma Adı | Text | ✅ |
| Vergi Dairesi | Text | ✅ |
| Vergi No | Text | ✅ |
| Adres | Textarea | ✅ |
| Telefon | Phone | ✅ |
| E-posta | Email | ✅ |
| Yetkili Adı | Text | ✅ |
| Yetkili Telefon | Phone | ✅ |
| Yetkili E-posta | Email | ❌ |
| Anlaşmalı Fiyat | Currency | ❌ |
| Not | Textarea | ❌ |

---

### 1.6 Folio (Hesap) Yönetimi

**Folio:** Bir misafirin konaklama süresince tüm harcamalarının tutulduğu hesap.

**Folio Kalemleri:**
| Kalem Tipi | Açıklama |
|---|---|
| Oda Ücreti | Gecelik oda ücreti (otomatik) |
| Minibar | Minibar tüketimi |
| Restoran/Kafe | POS'tan yansıyan harcama (Faz 3) |
| Ek Hizmet | Ütü, çamaşır, transfer vb. |
| İndirim | Uygulanan indirimler |
| Ödeme | Yapılan ödemeler |

**Folio Ekranı:**
```
┌──────────────────────────────────────────────────┐
│  Folio - Oda #201 - Ali Yılmaz                  │
├──────────────────────────────────────────────────┤
│  Tarih      │ Açıklama          │ Tutar         │
│  ──────────────────────────────────────────────  │
│  15.03.2026 │ Oda Ücreti        │    750,00 TL  │
│  16.03.2026 │ Oda Ücreti        │    750,00 TL  │
│  16.03.2026 │ Minibar           │     85,00 TL  │
│  17.03.2026 │ Oda Ücreti        │    750,00 TL  │
│  17.03.2026 │ Çamaşır Hizmeti   │    120,00 TL  │
│  ──────────────────────────────────────────────  │
│             │ TOPLAM            │  2.455,00 TL  │
│             │ Ödenen            │ -1.000,00 TL  │
│             │ KALAN             │  1.455,00 TL  │
├──────────────────────────────────────────────────┤
│  [+ Harcama Ekle]  [+ Ödeme Ekle]  [Yazdır]    │
└──────────────────────────────────────────────────┘
```

---

### 1.7 Temel Raporlar

**MVP Raporları:**
| Rapor | İçerik | Yetki |
|---|---|---|
| Günlük Özet | Satılan oda, doluluk, ciro | Patron, Müdür |
| Oda Raporu | Oda bazında doluluk, gelir | Patron, Müdür, Resepsiyon (cirosuz) |
| Rezervasyon Raporu | Tarih aralığı, kaynak, durum | Patron, Müdür, Resepsiyon |
| Müşteri Raporu | Müşteri sayısı, tekrar oranı | Patron, Müdür |
| Firma Raporu | Firma bazında konaklama/gelir | Patron, Müdür, Resepsiyon |

---

## 2. MVP Dışında Kalanlar (Sonraki Fazlar)

| Özellik | Faz |
|---|---|
| Mobil uygulama | Faz 2 |
| Garson, aşçı, teknik, housekeeping rolleri | Faz 2 |
| Housekeeping modülü | Faz 2 |
| Teknik bakım (fotoğraflı arıza) | Faz 2 |
| Personel yönetimi (izin, vardiya, QR) | Faz 2 |
| Kafe/Restoran POS | Faz 3 |
| Stok yönetimi | Faz 3 |
| Mutfak/yemek programı | Faz 3 |
| Muhasebe (gelir/gider, fatura) | Faz 3 |
| iyzico ödeme entegrasyonu | Faz 4 |
| SMS bildirimi | Faz 4 |
| Otomatik mail (firma çıkış raporu) | Faz 4 |
| Multi-tenant (çoklu otel) | Faz 4 |
| OTA entegrasyonu (Booking.com vb.) | Faz 5 |
| Dinamik fiyatlandırma | Faz 5 |
| Booking engine (direkt web) | Faz 5 |

---

## 3. MVP Teknik Mimari

### Klasör Yapısı (React + MUI)
```
grandhotel-web/
├── public/
├── src/
│   ├── api/                    # API istekleri
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   ├── reservations.js
│   │   ├── guests.js
│   │   └── reports.js
│   │
│   ├── assets/                 # Görseller, ikonlar
│   │
│   ├── components/             # Paylaşılan bileşenler
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   └── Breadcrumb.jsx
│   │   ├── common/
│   │   │   ├── DataTable.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── EmptyState.jsx
│   │   └── forms/
│   │       ├── FormField.jsx
│   │       ├── DatePicker.jsx
│   │       └── PhoneInput.jsx
│   │
│   ├── contexts/               # React Context
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.js
│   │   ├── usePermission.js
│   │   └── useApi.js
│   │
│   ├── pages/                  # Sayfa bileşenleri
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── rooms/
│   │   │   ├── RoomList.jsx
│   │   │   ├── RoomForm.jsx
│   │   │   ├── RoomDetail.jsx
│   │   │   └── RoomStatusPanel.jsx
│   │   ├── reservations/
│   │   │   ├── ReservationList.jsx
│   │   │   ├── ReservationForm.jsx
│   │   │   ├── ReservationDetail.jsx
│   │   │   ├── ReservationCalendar.jsx
│   │   │   ├── CheckIn.jsx
│   │   │   └── CheckOut.jsx
│   │   ├── guests/
│   │   │   ├── GuestList.jsx
│   │   │   ├── GuestDetail.jsx
│   │   │   ├── CompanyList.jsx
│   │   │   ├── CompanyDetail.jsx
│   │   │   └── CompanyForm.jsx
│   │   ├── users/
│   │   │   ├── UserList.jsx
│   │   │   ├── UserForm.jsx
│   │   │   └── RolePermissions.jsx
│   │   └── reports/
│   │       ├── DailySummary.jsx
│   │       ├── RoomReport.jsx
│   │       └── CompanyReport.jsx
│   │
│   ├── routes/                 # Routing
│   │   ├── index.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── theme/                  # MUI Tema
│   │   ├── palette.js
│   │   ├── typography.js
│   │   ├── components.js
│   │   └── index.js
│   │
│   ├── utils/                  # Yardımcı fonksiyonlar
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

### Veritabanı Şeması (MVP)

```sql
-- Oteller (Multi-tenant hazırlık)
hotels
├── id (PK)
├── name
├── address
├── phone
├── email
├── logo_url
├── settings (JSONB)
├── created_at
└── updated_at

-- Kullanıcılar
users
├── id (PK)
├── hotel_id (FK → hotels)
├── first_name
├── last_name
├── email
├── phone
├── password_hash
├── role (enum: patron, manager, reception)
├── is_active
├── last_login
├── created_at
└── updated_at

-- Oda Tipleri
room_types
├── id (PK)
├── hotel_id (FK → hotels)
├── name (Standart, Deluxe, Suite, vb.)
├── base_price
├── description
├── created_at
└── updated_at

-- Odalar
rooms
├── id (PK)
├── hotel_id (FK → hotels)
├── room_type_id (FK → room_types)
├── room_number
├── floor
├── capacity_adult
├── capacity_child
├── bed_type (enum: single, double, twin, king)
├── view_type (enum: sea, city, garden, none)
├── price_override (nullable, gecelik özel fiyat)
├── status (enum: available, occupied, dirty, maintenance, blocked)
├── features (JSONB: balkon, minibar, küvet, vb.)
├── notes
├── created_at
└── updated_at

-- Misafirler
guests
├── id (PK)
├── hotel_id (FK → hotels)
├── first_name
├── last_name
├── identity_number (TC/Pasaport)
├── nationality
├── phone
├── email
├── birth_date
├── address
├── is_vip
├── company_id (FK → companies, nullable)
├── notes
├── created_at
└── updated_at

-- Firmalar
companies
├── id (PK)
├── hotel_id (FK → hotels)
├── name
├── tax_office
├── tax_number
├── address
├── phone
├── email
├── contact_name
├── contact_phone
├── contact_email
├── contracted_rate (nullable)
├── notes
├── is_active
├── created_at
└── updated_at

-- Rezervasyonlar
reservations
├── id (PK)
├── hotel_id (FK → hotels)
├── reservation_no (unique, otomatik)
├── guest_id (FK → guests)
├── room_id (FK → rooms)
├── company_id (FK → companies, nullable)
├── check_in_date
├── check_out_date
├── adult_count
├── child_count
├── nightly_rate
├── total_amount
├── status (enum: pending, confirmed, checked_in, checked_out, cancelled, no_show)
├── payment_status (enum: unpaid, partial, paid)
├── source (enum: walkin, phone, web, ota)
├── notes
├── checked_in_at (timestamp, nullable)
├── checked_out_at (timestamp, nullable)
├── checked_in_by (FK → users, nullable)
├── checked_out_by (FK → users, nullable)
├── created_by (FK → users)
├── created_at
└── updated_at

-- Folio (Hesap Kalemleri)
folio_items
├── id (PK)
├── reservation_id (FK → reservations)
├── date
├── description
├── category (enum: room_charge, minibar, restaurant, service, discount, payment)
├── amount (pozitif: harcama, negatif: ödeme/indirim)
├── created_by (FK → users)
├── created_at
└── updated_at

-- İşlem Logları
activity_logs
├── id (PK)
├── hotel_id (FK → hotels)
├── user_id (FK → users)
├── action (enum: create, update, delete, login, logout, checkin, checkout)
├── entity_type (rooms, reservations, guests, vb.)
├── entity_id
├── details (JSONB: eski/yeni değerler)
├── ip_address
├── created_at
```

---

## 4. API Listesi (MVP)

### Auth
| Method | Endpoint | Açıklama |
|---|---|---|
| POST | /api/auth/login | Giriş yap |
| POST | /api/auth/logout | Çıkış yap |
| POST | /api/auth/refresh | Token yenile |
| POST | /api/auth/forgot-password | Şifre sıfırlama |

### Dashboard
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/dashboard/summary | Özet veriler |
| GET | /api/dashboard/today-checkins | Bugünkü check-in'ler |
| GET | /api/dashboard/today-checkouts | Bugünkü check-out'lar |
| GET | /api/dashboard/occupancy | Doluluk oranı |

### Rooms
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/rooms | Oda listesi |
| GET | /api/rooms/:id | Oda detay |
| POST | /api/rooms | Oda ekle |
| PUT | /api/rooms/:id | Oda güncelle |
| DELETE | /api/rooms/:id | Oda sil |
| PATCH | /api/rooms/:id/status | Durum güncelle |
| GET | /api/rooms/available | Müsait odalar |
| GET | /api/room-types | Oda tipleri |
| POST | /api/room-types | Oda tipi ekle |
| PUT | /api/room-types/:id | Oda tipi güncelle |
| DELETE | /api/room-types/:id | Oda tipi sil |

### Reservations
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/reservations | Rezervasyon listesi |
| GET | /api/reservations/:id | Rezervasyon detay |
| POST | /api/reservations | Yeni rezervasyon |
| PUT | /api/reservations/:id | Güncelle |
| PATCH | /api/reservations/:id/cancel | İptal et |
| POST | /api/reservations/:id/check-in | Check-in |
| POST | /api/reservations/:id/check-out | Check-out |
| GET | /api/reservations/calendar | Takvim verisi |

### Guests
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/guests | Misafir listesi |
| GET | /api/guests/:id | Misafir detay |
| POST | /api/guests | Misafir ekle |
| PUT | /api/guests/:id | Güncelle |
| GET | /api/guests/:id/history | Konaklama geçmişi |

### Companies
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/companies | Firma listesi |
| GET | /api/companies/:id | Firma detay |
| POST | /api/companies | Firma ekle |
| PUT | /api/companies/:id | Güncelle |
| GET | /api/companies/:id/guests | Firma müşterileri |
| GET | /api/companies/:id/report | Firma raporu |

### Folio
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/reservations/:id/folio | Folio listesi |
| POST | /api/reservations/:id/folio | Folio kalemi ekle |
| DELETE | /api/folio/:id | Folio kalemi sil |

### Users
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/users | Kullanıcı listesi |
| GET | /api/users/:id | Kullanıcı detay |
| POST | /api/users | Kullanıcı ekle |
| PUT | /api/users/:id | Güncelle |
| PATCH | /api/users/:id/toggle-active | Aktif/pasif |

### Reports
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/reports/daily | Günlük özet |
| GET | /api/reports/rooms | Oda raporu |
| GET | /api/reports/reservations | Rezervasyon raporu |
| GET | /api/reports/companies/:id | Firma raporu |

### Activity Logs
| Method | Endpoint | Açıklama |
|---|---|---|
| GET | /api/activity-logs | İşlem logları |

---

## 5. UI/UX Kuralları (MVP)

### Renk Paleti
| Kullanım | Renk | Hex |
|---|---|---|
| Primary | Koyu Mavi | #1565C0 |
| Secondary | Altın/Amber | #F59E0B |
| Success | Yeşil | #22C55E |
| Error | Kırmızı | #EF4444 |
| Warning | Turuncu | #F97316 |
| Info | Açık Mavi | #3B82F6 |
| Background | Açık Gri | #F5F5F5 |
| Surface | Beyaz | #FFFFFF |
| Text Primary | Koyu | #1E293B |
| Text Secondary | Gri | #64748B |

### Tipografi
- **Font:** Inter veya Roboto
- **Başlık (H1):** 24px, Bold
- **Alt Başlık (H2):** 20px, SemiBold
- **Gövde:** 14px, Regular
- **Küçük:** 12px, Regular

### Bileşen Standartları
- MUI DataGrid kullan (tablo)
- MUI Dialog kullan (modal)
- MUI Snackbar kullan (bildirim)
- Tüm formlar validation ile
- Loading state her yerde
- Empty state her listede
- Responsive: minimum 1024px genişlik (web)

---

## 6. MVP Zaman Çizelgesi

```
Hafta  1-2  │████████│ Proje kurulumu, Auth, Layout
Hafta  3-4  │████████│ Dashboard, Oda Yönetimi
Hafta  5-6  │████████│ Rezervasyon Sistemi
Hafta  7-8  │████████│ Müşteri/Firma, Check-in/out, Folio
Hafta  9-10 │████████│ Kullanıcı, Yetki, Loglar
Hafta 11-12 │████████│ Raporlar, UI Polish, Test, Deploy
```

**Toplam MVP Süresi: 12 Hafta (3 Ay)**

---

## 7. MVP Başarı Kriterleri

| Kriter | Hedef |
|---|---|
| Otel login olabilmeli | ✅ |
| Oda ekleme/düzenleme/silme | ✅ |
| Rezervasyon oluşturma | ✅ |
| Check-in / Check-out yapabilme | ✅ |
| Folio yönetimi | ✅ |
| Müşteri/firma kaydı | ✅ |
| Rol bazlı erişim kontrolü | ✅ |
| Günlük rapor görüntüleme | ✅ |
| 3 saniyeden kısa sayfa yüklenme | ✅ |
| Mobil responsive (1024px+) | ✅ |
| Pilot otelde 1 hafta sorunsuz kullanım | ✅ |
