// ============================================================
// アプリ全体の定数
// ============================================================
const STORAGE_KEY_THEME  = 'vision-app-theme';
const STORAGE_KEY_SEPIA  = 'vision-sepia';
const STORAGE_KEY_SOUND  = 'vision-sound-enabled';
const STORAGE_KEY_NOTIF  = 'vision-notif-enabled';
const NOTIF_INTERVAL_MS  = 20 * 60 * 1000; // 20分
const HISTORY_MAX_ITEMS  = 10;             // 履歴保存件数上限
const TICK_FREQ_DEFAULT  = 880;            // 正解音の周波数(Hz)
const TICK_DURATION_SEC  = 0.1;           // ビープ音の長さ(秒)

class GameCore {
    constructor() {
        this.score = 0;
        this.scoreElement = document.getElementById('score-display');
        this.notifId = null;
        this.isSoundEnabled = localStorage.getItem(STORAGE_KEY_SOUND) === 'true';
        this.init();
    }

    init() {
        this.initSettings();
        this.initNotification();
    }

    // ----------------------------------------
    // 設定（テーマ・セピア・サウンド）
    // ----------------------------------------
    initSettings() {
        // テーマ切り替え
        const themeSelect = document.getElementById('theme-select');
        const savedTheme  = localStorage.getItem(STORAGE_KEY_THEME);
        if (savedTheme === 'medical') document.body.classList.add('medical-theme');
        if (themeSelect) {
            themeSelect.value = savedTheme || 'default';
            themeSelect.onchange = (e) => {
                document.body.classList.toggle('medical-theme', e.target.value === 'medical');
                localStorage.setItem(STORAGE_KEY_THEME, e.target.value);
            };
        }

        // ブルーライト削減（セピア）
        const sepiaToggle = document.getElementById('sepia-toggle');
        const isSepia     = localStorage.getItem(STORAGE_KEY_SEPIA) === 'true';
        if (isSepia) document.body.classList.add('sepia-mode');
        if (sepiaToggle) {
            sepiaToggle.checked = isSepia;
            sepiaToggle.onchange = (e) => {
                document.body.classList.toggle('sepia-mode', e.target.checked);
                localStorage.setItem(STORAGE_KEY_SEPIA, e.target.checked);
            };
        }

        // 音声設定
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.checked = this.isSoundEnabled;
            soundToggle.onchange = (e) => {
                this.isSoundEnabled = e.target.checked;
                localStorage.setItem(STORAGE_KEY_SOUND, e.target.checked);
            };
        }
    }

    // ----------------------------------------
    // ビープ音の生成（ライブラリ不要）
    // ----------------------------------------
    playTick(freq = TICK_FREQ_DEFAULT) {
        if (!this.isSoundEnabled) return;
        try {
            const ctx  = new (window.AudioContext || window.webkitAudioContext)();
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + TICK_DURATION_SEC);
            osc.start();
            osc.stop(ctx.currentTime + TICK_DURATION_SEC);
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    // ----------------------------------------
    // 20-20-20 通知
    // ----------------------------------------
    initNotification() {
        const notifToggle   = document.getElementById('notif-toggle');
        const isNotifEnabled = localStorage.getItem(STORAGE_KEY_NOTIF) === 'true';

        if (!notifToggle) return;

        notifToggle.checked = isNotifEnabled;
        if (isNotifEnabled) this.startNotifTimer();

        notifToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    localStorage.setItem(STORAGE_KEY_NOTIF, 'true');
                    this.startNotifTimer();
                } else {
                    alert('通知を許可してください');
                    e.target.checked = false;
                }
            } else {
                localStorage.setItem(STORAGE_KEY_NOTIF, 'false');
                this.stopNotifTimer();
            }
        });
    }

    startNotifTimer() {
        this.notifId = setInterval(() => {
            new Notification('目を休める時間です', {
                body: '20分が経過しました。20フィート(約6m)先を20秒間眺めてください。',
                tag: 'vision-break'
            });
        }, NOTIF_INTERVAL_MS);
    }

    stopNotifTimer() {
        if (this.notifId) clearInterval(this.notifId);
    }

    // ----------------------------------------
    // スコア管理
    // ----------------------------------------
    addScore(points = 1) {
        this.score += points;
        if (this.scoreElement) {
            this.scoreElement.innerText = `スコア: ${this.score}`;
        }
    }

    // ----------------------------------------
    // 履歴の保存・表示（共通）
    // ----------------------------------------
    saveHistory(gameKey, resultText) {
        const storageKey = `history-${gameKey}`;
        const history    = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const nameInput  = document.getElementById('user-name');
        const record = {
            date:   new Date().toLocaleString('ja-JP'),
            name:   (nameInput && nameInput.value) ? nameInput.value : 'なし',
            result: resultText
        };
        history.unshift(record);
        localStorage.setItem(storageKey, JSON.stringify(history.slice(0, HISTORY_MAX_ITEMS)));
        this.displayHistory(gameKey);
    }

    displayHistory(gameKey) {
        const listEl  = document.getElementById('history-list');
        if (!listEl) return;
        const history = JSON.parse(localStorage.getItem(`history-${gameKey}`) || '[]');
        listEl.innerHTML = history.map(item => `
            <li class="history-item">
                <span class="history-date">${item.date} (${item.name})</span>
                <span class="history-score">${item.result}</span>
            </li>
        `).join('') || '<li>記録がありません</li>';
    }
}

const core = new GameCore();
