# Gülizar — Geliştirme Geçmişi

Bu dosya, sitenin [Claude Code](https://claude.com/claude-code) ile geliştirilmesi sırasında verilen istemleri (prompt) ve her birinin ardından yapılan değişiklikleri sırasıyla listeler.

- **Tarih:** 9 Kasım 2026 (tek oturum)
- **Başlangıç noktası:** `faroperf.zip` — Manus aracıyla [ahmetfarah22.github.io/faroperfom](https://ahmetfarah22.github.io/faroperfom/) sitesinden kopyalanmış "Faro Perform" adlı statik site
- **Sonuç:** "Gülizar" markalı, gül biçimli şişeler ve şişeye özel animasyonlar içeren site

İstemler kullanıcının yazdığı gibi, düzeltilmeden aktarılmıştır.

---

## İçindekiler

| # | İstem (özet) | Ana değişiklik |
|---|---|---|
| 1–3 | Test yazımı | Ayrı bir HTML dosyası için test paketi (bu depoya dahil değil) |
| 4 | Zip'i aç, siteyi çalıştır | Site çıkarıldı, yerel sunucuda çalıştırıldı |
| 5 | Sprey yalnızca kapağa tıklanınca | Kaydırmayla otomatik sprey kaldırıldı |
| 6 | Siteyi çalıştır | — |
| 7 | Kapak ekrandan çıksın, tıklamalar bitince geri gelsin | Kapak/sprey etkileşimi yeniden tasarlandı |
| 8 | İlk otomatik sıkmayı kaldır | Kapak açılınca sprey yapılmıyor |
| 9 | Marka adı Gülizar, şişeler gül biçimli | Yeniden markalama + gül biçimli 3D şişe |
| 10 | Her şişeye kendi notaları | 15 nota için ayrı animasyon |
| 11 | Kaydırınca şişe değişmesin, seçilsin | Sayfa genelinde şişe seçimi |
| 12 | Atölye görseli + açık gül kapak | Gül bahçesi sahnesi, açık gül kapak |
| 13 | İmleç parıltısı yerine gül yaprakları | Renk temalı yaprak izi |
| 14 | Görseldeki kapak + sayfa renk paleti | Emaye gül tıpa, şişeye göre palet |
| 15 | Kapak renkleri, sprey rengi, azalan sıvı | Sıvı seviyesi, boşalınca kaydırma |
| 16 | Sprey eskisi gibi parlasın | Parlak sprey, yalnızca rengi farklı |
| 17–19 | GitHub'a yükleme ve Pages | Depo hazırlandı, Pages talimatları |
| 20 | Bu geçmiş dosyası | `GELISTIRME_GECMISI.md` |

---

## 1. Test isteği

> write a test for "Masaüstü"

"Masaüstü" bilgisayardaki Masaüstü klasörüydü; içinde kod projesi olmadığı için neyin test edileceği soruldu.

## 2. Tek dosyalık sitenin testi

> test faro-perform-tek-dosya.html

Masaüstündeki `faro-perform-tek-dosya.html` için 26 testlik bir paket yazıldı (`faro-perform-test/`): sayfayı headless Chrome'da açıp sepet, karusel, menü, bülten formu ve saat gibi işlevleri deniyor. 24 test geçti; 2 test sayfadaki gerçek bir hatayı yakaladı (mobil menü kapanınca `aria-expanded` / `aria-label` güncellenmiyor).
*Bu dosyalar bu depoya dahil değildir.*

## 3. Test dosyalarının amacı

> Claude test dosyaları ne işe yarar?

Test dosyalarının ne işe yaradığı açıklandı; değişiklik yapılmadı.

## 4. Zip'teki siteyi çalıştırma

> Masaüstündeki faroperf.zip dosyasını aç ve içerisindeki siteyi çalıştır.

- `faroperf.zip` yeni bir klasöre (`faroperf/`) çıkarıldı; çalıştırmadan önce dosyalar incelendi (yalnızca CDN'den Three.js, Lenis ve Google Fonts yükleniyor).
- Node/Python olmadığı için PowerShell ile küçük bir yerel sunucu yazılıp `http://localhost:8080/` adresinde çalıştırıldı.
- Not: `TODO.md`, sitenin başka birinin yayındaki sitesinin birebir kopyası olduğunu belirtiyordu; bu kullanıcıya bildirildi.

## 5. Sprey yalnızca kapağa tıklanınca

> sitedeki parfüm sıkma animasyonu varya ona sadece kapağa tıklayınca girsin , geriye kalan şeyleri değiştirme.

- Kaydırırken kendiliğinden kalkan kapak ve tekrarlayan sprey kaldırıldı.
- Kapağa tıklanınca (3B ışın testiyle) kapak kalkıyor, bir sprey yapılıyor ve kapak geri takılıyor.
- Kapağın üzerine gelince imleç el işaretine dönüyor.
- Dosyalar: `js/bottle.js` (`hitCap`), `js/main.js`

## 6. Siteyi çalıştır

> siteyi çalıştır

Sunucunun çalıştığı doğrulanıp site tarayıcıda açıldı.

## 7. Kapak ekrandan çıksın, tıklamalar bitince geri gelsin

> kapağın geri gelmesini tekrar beklemiyelim ve bir kez tıkladığımızda ekranın dışına çıksın tıklamalar bitince kapansın geri . İşin bitince siteyi çalıştır.

- İlk tıklama (kapağa): kapak ekranın üstünden dışarı çıkar.
- Kapak dışarıdayken şişeye her tıklama, öncekini beklemeden yeni bir sıkma yapar.
- Son tıklamadan 3 saniye sonra kapak geri takılır (`CAP_CLOSE`).
- Dosyalar: `js/bottle.js` (`hitBottle`, kapak yüksekliği), `js/main.js`

## 8. İlk otomatik sıkmayı kaldırma

> ilk baştaki otamatik sıkmayı kaldır.

Kapağa tıklanınca artık yalnızca kapak çıkıyor; sıkma sadece şişeye tıklanınca oluyor.

## 9. Marka adı ve gül biçimli şişeler

> Markanın ismi gülizar olsun ve şişelerin şeklini güle benzet.

- **Marka:** "FARO PERFORM" → "GÜLİZAR / PARFÜM"; logo harfi F → G (yükleme ekranı, menü, favicon, etiket, alt bilgi, sekme başlığı).
- **Atölye metni:** "Faro, İtalyancada deniz feneri…" → "Gülizar, Farsçada gül yanaklı…".
- **İletişim:** örnek adresler `merhaba@gulizarparfum.com`, `@gulizarparfum` olarak değiştirildi.
- **3B şişe:** köşeli cam kutu yerine, beş dış ve üst üste binen sarmal yapraklardan oluşan gül biçimli gövde; sıvı ve etiket bu biçime uyduruldu; kapak gül goncası oldu.
- **Yedek SVG şişe** de gül biçimine getirildi.
- Dosyalar: `index.html`, `css/style.css`, `js/bottle.js`, `js/art.js`, `js/main.js`, `js/data.js`

## 10. Her şişeye kendi notaları

> notalar kısmında her şişe için kendi notası gözüksün.Örnek Tuz ve İncir şişesi için Kalp notasında İncir sütü ile yasemin temalı bir animasyon yap gül temalı değil ve bu dediğimi tüm notalar ve şişeler için yap.

- Notalar bölümüne şişe seçici eklendi; her kokunun üst / kalp / dip notası kendi metni, etiketleri, renkleri ve animasyonuyla gösteriliyor.
- **15 nota animasyonu** (yeni dosya `js/notes-art.js`):

| Koku | Üst | Kalp | Dip |
|---|---|---|---|
| Kuru Gül | Pembe biber, safran iplikleri | Açan gül | Amber parçaları, paçuli, duman |
| Narenciye Bahçesi | Limon dilimi, yağmur | Portakal çiçekleri | Vetiver otları, beyaz misk |
| Tuz ve İncir | İncir yaprağı, dalgalar, tuz kristalleri | Kesik incir, damlayan incir sütü, yasemin | Sahil odunu, misk |
| Sedir Yolu | Selvi ağaçları, kakule | Sedir kesiti, tütsü dumanı | Sandal ağacı talaşı, misk |
| Gece Amberi | Tarçın, karanfil | Vanilya, labdanum reçinesi | Ateş, amber, tonka |

- Arka plan parçacıkları da notaya göre değişiyor (yasemin çiçekleri, tuz kristalleri, baharat taneleri…).
- Dosyalar: `js/notes-art.js` (yeni), `js/data.js`, `js/art.js`, `js/main.js`, `index.html`, `css/style.css`

## 11. Kaydırma yerine şişe seçimi

> sayfayı kaydırdıkça şişeler değişmesin onun yerine bir şişeyi seçelim ve sayfa gösterimi o şişe üzerine olsun bu değişikler tekrar edilebilir olsun.

- Koleksiyon bölümü artık kaydırmayla şişe değiştirmiyor (500vh → 220vh).
- Tek bir "seçili şişe": giriş bölümündeki yeni seçici, notalar seçicisi ve koleksiyon noktaları/okları aynı seçimi değiştiriyor.
- Seçilen şişe giriş bölümündeki 3B şişeyi, notaları ve koleksiyonu belirliyor; seçim istenildiği kadar değiştirilebiliyor.
- Dosyalar: `js/main.js`, `index.html`, `css/style.css`

## 12. Atölye görseli ve açık gül kapak

> Atölye kısmındaki deniz feneri görüntüsü yerine Marka ismi ile alakalı bir görsel çiz stili koru. Bir de kapak tasarımları açık bir güle benzesin.

- **Atölye:** deniz feneri yerine "gül yanaklı" temalı gece sahnesi — ay, gül çitleri, kızıl-pembe ışıkla nefes alan büyük bir gül, yumuşak ışık huzmeleri, suya düşüp halka yapan yapraklar. Gece göğü, yıldızlar, su yansıması ve sis tarzı korundu.
- **Kapak:** ortası sarmal, dört halka geniş ve kenarı kıvrık taç yapraklı açık gül.
- Dosyalar: `js/art.js`, `js/bottle.js`

## 13. İmleç izinde gül yaprakları

> Bir de şimdi fareyi sürükleyince parıltı çıkıyor ya onu gül yaprakları ile değiştirelim ama yine renkk temasının değişimini koruyalım.

- Fare izindeki kıvılcımlar yerine takla atarak düşen gül yaprakları; renkleri sayfanın o anki vurgu renginden türüyor.
- Dosya: `js/art.js`

## 14. Görseldeki kapak ve şişeye göre renk paleti

> Kapak tasarımı bilgisiyarımdaki gül_kapaklı_şişe.png görselindeki tasarıma benzet.Bir de sitenin tüm renk paletini seçili şişeye göre ayarla mesala Tuz ve İncir adlı kokuyu seçtiğimde hala ilk başta arkaplan sarı veya turuncu kalıyor o kokuya has olan o rengi sitenin tüm renk paletine uygula.

- **Kapak** (görseldeki tıpa örnek alındı): bronz kademeli boyun, altından açılan sarı-altın emaye yapraklar, öne eğik yarı açık emaye gül ve ortasında küçük bir taş.
- **Renk paleti:** giriş sahnesinin arka planı, sayfa zemini (`--bg`, `--bg-2`), vurgu rengi, ince çizgiler, tarayıcı çubuğu rengi, notalara geçiş perdesi ve atölye görselinin ışıkları seçili kokunun renklerine geçiyor.
- **Hata düzeltmesi:** yaprak uçlarında sıfır uzunluklu normal yüzünden oluşan siyah noktalar giderildi (`fixNormals`).
- Dosyalar: `js/bottle.js`, `js/main.js`, `js/art.js`, `css/style.css`

## 15. Kapak renkleri, sprey rengi ve azalan sıvı

> Kapaklar şişenin renk paletine uygun renklerde olsun.Parfüm sıkarken içindeki sıvıyla aynı renkte püskürsün beyaz değil.Ve parfümü her sıktığımızda içindeki sıvı azalsın ve sıvı bittiğinde site kendini bir sonraki kısma kaydırsın.

- **Kapak renkleri:** gül = kokunun vurgu rengi, yapraklar = sıvı rengi + altın, boyun = kapak rengi + bronz.
- **Sprey rengi:** sıvının rengine bağlandı.
- **Sıvı seviyesi:** her sıkış şişenin 1/8'ini harcıyor; sıvı bir kesme düzlemiyle kısalıyor ve üstüne gül kesitine uyan bir yüzey çiziliyor. Her şişenin seviyesi ayrı tutuluyor.
- **Boşalınca:** sayfa Notalar bölümüne kayıyor, şişe ekran dışındayken yeniden doluyor.
- Dosyalar: `js/bottle.js`, `js/art.js`, `js/main.js`

## 16. Sprey eskisi gibi parlasın

> yeni efektler kötü olmuş eskisi gibi parıldasın ama sadece rengi farklı olsun sanki şuan duman püskürtüyor gibi eskisi gibi püskürtsün ama sadece şişeyle uygun palet renginde

- Koyu sıvılarda (Gece Amberi, Sedir Yolu) sprey duman gibi görünüyordu. Eski parlak karışıma dönüldü; renk sıvı yerine kokunun vurgu renginin açık tonundan alınıyor.
- Dosyalar: `js/art.js`, `js/main.js`

## 17. GitHub'a yükleme ve Pages

> https://github.com/Emre-coding/G-lizarParfume giyhubta günçelme yap ve page donminde al

- Bilgisayara Git ve GitHub CLI kuruldu (kullanıcı onayıyla).
- Depo `Desktop/G-lizarParfume` klasörüne klonlandı; yalnızca siteyi çalıştıran dosyalar kopyalandı (`index.html`, `css/`, `js/`), `.nojekyll` ve yeni `README.md` eklendi.
- Kullanıcı tercihiyle `TODO.md`, `app.config.ts`, `manus-routes.json` ve kullanılmayan `assets/` dışarıda bırakıldı.

## 18. GitHub girişi

> ! & "C:\Program Files\GitHub CLI\gh.exe" auth login --hostname github.com --git-protocol https --web

GitHub girişi başlatıldı; yetkilendirme isteği GitHub tarafında reddedildiği (`access_denied`) için dosyalar gönderilmedi.

## 19. Siteyi GitHub'da görüntüleme

> github dan nasıl bir site isteyebilirm siteyi görüntülemek için?

GitHub Pages ile yayınlama adımları anlatıldı: dosyaları **Add file → Upload files** ile yüklemek, **Settings → Pages → Deploy from a branch → main / (root)** seçmek. Site adresi: **https://emre-coding.github.io/G-lizarParfume/**

## 20. Bu geçmiş dosyası

> Tamam şimdi senden sırayla promptları ve yapılan değişiklerin tarihçesini yapmanı ve bunu GitHub repomda paylaşabilcek bir dosya türünde yapmanı istiyorum.

Bu dosya (`GELISTIRME_GECMISI.md`) oluşturuldu.

---

## Doğrulama

Her değişiklikten sonra site headless Chrome'da açılıp ekran görüntüleri ve otomatik kontrollerle denendi: JavaScript hatası olmaması, kapak tıklama / sprey akışı, 15 nota sahnesinin çizilmesi, şişe seçiminin tüm bölümlere yansıması, sıvının 8 sıkışta bitip sayfanın kayması ve telefon genişliğinde yerleşim.
