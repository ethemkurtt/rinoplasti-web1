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

// Reviews: data-rating ile yıldız render + drag-to-scroll + arrow
(function () {
    const STAR_PATH = 'M6.55222 0.901222C6.73607 0.531194 7.26393 0.531195 7.44778 0.901223L8.94927 3.92323C9.02208 4.06976 9.16197 4.1714 9.32383 4.19536L12.6619 4.68951C13.0706 4.75002 13.2338 5.25204 12.9387 5.54123L10.5285 7.90309C10.4117 8.01761 10.3582 8.18207 10.3855 8.34341L10.947 11.6708C11.0158 12.0782 10.5887 12.3885 10.2225 12.1972L7.23149 10.6349C7.08646 10.5592 6.91354 10.5592 6.76851 10.6349L3.77749 12.1972C3.41125 12.3885 2.98421 12.0782 3.05297 11.6708L3.61453 8.34341C3.64176 8.18207 3.58832 8.01761 3.47146 7.90309L1.06135 5.54123C0.766242 5.25204 0.929358 4.75002 1.33809 4.68951L4.67617 4.19536C4.83803 4.1714 4.97792 4.06976 5.05073 3.92323L6.55222 0.901222Z';

    function renderStars() {
        const groups = document.querySelectorAll('.review__stars[data-rating]');
        groups.forEach(function (el) {
            const rating = parseFloat(el.dataset.rating) || 0;
            const total = 5;
            let html = '';
            for (let i = 0; i < total; i++) {
                const fill = (i < rating) ? '#FEA500' : '#FEDA98';
                html += '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' + STAR_PATH + '" fill="' + fill + '"/></svg>';
            }
            el.innerHTML = html;
        });
    }

    function initReviewsSlider() {
        const track = document.getElementById('reviewsTrack');
        if (!track) return;
        const arrow = document.querySelector('.reviews__arrow');

        if (arrow) {
            arrow.addEventListener('click', function () {
                const step = track.clientWidth * 0.7;
                const max = track.scrollWidth - track.clientWidth;
                if (track.scrollLeft >= max - 8) {
                    track.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    track.scrollBy({ left: step, behavior: 'smooth' });
                }
            });
        }

        // Mouse drag-to-scroll
        let isDown = false;
        let startX = 0;
        let scrollStart = 0;
        let dragMoved = false;
        const DRAG_THRESHOLD = 5;

        track.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            isDown = true;
            dragMoved = false;
            startX = e.pageX;
            scrollStart = track.scrollLeft;
            track.classList.add('is-dragging');
            e.preventDefault();
        });

        window.addEventListener('mousemove', function (e) {
            if (!isDown) return;
            const dx = e.pageX - startX;
            if (Math.abs(dx) > DRAG_THRESHOLD) dragMoved = true;
            track.scrollLeft = scrollStart - dx;
        });

        window.addEventListener('mouseup', function () {
            if (!isDown) return;
            isDown = false;
            track.classList.remove('is-dragging');
            setTimeout(function () { dragMoved = false; }, 0);
        });

        // Drag sırasında link click'lerini iptal et
        track.addEventListener('click', function (e) {
            if (dragMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    function init() {
        renderStars();
        initReviewsSlider();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Transformations slider: arrow + mouse drag-to-scroll + per-card play (iframe autoplay)
(function () {
    function initTransformations() {
        const track = document.getElementById('transformationsTrack');
        if (!track) return;
        const arrow = document.querySelector('.transformations__arrow');

        // ----- Arrow click → bir sayfa kaydır, sonra başa dön -----
        if (arrow) {
            arrow.addEventListener('click', function () {
                const step = track.clientWidth * 0.7;
                const max = track.scrollWidth - track.clientWidth;
                if (track.scrollLeft >= max - 8) {
                    track.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    track.scrollBy({ left: step, behavior: 'smooth' });
                }
            });
        }

        // ----- Mouse drag-to-scroll -----
        let isDown = false;
        let startX = 0;
        let scrollStart = 0;
        let dragMoved = false;
        const DRAG_THRESHOLD = 5;

        track.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            // Play butonuna tıklarsa drag başlatma
            if (e.target.closest('.transformations__play')) return;
            isDown = true;
            dragMoved = false;
            startX = e.pageX;
            scrollStart = track.scrollLeft;
            track.classList.add('is-dragging');
            e.preventDefault();
        });

        window.addEventListener('mousemove', function (e) {
            if (!isDown) return;
            const dx = e.pageX - startX;
            if (Math.abs(dx) > DRAG_THRESHOLD) dragMoved = true;
            track.scrollLeft = scrollStart - dx;
        });

        window.addEventListener('mouseup', function () {
            if (!isDown) return;
            isDown = false;
            track.classList.remove('is-dragging');
            // Click handler dragMoved'i okuduktan sonra sıfırla
            setTimeout(function () { dragMoved = false; }, 0);
        });

        // ----- Click → play (drag sırasında click ignored) -----
        track.addEventListener('click', function (e) {
            if (dragMoved) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const playBtn = e.target.closest('.transformations__play');
            if (!playBtn) return;
            const card = playBtn.closest('.transformations__card');
            if (!card || card.classList.contains('is-playing')) return;
            const videoId = card.dataset.video;
            if (!videoId) return;

            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
            iframe.title = 'Hasta Hikayesi';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.setAttribute('allowfullscreen', '');
            card.appendChild(iframe);
            card.classList.add('is-playing');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTransformations);
    } else {
        initTransformations();
    }
})();

// Simulation: play butonuna basılınca poster gizlenir, YouTube iframe autoplay açılır
(function () {
    function initSimulation() {
        const container = document.getElementById('simulationVideo');
        if (!container) return;
        const playBtn = container.querySelector('.simulation__play');
        if (!playBtn) return;

        playBtn.addEventListener('click', function () {
            if (container.classList.contains('is-playing')) return;

            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/D4hbBa1zUig?autoplay=1&rel=0';
            iframe.title = '3D Simülasyon Video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.setAttribute('allowfullscreen', '');
            container.appendChild(iframe);
            container.classList.add('is-playing');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSimulation);
    } else {
        initSimulation();
    }
})();

// Steps: hard scroll-lock + burst detection
// - Section view'a girer girmez html+body overflow:hidden (sayfa fiziksel olarak donar)
// - Bir input burst'i (250ms event-free aralık) = 1 aksiyon (1 advance VEYA 1 exit)
//   Momentum scroll boyunca event'ler sadece burst'ü uzatır, ek advance YOK
// - Exit sonrası 600ms re-lock yasağı + 10px overshoot → re-lock döngüsü kırılır
// - Touch: per-session flag (touchstart→touchend arası 1 advance)
(function () {
    function initSteps() {
        const section = document.getElementById('stepsSection');
        if (!section) return;
        const slides = section.querySelectorAll('.steps__slide');
        const dots = section.querySelectorAll('.steps__dot');
        const lineFill = section.querySelector('.steps__line-fill');
        const total = slides.length;
        if (!total) return;

        const BURST_END_DELAY     = 50;   // event-free süre — burst bittikten sonra yeni aksiyon mümkün
        const EXIT_COOLDOWN       = 200;  // exit sonrası re-lock yasağı (ms)
        const LOCK_TOLERANCE      = 25;   // rect.top viewport top'a bu kadar yakınsa lock; daha uzaksa skip
        const EXIT_OVERSHOOT_DOWN = 10;   // aşağı exit'te section bottom + bu kadar (px)
        const EXIT_OVERSHOOT_UP   = LOCK_TOLERANCE + 50; // yukarı exit'te section top - bu kadar; tolerance'tan BÜYÜK olmalı
        const TOUCH_THRESHOLD     = 30;   // touch advance için min hareket (px)

        let currentSlide = 0;
        let isLocked = false;
        let lockedScrollY = 0;
        let exitTime = 0;
        let burstActive = false;
        let burstTimer = null;

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

        // ----- BURST -----
        function bumpBurst() {
            if (burstTimer) clearTimeout(burstTimer);
            burstTimer = setTimeout(function () {
                burstActive = false;
                burstTimer = null;
            }, BURST_END_DELAY);
        }

        // ----- LOCK -----
        function lockBody() {
            if (isLocked) return;
            isLocked = true;
            lockedScrollY = window.scrollY;

            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = scrollbarWidth + 'px';
            }
        }

        function unlockBody(targetScrollY) {
            if (!isLocked) return;
            isLocked = false;

            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            if (typeof targetScrollY === 'number') {
                window.scrollTo(0, targetScrollY);
            }
        }

        function advance(direction) {
            if (direction > 0 && currentSlide < total - 1) {
                currentSlide++;
                render();
            } else if (direction < 0 && currentSlide > 0) {
                currentSlide--;
                render();
            }
        }

        function exitDown() {
            exitTime = Date.now();
            unlockBody(lockedScrollY + section.offsetHeight + EXIT_OVERSHOOT_DOWN);
        }

        function exitUp() {
            exitTime = Date.now();
            unlockBody(lockedScrollY - EXIT_OVERSHOOT_UP);
        }

        function checkAndLock() {
            if (isLocked) return;
            if (Date.now() - exitTime < EXIT_COOLDOWN) return;

            const rect = section.getBoundingClientRect();

            // Section view dışı
            if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

            // Section'ın üstü viewport top'a yakın mı? Değilse lock yapma —
            // yukarıdan aşağı veya aşağıdan yukarı yaklaşırken section üstü 0'a değdiğinde lock.
            // Bu büyük snap'i önler ve exitUp sonrası anlık re-lock'u kırar.
            if (Math.abs(rect.top) > LOCK_TOLERANCE) return;

            if (rect.top !== 0) window.scrollBy(0, rect.top);
            lockBody();
        }

        // Wheel/Key tek aksiyon helper'ı: bir burst içinde 1 kez advance/exit
        function processInput(direction) {
            if (burstActive) { bumpBurst(); return; }
            burstActive = true;
            bumpBurst();

            if (direction > 0 && currentSlide >= total - 1) { exitDown(); return; }
            if (direction < 0 && currentSlide <= 0) { exitUp(); return; }
            advance(direction);
        }

        // ===== WHEEL =====
        function handleWheel(e) {
            if (!isLocked) checkAndLock();
            if (!isLocked) return;

            e.preventDefault();
            const deltaY = e.deltaY;
            if (deltaY === 0) return;

            processInput(deltaY > 0 ? 1 : -1);
        }

        // ===== TOUCH (per-session 1 advance) =====
        let touchStartY = 0;
        let touchHandled = false;

        function handleTouchStart(e) {
            touchStartY = e.touches[0].clientY;
            touchHandled = false;
        }

        function handleTouchEnd() {
            touchHandled = false;
        }

        function handleTouchMove(e) {
            if (!isLocked) checkAndLock();
            if (!isLocked) return;

            e.preventDefault();
            if (touchHandled) return;

            const totalDelta = touchStartY - e.touches[0].clientY;
            if (Math.abs(totalDelta) < TOUCH_THRESHOLD) return;

            touchHandled = true;
            const direction = totalDelta > 0 ? 1 : -1;

            if (direction > 0 && currentSlide >= total - 1) { exitDown(); return; }
            if (direction < 0 && currentSlide <= 0) { exitUp(); return; }
            advance(direction);
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
            processInput(isDown ? 1 : -1);
        }

        // rAF: lock'ta kayma olursa düzelt + dışarıdayken section'a girişi yakala
        function rafLoop() {
            if (isLocked) {
                if (Math.abs(window.scrollY - lockedScrollY) > 0.5) {
                    window.scrollTo(0, lockedScrollY);
                }
            } else {
                checkAndLock();
            }
            requestAnimationFrame(rafLoop);
        }

        window.addEventListener('scroll', checkAndLock, { passive: true });
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
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
