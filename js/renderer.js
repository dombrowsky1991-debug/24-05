// =====================================================
// renderer.js — Отрисовка интерфейса
// Здесь всё, что связано с появлением элементов на экране:
//   - карточки участников (сетка 4×2)
//   - 3D-коробки (сетка 4×2)
//   - вкладки в админ-панели
//   - превью коробки
//   - фон страницы
//   - индикатор громкости
// =====================================================

// ---- ОТРИСОВКА КАРТОЧЕК УЧАСТНИКОВ ----

function renderParticipants() {
    var grid = document.getElementById('participantsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    var frag = document.createDocumentFragment();

    state.participants.forEach(function(p, idx) {
        var cell = document.createElement('div');
        cell.className = 'participant-cell';

        // Подсветка выбранного участника
        if (state.selectedParticipantIndex === idx && !p.blockedByAnnoying && !p.hasOpenedChest) {
            cell.classList.add('active-cell');
        }

        // Затемнение для уже открывших коробку
        if (p.hasOpenedChest) {
            cell.classList.add('dimmed-card');
        }

        // Красная рамка для "консерваторов" (режим "Задолбал")
        if (p.blockedByAnnoying) {
            cell.classList.add('conservative-card');
        }

        // Стиль "имя введено"
        if (p.name.trim() !== '') {
            cell.classList.add('filled');
        }

        // ---- Отображаемое имя ----
        var nameDisplay = document.createElement('div');
        nameDisplay.className = 'name-display';
        nameDisplay.textContent = p.name;
        nameDisplay.setAttribute('data-name', p.name);

        // ---- Поле ввода имени ----
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'name-input';
        inp.placeholder = 'Имя...';
        inp.value = p.name;

        // При клике на поле ввода — начинаем редактирование
        inp.addEventListener('click', function(e) {
            e.stopPropagation();
            cell.classList.add('editing');
            cell.classList.remove('filled');
            inp.focus();
        });

        // При клике на имя — тоже начинаем редактирование
        nameDisplay.addEventListener('click', function(e) {
            e.stopPropagation();
            cell.classList.add('editing');
            cell.classList.remove('filled');
            inp.focus();
        });

        // Когда убрали фокус с поля ввода — сохраняем имя
        inp.addEventListener('blur', function() {
            p.name = inp.value.trim();
            inp.value = p.name;
            nameDisplay.textContent = p.name;
            nameDisplay.setAttribute('data-name', p.name);
            cell.classList.remove('editing');
            if (p.name !== '') {
                cell.classList.add('filled');
            } else {
                cell.classList.remove('filled');
            }
            
            // ОБНОВЛЯЕМ АВАТАР (инициалы в плейсхолдере)
            var avatarWrapper = cell.querySelector('.avatar-wrapper');
            if (avatarWrapper) {
                var placeholder = avatarWrapper.querySelector('.avatar-placeholder');
                if (placeholder) {
                    placeholder.textContent = getInitials(p.name);
                }
            }
            
            updateTurnIndicator();
            updateButtonsState();
        });

        // Enter — завершить редактирование
        inp.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') inp.blur();
        });

        // ---- Номер участника ----
        var nd = document.createElement('div');
        nd.className = 'assigned-number';
        nd.id = 'num-' + idx;
        nd.textContent = p.assignedNumber !== null ? p.assignedNumber : '-';

        // ---- Статус под карточкой ----
        var st = document.createElement('div');
        st.className = 'card-status-text';

        if (p.hasOpenedChest) {
            st.classList.add('chest-opened-text');
            st.textContent = 'Коробка открыта';
        } else if (p.blockedByAnnoying) {
            st.classList.add('conservative-text');
            st.textContent = '⚠ Консерватор';
        }

        // ---- Клик по карточке (выбор участника) ----
        cell.addEventListener('click', function() {
            if (state.isAnimating || state.atomicAction || state.isCountingDown || state.isAnyModalOpen) return;
            if (p.hasOpenedChest || p.blockedByAnnoying) return;
            if (p.assignedNumber === null) {
                updateTurnIndicator('⚠️ Нажмите «Дать номера всем»!', true);
                return;
            }
            selectParticipant(idx);
        });

        // Собираем карточку
        cell.appendChild(inp);
        cell.appendChild(nameDisplay);
        cell.appendChild(nd);
        cell.appendChild(st);
        
        // Аватар
        renderAvatar(cell, p, idx);        

        frag.appendChild(cell);
    });

    grid.appendChild(frag);

    // Обновляем цвет кнопок
    updateButtonsState();
}

// ---- ВЫБОР УЧАСТНИКА ----

function selectParticipant(idx) {
    if (state.isCountingDown || state.isAnyModalOpen) return;

    var p = state.participants[idx];

    if (p.assignedNumber === null) {
        updateTurnIndicator('⚠️ Сначала выдайте номера!', true);
        return;
    }

    if (p.hasOpenedChest || p.blockedByAnnoying) return;

    // Если кликнули по уже выбранному — снимаем выбор
    if (state.selectedParticipantIndex === idx) {
        state.selectedParticipantIndex = null;
    } else {
        state.selectedParticipantIndex = idx;
    }

    renderParticipants();
    updateTurnIndicator();
}

// ---- ОТРИСОВКА 3D-КОРОБОК ----

function renderChests() {
    var grid = document.getElementById('chestsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    var total = state.totalNumbers;
    var frag = document.createDocumentFragment();

    for (var i = 1; i <= total; i++) {
        var chest = state.chestsState[i];
        if (!chest) {
            chest = { opened: false, ownerName: null, ownerNumber: null };
            state.chestsState[i] = chest;
        }

        var cc = state.chestColors[i] || 'c1';
        var ld = state.lockedChests[i];
        var isLocked = (ld && ld.isLocked) ? true : false;

        var wrapper = document.createElement('div');
        wrapper.className = 'box-wrapper';
        if (isLocked) wrapper.classList.add('locked');

        wrapper.innerHTML = '<div class="box-shadow"></div>';

        var scene = document.createElement('div');
        scene.className = 'scene';

        var box = createGiftBox(i, cc, isLocked);
        scene.appendChild(box);
        wrapper.appendChild(scene);

        if (chest.opened) {
            var lbl = document.createElement('div');
            lbl.style.cssText = 'font-size:0.85rem;font-weight:700;color:#ffd700;text-align:center;background:rgba(0,0,0,0.7);padding:0.4rem 0.3rem;border-radius:1rem;width:90%;margin-top:0.5rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.15rem;';
            
            var originalTypeText = (chest.originalType === 'prize') ? '🎁 ПРИЗ' : '📋 ЗАДАНИЕ';
            
            // Первая строка: имя и номер
            var line1 = document.createElement('div');
            line1.textContent = chest.ownerName + ' (№' + chest.ownerNumber + ')';
            line1.style.textAlign = 'center';
            line1.style.fontSize = '0.8rem';
            
            // Вторая строка: тип
            var line2 = document.createElement('div');
            line2.textContent = originalTypeText;
            line2.style.fontSize = '0.7rem';
            line2.style.opacity = '0.9';
            line2.style.textAlign = 'center';
            
            lbl.appendChild(line1);
            lbl.appendChild(line2);
            wrapper.appendChild(lbl);
        } else if (isLocked) {
            var lbl2 = document.createElement('div');
            lbl2.style.cssText = 'font-size:1rem;font-weight:700;color:#ff6666;text-align:center;background:rgba(0,0,0,0.7);padding:0.5rem 0.5rem;border-radius:1rem;width:90%;margin-top:0.5rem;';
            lbl2.textContent = 'Про*бано!';
            wrapper.appendChild(lbl2);
        }

        (function(chestIndex, chestBox) {
            wrapper.addEventListener('click', async function(e) {
                e.stopPropagation();
                if (state.isCountingDown || state.isAnimating || state.atomicAction || state.isAnyModalOpen) {
                    updateTurnIndicator('⚠️ Подождите, сейчас идёт открытие другой коробки!', true);
                    return;
                }
                IdleEngine.resetTimer();
                
                var currentChest = state.chestsState[chestIndex];
                var currentLocked = state.lockedChests[chestIndex];
                
                if (currentChest && currentChest.opened) {
                    ModalManager.showChestContent(chestIndex);
                    return;
                }
                if (!allNumbersAssigned()) {
                    updateTurnIndicator('⚠️ Сначала выдайте все номера!', true);
                    return;
                }
                if (currentLocked && currentLocked.isLocked) {
                    await ModalManager.showBlocked(currentLocked.reason);
                    return;
                }
                await tryOpenChest(chestIndex, chestBox);
            });
        })(i, box);

        frag.appendChild(wrapper);
    }

    grid.appendChild(frag);
    IdleEngine.start();

    // Обновляем цвет кнопок
    updateButtonsState();
}

// ---- СОЗДАНИЕ 3D-КОРОБКИ (HTML-структура) ----

function createGiftBox(number, colorClass, isLocked) {
    var box = document.createElement('div');
    box.className = 'gift-box ' + colorClass;
    box.id = 'box-' + number;

    if (isLocked) box.classList.add('locked');

    // Устанавливаем поворот из настроек
    box.style.setProperty('--rotY', (state.chestRotY[number] !== undefined ? state.chestRotY[number] : -30) + 'deg');
    box.style.setProperty('--rotX', (state.chestRotX[number] !== undefined ? state.chestRotX[number] : -15) + 'deg');

    // Если коробка уже открыта — сразу добавляем класс opened
    if (state.chestsState[number] && state.chestsState[number].opened) {
        box.classList.add('opened');
    }

    // Собираем HTML коробки:
    //   крышка (lid)
    //   4 боковые грани (face side)
    //   нижняя грань (face end)
    //   сургучная печать (wax-seal)
    //   свечение при наведении (hover-glow)
    //   вспышка при открытии (explosion-flash)
    //   искры (sparks-layer)
    box.innerHTML =
        '<div class="lid">' +
            '<div class="lid-side lid-front"></div>' +
            '<div class="lid-side lid-back"></div>' +
            '<div class="lid-side lid-left"></div>' +
            '<div class="lid-side lid-right"></div>' +
            '<div class="lid-top"></div>' +
        '</div>' +
        '<div class="face side box-front"></div>' +
        '<div class="face side box-back"></div>' +
        '<div class="face side box-left"></div>' +
        '<div class="face side box-right"></div>' +
        '<div class="face end box-bottom"></div>' +
        '<div class="wax-seal">' + number + '</div>' +
        '<div class="hover-glow"></div>' +
        '<div class="explosion-flash"></div>' +
        '<div class="sparks-layer"></div>';

    // Создаём искры, если они включены для этой коробки
    createSparks(box.querySelector('.sparks-layer'), state.chestSparks[number] === true);

    return box;
}

// ---- ВКЛАДКИ КОРОБОК В АДМИН-ПАНЕЛИ ----

function renderChestTabs() {
    var renderGroup = function(containerId, isAnnoying) {
        var container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        for (var i = 1; i <= state.totalNumbers; i++) {
            var tab = document.createElement('button');
            tab.className = 'chest-tab';
            tab.textContent = 'Коробка ' + i;

            var cc = state.chestColors[i] || 'c1';
            var isActive;

            if (isAnnoying) {
                isActive = state.annoyingChestNumber === i;
            } else {
                isActive = state.currentEditingChest === i;
            }

            // Цвет фона вкладки соответствует цвету коробки
            var colorMap = {
                c1: '#B00000', c2: '#2a5a9e', c3: '#e0b050', c4: '#2d7a2d',
                c5: '#8a7a60', c6: '#6a0572', c7: '#d35400', c8: '#c0392b', c9: '#4a6a7a'
            };
            var edgeMap = {
                c1: '#6e0000', c2: '#1a3a6a', c3: '#b8860b', c4: '#1a5a1a',
                c5: '#5a4a30', c6: '#3a0340', c7: '#7a2e00', c8: '#7b241c', c9: '#3a4550'
            };

            tab.style.background = 'linear-gradient(135deg, ' + (colorMap[cc] || '#B00000') + ', ' + (edgeMap[cc] || '#6e0000') + ')';

            if (cc === 'c9') {
                tab.style.background = 'linear-gradient(135deg, #4a6a7a, #6a4a7a, #7a6a4a)';
            }

            tab.style.opacity = isActive ? '1' : '0.5';

            if (isActive) {
                tab.classList.add('active');
            }

            // Клик по вкладке
            (function(chestNum) {
                tab.addEventListener('click', function() {
                    if (isAnnoying) {
                        if (!state.annoyingChestEnabled) return;
                        state.annoyingChestNumber = chestNum;
                        localStorage.setItem('annoyingChestNumber', chestNum);
                        var status = document.getElementById('annoyingChestStatus');
                        if (status) status.textContent = '✅ Выбрана коробка ' + chestNum;
                        renderAnnoyingChestButtons();
                    } else {
                        state.currentEditingChest = chestNum;
                        if (containerId === 'positionChestTabs') {
                            updateChestSettingsUIForChest(chestNum);
                        }
                        switchToChest(chestNum);
                    }
                    renderChests();
                    renderChestTabs();
                    updatePreviewChest();
                });
            })(i);

            container.appendChild(tab);
        }
    };

    renderGroup('chestTabs', false);
    renderGroup('positionChestTabs', false);
    renderGroup('annoyingChestButtons', true);
}

// ---- КНОПКИ ВЫБОРА "ЗАДАЛБИВАЮЩЕЙ" КОРОБКИ ----

function renderAnnoyingChestButtons() {
    renderChestTabs();

    var checkbox = document.getElementById('enableAnnoyingChestCheckbox');
    if (checkbox) checkbox.checked = state.annoyingChestEnabled;

    var status = document.getElementById('annoyingChestStatus');
    if (status) {
        status.textContent = state.annoyingChestNumber
            ? '✅ Выбрана коробка ' + state.annoyingChestNumber
            : 'Не выбрана';
    }

    var row = document.getElementById('annoyingChestSelectorRow');
    if (row) row.style.opacity = state.annoyingChestEnabled ? '1' : '0.7';
}

// ---- ПЕРЕКЛЮЧЕНИЕ НА ДРУГУЮ КОРОБКУ В РЕДАКТОРЕ ----

function switchToChest(idx) {
    // Если есть несохранённые изменения — предупреждаем
    if (state.currentEditingChest && state.currentEditingChest !== idx && state.hasUnsavedChanges) {
        if (!confirm('⚠️ Есть несохранённые изменения! Сохранить?')) return;
        saveCurrentChest();
    }

    state.currentEditingChest = idx;
    state.previewRotY = state.chestRotY[idx] !== undefined ? state.chestRotY[idx] : -30;
    state.previewRotX = state.chestRotX[idx] !== undefined ? state.chestRotX[idx] : -15;

    loadChestConfig(idx);
    updateChestSettingsUIForChest(idx);
    updatePreviewChest();

    state.hasUnsavedChanges = false;
    updateUnsavedIndicator();
    renderChestTabs();
}

// ---- ЗАГРУЗКА НАСТРОЕК КОРОБКИ В РЕДАКТОР ----

function loadChestConfig(idx) {
    var inp = document.getElementById('chestContentInput');
    if (inp) inp.value = state.chestContents[idx] || '';

    updateTypeSelector(idx);
    updateColorPicker(idx);
    updatePreview();

    var audioInput = document.getElementById('chestAudioUrl');
    if (audioInput) audioInput.value = state.chestAudioUrls[idx] || '';

    var glowSelect = document.getElementById('chestGlowSelect');
    if (glowSelect) glowSelect.value = state.chestGlows[idx] || '';
}

// ---- СОХРАНЕНИЕ НАСТРОЕК ТЕКУЩЕЙ КОРОБКИ ----

function saveCurrentChest() {
    var idx = state.currentEditingChest || 1;

    if (!state.chestTypes[idx]) state.chestTypes[idx] = 'prize';

    var inp = document.getElementById('chestContentInput');
    if (inp) state.chestContents[idx] = inp.value || 'Коробка ' + idx;

    var audioInput = document.getElementById('chestAudioUrl');
    if (audioInput) state.chestAudioUrls[idx] = audioInput.value;

    // Сохраняем выбранный цвет
    var ac = document.querySelector('#colorPicker .color-circle.active');
    if (ac && ac.getAttribute('data-color')) {
        state.chestColors[idx] = ac.getAttribute('data-color');
    }

    var glowSelect = document.getElementById('chestGlowSelect');
    if (glowSelect) state.chestGlows[idx] = glowSelect.value;

    state.hasUnsavedChanges = false;
    updateUnsavedIndicator();
    renderAll();
    renderChestTabs();
}

// ---- ОБНОВЛЕНИЕ СЕЛЕКТОРА ТИПА (ПРИЗ/ЗАДАНИЕ) ----

function updateTypeSelector(idx) {
    var ct = state.chestTypes[idx] || 'prize';

    var tp = document.getElementById('typePrize');
    var tt = document.getElementById('typeTask');

    if (tp) {
        tp.classList.toggle('active', ct === 'prize');
        tp.style.color = ct === 'prize' ? '#ffd700' : '#888';
    }
    if (tt) {
        tt.classList.toggle('active', ct === 'task');
        tt.style.color = ct === 'task' ? '#ffd700' : '#888';
    }
}

// ---- ОБНОВЛЕНИЕ ВЫБРАННОГО ЦВЕТА В ПИКЕРЕ ----

function updateColorPicker(idx) {
    var cc = state.chestColors[idx] || 'c1';

    var circles = document.querySelectorAll('#colorPicker .color-circle');
    circles.forEach(function(c) {
        var is = c.getAttribute('data-color') === cc;
        c.classList.toggle('active', is);
        c.style.borderColor = is ? '#ffd700' : 'rgba(255,255,255,0.15)';
    });
}

// ---- ПРЕДПРОСМОТР ТЕКСТА КОРОБКИ ----

function updatePreview() {
    var inp = document.getElementById('chestContentInput');
    var prev = document.getElementById('previewBox');

    if (!inp || !prev) return;

    prev.style.textAlign = state.chestAligns[state.currentEditingChest || 1] || 'center';
    prev.innerHTML = formatText(inp.value) || '<span style="color:#666;">Предпросмотр</span>';
}

// ---- ПРЕДПРОСМОТР 3D-КОРОБКИ В АДМИН-ПАНЕЛИ ----

function updatePreviewChest() {
    var scene = document.getElementById('previewScene');
    if (!scene) return;

    var n = state.currentEditingChest || 1;
    scene.innerHTML = '';

    var cc = state.chestColors[n] || 'c1';
    var box = createGiftBox(n, cc, false);

    // Используем previewRotY/RotX (могли изменить перетаскиванием)
    var displayRotY = state.previewRotY !== undefined ? state.previewRotY : (state.chestRotY[n] || -30);
    var displayRotX = state.previewRotX !== undefined ? state.previewRotX : (state.chestRotX[n] || -15);

    box.style.transform = 'rotateY(' + displayRotY + 'deg) rotateX(' + displayRotX + 'deg)';
    box.style.transition = 'none';

    scene.appendChild(box);

    var info = document.getElementById('previewInfo');
    if (info) {
        info.textContent = 'Коробка ' + n +
            ' | Y:' + (state.chestRotY[n] !== undefined ? state.chestRotY[n] : -30) + '°' +
            ' X:' + (state.chestRotX[n] !== undefined ? state.chestRotX[n] : -15) + '°';
    }
}

// ---- ОБНОВЛЕНИЕ СЛАЙДЕРОВ ПОВОРОТА В АДМИН-ПАНЕЛИ ----

function updateChestSettingsUIForChest(n) {
    var rotYSlider = document.getElementById('rotYSlider');
    var rotXSlider = document.getElementById('rotXSlider');
    var rotYVal = document.getElementById('rotYVal');
    var rotXVal = document.getElementById('rotXVal');

    var currentRotY = state.chestRotY[n] !== undefined ? state.chestRotY[n] : -30;
    var currentRotX = state.chestRotX[n] !== undefined ? state.chestRotX[n] : -15;

    if (rotYSlider) rotYSlider.value = currentRotY;
    if (rotXSlider) rotXSlider.value = currentRotX;
    if (rotYVal) rotYVal.textContent = currentRotY + '°';
    if (rotXVal) rotXVal.textContent = currentRotX + '°';

    updatePreviewChest();
}

// ---- ИНДИКАТОР НЕСОХРАНЁННЫХ ИЗМЕНЕНИЙ ----

function updateUnsavedIndicator() {
    var el = document.getElementById('unsavedIndicator');
    if (el) {
        el.style.display = state.hasUnsavedChanges ? 'inline-block' : 'none';
    }
}

// ---- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ГРОМКОСТИ ----

function updateVolumeUI() {
    var v = Math.round(state.globalVolume * 100);
    var slider = document.getElementById('volumeSlider');
    var val = document.getElementById('volumeValue');
    var btn = document.getElementById('soundTrigger');

    if (slider) slider.value = v;
    if (val) val.textContent = v + '%';

    if (btn) {
        if (state.globalVolume === 0) {
            btn.classList.add('muted');
            btn.textContent = '🔇';
        } else {
            btn.classList.remove('muted');
            btn.textContent = '🔊';
        }
    }

    state.soundEnabled = state.globalVolume > 0;
}

// ---- СМЕНА ФОНА ----

function applyBackground(bgKey, customUrl) {
    var body = document.getElementById('mainBody');

    if (bgKey === 'custom' && customUrl) {
        body.style.background = "url('" + customUrl + "') center/cover no-repeat";
        body.style.backgroundAttachment = 'fixed';
        localStorage.setItem('magicBg', 'custom');
        localStorage.setItem('magicBgUrl', customUrl);
    } else if (BG_PRESETS[bgKey]) {
        body.style.background = BG_PRESETS[bgKey];
        body.style.backgroundAttachment = 'fixed';
        localStorage.setItem('magicBg', bgKey);
    }

    updateBgPanelActive();
}

// ---- ОБНОВЛЕНИЕ ПОДСВЕТКИ В ПАНЕЛИ ВЫБОРА ФОНА ----

function updateBgPanelActive() {
    var cur = localStorage.getItem('magicBg') || 'default';

    var options = document.querySelectorAll('.bg-option');
    options.forEach(function(o) {
        var is = o.getAttribute('data-bg') === cur;
        o.style.background = is ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)';
        o.style.borderColor = is ? 'rgba(255,215,0,0.3)' : 'transparent';
    });
}

function updateButtonsState() {
    var giveBtn = document.getElementById('giveAllNumbersBtn');
    var resetBtn = document.getElementById('resetButton');
    
    // Все ли имена заполнены
    var allNamesFilled = state.participants.every(function(p) {
        return p.name.trim() !== '';
    });
    
    // Все ли номера уже выданы
    var allNumbersGiven = state.participants.every(function(p) {
        return p.assignedNumber !== null;
    });
    
    // Есть ли хотя бы один игрок с именем и без номера
    var hasPlayersWaiting = state.participants.some(function(p) {
        return p.name.trim() !== '' && p.assignedNumber === null;
    });
    
    // Открыта ли хотя бы одна коробка
    var anyChestOpened = false;
    for (var i = 1; i <= state.totalNumbers; i++) {
        if (state.chestsState[i] && state.chestsState[i].opened) {
            anyChestOpened = true;
            break;
        }
    }
    
    // Кнопка «Дать номера всем»
    if (giveBtn) {
        // Зелёная: все имена введены, номера ещё не выданы
        if (allNamesFilled && !allNumbersGiven && hasPlayersWaiting) {
            giveBtn.style.background = 'rgba(100,255,180,0.2)';
            giveBtn.style.borderColor = 'rgba(100,255,180,0.5)';
            giveBtn.style.color = '#a0f0c0';
        } else {
            giveBtn.style.background = 'rgba(220,220,240,0.1)';
            giveBtn.style.borderColor = 'rgba(255,255,255,0.3)';
            giveBtn.style.color = '#e0e0f0';
        }
    }
    
    // Кнопка «Сбросить всё»
    if (resetBtn) {
        if (anyChestOpened && !state.isAnimating) {
            resetBtn.style.background = 'rgba(255,80,80,0.15)';
            resetBtn.style.borderColor = 'rgba(255,80,80,0.5)';
            resetBtn.style.color = '#ff8888';
        } else {
            resetBtn.style.background = 'rgba(220,220,240,0.1)';
            resetBtn.style.borderColor = 'rgba(255,255,255,0.3)';
            resetBtn.style.color = '#e0e0f0';
        }
    }
}

// ---- ПОЛНАЯ ПЕРЕРИСОВКА ----
// Вызывается после любых изменений

function renderAll() {
    renderParticipants();
    renderChests();
    if (typeof renderSparksTabs === 'function') renderSparksTabs();
    updateButtonsState();
}

// ---- СИНХРОНИЗАЦИЯ ИНТЕРФЕЙСА ПОСЛЕ ИМПОРТА ----

function syncUIAfterImport() {
    updateVolumeUI();
    renderAll();
    updateTurnIndicator();
    renderChestTabs();
    renderAnnoyingChestButtons();
    if (typeof renderSparksTabs === 'function') renderSparksTabs();

    if (state.currentEditingChest) {
        updateChestSettingsUIForChest(state.currentEditingChest);
    }

    updatePreviewChest();

    if (typeof updateViewerChestVisibility === 'function') updateViewerChestVisibility();
    if (typeof updatePutinChestVisibility === 'function') updatePutinChestVisibility();
    if (typeof resetPutinUI === 'function') resetPutinUI();

    // Обновляем слайдеры громкости в админ-панели
    var uiSlider = document.getElementById('uiVolumeSlider');
    var chestAudioSlider = document.getElementById('chestAudioVolumeSlider');
    if (uiSlider) uiSlider.value = state.uiVolume * 100;
    if (chestAudioSlider) chestAudioSlider.value = state.chestAudioVolume * 100;

    var uiVal = document.getElementById('uiVolumeVal');
    var chestAudioVal = document.getElementById('chestAudioVolumeVal');
    if (uiVal) uiVal.textContent = Math.round(state.uiVolume * 100) + '%';
    if (chestAudioVal) chestAudioVal.textContent = Math.round(state.chestAudioVolume * 100) + '%';

    // Обновляем чекбоксы
    var annoyCheck = document.getElementById('enableAnnoyingChestCheckbox');
    if (annoyCheck) annoyCheck.checked = state.annoyingChestEnabled;

    var vch = document.getElementById('enableViewerChestCheckbox');
    if (vch) vch.checked = state.viewerChestEnabled;

    var pch = document.getElementById('enablePutinChestCheckbox');
    if (pch) pch.checked = state.putinChestEnabled;

    var pms = document.getElementById('putinMaxShufflesSelect');
    if (pms) pms.value = state.putinMaxShuffles;

    // Обновляем поля аудио
    var annoyAudio = document.getElementById('annoyingAudioUrl');
    if (annoyAudio) annoyAudio.value = state.annoyingAudioUrl || '';

    var vau1 = document.getElementById('viewerAudio1UrlInput');
    if (vau1) vau1.value = state.viewerAudio1Url || '';

    var vau2 = document.getElementById('viewerAudio2UrlInput');
    if (vau2) vau2.value = state.viewerAudio2Url || '';

    var vau3 = document.getElementById('viewerAudio3UrlInput');
    if (vau3) vau3.value = state.viewerAudio3Url || '';

    var p1u = document.getElementById('putinAudio1UrlInput');
    if (p1u) p1u.value = state.putinAudio1Url || '';

    var p2u = document.getElementById('putinAudio2UrlInput');
    if (p2u) p2u.value = state.putinAudio2Url || '';

    // Поле кастомного фона
    var customBgUrl = document.getElementById('customBgUrlInput');
    if (customBgUrl) {
        var savedBg = localStorage.getItem('magicBg') || 'default';
        if (savedBg === 'custom') {
            var savedUrl = localStorage.getItem('magicBgUrl') || '';
            customBgUrl.value = savedUrl;
        }
    }

    // Обновляем цвет в пикере PUTIN
    var putinColorCircles = document.querySelectorAll('#putinColorPicker .color-circle');
    putinColorCircles.forEach(function(c) {
        c.classList.toggle('active', c.getAttribute('data-color') === state.putinChestColor);
    });

    IdleEngine.stop();
    IdleEngine.start();
}

// ---- АВТО-РАЗДАЧА НОМЕРОВ ----

async function giveAllNumbers() {
    if (state.isAnimating || state.atomicAction || state.isCountingDown || state.isAnyModalOpen) return;

    await atomic(async function() {
        // Объявляем переменные ДО проверки (чтобы они были доступны)
        var btnAll = document.getElementById('giveAllNumbersBtn');
        var btnReset = document.getElementById('resetButton');
        var timerEl = document.getElementById('countdownTimer');
        var progEl = document.getElementById('progressContainer');
        var progBar = document.getElementById('progressBar');
        var cpEl = document.getElementById('currentPlayerIndicator');
        var ind = document.getElementById('turnIndicator');
        var countdownIv = null;
        
        // Проверяем, что у всех есть имена
        var allHaveNames = true;
        state.participants.forEach(function(p) {
            if (p.name.trim() === '') allHaveNames = false;
        });

        if (!allHaveNames) {
            updateTurnIndicator('⚠️ Введите имена!', true);
            return;
        }

        // Собираем игроков без номеров
        var players = [];
        state.participants.forEach(function(p, i) {
            if (p.name.trim() !== '' && p.assignedNumber === null) {
                players.push({ participant: p, idx: i });
            }
        });

        if (players.length === 0) {
            updateTurnIndicator('✅ У всех есть номера!', true);
            state.isAnimating = false;
            if (btnAll) btnAll.disabled = false;
            if (btnReset) btnReset.disabled = false;
            if (timerEl) timerEl.style.display = 'none';
            if (progEl) progEl.style.display = 'none';
            if (cpEl) cpEl.style.display = 'none';
            if (ind) ind.style.display = '';
            return;
        }

        state.isAnimating = true;

        // Блокируем кнопки на время раздачи
        if (btnAll) btnAll.disabled = true;
        if (btnReset) btnReset.disabled = true;

        if (ind) ind.style.display = 'none';

        // Показываем таймер и прогресс-бар
        if (timerEl) { timerEl.style.display = 'inline-block'; timerEl.textContent = ':20'; }
        if (progEl) progEl.style.display = 'block';
        if (cpEl) cpEl.style.display = 'block';
        if (progBar) progBar.style.width = '0%';

        // Запускаем таймер
        var rem = 20;
        countdownIv = setInterval(function() {
            rem--;
            if (timerEl) {
                timerEl.textContent = formatTime(rem);
                if (rem <= 3 && rem > 0) {
                    timerEl.classList.add('urgent');
                    SoundEngine.urgentTick();
                } else if (rem > 0) {
                    timerEl.classList.remove('urgent');
                    SoundEngine.softTick();
                } else {
                    timerEl.textContent = ':00';
                    clearInterval(countdownIv);
                }
            }
        }, 1000);

        // Перемешиваем номера
        var avail = [];
        for (var i = 1; i <= state.totalNumbers; i++) {
            if (!state.usedNumbers[i]) avail.push(i);
        }
        var shuffled = shuffle(avail);

        // Раздаём номера с анимацией
        var tpp = CONFIG.NUMBERS_DURATION / players.length;  // Время на одного игрока
        var st = Date.now();

        for (var pi = 0; pi < players.length; pi++) {
            var player = players[pi];

            if (cpEl) cpEl.textContent = '🎯 ' + player.participant.name + ' получает номер...';

            // Задержка, чтобы номера появлялись равномерно
            var delay = (pi + 1) * tpp - (Date.now() - st);
            if (delay > 0) await new Promise(function(r) { setTimeout(r, delay); });

            // Анимация выпадения номера
            var nd = document.getElementById('num-' + player.idx);
            nd.classList.add('number-reveal');
            nd.textContent = shuffled[pi];

            await new Promise(function(r) { setTimeout(r, 500); });
            nd.classList.remove('number-reveal');

            // Сохраняем номер
            state.participants[player.idx].assignedNumber = shuffled[pi];
            state.usedNumbers[shuffled[pi]] = true;

            if (progBar) progBar.style.width = ((pi + 1) / players.length * 100) + '%';

            SoundEngine.reward();
        }

        // Ждём окончания таймера
        var rt = CONFIG.NUMBERS_DURATION - (Date.now() - st);
        if (rt > 0) await new Promise(function(r) { setTimeout(r, rt); });

        // Убираем таймер и прогресс-бар
        clearInterval(countdownIv);
        if (timerEl) timerEl.style.display = 'none';
        if (progEl) progEl.style.display = 'none';
        if (cpEl) cpEl.style.display = 'none';

        state.selectedParticipantIndex = null;
        state.isAnimating = false;

        if (btnAll) btnAll.disabled = false;
        if (btnReset) btnReset.disabled = false;

        renderParticipants();
        renderChests();
        showNetflixOverlay();

        if (ind) ind.style.display = '';

        setTimeout(function() {
            if (ind) ind.style.display = '';
            updateTurnIndicator();
            updateButtonsState();
        }, 3500);
    });
}