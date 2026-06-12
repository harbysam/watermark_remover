(function () {
    const STORAGE_KEY = 'wm-theme';

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);

        const icon = document.getElementById('themeToggleIcon');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
        }
        window.wmUpdateThemeLabels?.();
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    window.wmUpdateThemeLabels = function () {
        const btn = document.getElementById('themeToggle');
        const theme = document.documentElement.getAttribute('data-bs-theme') || 'light';
        const key = theme === 'dark' ? 'themeLight' : 'themeDark';
        const label = window.wmI18n ? window.wmI18n.t(key) : (theme === 'dark' ? 'Light mode' : 'Dark mode');
        if (btn) {
            btn.setAttribute('aria-label', label);
            btn.title = label;
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('themeToggle');
        applyTheme(localStorage.getItem(STORAGE_KEY) || 'light');
        if (btn) btn.addEventListener('click', toggleTheme);
    });

    document.addEventListener('wm:langchange', () => {
        window.wmUpdateThemeLabels();
    });
})();
