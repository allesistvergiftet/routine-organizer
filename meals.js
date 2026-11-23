function getFoodDatabase() {
    const custom = (appState && appState.customFoods) ? appState.customFoods : {};
    return Object.assign({}, (typeof FOOD_DB !== 'undefined' ? FOOD_DB : {}), custom);
}

function getDefaultMealList(num) {
    if (num === 1 && typeof MEAL1_DEFAULT !== 'undefined') return JSON.parse(JSON.stringify(MEAL1_DEFAULT));
    if (num === 2 && typeof MEAL2_DEFAULT !== 'undefined') return JSON.parse(JSON.stringify(MEAL2_DEFAULT));
    return [];
}

function isCorruptedMealList(list) {
    if (!Array.isArray(list) || list.length === 0) return true;
    const db = getFoodDatabase();
    const valid = list.filter(it => it && it.foodId && db[it.foodId]);
    if (valid.length === 0) return true;
    if (valid.length > 2) {
        const uniqueIds = new Set(valid.map(it => it.foodId));
        if (uniqueIds.size === 1) return true;
    }
    return false;
}

function migrateLegacyMealItem(item) {
    if (!item) return null;
    const db = getFoodDatabase();
    if (item.foodId && db[item.foodId] && typeof item.grams === 'number') return item;
    
    const rawName = String(item.name || '').toLowerCase();
    const gMatch = rawName.match(/(\d+(?:[.,]\d+)?)\s*g\b/);
    const grams = gMatch ? parseFloat(gMatch[1].replace(',', '.')) : 100;

    for (const [id, food] of Object.entries(db)) {
        const fName = food.name.toLowerCase();
        const coreWord = fName.split('(')[0].trim();
        if (rawName.includes(coreWord) || coreWord.includes(rawName.replace(/^\d+g\s*/, '').trim())) {
            return { foodId: id, grams: grams };
        }
    }
    return null;
}

function getMealItemsForDay(num, d) {
    const mKey = num === 1 ? 'm1' : 'm2';
    const mealObj = d?.food?.[mKey];
    let list = null;

    if (mealObj && Array.isArray(mealObj.items) && mealObj.items.length > 0) {
        const migrated = mealObj.items.map(migrateLegacyMealItem).filter(Boolean);
        if (!isCorruptedMealList(migrated)) {
            list = migrated;
        } else {
            delete mealObj.items;
            if (typeof persistState === 'function') persistState();
        }
    }
    
    if (!list && appState?.mealTemplates?.[mKey] && Array.isArray(appState.mealTemplates[mKey]) && appState.mealTemplates[mKey].length > 0) {
        const migratedTpl = appState.mealTemplates[mKey].map(migrateLegacyMealItem).filter(Boolean);
        if (!isCorruptedMealList(migratedTpl)) {
            list = migratedTpl;
        } else {
            delete appState.mealTemplates[mKey];
            if (typeof persistState === 'function') persistState();
        }
    }
    
    if (!list) {
        list = getDefaultMealList(num);
    }

    if (num === 2) {
        const hasFish = list.some(it => it.foodId === 'makrele' || it.foodId === 'hering');
        if (mealObj?.fisch && !hasFish) {
            const fType = mealObj.fishType === 'hering' ? 'hering' : 'makrele';
            list.push({ foodId: fType, grams: fType === 'hering' ? 160 : 125 });
        }
        const hasBread = list.some(it => it.foodId === 'buchweizenbrot');
        if (mealObj?.brot && !hasBread) {
            list.push({ foodId: 'buchweizenbrot', grams: 250 });
        }
    }
    return list;
}

function calcItemMacros(item) {
    const db = getFoodDatabase();
    const food = db[item.foodId];
    if (!food) return { name: 'Unbekannt', kcal: 0, p: 0, kh: 0, f: 0 };
    const factor = (Number(item.grams) || 0) / 100;
    return {
        name: food.name,
        kcal: Math.round(food.kcal * factor * 10) / 10,
        p: Math.round(food.p * factor * 10) / 10,
        kh: Math.round(food.kh * factor * 10) / 10,
        f: Math.round(food.f * factor * 10) / 10
    };
}

function getMealTotals(num, d) {
    const items = getMealItemsForDay(num, d);
    return items.reduce((acc, it) => {
        const m = calcItemMacros(it);
        return {
            kcal: acc.kcal + m.kcal,
            p: Math.round((acc.p + m.p) * 10) / 10,
            kh: Math.round((acc.kh + m.kh) * 10) / 10,
            f: Math.round((acc.f + m.f) * 10) / 10
        };
    }, { kcal: 0, p: 0, kh: 0, f: 0 });
}

function updateDailyMacroBanner(d) {
    let total = { kcal: 0, p: 0, kh: 0, f: 0 };
    if (d?.food?.m1?.done) {
        const t = getMealTotals(1, d);
        total.kcal += t.kcal; total.p += t.p; total.kh += t.kh; total.f += t.f;
    }
    if (d?.food?.m2?.done) {
        const t = getMealTotals(2, d);
        total.kcal += t.kcal; total.p += t.p; total.kh += t.kh; total.f += t.f;
    }
    const el = document.getElementById('daily-macro-sum');
    if (el) {
        el.textContent = `Tages-Makros (abgehakt): ~${Math.round(total.kcal)} kcal | ${Math.round(total.p)}g P | ${Math.round(total.kh)}g KH | ${Math.round(total.f)}g F`;
    }
}

function ensureDayMealItems(num) {
    if (!appState.days[selectedKey]) appState.days[selectedKey] = getEmptyDay();
    const mKey = num === 1 ? 'm1' : 'm2';
    const current = appState.days[selectedKey].food[mKey].items;
    if (!current || current.length === 0 || isCorruptedMealList(current)) {
        appState.days[selectedKey].food[mKey].items = getMealItemsForDay(num, appState.days[selectedKey]);
    } else {
        appState.days[selectedKey].food[mKey].items = current.map(migrateLegacyMealItem).filter(Boolean);
    }
    return appState.days[selectedKey].food[mKey].items;
}

function openMealModal(num) {
    activeMealModal = num;
    const d = appState.days[selectedKey] || getEmptyDay();
    document.getElementById('meal-modal-title').textContent = `📝 Inhalt & Makros (${num}. Mahlzeit)`;
    document.getElementById('meal-modal-date').textContent = formatGermanDate(selectedKey);

    const db = getFoodDatabase();
    const dbKeys = Object.keys(db);
    const items = getMealItemsForDay(num, d);
    const totals = getMealTotals(num, d);

    document.getElementById('meal-macro-cards').innerHTML = `
        <div class="m-card"><div class="val">~${Math.round(totals.kcal)}</div><div class="lbl">kcal</div></div>
        <div class="m-card"><div class="val">${Math.round(totals.p)}g</div><div class="lbl">Protein</div></div>
        <div class="m-card"><div class="val">${Math.round(totals.kh)}g</div><div class="lbl">Kohlenh.</div></div>
        <div class="m-card"><div class="val">${Math.round(totals.f)}g</div><div class="lbl">Fett</div></div>
    `;

    const rowsHtml = items.map((it, idx) => {
        const m = calcItemMacros(it);
        const optionsHtml = dbKeys.map(k => `<option value="${k}" ${it.foodId === k ? 'selected' : ''}>${db[k].name}</option>`).join('');
        return `
            <tr>
                <td>
                    <select onchange="updateMealItemFood(${idx}, this.value)" style="width:100%; padding:4px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); font-size:0.8rem;">
                        ${optionsHtml}
                    </select>
                </td>
                <td style="width:68px;">
                    <input type="number" value="${it.grams}" min="0" step="5" oninput="updateMealItemGrams(${idx}, this.value)" style="width:64px; padding:4px; font-size:0.8rem;">
                </td>
                <td>${Math.round(m.kcal)}</td>
                <td>${m.p}g</td>
                <td>${m.kh}g</td>
                <td>${m.f}g</td>
                <td><button class="del-x" onclick="removeMealItem(${idx})">✕</button></td>
            </tr>
        `;
    }).join('');

    const table = document.querySelector('#modal-meal .ing-table');
    table.innerHTML = `
        <thead><tr><th>Lebensmittel</th><th>Gramm</th><th>kcal</th><th>P</th><th>KH</th><th>F</th><th></th></tr></thead>
        <tbody id="meal-ing-tbody">${rowsHtml}</tbody>
    `;

    document.getElementById('meal-hint-box').innerHTML = `
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
            <button class="small-btn" onclick="addMealItem()">+ Zutat hinzufügen</button>
            <button class="small-btn" onclick="resetMealToDefault()">🔄 Standard-Plan laden</button>
            <button class="small-btn" onclick="saveMealAsTemplate()">💾 Als neuen Standard speichern</button>
        </div>
        <details style="background:var(--sub-bg); padding:8px; border-radius:8px; border:1px solid var(--border);">
            <summary style="cursor:pointer; font-weight:600; font-size:0.8rem;">➕ Neues Lebensmittel (pro 100g) in Datenbank anlegen</summary>
            <div style="display:grid; grid-template-columns: 1.6fr 1fr 1fr 1fr 1fr; gap:5px; margin-top:8px;">
                <input type="text" id="new-food-name" placeholder="Name (z.B. Haferflocken)" style="padding:4px 6px; font-size:0.78rem;">
                <input type="number" id="new-food-kcal" placeholder="kcal" style="padding:4px 6px; font-size:0.78rem;">
                <input type="number" id="new-food-p" placeholder="P (g)" style="padding:4px 6px; font-size:0.78rem;">
                <input type="number" id="new-food-kh" placeholder="KH (g)" style="padding:4px 6px; font-size:0.78rem;">
                <input type="number" id="new-food-f" placeholder="F (g)" style="padding:4px 6px; font-size:0.78rem;">
            </div>
            <button class="primary small-btn" style="margin-top:6px; width:100%;" onclick="addNewFoodToDb()">In Datenbank speichern</button>
        </details>
    `;

    const mKey = num === 1 ? 'm1' : 'm2';
    document.getElementById('meal-day-content').value = d.food?.[mKey]?.dayContent || '';
    openModal('modal-meal');
}

window.updateMealItemFood = function(idx, foodId) {
    const list = ensureDayMealItems(activeMealModal);
    if (list[idx]) {
        list[idx].foodId = foodId;
        persistState();
        updateDailyMacroBanner(appState.days[selectedKey]);
        renderCalendar();
        openMealModal(activeMealModal);
    }
};

window.updateMealItemGrams = function(idx, val) {
    const list = ensureDayMealItems(activeMealModal);
    if (list[idx]) {
        list[idx].grams = Number(val) || 0;
        persistState();
        updateDailyMacroBanner(appState.days[selectedKey]);
        renderCalendar();
        const totals = getMealTotals(activeMealModal, appState.days[selectedKey]);
        document.getElementById('meal-macro-cards').innerHTML = `
            <div class="m-card"><div class="val">~${Math.round(totals.kcal)}</div><div class="lbl">kcal</div></div>
            <div class="m-card"><div class="val">${Math.round(totals.p)}g</div><div class="lbl">Protein</div></div>
            <div class="m-card"><div class="val">${Math.round(totals.kh)}g</div><div class="lbl">Kohlenh.</div></div>
            <div class="m-card"><div class="val">${Math.round(totals.f)}g</div><div class="lbl">Fett</div></div>
        `;
        const m = calcItemMacros(list[idx]);
        const row = document.querySelectorAll('#meal-ing-tbody tr')[idx];
        if (row) {
            row.cells[2].textContent = Math.round(m.kcal);
            row.cells[3].textContent = m.p + 'g';
            row.cells[4].textContent = m.kh + 'g';
            row.cells[5].textContent = m.f + 'g';
        }
    }
};

window.addMealItem = function() {
    const list = ensureDayMealItems(activeMealModal);
    const firstKey = Object.keys(getFoodDatabase())[0] || 'apfel';
    list.push({ foodId: firstKey, grams: 100 });
    persistState();
    updateDailyMacroBanner(appState.days[selectedKey]);
    renderCalendar();
    openMealModal(activeMealModal);
};

window.removeMealItem = function(idx) {
    const list = ensureDayMealItems(activeMealModal);
    list.splice(idx, 1);
    persistState();
    updateDailyMacroBanner(appState.days[selectedKey]);
    renderCalendar();
    openMealModal(activeMealModal);
};

window.resetMealToDefault = function() {
    if (!appState.days[selectedKey]) appState.days[selectedKey] = getEmptyDay();
    const mKey = activeMealModal === 1 ? 'm1' : 'm2';
    delete appState.days[selectedKey].food[mKey].items;
    if (appState.mealTemplates && appState.mealTemplates[mKey]) {
        delete appState.mealTemplates[mKey];
    }
    persistState();
    updateDailyMacroBanner(appState.days[selectedKey]);
    renderCalendar();
    openMealModal(activeMealModal);
};

window.saveMealAsTemplate = function() {
    const list = ensureDayMealItems(activeMealModal);
    if (!appState.mealTemplates) appState.mealTemplates = {};
    const mKey = activeMealModal === 1 ? 'm1' : 'm2';
    appState.mealTemplates[mKey] = JSON.parse(JSON.stringify(list));
    persistState();
    alert(`Als neuer Standard für die ${activeMealModal}. Mahlzeit gespeichert!`);
};

window.addNewFoodToDb = function() {
    const name = document.getElementById('new-food-name').value.trim();
    if (!name) { alert('Bitte einen Namen eingeben.'); return; }
    const id = 'custom_' + Date.now();
    if (!appState.customFoods) appState.customFoods = {};
    appState.customFoods[id] = {
        name: name,
        kcal: Number(document.getElementById('new-food-kcal').value) || 0,
        p: Number(document.getElementById('new-food-p').value) || 0,
        kh: Number(document.getElementById('new-food-kh').value) || 0,
        f: Number(document.getElementById('new-food-f').value) || 0
    };
    persistState();
    openMealModal(activeMealModal);
};

function saveMealDayContent() {
    if (!appState.days[selectedKey]) appState.days[selectedKey] = getEmptyDay();
    const val = document.getElementById('meal-day-content').value;
    if (activeMealModal === 1) appState.days[selectedKey].food.m1.dayContent = val;
    else appState.days[selectedKey].food.m2.dayContent = val;
    if (!hasAnyEntry(appState.days[selectedKey])) delete appState.days[selectedKey];
    persistState();
    updateHeaderDots(appState.days[selectedKey]);
    renderCalendar();
}

function onFishToggle() {
    const checked = document.getElementById('m2-fisch').checked;
    document.getElementById('fish-options').classList.toggle('visible', checked);
    if (appState.days[selectedKey]?.food?.m2?.items) {
        const list = appState.days[selectedKey].food.m2.items;
        const selectedFish = document.querySelector('input[name="fish-type"]:checked')?.value || 'makrele';
        const filtered = list.filter(it => it.foodId !== 'makrele' && it.foodId !== 'hering');
        if (checked) {
            filtered.push({ foodId: selectedFish, grams: selectedFish === 'hering' ? 160 : 125 });
        }
        appState.days[selectedKey].food.m2.items = filtered;
    }
    saveDay();
}
