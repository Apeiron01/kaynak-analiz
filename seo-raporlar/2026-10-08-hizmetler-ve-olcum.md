# Lumina Digitale: hizmetler, referanslar ve başlangıç ölçümü

Kullanıcı beyanı: trafik daha önce takip edilmedi; organik aramadan kendi kendine müşteri gelmedi. Bu yüzden bir trafik düşüşü veya sebebi doğrulanmış değildir. Search Console oturumu bu çalışma sırasında açık değildi.

## Yayınlanan kapsam

- Yazılım, otomasyon ve SEO/AI arama görünürlüğü hizmet sayfaları; Türkçe ve İngilizce.
- Kionel, GamersPilot, CarQR ve Skater (`skaterjob.com`): Taha Bayar’ın kendi ürünleri.
- Namera Academy: müşteri geliştirme referansı; marka ve ürün müşteriye ait.
- Mori ve Mergeverse: geliştirme/test aşamasında; genel yayın ve iOS mağaza onayı iddiası yok.
- Kripto geliştirme: piyasa verisi, geçmiş veri testi ve paper trading; mevcut yerel proje canlı işlem entegrasyonu içermiyor.
- Kuruluş yılı: Lumina Digitale 2024. Kionel 2026; ay kesin değil.
- Kaynaksız kâr/öğrenci başarı grafikleri yerine teslimatlar ve uygulama çıktıları.
- Genel site haritası ve karşılıklı dil alternatifleri. Yeni hizmetler ana sayfadan ve ilgili mevcut sayfalardan bağlı.

## Şimdi ölçülebilenler

`lead-source.js` ziyaretçinin göndermeyi seçtiği mevcut talep formuna `source_channel` ve `landing_page` alanlarını ekler. Yeni analiz sağlayıcısı, çerez, izleme pikseli veya ağ isteği eklemez. Tarayıcı oturumunda kategori ve başlangıç sayfası tutulur. UTM değeri yalnızca izinli kanal adlarından alınır; sorgu dizesi ve arama sözcükleri aktarılmaz. Google/Bing/LinkedIn veya genel yönlendirme sınıflandırılır. Referans bilgisi yoksa `direct-or-unknown` kullanılır; bu değer organik trafiğin kesin sayımı değildir. Formsubmit ve mevcut Meta Pixel bu değişiklikten önce de vardı.

## Search Console ile tamamlanacak başlangıç ölçümü

1. Google hesabıyla Search Console’a giriş yapın. `luminadigitale.com` alan adı mülkünün varlığını kontrol edin. Mülk yoksa DNS TXT doğrulaması; mevcut URL mülkü varsa mevcut erişimi kullanın. Sitedeki Google doğrulama dosyasını değiştirmeyin.
2. `https://luminadigitale.com/sitemap.xml` dosyasını gönderin. Ana sayfa, referanslar, Etsy eğitimi ve yeni üç hizmet sayfasını URL denetimiyle kontrol edin. Gerekirse tekil indeks isteği gönderin.
3. Başlangıç tarihinden itibaren sorgu/sayfa/ülke kırılımında gösterim, tıklama, CTR ve konumu kaydedin. Önceki veri yoksa geçmiş performans tahmini üretmeyin.
4. Talep e-postalarındaki kanal ve açılış sayfasını; talep sayısı, uygun müşteri adayı, görüşme ve teklif sonuçlarıyla birlikte haftalık tabloda değerlendirin. Kişisel iletişim bilgilerini kamuya açık rapora koymayın.
5. Veri biriktikçe aylık dönemleri karşılaştırın. Tıklama artışı ile müşteri artışını aynı sonuç olarak raporlamayın. Yeni içerik konularını gerçek sorgular ve müşteri sorularından seçin.

GEO için özel dosya veya schema zorunluluğu yoktur. Mevcut `llms.txt` dosyaları yalnızca doğru hizmet ve referans bilgisiyle güncellendi; sıralama etkisi iddia edilmiyor.

Kaynak: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

## Doğrulama

`python scripts/check-public-site.py`: sitemap/canonical, tek H1, JSON-LD, karşılıklı dil bağlantıları, yerel kaynaklar ve yeni referans/hizmet sayfası bağlantıları.

Canlı indeksleme, arama sırası veya müşteri artışı bu statik kontrollerle doğrulanamaz; Search Console verisi ve zaman gerekir.

Additional verification: 94 sitemap HTML pages passed the static checks; mobile home and reference pages had no horizontal overflow at 390 px. Source attribution retained the channel and path only, without UTM campaign values. Simulated visitor/customer notifications were removed from script.js.
