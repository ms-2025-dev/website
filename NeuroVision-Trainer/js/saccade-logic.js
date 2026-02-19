// ============================================================
// サッケード運動トレーニング ロジック
// ============================================================

// --- 定数 ---
const DOT_MARGIN_PX      = 50;   // ドット配置の画面端マージン(px)
const DEFAULT_SPEED_SEC  = 0.8;  // デフォルト速度(秒)

// --- DOM 参照 ---
const dot          = document.getElementById('saccade-dot');
const canvas       = document.getElementById('game-canvas');
const startBtn     = document.getElementById('start-btn');
const speedSlider  = document.getElementById('speed-slider');
const speedValue   = document.getElementById('speed-value');

// --- 状態変数 ---
let isRunning      = false;
let saccadeTimer   = null;
let count          = 0;

// ----------------------------------------
// ドットをランダムな位置に移動
// ----------------------------------------
function moveDot() {
    const x = Math.random() * (canvas.clientWidth  - DOT_MARGIN_PX * 2) + DOT_MARGIN_PX;
    const y = Math.random() * (canvas.clientHeight - DOT_MARGIN_PX * 2) + DOT_MARGIN_PX;

    dot.style.left    = `${x}px`;
    dot.style.top     = `${y}px`;
    dot.style.display = 'block';

    count++;
    document.getElementById('score-display').innerText = `カウント: ${count}`;
}

// ----------------------------------------
// トレーニング開始
// ----------------------------------------
function startTraining() {
    isRunning      = true;
    count          = 0;
    startBtn.innerText = 'ストップ';

    const interval = parseFloat(speedSlider.value) * 1000;
    moveDot();
    saccadeTimer = setInterval(moveDot, interval);
}

// ----------------------------------------
// トレーニング停止・履歴保存
// ----------------------------------------
function stopTraining() {
    isRunning = false;
    clearInterval(saccadeTimer);
    dot.style.display  = 'none';
    startBtn.innerText = 'トレーニング開始';

    const resultText = `カウント: ${count}回`;
    core.saveHistory('saccade', resultText);
}

// ----------------------------------------
// イベント登録
// ----------------------------------------
speedSlider.oninput = () => {
    speedValue.innerText = `${speedSlider.value}s`;
    if (isRunning) {
        stopTraining();
        startTraining();
    }
};

startBtn.onclick = () => {
    if (!isRunning) startTraining();
    else            stopTraining();
};
