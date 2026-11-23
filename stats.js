let showMonthGraph = false;
let graphMetric = 'sleep';

function toggleMonthGraph() {
    showMonthGraph = !showMonthGraph;
    renderMonthStats();
}

function setGraphMetric(metric) {
    graphMetric = metric;
    renderMonthStats();
}

function renderMonthStats() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let sleepSum = 0;
    let sleepCount = 0;
    let trainDays = 0;
    let bikeDays = 0;
    let restDays = 0;
    let makreleCount = 0;
    let heringCount = 0;
    let hairDays = 0;
    const dailyPoints = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = appState.days[key];
        let daySleep = null;
        let dayKcal = 0;

        if (d) {
            if (d.sleep?.bed && d.sleep?.wake) {
                const dur = calcSleepDuration(d.sleep.bed, d.sleep.wake);
                if (dur) {
                    const hrs = dur.mins / 60;
                    sleepSum += hrs;
                    sleepCount++;
                    daySleep = Math.round(hrs * 10) / 10;
                }
            }
            if (d.act?.train?.done) trainDays++;
            if (d.act?.bike?.done) bikeDays++;
            if (d.act?.rest?.done) restDays++;
            if (d.food?.m2?.fisch) {
                if (d.food.m2.fishType === 'hering') heringCount++;
                else makreleCount++;
            }
            if (d.care?.hair) hairDays++;

            if (typeof getMealTotals === 'function') {
                if (d.food?.m1?.done) dayKcal += getMealTotals(1, d).kcal;
                if (d.food?.m2?.done) dayKcal += getMealTotals(2, d).kcal;
            }
        }
        dailyPoints.push({ day: day, sleep: daySleep, kcal: Math.round(dayKcal) });
    }

    let sleepText = 'Ø Schlaf: –';
    if (sleepCount > 0) {
        const avgMins = Math.round((sleepSum / sleepCount) * 60);
        const h = Math.floor(avgMins / 60);
        const m = avgMins % 60;
        sleepText = `Ø Schlaf: ${h}h ${String(m).padStart(2, '0')}m`;
    }

    const avgEl = document.getElementById('avg-sleep-label');
    if (avgEl) {
        const headerEl = avgEl.parentElement;
        if (headerEl) {
            headerEl.style.flexWrap = 'wrap';
            headerEl.style.gap = '6px';
        }
        avgEl.style.display = 'flex';
        avgEl.style.flexWrap = 'wrap';
        avgEl.style.gap = '6px';
        avgEl.style.background = 'transparent';
        avgEl.style.padding = '0';

        const badges = [
            { label: sleepText, primary: true },
            { label: `Training: ${trainDays}×` },
            { label: `Fahrrad: ${bikeDays}×` },
            { label: `Pausentag: ${restDays}×` },
            { label: `Makrele: ${makreleCount}×` },
            { label: `Hering: ${heringCount}×` },
            { label: `Haare: ${hairDays}×` }
        ];

        avgEl.innerHTML = badges.map(b =>
            b.primary
                ? `<span style="font-size:0.82rem; font-weight:700; color:var(--primary); background:rgba(37,99,235,0.1); padding:3px 9px; border-radius:999px;">${b.label}</span>`
                : `<span style="font-size:0.82rem; font-weight:600; color:var(--text-main); background:var(--sub-bg); border:1px solid var(--border); padding:3px 9px; border-radius:999px;">${b.label}</span>`
        ).join('');
    }

    const container = document.getElementById('month-bar-chart');
    if (!container) return;

    container.innerHTML = `
        <div>
            <button class="small-btn" style="width:100%;" onclick="toggleMonthGraph()">
                📈 Verlaufsgraph ${showMonthGraph ? '▲' : '▼'}
            </button>
            ${showMonthGraph ? buildMonthSvgGraph(dailyPoints) : ''}
        </div>
    `;
}

function buildMonthSvgGraph(points) {
    const w = 320;
    const h = 130;
    const padL = 32;
    const padR = 10;
    const padT = 14;
    const padB = 22;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const isSleep = graphMetric === 'sleep';
    const maxVal = isSleep ? 12 : 3500;
    const color = isSleep ? '#0d6efd' : '#fd7e14';

    const validPts = points
        .map((p, i) => ({ x: padL + (i / Math.max(1, points.length - 1)) * plotW, val: isSleep ? p.sleep : (p.kcal > 0 ? p.kcal : null), day: p.day }))
        .filter(p => p.val !== null);

    let poly = '';
    let circles = '';
    if (validPts.length > 0) {
        poly = validPts.map(p => {
            const y = padT + plotH - (Math.min(maxVal, p.val) / maxVal) * plotH;
            return `${p.x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        circles = validPts.map(p => {
            const y = padT + plotH - (Math.min(maxVal, p.val) / maxVal) * plotH;
            return `<circle cx="${p.x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.8" fill="${color}"><title>Tag ${p.day}: ${p.val}${isSleep ? 'h' : ' kcal'}</title></circle>`;
        }).join('');
    }

    return `
        <div style="margin-top:8px; background:var(--sub-bg); padding:8px; border-radius:8px; border:1px solid var(--border);">
            <div style="display:flex; gap:6px; margin-bottom:6px;">
                <button class="small-btn ${isSleep ? 'primary' : ''}" style="flex:1; font-size:0.75rem;" onclick="setGraphMetric('sleep')">😴 Schlaf (h)</button>
                <button class="small-btn ${!isSleep ? 'primary' : ''}" style="flex:1; font-size:0.75rem;" onclick="setGraphMetric('kcal')">🔥 Kalorien</button>
            </div>
            <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;">
                <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="var(--border)" stroke-width="1"/>
                <line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="var(--border)" stroke-width="1"/>
                <text x="${padL - 4}" y="${padT + 4}" font-size="8" fill="var(--text-muted)" text-anchor="end">${maxVal}</text>
                <text x="${padL - 4}" y="${padT + plotH / 2 + 3}" font-size="8" fill="var(--text-muted)" text-anchor="end">${Math.round(maxVal / 2)}</text>
                <text x="${padL - 4}" y="${padT + plotH}" font-size="8" fill="var(--text-muted)" text-anchor="end">0</text>
                <text x="${padL}" y="${h - 6}" font-size="8" fill="var(--text-muted)">1.</text>
                <text x="${w - padR}" y="${h - 6}" font-size="8" fill="var(--text-muted)" text-anchor="end">${points.length}.</text>
                ${poly ? `<polyline fill="none" stroke="${color}" stroke-width="2" points="${poly}"/>` : ''}
                ${circles}
            </svg>
        </div>
    `;
}
