// =====================================================
// main.js — Точка входа
// Здесь собирается всё воедино:
//   - обработчики всех кнопок и событий
//   - инициализация игры при загрузке
//   - клавиатурные сокращения
//   - глобальные слушатели (клики, закрытие панелей)
// =====================================================

// ---- ФУНКЦИЯ: НАСТРОЙКА ВСЕХ ОБРАБОТЧИКОВ СОБЫТИЙ ----

function initEventListeners() {

    // ---- СБРОС IDLE-ТАЙМЕРА ПРИ ДВИЖЕНИИ МЫШИ НАД КОРОБКАМИ ----
    var chestBlock = document.getElementById('chestBlock');
    if (chestBlock) {
        chestBlock.addEventListener('mousemove', function() {
            IdleEngine.resetTimer();
        });
        chestBlock.addEventListener('click', function() {
            IdleEngine.resetTimer();
        });
    }

    // ---- КНОПКА АДМИН-ПАНЕЛИ (⚙) ----
    var adminTrigger = document.getElementById('adminTrigger');
    if (adminTrigger) {
        adminTrigger.addEventListener('click', function() {
            // Создаём оверлей с запросом пароля
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';

            overlay.innerHTML =
                '<div style="background:#1a1c2e;padding:2rem;border-radius:16px;text-align:center;border:1px solid rgba(255,215,0,0.3);">' +
                    '<div style="color:#ffd700;font-size:1.2rem;margin-bottom:1rem;">Введите пароль</div>' +
                    '<input type="password" id="pwInput" style="padding:0.5rem;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:white;text-align:center;font-size:1rem;outline:none;width:180px;" autofocus>' +
                    '<div style="margin-top:1rem;display:flex;gap:0.5rem;justify-content:center;">' +
                        '<button id="pwOk" style="padding:0.5rem 1.5rem;border-radius:8px;background:rgba(255,215,0,0.2);border:1px solid rgba(255,215,0,0.4);color:#ffd700;cursor:pointer;">OK</button>' +
                        '<button id="pwCancel" style="padding:0.5rem 1.5rem;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#ccc;cursor:pointer;">Отмена</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);

            var input = overlay.querySelector('#pwInput');
            input.focus();

            var checkPw = function() {
                var pw = input.value;
                overlay.remove();

                if (pw === CONFIG.ADMIN_PASSWORD) {
                    // Пароль верный — открываем админ-панель
                    var panel = document.getElementById('adminPanel');
                    if (panel) panel.classList.add('active');

                    renderChestTabs();
                    if (!state.currentEditingChest) switchToChest(1);
                    renderAnnoyingChestButtons();
                    updateChestSettingsUIForChest(state.currentEditingChest || 1);
                    renderSparksTabs();

                    // Обновляем чекбоксы в админ-панели
                    var vch = document.getElementById('enableViewerChestCheckbox');
                    if (vch) vch.checked = state.viewerChestEnabled;

                    var pch = document.getElementById('enablePutinChestCheckbox');
                    if (pch) pch.checked = state.putinChestEnabled;

                    var pms = document.getElementById('putinMaxShufflesSelect');
                    if (pms) pms.value = state.putinMaxShuffles;
                } else {
                    alert('❌ Неверный пароль!');
                }
            };

            overlay.querySelector('#pwOk').addEventListener('click', checkPw);
            overlay.querySelector('#pwCancel').addEventListener('click', function() {
                overlay.remove();
            });
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) overlay.remove();
            });
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') checkPw();
            });
        });
    }

    // ---- КНОПКА ЗАКРЫТИЯ АДМИН-ПАНЕЛИ ----
    var adminCloseBtn = document.getElementById('adminCloseBtn');
    if (adminCloseBtn) {
        adminCloseBtn.addEventListener('click', function() {
            if (state.hasUnsavedChanges && confirm('⚠️ Сохранить?')) {
                saveCurrentChest();
            }
            var panel = document.getElementById('adminPanel');
            if (panel) panel.classList.remove('active');
        });
    }

    // ---- КНОПКА ГРОМКОСТИ (🔊) ----
    var soundTrigger = document.getElementById('soundTrigger');
    if (soundTrigger) {
        soundTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            var panel = document.getElementById('volumePanel');
            if (panel) panel.classList.toggle('active');
        });
    }

    // ---- СЛАЙДЕР ГРОМКОСТИ ----
    var volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            state.globalVolume = parseInt(this.value) / 100;

            if (state.currentNetflixAudio) {
                state.currentNetflixAudio.volume = state.chestAudioVolume * state.globalVolume * 0.9;
            }
            if (state.currentChestAudio) {
                state.currentChestAudio.volume = state.chestAudioVolume * state.globalVolume;
            }
            if (state.currentAnnoyingAudio) {
                state.currentAnnoyingAudio.volume = state.chestAudioVolume * state.globalVolume;
            }
            if (state.viewerAudio) {
                state.viewerAudio.volume = state.chestAudioVolume * state.globalVolume;
            }
            if (state.putinAudio) {
                state.putinAudio.volume = state.chestAudioVolume * state.globalVolume;
            }
            
            if (typeof window.updateBeatGlowVolume === 'function') {
                window.updateBeatGlowVolume();
            }

            updateVolumeUI();
            localStorage.setItem('magicVolume', state.globalVolume);
        });
    }

    // ---- КНОПКА ВЫБОРА ФОНА (🎨) ----
    var bgTrigger = document.getElementById('bgTrigger');
    if (bgTrigger) {
        bgTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            var panel = document.getElementById('bgPanel');
            if (panel) panel.classList.toggle('active');
        });
    }

    // ---- ОБРАБОТЧИКИ ВЫБОРА ФОНА ----
    var bgOptions = document.querySelectorAll('.bg-option');
    bgOptions.forEach(function(o) {
        o.addEventListener('click', function(e) {
            e.stopPropagation();
            var bg = o.getAttribute('data-bg');
            if (bg && BG_PRESETS[bg]) {
                applyBackground(bg);
                var panel = document.getElementById('bgPanel');
                if (panel) panel.classList.remove('active');
            }
        });
    });

    // ---- КНОПКА ПРИМЕНЕНИЯ СВОЕГО ФОНА ----
    var applyCustomBgBtn = document.getElementById('applyCustomBgBtn');
    if (applyCustomBgBtn) {
        applyCustomBgBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var urlInput = document.getElementById('customBgUrlInput');
            var url = urlInput ? urlInput.value.trim() : '';
            if (url) {
                applyBackground('custom', url);
                var panel = document.getElementById('bgPanel');
                if (panel) panel.classList.remove('active');
            } else {
                alert('⚠️ Введите URL');
            }
        });
    }

    // ---- КНОПКА СБРОСА ИГРЫ ----
    var resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }

    // ---- КНОПКА «ДАТЬ НОМЕРА ВСЕМ» ----
    var giveAllNumbersBtn = document.getElementById('giveAllNumbersBtn');
    if (giveAllNumbersBtn) {
        giveAllNumbersBtn.addEventListener('click', giveAllNumbers);
    }

    // ---- КНОПКА ПРИМЕНЕНИЯ КОЛИЧЕСТВА УЧАСТНИКОВ ----
    var applyCountBtn = document.getElementById('applyCountBtn');
    if (applyCountBtn) {
        applyCountBtn.addEventListener('click', function() {
            var input = document.getElementById('participantCount');
            state.totalNumbers = parseInt(input ? input.value : 8) || 8;
            initState();
            renderAll();
            updateTurnIndicator();
            renderChestTabs();
            renderAnnoyingChestButtons();
            updateChestSettingsUIForChest(1);
        });
    }

    // ---- ПИКЕР ЦВЕТА КОРОБКИ (в админ-панели) ----
    var colorCircles = document.querySelectorAll('#colorPicker .color-circle');
    colorCircles.forEach(function(c) {
        c.addEventListener('click', function() {
            var idx = state.currentEditingChest || 1;
            state.chestColors[idx] = this.getAttribute('data-color');
            updateColorPicker(idx);
            state.hasUnsavedChanges = true;
            updateUnsavedIndicator();
            renderAll();
            renderChestTabs();
            updatePreviewChest();
        });
    });

    // ---- КНОПКА «ПРИМЕНИТЬ ЦВЕТ КО ВСЕМ» ----
    var applyAllColorsBtn = document.getElementById('applyAllColorsBtn');
    if (applyAllColorsBtn) {
        applyAllColorsBtn.addEventListener('click', function() {
            var ac = document.querySelector('#colorPicker .color-circle.active');
            if (!ac) return;
            for (var i = 1; i <= state.totalNumbers; i++) {
                state.chestColors[i] = ac.getAttribute('data-color');
            }
            renderAll();
            state.hasUnsavedChanges = true;
            updateUnsavedIndicator();
            renderChestTabs();
        });
    }

    // ---- СЕЛЕКТОР ТИПА: ПРИЗ ----
    var typePrize = document.getElementById('typePrize');
    if (typePrize) {
        typePrize.addEventListener('click', function() {
            if (state.currentEditingChest) {
                state.chestTypes[state.currentEditingChest] = 'prize';
                updateTypeSelector(state.currentEditingChest);
                state.hasUnsavedChanges = true;
                updateUnsavedIndicator();
            }
        });
    }

    // ---- СЕЛЕКТОР ТИПА: ЗАДАНИЕ ----
    var typeTask = document.getElementById('typeTask');
    if (typeTask) {
        typeTask.addEventListener('click', function() {
            if (state.currentEditingChest) {
                state.chestTypes[state.currentEditingChest] = 'task';
                updateTypeSelector(state.currentEditingChest);
                state.hasUnsavedChanges = true;
                updateUnsavedIndicator();
            }
        });
    }

    // ---- ПОЛЕ ВВОДА СОДЕРЖИМОГО КОРОБКИ ----
    var chestContentInput = document.getElementById('chestContentInput');
    if (chestContentInput) {
        chestContentInput.addEventListener('input', function() {
            state.hasUnsavedChanges = true;
            updateUnsavedIndicator();
            updatePreview();
        });
    }

    // ---- КНОПКА «СОХРАНИТЬ» СОДЕРЖИМОЕ ----
    var saveChestContentBtn = document.getElementById('saveChestContentBtn');
    if (saveChestContentBtn) {
        saveChestContentBtn.addEventListener('click', function() {
            saveCurrentChest();
            alert('✅ Сохранено!');
        });
    }

    // ---- КНОПКА «СБРОСИТЬ ВСЁ» ----
    var resetAllChestsBtn = document.getElementById('resetAllChestsBtn');
    if (resetAllChestsBtn) {
        resetAllChestsBtn.addEventListener('click', function() {
            if (confirm('⚠️ Сбросить всё содержимое коробок?')) {
                initState();
                renderAll();
                updateTurnIndicator();
            }
        });
    }

    // ---- КНОПКА ЭКСПОРТА НАСТРОЕК (с аватарами) ----
    var exportSettingsBtn = document.getElementById('exportSettingsBtn');
    if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', function() {
            if (state.hasUnsavedChanges) {
                alert('⚠️ Сохраните изменения перед экспортом!');
                return;
            }
            // Получаем полные настройки (включая аватары)
            var settings = exportFullSettings();
            var blob = new Blob([settings], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'коробки-настройки.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('✅ Настройки экспортированы! Аватары сохранены.');
        });
    }

    // ---- КНОПКА ИМПОРТА НАСТРОЕК (в админ-панели) ----
    var importSettingsBtn = document.getElementById('importSettingsBtn');
    var importFileInput = document.getElementById('importFileInput');
    if (importSettingsBtn && importFileInput) {
        importSettingsBtn.addEventListener('click', function() {
            importFileInput.click();
        });
    }

    // ---- КНОПКА ИМПОРТА НАСТРОЕК (основная, 📥) ----
    var mainImportTrigger = document.getElementById('mainImportTrigger');
    var mainImportFileInput = document.getElementById('mainImportFileInput');
    if (mainImportTrigger && mainImportFileInput) {
        mainImportTrigger.addEventListener('click', function() {
            mainImportFileInput.click();
        });
    }

    // ---- ОБРАБОТЧИК ЗАГРУЗКИ ФАЙЛА ИМПОРТА (с аватарами) ----
    function handleFileImport(fileInput) {
        if (!fileInput) return;
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        importSettings(e.target.result);
                        // Дополнительная синхронизация аватаров
                        if (typeof syncAvatarsAfterImport === 'function') {
                            syncAvatarsAfterImport();
                        }
                        alert('✅ Настройки импортированы! Аватары восстановлены.');
                    } catch (err) {
                        alert('Ошибка импорта: ' + err.message);
                    }
                };
                reader.readAsText(this.files[0]);
                this.value = '';
            }
        });
    }
    handleFileImport(document.getElementById('importFileInput'));
    handleFileImport(document.getElementById('mainImportFileInput'));

    // ---- КНОПКИ ФОРМАТИРОВАНИЯ ТЕКСТА (B, I, цвет, выравнивание) ----
    var formatBtns = document.querySelectorAll('.format-btn');
    formatBtns.forEach(function(b) {
        b.addEventListener('click', function() {
            var f = b.getAttribute('data-format');
            if (!f) return;

            var ta = document.getElementById('chestContentInput');
            if (!ta) return;

            var st = ta.selectionStart;
            var en = ta.selectionEnd;
            var tx = ta.value;
            var idx = state.currentEditingChest || 1;

            switch (f) {
                case 'bold':
                    // Оборачиваем выделенный текст в **...**
                    ta.value = tx.substring(0, st) + '**' + tx.substring(st, en) + '**' + tx.substring(en);
                    ta.selectionStart = st + 2;
                    ta.selectionEnd = en + 2;
                    break;
                case 'italic':
                    // Оборачиваем в *...*
                    ta.value = tx.substring(0, st) + '*' + tx.substring(st, en) + '*' + tx.substring(en);
                    ta.selectionStart = st + 1;
                    ta.selectionEnd = en + 1;
                    break;
                case 'color':
                    var col = prompt('Цвет (gold, #ffd700):', 'gold');
                    if (col) {
                        ta.value = tx.substring(0, st) +
                            '<span style="color:' + col + '">' +
                            tx.substring(st, en) +
                            '</span>' +
                            tx.substring(en);
                    }
                    break;
                case 'clear':
                    // Очищаем форматирование
                    ta.value = tx.substring(0, st) +
                        tx.substring(st, en).replace(/\*\*|\*|<[^>]+>/g, '') +
                        tx.substring(en);
                    break;
                case 'align-left':
                    state.chestAligns[idx] = 'left';
                    state.hasUnsavedChanges = true;
                    updateUnsavedIndicator();
                    updatePreview();
                    break;
                case 'align-center':
                    state.chestAligns[idx] = 'center';
                    state.hasUnsavedChanges = true;
                    updateUnsavedIndicator();
                    updatePreview();
                    break;
                case 'align-right':
                    state.chestAligns[idx] = 'right';
                    state.hasUnsavedChanges = true;
                    updateUnsavedIndicator();
                    updatePreview();
                    break;
            }

            ta.focus();
            state.hasUnsavedChanges = true;
            updateUnsavedIndicator();
        });
    });

    // ---- ЧЕКБОКС РЕЖИМА «ЗАДОЛБАЛ» ----
    var enableAnnoyingCheckbox = document.getElementById('enableAnnoyingChestCheckbox');
    if (enableAnnoyingCheckbox) {
        enableAnnoyingCheckbox.addEventListener('change', function() {
            state.annoyingChestEnabled = this.checked;
            localStorage.setItem('annoyingChestEnabled', state.annoyingChestEnabled);

            var row = document.getElementById('annoyingChestSelectorRow');
            if (row) row.style.opacity = state.annoyingChestEnabled ? '1' : '0.7';

            if (!state.annoyingChestNumber && state.annoyingChestEnabled) {
                state.annoyingChestNumber = 1;
                localStorage.setItem('annoyingChestNumber', 1);
                renderAnnoyingChestButtons();
            }
        });
    }

    // ---- ЧЕКБОКС КОРОБКИ ЗРИТЕЛЕЙ ----
    var enableViewerCheckbox = document.getElementById('enableViewerChestCheckbox');
    if (enableViewerCheckbox) {
        enableViewerCheckbox.addEventListener('change', function() {
            state.viewerChestEnabled = this.checked;
            localStorage.setItem('viewerChestEnabled', state.viewerChestEnabled);
            updateViewerChestVisibility();
        });
    }

    // ---- ЧЕКБОКС КОРОБКИ PUTIN ----
    var enablePutinCheckbox = document.getElementById('enablePutinChestCheckbox');
    if (enablePutinCheckbox) {
        enablePutinCheckbox.addEventListener('change', function() {
            state.putinChestEnabled = this.checked;
            localStorage.setItem('putinChestEnabled', state.putinChestEnabled);
            updatePutinChestVisibility();
            resetPutinUI();
        });
    }

    // ---- СЕЛЕКТ КОЛИЧЕСТВА ПОДКРУТОК PUTIN ----
    var putinMaxShufflesSelect = document.getElementById('putinMaxShufflesSelect');
    if (putinMaxShufflesSelect) {
        putinMaxShufflesSelect.addEventListener('change', function() {
            state.putinMaxShuffles = parseInt(this.value);
            localStorage.setItem('putinMaxShuffles', state.putinMaxShuffles);
            var counter = document.getElementById('putinCounterV');
            if (counter) counter.textContent = 'Осталось подкруток: ' + state.putinMaxShuffles;
        });
    }

    // ---- ПОЛЯ АУДИО КОРОБКИ ЗРИТЕЛЕЙ ----
    var vau1 = document.getElementById('viewerAudio1UrlInput');
    var vau2 = document.getElementById('viewerAudio2UrlInput');
    var vau3 = document.getElementById('viewerAudio3UrlInput');
    if (vau1) { vau1.addEventListener('change', function() { state.viewerAudio1Url = this.value; localStorage.setItem('viewerAudio1Url', this.value); }); }
    if (vau2) { vau2.addEventListener('change', function() { state.viewerAudio2Url = this.value; localStorage.setItem('viewerAudio2Url', this.value); }); }
    if (vau3) { vau3.addEventListener('change', function() { state.viewerAudio3Url = this.value; localStorage.setItem('viewerAudio3Url', this.value); }); }

    // ---- ПОЛЯ АУДИО КОРОБКИ PUTIN ----
    var p1u = document.getElementById('putinAudio1UrlInput');
    var p2u = document.getElementById('putinAudio2UrlInput');
    if (p1u) { p1u.addEventListener('change', function() { state.putinAudio1Url = this.value; localStorage.setItem('putinAudio1Url', this.value); }); }
    if (p2u) { p2u.addEventListener('change', function() { state.putinAudio2Url = this.value; localStorage.setItem('putinAudio2Url', this.value); }); }

    // ---- КНОПКИ ТЕСТА АУДИО ----
    var testViewerAudio1 = document.getElementById('testViewerAudio1Btn');
    var testViewerAudio2 = document.getElementById('testViewerAudio2Btn');
    var testViewerAudio3 = document.getElementById('testViewerAudio3Btn');
    var testPutinAudio1 = document.getElementById('testPutinAudio1Btn');
    var testPutinAudio2 = document.getElementById('testPutinAudio2Btn');
    var testChestAudio = document.getElementById('testChestAudioBtn');
    var testAnnoyingAudio = document.getElementById('testAnnoyingAudioBtn');

    if (testViewerAudio1) { testViewerAudio1.addEventListener('click', function() { if (state.viewerAudio1Url) AudioManager.testAudio(state.viewerAudio1Url); else alert('Введите URL аудио 1'); }); }
    if (testViewerAudio2) { testViewerAudio2.addEventListener('click', function() { if (state.viewerAudio2Url) AudioManager.testAudio(state.viewerAudio2Url); else alert('Введите URL аудио 2'); }); }
    if (testViewerAudio3) { testViewerAudio3.addEventListener('click', function() { if (state.viewerAudio3Url) AudioManager.testAudio(state.viewerAudio3Url); else alert('Введите URL аудио 3'); }); }
    if (testPutinAudio1) { testPutinAudio1.addEventListener('click', function() { if (state.putinAudio1Url) AudioManager.testAudio(state.putinAudio1Url); else alert('Введите URL аудио'); }); }
    if (testPutinAudio2) { testPutinAudio2.addEventListener('click', function() { if (state.putinAudio2Url) AudioManager.testAudio(state.putinAudio2Url); else alert('Введите URL аудио'); }); }
    if (testChestAudio) { testChestAudio.addEventListener('click', function() { var url = document.getElementById('chestAudioUrl'); if (url && url.value) AudioManager.testAudio(url.value); else alert('Введите URL аудио'); }); }
    if (testAnnoyingAudio) { testAnnoyingAudio.addEventListener('click', function() { var url = document.getElementById('annoyingAudioUrl'); if (url && url.value) AudioManager.testAudio(url.value); else alert('Введите URL аудио'); }); }

    // ---- ПИКЕР ЦВЕТА КОРОБКИ ЗРИТЕЛЕЙ ----
    var viewerColorCircles = document.querySelectorAll('#viewerColorPicker .color-circle');
    viewerColorCircles.forEach(function(c) {
        c.addEventListener('click', function() {
            state.viewerChestColor = this.getAttribute('data-color');
            localStorage.setItem('viewerChestColor', state.viewerChestColor);

            // Снимаем выделение со всех и ставим на этот
            viewerColorCircles.forEach(function(d) { d.classList.remove('active'); });
            this.classList.add('active');

            // Обновляем цвет коробки зрителей
            var box = document.getElementById('giftBoxViewer');
            if (box) {
                var colorClasses = ['vc1', 'vc2', 'vc3', 'vc4', 'vc5', 'vc6', 'vc7', 'vc8'];
                colorClasses.forEach(function(cc) { box.classList.remove(cc); });
                box.classList.add(state.viewerChestColor);
            }
        });
    });

    // ---- ПИКЕР ЦВЕТА КОРОБКИ PUTIN ----
    var putinColorCircles = document.querySelectorAll('#putinColorPicker .color-circle');
    putinColorCircles.forEach(function(c) {
        c.addEventListener('click', function() {
            state.putinChestColor = this.getAttribute('data-color');
            localStorage.setItem('putinChestColor', state.putinChestColor);

            putinColorCircles.forEach(function(d) { d.classList.remove('active'); });
            this.classList.add('active');

            var box = document.getElementById('putinGiftBoxViewerV');
            if (box) {
                var colorClasses = ['vc1', 'vc2', 'vc3', 'vc4', 'vc5', 'vc6', 'vc7', 'vc8'];
                colorClasses.forEach(function(cc) { box.classList.remove(cc); });
                box.classList.add(state.putinChestColor);
            }
        });
    });

    // ---- СЛАЙДЕРЫ ПОВОРОТА КОРОБКИ (в админ-панели) ----
    var rotYSlider = document.getElementById('rotYSlider');
    var rotXSlider = document.getElementById('rotXSlider');
    if (rotYSlider) {
        rotYSlider.addEventListener('input', function() {
            var val = document.getElementById('rotYVal');
            var valDeg = parseInt(this.value) || 0;
            if (val) val.textContent = valDeg + '°';
            state.previewRotY = valDeg;
            updatePreviewChest();
        });
    }
    if (rotXSlider) {
        rotXSlider.addEventListener('input', function() {
            var val = document.getElementById('rotXVal');
            var valDeg = parseInt(this.value) || 0;
            if (val) val.textContent = valDeg + '°';
            state.previewRotX = valDeg;
            updatePreviewChest();
        });
    }

    // ---- КНОПКА «ПРИМЕНИТЬ» (поворот одной коробки) ----
    var applyChestSettingsBtn = document.getElementById('applyChestSettingsBtn');
    if (applyChestSettingsBtn) {
        applyChestSettingsBtn.addEventListener('click', function() {
            var n = state.currentEditingChest || 1;
            if (rotYSlider) state.chestRotY[n] = parseInt(rotYSlider.value || -30);
            if (rotXSlider) state.chestRotX[n] = parseInt(rotXSlider.value || -15);
            state.previewRotY = state.chestRotY[n];
            state.previewRotX = state.chestRotX[n];
            renderChests();
            updateChestSettingsUIForChest(n);
            updatePreviewChest();
        });
    }

    // ---- КНОПКА «КО ВСЕМ» (применить поворот ко всем коробкам) ----
    var applyAllChestsBtn = document.getElementById('applyAllChestsBtn');
    if (applyAllChestsBtn) {
        applyAllChestsBtn.addEventListener('click', function() {
            var rY = parseInt(rotYSlider ? rotYSlider.value : -30);
            var rX = parseInt(rotXSlider ? rotXSlider.value : -15);
            for (var i = 1; i <= state.totalNumbers; i++) {
                state.chestRotY[i] = rY;
                state.chestRotX[i] = rX;
            }
            renderChests();
            updatePreviewChest();
        });
    }

    // ---- КНОПКА ОТКРЫТЬ/ЗАКРЫТЬ В ПРЕДПРОСМОТРЕ ----
    var previewToggleBtn = document.getElementById('previewToggleBtn');
    if (previewToggleBtn) {
        previewToggleBtn.addEventListener('click', function() {
            var scene = document.getElementById('previewScene');
            var box = scene ? scene.querySelector('.gift-box') : null;
            if (box) box.classList.toggle('opened');
        });
    }

    // ---- ПОЛЕ АУДИО ДЛЯ РЕЖИМА «ЗАДОЛБАЛ» ----
    var annoyingAudioUrl = document.getElementById('annoyingAudioUrl');
    if (annoyingAudioUrl) {
        annoyingAudioUrl.addEventListener('change', function() {
            state.annoyingAudioUrl = this.value;
            localStorage.setItem('annoyingAudioUrl', this.value);
        });
    }

    // ---- ПОЛЕ АУДИО ДЛЯ КОРОБКИ (в редакторе) ----
    var chestAudioUrl = document.getElementById('chestAudioUrl');
    if (chestAudioUrl) {
        chestAudioUrl.addEventListener('change', function() {
            if (state.currentEditingChest) {
                state.chestAudioUrls[state.currentEditingChest] = this.value;
            }
        });
    }

    // ---- СЛАЙДЕРЫ ГРОМКОСТИ В АДМИН-ПАНЕЛИ ----
    var uiSlider = document.getElementById('uiVolumeSlider');
    var chestAudioSlider = document.getElementById('chestAudioVolumeSlider');

    if (uiSlider) {
        uiSlider.addEventListener('input', function() {
            state.uiVolume = parseInt(this.value) / 100;
            localStorage.setItem('uiVolume', state.uiVolume);
            var valEl = document.getElementById('uiVolumeVal');
            if (valEl) valEl.textContent = this.value + '%';
        });
    }
    if (chestAudioSlider) {
        chestAudioSlider.addEventListener('input', function() {
            state.chestAudioVolume = parseInt(this.value) / 100;
            localStorage.setItem('chestAudioVolume', state.chestAudioVolume);
            var valEl = document.getElementById('chestAudioVolumeVal');
            if (valEl) valEl.textContent = this.value + '%';
            if (state.currentChestAudio) state.currentChestAudio.volume = state.chestAudioVolume * state.globalVolume;
            if (state.viewerAudio) state.viewerAudio.volume = state.chestAudioVolume * state.globalVolume;
            
            // ⭐ ОБНОВЛЯЕМ ГРОМКОСТЬ BEAT-ЭФФЕКТА
            if (typeof window.updateBeatGlowVolume === 'function') {
                window.updateBeatGlowVolume();
            }
        });
    }

    // ---- ЗАКРЫТИЕ ПАНЕЛЕЙ ПРИ КЛИКЕ МИМО ----
    document.addEventListener('click', function(e) {
        var vp = document.getElementById('volumePanel');
        var st = document.getElementById('soundTrigger');
        if (vp && !vp.contains(e.target) && e.target !== st && !st.contains(e.target)) {
            vp.classList.remove('active');
        }

        var bp = document.getElementById('bgPanel');
        var bt = document.getElementById('bgTrigger');
        if (bp && !bp.contains(e.target) && e.target !== bt && !bt.contains(e.target)) {
            bp.classList.remove('active');
        }
    });
}

// ---- ПЕРЕТАСКИВАНИЕ ПРЕДПРОСМОТРА КОРОБКИ МЫШКОЙ ----

function enablePreviewDrag() {
    var scene = document.getElementById('previewScene');
    if (!scene) return;

    // Мышь
    scene.addEventListener('mousedown', function(e) {
        if (state.isCountingDown || state.isAnimating) return;
        state.previewDragging = true;
        state.previewStartX = e.clientX;
        state.previewStartY = e.clientY;
        e.preventDefault();
    });

    window.addEventListener('mousemove', function(e) {
        if (!state.previewDragging) return;
        var dx = e.clientX - state.previewStartX;
        var dy = e.clientY - state.previewStartY;
        state.previewRotY += dx * 0.5;
        state.previewRotX -= dy * 0.5;
        state.previewRotX = Math.max(-90, Math.min(90, state.previewRotX));
        updatePreviewChest();
        state.previewStartX = e.clientX;
        state.previewStartY = e.clientY;
    });

    window.addEventListener('mouseup', function() {
        state.previewDragging = false;
    });

    // Тач
    scene.addEventListener('touchstart', function(e) {
        if (state.isCountingDown || state.isAnimating) return;
        state.previewDragging = true;
        state.previewStartX = e.touches[0].clientX;
        state.previewStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', function(e) {
        if (!state.previewDragging) return;
        var dx = e.touches[0].clientX - state.previewStartX;
        var dy = e.touches[0].clientY - state.previewStartY;
        state.previewRotY += dx * 0.5;
        state.previewRotX -= dy * 0.5;
        state.previewRotX = Math.max(-90, Math.min(90, state.previewRotX));
        updatePreviewChest();
        state.previewStartX = e.touches[0].clientX;
        state.previewStartY = e.touches[0].clientY;
    });

    window.addEventListener('touchend', function() {
        state.previewDragging = false;
    });
}

// ---- ГЛОБАЛЬНЫЕ СЛУШАТЕЛИ ----

function initGlobalListeners() {
    // Первый клик — инициализация AudioContext (требование браузеров)
    document.addEventListener('click', function() {
        SoundEngine.init();
        if (state.audioCtx && state.audioCtx.state === 'suspended') {
            state.audioCtx.resume();
        }
    }, { once: true });

    // Звуки при кликах по разным элементам
    document.addEventListener('click', function(e) {
        // Не играем звук при кликах по полям ввода
        if (e.target.closest('input')) return;
        if (e.target.closest('textarea')) return;
        if (e.target.closest('select')) return;
        if (e.target.closest('.modal-overlay')) return;
        if (e.target.closest('#epicOverlay')) return;
        if (e.target.closest('#volumePanel')) return;
        if (e.target.closest('#bgPanel')) return;

        // Для кнопок
        if (e.target.closest('button')) {
            SoundEngine.playTone(600, 0.04, 'sine', 0.06);
            return;
        }
        // Для карточек участников
        if (e.target.closest('.participant-cell')) {
            SoundEngine.playTone(880, 0.04, 'sine', 0.06);
            return;
        }
        // Для коробок
        if (e.target.closest('.box-wrapper')) {
            SoundEngine.playTone(1200, 0.04, 'sine', 0.06);
            return;
        }

        // Тихий клик для всего остального
        SoundEngine.playTone(400, 0.03, 'sine', 0.03);
    });

    // Клавиатура для туториала
    document.addEventListener('keydown', function(e) {
        if (document.getElementById('tutorialFrame').style.display !== 'block') return;
        if (e.key === 'Enter') tutorialNext();
        if (e.key === 'ArrowLeft') tutorialPrev();
        if (e.key === 'Escape') tutorialClose();
    });
}

// =====================================================
// СИНХРОНИЗАЦИЯ АВАТАРОВ ПОСЛЕ ИМПОРТА
// =====================================================

function syncAvatarsAfterImport() {
    // Принудительно обновляем отображение аватаров на карточках
    if (typeof renderAll === 'function') {
        renderAll();
    }
    // Обновляем PUTIN-таблицу, если она открыта
    if (typeof renderPutinTables === 'function') {
        renderPutinTables();
    }
    // Сохраняем аватары в localStorage
    try {
        localStorage.setItem('avatars', JSON.stringify(state.avatars || {}));
    } catch(e) {}
}

// =====================================================
// ТОЧКА ВХОДА: ЗАПУСК ВСЕГО
// =====================================================

(function() {
    // 1. Инициализируем состояние
    initState();

    // 2. Загружаем сохранённые настройки
    loadSavedSettings();
    
    // 2.1 Инициализируем систему аватаров
    if (typeof initAvatarSystem === 'function') {
        initAvatarSystem();
    }
    
    // 2.2 Обновляем чек-боксы админ-панели (даже если панель не открыта)
    var ach = document.getElementById('enableAnnoyingChestCheckbox');
    if (ach) ach.checked = state.annoyingChestEnabled;
    
    var vch = document.getElementById('enableViewerChestCheckbox');
    if (vch) vch.checked = state.viewerChestEnabled;
    
    var pch = document.getElementById('enablePutinChestCheckbox');
    if (pch) pch.checked = state.putinChestEnabled;

    // 3. Настраиваем обработчики событий
    initEventListeners();

    // 4. Включаем перетаскивание превью
    enablePreviewDrag();

    // 5. Рисуем интерфейс
    renderAll();
    updateTurnIndicator();
    updateBgPanelActive();
    renderAnnoyingChestButtons();
    renderSparksTabs();

    // 6. Запускаем idle-анимации
    IdleEngine.start();

    // 7. Инициализируем Коробку Зрителей
    initViewerChest();

    // 8. Инициализируем Коробку PUTIN
    initPutinChest();

    // 9. Глобальные слушатели
    initGlobalListeners();

    // 10. Кнопка обучения (💡)
    var tutorialTrigger = document.getElementById('tutorialTrigger');
    if (tutorialTrigger) {
        tutorialTrigger.addEventListener('click', function() {
            localStorage.removeItem('tutorialCompleted');
            tutorialStart();
        });
    }

    // Кнопки навигации в туториале
    var tutorialNextBtn = document.getElementById('tutorialNext');
    var tutorialPrevBtn = document.getElementById('tutorialPrev');
    var tutorialSkipBtn = document.getElementById('tutorialSkip');

    if (tutorialNextBtn) tutorialNextBtn.addEventListener('click', tutorialNext);
    if (tutorialPrevBtn) tutorialPrevBtn.addEventListener('click', tutorialPrev);
    if (tutorialSkipBtn) tutorialSkipBtn.addEventListener('click', tutorialClose);

    // 11. Автозапуск туториала при первом посещении
    if (!localStorage.getItem('tutorialCompleted')) {
        setTimeout(tutorialStart, 800);
    }
})();