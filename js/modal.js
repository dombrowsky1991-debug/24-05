// =====================================================
// modal.js — Модальные окна и логика открытия коробок
// =====================================================

var ModalManager = {

    show: function(config) {
        var title = config.title || '';
        var message = config.message || '';
        var buttons = config.buttons || [];
        var isDanger = config.isDanger || false;
        var noOverlayClose = config.noOverlayClose !== false;

        state.isAnyModalOpen = true;

        return new Promise(function(resolve) {
            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay';

            var content = document.createElement('div');
            content.className = 'modal-content';
            if (isDanger) {
                content.className += ' danger-modal';
            } else {
                content.className += ' reward-modal';
            }

            var html = '';
            if (title) html += '<div class="modal-title">' + escapeHTML(title) + '</div>';
            if (message) html += '<div class="modal-text">' + message + '</div>';
            if (buttons.length > 0) {
                html += '<div class="modal-buttons">';
                buttons.forEach(function(btn, i) {
                    var btnClass = btn.class || (i === 0 ? 'primary' : '');
                    html += '<button class="admin-btn ' + btnClass + '" data-btn-index="' + i + '">' + escapeHTML(btn.text) + '</button>';
                });
                html += '</div>';
            }

            content.innerHTML = html;
            overlay.appendChild(content);
            document.body.appendChild(overlay);

            var cleanup = function() {
                overlay.remove();
                state.isAnyModalOpen = false;
            };

            var btnElements = content.querySelectorAll('.admin-btn');
            btnElements.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var idx = parseInt(btn.getAttribute('data-btn-index'));
                    var buttonConfig = buttons[idx];
                    var result = (buttonConfig && buttonConfig.value !== undefined) ? buttonConfig.value : idx;
                    cleanup();
                    resolve(result);
                });
            });

            // Закрытие по клику на фон — теперь с очисткой
            if (!noOverlayClose) {
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) {
                        cleanup();
                        resolve(null);
                    }
                });
            }
        });
    },

    showBlocked: function(reason) {
        var msg;
        if (reason === 1) {
            msg = '<div style="font-size:1.4rem;font-weight:700;color:#fff;">У тебя был шанс, но кто зассал идти дальше!?</div>';
        } else {
            msg = '<div style="font-size:1.4rem;font-weight:700;color:#fff;">Так у тебя есть бабки... что надо?</div>';
        }
        return this.show({
            title: 'КОРОБКА ЗАБЛОКИРОВАНА!',
            message: msg,
            buttons: [{ text: 'Понятно', class: 'primary' }],
            isDanger: true
        });
    },

    showReward: function(participant, chestIndex) {
        var align = state.chestAligns[chestIndex] || 'center';
        var formattedContent = formatText(state.chestContents[chestIndex] || '');

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        var glowClass = state.chestGlows[chestIndex] || '';
        var modalClass = 'modal-content reward-modal';
        if (glowClass) modalClass += ' ' + glowClass;

        overlay.innerHTML =
            '<div class="' + modalClass + '">' +
                '<div class="modal-title">Коробка ' + chestIndex + ' открыта!</div>' +
                '<div class="modal-reward" style="text-align:' + align + ';">' + formattedContent + '</div>' +
                '<div style="font-size:1rem;color:#a0a0b0;margin-bottom:1.5rem;">' +
                    'Открыл: <strong>' + escapeHTML(participant.name) + '</strong> (' + participant.assignedNumber + ')' +
                '</div>' +
                '<div class="modal-buttons">' +
                    '<button class="admin-btn primary" id="closeRewardBtn">Закрыть</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Общая функция очистки (останавливает музыку и закрывает)
        var cleanupAndClose = function() {
            // ⭐⭐⭐ ГЛАВНОЕ: полностью останавливаем ВСЮ музыку ⭐⭐⭐
            AudioManager.stopAll();
            
            // Останавливаем beat-анимацию если была
            if (window._beatGlowActive) {
                if (window._beatAnimFrame) cancelAnimationFrame(window._beatAnimFrame);
                if (window._beatAudioCtx) window._beatAudioCtx.close();
                window._beatGlowActive = false;
            }
            
            state.lastChestOpened = Date.now();
            state.lastInteraction = Date.now();
            if (state.offendedTimer) {
                clearTimeout(state.offendedTimer);
                state.offendedTimer = null;
            }
            IdleEngine.scheduleOffended();
            overlay.remove();
        };

        var closeBtn = overlay.querySelector('#closeRewardBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', cleanupAndClose);
        }

        // Закрытие по клику на фон — ТОЖЕ ОСТАНАВЛИВАЕТ МУЗЫКУ
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                cleanupAndClose();
            }
        });

        // Если выбран режим "Под ритм музыки" — запускаем анализатор
        if (glowClass === 'glow-beat') {
            // Полностью останавливаем и удаляем обычное аудио
            if (state.currentChestAudio) {
                state.currentChestAudio.pause();
                state.currentChestAudio.currentTime = 0;
                state.currentChestAudio.src = '';
                state.currentChestAudio.load();
                state.currentChestAudio = null;
            }
            var audioUrl = state.chestAudioUrls[chestIndex];
            if (audioUrl && audioUrl.trim() !== '') {
                setTimeout(function() {
                    startBeatGlow(overlay.querySelector('.modal-content'), audioUrl, cleanupAndClose);
                }, 100);
            }
        }
    },

    showChestContent: function(chestIndex) {
        var chest = state.chestsState[chestIndex];
        if (!chest || !chest.opened) return;

        var align = state.chestAligns[chestIndex] || 'center';
        var formattedContent = formatText(state.chestContents[chestIndex] || '');

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        overlay.innerHTML =
            '<div class="modal-content reward-modal">' +
                '<div class="modal-title">📜 Содержимое коробки ' + chestIndex + '</div>' +
                '<div class="modal-reward" style="text-align:' + align + ';">' + formattedContent + '</div>' +
                '<div style="font-size:1rem;color:#a0a0b0;margin-bottom:1.5rem;">' +
                    'Открыл: <strong>' + escapeHTML(chest.ownerName) + '</strong> (' + chest.ownerNumber + ')' +
                '</div>' +
                '<div class="modal-buttons">' +
                    '<button class="admin-btn primary" id="closeChestContentBtn">Закрыть</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var closeBtn = overlay.querySelector('#closeChestContentBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                overlay.remove();
            });
        }

        // Закрытие по клику на фон
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });
    }
};

// ---- ФУНКЦИИ ОТСЧЁТА И ОТКРЫТИЯ ----

function clearCountdown() {
    if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
    }
    state.isCountingDown = false;
    var overlay = document.getElementById('countdownOverlay');
    if (overlay) overlay.style.display = 'none';
    var body = document.getElementById('mainBody');
    if (body) body.classList.remove('dimmed');
}

function startCountdown(chestIndex, chosen, boxElement) {
    if (state.isCountingDown) return;

    state.isCountingDown = true;
    SoundEngine.init();

    var body = document.getElementById('mainBody');
    if (body) body.classList.add('dimmed');
    var overlay = document.getElementById('countdownOverlay');
    if (overlay) overlay.style.display = 'flex';

    var cn = document.getElementById('countdownNumber');
    if (cn) {
        cn.textContent = CONFIG.CHEST_COUNTDOWN_SECONDS;
        cn.classList.remove('red');
    }

    SoundEngine.softTick();
    var sec = CONFIG.CHEST_COUNTDOWN_SECONDS;

    state.countdownInterval = setInterval(function() {
        sec--;
        if (sec > 0) {
            if (cn) {
                cn.textContent = sec;
                if (sec <= 3) {
                    cn.classList.add('red');
                    SoundEngine.urgentTick();
                } else {
                    cn.classList.remove('red');
                    SoundEngine.softTick();
                }
            }
        } else {
            clearInterval(state.countdownInterval);
            state.countdownInterval = null;
            openChestSequence(chestIndex, chosen, boxElement);
        }
    }, 1000);
}

function openChestSequence(chestIndex, chosen, boxElement) {
    clearCountdown();

    var overlay = document.getElementById('countdownOverlay');
    if (overlay) overlay.style.display = 'none';
    var body = document.getElementById('mainBody');
    if (body) body.classList.remove('dimmed');

    state.lastChestOpened = Date.now();
    state.lastInteraction = Date.now();

    if (state.offendedTimer) {
        clearTimeout(state.offendedTimer);
        state.offendedTimer = null;
    }
    IdleEngine.scheduleOffended();

    // Добавляем класс opened только этой коробке
    if (boxElement) {
        boxElement.classList.add('opened');
    }

    // Останавливаем annoying-аудио перед открытием
    if (state.currentAnnoyingAudio) {
        state.currentAnnoyingAudio.pause();
        state.currentAnnoyingAudio = null;
    }
    
    var audioUrl = state.chestAudioUrls[chestIndex];
    var glowClass = state.chestGlows[chestIndex] || '';
    // Не проигрываем обычное аудио, если выбран glow-beat
    if (audioUrl && audioUrl.trim() !== "" && glowClass !== 'glow-beat') {
        AudioManager.playChestAudio(audioUrl, false);
    }

    setTimeout(function() {
        // Защита от двойного открытия
        if (state.chestsState[chestIndex] && state.chestsState[chestIndex].opened) return;

        // Сохраняем только эту коробку как открытую
        state.chestsState[chestIndex] = {
            opened: true,
            ownerName: chosen.name,
            ownerNumber: chosen.assignedNumber,
            originalType: state.chestTypes[chestIndex]
        };

        chosen.hasOpenedChest = true;
        chosen.openedChestNum = chestIndex;
        state.selectedParticipantIndex = null;

        SoundEngine.open();
        IdleEngine.stop();
        renderAll();
        IdleEngine.start();
        updateTurnIndicator();
        renderPutinTables();

        ModalManager.showReward(chosen, chestIndex);
    }, 500);
}

function lockChest(chestIndex, reason, chosen) {
    clearCountdown();
    AudioManager.stopAll();

    state.lockedChests[chestIndex] = { isLocked: true, reason: reason };

    if (chosen) {
        chosen.blockedByAnnoying = true;
        chosen.openedChestNum = chestIndex;
        state.selectedParticipantIndex = null;
    }

    SoundEngine.lock();
    IdleEngine.stop();
    renderAll();
    IdleEngine.start();
    updateTurnIndicator();

    ModalManager.show({
        title: 'КОРОБКА ЗАБЛОКИРОВАНА!',
        message: '<div style="font-size:1.4rem;font-weight:700;color:#fff;">Есть тонкое ощущение, что тебя развели!</div>',
        buttons: [{ text: 'Понятно', class: 'primary' }]
    });
}

function startAnnoyingCountdown(chestIndex, chosen, boxElement) {
    if (state.isCountingDown) return Promise.resolve();

    state.isCountingDown = true;
    SoundEngine.init();

    var body = document.getElementById('mainBody');
    if (body) body.classList.add('dimmed');
    var overlay = document.getElementById('countdownOverlay');
    if (overlay) overlay.style.display = 'flex';

    var cn = document.getElementById('countdownNumber');
    if (cn) {
        cn.textContent = CONFIG.ANNOYING_INITIAL_SECONDS;
        cn.classList.remove('red');
    }

    SoundEngine.softTick();

    return new Promise(function(resolve) {
        var sec = CONFIG.ANNOYING_INITIAL_SECONDS;
        var mainInterval = null;

        var cleanup = function() {
            if (mainInterval) clearInterval(mainInterval);
            state.countdownInterval = null;
        };

        mainInterval = setInterval(async function() {
            sec--;

            if (sec > 0) {
                if (cn) cn.textContent = sec;

                if (sec === CONFIG.ANNOYING_WINDOW_AT_SECOND) {
                    cleanup();
                    if (overlay) overlay.style.display = 'none';
                    if (body) body.classList.remove('dimmed');

                    var result = await ModalManager.show({
                        title: 'Что за упёртость... 2000р и не открываем?',
                        message: '',
                        buttons: [
                            { text: 'ОТКРЫТЬ', class: 'primary', value: 0 },
                            { text: 'НЕ ОТКРЫВАТЬ', class: 'danger', value: 1 }
                        ]
                    });

                    if (result === 1) {
                        clearCountdown();
                        AudioManager.stopAll();
                        lockChest(chestIndex, 2, chosen);
                        resolve();
                        return;
                    }

                    if (overlay) overlay.style.display = 'flex';
                    if (body) body.classList.add('dimmed');

                    if (cn) {
                        cn.textContent = CONFIG.ANNOYING_REMAINING_SECONDS;
                        cn.classList.add('red');
                    }
                    SoundEngine.urgentTick();

                    var rem = CONFIG.ANNOYING_REMAINING_SECONDS;
                    var iv2 = setInterval(function() {
                        rem--;
                        if (rem > 0) {
                            if (cn) {
                                cn.textContent = rem;
                                cn.classList.add('red');
                            }
                            SoundEngine.urgentTick();
                        } else {
                            clearInterval(iv2);
                            clearCountdown();
                            openChestSequence(chestIndex, chosen, boxElement);
                            resolve();
                        }
                    }, 1000);
                    state.countdownInterval = iv2;

                } else if (sec <= 3) {
                    if (cn) cn.classList.add('red');
                    SoundEngine.urgentTick();
                } else {
                    if (cn) cn.classList.remove('red');
                    SoundEngine.softTick();
                }
            } else {
                cleanup();
                clearCountdown();
                openChestSequence(chestIndex, chosen, boxElement);
                resolve();
            }
        }, 1000);

        state.countdownInterval = mainInterval;
    });
}

async function processAnnoyingChest(chestIndex, chosen, boxElement) {
    AudioManager.playAnnoyingAudio();

    var result = await ModalManager.show({
        title: 'Постой-ка… А вдруг в другой коробке призы покрупнее? Может, стоит выбрать иную?',
        message: '',
        buttons: [
            { text: 'ОТКРЫТЬ', class: 'primary', value: 0 },
            { text: 'НЕ ОТКРЫВАТЬ', class: 'danger', value: 1 }
        ]
    });

    if (result === 1) {
        AudioManager.stopAll();
        lockChest(chestIndex, 1, chosen);
        renderParticipants();
        return;
    }

    await new Promise(function(r) { setTimeout(r, 1000); });

    result = await ModalManager.show({
        title: 'Может все-таки другая?',
        message: '',
        buttons: [
            { text: 'ОТКРЫТЬ', class: 'primary', value: 0 },
            { text: 'НЕ ОТКРЫВАТЬ', class: 'danger', value: 1 }
        ]
    });

    if (result === 1) {
        AudioManager.stopAll();
        lockChest(chestIndex, 1, chosen);
        renderParticipants();
        return;
    }

    var loading = document.createElement('div');
    loading.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:100001;';
    loading.innerHTML =
        '<div style="display:flex;flex-direction:column;align-items:center;gap:1.5rem;">' +
            '<div style="width:80px;height:80px;border:3px solid rgba(255,215,0,0.15);border-top:3px solid #ffd700;border-radius:50%;animation:spin 0.8s linear infinite;"></div>' +
            '<div style="color:#ffd966;font-size:1.3rem;">Открываю...</div>' +
        '</div>';
    document.body.appendChild(loading);

    await new Promise(function(r) { setTimeout(r, 5000); });
    loading.remove();

    result = await ModalManager.show({
        title: 'Давай так, пу-пу-пу... 1000р и ты эту коробку не открываешь?',
        message: '',
        buttons: [
            { text: 'ОТКРЫТЬ', class: 'primary', value: 0 },
            { text: 'НЕ ОТКРЫВАТЬ', class: 'danger', value: 1 }
        ]
    });

    if (result === 1) {
        AudioManager.stopAll();
        lockChest(chestIndex, 2, chosen);
        renderParticipants();
        return;
    }

    await startAnnoyingCountdown(chestIndex, chosen, boxElement);
}

async function tryOpenChest(chestIndex, boxElement) {
    if (state.isCountingDown || state.isAnimating || state.atomicAction || state.isAnyModalOpen) {
        updateTurnIndicator('⚠️ Подождите, сейчас идёт открытие другой коробки!', true);
        return;
    }

    if (!allNumbersAssigned()) {
        updateTurnIndicator('⚠️ Сначала выдайте все номера!', true);
        return;
    }

    if (state.selectedParticipantIndex === null) {
        updateTurnIndicator('⚠️ Сначала выберите игрока!', true);
        return;
    }

    var chosen = state.participants[state.selectedParticipantIndex];
    if (!chosen || chosen.assignedNumber === null || chosen.hasOpenedChest || chosen.blockedByAnnoying) {
        updateTurnIndicator('⚠️ Выберите доступного игрока!', true);
        return;
    }

    if (state.chestsState[chestIndex] && state.chestsState[chestIndex].opened) {
        ModalManager.showChestContent(chestIndex);
        return;
    }

    var ld = state.lockedChests[chestIndex];
    if (ld && ld.isLocked) {
        await ModalManager.showBlocked(ld.reason);
        return;
    }

    IdleEngine.resetTimer();

    if (state.annoyingChestEnabled && state.annoyingChestNumber === chestIndex) {
        await processAnnoyingChest(chestIndex, chosen, boxElement);
    } else {
        startCountdown(chestIndex, chosen, boxElement);
    }
}

function allNumbersAssigned() {
    return Object.keys(state.usedNumbers).length === state.totalNumbers && 
           state.participants.every(function(p) { return p.name.trim() !== ''; });
}

function allChestsOpenedCheck() {
    if (Object.keys(state.usedNumbers).length !== state.totalNumbers) return false;

    for (var i = 1; i <= state.totalNumbers; i++) {
        var chest = state.chestsState[i];
        var locked = state.lockedChests[i];

        if (!chest) return false;
        if (!chest.opened && !(locked && locked.isLocked)) return false;
    }

    return true;
}

function showNetflixOverlay() {
    var overlay = document.getElementById('epicOverlay');
    if (!overlay) return;

    var container = overlay.querySelector('.split-text');
    var hint = overlay.querySelector('.epic-hint');

    if (state.currentNetflixAudio) {
        state.currentNetflixAudio.pause();
        state.currentNetflixAudio.currentTime = 0;
        state.currentNetflixAudio = null;
    }

    SoundEngine.init();
    
    state.currentNetflixAudio = new Audio('https://static.wfolio.ru/file/AqiFFw_TXMM4LDwoI2TPSYAM1lHVLAGB/F3eUE25SDaAaOfz9Lubl87eAATWSJOel/X6WMKlYhdcWqWmiJv7uvvhLdIs9AakDB/4_jT87_orDBhwl8qE0kwl-0WRgt_UebO/XIKo-IUc70bMi6VN7byqk6A89Cw59FjW/rE_-MIxqK6I.ogg');
    state.currentNetflixAudio.loop = true;
    state.currentNetflixAudio.volume = state.chestAudioVolume * state.globalVolume * 0.9;
    state.currentNetflixAudio.play().catch(function() {});

    overlay.classList.add('active');

    container.style.animation = 'none';
    void container.offsetWidth;
    container.style.animation = 'netflixZoom 4.5s cubic-bezier(0.2,0.9,0.4,1.1) forwards';
    container.style.opacity = '0';
    container.style.transform = 'scale(0.35)';
    void container.offsetWidth;
    container.style.opacity = '';
    container.style.transform = '';

    hint.classList.remove('visible');
    setTimeout(function() { hint.classList.add('visible'); }, 4000);

    var isClosed = false;
    var closeHandler = function() {
        if (isClosed) return;
        isClosed = true;
        overlay.classList.remove('active');
        if (state.currentNetflixAudio) {
            try { state.currentNetflixAudio.pause(); state.currentNetflixAudio.currentTime = 0; state.currentNetflixAudio.src = ''; state.currentNetflixAudio.load(); } catch(e) {}
            state.currentNetflixAudio = null;
        }
        hint.classList.remove('visible');
        overlay.removeEventListener('click', closeHandler);
    };

    setTimeout(function() { overlay.addEventListener('click', closeHandler); }, 4000);
}

function updateTurnIndicator(msg, temp) {
    var ind = document.getElementById('turnIndicator');
    if (!ind) return;

    if (msg && temp) {
        var orig = ind.innerHTML;
        ind.innerHTML = msg;
        setTimeout(function() { ind.innerHTML = orig; }, 3000);
        return;
    }

    var ac = state.participants.filter(function(p) { return p.assignedNumber !== null; }).length;
    var wn = state.participants.filter(function(p) { return p.name.trim() === ''; }).length;
    var wnn = state.participants.filter(function(p) { return p.name.trim() !== '' && p.assignedNumber === null; }).length;

    if (state.isAnimating) ind.innerHTML = '🎰 БАРАБАН КРУТИТСЯ!';
    else if (state.isCountingDown) ind.innerHTML = '⏳ ОТКРЫТИЕ КОРОБКИ...';
    else if (wn > 0) ind.innerHTML = '✏️ Введите имена (' + wn + ' без имени)';
    else if (wnn > 0 && ac === 0) ind.innerHTML = '👆 Нажмите «Дать номера всем»';
    else if (wnn > 0) ind.innerHTML = '📊 ' + ac + ' из ' + state.totalNumbers + ' номеров. Осталось ' + wnn + '.';
    else if (state.selectedParticipantIndex !== null) {
        var p = state.participants[state.selectedParticipantIndex];
        ind.innerHTML = '✅ ' + p.name + ' (№' + p.assignedNumber + ') — можно открыть коробку!';
    } else if (ac === state.totalNumbers) ind.innerHTML = '🎉 Все номера выданы! Выберите игрока для открытия.';
    else ind.innerHTML = '🎯 Осталось получить ' + wnn + ' номеров.';
}

function startBeatGlow(modalEl, audioUrl, onCloseCallback) {
    var audioCtx = null;
    var analyser = null;
    var source = null;
    var animFrame = null;
    var isActive = true;
    var audio = null;
    var gainNode = null;  // ⭐ ДОБАВЛЯЕМ УЗЕЛ ГРОМКОСТИ

    // Сохраняем в глобальные переменные для возможной остановки
    window._beatGlowActive = true;
    window._beatAnimFrame = null;
    window._beatAudioCtx = null;
    window._beatGainNode = null;

    var stopBeat = function() {
        isActive = false;
        window._beatGlowActive = false;
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            window._beatAnimFrame = null;
        }
        if (audio) {
            audio.pause();
            audio.src = '';
            audio.load();
            audio = null;
        }
        if (audioCtx) {
            audioCtx.close();
            window._beatAudioCtx = null;
        }
        window._beatGainNode = null;
    };

    // ⭐ ФУНКЦИЯ ОБНОВЛЕНИЯ ГРОМКОСТИ
    function updateBeatVolume() {
        if (!window._beatGainNode) return;
        var chestVol = state.chestAudioVolume !== undefined ? state.chestAudioVolume : 0.7;
        var globalVol = state.globalVolume !== undefined ? state.globalVolume : 0.5;
        var newVolume = chestVol * globalVol;
        window._beatGainNode.gain.value = newVolume;
        console.log('🔊 beat glow volume updated:', newVolume);
    }

    audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = audioUrl;
    
    audio.onloadedmetadata = function() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            window._beatAudioCtx = audioCtx;
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.4;

            // ⭐ СОЗДАЁМ УЗЕЛ ГРОМКОСТИ (GainNode)
            gainNode = audioCtx.createGain();
            window._beatGainNode = gainNode;
            
            // ⭐ УСТАНАВЛИВАЕМ НАЧАЛЬНУЮ ГРОМКОСТЬ
            var chestVol = state.chestAudioVolume !== undefined ? state.chestAudioVolume : 0.7;
            var globalVol = state.globalVolume !== undefined ? state.globalVolume : 0.5;
            gainNode.gain.value = chestVol * globalVol;

            source = audioCtx.createMediaElementSource(audio);
            // Подключаем: источник → анализатор → узел громкости → выход
            source.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            audio.onended = function() {
                stopBeat();
                if (modalEl) {
                    modalEl.style.borderColor = 'rgba(180,150,80,0.4)';
                    modalEl.style.boxShadow = '';
                }
            };

            audio.play().catch(function(e) {
                console.log('Beat glow play error:', e);
            });

            function beatPulse() {
                if (!isActive) return;

                var dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);

                var bass = 0;
                for (var i = 0; i < 20; i++) bass += dataArray[i];
                bass = bass / 20 / 255;

                var mid = 0;
                for (var i = 20; i < 60; i++) mid += dataArray[i];
                mid = mid / 40 / 255;

                var high = 0;
                for (var i = 60; i < 120; i++) high += dataArray[i];
                high = high / 60 / 255;

                var energy = bass * 0.5 + mid * 0.3 + high * 0.2;
                energy = Math.max(0.05, energy);
                energy = Math.pow(energy, 0.9);
                energy = Math.min(1.0, energy * 1.2);

                var r, g, b;
                if (bass > mid && bass > high) {
                    r = Math.floor(240 + energy * 15);
                    g = Math.floor(120 + energy * 80);
                    b = Math.floor(energy * 30);
                } else if (mid > bass && mid > high) {
                    r = 255;
                    g = Math.floor(200 + energy * 55);
                    b = Math.floor(energy * 80);
                } else {
                    r = Math.floor(80 + energy * 120);
                    g = Math.floor(120 + energy * 100);
                    b = Math.floor(200 + energy * 55);
                }

                var intensity = 0.35 + energy * 0.5;
                modalEl.style.borderWidth = '3px';
                modalEl.style.borderColor = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + intensity + ')';
                modalEl.style.boxShadow =
                    '0 0 ' + (20 + energy * 50) + 'px rgba(' + r + ', ' + g + ', ' + b + ', ' + (0.3 + energy * 0.45) + '), ' +
                    '0 0 ' + (40 + energy * 80) + 'px rgba(' + r + ', ' + g + ', ' + b + ', ' + (0.15 + energy * 0.3) + ')';

                window._beatAnimFrame = requestAnimationFrame(beatPulse);
            }
            beatPulse();
        } catch(e) {
            console.log('Beat glow error:', e);
        }
    };

    audio.onerror = function(e) {
        console.log('Audio load error:', e);
    };

    var closeBtn = modalEl ? modalEl.querySelector('#closeRewardBtn') : null;
    if (closeBtn) {
        var newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', function() {
            stopBeat();
            if (onCloseCallback) onCloseCallback();
        });
    }
    
    // ⭐ ДОБАВЛЯЕМ ГЛОБАЛЬНУЮ ФУНКЦИЮ ДЛЯ ОБНОВЛЕНИЯ ГРОМКОСТИ
    window.updateBeatGlowVolume = updateBeatVolume;
}