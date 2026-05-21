// =====================================================
// viewer-chest.js — Коробка Зрителей
// Отдельный блок с коробкой для генерации случайного числа.
// Используется для интерактива со зрителями стрима.
// Возможности:
//   - задать диапазон (мин/макс, шаг 500)
//   - анимация "барабана" с цифрами
//   - конфетти при выпадении числа
//   - история генераций с возможностью экспорта в CSV
//   - 3 случайных аудиофайла (выбирается один при генерации)
// =====================================================

// ---- ПОКАЗАТЬ/СКРЫТЬ БЛОК КОРОБКИ ЗРИТЕЛЕЙ ----

function updateViewerChestVisibility() {
    var block = document.getElementById('viewerChestBlock');
    if (block) {
        block.style.display = state.viewerChestEnabled ? 'flex' : 'none';
    }
}

// ---- ИНИЦИАЛИЗАЦИЯ КОРОБКИ ЗРИТЕЛЕЙ ----
// Вызывается один раз при загрузке страницы

function initViewerChest() {
    var box = document.getElementById('giftBoxViewer');
    var panel = document.getElementById('generatorPanelV');
    var scene = document.getElementById('sceneViewerV');
    var seal = box ? box.querySelector('.wax-seal-viewer') : null;
    var minInput = document.getElementById('minInputV');
    var maxInput = document.getElementById('maxInputV');
    var btnGen = document.getElementById('btnGenerateV');
    var numDisplay = document.getElementById('numberDisplayV');
    var btnClose = document.getElementById('btnCloseV');

    if (!box || !scene) return;

    var colorClasses = ['vc1', 'vc2', 'vc3', 'vc4', 'vc5', 'vc6', 'vc7', 'vc8'];

    // ---- ИСТОРИЯ ГЕНЕРАЦИЙ ----
    // Хранится в localStorage, чтобы не терялась при перезагрузке

    var viewerHistory = [];
    try {
        var saved = localStorage.getItem('viewerChestHistory');
        if (saved) {
            viewerHistory = JSON.parse(saved);
        }
    } catch (e) {
        viewerHistory = [];
    }

    var historyContentV = document.getElementById('historyContentV');
    var btnClearHistoryV = document.getElementById('btnClearHistoryV');

    // Сохранение истории
    function saveViewerHistory() {
        localStorage.setItem('viewerChestHistory', JSON.stringify(viewerHistory));
    }

    // Отображение истории
    function renderViewerHistory() {
        if (!historyContentV) return;

        if (viewerHistory.length === 0) {
            historyContentV.innerHTML = '<div style="color:#555;padding:0.5rem;">Пока нет генераций</div>';
            updateTotalSumDisplay();
            return;
        }

        var totalSum = 0;
        var html = '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">';
        html += '<thead><tr style="color:#888;text-transform:uppercase;letter-spacing:1px;">';
        html += '<th style="padding:0.3rem;">#</th>';
        html += '<th style="padding:0.3rem;">Результат</th>';
        html += '<th style="padding:0.3rem;">Диапазон</th>';
        html += '<th style="padding:0.3rem;">Имя</th>';
        html += '<th style="padding:0.3rem;">Время</th>';
        html += '</tr></thead><tbody>';

        // Показываем в обратном порядке (новые сверху)
        var reversed = viewerHistory.slice().reverse();
        reversed.forEach(function(entry, i) {
            var displayNum = viewerHistory.length - i;
            var escapedName = escapeHTML(entry.name || '');
            
            totalSum += entry.result;
            
            html += '<tr>';
            html += '<td style="padding:0.3rem;text-align:center;color:#555;">' + displayNum + '</td>';
            html += '<td style="padding:0.3rem;text-align:center;color:#ffd700;font-weight:700;">' + entry.result.toLocaleString() + '</td>';
            html += '<td style="padding:0.3rem;text-align:center;color:#aaa;">' + entry.min + ' – ' + entry.max + '</td>';
            html += '<td style="padding:0.3rem;text-align:center;color:#ddd;">';
            html += '<input type="text" class="history-name-input" data-id="' + entry.timestamp + '" ';
            html += 'value="' + escapedName + '" placeholder="Имя..." ';
            html += 'style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:0.2rem 0.4rem;border-radius:6px;width:170px;text-align:center;font-size:0.75rem;outline:none;">';
            html += '</td>';
            html += '<td style="padding:0.3rem;text-align:center;color:#666;font-size:0.7rem;">' + entry.time + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table>';
        historyContentV.innerHTML = html;
        
        // Сохраняем сумму и обновляем отображение
        window.viewerTotalSum = totalSum;
        updateTotalSumDisplay();

        // Обработчики для полей ввода имени в истории
        var nameInputs = historyContentV.querySelectorAll('.history-name-input');
        nameInputs.forEach(function(inp) {
            inp.addEventListener('input', function() {
                var ts = parseInt(this.getAttribute('data-id'));
                for (var j = 0; j < viewerHistory.length; j++) {
                    if (viewerHistory[j].timestamp === ts) {
                        viewerHistory[j].name = this.value;
                        saveViewerHistory();
                        break;
                    }
                }
            });
            inp.addEventListener('click', function(e) {
                e.stopPropagation();  // Чтобы клик по полю не закрывал панель
            });
        });
    }

    // Обновление отображения общей суммы
    function updateTotalSumDisplay() {
        var totalSum = window.viewerTotalSum || 0;
        var existingSumBlock = document.getElementById('totalSumDisplayInline');
        
        if (existingSumBlock) {
            existingSumBlock.innerHTML = '💰 УЖЕ РАЗДАЛИ: <span style="color:#ffd700;font-weight:700;font-size:1.1rem;">' + totalSum.toLocaleString() + '</span>';
        }
    }

    // Создание блока с общей суммой
    function createTotalSumBlock() {
        var historyPanel = document.getElementById('historyPanelV');
        if (!historyPanel) return;
        
        if (document.getElementById('totalSumDisplayInline')) return;
        
        var sumBlock = document.createElement('div');
        sumBlock.id = 'totalSumDisplayInline';
        // Увеличили шрифт, оставили стиль заголовка
        sumBlock.style.cssText = 'color:#888;text-transform:uppercase;letter-spacing:1px;font-size:0.9rem;text-align:center;margin-bottom:0.5rem;padding:0.4rem;background:rgba(0,0,0,0.3);border-radius:1rem;';
        sumBlock.innerHTML = '💰 УЖЕ РАЗДАЛИ: <span style="color:#ffd700;font-weight:700;font-size:1.1rem;">' + (window.viewerTotalSum || 0).toLocaleString() + '</span>';
        
        // Вставляем перед историей, после заголовка "История"
        var historyTitle = historyPanel.querySelector('div[style*="color:#ffd966"]');
        if (historyTitle && historyTitle.nextSibling) {
            historyPanel.insertBefore(sumBlock, historyTitle.nextSibling);
        } else {
            var firstChild = historyPanel.firstChild;
            if (firstChild) {
                historyPanel.insertBefore(sumBlock, firstChild.nextSibling);
            } else {
                historyPanel.appendChild(sumBlock);
            }
        }
    }

    // Сброс суммы и истории
    function resetTotalSum() {
        if (confirm('⚠️ Очистить историю и сбросить сумму?')) {
            viewerHistory = [];
            saveViewerHistory();
            window.viewerTotalSum = 0;
            renderViewerHistory();
        }
    }

    // Добавление записи в историю
    function addViewerHistory(result, min, max) {
        var now = new Date();
        viewerHistory.push({
            result: result,
            min: min,
            max: max,
            name: '',
            time: now.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            timestamp: now.getTime()
        });

        // Ограничиваем историю 50 записями
        if (viewerHistory.length > 50) {
            viewerHistory.shift();
        }

        saveViewerHistory();
        renderViewerHistory();
    }

    // ---- ЭКСПОРТ ИСТОРИИ В CSV ----
    var btnExport = document.getElementById('btnExportHistoryV');
    if (btnExport) {
        btnExport.addEventListener('click', function(e) {
            e.stopPropagation();

            if (viewerHistory.length === 0) {
                alert('Нет данных для экспорта!');
                return;
            }

            // BOM (Byte Order Mark) — чтобы Excel правильно открыл кириллицу
            var csv = '\uFEFF№,Результат,Диапазон,Имя,Время\n';

            var rev = viewerHistory.slice().reverse();
            rev.forEach(function(entry, i) {
                csv += (i + 1) + ',' +
                       entry.result + ',' +
                       entry.min + '-' + entry.max + ',' +
                       '"' + (entry.name || '') + '",' +
                       entry.time + '\n';
            });

            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'история-коробки-зрителей.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // ---- ОЧИСТКА ИСТОРИИ ----
    if (btnClearHistoryV) {
        btnClearHistoryV.addEventListener('click', function(e) {
            e.stopPropagation();
            SoundEngine.playTone(600, 0.04, 'sine', 0.06);
            if (confirm('Очистить историю?')) {
                viewerHistory = [];
                saveViewerHistory();
                renderViewerHistory();
            }
        });
    }

    renderViewerHistory();

    // Создаём блок с общей суммой
    createTotalSumBlock();

    // Обновляем обработчик кнопки очистки
    var btnClearHistoryV = document.getElementById('btnClearHistoryV');
    if (btnClearHistoryV) {
        var newClearBtn = btnClearHistoryV.cloneNode(true);
        btnClearHistoryV.parentNode.replaceChild(newClearBtn, btnClearHistoryV);
        newClearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            SoundEngine.playTone(600, 0.04, 'sine', 0.06);
            resetTotalSum();
        });
    }

    // ---- ОТКРЫТИЕ КОРОБКИ (клик по ней) ----
    function openChest() {
        state.viewerChestOpen = true;
        box.classList.add('opened');

        if (seal) seal.textContent = '🎲';

        // Устанавливаем цвет из настроек
        colorClasses.forEach(function(c) {
            box.classList.remove(c);
        });
        box.classList.add(state.viewerChestColor);

        // Через 0.6 сек показываем панель генерации
        setTimeout(function() {
            if (panel) panel.classList.add('active');
        }, 600);
    }

    // ---- ЗАКРЫТИЕ КОРОБКИ ----
    function closeChest() {
        state.viewerChestOpen = false;
        AudioManager.stopViewerAudio();

        if (panel) panel.classList.remove('active');
        box.classList.remove('opened');

        if (seal) {
            seal.textContent = '?';
            seal.classList.remove('rolling');
        }

        if (numDisplay) numDisplay.innerHTML = '';

        if (minInput) minInput.value = '1000';
        if (maxInput) maxInput.value = '3000';

        state.viewerGenerating = false;
        if (btnGen) btnGen.disabled = false;
    }

    // Клик по сцене — открыть коробку
    scene.addEventListener('click', function() {
        if (state.viewerGenerating) return;
        if (!state.viewerChestOpen) {
            openChest();
        }
    });

    // Кнопка «Закрыть коробку»
    if (btnClose) {
        btnClose.addEventListener('click', function(e) {
            e.stopPropagation();
            SoundEngine.playTone(600, 0.04, 'sine', 0.06);
            closeChest();
        });
    }

    // ---- ГЕНЕРАЦИЯ ЧИСЛА ----
    if (btnGen) {
        btnGen.addEventListener('click', async function(e) {
            e.stopPropagation();
            SoundEngine.playTone(600, 0.04, 'sine', 0.06);

            if (state.viewerGenerating || !state.viewerChestOpen) return;

            var min = parseInt(minInput ? minInput.value : 0) || 0;
            var max = parseInt(maxInput ? maxInput.value : 0) || 0;

            if (min >= max) return;

            // Округляем до 500
            min = Math.round(min / 500) * 500;
            max = Math.round(max / 500) * 500;

            if (min >= max) return;

            // Формируем массив возможных значений
            var vals = [];
            for (var v = min; v <= max; v += 500) {
                vals.push(v);
            }

            var result = vals[Math.floor(Math.random() * vals.length)];

            // Запускаем анимацию
            state.viewerGenerating = true;
            btnGen.disabled = true;

            if (numDisplay) numDisplay.innerHTML = '';

            // Включаем случайное аудио
            AudioManager.playRandomViewerAudio();

            // Запускаем анимацию печати (вращение)
            if (seal) seal.classList.add('rolling');

            // Создаём слоты для цифр (как барабан)
            var digits = result.toString().split('');
            var slots = [];

            digits.forEach(function() {
                var s = document.createElement('div');
                s.className = 'digit-slot-v';
                if (numDisplay) numDisplay.appendChild(s);
                slots.push(s);
            });

            // Показываем цифры справа налево с задержкой
            for (var i = digits.length - 1; i >= 0; i--) {
                await new Promise(function(r) { setTimeout(r, 1200); });

                var inner = document.createElement('div');
                inner.className = 'digit-inner-v';
                inner.textContent = digits[i];
                slots[i].appendChild(inner);
            }

            await new Promise(function(r) { setTimeout(r, 300); });

            // Останавливаем анимацию печати
            if (seal) seal.classList.remove('rolling');

            // Запускаем конфетти
            spawnViewerConfetti();

            // Сохраняем в историю
            addViewerHistory(result, min, max);

            // Останавливаем аудио
            AudioManager.stopViewerAudio();

            btnGen.disabled = false;
            state.viewerGenerating = false;
        });
    }

    // Округление до 500 при изменении полей
    [minInput, maxInput].forEach(function(inp) {
        if (!inp) return;
        inp.addEventListener('change', function() {
            this.value = Math.round((parseInt(this.value) || 0) / 500) * 500;
        });
    });
}

// ---- КОНФЕТТИ ДЛЯ КОРОБКИ ЗРИТЕЛЕЙ ----

function spawnViewerConfetti() {
    var container = document.getElementById('confettiContainerV');
    if (!container) return;

    // Цвета для конфетти
    var confettiColors = [
        '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
        '#6c5ce7', '#a29bfe', '#fd79a8', '#00cec9', '#e17055',
        '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0'
    ];

    // Цвета для серпантина
    var serpentineColors = [
        '#ffd700', '#ff6b6b', '#4ecdc4', '#a29bfe',
        '#fd79a8', '#f9ca24', '#54a0ff', '#ff9ff3'
    ];

    var pieces = [];

    // Создаём 50 конфетти
    for (var i = 0; i < 50; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti-piece-v';

        var angle = Math.random() * Math.PI * 2;
        var distance = 80 + Math.random() * 200;

        piece.style.cssText =
            '--tx:' + (Math.cos(angle) * distance) + 'px;' +
            '--ty:' + (Math.sin(angle) * distance - 40) + 'px;' +
            '--rot:' + (Math.random() * 720 - 360) + 'deg;' +
            '--dur:' + (0.6 + Math.random() * 0.6) + 's;' +
            '--delay:' + (Math.random() * 0.15) + 's;' +
            'background:' + confettiColors[Math.floor(Math.random() * confettiColors.length)] + ';' +
            'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';' +
            'width:' + (7 + Math.random() * 12) + 'px;' +
            'height:' + (7 + Math.random() * 12) + 'px;';

        container.appendChild(piece);
        pieces.push(piece);
    }

    // Создаём 20 серпантинов
    for (var j = 0; j < 20; j++) {
        var s = document.createElement('div');
        s.className = 'serpentine-v';

        var sAngle = Math.random() * Math.PI * 2;
        var sDist = 60 + Math.random() * 180;

        s.style.cssText =
            '--sx:' + (Math.cos(sAngle) * sDist) + 'px;' +
            '--sy:' + (Math.sin(sAngle) * sDist - 30) + 'px;' +
            '--srot:' + (Math.random() * 540 - 270) + 'deg;' +
            '--sway:' + ((Math.random() - 0.5) * 100) + 'px;' +
            '--dur:' + (0.7 + Math.random() * 0.5) + 's;' +
            '--delay:' + (Math.random() * 0.2) + 's;' +
            'background:' + serpentineColors[Math.floor(Math.random() * serpentineColors.length)] + ';' +
            'width:5px;' +
            'height:' + (16 + Math.random() * 24) + 'px;' +
            'opacity:0.9;';

        container.appendChild(s);
        pieces.push(s);
    }

    // Запускаем анимацию
    requestAnimationFrame(function() {
        pieces.forEach(function(p) {
            p.classList.add('active');
        });
    });

    // Удаляем через 2 секунды
    setTimeout(function() {
        pieces.forEach(function(p) {
            p.remove();
        });
    }, 2000);
}