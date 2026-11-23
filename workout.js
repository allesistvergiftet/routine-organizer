// --- TRAININGSPLAN / LOGBUCH ---

function getWorkoutTemplatesMap() {
    const defaults = (typeof DEFAULT_TEMPLATES !== 'undefined' && DEFAULT_TEMPLATES) ? DEFAULT_TEMPLATES : {};
    const custom = (typeof appState !== 'undefined' && appState.templates && typeof appState.templates === 'object')
        ? appState.templates
        : {};
    return Object.assign({}, defaults, custom);
}

function ensureDayWorkoutObj() {
    if (!appState.days[selectedKey]) {
        appState.days[selectedKey] = getEmptyDay();
    }
    if (!appState.days[selectedKey].act) {
        appState.days[selectedKey].act = getEmptyDay().act;
    }
    if (!appState.days[selectedKey].act.workout) {
        appState.days[selectedKey].act.workout = getEmptyDay().act.workout;
    }
    if (!Array.isArray(appState.days[selectedKey].act.workout.exercises)) {
        appState.days[selectedKey].act.workout.exercises = [];
    }
    return appState.days[selectedKey].act.workout;
}

function escapeHtmlAttr(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderWorkoutModal() {
    const wo = ensureDayWorkoutObj();
    const templatesMap = getWorkoutTemplatesMap();
    const splitNames = Object.keys(templatesMap);

    const selectEl = document.getElementById('wo-split-select');
    if (selectEl) {
        let opts = '<option value="">-- Split / Vorlage wählen --</option>';
        splitNames.forEach(name => {
            const sel = (wo.splitName === name) ? 'selected' : '';
            opts += `<option value="${escapeHtmlAttr(name)}" ${sel}>${escapeHtmlAttr(name)}</option>`;
        });
        if (wo.splitName && !templatesMap[wo.splitName]) {
            opts += `<option value="${escapeHtmlAttr(wo.splitName)}" selected>${escapeHtmlAttr(wo.splitName)}</option>`;
        }
        selectEl.innerHTML = opts;
    }

    const dayNumEl = document.getElementById('wo-day-number');
    if (dayNumEl) dayNumEl.value = wo.dayNumber || '';

    const preTimeEl = document.getElementById('wo-pre-time');
    if (preTimeEl) preTimeEl.value = wo.preTime || '';

    const ratingEl = document.getElementById('wo-rating');
    if (ratingEl) ratingEl.value = wo.rating || 'gut';

    const salzEl = document.getElementById('wo-pre-salz');
    if (salzEl) salzEl.checked = !!wo.preSalz;

    const honigEl = document.getElementById('wo-pre-honig');
    if (honigEl) honigEl.checked = !!wo.preHonig;

    const zugEl = document.getElementById('wo-zughilfen');
    if (zugEl) zugEl.checked = !!wo.zughilfen;

    renderWorkoutExercisesList();
}

function renderWorkoutExercisesList() {
    const wo = ensureDayWorkoutObj();
    const container = document.getElementById('workout-exercises-list');
    if (!container) return;

    if (wo.exercises.length === 0) {
        container.innerHTML = '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:14px;">Noch keine Übungen eingetragen. Wähle oben einen Split und klicke auf „📋 Vorlage laden“ oder „+ Übung“.</p>';
        return;
    }

    const typeOptions = ['Start', '+', '++', '<>'];

    let html = `
        <div class="workout-row workout-head-labels">
            <div>Typ</div>
            <div>Übung</div>
            <div>Gewicht</div>
            <div>Sätze / Wdh.</div>
            <div>Pause</div>
            <div></div>
        </div>
    `;

    wo.exercises.forEach((ex, idx) => {
        const currentType = ex.type || 'Start';
        const optsHtml = typeOptions.map(t =>
            `<option value="${escapeHtmlAttr(t)}" ${currentType === t ? 'selected' : ''}>${escapeHtmlAttr(t)}</option>`
        ).join('');

        html += `
            <div class="workout-row">
                <div class="workout-type-cell">
                    <span class="workout-col-lbl">Typ</span>
                    <select onchange="updateWorkoutExercise(${idx}, 'type', this.value)">${optsHtml}</select>
                </div>
                <div class="workout-name-cell">
                    <span class="workout-col-lbl">Übung</span>
                    <input type="text" value="${escapeHtmlAttr(ex.name)}" placeholder="Übungsname" oninput="updateWorkoutExercise(${idx}, 'name', this.value)">
                </div>
                <div class="workout-weight-cell">
                    <span class="workout-col-lbl">Gewicht</span>
                    <input type="text" value="${escapeHtmlAttr(ex.weight)}" placeholder="z.B. 60kg / BW" oninput="updateWorkoutExercise(${idx}, 'weight', this.value)">
                </div>
                <div class="workout-sets-cell">
                    <span class="workout-col-lbl">Sätze / Wdh.</span>
                    <input type="text" value="${escapeHtmlAttr(ex.sets)}" placeholder="z.B. 3x10" oninput="updateWorkoutExercise(${idx}, 'sets', this.value)">
                </div>
                <div class="workout-rest-cell">
                    <span class="workout-col-lbl">Pause</span>
                    <input type="text" value="${escapeHtmlAttr(ex.rest)}" placeholder="60s" oninput="updateWorkoutExercise(${idx}, 'rest', this.value)">
                </div>
                <div class="workout-del-cell">
                    <button class="del-x" title="Übung entfernen" onclick="removeWorkoutExercise(${idx})">✕</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function syncWorkoutChanges(markTrainDone = false) {
    if (markTrainDone) {
        const trainCheck = document.getElementById('act-train');
        if (trainCheck) trainCheck.checked = true;
        if (appState.days[selectedKey]?.act?.train) {
            appState.days[selectedKey].act.train.done = true;
        }
    }
    if (!hasAnyEntry(appState.days[selectedKey])) {
        delete appState.days[selectedKey];
    }
    persistState();
    updateHeaderDots(appState.days[selectedKey]);
    renderCalendar();
}

function onWorkoutSplitChange(val) {
    const wo = ensureDayWorkoutObj();
    wo.splitName = val;
    syncWorkoutChanges(false);
}

function saveWorkoutMeta() {
    const wo = ensureDayWorkoutObj();
    wo.splitName = document.getElementById('wo-split-select')?.value || '';
    wo.dayNumber = document.getElementById('wo-day-number')?.value || '';
    wo.preTime = document.getElementById('wo-pre-time')?.value || '';
    wo.rating = document.getElementById('wo-rating')?.value || 'gut';
    wo.preSalz = !!document.getElementById('wo-pre-salz')?.checked;
    wo.preHonig = !!document.getElementById('wo-pre-honig')?.checked;
    wo.zughilfen = !!document.getElementById('wo-zughilfen')?.checked;
    syncWorkoutChanges(false);
}

function loadSelectedWorkoutTemplate() {
    const selectEl = document.getElementById('wo-split-select');
    const splitName = selectEl ? selectEl.value : '';
    const templatesMap = getWorkoutTemplatesMap();

    if (!splitName || !templatesMap[splitName]) {
        alert('Bitte zuerst oben einen Split / eine Vorlage auswählen.');
        return;
    }

    const wo = ensureDayWorkoutObj();
    if (wo.exercises.length > 0 && !confirm(`Bestehende Übungen durch Vorlage „${splitName}“ ersetzen?`)) {
        return;
    }

    wo.splitName = splitName;
    wo.exercises = JSON.parse(JSON.stringify(templatesMap[splitName]));
    syncWorkoutChanges(true);
    renderWorkoutExercisesList();
}

function loadLastWorkoutForSplit() {
    const selectEl = document.getElementById('wo-split-select');
    const splitName = selectEl ? selectEl.value : '';
    if (!splitName) {
        alert('Bitte zuerst einen Split auswählen, für den der letzte Stand gesucht werden soll.');
        return;
    }

    const pastKeys = Object.keys(appState.days || {})
        .filter(k => k < selectedKey)
        .sort()
        .reverse();

    let foundWorkout = null;
    for (const k of pastKeys) {
        const candidate = appState.days[k]?.act?.workout;
        if (candidate && candidate.splitName === splitName && Array.isArray(candidate.exercises) && candidate.exercises.length > 0) {
            foundWorkout = candidate;
            break;
        }
    }

    if (!foundWorkout) {
        alert(`Kein früheres Training für „${splitName}“ gefunden.`);
        return;
    }

    const wo = ensureDayWorkoutObj();
    if (wo.exercises.length > 0 && !confirm(`Bestehende Übungen durch den letzten Stand von „${splitName}“ ersetzen?`)) {
        return;
    }

    wo.splitName = splitName;
    wo.exercises = JSON.parse(JSON.stringify(foundWorkout.exercises));
    syncWorkoutChanges(true);
    renderWorkoutExercisesList();
}

function addWorkoutExerciseRow() {
    const wo = ensureDayWorkoutObj();
    wo.exercises.push({
        type: 'Start',
        name: '',
        weight: '',
        sets: '3x10',
        rest: '60s'
    });
    syncWorkoutChanges(true);
    renderWorkoutExercisesList();
}

function updateWorkoutExercise(idx, field, val) {
    const wo = ensureDayWorkoutObj();
    if (wo.exercises[idx]) {
        wo.exercises[idx][field] = val;
        syncWorkoutChanges(false);
    }
}

function removeWorkoutExercise(idx) {
    const wo = ensureDayWorkoutObj();
    wo.exercises.splice(idx, 1);
    syncWorkoutChanges(false);
    renderWorkoutExercisesList();
}

function saveCurrentWorkoutAsTemplate() {
    const wo = ensureDayWorkoutObj();
    const defaultName = wo.splitName || 'Mein Split';
    const name = prompt('Name für die Trainings-Vorlage:', defaultName);
    if (!name || !name.trim()) return;

    const cleanName = name.trim();
    if (!appState.templates || typeof appState.templates !== 'object') {
        appState.templates = {};
    }
    appState.templates[cleanName] = JSON.parse(JSON.stringify(wo.exercises));
    wo.splitName = cleanName;
    syncWorkoutChanges(false);
    renderWorkoutModal();
    alert(`Vorlage „${cleanName}“ wurde gespeichert!`);
}
