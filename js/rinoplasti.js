// Rinoplasti Landing Page Scripts

// Header: Elementor wrapper'ından koparıp body'e taşı + scroll animasyonu
(function () {
    function initHeader() {
        const header = document.getElementById('siteHeader');
        if (!header) return;

        if (header.parentElement !== document.body) {
            document.body.appendChild(header);
        }

        const triggerPoint = 120;

        function onScroll() {
            if (window.scrollY > triggerPoint) {
                header.classList.add('is-fixed');
            } else {
                header.classList.remove('is-fixed');
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        initHeader();
    }
})();
