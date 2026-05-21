// =====================================================
// sound-engine.js — Звуковой движок (Web Audio API)
// Синтезирует звуки без файлов — прямо в браузере.
// Нужен для кликов, тиканья часов, фанфар и т.д.
// =====================================================

var SoundEngine = {
    
    // ---- ИНИЦИАЛИЗАЦИЯ ----
    // Браузеры требуют, чтобы AudioContext создавался после клика пользователя.
    // Поэтому метод init() вызывается при первом клике в любом месте игры.
    
    init: function() {
        if (state.audioInitialized) return;  // Уже инициализирован — выходим
        try {
            // Создаём AudioContext — это «пульт управления звуком» в браузере
            state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            state.audioInitialized = true;
        } catch (e) {
            // Если браузер не поддерживает Web Audio API — ничего страшного, игра работает без звуков
        }
    },
    
    // ---- ПРОВЕРКА: МОЖНО ЛИ СЕЙЧАС ИГРАТЬ ЗВУК? ----
    // Возвращает true, если: звук включён, AudioContext создан, громкость > 0
    
    get canPlay() {
        return state.soundEnabled && state.audioCtx && state.globalVolume > 0 && state.uiVolume > 0;
    },
    
    // ---- ОСНОВНОЙ МЕТОД: СИНТЕЗ ЗВУКА ----
    // f — частота в герцах (высота звука, например 1200 = высокий «пик»)
    // d — длительность в секундах (например 0.06 = 60 миллисекунд)
    // t — тип волны ('sine' — мягкий, 'square' — резкий, 'sawtooth' — жужжащий, 'triangle' — средний)
    // v — громкость от 0 до 1
    
    playTone: function(f, d, t, v) {
        if (!this.canPlay) return;  // Если звук выключен — молча выходим
        try {
            var n = state.audioCtx.currentTime;          // Текущее время аудиоконтекста
            var o = state.audioCtx.createOscillator();    // Осциллятор — создаёт волну звука
            var g = state.audioCtx.createGain();          // Усилитель — управляет громкостью
            
            o.type = t || 'sine';                         // Форма волны (по умолчанию синусоида = мягкий звук)
            o.frequency.setValueAtTime(f, n);             // Устанавливаем частоту (высоту звука)
            
            // Настраиваем громкость с учётом UI-громкости и общей громкости
            g.gain.setValueAtTime(v * state.uiVolume * state.globalVolume, n);
            // Плавно затухаем до нуля к концу звука (чтобы не было щелчка)
            g.gain.exponentialRampToValueAtTime(0.001, n + d);
            
            // Соединяем: осциллятор → усилитель → колонки
            o.connect(g);
            g.connect(state.audioCtx.destination);
            
            // Запускаем и останавливаем звук
            o.start(n);
            o.stop(n + d);
        } catch (e) {
            // Игнорируем ошибки (например, если AudioContext уже закрыт)
        }
    },
    
    // ---- ГОТОВЫЕ ЗВУКИ ----
    // Каждый метод — это вызов playTone с определёнными параметрами
    
    // Клик по кнопке/коробке
    click: function() {
        this.playTone(1200, 0.06, 'sine', CONFIG.VOLUMES.CLICK);
    },
    
    // Тихий клик
    softClick: function() {
        this.playTone(880, 0.05, 'sine', CONFIG.VOLUMES.SOFT_CLICK);
    },
    
    // Звук открытия коробки (два тона с задержкой — как «та-да́м»)
    open: function() {
        this.playTone(380, 0.1, 'sine', CONFIG.VOLUMES.OPEN);
        var self = this;
        setTimeout(function() {
            self.playTone(580, 0.25, 'triangle', CONFIG.VOLUMES.OPEN * 0.85);
        }, 100);
    },
    
    // Тиканье часов (низкий, спокойный)
    softTick: function() {
        this.playTone(180, 0.35, 'sine', CONFIG.VOLUMES.TICK);
    },
    
    // Срочное тиканье (последние секунды отсчёта — низкое, тревожное)
    urgentTick: function() {
        this.playTone(80, 0.35, 'sine', CONFIG.VOLUMES.URGENT);
        var self = this;
        setTimeout(function() {
            self.playTone(60, 0.3, 'sine', CONFIG.VOLUMES.URGENT * 0.8);
        }, 120);
    },
    
    // Звук блокировки коробки (жужжащий, неприятный)
    lock: function() {
        this.playTone(200, 0.5, 'sawtooth', CONFIG.VOLUMES.LOCK);
    },
    
    // Фанфары при получении номера (два приятных тона: до-ми)
    reward: function() {
        // 523.25 Гц = нота До, 659.25 Гц = нота Ми
        var self = this;
        [523.25, 659.25].forEach(function(freq, i) {
            setTimeout(function() {
                self.playTone(freq, 0.2 + i * 0.1, 'sine', 0.12);
            }, i * 100);
        });
    }
};