// ============================================================
// 動体視力トレーニング ロジック
// ============================================================

// --- 定数 ---
const GAME_DURATION_SEC   = 180;    // 1セットの制限時間(秒) = 3分
const SPAWN_DELAY_MS      = 800;    // 回答後の次の数字出現までの待機時間(ms)
const NUMBER_MIN          = 10;     // 表示する数字の最小値
const NUMBER_MAX          = 99;     // 表示する数字の最大値
const SPEED_UP_RATE       = 0.95;   // 正解時のスピードアップ率
const SLOW_DOWN_RATE      = 1.25;   // 誤答時のスローダウン率
const DURATION_MAX_MS     = 2500;   // 速度の下限(ms)（最も遅い）
const AGE_MIN             = 18;     // 推定年齢の下限
const AGE_MAX             = 85;     // 推定年齢の上限
const AGE_INIT_OFFSET     = 10;     // 開始時の推定年齢オフセット
const COMBO_BONUS_MAX     = 0.5;    // コンボボーナスの上限
const COMBO_BONUS_RATE    = 0.1;    // コンボ1回あたりのボーナス率
const TRACKING_RATE_BASE  = 0.2;    // 年齢追跡の基本レート
const PENALTY_BASE        = 5;      // 誤答時の年齢ペナルティ基本値
const PENALTY_MAX_ADD     = 15;     // 誤答時の追加ペナルティ最大値
const SCORE_PER_COMBO     = 10;     // 正解1回のスコア倍率
const TICK_FREQ_WRONG     = 220;    // 誤答音の周波数(Hz)

const SPEED_BASE = {
    slow:   2000,
    normal: 1200,
    fast:   750,
    pro:    450
};

// --- DOM 参照 ---
const canvas        = document.getElementById('game-canvas');
const startBtn      = document.getElementById('start-btn');
const submitBtn     = document.getElementById('submit-btn');
const answerInput   = document.getElementById('answer-input');
const speedSelect   = document.getElementById('speed-level');
const gameModeSelect = document.getElementById('game-mode');
const scoreDisplay  = document.getElementById('score-display');
const comboDisplay  = document.getElementById('combo-display');
const ageDisplay    = document.getElementById('age-result');
const statsDisplay  = document.getElementById('stats-display');

// --- 状態変数 ---
let currentNumber        = 0;
let isAnimating          = false;
let isWaitingAnswer      = false;
let isRunning            = false;   // ← 宣言を追加
let gameTimer            = null;
let timeLeft             = GAME_DURATION_SEC;
let totalTrials          = 0;
let correctTrials        = 0;
let currentDuration      = SPEED_BASE.normal;
let combo                = 0;
let currentEstimatedAge  = 60;

// ----------------------------------------
// タイマー表示の更新
// ----------------------------------------
function updateTimerDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    document.getElementById('timer-display').innerText =
        `残り時間: ${min}:${sec.toString().padStart(2, '0')}`;
}

// ----------------------------------------
// セット開始
// ----------------------------------------
function startSet() {
    timeLeft      = GAME_DURATION_SEC;
    totalTrials   = 0;
    correctTrials = 0;
    isRunning     = true;
    startBtn.disabled = true;

    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) endSet();
    }, 1000);

    spawnNumber();
}

// ----------------------------------------
// セット終了
// ----------------------------------------
function endSet() {
    clearInterval(gameTimer);
    isRunning         = false;
    startBtn.disabled = false;

    const resultAge  = Math.round(currentEstimatedAge);
    const resultText = `推定年齢: ${resultAge}歳`;
    core.saveHistory('dynamic', resultText);

    alert(`3分間のトレーニング終了！\nあなたの最終判定年齢は ${resultAge}歳 です。`);
}

// ----------------------------------------
// 速度(ms)→ターゲット年齢の変換
// ----------------------------------------
function getTargetAgeBySpeed(ms) {
    if (ms <= 400)  return 18;
    if (ms <= 550)  return 24;
    if (ms <= 750)  return 30;
    if (ms <= 950)  return 38;
    if (ms <= 1200) return 45;
    if (ms <= 1500) return 55;
    return 65;
}

// ----------------------------------------
// 数字を生成してアニメーション
// ----------------------------------------
function spawnNumber() {
    if (isAnimating || isWaitingAnswer) return;

    isAnimating     = true;
    isWaitingAnswer = true;
    answerInput.value = '';
    answerInput.focus();

    currentNumber = Math.floor(Math.random() * (NUMBER_MAX - NUMBER_MIN + 1)) + NUMBER_MIN;

    if (gameModeSelect.value === 'random') {
        currentDuration = currentDuration * (0.8 + Math.random() * 0.4);
    }

    const numEl = document.createElement('div');
    numEl.className  = 'moving-number';
    numEl.innerText  = currentNumber;
    numEl.style.top  = `${Math.random() * (canvas.clientHeight - 60)}px`;
    numEl.style.left = '-100px';
    canvas.appendChild(numEl);

    const animation = numEl.animate(
        [{ left: '-100px' }, { left: `${canvas.clientWidth}px` }],
        { duration: currentDuration, easing: 'linear' }
    );

    animation.onfinish = () => {
        numEl.remove();
        isAnimating = false;
        scoreDisplay.innerText = '数字を入力してください';
    };
}

// ----------------------------------------
// 年齢推定の更新
// ----------------------------------------
function updateEstimatedAge(isCorrect) {
    const targetAge = getTargetAgeBySpeed(currentDuration);

    if (isCorrect) {
        if (currentEstimatedAge > targetAge) {
            const comboBonus  = Math.min(combo * COMBO_BONUS_RATE, COMBO_BONUS_MAX);
            const trackingRate = TRACKING_RATE_BASE + comboBonus;
            currentEstimatedAge -= (currentEstimatedAge - targetAge) * trackingRate;
        } else {
            currentEstimatedAge -= 0.1;
        }
    } else {
        const accuracy = totalTrials === 0 ? 1 : correctTrials / totalTrials;
        const penalty  = PENALTY_BASE + (1 - accuracy) * PENALTY_MAX_ADD;
        currentEstimatedAge += penalty;
    }

    currentEstimatedAge = Math.max(AGE_MIN, Math.min(AGE_MAX, currentEstimatedAge));
    ageDisplay.innerText = `動体視力年齢: ${Math.round(currentEstimatedAge)}歳`;
    ageDisplay.style.color = isCorrect ? 'var(--accent-color)' : '#ff4757';
}

function updateStats() {
    const accuracy = totalTrials === 0 ? 0 : Math.round((correctTrials / totalTrials) * 100);
    statsDisplay.innerText =
        `正答率: ${accuracy}% | 試行: ${totalTrials}回 | 目安速度: ${Math.round(currentDuration)}ms`;
}

// ----------------------------------------
// 回答チェック
// ----------------------------------------
function checkAnswer() {
    if (!isWaitingAnswer) return;
    const userAnswer = parseInt(answerInput.value);
    if (isNaN(userAnswer)) return;

    isWaitingAnswer = false;
    totalTrials++;

    if (userAnswer === currentNumber) {
        correctTrials++;
        combo++;
        currentDuration *= SPEED_UP_RATE;
        if (typeof core !== 'undefined') {
            core.addScore(SCORE_PER_COMBO * combo);
            core.playTick();
        }
        comboDisplay.innerText = `${combo} 連続正解！`;
        updateEstimatedAge(true);
    } else {
        combo = 0;
        currentDuration = Math.min(currentDuration * SLOW_DOWN_RATE, DURATION_MAX_MS);
        if (typeof core !== 'undefined') core.playTick(TICK_FREQ_WRONG);
        comboDisplay.innerText = 'ミス！';
        updateEstimatedAge(false);
    }

    updateStats();
    setTimeout(spawnNumber, SPAWN_DELAY_MS);
}

// ----------------------------------------
// イベント登録
// ----------------------------------------
startBtn.onclick = () => {
    totalTrials          = 0;
    correctTrials        = 0;
    combo                = 0;
    currentDuration      = SPEED_BASE[speedSelect.value];
    currentEstimatedAge  = getTargetAgeBySpeed(currentDuration) + AGE_INIT_OFFSET;

    updateStats();
    ageDisplay.innerText   = '';
    comboDisplay.innerText = '';
    spawnNumber();
};

submitBtn.onclick = checkAnswer;
answerInput.onkeydown = (e) => { if (e.key === 'Enter') checkAnswer(); };
