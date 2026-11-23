const FOOD_DB = {
    buchweizensprossen: { name: "Buchweizensprossen", kcal: 92, p: 3.4, kh: 18.4, f: 0.6 },
    hanfsamen: { name: "Hanfsamen (angekeimt)", kcal: 553, p: 31.1, kh: 8.3, f: 48.9 },
    kuerbiskerne: { name: "Kürbiskerne (eingeweicht)", kcal: 560, p: 30.0, kh: 10.7, f: 48.9 },
    banane: { name: "Banane", kcal: 89, p: 1.1, kh: 22.8, f: 0.3 },
    kakaopulver: { name: "Kakaopulver", kcal: 230, p: 20.0, kh: 58.0, f: 14.0 },
    datteln: { name: "Datteln / Feigen", kcal: 280, p: 2.4, kh: 72.0, f: 0.4 },
    apfel: { name: "Apfel", kcal: 52, p: 0.3, kh: 13.8, f: 0.2 },
    gewuerze_m1: { name: "Zimt, Salz, Pfeffer (optional Apfelessig + Natron)", kcal: 0, p: 0, kh: 0, f: 0 },
    linsensprossen: { name: "Linsensprossen", kcal: 106, p: 9.0, kh: 22.0, f: 0.6 },
    kartoffeln: { name: "Kartoffeln", kcal: 77, p: 2.0, kh: 17.0, f: 0.1 },
    eier: { name: "Eier (1 Ei ≈ 60g)", kcal: 130, p: 10.8, kh: 1.0, f: 9.2 },
    karotte: { name: "Karotte (gedünstet)", kcal: 35, p: 0.8, kh: 8.0, f: 0.2 },
    rote_beete: { name: "Rote Beete (gekocht)", kcal: 43, p: 1.6, kh: 10.0, f: 0.2 },
    zwiebel_knobi: { name: "Zwiebel & Knoblauch", kcal: 45, p: 1.5, kh: 10.0, f: 0.1 },
    gewuerze_m2: { name: "Salz, Pfeffer, Chili, Kräuter", kcal: 0, p: 0, kh: 0, f: 0 },
    makrele: { name: "🐟 Geräucherte Makrele", kcal: 248, p: 20.8, kh: 0, f: 18.4 },
    hering: { name: "🐟 TK Heringsfilet", kcal: 203, p: 17.5, kh: 0, f: 15.0 },
    buchweizenbrot: { name: "🍞 Buchweizensprossenbrot", kcal: 180, p: 6.0, kh: 36.0, f: 1.2 }
};

const MEAL1_DEFAULT = [
    { foodId: "buchweizensprossen", grams: 250 },
    { foodId: "hanfsamen", grams: 90 },
    { foodId: "kuerbiskerne", grams: 45 },
    { foodId: "banane", grams: 120 },
    { foodId: "kakaopulver", grams: 10 },
    { foodId: "datteln", grams: 50 },
    { foodId: "apfel", grams: 500 },
    { foodId: "gewuerze_m1", grams: 10 }
];

const MEAL2_DEFAULT = [
    { foodId: "linsensprossen", grams: 250 },
    { foodId: "kartoffeln", grams: 500 },
    { foodId: "eier", grams: 180 },
    { foodId: "karotte", grams: 300 },
    { foodId: "rote_beete", grams: 150 },
    { foodId: "zwiebel_knobi", grams: 100 },
    { foodId: "gewuerze_m2", grams: 10 }
];

const DEFAULT_TEMPLATES = {
    "Antagonistentraining OK": [
        { type: "Start", name: "Hammercurl-Klimmzug + Zughilfe", weight: "BW", sets: "3x10 + 10s unten", rest: "45s" },
        { type: "<>", name: "KH-Flachbankdrücken", weight: "50kg", sets: "3x10 + 10s unten", rest: "45s" },
        { type: "Start", name: "KH-Rudern vorgebeugt + Zughilfe", weight: "25kg", sets: "3x10 einseitig", rest: "45s" },
        { type: "<>", name: "KH-Schrägbankdrücken", weight: "50kg", sets: "3x10 + 10s oben", rest: "45s" },
        { type: "Start", name: "Klimmzug eng Untergriff", weight: "BW", sets: "3x10", rest: "0s" },
        { type: "+", name: "SZ-Triceps-Skullcrusher", weight: "33kg", sets: "3x10 Supersatz", rest: "60s" },
        { type: "Start", name: "Enges Bankdrücken", weight: "33kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "Konzentrations-Curls", weight: "10kg", sets: "3x10 im Sitzen", rest: "60s" },
        { type: "Start", name: "KH-Seitenheben aufrecht sitz.", weight: "10kg", sets: "3x12 Y-Form", rest: "0s" },
        { type: "+", name: "Bauch Crunch", weight: "BW", sets: "3x20 Beine 90° + 20s halten", rest: "45s" }
    ],
    "Pullday 1": [
        { type: "Start", name: "Kreuzheben (rechts p)", weight: "90kg", sets: "3x10 (Zughilfen)", rest: "90s" },
        { type: "Start", name: "Klimmzug weit p", weight: "BW", sets: "3x10 + 10s halten oben", rest: "60s" },
        { type: "Start", name: "LH-Rudern vorgebeugt weit", weight: "60kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "SZ-Rudern vorgebeugt weit", weight: "33kg", sets: "3x10 + 10s halten", rest: "60s" },
        { type: "Start", name: "SZ-Curls stehend", weight: "33kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "KH-Hammercurls", weight: "12kg", sets: "3x10", rest: "60s" },
        { type: "Start", name: "Klimmzug eng s", weight: "BW", sets: "3x10 + 10s Hängdehnung", rest: "0s" },
        { type: "+", name: "SZ-Nackenheben weit", weight: "73kg", sets: "3x10 + 10s halten oben", rest: "0s" },
        { type: "++", name: "KH-Seitenheben vorgebeugt", weight: "20kg", sets: "3x12", rest: "60s" },
        { type: "Start", name: "Unterarm-Curls p + s / Twists / Turns", weight: "26/20kg", sets: "3x10 + 10s halten", rest: "45s" }
    ],
    "Pushday 1": [
        { type: "Start", name: "LH-Bankdrücken", weight: "80kg", sets: "1x10 (50kg) + 3x9 + Drop", rest: "90s" },
        { type: "Start", name: "KH-Schrägbankdrücken", weight: "54kg", sets: "3x10 + 10s Dehnung unten", rest: "60s" },
        { type: "Start", name: "Überzüge", weight: "17kg", sets: "3x12", rest: "60s" },
        { type: "Start", name: "Bank-Dips", weight: "60kg", sets: "3x15 + Dropsatz 40/20/0", rest: "60s" },
        { type: "Start", name: "SZ-Triceps-Skullcrusher", weight: "33kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "Enges Bankdrücken", weight: "33kg", sets: "3x10", rest: "0s" },
        { type: "++", name: "KH-Trizepsdrücken ü. Kopf", weight: "17kg", sets: "3x12", rest: "60s" },
        { type: "Start", name: "SZ-Bank-Schulterdrücken", weight: "43kg", sets: "3x10 + 10s halten oben", rest: "60s" },
        { type: "Start", name: "KH-Seitenheben", weight: "20kg/10kg", sets: "3x10 + 3x12", rest: "45s" }
    ],
    "Legday 1": [
        { type: "Start", name: "KH-Ausfallschritt li/re", weight: "40kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "Hip Thrust", weight: "33kg", sets: "3x20 + 10s halten oben", rest: "60s" },
        { type: "Start", name: "Kniebeugen", weight: "50kg", sets: "3x25", rest: "90s" },
        { type: "Start", name: "Legex", weight: "60kg", sets: "3x10 + 10s halten + 5", rest: "0s" },
        { type: "+", name: "Wade", weight: "BW", sets: "2x20 + 10s halten", rest: "60s" },
        { type: "Start", name: "Bauch Crunch + Supine Bench Hold", weight: "10kg", sets: "3x20 + 3x80 Sek.", rest: "0s" },
        { type: "+", name: "Bank Twist li/re + Seitl. Bauch", weight: "10/20kg", sets: "3x10 + 3x10", rest: "45s" }
    ],
    "Pullday 2": [
        { type: "Start", name: "Kreuzheben (links p)", weight: "90kg", sets: "3x10 (Zughilfen)", rest: "90s" },
        { type: "Start", name: "Klimmzug Hammergriff", weight: "BW", sets: "3x10 + 10s halten oben", rest: "60s" },
        { type: "Start", name: "KH-Rudern vorgebeugt eng", weight: "50kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "SZ-Rudern vorgebeugt eng", weight: "33kg", sets: "3x10", rest: "60s" },
        { type: "Start", name: "SZ-Curls stehend", weight: "33kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "KH-Curls li/re", weight: "12kg", sets: "3x10", rest: "60s" },
        { type: "Start", name: "Klimmzug eng s", weight: "BW", sets: "3x10 + 10s Hängdehnung", rest: "0s" },
        { type: "+", name: "SZ-Nackenheben weit", weight: "73kg", sets: "3x10 + 10s halten oben", rest: "0s" },
        { type: "++", name: "KH-Seitenh. vorgeb.", weight: "10kg", sets: "3x12", rest: "60s" },
        { type: "Start", name: "Unterarm-Curls p + s / Twists / Turns", weight: "24/20kg", sets: "3x10 + 10s halten", rest: "45s" }
    ],
    "Pushday 2": [
        { type: "Start", name: "LH-Bankdrücken", weight: "80kg", sets: "1x10 (50kg) + 3x9 + Drop", rest: "90s" },
        { type: "Start", name: "KH-Schrägbankdrücken", weight: "54kg", sets: "3x10 + 10s Dehnung unten", rest: "60s" },
        { type: "Start", name: "Überzüge", weight: "17kg", sets: "3x12", rest: "60s" },
        { type: "Start", name: "Bank-Dips", weight: "60kg", sets: "3x15 + Dropsatz 40/20/0", rest: "60s" },
        { type: "Start", name: "SZ-Triceps-Skullcrusher", weight: "33kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "Enges Bankdrücken", weight: "33kg", sets: "3x10", rest: "0s" },
        { type: "++", name: "KH-Trizepsdrücken ü. Kopf", weight: "15kg", sets: "3x12", rest: "60s" },
        { type: "Start", name: "Aufr. SZ-Rudern weit", weight: "33kg", sets: "3x10 + 10s halten", rest: "60s" },
        { type: "Start", name: "KH-Seitenheben", weight: "20kg/10kg", sets: "3x10 + 3x12", rest: "45s" }
    ],
    "Legday 2": [
        { type: "Start", name: "Rum. Kreuzheben", weight: "60kg", sets: "3x10", rest: "0s" },
        { type: "+", name: "Hip Thrust", weight: "33kg", sets: "3x20 + 10s halten", rest: "60s" },
        { type: "Start", name: "Kniebeuge", weight: "50kg", sets: "3x25", rest: "90s" },
        { type: "Start", name: "Legex", weight: "60kg", sets: "3x10 + 10s halten + 5", rest: "0s" },
        { type: "+", name: "Wade", weight: "BW", sets: "3x20 + 10s halten + 1x cränken", rest: "60s" },
        { type: "Start", name: "Bauch Crunch + Supine Bench Hold", weight: "10kg", sets: "3x20 + 3x80 Sek.", rest: "0s" },
        { type: "+", name: "Bank Twist li/re + Seitl. Bauch", weight: "10/20kg", sets: "3x10 + 3x10", rest: "45s" }
    ]
};
