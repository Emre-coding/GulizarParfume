/* Gülizar — koku verileri */
window.FARO = window.FARO || {};

FARO.perfumes = [
  {
    id: 'kuru-gul',
    name: 'Kuru Gül',
    no: '214',
    family: 'Çiçeksi, baharatlı',
    desc: 'Tatlı bir gül değil. Kuru, baharatlı, hafif dumanlı.',
    top: 'Pembe biber, safran',
    heart: 'Şam gülü, iris',
    base: 'Paçuli, amber',
    hours: 6,
    price: 4800,
    stock: 112,
    accent: '#e0483f',
    liquid: '#a3101d',
    cap: '#3b0a12',
    bg: '#4c070c',
    glow: '#b8261f',
    cardBg: '#93160f',
    cardGlow: '#e5382a'
  },
  {
    id: 'narenciye-bahcesi',
    name: 'Narenciye Bahçesi',
    no: '102',
    family: 'Taze, narenciye',
    desc: 'Taze, yeşil, biraz acımsı. Gündüz için yaptık; tene yakın kalır, odayı doldurmaz.',
    top: 'Bergamot, limon kabuğu',
    heart: 'Neroli, portakal çiçeği',
    base: 'Vetiver, beyaz misk',
    hours: 4,
    price: 4200,
    stock: 38,
    accent: '#e3b23c',
    liquid: '#c0600f',
    cap: '#0d0c0b',
    bg: '#2a330a',
    glow: '#8d9a1d',
    cardBg: '#6c7a0e',
    cardGlow: '#d8d63a'
  },
  {
    id: 'tuz-ve-incir',
    name: 'Tuz ve İncir',
    no: '327',
    family: 'Yeşil, tuzlu',
    desc: 'Denizden yeni çıkmış ten gibi: serin, yeşil, hafif tuzlu. Yaz için yaptık.',
    top: 'İncir yaprağı, deniz tuzu',
    heart: 'İncir sütü, yasemin',
    base: 'Beyaz misk, sahil odunu',
    hours: 5,
    price: 4400,
    stock: 9,
    accent: '#22b597',
    liquid: '#0f6b3a',
    cap: '#0b0c0c',
    bg: '#06291f',
    glow: '#0f7a62',
    cardBg: '#0b6655',
    cardGlow: '#2cc9a8'
  },
  {
    id: 'sedir-yolu',
    name: 'Sedir Yolu',
    no: '408',
    family: 'Kuru, odunsu',
    desc: 'Kuru ve odunsu. Kumaşta uzun kalır; ceketinizde ertesi gün de duyarsınız.',
    top: 'Kakule, selvi',
    heart: 'Sedir, tütsü',
    base: 'Sandal ağacı, misk',
    hours: 7,
    price: 4600,
    stock: 71,
    accent: '#a9bccb',
    liquid: '#1d3a46',
    cap: '#0a0b0d',
    bg: '#18222c',
    glow: '#566f82',
    cardBg: '#4b6172',
    cardGlow: '#adc4d4'
  },
  {
    id: 'gece-amberi',
    name: 'Gece Amberi',
    no: '505',
    family: 'Amber, reçineli',
    desc: 'Koleksiyonun en koyu ve en kalıcı kokusu. Sıcak, reçineli; akşam için.',
    top: 'Tarçın, karanfil',
    heart: 'Labdanum, vanilya',
    base: 'Amber, tonka',
    hours: 8,
    price: 5200,
    stock: 54,
    accent: '#f0702a',
    liquid: '#1c0e09',
    cap: '#0b0a0a',
    bg: '#2c0e06',
    glow: '#93330f',
    cardBg: '#8c2909',
    cardGlow: '#f2661e'
  }
];

/* Her kokunun kendi notaları: üst / kalp / dip.
   theme → notes-art.js içindeki animasyon + renkler */
const NOTE_TEXT = {
  'kuru-gul': [
    { theme: 'kg-top', chips: ['Pembe biber', 'Safran'],
      text: 'Açılışta pembe biberin çıtırlığı ve safranın deri gibi sıcak, hafif metalik dokusu. Kuru Gül’e ilk dakikalarda baharatlı bir kıvılcım veriyor.' },
    { theme: 'kg-heart', chips: ['Şam gülü', 'İris'],
      text: 'Şam gülü burada tatlı değil; iris onu pudralı ve serin tutuyor. Gün boyu yanınızdakilerin duyduğu katman bu.' },
    { theme: 'kg-base', chips: ['Paçuli', 'Amber'],
      text: 'Paçulinin nemli toprak kokusu ve amberin sıcak reçinesi. Gülü akşama kadar taşıyan, hafif dumanlı iz.' }
  ],
  'narenciye-bahcesi': [
    { theme: 'nb-top', chips: ['Bergamot', 'Limon kabuğu'],
      text: 'Bergamot ve rendelenmiş limon kabuğu: parlak, ekşimsi ve yeşil. İlk on beş dakika bahçede bir sabah gibi.' },
    { theme: 'nb-heart', chips: ['Neroli', 'Portakal çiçeği'],
      text: 'Neroli ve portakal çiçeği açılıyor; beyaz, bal gibi ama hafif. Narenciye burada çiçeğe dönüşüyor.' },
    { theme: 'nb-base', chips: ['Vetiver', 'Beyaz misk'],
      text: 'Vetiverin kuru, köklü yeşilliği ve beyaz miskin temiz teni. Tene yakın kalır, odayı doldurmaz.' }
  ],
  'tuz-ve-incir': [
    { theme: 'ti-top', chips: ['İncir yaprağı', 'Deniz tuzu'],
      text: 'Güneşte ısınmış incir yaprağının yeşil acılığı ve rüzgârla gelen deniz tuzu. Serin, yeşil bir açılış.' },
    { theme: 'ti-heart', chips: ['İncir sütü', 'Yasemin'],
      text: 'Dalından yeni koparılmış incirin sütlü, kremamsı tatlılığı ve akşam açan yaseminin beyaz kokusu. Yazın en yumuşak saati.' },
    { theme: 'ti-base', chips: ['Beyaz misk', 'Sahil odunu'],
      text: 'Beyaz misk ve güneşte ağarmış sahil odunu. Denizden çıktıktan sonra tende kalan tuzlu, temiz iz.' }
  ],
  'sedir-yolu': [
    { theme: 'sy-top', chips: ['Kakule', 'Selvi'],
      text: 'Kakulenin serin baharatı ve selvinin reçineli yeşili. Ormana açılan bir patika gibi ferah.' },
    { theme: 'sy-heart', chips: ['Sedir', 'Tütsü'],
      text: 'Kuru sedir talaşı ve yavaş yanan tütsü. Kokunun asıl karakteri burada: odunsu, dumanlı, sakin.' },
    { theme: 'sy-base', chips: ['Sandal ağacı', 'Misk'],
      text: 'Sandal ağacının kremamsı yumuşaklığı ve misk. Kumaşta uzun kalır; ertesi gün ceketinizde duyarsınız.' }
  ],
  'gece-amberi': [
    { theme: 'ga-top', chips: ['Tarçın', 'Karanfil'],
      text: 'Tarçın kabuğu ve karanfilin sıcak, keskin baharatı. Akşamı ateşin başında başlatan bir açılış.' },
    { theme: 'ga-heart', chips: ['Labdanum', 'Vanilya'],
      text: 'Labdanumun koyu, bal kıvamındaki reçinesi ve vanilyanın yumuşak tatlılığı. Koku burada koyulaşıyor.' },
    { theme: 'ga-base', chips: ['Amber', 'Tonka'],
      text: 'Amber ve tonka fasulyesi: sıcak, pudralı, hafif karamel. Koleksiyonun en kalıcı izi; sabaha kadar sürer.' }
  ]
};
FARO.perfumes.forEach((p) => { p.notes = NOTE_TEXT[p.id]; });

/* Hero ve nota bölümleri için renkler */
FARO.hero = { bg: '#2b0f05', glow: '#c4581b' };

FARO.notes = [
  { c1: '#16461a', c2: '#071b09', accent: '#b9e26a', minutes: 15 },
  { c1: '#6a0d1f', c2: '#22030b', accent: '#ff6f86', minutes: 240 },
  { c1: '#120c0a', c2: '#040303', accent: '#ff8a3a', minutes: 480 }
];

FARO.formatPrice = function (n) {
  return n.toLocaleString('tr-TR') + ' TL';
};
