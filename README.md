# Gülizar — Niş Parfüm Evi

**Canlı site: https://emre-coding.github.io/G-lizarParfume/**

Her kokudan yalnızca 200 şişe üreten hayali bir niş parfüm markası için tek sayfalık, animasyonlu web sitesi.
*Gülizar*, Farsçada "gül yanaklı" demek. Sitedeki şişelerin hiçbiri fotoğraf değil — hepsi kodla çiziliyor.

## Öne çıkanlar

- **Gül biçimli 3D şişe** (Three.js): yaprak kıvrımlı cam gövde, sıvı, etiket ve emaye gül tıpalı kapak.
- **Parfümü sıkın:** kapağa tıklayınca kapak çıkar; şişeye her tıklayışta şişenin renginde parıltılı bir sprey püskürür ve sıvı azalır. Şişe boşalınca sayfa bir sonraki bölüme geçer.
- **Şişe seçimi:** seçtiğiniz koku tüm sayfanın renk paletini, 3D şişeyi, notaları ve koleksiyonu belirler.
- **Notalar:** her kokunun üst / kalp / dip notası için ayrı, kodla çizilmiş animasyon (ör. Tuz ve İncir'in kalbinde incir sütü ve yasemin).
- **Atölye:** ay ışığında parlayan bir gül bahçesi.
- **İmleç:** fareyi gezdirince seçili kokunun renginde gül yaprakları dökülür.
- Ürün kartları, sepet ve e-posta ile sipariş; mobil uyumlu, `prefers-reduced-motion` desteği.

## Çalıştırma

Derleme adımı yok. `index.html` dosyasını tarayıcıda açın ya da klasörde basit bir yerel sunucu başlatın (ör. `npx serve .`).

> İnternet bağlantısı gerekir: Three.js ve Lenis CDN'den, yazı tipleri Google Fonts'tan yüklenir.
> WebGL kullanılamazsa site otomatik olarak SVG şişe çizimlerine geçer.

## Dosya yapısı

```
index.html          Sayfa iskeleti
css/style.css       Tüm stiller (mobil dahil)
js/data.js          Kokular, fiyatlar, renkler, nota metinleri
js/bottle.js        Gül biçimli 3D şişe sahnesi (Three.js)
js/art.js           Canvas çizimleri: atölye, imleç yaprakları, sprey
js/notes-art.js     Her kokunun nota animasyonları
js/main.js          Kaydırma, şişe seçimi, sprey, sepet, yükleme
```

## Not

İletişim bilgileri (e-posta, Instagram) örnek değerlerdir.

## Kaynak

Sitenin ilk iskeleti [ahmetfarah22/faroperfom](https://ahmetfarah22.github.io/faroperfom/) sitesine dayanır; marka, şişe tasarımı, animasyonlar ve etkileşimler bu projede yeniden yapıldı.
