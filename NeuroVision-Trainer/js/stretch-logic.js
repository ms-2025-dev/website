// ============================================================
// 遠近ストレッチ（ピント調整）トレーニング ロジック
// ============================================================

// --- 定数 ---
const PHASE_NEAR_DURATION_SEC = 10;  // 近くを見る時間(秒)
const PHASE_FAR_DURATION_SEC  = 10;  // 遠くを見る時間(秒)
const ROTATIONS_DEG           = [0, 90, 180, 270]; // ランドルト環の回転角度

const PHASES = [
    { text: "画面の「C」をじっと見てください",         duration: PHASE_NEAR_DURATION_SEC, mode: 'near' },
    { text: "3m以上「遠く」を見て目を休ませてください", duration: PHASE_FAR_DURATION_SEC,  mode: 'far'  }
];

// --- DOM 参照 ---
const target         = document.getElementById('focus-target');
const instruction    = document.getElementById('instruction-text');
const statusDisplay  = document.getElementById('status-display');
const startBtn       = document.getElementById('start-btn');
const sizeSlider     = document.getElementById('size-slider');
const sizeValue      = document.getElementById('size-value');

// --- 状態変数 ---
let isRunning      = false;
let timerId        = null;
let currentPhase   = 0;
let totalSeconds   = 0;   // トレーニングの累計秒数
let secondsTimer   = null;

// ----------------------------------------
// ターゲットのフォントサイズを更新
// ----------------------------------------
function updateTargetSize() {
    const size        = sizeSlider.value;
    target.style.fontSize = `${size}px`;
    sizeValue.innerText   = `${size}px`;
}

// ----------------------------------------
// フェーズの切り替え
// ----------------------------------------
function switchPhase() {
    if (!isRunning) return;

    const phase = PHASES[currentPhase];
    instruction.innerText   = phase.text;
    statusDisplay.innerText = `残り: ${phase.duration}秒`;

    if (phase.mode === 'near') {
        target.style.display = 'block';
        target.classList.remove('blur-target');
        updateTargetSize();

        // ランダムに向きを変える
        const randomRotate = ROTATIONS_DEG[Math.floor(Math.random() * ROTATIONS_DEG.length)];
        target.style.transform = `translate(-50%, -50%) rotate(${randomRotate}deg)`;
    } else {
        target.classList.add('blur-target');
    }

    let timeLeft = phase.duration;
    clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--;
        statusDisplay.innerText = `残り: ${timeLeft}秒`;
        if (timeLeft <= 0) {
            currentPhase = (currentPhase + 1) % PHASES.length;
            switchPhase();
        }
    }, 1000);
}

// ----------------------------------------
// トレーニング停止・履歴保存
// ----------------------------------------
function stopTraining() {
    isRunning = false;
    clearInterval(timerId);
    clearInterval(secondsTimer);
    startBtn.innerText     = 'トレーニング開始';
    target.style.display   = 'none';
    instruction.innerText  = 'お疲れ様でした！';
    statusDisplay.innerText = '準備中...';

    if (totalSeconds > 0) {
        const resultText = `実施時間: ${Math.floor(totalSeconds / 60)}分${totalSeconds % 60}秒`;
        core.saveHistory('stretch', resultText);
    }
    totalSeconds = 0;
}

// ----------------------------------------
// イベント登録
// ----------------------------------------
sizeSlider.oninput = () => updateTargetSize();

startBtn.onclick = () => {
    if (!isRunning) {
        isRunning    = true;
        totalSeconds = 0;
        currentPhase = 0;
        startBtn.innerText = 'ストップ';

        // 累計時間のカウント
        secondsTimer = setInterval(() => { totalSeconds++; }, 1000);

        switchPhase();
    } else {
        stopTraining();
    }
};

// 初期化
updateTargetSize();
