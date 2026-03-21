# GrandHotel PMS - Planlama Stratejisi

## 1. Vizyon

**Türkiye'nin en modern, mobil-öncelikli otel yönetim platformu** olmak. Tek bir platformda PMS, POS, personel, stok ve muhasebe yönetimini birleştirerek otelcilerin operasyonel verimliliğini artırmak.

---

## 2. Ürün Mimarisi

### Teknoloji Stack
| Katman | Teknoloji |
|---|---|
| **Frontend (Web)** | React + Material UI (MUI) |
| **Frontend (Mobil)** | React Native veya Flutter |
| **Backend** | Node.js (Express/NestJS) veya .NET Core |
| **Veritabanı** | PostgreSQL (multi-tenant) |
| **Cache** | Redis |
| **Dosya Depolama** | AWS S3 / MinIO |
| **Ödeme** | iyzico Entegrasyonu |
| **SMS** | Netgsm / İleti Merkezi |
| **Bildirim** | Firebase Cloud Messaging |
| **Deployment** | Docker + Kubernetes |
| **CI/CD** | GitHub Actions |

### Multi-Tenant Mimari
```
┌─────────────────────────────────────────┐
│              GrandHotel Cloud            │
├─────────────────────────────────────────┤
│  Shared Application Layer (React + API) │
├──────────┬──────────┬───────────────────┤
│  Otel A  │  Otel B  │  Otel C  │  ...  │
│  (DB)    │  (DB)    │  (DB)    │       │
└──────────┴──────────┴───────────────────┘
```
- **Strateji:** Shared app, isolated database (her otel ayrı schema/database)
- **Avantaj:** Veri izolasyonu + kolay ölçeklendirme

---

## 3. Modül Haritası

### Ana Modüller

```
GrandHotel PMS
├── 🏨 Oda Yönetimi (Room Management)
│   ├── Oda listesi & durumları
│   ├── Oda tipleri & fiyatlandırma
│   ├── Oda blokaj & bakım
│   └── Oda raporu
│
├── 📋 Rezervasyon (Reservation)
│   ├── Yeni rezervasyon
│   ├── Rezervasyon listesi & takvim
│   ├── Check-in / Check-out
│   ├── Folio yönetimi
│   ├── SMS bildirim (tel no ile)
│   └── Online ödeme (iyzico)
│
├── 👥 Müşteri Yönetimi (Guest Management)
│   ├── Şahıs kayıtları
│   ├── Firma kayıtları & yetkili bilgisi
│   ├── Firma altında müşteri listeleme
│   ├── Firma raporu
│   └── Çıkışta firmaya otomatik mail
│
├── 👨‍🍳 Personel Yönetimi (Staff Management)
│   ├── Eleman ekleme (isim, soyisim, tel, şifre)
│   ├── Rol atama
│   ├── İzin takibi
│   ├── Vardiya planı
│   ├── QR giriş/çıkış
│   └── Mobil hesap oluşturma
│
├── 🔐 Rol & Yetki Sistemi (RBAC)
│   ├── Roller: patron, müdür, resepsiyon, garson, aşçı, teknik, housekeeping
│   ├── Modül bazlı yetki
│   ├── İşlem bazlı yetki (görüntüle/ekle/düzenle/sil)
│   └── İşlem logları
│
├── ☕ Kafe/Restoran POS
│   ├── Ürün tanımlama
│   ├── Masa düzeni
│   ├── Adisyon oluşturma
│   ├── Garson mobil sipariş
│   └── Odaya harcama yansıtma
│
├── 🧹 Housekeeping
│   ├── Oda durumları (boş/dolu/temiz/kirli)
│   ├── Temizlik talepleri
│   ├── Problem bildirimi (fotoğraflı)
│   └── Teknik ekibe otomatik bildirim
│
├── 🔧 Teknik Bakım
│   ├── Arıza bildirimleri (fotoğraflı)
│   ├── Görev listesi
│   ├── Tamamlanan işler
│   └── Bakım geçmişi
│
├── 🍳 Mutfak Yönetimi
│   ├── Haftalık/aylık yemek programı
│   ├── Kahvaltı programı
│   ├── Yemek malzeme listesi (stoktan)
│   ├── Eksik malzeme bildirimi
│   └── Tüm personele yemek programı görünümü
│
├── 📦 Stok Yönetimi
│   ├── Ürün tanımlama
│   ├── Stok giriş/çıkış
│   ├── Alım fiyatı & miktar takibi
│   ├── Eksik stok bildirimi
│   └── Stok raporu
│
├── 💰 Muhasebe & Finans
│   ├── Günlük ciro
│   ├── Gelir/gider takibi
│   ├── Sabit giderler (elektrik, su, doğalgaz + fiş görseli)
│   ├── Kar hesaplama
│   ├── Cari hesap listesi & detay
│   └── Fatura yönetimi
│
└── 📊 Raporlama
    ├── Günlük otel özeti (gece 00:00)
    ├── Aylık rapor (ay başı)
    ├── Satılan oda sayısı
    ├── Otel cirosu
    ├── Kullanılan malzeme
    ├── Fatura özeti
    ├── Oda raporu
    └── Firma raporu
```

---

## 4. Rol & Yetki Matrisi

| Modül | Patron | Müdür | Resepsiyon | Garson | Aşçı | Teknik | Housekeeping |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard (Ciro/Kazanç) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Oda Yönetimi | ✅ Tam | ✅ Tam | 👁 Görüntüle | ❌ | ❌ | ❌ | 👁 Durum |
| Rezervasyon | ✅ Tam | ✅ Tam | ✅ Oluştur/Düzenle | ❌ | ❌ | ❌ | ❌ |
| Fiyat Değiştirme | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Oda Silme | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Müşteri/Firma | ✅ Tam | ✅ Tam | ✅ Ekle/Düzenle | ❌ | ❌ | ❌ | ❌ |
| Folio | ✅ Tam | ✅ Tam | ✅ Ekle | ❌ | ❌ | ❌ | ❌ |
| Personel | ✅ Ekle/Çıkar | ✅ Ekle/Çıkar | ❌ | ❌ | ❌ | ❌ | ❌ |
| Kafe POS | ✅ | ✅ | ❌ | ✅ Sipariş | ❌ | ❌ | ❌ |
| Housekeeping | ✅ | ✅ | 👁 | ❌ | ❌ | ❌ | ✅ Tam |
| Arıza Bildirimi | ✅ | ✅ | ✅ | ✅ Bildir | ❌ | ✅ Tam | ✅ Bildir |
| Mutfak/Yemek | ✅ | ✅ | 👁 Program | 👁 Program | ✅ Tam | ❌ | 👁 Program |
| Stok | ✅ Tam | ✅ Tam | ❌ | ❌ | ✅ Eksik Bildir | ❌ | ❌ |
| Muhasebe | ✅ Tam | ✅ Tam | ❌ | ❌ | ❌ | ❌ | ❌ |
| Raporlar | ✅ Tam | ✅ Tam | 📋 Sınırlı | ❌ | ❌ | ❌ | ❌ |
| Gider Girişi | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| İşlem Logları | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Geliştirme Fazları

### Faz 1: MVP (Hafta 1-12) — Çekirdek PMS
**Hedef:** Temel otel operasyonlarını dijitalleştir

| Modül | Kapsam |
|---|---|
| Auth & RBAC | Login, rol sistemi, yetki kontrolü |
| Dashboard | Özet bilgiler (rol bazlı) |
| Oda Yönetimi | CRUD, durum takibi, oda tipleri |
| Rezervasyon | Oluştur, listele, takvim, check-in/out |
| Müşteri | Şahıs/firma kayıt, listeleme |
| Folio | Basit folio ekleme |
| Temel Raporlar | Günlük özet, oda raporu |

### Faz 2: Operasyon (Hafta 13-20)
**Hedef:** Otel içi operasyonları dijitalleştir

| Modül | Kapsam |
|---|---|
| Housekeeping | Oda durum takibi, fotoğraflı bildirim |
| Teknik Bakım | Arıza yönetimi, görev listesi |
| Personel | Eleman ekleme, mobil hesap, izin |
| Mobil Uygulama | Temel mobil erişim (rol bazlı) |

### Faz 3: Finans & POS (Hafta 21-28)
**Hedef:** Mali yönetim ve kafe/restoran

| Modül | Kapsam |
|---|---|
| Kafe POS | Ürün, masa, adisyon, odaya yansıtma |
| Stok | Ürün tanım, giriş/çıkış, eksik bildirim |
| Muhasebe | Gelir/gider, fatura, cari hesap |
| Mutfak | Yemek programı, malzeme listesi |

### Faz 4: Entegrasyon & Ölçeklendirme (Hafta 29-36)
**Hedef:** Dış sistem entegrasyonları ve genişleme

| Modül | Kapsam |
|---|---|
| iyzico Ödeme | Online ödeme entegrasyonu |
| SMS | Rezervasyon SMS bildirimi |
| E-mail | Firma çıkış raporu otomatik mail |
| Multi-tenant | Farklı oteller için altyapı |
| Gelişmiş Raporlar | Aylık raporlar, otomatik gece raporu |

---

## 6. Sprint Planlaması (MVP Detayı)

### Sprint 1 (Hafta 1-2): Proje Altyapısı
- [ ] React + MUI proje kurulumu
- [ ] Klasör yapısı ve mimari kararlar
- [ ] Tema & design system oluşturma
- [ ] Router yapısı
- [ ] Auth sayfaları (Login)
- [ ] Layout (Sidebar, Header, Breadcrumb)

### Sprint 2 (Hafta 3-4): Dashboard & Oda Yönetimi
- [ ] Dashboard tasarımı (rol bazlı kartlar)
- [ ] Oda listesi sayfası
- [ ] Oda ekleme/düzenleme
- [ ] Oda durum yönetimi (boş/dolu/bakımda/kirli)
- [ ] Oda tipi tanımlama

### Sprint 3 (Hafta 5-6): Rezervasyon Sistemi
- [ ] Rezervasyon listesi (tablo + filtre)
- [ ] Yeni rezervasyon formu
- [ ] Rezervasyon detay sayfası
- [ ] Takvim görünümü
- [ ] Check-in akışı

### Sprint 4 (Hafta 7-8): Müşteri & Check-out
- [ ] Müşteri listesi
- [ ] Müşteri detay
- [ ] Firma kaydı oluşturma
- [ ] Firma altında müşteri listeleme
- [ ] Check-out akışı
- [ ] Folio ekleme

### Sprint 5 (Hafta 9-10): Kullanıcı & Yetki
- [ ] Kullanıcı listesi
- [ ] Eleman ekleme formu
- [ ] Rol tanımlama
- [ ] Yetki matrisi ekranı
- [ ] İşlem logları

### Sprint 6 (Hafta 11-12): Raporlar & Polish
- [ ] Günlük özet rapor
- [ ] Oda raporu
- [ ] Firma raporu
- [ ] UI/UX iyileştirmeler
- [ ] Bug fix & test
- [ ] MVP deploy

---

## 7. Satış & Büyüme Stratejisi

### Go-to-Market Planı

**Aşama 1: Pilot (Ay 1-3)**
- 3-5 otel ile ücretsiz pilot
- Gerçek kullanım geri bildirimi
- Referans müşteri oluşturma

**Aşama 2: Erken Benimseyen (Ay 4-6)**
- %50 indirimli erken kullanıcı fiyatı
- 20-30 otel hedefi
- Case study oluşturma

**Aşama 3: Büyüme (Ay 7-12)**
- Tam fiyatlandırma
- Dijital pazarlama (Google Ads, LinkedIn)
- Otel fuarları ve etkinlikler
- 100+ otel hedefi

### Pazarlama Kanalları
1. **Dijital:** Google Ads, sosyal medya, SEO
2. **Direkt Satış:** Otel ziyaretleri, demo sunumları
3. **Referans:** Mevcut müşteri referans programı
4. **Etkinlik:** EMITT, ACE of M.I.C.E. fuarları
5. **İçerik:** Blog, webinar, YouTube eğitim videoları

---

## 8. Başarı Metrikleri (KPI)

| Metrik | 6 Ay Hedef | 12 Ay Hedef |
|---|---|---|
| Aktif Otel Sayısı | 20 | 100 |
| MRR (Aylık Gelir) | 100,000 TL | 500,000 TL |
| Churn Rate | <%5 | <%3 |
| NPS Skoru | 40+ | 50+ |
| Uptime | %99.5 | %99.9 |
| Ortalama Onboarding Süresi | 3 gün | 1 gün |
