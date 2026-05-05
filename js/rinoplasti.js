// Rinoplasti Landing Page Scripts

// Header: scroll yapınca fixed + animasyon
(function () {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    const triggerPoint = 120;

    function onScroll() {
        if (window.scrollY > triggerPoint) {
            header.classList.add('is-fixed');
        } else {
            header.classList.remove('is-fixed');
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
})();
