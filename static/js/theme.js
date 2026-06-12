(function () {
    const STORAGE_KEY = 'wm-theme';

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);

        const icon = document.getElementById('themeToggleIcon');
        const btn = document.getElementById('themeToggle');
        if (icon) {
            icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
        }
        if (btn) {
            const label = theme === 'dark' ? 'Acik mod' : 'Karanlik mod';
            btn.setAttribute('aria-label', label);
            btn.title = label;
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('themeToggle');
        applyTheme(localStorage.getItem(STORAGE_KEY) || 'light');
        if (btn) btn.addEventListener('click', toggleTheme);
    });
})();
