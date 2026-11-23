let appState = {
    days: {},
    customFoods: {},
    mealTemplates: {},
    templates: null,
    darkMode: false,
    tileHeight: 66,
    password: ''
};

let currentCalDate = new Date();
let selectedKey = formatDateKey(new Date());
let activeMealModal = 1;

function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatGermanDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('de-DE', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function formatShortGermanDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

function getEmptyDay() {
    return {
        sleep: { bed: '', wake: '', note: '' },
        food: {
            m1: { done: false, time: '', brei: true, brot: false, note: '', items: null, dayContent: '' },
            m2: { done: false, time: '', fisch: false, fishType: 'makrele', brot: false, note: '', items: null, dayContent: '' }
        },
        act: {
            train: { done: false, note: '' },
            bike: { done: false, note: '' },
            rest: { done: false, note: '' },
            workout: { splitName: '', dayNumber: '', preTime: '', preSalz: false, preHonig: false, zughilfen: false, rating: 'gut', exercises: [] }
        },
        care: { shower: false, hair: false, note: '' },
        misc: { note: '' }
    };
}

function loadState() {
    try {
        const raw = localStorage.getItem('org_data');
        if (raw) {
            const parsed = JSON.parse(raw);
            appState = {
                days: parsed.days || {},
                customFoods: parsed.customFoods || {},
                mealTemplates: parsed.mealTemplates || {},
                templates: parsed.templates || parsed.workoutTemplates || null,
                darkMode: !!parsed.darkMode,
                tileHeight: parsed.tileHeight || 66,
                password: parsed.password || ''
            };
        }
    } catch (e) {
        console.error('Fehler beim Laden:', e);
    }
}

function persistState() {
    try {
        localStorage.setItem('org_data', JSON.stringify(appState));
    } catch (e) {
        console.error('Fehler beim Speichern:', e);
    }
}

function calcSleepDuration(bed, wake) {
    if (!bed || !wake) return null;
    const [bh, bm] = bed.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    let bMins = bh * 60 + bm;
    let wMins = wh * 60 + wm;
    if (wMins <= bMins) wMins += 24 * 60;
    const diff = wMins - bMins;
    return { mins: diff, h: Math.floor(diff / 60), m: diff % 60 };
}

function toggleAccordion(id) {
    document.getElementById(id)?.classList.toggle('open');
}

function toggleSub(id) {
    document.getElementById(id)?.classList.toggle('open');
}

function openModal(id) {
    document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
}

function openWorkoutModal() {
    const dateEl = document.getElementById('workout-modal-date');
    if (dateEl) dateEl.textContent = formatGermanDate(selectedKey);
    if (typeof renderWorkoutModal === 'function') renderWorkoutModal();
    openModal('modal-workout');
}

function getDayDots(d) {
    if (!d) return { sleep: false, food: false, act: false, care: false, misc: false };
    const sleep = !!(d.sleep?.bed || d.sleep?.wake || d.sleep?.note?.trim());
    const food = !!(
        d.food?.m1?.done || d.food?.m1?.time || d.food?.m1?.note?.trim() || d.food?.m1?.dayContent?.trim() ||
        d.food?.m2?.done || d.food?.m2?.time || d.food?.m2?.fisch || d.food?.m2?.brot || d.food?.m2?.note?.trim() || d.food?.m2?.dayContent?.trim()
    );
    const act = !!(
        d.act?.train?.done || d.act?.train?.note?.trim() || (d.act?.workout?.exercises?.length > 0) ||
        d.act?.bike?.done || d.act?.bike?.note?.trim() ||
        d.act?.rest?.done || d.act?.rest?.note?.trim()
    );
    const care = !!(d.care?.shower || d.care?.hair || d.care?.note?.trim());
    const misc = !!(d.misc?.note?.trim());
    return { sleep, food, act, care, misc };
}

function hasAnyEntry(d) {
    if (!d) return false;
    const f = getDayDots(d);
    return f.sleep || f.food || f.act || f.care || f.misc || !!(d.food?.m1?.items?.length) || !!(d.food?.m2?.items?.length);
}

function updateHeaderDots(day) {
    const flags = getDayDots(day);
    document.getElementById('dot-sleep')?.classList.toggle('visible', flags.sleep);
    document.getElementById('dot-food')?.classList.toggle('visible', flags.food);
    document.getElementById('dot-act')?.classList.toggle('visible', flags.act);
    document.getElementById('dot-care')?.classList.toggle('visible', flags.care);
    document.getElementById('dot-misc')?.classList.toggle('visible', flags.misc);
}

function selectDay(key) {
    selectedKey = key;
    const label = document.getElementById('selected-date-label');
    if (label) {
        const todayKey = formatDateKey(new Date());
        label.textContent = (key === todayKey)
            ? `Heute (${formatShortGermanDate(key)})`
            : formatGermanDate(key);
    }

    const day = appState.days[key] || getEmptyDay();

    document.getElementById('sleep-bed').value = day.sleep?.bed || '';
    document.getElementById('sleep-wake').value = day.sleep?.wake || '';
    document.getElementById('sleep-note').value = day.sleep?.note || '';
    updateSleepDurationUI(day.sleep?.bed, day.sleep?.wake);

    document.getElementById('m1-done').checked = !!day.food?.m1?.done;
    document.getElementById('m1-time').value = day.food?.m1?.time || '';
    const isBrot = !!day.food?.m1?.brot && !day.food?.m1?.brei;
    document.getElementById('m1-brot').checked = isBrot;
    document.getElementById('m1-brei').checked = !isBrot;
    document.getElementById('m1-note').value = day.food?.m1?.note || '';

    document.getElementById('m2-done').checked = !!day.food?.m2?.done;
    document.getElementById('m2-time').value = day.food?.m2?.time || '';
    document.getElementById('m2-fisch').checked = !!day.food?.m2?.fisch;
    document.getElementById('m2-brot').checked = !!day.food?.m2?.brot;
    const fType = day.food?.m2?.fishType || 'makrele';
    const fRadio = document.querySelector(`input[name="fish-type"][value="${fType}"]`);
    if (fRadio) fRadio.checked = true;
    document.getElementById('fish-options')?.classList.toggle('visible', !!day.food?.m2?.fisch);
    document.getElementById('m2-note').value = day.food?.m2?.note || '';

    document.getElementById('act-train').checked = !!day.act?.train?.done;
    document.getElementById('act-train-note').value = day.act?.train?.note || '';
    document.getElementById('act-bike').checked = !!day.act?.bike?.done;
    document.getElementById('act-bike-note').value = day.act?.bike?.note || '';
    document.getElementById('act-rest').checked = !!day.act?.rest?.done;
    document.getElementById('act-rest-note').value = day.act?.rest?.note || '';

    document.getElementById('care-shower').checked = !!day.care?.shower;
    document.getElementById('care-hair').checked = !!day.care?.hair;
    document.getElementById('care-note').value = day.care?.note || '';

    document.getElementById('misc-note').value = day.misc?.note || '';

    updateHeaderDots(day);
    if (typeof updateDailyMacroBanner === 'function') updateDailyMacroBanner(day);
    renderCalendar();
}

function updateSleepDurationUI(bed, wake) {
    const el = document.getElementById('sleep-duration');
    if (!el) return;
    const dur = calcSleepDuration(bed, wake);
    el.textContent = dur ? `Dauer: ${dur.h}h ${String(dur.m).padStart(2, '0')}m` : 'Dauer: –';
}

function saveDay() {
    const existing = appState.days[selectedKey] || getEmptyDay();
    const bed = document.getElementById('sleep-bed').value;
    const wake = document.getElementById('sleep-wake').value;
    const note = document.getElementById('sleep-note').value;
    updateSleepDurationUI(bed, wake);

    const dayObj = {
        sleep: { bed, wake, note },
        food: {
            m1: {
                done: document.getElementById('m1-done').checked,
                time: document.getElementById('m1-time').value,
                brei: document.getElementById('m1-brei').checked,
                brot: document.getElementById('m1-brot').checked,
                note: document.getElementById('m1-note').value,
                items: existing.food?.m1?.items || null,
                dayContent: existing.food?.m1?.dayContent || ''
            },
            m2: {
                done: document.getElementById('m2-done').checked,
                time: document.getElementById('m2-time').value,
                fisch: document.getElementById('m2-fisch').checked,
                fishType: document.querySelector('input[name="fish-type"]:checked')?.value || 'makrele',
                brot: document.getElementById('m2-brot').checked,
                note: document.getElementById('m2-note').value,
                items: existing.food?.m2?.items || null,
                dayContent: existing.food?.m2?.dayContent || ''
            }
        },
        act: {
            train: { done: document.getElementById('act-train').checked, note: document.getElementById('act-train-note').value },
            bike: { done: document.getElementById('act-bike').checked, note: document.getElementById('act-bike-note').value },
            rest: { done: document.getElementById('act-rest').checked, note: document.getElementById('act-rest-note').value },
            workout: existing.act?.workout || getEmptyDay().act.workout
        },
        care: {
            shower: document.getElementById('care-shower').checked,
            hair: document.getElementById('care-hair').checked,
            note: document.getElementById('care-note').value
        },
        misc: { note: document.getElementById('misc-note').value }
    };

    if (hasAnyEntry(dayObj)) appState.days[selectedKey] = dayObj;
    else delete appState.days[selectedKey];

    persistState();
    updateHeaderDots(dayObj);
    if (typeof updateDailyMacroBanner === 'function') updateDailyMacroBanner(dayObj);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('cal-days');
    const titleEl = document.getElementById('cal-month-title');
    if (!grid || !titleEl) return;

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    titleEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = formatDateKey(new Date());

    let html = '';
    for (let i = 0; i < startOffset; i++) html += '<div class="day-cell empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const flags = getDayDots(appState.days[key]);
        let dots = '';
        if (flags.sleep) dots += '<span class="dot" style="background:var(--dot-sleep)"></span>';
        if (flags.food) dots += '<span class="dot" style="background:var(--dot-food)"></span>';
        if (flags.act) dots += '<span class="dot" style="background:var(--dot-act)"></span>';
        if (flags.care) dots += '<span class="dot" style="background:var(--dot-care)"></span>';
        if (flags.misc) dots += '<span class="dot" style="background:var(--dot-misc)"></span>';

        const cls = ['day-cell'];
        if (key === todayKey) cls.push('today');
        if (key === selectedKey) cls.push('selected');

        html += `<div class="${cls.join(' ')}" onclick="selectDay('${key}')"><div class="day-num">${day}</div><div class="dots-row">${dots}</div></div>`;
    }

    grid.innerHTML = html;
    if (typeof renderMonthStats === 'function') renderMonthStats();
}

function changeMonth(delta) {
    currentCalDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + delta, 1);
    renderCalendar();
}

function goToToday() {
    const now = new Date();
    currentCalDate = new Date(now.getFullYear(), now.getMonth(), 1);
    selectDay(formatDateKey(now));
}

function changeTileSize(delta) {
    appState.tileHeight = Math.max(46, Math.min(130, (appState.tileHeight || 66) + delta));
    document.documentElement.style.setProperty('--tile-height', appState.tileHeight + 'px');
    persistState();
}

function toggleDarkMode() {
    appState.darkMode = !appState.darkMode;
    document.body.classList.toggle('dark-mode', appState.darkMode);
    const btn = document.getElementById('dark-btn');
    if (btn) btn.textContent = appState.darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    persistState();
}

function exportJSON() {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'routine-daten.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed && typeof parsed === 'object') {
                appState = {
                    days: parsed.days || {},
                    customFoods: parsed.customFoods || {},
                    mealTemplates: parsed.mealTemplates || {},
                    templates: parsed.templates || parsed.workoutTemplates || null,
                    darkMode: !!parsed.darkMode,
                    tileHeight: parsed.tileHeight || 66,
                    password: parsed.password || ''
                };
                persistState();
                applyVisualSettings();
                selectDay(selectedKey);
                alert('Daten erfolgreich geladen!');
            }
        } catch (err) {
            alert('Ungültige JSON-Datei.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function openPasswordModal() {
    const inp = document.getElementById('new-pw-input');
    if (inp) inp.value = appState.password || '';
    openModal('modal-pw');
}

function saveNewPassword() {
    const inp = document.getElementById('new-pw-input');
    appState.password = inp ? inp.value.trim() : '';
    persistState();
    updateLockButtonUI();
    closeModal('modal-pw');
}

function lockAppNow() {
    if (!appState.password) return;
    const inp = document.getElementById('lock-input');
    const err = document.getElementById('lock-error');
    if (inp) inp.value = '';
    if (err) err.textContent = '';
    document.getElementById('lock-screen').style.display = 'flex';
}

function updateLockButtonUI() {
    let lockBtn = document.getElementById('manual-lock-btn');
    const actions = document.querySelector('.topbar-actions');
    if (!actions) return;
    if (appState.password) {
        if (!lockBtn) {
            lockBtn = document.createElement('button');
            lockBtn.id = 'manual-lock-btn';
            lockBtn.textContent = '🔒 Sperren';
            lockBtn.onclick = lockAppNow;
            actions.appendChild(lockBtn);
        }
    } else if (lockBtn) {
        lockBtn.remove();
    }
}

function handleUnlock() {
    const inp = document.getElementById('lock-input');
    const err = document.getElementById('lock-error');
    if (inp && inp.value === appState.password) {
        document.getElementById('lock-screen').style.display = 'none';
        if (err) err.textContent = '';
    } else if (err) {
        err.textContent = 'Falsches Passwort!';
    }
}

function applyVisualSettings() {
    document.body.classList.toggle('dark-mode', !!appState.darkMode);
    const btn = document.getElementById('dark-btn');
    if (btn) btn.textContent = appState.darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    document.documentElement.style.setProperty('--tile-height', (appState.tileHeight || 66) + 'px');
}

function startLiveClock() {
    const updateClock = () => {
        const el = document.getElementById('live-clock');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
        }
    };
    updateClock();
    setInterval(updateClock, 15000);
}

function initApp() {
    loadState();
    applyVisualSettings();
    updateLockButtonUI();
    document.querySelectorAll('.accordion').forEach(acc => acc.classList.remove('open'));
    if (appState.password) {
        document.getElementById('lock-screen').style.display = 'flex';
    }
    selectDay(selectedKey);
    startLiveClock();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();
