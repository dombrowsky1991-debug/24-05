// =====================================================
// putin-chest.js — Коробка PUTIN
// Отдельный блок, который появляется после того,
// как ВСЕ коробки открыты (или заблокированы).
// Позволяет сделать 1 или 2 «подкрутки» — обменять типы
// (ПРИЗ/ЗАДАНИЕ) между двумя случайными коробками.
// Включает:
//   - анимацию барабана с номерами
//   - таблицу всех игроков и их коробок
//   - таблицу истории обменов
//   - аудио для каждой подкрутки
// =====================================================

// ---- ПОКАЗАТЬ/СКРЫТЬ БЛОК КОРОБКИ PUTIN ----

function updatePutinChestVisibility() {
    var block = document.getElementById('putinChestBlock');
    if (block) {
        block.style.display = state.putinChestEnabled ? 'flex' : 'none';
    }
}

// ---- СБРОС ВСЕХ ЭЛЕМЕНТОВ PUTIN-ИНТЕРФЕЙСА ----

function resetPutinSlots() {
    var s1 = document.getElementById('putinSlot1');
    var s2 = document.getElementById('putinSlot2');

    if (s1) {
        s1.innerHTML = '<span class="qmark">?</span>';
        s1.classList.remove('gold');
    }
    if (s2) {
        s2.innerHTML = '<span class="qmark">?</span>';
        s2.classList.remove('gold');
    }

    var arrows = document.getElementById('putinArrowsV');
    if (arrows) arrows.classList.remove('spinning');
}

function resetPutinUI() {
    var box = document.getElementById('putinGiftBoxViewerV');
    var nums = document.getElementById('putinNumbersV');
    var content = document.getElementById('putinContent');
    var block = document.getElementById('putinChestBlock');
    var msg = document.getElementById('putinWarningMsg');

    // Закрываем коробку
    if (box) box.classList.remove('opened');

    // Обновляем цвет коробки
    if (box) {
        var colorClasses = ['vc1', 'vc2', 'vc3', 'vc4', 'vc5', 'vc6', 'vc7', 'vc8'];
        colorClasses.forEach(function(c) {
            box.classList.remove(c);
        });
        box.classList.add(state.putinChestColor);
    }

    // Прячем цифры и контент
    if (nums) nums.classList.remove('active');
    if (content) content.classList.remove('active');
    if (block) block.classList.remove('warning-active');
    if (msg) msg.classList.remove('show');

    resetPutinSlots();
    if (typeof AudioManager !== 'undefined') {
    AudioManager.stopPutinAudio();
}

    // Обновляем счётчик подкруток
    var counter = document.getElementById('putinCounterV');
    if (counter) {
        counter.textContent = 'Осталось подкруток: ' + (state.putinMaxShuffles - state.putinOpened);
    }

    // Блокируем/разблокируем кнопку подкрутки
    var btn = document.getElementById('btnPutinShuffle');
    if (btn) {
        if (state.putinOpened >= state.putinMaxShuffles) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    }

    state.putinBoxOpen = false;
}

// ---- ПРЕДУПРЕЖДЕНИЕ: НЕ ВСЕ КОРОБКИ ОТКРЫТЫ ----

function showPutinWarning() {
    var block = document.getElementById('putinChestBlock');
    var msg = document.getElementById('putinWarningMsg');

    if (block) block.classList.add('warning-active');
    if (msg) msg.classList.add('show');

    setTimeout(function() {
        if (block) block.classList.remove('warning-active');
        if (msg) msg.classList.remove('show');
    }, 2500);
}

// ---- ПОПЫТКА ОТКРЫТЬ PUTIN-КОРОБКУ ----

function tryOpenPutinChest() {
    if (state.putinBoxOpen) return;

    // Проверяем, что все коробки открыты (или заблокированы)
    if (!allChestsOpenedCheck()) {
        showPutinWarning();
        return;
    }

    state.putinBoxOpen = true;

    var box = document.getElementById('putinGiftBoxViewerV');
    var block = document.getElementById('putinChestBlock');
    var msg = document.getElementById('putinWarningMsg');

    // Открываем коробку
    if (box) box.classList.add('opened');
    if (block) block.classList.remove('warning-active');
    if (msg) msg.classList.remove('show');

    // Обновляем цвет
    var colorClasses = ['vc1', 'vc2', 'vc3', 'vc4', 'vc5', 'vc6', 'vc7', 'vc8'];
    colorClasses.forEach(function(c) {
        if (box) box.classList.remove(c);
    });
    if (box) box.classList.add(state.putinChestColor);

    // Через 0.6 сек показываем панель с цифрами и таблицами
    setTimeout(function() {
        var nums = document.getElementById('putinNumbersV');
        var content = document.getElementById('putinContent');
        var counter = document.getElementById('putinCounterV');

        if (nums) nums.classList.add('active');
        if (content) content.classList.add('active');
        if (counter) {
            counter.textContent = 'Осталось подкруток: ' + (state.putinMaxShuffles - state.putinOpened);
        }

        renderPutinTables();
    }, 600);
}

// ---- ТАБЛИЦА ИГРОКОВ ----

function renderPutinPlayersTable() {
    var tbody = document.getElementById('putinPlayersBodyV');
    if (!tbody) return;

    var html = '';

    state.participants.forEach(function(p) {
        // Пропускаем пустых и без номера
        if (p.name.trim() === '' || p.assignedNumber === null) return;
        if (!p.openedChestNum) return;

        var chestNum = p.openedChestNum;
        
        // Исходный тип (тот, который был при открытии)
        var chestData = state.chestsState[chestNum];
        var originalType = (chestData && chestData.originalType) || state.chestTypes[chestNum] || 'prize';
        var originalLabel = (originalType === 'prize') ? '🎁 ПРИЗ' : '📋 ЗАДАНИЕ';
        
        // Текущий тип (после обменов Putin)
        var currentType = state.chestTypes[chestNum] || 'prize';
        var currentLabel = (currentType === 'prize') ? '🎁 ПРИЗ' : '📋 ЗАДАНИЕ';
        
        // Было ли изменение (если типы разные)
        var hasChanged = (originalType !== currentType);
        
        // Проверяем, участвовала ли коробка в обмене
        var swapped = state.putinSwapHistory.some(function(s) {
            return s.from === chestNum || s.to === chestNum;
        });
        
        // Символ обмена: ↔ если коробка участвовала в обмене
        var swapSymbol = swapped ? ' ↔ ' : '';
        
        // Определяем, какой по счёте была подкрутка для этой коробки
        var swapIndex = -1;
        for (var i = 0; i < state.putinSwapHistory.length; i++) {
            var s = state.putinSwapHistory[i];
            if (s.from === chestNum || s.to === chestNum) {
                swapIndex = i;  // i = 0 для первой подкрутки, i = 1 для второй
                break;
            }
        }
        
        // Определяем стиль строки в зависимости от номера подкрутки
        var rowStyle = '';
        if (swapIndex === 0) {
            // Первая подкрутка — золотистый фон
            rowStyle = 'background: rgba(255, 215, 0, 0.12); border-left: 3px solid #ffd700;';
        } else if (swapIndex === 1) {
            // Вторая подкрутка — красноватый фон
            rowStyle = 'background: rgba(255, 80, 80, 0.15); border-left: 3px solid #ff6666;';
        }
        
        // Бейдж обмена (только если участвовала в обмене)
        var swapBadge = swapped ? '<span class="swap-badge">обмен</span>' : '';

        // Формируем строку таблицы с 6 колонками
        html += '<tr style="' + rowStyle + '">';
        html += '<td style="text-align:left;">' + p.assignedNumber + ' ' + swapBadge + '</td>';
        var miniAvatar = renderMiniAvatar(chestNum, 28);
        html += '<td style="text-align:left;">' + miniAvatar + escapeHTML(p.name) + '</td>';
        html += '<td style="text-align:left;">Коробка №' + chestNum + '</td>';
        
        // Колонка "Было" (с зачёркиванием если изменилось)
        if (hasChanged) {
            html += '<td style="text-align:left; text-decoration: line-through; color: #888;">' + originalLabel + '</td>';
        } else {
            html += '<td style="text-align:left;">' + originalLabel + '</td>';
        }
        
        // Колонка "Обмен" (символ ↔ по центру)
        html += '<td style="text-align:center; font-weight:bold;">' + swapSymbol + '</td>';
        
        // Колонка "Стало" (жирным если изменилось)
        if (hasChanged) {
            html += '<td style="text-align:left; font-weight:bold;">' + currentLabel + '</td>';
        } else {
            html += '<td style="text-align:left;">' + currentLabel + '</td>';
        }
        
        html += '</tr>';
    });

    if (html === '') {
        tbody.innerHTML = '<tr><td colspan="6" style="color:#555; text-align:center;">Нет данных</td></tr>';
    } else {
        tbody.innerHTML = html;
    }
}

// ---- ТАБЛИЦА ИСТОРИИ ОБМЕНОВ ----

function renderPutinSwapTable() {
    var tbody = document.getElementById('putinSwapBodyV');
    if (!tbody) return;

    if (state.putinSwapHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:#555; text-align:center;">Пока нет подкруток</td></tr>';
        return;
    }

    var html = '';

    state.putinSwapHistory.forEach(function(s) {
        // Находим, кому принадлежат коробки
        var p1 = state.participants.find(function(p) {
            return p.openedChestNum === s.from;
        });
        var p2 = state.participants.find(function(p) {
            return p.openedChestNum === s.to;
        });

        var name1 = p1 ? p1.name : '?';
        var num1 = p1 ? p1.assignedNumber : '?';
        var name2 = p2 ? p2.name : '?';
        var num2 = p2 ? p2.assignedNumber : '?';

        var fromLabel = (s.fromType === 'prize') ? '🎁 ПРИЗ' : '📋 ЗАДАНИЕ';
        var toLabel = (s.toType === 'prize') ? '🎁 ПРИЗ' : '📋 ЗАДАНИЕ';

        html += '<tr>' +
            '<td style="text-align:left;">' + escapeHTML(name1) + ' (№' + num1 + ')</td>' +
            '<td style="text-align:center;"><span class="badge ' + (s.fromType === 'prize' ? 'badge-prize' : 'badge-task') + '">' + fromLabel + '</span></td>' +
            '<td style="text-align:center;">↔</td>' +
            '<td style="text-align:left;">' + escapeHTML(name2) + ' (№' + num2 + ')</td>' +
            '<td style="text-align:center;"><span class="badge ' + (s.toType === 'prize' ? 'badge-prize' : 'badge-task') + '">' + toLabel + '</span></td>' +
        '</tr>';
    });

    tbody.innerHTML = html;
}

// ---- ОБНОВЛЕНИЕ ВСЕХ ТАБЛИЦ ----

function renderPutinTables() {
    renderPutinPlayersTable();
    renderPutinSwapTable();
}

// ---- ГЛАВНАЯ ФУНКЦИЯ: ПОДКРУТКА ----
// Выбирает две случайные коробки и меняет их типы (ПРИЗ ↔ ЗАДАНИЕ)

function putinShuffle() {
    // Проверки
    if (state.putinAnimating || !state.putinBoxOpen) return;
    if (state.putinOpened >= state.putinMaxShuffles) return;
    if (!allChestsOpenedCheck()) return;

    // Собираем доступные коробки (ещё не участвовавшие в подкрутках)
    var avail = [];
    for (var i = 1; i <= state.totalNumbers; i++) {
        if (!state.putinUsedNumbers[i]) {
            avail.push(i);
        }
    }

    if (avail.length < 2) return;  // Нужно минимум 2 коробки

    // Начинаем анимацию
    state.putinAnimating = true;
    state.putinOpened++;

    // Обновляем счётчик
    var counter = document.getElementById('putinCounterV');
    if (counter) {
        counter.textContent = 'Осталось подкруток: ' + (state.putinMaxShuffles - state.putinOpened);
    }

    // Блокируем кнопку на время анимации
    var btn = document.getElementById('btnPutinShuffle');
    if (btn) {
        btn.disabled = true;
        if (state.putinOpened >= state.putinMaxShuffles) {
            btn.style.opacity = '0.4';
            btn.style.cursor = 'not-allowed';
        }
    }

    // Запускаем аудио
    if (typeof AudioManager !== 'undefined') {
    AudioManager.playPutinAudio(state.putinOpened);
    }

    // Перемешиваем и выбираем две коробки
    var sh = avail.sort(function() {
        return Math.random() - 0.5;
    });
    var n1 = sh[0];
    var n2 = sh[1];

    state.putinUsedNumbers[n1] = true;
    state.putinUsedNumbers[n2] = true;

    var s1 = document.getElementById('putinSlot1');
    var s2 = document.getElementById('putinSlot2');
    var arr = document.getElementById('putinArrowsV');

    if (s1) s1.innerHTML = '';
    if (s2) s2.innerHTML = '';
    if (arr) arr.classList.add('spinning');

    // ---- АНИМАЦИЯ БАРАБАНА ----
    var allNums = [];
    for (var i = 1; i <= state.totalNumbers; i++) {
        allNums.push(i);
    }

    var st = Date.now();
    var dur = 5000;  // 5 секунд крутим

    function spin() {
        var p = Math.min((Date.now() - st) / dur, 1);
        var iv = 30 + (p * p * p) * 800;  // Замедление к концу

        if (p < 1) {
            // Показываем случайные числа
            if (s1) s1.textContent = allNums[Math.floor(Math.random() * allNums.length)];
            if (s2) s2.textContent = allNums[Math.floor(Math.random() * allNums.length)];
            setTimeout(spin, iv);
        } else {
            // Останавливаем — показываем результат
            if (arr) arr.classList.remove('spinning');

            if (s1) {
                s1.textContent = n1;
                s1.classList.add('gold');
            }
            if (s2) {
                s2.textContent = n2;
                s2.classList.add('gold');
            }

            // Меняем типы коробок местами
            var tmpType = state.chestTypes[n1];
            state.chestTypes[n1] = state.chestTypes[n2];
            state.chestTypes[n2] = tmpType;

            // Записываем в историю
            state.putinSwapHistory.push({
                from: n1,
                to: n2,
                fromType: tmpType,
                fromLabel: tmpType === 'prize' ? 'ПРИЗ' : 'ЗАДАНИЕ',
                toType: state.chestTypes[n1],
                toLabel: state.chestTypes[n1] === 'prize' ? 'ПРИЗ' : 'ЗАДАНИЕ'
            });

            // Обновляем таблицы
            renderPutinTables();

            state.putinAnimating = false;

            if (btn) btn.disabled = false;

            // Через 2.5 сек убираем золотую подсветку
            setTimeout(function() {
                if (s1) s1.classList.remove('gold');
                if (s2) s2.classList.remove('gold');
            }, 2500);
        }
    }

    spin();
}

// ---- ИНИЦИАЛИЗАЦИЯ КОРОБКИ PUTIN ----
// Навешивает обработчики событий

function initPutinChest() {
    var scene = document.getElementById('putinSceneViewerV');
    var btnShuffle = document.getElementById('btnPutinShuffle');
    var btnClose = document.getElementById('btnPutinClose');

    if (scene) {
        scene.addEventListener('click', tryOpenPutinChest);
    }

    if (btnShuffle) {
        btnShuffle.addEventListener('click', putinShuffle);
    }

    if (btnClose) {
        btnClose.addEventListener('click', function() {
            state.putinBoxOpen = false;
            resetPutinUI();
        });
    }
}