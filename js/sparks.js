// =====================================================
// sparks.js — Искры (частицы)
// Маленькие золотые точки, которые летают вокруг открытой коробки.
// Можно включить максимум для 2 коробок одновременно.
// =====================================================

// ---- НАСТРОЙКИ ИСКР ----

var SPARK_SETTINGS = {
    count: CONFIG.SPARKS_COUNT,  // Сколько частиц (40)
    radiusX: 60,                  // Разлёт по горизонтали (пиксели)
    radiusY: 60,                  // Разлёт по вертикали
    offsetX: 60,                  // Смещение центра разлёта по X
    offsetY: 15                   // Смещение центра разлёта по Y
};

// ---- ОЧИСТКА КОНТЕЙНЕРА ----
// Удаляет все дочерние элементы (старые искры)

function clearContainer(container) {
    while (container && container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

// ---- СОЗДАНИЕ ИСКР ----
// container — HTML-элемент, куда добавляем искры
// enabled — true (включить) или false (выключить)

function createSparks(container, enabled) {
    clearContainer(container);  // Сначала удаляем старые

    if (!enabled) return;  // Искры выключены — выходим

    var s = SPARK_SETTINGS;
    var frag = document.createDocumentFragment();  // Быстрее, чем добавлять по одному

    for (var i = 0; i < s.count; i++) {
        var sp = document.createElement('div');
        sp.className = 'spark';

        // Случайная позиция внутри области разлёта
        var left = s.offsetX + (Math.random() - 0.5) * s.radiusX;
        var top = s.offsetY + (Math.random() - 0.5) * s.radiusY;

        // Случайный размер (от 0.5 до 7 пикселей)
        var size = 0.5 + Math.random() * 6.5;

        // Золотая или белая (50/50)
        var color = Math.random() > 0.5 ? '#ffd700' : '#fff';

        // Направление и скорость полёта (CSS-переменные для анимации sparkFloat)
        var sx = (Math.random() - 0.5) * s.radiusX;       // Куда летит по X
        var sy = -Math.random() * s.radiusY * 0.7;         // Куда летит по Y (вверх)
        var sd = 0.8 + Math.random() * 4.2;                // Длительность анимации
        var sdelay = Math.random() * (0.8 + Math.random() * 4.2);  // Задержка перед стартом

        sp.style.cssText =
            'left:' + left + 'px;' +
            'top:' + top + 'px;' +
            'width:' + size + 'px;' +
            'height:' + size + 'px;' +
            'background:' + color + ';' +
            '--sx:' + sx + 'px;' +
            '--sy:' + sy + 'px;' +
            '--sd:' + sd + 's;' +
            '--sdelay:' + sdelay + 's;';

        frag.appendChild(sp);
    }

    container.appendChild(frag);
}

// ---- ПОДСЧЁТ АКТИВНЫХ ИСКР ----
// Считает, для скольких коробок включены искры

function getActiveSparksCount() {
    var count = 0;
    for (var i = 1; i <= state.totalNumbers; i++) {
        if (state.chestSparks[i] === true) {
            count++;
        }
    }
    return count;
}

// ---- ВКЛЮЧИТЬ/ВЫКЛЮЧИТЬ ИСКРЫ ДЛЯ КОРОБКИ ----
// chestNumber — номер коробки
// enabled — true (включить) или false (выключить)
// Возвращает true, если операция выполнена, false — если достигнут лимит

function setSparksForChest(chestNumber, enabled) {
    // Если пытаемся включить, но уже есть 2 активные коробки с искрами
    if (enabled && getActiveSparksCount() >= 2 && state.chestSparks[chestNumber] !== true) {
        ModalManager.show({
            title: 'Достигнут лимит',
            message: 'Можно включить искры только для 2 коробок одновременно!',
            buttons: [{ text: 'Понятно', class: 'primary' }],
            noOverlayClose: true
        });
        return false;
    }

    state.chestSparks[chestNumber] = enabled;

    // Обновляем интерфейс
    renderSparksTabs();
    renderChests();
    updatePreviewChest();

    return true;
}

// ---- ОТРИСОВКА ВКЛАДОК ИСКР В АДМИН-ПАНЕЛИ ----
// Показывает кнопки «Коробка 1», «Коробка 2», ... с подсветкой активных

function renderSparksTabs() {
    var container = document.getElementById('sparksTabsContainer');
    if (!container) return;

    container.innerHTML = '';
    var activeCount = getActiveSparksCount();

    for (var i = 1; i <= state.totalNumbers; i++) {
        var btn = document.createElement('button');
        btn.className = 'spark-tab-btn';

        var isActive = state.chestSparks[i] === true;

        if (isActive) {
            btn.classList.add('active');
        }

        // Если уже 2 активны, а эта не активна — делаем кнопку недоступной
        if (activeCount >= 2 && !isActive) {
            btn.classList.add('disabled');
        }

        btn.textContent = 'Коробка ' + i;

        // Замыкание (closure) — сохраняем номер коробки для обработчика
        (function(chestNum) {
            btn.addEventListener('click', function() {
                // Если кнопка заблокирована (лимит) и искры не включены — показываем предупреждение
                if (btn.classList.contains('disabled') && !state.chestSparks[chestNum]) {
                    ModalManager.show({
                        title: 'Достигнут лимит',
                        message: 'Сначала выключите искры у другой коробки',
                        buttons: [{ text: 'Понятно', class: 'primary' }],
                        noOverlayClose: true
                    });
                    return;
                }

                // Переключаем: включено → выключено, выключено → включено
                setSparksForChest(chestNum, !state.chestSparks[chestNum]);
            });
        })(i);

        container.appendChild(btn);
    }

    // Обновляем счётчик активных искр
    var info = document.getElementById('activeSparksCountInfo');
    if (info) {
        info.textContent = 'Активно: ' + activeCount + '/2';
    }
}