# WM Remover

**EN:** Local watermark removal with a brush UI — preview first, download when ready.  
**TR:** Fırça ile watermark silme aracı — önce önizle, beğenince indir.

Built for small jobs: corner logos, semi-transparent stamps, Gemini-style watermarks.  
Küçük işler için: köşe logoları, yarı saydam damgalar, Gemini tarzı watermark'lar.

---

## English

### What it does

- Upload an image
- Paint over the watermark with a resizable brush
- Click **Apply** to process and preview the result
- Click **Download** when you're satisfied

Unbrushed pixels stay **unchanged**. Output keeps the **original format** (JPEG at quality 100, PNG lossless).

### Features

- Runs **locally** — no API, no AI, no cloud upload
- OpenCV inpainting + texture-aware fill
- Undo, clear mask, dark mode
- Preview before download
- Bootstrap UI

### How it works

1. You draw a mask on the canvas.
2. Backend receives the original file + mask in memory.
3. OpenCV cleans the masked area (inpaint + border sampling).
4. Only masked pixels change; everything else stays identical.
5. File is saved at maximum quality and returned.

### Requirements

- Python 3.11+
- Windows, macOS, or Linux

### Quick start

```bash
git clone https://github.com/harbysam/wm_remover.git
cd wm_remover

python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000)

### Usage

1. **Select photo**
2. **Brush** over the watermark
3. **Apply** and check the preview
4. **Download** when it looks good

**Tips:** Cover the watermark fully (slightly past the edges). Use **Undo** / **Clear mask** if needed. Re-apply after changing the mask.

### Limitations

- Best for **small watermarks** on plain or grainy backgrounds
- Large marks on faces, text, or busy scenes may look imperfect
- Large files are processed in memory — enough RAM required

### Tech stack

Django · OpenCV · NumPy · Bootstrap 5

---

## Türkçe

### Ne işe yarar?

- Fotoğraf yükle
- Watermark üzerine ayarlanabilir fırça ile çiz
- **Uygula** ile işle ve sonucu önizle
- Memnun kalınca **Indir**

Fırça dışı piksellere **dokunulmaz**. Çıktı **orijinal formatta** gelir (JPEG kalite 100, PNG kayıpsız).

### Özellikler

- **Tamamen local** — API yok, AI yok, buluta yükleme yok
- OpenCV inpainting + doku eşleştirme
- Geri al, maskeyi sil, karanlık mod
- İndirmeden önce önizleme
- Bootstrap arayüz

### Nasıl çalışır?

1. Canvas üzerinde maske çizersin.
2. Backend orijinal dosya + maskeyi bellekte alır.
3. OpenCV maskeli alanı temizler (inpaint + çevre örnekleme).
4. Sadece maskeli pikseller değişir; geri kalan aynı kalır.
5. Dosya maksimum kalitede encode edilip döner.

### Gereksinimler

- Python 3.11+
- Windows, macOS veya Linux

### Kurulum

```bash
git clone https://github.com/harbysam/wm_remover.git
cd wm_remover

python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Tarayıcıda [http://127.0.0.1:8000](http://127.0.0.1:8000) adresini aç.

### Kullanım

1. **Fotograf Sec**
2. Watermark üzerine **fırça** ile çiz
3. **Uygula** — alttaki sonucu kontrol et
4. **Indir**

**İpuçları:** Watermark'ı tamamen kapla, kenarlardan biraz taşır. Yanlış çizimde **Geri Al** / **Maskeyi Sil**. Maskeyi değiştirince tekrar uygula.

### Sınırlamalar

- **Küçük watermark'lar** ve düz/dokulu arka planlar için ideal
- Yüz, yazı veya karmaşık sahnelerde büyük alanlar mükemmel olmayabilir
- Büyük dosyalar bellekte işlenir — yeterli RAM gerekir

### Teknolojiler

Django · OpenCV · NumPy · Bootstrap 5

---

## Project structure | Proje yapısı

```
wm_remover/
├── config/           # Django settings & URLs
├── remover/          # Views, image processing (OpenCV)
├── templates/        # HTML templates
├── static/           # CSS & JS
├── manage.py
└── requirements.txt
```

## License | Lisans

MIT — see [LICENSE](LICENSE) for details.  
MIT — ayrıntılar için [LICENSE](LICENSE) dosyasına bakın.
