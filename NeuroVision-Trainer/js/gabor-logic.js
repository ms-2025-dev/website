// ============================================================
// ガボール・パッチ トレーニング ロジック
// ============================================================

// --- 定数 ---
const NUM_TARGETS          = 3;     // 1セットのターゲット数
const PATCH_AREA_FACTOR    = 1.5;   // パッチ密度の調整係数
const PATCH_COUNT_MIN      = 10;    // ランダム配置時の最少パッチ数
const PATCH_COUNT_MAX      = 50;    // ランダム配置時の最多パッチ数
const ROTATION_STEP_DEG    = 22.5;  // 角度の刻み幅(度)
const ROTATION_STEPS       = 8;     // 角度の選択肢数 (0〜157.5度)
const HINT_HIGHLIGHT_MS    = 1000;  // ヒント表示時間(ms)
const NEXT_LEVEL_DELAY_MS  = 500;   // 次レベルへの遅延(ms)
const SCORE_PER_CLEAR      = 10;    // 1クリアのスコア

// 角度の選択肢（0〜157.5度、22.5度刻み）
const ALL_ROTATIONS = Array.from(
    { length: ROTATION_STEPS },
    (_, i) => i * ROTATION_STEP_DEG
);

// --- DOM 参照 ---
const canvas            = document.getElementById('game-canvas');
const sizeSlider        = document.getElementById('size-slider');
const sizeValue         = document.getElementById('size-value');
const layoutSelect      = document.getElementById('layout-select');
const hintBtn           = document.getElementById('hint-btn');
const targetSample      = document.getElementById('target-sample');
const remainingDisplay  = document.getElementById('remaining-count');

// --- 状態変数 ---
let currentContrast        = 0.5;
let currentTargetRotation  = 0;
let remainingTargets       = 0;

// ----------------------------------------
// パッチを配置する
// ----------------------------------------
function spawnPatches() {
    if (!canvas) return;
    canvas.innerHTML = '';

    const size = parseInt(sizeSlider.value);

    // 正解角度を決定
    currentTargetRotation = Math.floor(Math.random() * ROTATION_STEPS) * ROTATION_STEP_DEG;
    updateSampleDisplay(size);

    // 配置数を計算
    const layout      = layoutSelect.value;
    const areaCount   = Math.floor((canvas.clientWidth * canvas.clientHeight) / (size * size * PATCH_AREA_FACTOR));
    const cols        = Math.floor(canvas.clientWidth / size);
    const rows        = Math.floor(canvas.clientHeight / size);
    const totalPatches = layout === 'grid'
        ? cols * rows
        : Math.max(PATCH_COUNT_MIN, Math.min(areaCount, PATCH_COUNT_MAX));

    // ターゲット数を設定
    remainingTargets = NUM_TARGETS;
    updateRemainingDisplay();

    // 配置データ作成 & シャッフル
    const patchDataList = Array.from({ length: totalPatches }, (_, i) => ({ isTarget: i < NUM_TARGETS }));
    patchDataList.sort(() => Math.random() - 0.5);

    // 描画
    if (layout === 'grid') {
        const cellW = canvas.clientWidth  / cols;
        const cellH = canvas.clientHeight / Math.ceil(totalPatches / cols);
        patchDataList.forEach((data, i) => {
            const x = (i % cols) * cellW + (cellW - size) / 2;
            const y = Math.floor(i / cols) * cellH + (cellH - size) / 2;
            createPatch(data.isTarget, x, y, size);
        });
    } else {
        patchDataList.forEach(data => {
            const x = Math.random() * (canvas.clientWidth  - size);
            const y = Math.random() * (canvas.clientHeight - size);
            createPatch(data.isTarget, x, y, size);
        });
    }
}

function updateRemainingDisplay() {
    if (remainingDisplay) {
        remainingDisplay.innerText = `残り: ${remainingTargets}個`;
    }
}

function updateSampleDisplay(size) {
    if (!targetSample) return;
    targetSample.style.width     = `${size}px`;
    targetSample.style.height    = `${size}px`;
    targetSample.style.transform = `rotate(${currentTargetRotation}deg)`;
}

// ----------------------------------------
// 個々のパッチを生成
// ----------------------------------------
function createPatch(isTarget, x, y, size) {
    const patch = document.createElement('div');
    patch.className = 'gabor-patch';
    if (isTarget) patch.classList.add('target-patch');

    patch.style.width   = `${size}px`;
    patch.style.height  = `${size}px`;
    patch.style.left    = `${x}px`;
    patch.style.top     = `${y}px`;
    patch.style.opacity = currentContrast;

    // 角度設定：ターゲットは正解角度、それ以外は別の角度
    const rotation = isTarget
        ? currentTargetRotation
        : ALL_ROTATIONS.filter(a => a !== currentTargetRotation)[
            Math.floor(Math.random() * (ROTATION_STEPS - 1))
          ];

    patch.style.transform = `rotate(${rotation}deg)`;

    patch.onclick = (e) => {
        e.stopPropagation();
        if (isTarget && !patch.classList.contains('found')) {
            patch.classList.add('found');
            patch.style.boxShadow = '0 0 10px 2px #2ecc71';
            patch.style.opacity   = '0.3';
            remainingTargets--;
            updateRemainingDisplay();

            if (remainingTargets <= 0) {
                core.addScore(SCORE_PER_CLEAR);
                setTimeout(spawnPatches, NEXT_LEVEL_DELAY_MS);
            }
        } else if (!isTarget) {
            patch.style.opacity = '0.1';
        }
    };

    canvas.appendChild(patch);
}

// ----------------------------------------
// イベント登録
// ----------------------------------------
sizeSlider.oninput = () => {
    sizeValue.innerText = `${sizeSlider.value}px`;
    spawnPatches();
};

layoutSelect.onchange = () => spawnPatches();

hintBtn.onclick = () => {
    document.querySelectorAll('.target-patch:not(.found)').forEach(t => {
        t.style.boxShadow = '0 0 15px 5px #ff4757';
        setTimeout(() => {
            if (!t.classList.contains('found')) t.style.boxShadow = 'none';
        }, HINT_HIGHLIGHT_MS);
    });
};

// 初期表示
spawnPatches();
