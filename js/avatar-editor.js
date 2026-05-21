// =====================================================
// avatar-editor.js — Система аватаров (РАБОЧАЯ ВЕРСИЯ)
// =====================================================

var AVATAR_CONFIG = {
    CIRCLE_DIAMETER: 140,
    AVATAR_SIZE: 76,
    ZOOM_STEP: 0.02,
    MAX_FILE_SIZE: 10 * 1024 * 1024
};

var AVATAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#c0392b', '#16a085', '#d35400', '#7f8c8d', '#2c3e50'];

function getInitials(name) {
    if (!name || name.trim() === '') return '?';
    return name.trim().charAt(0).toUpperCase();
}

function getAvatarColor(index) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function applyCropToAvatar(img, cropData) {
    if (!cropData || !img) return;
    var ratio = AVATAR_CONFIG.AVATAR_SIZE / AVATAR_CONFIG.CIRCLE_DIAMETER;
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.transform = 'translate(-50%,-50%) translate(' + (cropData.x * ratio) + 'px,' + (cropData.y * ratio) + 'px) scale(' + (cropData.scale * ratio) + ')';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transformOrigin = 'center center';
}

function saveAvatar(playerId, cropData) {
    if (!state.avatars) state.avatars = {};
    if (cropData === null) {
        delete state.avatars[playerId];
    } else {
        state.avatars[playerId] = cropData;
    }
    try {
        localStorage.setItem('avatars', JSON.stringify(state.avatars));
    } catch(e) {}
}

function getAvatar(playerId) {
    if (!state.avatars) return null;
    return state.avatars[playerId] || null;
}

function loadAvatarsFromStorage() {
    try {
        var saved = localStorage.getItem('avatars');
        if (saved) {
            state.avatars = JSON.parse(saved);
        } else {
            state.avatars = {};
        }
    } catch(e) {
        state.avatars = {};
    }
}

function renderAvatar(cell, player, playerIndex) {
    var avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'avatar-wrapper';
    
    var placeholder = document.createElement('div');
    placeholder.className = 'avatar-placeholder';
    placeholder.style.background = getAvatarColor(playerIndex);
    placeholder.textContent = getInitials(player.name);
    avatarWrapper.appendChild(placeholder);
    
    var avatarData = getAvatar(player.uniqueId);
    if (avatarData && avatarData.src) {
        var inner = document.createElement('div');
        inner.className = 'avatar-inner';
        var img = document.createElement('img');
        img.src = avatarData.src;
        img.style.position = 'absolute';
        img.style.top = '50%';
        img.style.left = '50%';
        img.style.transformOrigin = 'center center';
        applyCropToAvatar(img, avatarData);
        inner.appendChild(img);
        avatarWrapper.appendChild(inner);
        placeholder.style.display = 'none';
    }
    
    var overlayDiv = document.createElement('div');
    overlayDiv.className = 'avatar-overlay';
    overlayDiv.textContent = 'Сменить';
    avatarWrapper.appendChild(overlayDiv);
    
    avatarWrapper.addEventListener('click', function(e) {
        e.stopPropagation();
        openAvatarEditor(player, player.uniqueId);
    });
    
    cell.appendChild(avatarWrapper);
}

function renderMiniAvatar(chestNum, size) {
    size = size || 24;
    
    var player = null;
    for (var i = 0; i < state.participants.length; i++) {
        if (state.participants[i].openedChestNum === chestNum) {
            player = state.participants[i];
            break;
        }
    }
    
    if (!player) {
        return '<span class="mini-avatar" style="display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:#555;color:white;font-size:' + (size * 0.5) + 'px;font-weight:bold;vertical-align:middle;margin-right:6px;">?</span>';
    }
    
    var avatarData = getAvatar(player.uniqueId);
    if (avatarData && avatarData.src) {
        return '<span class="mini-avatar" style="display:inline-block;width:' + size + 'px;height:' + size + 'px;border-radius:50%;overflow:hidden;vertical-align:middle;margin-right:6px;background:#2a2a35;"><img src="' + escapeHTML(avatarData.src) + '" style="width:100%;height:100%;object-fit:cover;"></span>';
    } else {
        var color = getAvatarColor(player.uniqueId);
        var initial = getInitials(player.name);
        return '<span class="mini-avatar" style="display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';color:white;font-size:' + (size * 0.5) + 'px;font-weight:bold;vertical-align:middle;margin-right:6px;">' + initial + '</span>';
    }
}

var editorState = {
    playerId: null,
    playerIndex: null,
    playerName: '',
    imageSrc: null,
    imgW: 1,
    imgH: 1,
    x: 0,
    y: 0,
    scale: 1,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0
};

function openAvatarEditor(player, playerId) {
    editorState.playerId = playerId;
    editorState.playerIndex = playerId;
    editorState.playerName = player.name;
    
    var saved = getAvatar(editorState.playerId);
    if (saved && saved.src) {
        editorState.imageSrc = saved.src;
        editorState.imgW = saved.imgW;
        editorState.imgH = saved.imgH;
        editorState.x = saved.x;
        editorState.y = saved.y;
        editorState.scale = saved.scale;
    } else {
        editorState.imageSrc = null;
        editorState.imgW = 1;
        editorState.imgH = 1;
        editorState.x = 0;
        editorState.y = 0;
        editorState.scale = 1;
    }
    editorState.dragging = false;
    showAvatarModal();
}

function showAvatarModal() {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = 
        '<div class="modal-content" style="max-width:540px;">' +
            '<div class="modal-title">🖼️ Аватар для ' + escapeHTML(editorState.playerName || 'игрока') + '</div>' +
            '<div style="display:flex;gap:0;margin-bottom:1.2rem;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.15);">' +
                '<button class="modal-tab" data-tab="local" style="flex:1;padding:0.55rem 0.8rem;cursor:pointer;font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;background:rgba(255,215,0,0.12);border:none;color:#ffd700;">📁 С компьютера</button>' +
                '<button class="modal-tab" data-tab="url" style="flex:1;padding:0.55rem 0.8rem;cursor:pointer;font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;background:rgba(255,255,255,0.03);border:none;color:#888;">🔗 По ссылке</button>' +
            '</div>' +
            '<div id="tabLocal" class="tab-content" style="display:block;">' +
                '<div class="file-upload-area" id="fileUploadArea" style="border:2px dashed rgba(255,255,255,0.2);border-radius:12px;padding:1.5rem;cursor:pointer;background:rgba(0,0,0,0.2);margin-bottom:0.6rem;text-align:center;">' +
                    '<div style="font-size:2rem;">📁</div>' +
                    '<div style="color:#aaa;font-size:0.8rem;">Нажмите для выбора файла</div>' +
                    '<div style="color:#666;font-size:0.65rem;">JPG, PNG, GIF, WebP · до 10 МБ</div>' +
                '</div>' +
                '<input type="file" id="fileInput" accept="image/*" style="display:none;">' +
            '</div>' +
            '<div id="tabUrl" class="tab-content" style="display:none;">' +
                '<div style="display:flex;flex-direction:column;gap:8px;">' +
                    '<input type="text" class="avatar-url-input" id="avatarUrlInput" placeholder="Вставьте URL картинки..." style="width:100%;padding:0.65rem 1rem;border-radius:10px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:0.85rem;outline:none;">' +
                    '<button id="loadUrlBtn" style="width:100%;padding:8px;border-radius:10px;background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.3);color:#ffd700;cursor:pointer;font-size:0.8rem;">📷 Загрузить</button>' +
                '</div>' +
            '</div>' +
            '<div class="crop-area" id="cropArea" style="width:300px;height:300px;margin:0 auto 1rem;position:relative;overflow:hidden;background:#0a0a0f;border-radius:14px;cursor:grab;border:1px solid rgba(255,255,255,0.1);">' +
                '<img class="crop-image" id="cropImage" src="' + (editorState.imageSrc || '') + '" alt="" style="display:' + (editorState.imageSrc ? 'block' : 'none') + ';position:absolute;top:50%;left:50%;transform-origin:center center;user-select:none;pointer-events:none;max-width:none;">' +
                '<div class="crop-circle" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140px;height:140px;border-radius:50%;pointer-events:none;z-index:5;box-shadow:0 0 0 9999px rgba(0,0,0,0.5);border:2px dashed rgba(255,215,0,0.6);"></div>' +
            '</div>' +
            '<p style="color:#777;font-size:0.65rem;margin-bottom:0.8rem;text-align:center;">🖱️ Перетаскивайте | Колёсико — зум | Края зафиксированы</p>' +
            '<div style="display:flex;gap:0.6rem;justify-content:center;flex-wrap:wrap;">' +
                '<button id="resetCropBtn" class="control-btn" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);">🔄 Сбросить</button>' +
                '<button id="applyCropBtn" class="control-btn" style="background:rgba(255,215,0,0.12);border-color:rgba(255,215,0,0.3);color:#ffd700;">✅ Готово</button>' +
                '<button id="removeAvatarBtn" class="control-btn" style="background:rgba(255,80,80,0.1);border-color:rgba(255,80,80,0.3);color:#ff8888;">🗑️ Удалить</button>' +
                '<button id="cancelBtn" class="control-btn">Отмена</button>' +
            '</div>' +
        '</div>';
    
    document.body.appendChild(overlay);
    
    // ========== ВСЕ ОБРАБОТЧИКИ ==========
    
    // 1. Переключение вкладок
    var localTab = overlay.querySelector('.modal-tab[data-tab="local"]');
    var urlTab = overlay.querySelector('.modal-tab[data-tab="url"]');
    var tabLocal = document.getElementById('tabLocal');
    var tabUrl = document.getElementById('tabUrl');
    
    if (localTab && urlTab && tabLocal && tabUrl) {
        localTab.onclick = function() {
            localTab.style.background = 'rgba(255,215,0,0.12)';
            localTab.style.color = '#ffd700';
            urlTab.style.background = 'rgba(255,255,255,0.03)';
            urlTab.style.color = '#888';
            tabLocal.style.display = 'block';
            tabUrl.style.display = 'none';
        };
        
        urlTab.onclick = function() {
            urlTab.style.background = 'rgba(255,215,0,0.12)';
            urlTab.style.color = '#ffd700';
            localTab.style.background = 'rgba(255,255,255,0.03)';
            localTab.style.color = '#888';
            tabUrl.style.display = 'block';
            tabLocal.style.display = 'none';
        };
    }
    
    // 2. Загрузка с компьютера
    var fileUploadArea = document.getElementById('fileUploadArea');
    var fileInput = document.getElementById('fileInput');
    
    if (fileUploadArea && fileInput) {
        fileUploadArea.onclick = function() { fileInput.click(); };
        fileInput.onchange = function() {
            if (this.files && this.files[0]) {
                if (this.files[0].size > AVATAR_CONFIG.MAX_FILE_SIZE) {
                    alert('Файл больше 10 МБ!');
                    return;
                }
                var reader = new FileReader();
                reader.onload = function(e) { loadImageToEditor(e.target.result, overlay); };
                reader.readAsDataURL(this.files[0]);
            }
        };
    }
    
    // 3. Загрузка по URL
    var urlInput = document.getElementById('avatarUrlInput');
    var loadUrlBtn = document.getElementById('loadUrlBtn');
    
    if (urlInput && loadUrlBtn) {
        loadUrlBtn.onclick = function() {
            var url = urlInput.value.trim();
            if (url) {
                loadImageToEditor(url, overlay);
            } else {
                alert('Введите URL картинки');
            }
        };
        
        urlInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                var url = this.value.trim();
                if (url) loadImageToEditor(url, overlay);
            }
        };
    }
    
    // 4. Кроп-область
    var cropArea = document.getElementById('cropArea');
    var cropImage = document.getElementById('cropImage');
    
    if (cropArea && cropImage) {
        cropArea.onmousedown = function(e) {
            if (!cropImage.style.display || cropImage.style.display === 'none') return;
            editorState.dragging = true;
            editorState.dragStartX = e.clientX - editorState.x;
            editorState.dragStartY = e.clientY - editorState.y;
            e.preventDefault();
        };
        
        cropArea.onwheel = function(e) {
            if (!cropImage.style.display || cropImage.style.display === 'none') return;
            e.preventDefault();
            var ns = editorState.scale + (e.deltaY < 0 ? AVATAR_CONFIG.ZOOM_STEP : -AVATAR_CONFIG.ZOOM_STEP);
            editorState.scale = Math.max(AVATAR_CONFIG.CIRCLE_DIAMETER / Math.min(editorState.imgW, editorState.imgH), Math.min(5, ns));
            clampEditorPosition();
            updateCropPreview();
        };
    }
    
    // 5. Глобальное перетаскивание
    window.onmousemove = function(e) {
        if (!editorState.dragging) return;
        editorState.x = e.clientX - editorState.dragStartX;
        editorState.y = e.clientY - editorState.dragStartY;
        clampEditorPosition();
        updateCropPreview();
    };
    
    window.onmouseup = function() {
        editorState.dragging = false;
    };
    
    // 6. Кнопки действий
    var resetBtn = document.getElementById('resetCropBtn');
    var applyBtn = document.getElementById('applyCropBtn');
    var removeBtn = document.getElementById('removeAvatarBtn');
    var cancelBtn = document.getElementById('cancelBtn');
    
    if (resetBtn) {
        resetBtn.onclick = function() {
            editorState.scale = AVATAR_CONFIG.CIRCLE_DIAMETER / Math.min(editorState.imgW, editorState.imgH);
            editorState.x = 0;
            editorState.y = 0;
            clampEditorPosition();
            updateCropPreview();
        };
    }
    
    if (applyBtn) {
        applyBtn.onclick = function() {
            saveAvatar(editorState.playerId, {
                src: editorState.imageSrc,
                x: editorState.x,
                y: editorState.y,
                scale: editorState.scale,
                imgW: editorState.imgW,
                imgH: editorState.imgH
            });
            
            if (typeof updateAvatarInitials === 'function') {
                updateAvatarInitials(editorState.playerId, editorState.playerName);
            }
            
            overlay.remove();
            if (typeof renderAll === 'function') renderAll();
            if (typeof renderPutinTables === 'function') renderPutinTables();
        };
    }
    
    if (removeBtn) {
        removeBtn.onclick = function() {
            saveAvatar(editorState.playerId, null);
            
            if (typeof updateAvatarInitials === 'function') {
                updateAvatarInitials(editorState.playerId, editorState.playerName);
            }
            
            overlay.remove();
            if (typeof renderAll === 'function') renderAll();
            if (typeof renderPutinTables === 'function') renderPutinTables();
        };
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            overlay.remove();
        };
    }
    
    // 7. Закрытие по клику на фон
    overlay.onclick = function(e) {
        if (e.target === overlay) overlay.remove();
    };
    
    // 8. Обновляем превью если есть изображение
    if (editorState.imageSrc) {
        updateCropPreview();
    }
}

function loadImageToEditor(src, overlay) {
    var img = new Image();
    img.onload = function() {
        editorState.imgW = img.naturalWidth;
        editorState.imgH = img.naturalHeight;
        editorState.scale = AVATAR_CONFIG.CIRCLE_DIAMETER / Math.min(editorState.imgW, editorState.imgH);
        editorState.x = 0;
        editorState.y = 0;
        editorState.imageSrc = src;
        
        var cropImage = document.getElementById('cropImage');
        if (cropImage) {
            cropImage.src = src;
            cropImage.style.display = 'block';
        }
        clampEditorPosition();
        updateCropPreview();
    };
    img.onerror = function() {
        alert('Не удалось загрузить картинку');
    };
    img.src = src;
}

function updateCropPreview() {
    var img = document.getElementById('cropImage');
    if (!img || img.style.display === 'none') return;
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.transform = 'translate(-50%,-50%) translate(' + editorState.x + 'px,' + editorState.y + 'px) scale(' + editorState.scale + ')';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transformOrigin = 'center center';
}

function clampEditorPosition() {
    var iw = editorState.imgW * editorState.scale;
    var ih = editorState.imgH * editorState.scale;
    var maxX = Math.max(0, (iw - AVATAR_CONFIG.CIRCLE_DIAMETER) / 2);
    var maxY = Math.max(0, (ih - AVATAR_CONFIG.CIRCLE_DIAMETER) / 2);
    editorState.x = Math.max(-maxX, Math.min(maxX, editorState.x));
    editorState.y = Math.max(-maxY, Math.min(maxY, editorState.y));
}

function exportAvatars() {
    return state.avatars || {};
}

function importAvatars(avatarsData) {
    if (avatarsData && typeof avatarsData === 'object') {
        state.avatars = avatarsData;
        try {
            localStorage.setItem('avatars', JSON.stringify(state.avatars));
        } catch(e) {}
        if (typeof renderAll === 'function') renderAll();
        if (typeof renderPutinTables === 'function') renderPutinTables();
    }
}

function initAvatarSystem() {
    loadAvatarsFromStorage();
}

function updateAvatarInitials(playerId, newName) {
    var participants = state.participants;
    var playerIndex = -1;
    for (var i = 0; i < participants.length; i++) {
        if (participants[i].uniqueId === playerId) {
            playerIndex = i;
            break;
        }
    }
    
    if (playerIndex === -1) return;
    
    var grid = document.getElementById('participantsGrid');
    if (!grid) return;
    
    var cells = grid.querySelectorAll('.participant-cell');
    if (cells[playerIndex]) {
        var avatarWrapper = cells[playerIndex].querySelector('.avatar-wrapper');
        if (avatarWrapper) {
            var placeholder = avatarWrapper.querySelector('.avatar-placeholder');
            if (placeholder) {
                placeholder.textContent = getInitials(newName);
            }
        }
    }
}