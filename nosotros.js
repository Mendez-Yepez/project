document.addEventListener("DOMContentLoaded", function() {
    const VALUES = [
        { t: "Fe y servicio", d: "Poner los conocimientos y capacidades al servicio de los demás.", i: "bi-heart-fill", c: "espiritual", color: "#dc2626" },
        { t: "Respeto", d: "Valorar la dignidad, las diferencias y los derechos de cada persona.", i: "bi-hand-thumbs-up-fill", c: "social", color: "#2563eb" },
        { t: "Responsabilidad", d: "Cumplir con los compromisos asumidos y cuidar los recursos del centro.", i: "bi-check2-square", c: "personal", color: "#7c3aed" },
        { t: "Integridad", d: "Actuar con honestidad, transparencia y coherencia.", i: "bi-shield-check", c: "espiritual", color: "#0891b2" },
        { t: "Solidaridad", d: "Promover el apoyo mutuo y la sensibilidad frente a las necesidades de la comunidad.", i: "bi-people-fill", c: "social", color: "#ea580c" },
        { t: "Excelencia", d: "Procurar calidad, orden y mejora continua en la enseñanza y en la gestión.", i: "bi-award-fill", c: "profesional", color: "#d97706" },
        { t: "Inclusión", d: "Favorecer oportunidades de formación sin discriminación.", i: "bi-universal-access", c: "social", color: "#059669" },
        { t: "Trabajo y emprendimiento", d: "Promover la iniciativa, la productividad y la autonomía económica.", i: "bi-rocket-takeoff-fill", c: "profesional", color: "#0f766e" },
        { t: "Vida saludable", d: "Fomentar hábitos de cuidado personal, prevención y bienestar integral.", i: "bi-activity", c: "personal", color: "#16a34a" }
    ];
    const CAT = { espiritual: "Espiritual", social: "Social", profesional: "Trabajo y excelencia", personal: "Personal" };

    // Render de valores
    const grid = document.getElementById('valuesGrid');
    if (grid) {
        VALUES.forEach((v, idx) => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 value-item';
            col.dataset.cat = v.c;
            col.dataset.idx = idx;
            col.innerHTML = `
                <div class="custom-card value-card" style="--accent:${v.color}" tabindex="0" role="button" aria-label="Ver detalle de ${v.t}">
                    <span class="value-num">${String(idx + 1).padStart(2, '0')}</span>
                    <div class="icon-box mb-3" style="background:${v.color}15; color:${v.color}"><i class="bi ${v.i} fs-4"></i></div>
                    <h4 class="h5 fw-bold" style="color: var(--navy-primary);">${v.t}</h4>
                    <p class="text-muted small mb-0">${v.d}</p>
                    <i class="bi bi-arrow-right-circle-fill more"></i>
                </div>`;
            grid.appendChild(col);
        });
    }

    // Filtros
    const filtersContainer = document.getElementById('valueFilters');
    if (filtersContainer) {
        filtersContainer.addEventListener('click', e => {
            const btn = e.target.closest('.filter-chip');
            if (!btn) return;
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            document.querySelectorAll('.value-item').forEach(el => {
                el.classList.toggle('hide', f !== 'all' && el.dataset.cat !== f);
            });
        });
    }

    // Modal
    const modalEl = document.getElementById('valueModal');
    let modal;
    let current = 0;
    if (modalEl) {
        modal = new bootstrap.Modal(modalEl);
    }

    function visibleIdx() {
        return [...document.querySelectorAll('.value-item:not(.hide)')].map(e => +e.dataset.idx);
    }

    function showValue(idx) {
        current = idx;
        const v = VALUES[idx];
        const list = visibleIdx();
        document.getElementById('mIcon').innerHTML = `<i class="bi ${v.i} fs-1"></i>`;
        document.getElementById('mIcon').style.cssText = `width:80px;height:80px;border-radius:1rem;background:${v.color}22;color:${v.color};display:inline-flex;align-items:center;justify-content:center;`;
        const cat = document.getElementById('mCat');
        cat.textContent = CAT[v.c];
        cat.style.cssText = `background:${v.color}22;color:${v.color};font-weight:600;`;
        document.getElementById('mTitle').textContent = v.t;
        document.getElementById('mDesc').textContent = v.d;
        document.getElementById('mCount').textContent = `${list.indexOf(idx) + 1} de ${list.length}`;
        modal.show();
    }

    function step(dir) {
        const list = visibleIdx();
        const pos = list.indexOf(current);
        showValue(list[(pos + dir + list.length) % list.length]);
    }

    if (grid) {
        grid.addEventListener('click', e => {
            const item = e.target.closest('.value-item');
            if (item) showValue(+item.dataset.idx);
        });
    }

    const mPrev = document.getElementById('mPrev');
    const mNext = document.getElementById('mNext');
    if (mPrev) mPrev.onclick = () => step(-1);
    if (mNext) mNext.onclick = () => step(1);

    // Tabs Misión / Visión
    const tabs = [...document.querySelectorAll('.mv-tab')];
    const pill = document.getElementById('mvPill');
    function movePill() {
        const active = document.querySelector('.mv-tab.active');
        if (active && pill && tabs.length > 0) {
            pill.style.width = active.offsetWidth + 'px';
            pill.style.transform = `translateX(${active.offsetLeft - tabs[0].offsetLeft}px)`;
        }
    }
    tabs.forEach(t => t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.querySelectorAll('.mv-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(t.dataset.target).classList.add('active');
        movePill();
    }));
    window.addEventListener('load', movePill);
    window.addEventListener('resize', movePill);

    // Reveal on scroll
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Progreso, navbar y botón subir
    const bar = document.getElementById('scrollProgress');
    const nav = document.getElementById('mainNav');
    const toTop = document.getElementById('toTop');
    window.addEventListener('scroll', () => {
        const h = document.documentElement;
        if (bar) bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
        if (nav) nav.classList.toggle('scrolled', h.scrollTop > 80);
        if (toTop) toTop.classList.toggle('show', h.scrollTop > 400);
    }, { passive: true });

    if (toTop) {
        toTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});