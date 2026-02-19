// ============================================================
// 動体追従トレーニング ロジック
// ============================================================

// --- 定数 ---
const BALL_SIZE_PX      = 30;   // ボールの直径(px)
const INITIAL_SPEED_X   = 2;    // X方向の初期速度(px/frame)
const INITIAL_SPEED_Y   = 3;    // Y方向の初期速度(px/frame)
const INITIAL_POS_X     = 185;  // ボールの初期X座標(px)
const INITIAL_POS_Y     = 185;  // ボールの初期Y座標(px)

// --- DOM 参照 ---
const canvas   = document.getElementById('game-canvas');
const ball     = document.getElementById('target-ball');
const startBtn = document.getElementById('start-btn');

// --- 状態変数 ---
let posX      = INITIAL_POS_X;
let posY      = INITIAL_POS_Y;
let speedX    = INITIAL_SPEED_X;
let speedY    = INITIAL_SPEED_Y;
let isRunning = false;
let startTime = null;

// ----------------------------------------
// ボールを移動させるメインループ
// ----------------------------------------
function moveBall() {
    if (!isRunning) return;

    posX += speedX;
    posY += speedY;

    // 壁バウンド
    if (posX <= 0 || posX >= canvas.clientWidth - BALL_SIZE_PX)  speedX *= -1;
    if (posY <= 0 || posY >= canvas.clientHeight - BALL_SIZE_PX) speedY *= -1;

    ball.style.left = `${posX}px`;
    ball.style.top  = `${posY}px`;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('score-display').innerText = `経過時間: ${elapsed}秒`;

    requestAnimationFrame(moveBall);
}

// ----------------------------------------
// トレーニング停止・履歴保存
// ----------------------------------------
function stopTraining() {
    isRunning = false;
    ball.style.display = 'none';
    startBtn.innerText = 'スタート';

    if (startTime !== null) {
        const elapsed    = Math.floor((Date.now() - startTime) / 1000);
        const resultText = `時間: ${elapsed}秒`;
        core.saveHistory('follow', resultText);
        startTime = null;
    }
}

// ----------------------------------------
// イベント登録
// ----------------------------------------
startBtn.onclick = () => {
    if (!isRunning) {
        // リセットして開始
        posX   = INITIAL_POS_X;
        posY   = INITIAL_POS_Y;
        speedX = INITIAL_SPEED_X;
        speedY = INITIAL_SPEED_Y;

        isRunning          = true;
        startTime          = Date.now();
        ball.style.display = 'block';
        startBtn.innerText = 'ストップ';
        moveBall();
    } else {
        stopTraining();
    }
};
