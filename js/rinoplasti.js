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

// Stats: 0'dan hedefe sayma animasyonu (görünür olunca tetiklenir)
(function () {
    function initCounters() {
        const counters = document.querySelectorAll('.stat__num');
        if (!counters.length) return;

        function fmt(n, format) {
            if (format === 'dot') {
                return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }
            return n.toString();
        }

        function animate(el) {
            const target = parseInt(el.dataset.target, 10) || 0;
            const suffix = el.dataset.suffix || '';
            const format = el.dataset.format || '';
            const duration = 1800;
            const start = performance.now();

            function tick(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(target * eased);
                el.textContent = fmt(current, format) + suffix;
                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = fmt(target, format) + suffix;
                }
            }
            requestAnimationFrame(tick);
        }

        if (!('IntersectionObserver' in window)) {
            counters.forEach(animate);
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });

        counters.forEach(function (c) { observer.observe(c); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCounters);
    } else {
        initCounters();
    }
})();

// Results slider: ok butonuna tıklayınca yatay scroll
(function () {
    function initResultsSlider() {
        const track = document.getElementById('ekResultsTrack');
        const next = document.querySelector('.ek-results__arrow--next');
        if (!track || !next) return;

        next.addEventListener('click', function () {
            const step = track.clientWidth * 0.7;
            const max = track.scrollWidth - track.clientWidth;
            if (track.scrollLeft >= max - 8) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: step, behavior: 'smooth' });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initResultsSlider);
    } else {
        initResultsSlider();
    }
})();

// Steps: hard scroll-lock — section'a girer girmez body fixed olur,
// hiçbir scroll input'u (wheel/scrollbar/momentum/touch) sayfayı hareket ettiremez.
// Slide'lar sırayla, cooldown ile geçer. Bittiğinde lock kalkar, normal scroll devam eder.
(function () {
    function initSteps() {
        const section = document.getElementById('stepsSection');
        if (!section) return;
        const slides = section.querySelectorAll('.steps__slide');
        const dots = section.querySelectorAll('.steps__dot');
        const lineFill = section.querySelector('.steps__line-fill');
        const total = slides.length;
        if (!total) return;

        const COOLDOWN = 700;
        const TOUCH_THRESHOLD = 30;

        let currentSlide = 0;
        let lastTransition = 0;
        let isLocked = false;
        let lockedScrollY = 0;

        function render() {
            slides.forEach(function (s, i) {
                s.classList.toggle('is-active', i === currentSlide);
                s.classList.toggle('is-past', i < currentSlide);
            });
            dots.forEach(function (d, i) {
                d.classList.toggle('is-active', i <= currentSlide);
                d.classList.toggle('is-current', i === currentSlide);
            });
            if (lineFill) {
                const pct = total > 1 ? (currentSlide / (total - 1)) * 100 : 100;
                lineFill.style.height = pct + '%';
            }
        }

        // Body'i scroll yapamaz hale getir. Görsel pozisyon korunur (top: -scrollY).
        function lockBody() {
            if (isLocked) return;
            isLocked = true;
            lockedScrollY = window.scrollY;

            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

            document.body.style.position = 'fixed';
            document.body.style.top = '-' + lockedScrollY + 'px';
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = scrollbarWidth + 'px';
            }
        }

        // Body'i serbest bırak, hedeflenen pozisyona scroll et.
        function unlockBody(targetScrollY) {
            if (!isLocked) return;
            isLocked = false;

            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            document.body.style.paddingRight = '';

            const target = (typeof targetScrollY === 'number') ? targetScrollY : lockedScrollY;
            window.scrollTo(0, target);
        }

        function tryAdvance(direction) {
            const now = Date.now();
            if (now - lastTransition < COOLDOWN) return false;

            if (direction > 0 && currentSlide < total - 1) {
                currentSlide++;
                lastTransition = now;
                render();
                return true;
            } else if (direction < 0 && currentSlide > 0) {
                currentSlide--;
                lastTransition = now;
                render();
                return true;
            }
            return false;
        }

        // Section viewport top'a değdi mi? Değdiyse hizala + lock.
        function checkAndLock() {
            if (isLocked) return;
            const rect = section.getBoundingClientRect();
            if (rect.top > 0 || rect.bottom <= 0) return; // section view dışı

            // Section üstünü viewport top'a snap — kullanıcı hızlı geçtiyse geri çek
            if (rect.top < 0) {
                window.scrollBy(0, rect.top);
            }
            lockBody();
        }

        // Section'dan aşağı çıkış: lock'u kaldır, section altına scroll
        function exitDown() {
            unlockBody(lockedScrollY + section.offsetHeight);
        }

        // Section'dan yukarı çıkış: lock'u kaldır, section üstüne scroll
        function exitUp() {
            unlockBody(lockedScrollY - 1);
        }

        // ===== WHEEL =====
        function handleWheel(e) {
            // Lock değilsek önce kontrol et — bu wheel section'a gelişi tetiklemiş olabilir
            if (!isLocked) checkAndLock();
            if (!isLocked) return;

            e.preventDefault();
            const deltaY = e.deltaY;
            if (deltaY === 0) return;

            // Son slide & aşağı → çıkış
            if (deltaY > 0 && currentSlide >= total - 1) {
                exitDown();
                return;
            }
            // İlk slide & yukarı → çıkış
            if (deltaY < 0 && currentSlide <= 0) {
                exitUp();
                return;
            }

            tryAdvance(deltaY > 0 ? 1 : -1);
        }

        // ===== TOUCH =====
        let touchStartY = 0;

        function handleTouchStart(e) {
            touchStartY = e.touches[0].clientY;
        }

        function handleTouchMove(e) {
            if (!isLocked) checkAndLock();
            if (!isLocked) return;

            const touchY = e.touches[0].clientY;
            const totalDelta = touchStartY - touchY;

            if (totalDelta > 0 && currentSlide >= total - 1) {
                exitDown();
                return;
            }
            if (totalDelta < 0 && currentSlide <= 0) {
                exitUp();
                return;
            }

            e.preventDefault();

            if (Math.abs(totalDelta) >= TOUCH_THRESHOLD) {
                if (tryAdvance(totalDelta > 0 ? 1 : -1)) {
                    touchStartY = touchY;
                }
            }
        }

        // ===== KEYBOARD =====
        function handleKey(e) {
            if (!isLocked) checkAndLock();
            if (!isLocked) return;

            const downKeys = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
            const upKeys = ['ArrowUp', 'PageUp'];
            const isDown = downKeys.indexOf(e.key) !== -1;
            const isUp = upKeys.indexOf(e.key) !== -1;
            if (!isDown && !isUp) return;

            e.preventDefault();

            if (isDown && currentSlide >= total - 1) { exitDown(); return; }
            if (isUp && currentSlide <= 0) { exitUp(); return; }

            tryAdvance(isDown ? 1 : -1);
        }

        // Scroll event + rAF safety net — section'a hızlı geçişte de yakala
        function rafLoop() {
            if (!isLocked) checkAndLock();
            requestAnimationFrame(rafLoop);
        }

        window.addEventListener('scroll', checkAndLock, { passive: true });
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('keydown', handleKey);

        requestAnimationFrame(rafLoop);
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSteps);
    } else {
        initSteps();
    }
})();
