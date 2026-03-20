/**
 * Booking Platform - Veri Katmanı
 *
 * Mock otel verileri ve localStorage'dan gerçek otel verisi ile birleştirme.
 * Public booking sitesi için kullanılır.
 */

import {
  CHANNEL_ROOM_TYPE_LABELS,
  ROOM_FEATURES,
  CHANNEL_EXTRA_FEATURES,
  ChannelRoomType,
} from './constants';
import { loadHotelInfo, loadChannelSettings } from './hotelStorage';

/* ==================== INTERFACE'LER ==================== */

export interface BookingRoomConfig {
  id: number;
  roomType: string;
  roomTypeLabel: string;
  description: string;
  pricePerNight: number;
  features: string[];
  featureLabels: string[];
  openQuota: number;
  images: string[];
  reservationsOpen: boolean;
}

export interface BookingHotel {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  starRating: number;
  description: string;
  coverImage: string;
  images: string[];
  startingPrice: number;
  roomConfigs: BookingRoomConfig[];
  amenities: string[];
  isFromLocalStorage: boolean;
}

export interface BookingFilters {
  city: string;
  minPrice: number;
  maxPrice: number;
  starRating: number | null;
  amenities: string[];
}

export const DEFAULT_FILTERS: BookingFilters = {
  city: '',
  minPrice: 0,
  maxPrice: 10000,
  starRating: null,
  amenities: [],
};

/* ==================== YARDIMCILAR ==================== */

const ALL_FEATURES = [...ROOM_FEATURES, ...CHANNEL_EXTRA_FEATURES];
const getFeatureLabel = (value: string): string =>
  ALL_FEATURES.find((f) => f.value === value)?.label || value;

/* ==================== MOCK VERİLER ==================== */

const MOCK_HOTELS: BookingHotel[] = [
  {
    id: 'mock-1',
    name: 'Bosphorus Palace Hotel',
    city: 'İstanbul',
    district: 'Beşiktaş',
    address: 'Çırağan Cad. No:12, Beşiktaş, İstanbul',
    starRating: 5,
    description: 'Boğaz manzaralı lüks otel. Tarihi yarımadaya yakın konumuyla İstanbul\'un kalbinde unutulmaz bir konaklama deneyimi sunar.',
    coverImage: 'linear-gradient(135deg, #0D47A1 0%, #42A5F5 100%)',
    images: [
      'linear-gradient(135deg, #0D47A1 0%, #42A5F5 100%)',
      'linear-gradient(135deg, #1565C0 0%, #64B5F6 100%)',
      'linear-gradient(135deg, #0D47A1 0%, #1E88E5 100%)',
    ],
    startingPrice: 4500,
    amenities: ['wifi', 'breakfast', 'parking', 'room_service', 'jacuzzi', 'balcony'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 101, roomType: 'deluxe', roomTypeLabel: 'Deluxe', description: 'Boğaz manzaralı geniş oda', pricePerNight: 4500, features: ['wifi', 'minibar', 'balcony', 'safe'], featureLabels: ['Wi-Fi', 'Minibar', 'Balkon', 'Kasa'], openQuota: 8, images: [], reservationsOpen: true },
      { id: 102, roomType: 'suite', roomTypeLabel: 'Suite', description: 'Panoramik boğaz manzaralı suite', pricePerNight: 8500, features: ['wifi', 'minibar', 'balcony', 'jacuzzi', 'room_service'], featureLabels: ['Wi-Fi', 'Minibar', 'Balkon', 'Jakuzi', 'Oda Servisi'], openQuota: 3, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-2',
    name: 'Antalya Beach Resort',
    city: 'Antalya',
    district: 'Konyaaltı',
    address: 'Konyaaltı Plajı Yolu No:45, Konyaaltı, Antalya',
    starRating: 5,
    description: 'Akdeniz kıyısında her şey dahil tatil deneyimi. Özel plaj, aquapark ve spa merkezi ile tatilinizi zenginleştirin.',
    coverImage: 'linear-gradient(135deg, #E65100 0%, #FF9800 100%)',
    images: [
      'linear-gradient(135deg, #E65100 0%, #FF9800 100%)',
      'linear-gradient(135deg, #EF6C00 0%, #FFB74D 100%)',
    ],
    startingPrice: 3200,
    amenities: ['wifi', 'breakfast', 'parking', 'room_service', 'tv', 'aircon'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 201, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Deniz manzaralı standart oda', pricePerNight: 3200, features: ['wifi', 'tv', 'aircon', 'minibar'], featureLabels: ['Wi-Fi', 'TV', 'Klima', 'Minibar'], openQuota: 15, images: [], reservationsOpen: true },
      { id: 202, roomType: 'family', roomTypeLabel: 'Aile Odası', description: 'Geniş aile odası, çocuk yatağı dahil', pricePerNight: 4800, features: ['wifi', 'tv', 'aircon', 'minibar', 'safe'], featureLabels: ['Wi-Fi', 'TV', 'Klima', 'Minibar', 'Kasa'], openQuota: 6, images: [], reservationsOpen: true },
      { id: 203, roomType: 'suite', roomTypeLabel: 'Suite', description: 'Denize sıfır lüks suite', pricePerNight: 7200, features: ['wifi', 'minibar', 'balcony', 'jacuzzi', 'room_service'], featureLabels: ['Wi-Fi', 'Minibar', 'Balkon', 'Jakuzi', 'Oda Servisi'], openQuota: 2, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-3',
    name: 'Bodrum Marina Hotel',
    city: 'Muğla',
    district: 'Bodrum',
    address: 'Yalıkavak Marina, Bodrum, Muğla',
    starRating: 4,
    description: 'Bodrum\'un en güzel koyunda, marina manzaralı butik otel. Ege\'nin mavisine karışın.',
    coverImage: 'linear-gradient(135deg, #00695C 0%, #26A69A 100%)',
    images: [
      'linear-gradient(135deg, #00695C 0%, #26A69A 100%)',
      'linear-gradient(135deg, #00796B 0%, #4DB6AC 100%)',
    ],
    startingPrice: 2800,
    amenities: ['wifi', 'breakfast', 'parking', 'balcony', 'coffee'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 301, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Bahçe manzaralı standart oda', pricePerNight: 2800, features: ['wifi', 'tv', 'aircon', 'coffee'], featureLabels: ['Wi-Fi', 'TV', 'Klima', 'Çay/Kahve Seti'], openQuota: 10, images: [], reservationsOpen: true },
      { id: 302, roomType: 'deluxe', roomTypeLabel: 'Deluxe', description: 'Marina manzaralı deluxe oda', pricePerNight: 4200, features: ['wifi', 'minibar', 'balcony', 'tv', 'aircon'], featureLabels: ['Wi-Fi', 'Minibar', 'Balkon', 'TV', 'Klima'], openQuota: 5, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-4',
    name: 'Kapadokya Cave Hotel',
    city: 'Nevşehir',
    district: 'Göreme',
    address: 'Göreme Kasabası, Göreme, Nevşehir',
    starRating: 4,
    description: 'Peri bacaları arasında eşsiz mağara otel deneyimi. Balon turu ve Kapadokya\'nın büyülü atmosferini yaşayın.',
    coverImage: 'linear-gradient(135deg, #4E342E 0%, #8D6E63 100%)',
    images: [
      'linear-gradient(135deg, #4E342E 0%, #8D6E63 100%)',
      'linear-gradient(135deg, #5D4037 0%, #A1887F 100%)',
    ],
    startingPrice: 3500,
    amenities: ['wifi', 'breakfast', 'coffee', 'terrace', 'safe'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 401, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Mağara odası, otantik dekorasyon', pricePerNight: 3500, features: ['wifi', 'coffee', 'safe', 'hairdryer'], featureLabels: ['Wi-Fi', 'Çay/Kahve Seti', 'Kasa', 'Saç Kurutma'], openQuota: 8, images: [], reservationsOpen: true },
      { id: 402, roomType: 'suite', roomTypeLabel: 'Suite', description: 'Teraslı mağara suite, vadi manzarası', pricePerNight: 6000, features: ['wifi', 'minibar', 'terrace', 'jacuzzi', 'coffee'], featureLabels: ['Wi-Fi', 'Minibar', 'Teras', 'Jakuzi', 'Çay/Kahve Seti'], openQuota: 3, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-5',
    name: 'İzmir Kordon Otel',
    city: 'İzmir',
    district: 'Alsancak',
    address: 'Atatürk Cad. No:88, Alsancak, İzmir',
    starRating: 4,
    description: 'Kordon boyunda, deniz manzaralı şehir oteli. İzmir\'in canlı atmosferini keşfedin.',
    coverImage: 'linear-gradient(135deg, #283593 0%, #5C6BC0 100%)',
    images: [
      'linear-gradient(135deg, #283593 0%, #5C6BC0 100%)',
      'linear-gradient(135deg, #303F9F 0%, #7986CB 100%)',
    ],
    startingPrice: 1800,
    amenities: ['wifi', 'breakfast', 'tv', 'aircon', 'parking'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 501, roomType: 'economy', roomTypeLabel: 'Ekonomik', description: 'Şehir manzaralı ekonomik oda', pricePerNight: 1800, features: ['wifi', 'tv', 'aircon'], featureLabels: ['Wi-Fi', 'TV', 'Klima'], openQuota: 12, images: [], reservationsOpen: true },
      { id: 502, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Deniz manzaralı standart oda', pricePerNight: 2500, features: ['wifi', 'tv', 'aircon', 'minibar', 'safe'], featureLabels: ['Wi-Fi', 'TV', 'Klima', 'Minibar', 'Kasa'], openQuota: 8, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-6',
    name: 'Trabzon Uzungöl Resort',
    city: 'Trabzon',
    district: 'Çaykara',
    address: 'Uzungöl Mahallesi, Çaykara, Trabzon',
    starRating: 3,
    description: 'Uzungöl\'ün eşsiz doğasında huzurlu bir konaklama. Yeşil yaylalar ve göl manzarası sizi bekliyor.',
    coverImage: 'linear-gradient(135deg, #1B5E20 0%, #66BB6A 100%)',
    images: [
      'linear-gradient(135deg, #1B5E20 0%, #66BB6A 100%)',
      'linear-gradient(135deg, #2E7D32 0%, #81C784 100%)',
    ],
    startingPrice: 1200,
    amenities: ['wifi', 'breakfast', 'parking', 'tv', 'coffee'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 601, roomType: 'economy', roomTypeLabel: 'Ekonomik', description: 'Göl manzaralı ekonomik oda', pricePerNight: 1200, features: ['wifi', 'tv', 'coffee'], featureLabels: ['Wi-Fi', 'TV', 'Çay/Kahve Seti'], openQuota: 10, images: [], reservationsOpen: true },
      { id: 602, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Göl ve dağ manzaralı oda', pricePerNight: 1800, features: ['wifi', 'tv', 'coffee', 'balcony'], featureLabels: ['Wi-Fi', 'TV', 'Çay/Kahve Seti', 'Balkon'], openQuota: 6, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-7',
    name: 'Çeşme Alaçatı Boutique',
    city: 'İzmir',
    district: 'Çeşme',
    address: 'Alaçatı Mahallesi, Çeşme, İzmir',
    starRating: 4,
    description: 'Alaçatı\'nın taş evleri arasında butik otel deneyimi. Rüzgar sörfü ve Ege lezzetleri.',
    coverImage: 'linear-gradient(135deg, #F57F17 0%, #FFEE58 100%)',
    images: [
      'linear-gradient(135deg, #F57F17 0%, #FFEE58 100%)',
      'linear-gradient(135deg, #F9A825 0%, #FFF176 100%)',
    ],
    startingPrice: 2600,
    amenities: ['wifi', 'breakfast', 'parking', 'coffee', 'terrace'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 701, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Taş ev odası, otantik dekor', pricePerNight: 2600, features: ['wifi', 'aircon', 'coffee', 'terrace'], featureLabels: ['Wi-Fi', 'Klima', 'Çay/Kahve Seti', 'Teras'], openQuota: 6, images: [], reservationsOpen: true },
      { id: 702, roomType: 'deluxe', roomTypeLabel: 'Deluxe', description: 'Havuz manzaralı deluxe oda', pricePerNight: 3800, features: ['wifi', 'minibar', 'aircon', 'terrace', 'breakfast'], featureLabels: ['Wi-Fi', 'Minibar', 'Klima', 'Teras', 'Kahvaltı Dahil'], openQuota: 4, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-8',
    name: 'Kaş Peninsula Hotel',
    city: 'Antalya',
    district: 'Kaş',
    address: 'Yarımada Mevkii, Kaş, Antalya',
    starRating: 5,
    description: 'Akdeniz\'in en berrak sularında lüks tatil. Dalış, tekne turları ve muhteşem gün batımı.',
    coverImage: 'linear-gradient(135deg, #01579B 0%, #03A9F4 100%)',
    images: [
      'linear-gradient(135deg, #01579B 0%, #03A9F4 100%)',
      'linear-gradient(135deg, #0277BD 0%, #29B6F6 100%)',
    ],
    startingPrice: 3800,
    amenities: ['wifi', 'breakfast', 'room_service', 'balcony', 'jacuzzi', 'parking'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 801, roomType: 'deluxe', roomTypeLabel: 'Deluxe', description: 'Deniz manzaralı deluxe oda', pricePerNight: 3800, features: ['wifi', 'minibar', 'balcony', 'aircon'], featureLabels: ['Wi-Fi', 'Minibar', 'Balkon', 'Klima'], openQuota: 7, images: [], reservationsOpen: true },
      { id: 802, roomType: 'suite', roomTypeLabel: 'Suite', description: 'Infinity havuzlu suite', pricePerNight: 7500, features: ['wifi', 'minibar', 'balcony', 'jacuzzi', 'room_service'], featureLabels: ['Wi-Fi', 'Minibar', 'Balkon', 'Jakuzi', 'Oda Servisi'], openQuota: 2, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-9',
    name: 'Sapanca Göl Evi',
    city: 'Sakarya',
    district: 'Sapanca',
    address: 'Göl Sahili Yolu, Sapanca, Sakarya',
    starRating: 3,
    description: 'Sapanca Gölü kıyısında doğa ile iç içe huzurlu bir kaçamak. Hafta sonu tatili için ideal.',
    coverImage: 'linear-gradient(135deg, #33691E 0%, #8BC34A 100%)',
    images: [
      'linear-gradient(135deg, #33691E 0%, #8BC34A 100%)',
      'linear-gradient(135deg, #558B2F 0%, #9CCC65 100%)',
    ],
    startingPrice: 1500,
    amenities: ['wifi', 'breakfast', 'parking', 'coffee', 'tv'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 901, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Göl manzaralı standart oda', pricePerNight: 1500, features: ['wifi', 'tv', 'coffee'], featureLabels: ['Wi-Fi', 'TV', 'Çay/Kahve Seti'], openQuota: 8, images: [], reservationsOpen: true },
      { id: 902, roomType: 'deluxe', roomTypeLabel: 'Deluxe', description: 'Jakuzili göl manzaralı oda', pricePerNight: 2800, features: ['wifi', 'minibar', 'jacuzzi', 'balcony'], featureLabels: ['Wi-Fi', 'Minibar', 'Jakuzi', 'Balkon'], openQuota: 4, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-10',
    name: 'Fethiye Blue Lagoon Resort',
    city: 'Muğla',
    district: 'Fethiye',
    address: 'Ölüdeniz Mahallesi, Fethiye, Muğla',
    starRating: 4,
    description: 'Ölüdeniz\'in turkuaz sularına tepeden bakan resort. Yamaç paraşütü ve doğa yürüyüşleri.',
    coverImage: 'linear-gradient(135deg, #006064 0%, #00ACC1 100%)',
    images: [
      'linear-gradient(135deg, #006064 0%, #00ACC1 100%)',
      'linear-gradient(135deg, #00838F 0%, #26C6DA 100%)',
    ],
    startingPrice: 2200,
    amenities: ['wifi', 'breakfast', 'parking', 'aircon', 'tv', 'balcony'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 1001, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Bahçe manzaralı standart oda', pricePerNight: 2200, features: ['wifi', 'tv', 'aircon', 'balcony'], featureLabels: ['Wi-Fi', 'TV', 'Klima', 'Balkon'], openQuota: 12, images: [], reservationsOpen: true },
      { id: 1002, roomType: 'deluxe', roomTypeLabel: 'Deluxe', description: 'Deniz manzaralı deluxe oda', pricePerNight: 3500, features: ['wifi', 'minibar', 'balcony', 'aircon', 'safe'], featureLabels: ['Wi-Fi', 'Minibar', 'Balkon', 'Klima', 'Kasa'], openQuota: 6, images: [], reservationsOpen: true },
      { id: 1003, roomType: 'family', roomTypeLabel: 'Aile Odası', description: 'Geniş aile odası, 2+2 kişilik', pricePerNight: 4200, features: ['wifi', 'tv', 'aircon', 'minibar', 'balcony'], featureLabels: ['Wi-Fi', 'TV', 'Klima', 'Minibar', 'Balkon'], openQuota: 4, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-11',
    name: 'Bolu Abant Palace',
    city: 'Bolu',
    district: 'Abant',
    address: 'Abant Gölü Milli Parkı, Bolu',
    starRating: 5,
    description: 'Abant Gölü kıyısında dört mevsim tatil merkezi. Doğa yürüyüşleri, at binme ve spa keyfi.',
    coverImage: 'linear-gradient(135deg, #1A237E 0%, #3F51B5 100%)',
    images: [
      'linear-gradient(135deg, #1A237E 0%, #3F51B5 100%)',
      'linear-gradient(135deg, #283593 0%, #5C6BC0 100%)',
    ],
    startingPrice: 2800,
    amenities: ['wifi', 'breakfast', 'parking', 'room_service', 'jacuzzi', 'coffee'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 1101, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Orman manzaralı standart oda', pricePerNight: 2800, features: ['wifi', 'tv', 'coffee', 'hairdryer'], featureLabels: ['Wi-Fi', 'TV', 'Çay/Kahve Seti', 'Saç Kurutma'], openQuota: 10, images: [], reservationsOpen: true },
      { id: 1102, roomType: 'suite', roomTypeLabel: 'Suite', description: 'Göl manzaralı lüks suite', pricePerNight: 5500, features: ['wifi', 'minibar', 'jacuzzi', 'balcony', 'room_service'], featureLabels: ['Wi-Fi', 'Minibar', 'Jakuzi', 'Balkon', 'Oda Servisi'], openQuota: 3, images: [], reservationsOpen: true },
    ],
  },
  {
    id: 'mock-12',
    name: 'Sultanahmet Heritage Inn',
    city: 'İstanbul',
    district: 'Fatih',
    address: 'Sultanahmet Meydanı Yanı, Fatih, İstanbul',
    starRating: 3,
    description: 'Tarihi yarımadanın merkezinde, Ayasofya ve Sultanahmet Camii\'ne yürüme mesafesinde butik otel.',
    coverImage: 'linear-gradient(135deg, #880E4F 0%, #E91E63 100%)',
    images: [
      'linear-gradient(135deg, #880E4F 0%, #E91E63 100%)',
      'linear-gradient(135deg, #AD1457 0%, #F06292 100%)',
    ],
    startingPrice: 1600,
    amenities: ['wifi', 'breakfast', 'coffee', 'safe', 'aircon'],
    isFromLocalStorage: false,
    roomConfigs: [
      { id: 1201, roomType: 'economy', roomTypeLabel: 'Ekonomik', description: 'Şehir manzaralı ekonomik oda', pricePerNight: 1600, features: ['wifi', 'aircon', 'safe'], featureLabels: ['Wi-Fi', 'Klima', 'Kasa'], openQuota: 8, images: [], reservationsOpen: true },
      { id: 1202, roomType: 'standard', roomTypeLabel: 'Standart', description: 'Sultanahmet manzaralı oda', pricePerNight: 2400, features: ['wifi', 'aircon', 'coffee', 'safe', 'tv'], featureLabels: ['Wi-Fi', 'Klima', 'Çay/Kahve Seti', 'Kasa', 'TV'], openQuota: 5, images: [], reservationsOpen: true },
    ],
  },
];

/* ==================== MERGE FONKSİYONLARI ==================== */

/** localStorage'daki gerçek otel verisini BookingHotel formatına çevir */
export const getLocalHotel = (): BookingHotel | null => {
  try {
    const hotelInfo = loadHotelInfo();
    const channelSettings = loadChannelSettings();

    if (!channelSettings.isActive || !hotelInfo.name) return null;

    const activeRooms = channelSettings.roomConfigs.filter((r) => r.reservationsOpen !== false);
    if (activeRooms.length === 0) return null;

    const roomConfigs: BookingRoomConfig[] = activeRooms.map((r) => ({
      id: r.id,
      roomType: r.roomType,
      roomTypeLabel: CHANNEL_ROOM_TYPE_LABELS[r.roomType as ChannelRoomType] || r.roomType,
      description: r.description,
      pricePerNight: r.pricePerNight,
      features: r.features,
      featureLabels: r.features.map(getFeatureLabel),
      openQuota: r.openQuota,
      images: r.images.map((img) => img.data),
      reservationsOpen: r.reservationsOpen,
    }));

    const coverImage = hotelInfo.images.length > 0
      ? hotelInfo.images[0].data
      : 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)';

    const allAmenities = Array.from(new Set(activeRooms.flatMap((r) => r.features)));

    return {
      id: 'local',
      name: hotelInfo.name,
      city: parseCity(hotelInfo.address),
      district: '',
      address: hotelInfo.address,
      starRating: 4,
      description: `${hotelInfo.name} - Online rezervasyon kanalında.`,
      coverImage,
      images: hotelInfo.images.map((img) => img.data),
      startingPrice: Math.min(...roomConfigs.map((r) => r.pricePerNight)),
      roomConfigs,
      amenities: allAmenities,
      isFromLocalStorage: true,
    };
  } catch {
    return null;
  }
};

/** Adres metninden şehir ismi çıkar */
const TURKISH_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana', 'Konya',
  'Trabzon', 'Muğla', 'Aydın', 'Mersin', 'Samsun', 'Eskişehir', 'Gaziantep',
  'Kayseri', 'Denizli', 'Nevşehir', 'Bolu', 'Sakarya', 'Düzce',
];

const parseCity = (address: string): string => {
  if (!address) return 'Belirtilmemiş';
  const found = TURKISH_CITIES.find((city) =>
    address.toLocaleLowerCase('tr').includes(city.toLocaleLowerCase('tr')),
  );
  return found || 'Belirtilmemiş';
};

/** Tüm otelleri döndür (gerçek + mock) */
export const getAllBookingHotels = (): BookingHotel[] => {
  const local = getLocalHotel();
  return local ? [local, ...MOCK_HOTELS] : [...MOCK_HOTELS];
};

/** Otellerdeki benzersiz şehirleri döndür */
export const getDistinctCities = (hotels: BookingHotel[]): string[] => {
  return Array.from(new Set(hotels.map((h) => h.city))).sort((a, b) =>
    a.localeCompare(b, 'tr'),
  );
};
