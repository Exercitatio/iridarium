/* ==========================================================
   IRIDARIUM — основной скрипт
   - Динамическая дата (три эры + матрица 7×7)
   - Поиск по документам с подсветкой
   - Счётчик результатов
   - Плавный скролл по плашкам
   - Service Worker (PWA)
   ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

    /* ======================================================
       1. ДИНАМИЧЕСКАЯ ДАТА
       ======================================================
       Три летоисчисления:
       - От Сотворения мира (византийская эра): +5508 к н.э.
       - От Потопа: С.М. + 1656
       - От Петра I: 1682 г. как начало правления
       
       Остатки по модулю 7 — координаты в матрице 7×7.
       ====================================================== */

    function getDating() {
        const now = new Date();
        const yearAD = now.getFullYear();

        const yearSM = yearAD + 5508;   // от Сотворения мира
        const yearFlood = yearSM - 1656; // от Потопа
        const yearPeter = yearAD - 1682; // от Петра I (если отрицательное — до Петра)

        const mod7 = n => {
            const m = ((n % 7) + 7) % 7;
            return m === 0 ? 7 : m;
        };

        return {
            sm: yearSM,
            flood: yearFlood,
            peter: yearPeter,
            mSM: mod7(yearSM),
            mFlood: mod7(yearFlood),
            mPeter: mod7(Math.abs(yearPeter))
        };
    }

    function renderDating() {
        const block = document.getElementById('datingBlock');
        if (!block) return;

        const d = getDating();
        const peterLabel = d.peter >= 0 ? `${d.peter}` : `${Math.abs(d.peter)} до Петра`;

        block.innerHTML =
            `Лѣто ${d.sm} от С.М.<span class="sep">·</span>` +
            `${d.flood} от Потопа<span class="sep">·</span>` +
            `${peterLabel} от Петра` +
            `<br><span class="matrix">⟦7×7: ${d.mSM} · ${d.mFlood} · ${d.mPeter}⟧</span> — истинное время`;
    }

    renderDating();

    /* ======================================================
       2. ПОИСК ПО ДОКУМЕНТАМ
       ====================================================== */

    const searchInput = document.getElementById('searchInput');
    const searchCounter = document.getElementById('searchCounter');
    const allDocItems = document.querySelectorAll('.doc-item');

    // Сохраняем оригинальный HTML каждого документа, чтобы уметь чистить подсветку
    allDocItems.forEach(item => {
        item.dataset.originalHtml = item.innerHTML;
    });

    function clearHighlights() {
        allDocItems.forEach(item => {
            if (item.dataset.originalHtml) {
                item.innerHTML = item.dataset.originalHtml;
            }
        });
    }

    function highlightMatch(item, query) {
        if (!query) return;
        const original = item.dataset.originalHtml || item.innerHTML;
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        item.innerHTML = original.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function performSearch(query) {
        const q = query.toLowerCase().trim();
        let found = 0;

        clearHighlights();

        allDocItems.forEach(item => {
            const text = item.textContent.toLowerCase();

            if (q === '') {
                item.style.display = 'flex';
                return;
            }

            if (text.includes(q)) {
                item.style.display = 'flex';
                highlightMatch(item, query.trim());
                found++;

                // Раскрываем все родительские <details>
                let parent = item.closest('details');
                while (parent) {
                    parent.open = true;
                    parent = parent.parentElement.closest('details');
                }
            } else {
                item.style.display = 'none';
            }
        });

        // Счётчик
        if (searchCounter) {
            if (q === '') {
                searchCounter.classList.remove('visible');
                searchCounter.textContent = '';
            } else {
                searchCounter.classList.add('visible');
                searchCounter.textContent = found > 0 ? `Найдено: ${found}` : 'Ничего не найдено';
            }
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', e => performSearch(e.target.value));

        // Escape — очистка
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                performSearch('');
                searchInput.blur();
            }
        });
    }

    /* ======================================================
       3. ПЛАШКИ — ПЛАВНЫЙ СКРОЛЛ + ЯКОРЯ
       ====================================================== */

    const plaques = document.querySelectorAll('.plaque');
    plaques.forEach(plaque => {
        plaque.addEventListener('click', e => {
            const targetId = plaque.dataset.scroll;
            if (!targetId) return;

            e.preventDefault();
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ======================================================
       4. ГОД В КОПИРАЙТЕ
       ====================================================== */

    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    /* ======================================================
       5. SERVICE WORKER (PWA)
       ====================================================== */

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW зарегистрирован:', reg.scope))
                .catch(err => console.log('SW не зарегистрирован:', err));
        });
    }

});