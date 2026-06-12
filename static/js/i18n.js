(function () {
    const STORAGE_KEY = 'wm-lang';

    const TRANSLATIONS = {
        tr: {
            pageTitle: 'WM Remover — Watermark Araci',
            metaDescription: 'Local watermark silme araci — firca, uygula, indir. AI yok, buluta yukleme yok.',
            footer: 'Tamamen bilgisayarinda calisir. Firca disindaki piksellere dokunulmaz.',
            heroTitle: 'Watermark Remover',
            heroDesc: 'Watermark uzerine firca ile ciz, uygula, sonucu kontrol et ve indir. Cikti orijinal formatinda, maksimum kalitede.',
            selectPhoto: 'Fotograf Sec',
            brushSize: 'Firca boyutu:',
            undo: 'Geri Al',
            clearMask: 'Maskeyi Sil',
            apply: 'Uygula',
            download: 'Indir',
            original: 'Orijinal',
            result: 'Sonuc',
            emptyState: 'Baslamak icin bir fotograf sec.',
            hint: 'Kirmizi alanlar silinecek. Firca disindaki piksellere dokunulmaz.',
            resultAlt: 'Islenmis gorsel',
            themeDark: 'Karanlik mod',
            themeLight: 'Acik mod',
            langTr: 'Turkce',
            langEn: 'English',
            statusMaskChanged: 'Maske degisti. Tekrar uygula.',
            statusProcessing: 'Isleniyor, lutfen bekleyin...',
            statusReady: 'Hazir ({size} MB). Sonucu kontrol et, memnunsan indir.',
            statusDownloaded: 'Indirildi: {name}',
            statusLoaded: 'Yuklendi: {name} ({size} MB)',
            statusFailed: 'Islem basarisiz.',
        },
        en: {
            pageTitle: 'WM Remover — Local Watermark Tool',
            metaDescription: 'Local watermark remover — brush, apply, download. No AI, no cloud upload.',
            footer: 'Runs locally on your machine. Unbrushed pixels stay untouched.',
            heroTitle: 'Watermark Remover',
            heroDesc: 'Brush over the watermark, apply, preview the result, then download. Original format, maximum quality.',
            selectPhoto: 'Select Photo',
            brushSize: 'Brush size:',
            undo: 'Undo',
            clearMask: 'Clear Mask',
            apply: 'Apply',
            download: 'Download',
            original: 'Original',
            result: 'Result',
            emptyState: 'Select a photo to get started.',
            hint: 'Red areas will be removed. Pixels outside the brush stay untouched.',
            resultAlt: 'Processed image',
            themeDark: 'Dark mode',
            themeLight: 'Light mode',
            langTr: 'Turkish',
            langEn: 'English',
            statusMaskChanged: 'Mask changed. Apply again.',
            statusProcessing: 'Processing, please wait...',
            statusReady: 'Ready ({size} MB). Check the result, then download.',
            statusDownloaded: 'Downloaded: {name}',
            statusLoaded: 'Loaded: {name} ({size} MB)',
            statusFailed: 'Processing failed.',
        },
    };

    function getLang() {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'en' ? 'en' : 'tr';
    }

    function format(str, vars) {
        return Object.entries(vars).reduce(
            (acc, [key, value]) => acc.replace(`{${key}}`, value),
            str,
        );
    }

    function t(key, vars = {}) {
        const lang = getLang();
        const text = TRANSLATIONS[lang][key] || TRANSLATIONS.tr[key] || key;
        return format(text, vars);
    }

    function updateLangButtons() {
        const lang = getLang();
        document.querySelectorAll('[data-lang-set]').forEach((btn) => {
            const active = btn.getAttribute('data-lang-set') === lang;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function applyPageTranslations() {
        const lang = getLang();
        document.documentElement.lang = lang;

        const titleEl = document.querySelector('title');
        if (titleEl) titleEl.textContent = t('pageTitle');

        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', t('metaDescription'));

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });

        document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
            el.setAttribute('alt', t(el.getAttribute('data-i18n-alt')));
        });

        if (typeof window.wmUpdateThemeLabels === 'function') {
            window.wmUpdateThemeLabels();
        }

        updateLangButtons();
    }

    function setLang(lang) {
        localStorage.setItem(STORAGE_KEY, lang === 'en' ? 'en' : 'tr');
        applyPageTranslations();
        document.dispatchEvent(new CustomEvent('wm:langchange'));
    }

    document.addEventListener('DOMContentLoaded', () => {
        applyPageTranslations();

        document.querySelectorAll('[data-lang-set]').forEach((btn) => {
            btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-set')));
        });
    });

    window.wmI18n = { t, getLang, setLang, applyPageTranslations };
})();
