// =====================================================
// state.js — «Мозг» игры
// Здесь хранятся ВСЕ переменные состояния:
//   - кто участвует
//   - какие номера выданы
//   - что лежит в каждой коробке
//   - настройки цветов, анимаций, звуков
//   - и многое другое
// =====================================================

var state = {
    
    // ---- УЧАСТНИКИ ----
    
    // Сколько всего участников (и коробок)
    totalNumbers: CONFIG.DEFAULT_TOTAL,
    
    // Массив участников. Каждый участник — это объект:
    // { name: "Имя", assignedNumber: 5, hasOpenedChest: false, blockedByAnnoying: false, openedChestNum: null }
    participants: [],
    
    // Какие номера уже выданы (чтобы не повторяться)
    usedNumbers: {},
    
    // Индекс выбранного участника (кто будет открывать коробку)
    selectedParticipantIndex: null,
    
    // ---- КОРОБКИ ----
    
    // Состояние каждой коробки: открыта или нет, кто открыл
    // Пример: { 1: { opened: true, ownerName: "Иван", ownerNumber: 5 }, 2: { opened: false, ... }, ... }
    chestsState: {},
    
    // Содержимое каждой коробки (текст, который показывается при открытии)
    chestContents: {},
    
    // Выравнивание текста в каждой коробке: 'left', 'center', 'right'
    chestAligns: {},
    
    // Тип каждой коробки: 'prize' (приз) или 'task' (задание)
    chestTypes: {},
    
    // Цвет каждой коробки: 'c1', 'c2', ..., 'c9'
    chestColors: {},
    
    // Включены ли искры для каждой коробки (true/false, максимум 2 одновременно)
    chestSparks: {},
    
    // Поворот каждой коробки по оси Y (влево-вправо)
    chestRotY: {},
    
    // Наклон каждой коробки по оси X (вверх-вниз)
    chestRotX: {},
    
    // URL аудиофайла для каждой коробки (воспроизводится при открытии)
    chestAudioUrls: {},
    
    // Свечение рамки для каждой коробки: '', 'glow-bass', 'glow-rainbow', 'glow-ice', 'glow-fire', 'glow-neon'
    chestGlows: {},
    
    // Заблокированные коробки (после режима «Задолбал»)
    // Пример: { 3: { isLocked: true, reason: 1 } }
    lockedChests: {},
    
    // ---- СОСТОЯНИЕ ИГРЫ ----
    
    // Идёт ли сейчас обратный отсчёт перед открытием
    isCountingDown: false,
    
    // Открыто ли сейчас какое-нибудь модальное окно
    isAnyModalOpen: false,
    
    // Включён ли звук
    soundEnabled: true,
    
    // Общая громкость (от 0 до 1)
    globalVolume: 0.5,
    
    // Громкость звуков интерфейса (клики, тики)
    uiVolume: 0.5,
    
    // Громкость аудиофайлов коробок
    chestAudioVolume: 0.7,
    
    // Идёт ли сейчас анимация (например, раздача номеров)
    isAnimating: false,
    
    // Блокировка «атомарных» действий (защита от двойных нажатий)
    atomicAction: false,
    
    // Есть ли несохранённые изменения в админ-панели
    hasUnsavedChanges: false,
    
    // Номер коробки, которая редактируется в админ-панели
    currentEditingChest: null,
    
    // ---- РЕЖИМ «ЗАДОЛБАЛ» ----
    
    // Включён ли режим
    annoyingChestEnabled: false,
    
    // Номер коробки, которая «задолбает» игрока
    annoyingChestNumber: null,
    
    // URL аудиофайла для этого режима (играет при открытии такой коробки)
    annoyingAudioUrl: "",
    
    // ---- ТАЙМЕРЫ И АУДИО ----
    
    // ID интервала обратного отсчёта (нужно для остановки)
    countdownInterval: null,
    
    // Контекст Web Audio API (для синтеза звуков)
    audioCtx: null,
    
    // Был ли инициализирован аудио-движок (браузеры требуют клик пользователя)
    audioInitialized: false,
    
    // Текущий проигрываемый аудиофайл коробки
    currentChestAudio: null,
    
    // Текущий проигрываемый аудиофайл режима «Задолбал»
    currentAnnoyingAudio: null,
    
    // Текущий проигрываемый аудиофайл Netflix-заставки
    currentNetflixAudio: null,
    
    // ---- IDLE-АНИМАЦИИ (анимации бездействия) ----
    
    // Таймер для отслеживания бездействия
    idleTimer: null,
    
    // Массив таймеров «мягких» анимаций (чтобы можно было их все остановить)
    idleTimeouts: [],
    
    // Таймер для анимации «гавканья» коробок
    idleBarkTimeout: null,
    
    // Когда было последнее взаимодействие с игрой
    lastInteraction: 0,
    
    // Когда была открыта последняя коробка
    lastChestOpened: 0,
    
    // Запущены ли idle-анимации
    idleRunning: false,
    
    // Запущена ли анимация «обиженной» коробки
    isOffendedRunning: false,
    
    // Таймер для запуска «обиженной» коробки
    offendedTimer: null,
    
    // ---- ПРЕДПРОСМОТР КОРОБКИ (в админ-панели) ----
    
    // Поворот коробки в превью по Y
    previewRotY: -30,
    
    // Наклон коробки в превью по X
    previewRotX: -15,
    
    // Перетаскивается ли сейчас превью мышкой
    previewDragging: false,
    
    // Начальная позиция мыши при перетаскивании
    previewStartX: 0,
    previewStartY: 0,
    
    // ---- КОРОБКА ЗРИТЕЛЕЙ ----
    
    // Включён ли блок «Коробка зрителей»
    viewerChestEnabled: false,
    
    // Цвет коробки зрителей
    viewerChestColor: 'vc1',
    
    // Ссылки на аудиофайлы (3 штуки, выбирается случайный)
    viewerAudio1Url: '',
    viewerAudio2Url: '',
    viewerAudio3Url: '',
    
    // Открыта ли коробка зрителей
    viewerChestOpen: false,
    
    // Идёт ли сейчас генерация числа для зрителей
    viewerGenerating: false,
    
    // Текущий проигрываемый аудиофайл зрителей
    viewerAudio: null,
    
    // ---- КОРОБКА PUTIN ----
    
    // Включён ли блок «Коробка PUTIN»
    putinChestEnabled: false,
    
    // Цвет этой коробки
    putinChestColor: 'vc1',
    
    // Максимальное количество «подкруток» (1 или 2)
    putinMaxShuffles: 2,
    
    // Ссылки на аудио для 1-й и 2-й подкрутки
    putinAudio1Url: '',
    putinAudio2Url: '',
    
    // Открыта ли PUTIN-коробка
    putinBoxOpen: false,
    
    // Сколько раз уже подкрутили
    putinOpened: 0,
    
    // Идёт ли сейчас анимация подкрутки
    putinAnimating: false,
    
    // Какие номера коробок уже участвовали в подкрутках
    putinUsedNumbers: {},
    
    // История подкруток
    putinSwapHistory: [],
    
    // Текущий аудиофайл PUTIN
    putinAudio: null,
    
    // ---- АВАТАРЫ ----
    avatars: {},
    
    // Глобальный счётчик для уникальных ID
    nextUniqueId: 0
};

// ---- ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ ----
// Эта функция сбрасывает всё в начальное состояние.
// Вызывается при запуске игры или при нажатии «Сбросить всё».

function initState() {
    var n = state.totalNumbers;
    
    // Создаём участников с пустыми именами и без номеров
    state.participants = [];
    for (var i = 0; i < n; i++) {
        state.participants.push({
            uniqueId: state.nextUniqueId++,  // ← УНИКАЛЬНЫЙ ID, который не повторяется
            name: '',
            assignedNumber: null,
            hasOpenedChest: false,
            blockedByAnnoying: false,
            openedChestNum: null
        });
    }
    
    // Очищаем список использованных номеров
    state.usedNumbers = {};
    
    // Сбрасываем все коробки
    state.chestsState = {};
    state.chestContents = {};
    state.chestAligns = {};
    state.chestTypes = {};
    state.chestColors = {};
    state.chestSparks = {};
    state.chestRotY = {};
    state.chestRotX = {};
    state.chestAudioUrls = {};
    state.lockedChests = {};
    
    // Сбрасываем состояние PUTIN
    state.putinBoxOpen = false;
    state.putinOpened = 0;
    state.putinAnimating = false;
    state.putinUsedNumbers = {};
    state.putinSwapHistory = [];
    
    // ОЧИЩАЕМ АВАТАРЫ
    state.avatars = {};
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('avatars');
    }
    
    // ОЧИЩАЕМ cropStore (если используется)
    if (typeof cropStore !== 'undefined') {
        for (var key in cropStore) {
            delete cropStore[key];
        }
    }
    
    // Цвета коробок по умолчанию (8 разных цветов, повторяются по кругу)
    var defaultColors = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
    
    for (var i = 1; i <= n; i++) {
        state.chestsState[i] = { opened: false, ownerName: null, ownerNumber: null, originalType: null };
        // Каждой коробке — свой текст из DEFAULT_CONTENTS (повторяем по кругу)
        state.chestContents[i] = CONFIG.DEFAULT_CONTENTS[(i - 1) % 8] || "";
        state.chestAligns[i] = 'center';
        state.chestTypes[i] = 'prize';
        state.chestColors[i] = defaultColors[(i - 1) % 8];
        // Первые две коробки — с искрами
        state.chestSparks[i] = (i <= 2);
        state.chestRotY[i] = -30;
        state.chestRotX[i] = -15;
        state.chestAudioUrls[i] = "";
        state.chestGlows[i] = "";
    }
    
    state.selectedParticipantIndex = null;
    state.hasUnsavedChanges = false;
    state.currentEditingChest = null;
    state.lastChestOpened = Date.now();
    state.previewRotY = -30;
    state.previewRotX = -15;
    
    // Обновляем интерфейс
    if (typeof renderSparksTabs === 'function') renderSparksTabs();
    if (typeof updateUnsavedIndicator === 'function') updateUnsavedIndicator();
    if (typeof renderChestTabs === 'function') renderChestTabs();
    if (typeof renderAnnoyingChestButtons === 'function') renderAnnoyingChestButtons();
    if (typeof resetPutinUI === 'function') resetPutinUI();
    
    // Обновляем видимость блоков
    if (typeof updateViewerChestVisibility === 'function') updateViewerChestVisibility();
    if (typeof updatePutinChestVisibility === 'function') updatePutinChestVisibility();
}

// ---- ЗАГРУЗКА СОХРАНЁННЫХ НАСТРОЕК ИЗ localStorage ----
// Когда игра запускается, она «вспоминает», что было настроено в прошлый раз

function loadSavedSettings() {
    // Громкость
    var sv = localStorage.getItem('magicVolume');
    if (sv !== null) state.globalVolume = parseFloat(sv);
    
    var uiv = localStorage.getItem('uiVolume');
    if (uiv !== null) state.uiVolume = parseFloat(uiv);
    
    var cav = localStorage.getItem('chestAudioVolume');
    if (cav !== null) state.chestAudioVolume = parseFloat(cav);
    
    if (typeof updateVolumeUI === 'function') updateVolumeUI();
    
    // Фон
    var sbg = localStorage.getItem('magicBg');
    var sbu = localStorage.getItem('magicBgUrl');
    if (sbg === 'custom' && sbu) {
        if (typeof applyBackground === 'function') applyBackground('custom', sbu);
    } else if (sbg && BG_PRESETS[sbg]) {
        if (typeof applyBackground === 'function') applyBackground(sbg);
    }
    
    // Режим «Задолбал»
    state.annoyingChestEnabled = localStorage.getItem('annoyingChestEnabled') === 'true';
    var san = localStorage.getItem('annoyingChestNumber');
    if (san && !isNaN(parseInt(san)) && parseInt(san) <= state.totalNumbers) {
        state.annoyingChestNumber = parseInt(san);
    } else {
        state.annoyingChestNumber = null;
    }
    state.annoyingAudioUrl = localStorage.getItem('annoyingAudioUrl') || "";
    
    // Коробка зрителей
    state.viewerChestEnabled = localStorage.getItem('viewerChestEnabled') === 'true';
    state.viewerChestColor = localStorage.getItem('viewerChestColor') || 'vc1';
    state.viewerAudio1Url = localStorage.getItem('viewerAudio1Url') || '';
    state.viewerAudio2Url = localStorage.getItem('viewerAudio2Url') || '';
    state.viewerAudio3Url = localStorage.getItem('viewerAudio3Url') || '';
    
    // Коробка PUTIN
    state.putinChestEnabled = localStorage.getItem('putinChestEnabled') === 'true';
    state.putinChestColor = localStorage.getItem('putinChestColor') || 'vc1';
    state.putinMaxShuffles = parseInt(localStorage.getItem('putinMaxShuffles') || '2');
    state.putinAudio1Url = localStorage.getItem('putinAudio1Url') || '';
    state.putinAudio2Url = localStorage.getItem('putinAudio2Url') || '';
    
    // ВАЖНО: обновляем видимость блоков сразу после загрузки настроек
    if (typeof updateViewerChestVisibility === 'function') updateViewerChestVisibility();
    if (typeof updatePutinChestVisibility === 'function') updatePutinChestVisibility();
    if (typeof resetPutinUI === 'function') resetPutinUI();
}

// ---- ЭКСПОРТ ВСЕХ НАСТРОЕК В JSON ----
// Собирает всё состояние в один объект для сохранения в файл

function exportFullSettings() {
    var data = {
        version: '3.45',
        totalNumbers: state.totalNumbers,
        globalVolume: state.globalVolume,
        uiVolume: state.uiVolume,
        chestAudioVolume: state.chestAudioVolume,
        bgPreset: localStorage.getItem('magicBg') || 'default',
        customBgUrl: localStorage.getItem('magicBgUrl') || '',
        contents: [],
        types: [],
        aligns: [],
        colors: [],
        sparks: [],
        rotY: [],
        rotX: [],
        audioUrls: [],
        glows: [],
        annoyingEnabled: state.annoyingChestEnabled,
        annoyingNumber: state.annoyingChestNumber,
        annoyingAudioUrl: state.annoyingAudioUrl,
        viewerChestEnabled: state.viewerChestEnabled,
        viewerChestColor: state.viewerChestColor,
        viewerAudio1Url: state.viewerAudio1Url,
        viewerAudio2Url: state.viewerAudio2Url,
        viewerAudio3Url: state.viewerAudio3Url,
        putinChestEnabled: state.putinChestEnabled,
        putinChestColor: state.putinChestColor,
        putinMaxShuffles: state.putinMaxShuffles,
        putinAudio1Url: state.putinAudio1Url,
        putinAudio2Url: state.putinAudio2Url,
        
        // АВАТАРЫ
        avatars: state.avatars || {}
    };
    
    for (var i = 1; i <= state.totalNumbers; i++) {
        data.contents.push(state.chestContents[i] || "");
        data.types.push(state.chestTypes[i] || 'prize');
        data.aligns.push(state.chestAligns[i] || 'center');
        data.colors.push(state.chestColors[i] || 'c1');
        data.sparks.push(state.chestSparks[i] || false);
        data.rotY.push(state.chestRotY[i] !== undefined ? state.chestRotY[i] : -30);
        data.rotX.push(state.chestRotX[i] !== undefined ? state.chestRotX[i] : -15);
        data.audioUrls.push(state.chestAudioUrls[i] || "");
        data.glows.push(state.chestGlows[i] || "");
    }
    
    return JSON.stringify(data, null, 2);
}

// ---- ИМПОРТ НАСТРОЕК ИЗ JSON-ФАЙЛА ----
// Загружает сохранённые настройки и применяет их к игре

function importSettings(jsonString) {
    var data = JSON.parse(jsonString);
    
    // Если количество коробок в файле отличается — спрашиваем, менять ли
    if (data.totalNumbers && data.totalNumbers !== state.totalNumbers) {
        if (confirm('В файле ' + data.totalNumbers + ' коробок, а сейчас ' + state.totalNumbers + '. Изменить количество?')) {
            state.totalNumbers = data.totalNumbers;
            var countInput = document.getElementById('participantCount');
            if (countInput) countInput.value = state.totalNumbers;
        }
    }
    
    // Восстанавливаем громкость
    if (data.globalVolume !== undefined) state.globalVolume = data.globalVolume;
    if (data.uiVolume !== undefined) state.uiVolume = data.uiVolume;
    if (data.chestAudioVolume !== undefined) state.chestAudioVolume = data.chestAudioVolume;
    
    // Восстанавливаем фон
    if (data.bgPreset) {
        applyBackground(data.bgPreset, data.customBgUrl || null);
    }
    
    // Сбрасываем всё и создаём заново
    state.participants = [];
    for (var i = 0; i < state.totalNumbers; i++) {
        state.participants.push({
            uniqueId: state.nextUniqueId++,  // ← УНИКАЛЬНЫЙ ID
            name: '',
            assignedNumber: null,
            hasOpenedChest: false,
            blockedByAnnoying: false,
            openedChestNum: null
        });
    }
    
    state.usedNumbers = {};
    state.chestsState = {};
    state.chestContents = {};
    state.chestTypes = {};
    state.chestAligns = {};
    state.chestColors = {};
    state.chestSparks = {};
    state.chestRotY = {};
    state.chestRotX = {};
    state.chestAudioUrls = {};
    state.lockedChests = {};
    state.putinBoxOpen = false;
    state.putinOpened = 0;
    state.putinAnimating = false;
    state.putinUsedNumbers = {};
    state.putinSwapHistory = [];
    
    var defaultColors = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
    
    for (var i = 1; i <= state.totalNumbers; i++) {
        state.chestsState[i] = { opened: false, ownerName: null, ownerNumber: null, originalType: null };
        state.chestContents[i] = data.contents && data.contents[i-1] ? data.contents[i-1] : (CONFIG.DEFAULT_CONTENTS[(i-1)%8] || "");
        state.chestTypes[i] = data.types && data.types[i-1] ? data.types[i-1] : 'prize';
        state.chestAligns[i] = data.aligns && data.aligns[i-1] ? data.aligns[i-1] : 'center';
        state.chestColors[i] = data.colors && data.colors[i-1] ? data.colors[i-1] : defaultColors[(i-1)%8];
        state.chestSparks[i] = data.sparks && data.sparks[i-1] !== undefined ? data.sparks[i-1] : (i <= 2);
        state.chestRotY[i] = data.rotY && data.rotY[i-1] !== undefined ? data.rotY[i-1] : -30;
        state.chestRotX[i] = data.rotX && data.rotX[i-1] !== undefined ? data.rotX[i-1] : -15;
        state.chestAudioUrls[i] = data.audioUrls && data.audioUrls[i-1] ? data.audioUrls[i-1] : "";
        state.chestGlows[i] = data.glows && data.glows[i-1] ? data.glows[i-1] : "";
    }
    
    // Восстанавливаем особые режимы
    if (data.annoyingEnabled !== undefined) state.annoyingChestEnabled = data.annoyingEnabled;
    state.annoyingChestNumber = (data.annoyingNumber && data.annoyingNumber <= state.totalNumbers) ? data.annoyingNumber : null;
    state.annoyingAudioUrl = data.annoyingAudioUrl || "";
    
    if (data.viewerChestEnabled !== undefined) state.viewerChestEnabled = data.viewerChestEnabled;
    state.viewerChestColor = data.viewerChestColor || 'vc1';
    state.viewerAudio1Url = data.viewerAudio1Url || '';
    state.viewerAudio2Url = data.viewerAudio2Url || '';
    state.viewerAudio3Url = data.viewerAudio3Url || '';
    
    if (data.putinChestEnabled !== undefined) state.putinChestEnabled = data.putinChestEnabled;
    state.putinChestColor = data.putinChestColor || 'vc1';
    state.putinMaxShuffles = data.putinMaxShuffles || 2;
    state.putinAudio1Url = data.putinAudio1Url || '';
    state.putinAudio2Url = data.putinAudio2Url || '';
    
    // ВОССТАНАВЛИВАЕМ АВАТАРЫ
    if (data.avatars) {
        state.avatars = data.avatars;
        localStorage.setItem('avatars', JSON.stringify(state.avatars));
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('magicVolume', state.globalVolume);
    localStorage.setItem('uiVolume', state.uiVolume);
    localStorage.setItem('chestAudioVolume', state.chestAudioVolume);
    localStorage.setItem('annoyingChestEnabled', state.annoyingChestEnabled);
    if (state.annoyingChestNumber) localStorage.setItem('annoyingChestNumber', state.annoyingChestNumber);
    localStorage.setItem('viewerChestEnabled', state.viewerChestEnabled);
    localStorage.setItem('viewerChestColor', state.viewerChestColor);
    localStorage.setItem('viewerAudio1Url', state.viewerAudio1Url);
    localStorage.setItem('viewerAudio2Url', state.viewerAudio2Url);
    localStorage.setItem('viewerAudio3Url', state.viewerAudio3Url);
    localStorage.setItem('putinChestEnabled', state.putinChestEnabled);
    localStorage.setItem('putinChestColor', state.putinChestColor);
    localStorage.setItem('putinMaxShuffles', state.putinMaxShuffles);
    localStorage.setItem('putinAudio1Url', state.putinAudio1Url);
    localStorage.setItem('putinAudio2Url', state.putinAudio2Url);
    
    // Обновляем интерфейс
    if (typeof syncUIAfterImport === 'function') syncUIAfterImport();
}

// ---- СБРОС ИГРЫ ----
// Очищает выданные номера, закрывает все коробки, но НЕ трогает настройки (цвета, тексты)

function resetGame() {
    if (state.isAnimating || state.atomicAction || state.isCountingDown || state.isAnyModalOpen) return;
    
    // Проверяем, открыта ли хотя бы одна коробка
    var anyOpened = false;
    for (var i = 1; i <= state.totalNumbers; i++) {
        if (state.chestsState[i] && state.chestsState[i].opened) {
            anyOpened = true;
            break;
        }
    }
    
    // Если есть открытые коробки — показываем предупреждение
    if (anyOpened) {
        ModalManager.show({
            title: '⚠️ ВНИМАНИЕ!',
            message: '<div style="font-size:1.2rem;color:#ff8888;">Коробка(и) открыты — это закроет их, но содержимое останется на месте.</div>',
            buttons: [
                { text: 'Сбросить', class: 'danger', value: 0 },
                { text: 'Отмена', class: 'primary', value: 1 }
            ],
            noOverlayClose: true
        }).then(function(result) {
            if (result === 0) {
                doResetGame();
            }
        });
    } else {
        doResetGame();
    }
}

function doResetGame() {
    // Останавливаем всё, что играет/тикает
    if (typeof clearCountdown === 'function') clearCountdown();
    if (typeof AudioManager !== 'undefined') AudioManager.stopAll();
    
    // Сбрасываем участников
    state.participants.forEach(function(p) {
        p.assignedNumber = null;
        p.hasOpenedChest = false;
        p.blockedByAnnoying = false;
        p.openedChestNum = null;
    });
    
    state.usedNumbers = {};
    state.selectedParticipantIndex = null;
    
    // Закрываем все коробки
    for (var i = 1; i <= state.totalNumbers; i++) {
        state.chestsState[i] = { opened: false, ownerName: null, ownerNumber: null };
        state.lockedChests[i] = null;
    }
    
    state.putinBoxOpen = false;
    state.putinOpened = 0;
    state.putinAnimating = false;
    state.putinUsedNumbers = {};
    state.putinSwapHistory = [];
    state.lastChestOpened = Date.now();
      
    if (typeof IdleEngine !== 'undefined') IdleEngine.stop();
    if (typeof renderAll === 'function') renderAll();
    if (typeof IdleEngine !== 'undefined') IdleEngine.start();
    if (typeof updateTurnIndicator === 'function') updateTurnIndicator();
    if (typeof resetPutinUI === 'function') resetPutinUI();
}