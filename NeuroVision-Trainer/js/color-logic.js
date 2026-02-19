// ============================================================
// 色彩判別テスト ロジック
// ============================================================

// --- 定数 ---
const INITIAL_TIME_SEC   = 15;    // ゲーム開始時の残り時間(秒)
const TIMER_INTERVAL_MS  = 100;   // タイマー更新間隔(ms)
const TIME_BONUS_SEC     = 1.5;   // 正解時の時間ボーナス(秒)
const TIME_PENALTY_SEC   = 2.0;   // 誤答時の時間ペナルティ(秒)
const GRID_MAX_SIZE      = 7;     // グリッドの最大サイズ(n×n)
const HUE_SAT_RANGE      = 40;    // 彩度のランダム幅
const HUE_SAT_MIN        = 40;    // 彩度の最小値
const LIGHTNESS_RANGE    = 40;    // 明度のランダム幅
const LIGHTNESS_MIN      = 30;    // 明度の最小値
const DIFF_BASE          = 20;    // 正解タイルの色差の基準値
const DIFF_MIN           = 2;     // 色差の最小値
const COLOR_HISTORY_MAX  = 5;     // 保存する履歴の最大件数

// --- DOM 参照 ---
const canvas         = document.getElementById('game-canvas');
const startBtn       = document.getElementById('start-btn');
const timerDisplay   = document.getElementById('timer-display');
const scoreDisplay   = document.getElementById('score-display');
const historyListEl  = document.getElementById('color-history-list');

// --- 状態変数 ---
let level     = 1;
let timeLeft  = INITIAL_TIME_SEC;
let timerId   = null;
let isRunning = false;

// ----------------------------------------
// ゲーム初期化
// ----------------------------------------
function initGame() {
    level     = 1;
    timeLeft  = INITIAL_TIME_SEC;
    isRunning = true;
    startBtn.style.display = 'none';
    scoreDisplay.innerText = `レベル: ${level}`;
    nextLevel();
    startTimer();
}

function startTimer() {
    clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft -= TIMER_INTERVAL_MS / 1000;
        timerDisplay.innerText = `残り: ${timeLeft.toFixed(1)}秒`;
        if (timeLeft <= 0) endGame();
    }, TIMER_INTERVAL_MS);
}

// ----------------------------------------
// 次のレベルを生成
// ----------------------------------------
function nextLevel() {
    canvas.innerHTML = '';
    const size = Math.min(Math.floor(level / 3) + 2, GRID_MAX_SIZE);
    canvas.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    const h    = Math.floor(Math.random() * 360);
    const s    = Math.floor(Math.random() * HUE_SAT_RANGE) + HUE_SAT_MIN;
    const l    = Math.floor(Math.random() * LIGHTNESS_RANGE) + LIGHTNESS_MIN;
    const diff = Math.max(DIFF_MIN, DIFF_BASE - Math.floor(level / 2));
    const targetL   = l + (l > 50 ? -diff : diff);
    const targetIdx = Math.floor(Math.random() * (size * size));

    for (let i = 0; i < size * size; i++) {
        const tile = document.createElement('div');
        tile.className = 'color-tile';
        tile.style.backgroundColor = `hsl(${h}, ${s}%, ${i === targetIdx ? targetL : l}%)`;

        tile.onclick = () => {
            if (!isRunning) return;
            if (i === targetIdx) {
                level++;
                timeLeft += TIME_BONUS_SEC;
                scoreDisplay.innerText = `レベル: ${level}`;
                if (typeof core !== 'undefined') core.addScore(1);
                nextLevel();
            } else {
                timeLeft -= TIME_PENALTY_SEC;
            }
        };
        canvas.appendChild(tile);
    }
}

// ----------------------------------------
// ゲーム終了
// ----------------------------------------
function endGame() {
    isRunning = false;
    clearInterval(timerId);

    saveColorScore(level);

    let rankClass = '';
    if      (level > 30) rankClass = 'rank-god';
    else if (level > 20) rankClass = 'rank-pro';
    else if (level > 10) rankClass = 'rank-normal';
    else                 rankClass = 'rank-beginner';

    canvas.innerHTML = `
        <div class="result-card">
            <div class="result-title">― テスト完了 ―</div>
            <div class="score-detail">到達レベル: ${level}</div>
            <div class="rank-display ${rankClass}">${getRank(level)}</div>
            <div style="margin-top:15px; padding:10px; border-top:1px solid #eee;">
                <p style="font-size:0.85rem; color:#666; line-height:1.4;">
                    色彩識別は、網膜にある「錐体（すいたい）細胞」の働きです。
                    疲れていると感度が落ちるため、定期的なチェックをおすすめします。
                </p>
            </div>
        </div>
    `;

    startBtn.innerText     = 'もう一度挑戦';
    startBtn.style.display = 'block';
}

function getRank(lv) {
    if (lv > 30) return '神レベル（超人的な色彩感覚）';
    if (lv > 20) return 'プロ級（デザイナー・芸術家並み）';
    if (lv > 10) return '一般レベル（良好な視覚）';
    return '修行不足（もっと目を鍛えましょう）';
}

// ----------------------------------------
// スコア保存・履歴表示
// ----------------------------------------
function saveColorScore(lv) {
    const history  = JSON.parse(localStorage.getItem('color-vision-history') || '[]');
    const newRecord = {
        date:  new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        level: lv,
        rank:  getRank(lv)
    };
    history.unshift(newRecord);
    localStorage.setItem('color-vision-history', JSON.stringify(history.slice(0, COLOR_HISTORY_MAX)));
    displayColorHistory();
}

function displayColorHistory() {
    const history = JSON.parse(localStorage.getItem('color-vision-history') || '[]');
    if (historyListEl) {
        historyListEl.innerHTML = history.map(item => `
            <li style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dotted #eee;">
                <span>${item.date}</span>
                <span style="font-weight:bold; color:var(--accent-color);">Lv.${item.level} (${item.rank.split('（')[0]})</span>
            </li>
        `).join('') || '<li style="color:#999; text-align:center; padding:10px;">記録がありません</li>';
    }
}

// ----------------------------------------
// イベント登録
// ----------------------------------------
const clearBtn = document.getElementById('clear-color-history');
if (clearBtn) {
    clearBtn.onclick = () => {
        if (confirm('色彩判別の履歴を削除しますか？')) {
            localStorage.removeItem('color-vision-history');
            displayColorHistory();
        }
    };
}

startBtn.onclick = initGame;

window.addEventListener('DOMContentLoaded', displayColorHistory);
