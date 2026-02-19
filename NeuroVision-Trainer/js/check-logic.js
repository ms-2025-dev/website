// ============================================================
// 視力検査ロジック
// ============================================================

// --- 定数 ---
const CARD_WIDTH_MM      = 85.6;   // クレジットカードの標準横幅(mm)
const CARD_ASPECT        = 0.63;   // カードの縦横比
const DEFAULT_DISTANCE   = 500;    // デフォルト測定距離(mm)
const DEFAULT_VISION     = 0.1;    // 開始視力
const GAP_SCALE_FACTOR   = 1.4544; // ランドルト環サイズ計算係数
const RING_SIZE_MULT     = 5;      // 環全体サイズ = 切れ目 × 5
const GAP_WIDTH_MULT     = 1.2;    // 切れ目の幅マージン倍率
const TICK_FREQ_CORRECT  = 660;    // 正解音の周波数(Hz)
const HISTORY_MAX        = 10;     // 保存する履歴の最大件数
const VISION_LIST = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.5, 2.0];
const DIRECTIONS  = ['top', 'right', 'bottom', 'left'];

// --- DOM 参照 ---
const calibSlider    = document.getElementById('calib-slider');
const calibBox       = document.getElementById('calib-box');
const setupSection   = document.getElementById('setup-section');
const testSection    = document.getElementById('test-section');
const resultSection  = document.getElementById('result-section');
const setupBtn       = document.getElementById('setup-complete-btn');
const ring           = document.getElementById('ring');
const gap            = document.getElementById('gap');

// --- 状態変数 ---
let pxPerMm          = 0;
let distanceMm       = DEFAULT_DISTANCE;
let currentDirection = '';
let listIndex        = 0;
let correctCount     = 0;

// ----------------------------------------
// キャリブレーション
// ----------------------------------------
calibSlider.oninput = () => {
    calibBox.style.width  = calibSlider.value + 'px';
    calibBox.style.height = (calibSlider.value * CARD_ASPECT) + 'px';
};

// ----------------------------------------
// セットアップ完了 → 検査開始
// ----------------------------------------
setupBtn.onclick = () => {
    pxPerMm    = calibSlider.value / CARD_WIDTH_MM;
    distanceMm = parseInt(document.getElementById('distance-select').value);

    setupSection.style.display = 'none';
    testSection.style.display  = 'block';
    nextQuestion();
};

// ----------------------------------------
// 次の問題を表示
// ----------------------------------------
function nextQuestion() {
    if (listIndex >= VISION_LIST.length) {
        showResult();
        return;
    }

    const vision = VISION_LIST[listIndex];
    document.getElementById('status').innerText = `視力 ${vision} の検査中`;

    // ランドルト環のサイズ計算（視力1.0=5m先で切れ目1.5mm）
    const gapMm      = (GAP_SCALE_FACTOR * distanceMm) / (vision * 1000);
    const ringSizeMm = gapMm * RING_SIZE_MULT;
    const borderMm   = gapMm;

    const pxSize   = ringSizeMm * pxPerMm;
    const pxBorder = borderMm   * pxPerMm;

    ring.style.width       = `${pxSize}px`;
    ring.style.height      = `${pxSize}px`;
    ring.style.borderWidth = `${pxBorder}px`;

    // 切れ目の方向をランダムに決定
    currentDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

    // 切れ目の位置とサイズ
    const isVertical = currentDirection === 'top' || currentDirection === 'bottom';
    gap.style.width     = isVertical ? `${pxBorder * GAP_WIDTH_MULT}px` : `${pxBorder}px`;
    gap.style.height    = isVertical ? `${pxBorder}px` : `${pxBorder * GAP_WIDTH_MULT}px`;
    gap.style.top       = '50%';
    gap.style.left      = '50%';
    gap.style.transform = 'translate(-50%, -50%)';

    if (currentDirection === 'top')    gap.style.top  = '0';
    if (currentDirection === 'bottom') gap.style.top  = '100%';
    if (currentDirection === 'left')   gap.style.left = '0';
    if (currentDirection === 'right')  gap.style.left = '100%';

    core.playTick(TICK_FREQ_CORRECT);
}

// ----------------------------------------
// 方向ボタンの判定
// ----------------------------------------
document.querySelectorAll('.dir-btn').forEach(btn => {
    btn.onclick = () => {
        if (btn.getAttribute('data-dir') === currentDirection) {
            correctCount++;
            listIndex++;
            nextQuestion();
        } else {
            showResult();
        }
    };
});

// ----------------------------------------
// 結果表示・履歴
// ----------------------------------------
function showResult() {
    testSection.style.display   = 'none';
    resultSection.style.display = 'block';

    const resultVision = listIndex > 0 ? VISION_LIST[listIndex - 1] : 0.05;
    document.getElementById('final-result').innerText = resultVision;
    document.getElementById('status').innerText       = '検査完了';

    saveResult(resultVision);
    displayHistory();
}

function saveResult(vision) {
    const history  = JSON.parse(localStorage.getItem('vision-history') || '[]');
    const newRecord = {
        date:   new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        vision: vision
    };
    history.unshift(newRecord);
    localStorage.setItem('vision-history', JSON.stringify(history.slice(0, HISTORY_MAX)));
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem('vision-history') || '[]');
    const listEl  = document.getElementById('history-list');
    listEl.innerHTML = history.map(item => `
        <li style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dotted #eee;">
            <span>${item.date}</span>
            <span style="font-weight:bold; color:var(--accent-color);">視力: ${item.vision}</span>
        </li>
    `).join('') || '<li style="color:#999;">記録がありません</li>';
}

document.getElementById('clear-history').onclick = () => {
    if (confirm('すべての検査履歴を削除しますか？')) {
        localStorage.removeItem('vision-history');
        displayHistory();
    }
};
