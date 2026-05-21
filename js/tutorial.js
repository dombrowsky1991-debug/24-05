// =====================================================
// tutorial.js — Обучающий гид
// Пошаговая инструкция для нового пользователя.
// Подсвечивает элементы интерфейса рамкой и показывает
// подсказки с описанием.
// Автоматически запускается при первом посещении.
// =====================================================

// ---- ШАГИ ТУТОРИАЛА ----
// Каждый шаг = объект с настройками:
//   title   — заголовок подсказки
//   text    — текст подсказки (можно с HTML)
//   target  — CSS-селектор элемента, который подсвечиваем
//   pos     — где показывать подсказку: 'top', 'bottom', 'left', 'right'
//   pad     — отступ рамки от элемента (пиксели)
//   round   — true = круглая рамка (для круглых кнопок)
//   warning — текст предупреждения (жёлтая рамка)
//   tip     — полезный совет (золотая рамка)

var tutorialSteps = [
    {
        title: '👤 Карточки игроков',
        text: 'Перед вами <b>карточки участников</b>. Введите имена в поля ввода.',
        target: '#participantsGrid',
        pos: 'bottom',
        pad: 12
    },
    {
        title: '🎰 Авто-раздача',
        text: 'Кнопка <b>«ДАТЬ НОМЕРА ВСЕМ»</b> автоматически раздаст номера всем игрокам. После раздачи — <b>игра начнётся.</b>',
        target: '#giveAllNumbersBtn',
        pos: 'top',
        pad: 10
    },
    {
        title: '🔄 Сбросить всё',
        text: 'Сбрасывает игровой процесс: очищает номера, закрывает коробки.',
        warning: '⚠️ Если вы уже открыли коробку — сброс закроет её.',
        tip: '💡 Импортируйте настройки с содержимым коробок во время стрима.',
        target: '#resetButton',
        pos: 'top',
        pad: 10
    },
    {
        title: '📦 Коробки',
        text: 'Это <b>закрытые коробки</b> с сюрпризами. Выберите игрока и кликните по коробке чтобы открыть.',
        target: '#chestsGrid',
        pos: 'top',
        pad: 14
    },
    {
        title: '🔊 Громкость',
        text: 'Кнопка 🔊 открывает <b>регулятор громкости</b>.',
        target: '#soundTrigger',
        pos: 'right',
        pad: 8,
        round: true
    },
    {
        title: '🎨 Смена фона',
        text: 'Кнопка 🎨 — <b>выбор фона</b>. 6 тем + своя картинка.',
        target: '#bgTrigger',
        pos: 'right',
        pad: 8,
        round: true
    },
    {
        title: '📥 Импорт настроек',
        text: 'Кнопка 📥 — <b>загрузка содержания коробок</b>.',
        tip: '💡 Перед игрой вам отправят файл — загрузите его этой кнопкой.',
        target: '#mainImportTrigger',
        pos: 'left',
        pad: 8,
        round: true
    },
    {
        title: '⚙ Админ-панель',
        text: 'Кнопка ⚙ — <b>панель администратора</b> (потребуется пароль).',
        tip: '💡 Здесь можно менять всё: содержимое, цвета, анимации, звуки, включать и отключать разные режимы.',
        target: '#adminTrigger',
        pos: 'right',
        pad: 8,
        round: true
    },
    {
        title: '✅ Всё готово!',
        text: '<b>Вводите имена → раздавайте номера → открывайте коробки!</b><br><br>А что внутри — всегда сюрприз 😉',
        target: '#turnIndicator',
        pos: 'top',
        pad: 12
    }
];

// Текущий шаг (начинаем с 0)
var tutorialStep = 0;

// ---- ПОЗИЦИОНИРОВАНИЕ РАМКИ ПОДСВЕТКИ ----

function positionTutorialFrame(targetEl, pad, round) {
    var rect = targetEl.getBoundingClientRect();
    var f = document.getElementById('tutorialFrame');

    f.style.left = (rect.left - pad) + 'px';
    f.style.top = (rect.top - pad) + 'px';
    f.style.width = (rect.width + pad * 2) + 'px';
    f.style.height = (rect.height + pad * 2) + 'px';
    f.style.borderRadius = round ? '50%' : '16px';
}

// ---- ПОЗИЦИОНИРОВАНИЕ ПОДСКАЗКИ ----

function positionTutorialTooltip(targetEl, pos, pad) {
    var rect = targetEl.getBoundingClientRect();
    var tt = document.getElementById('tutorialTooltip');
    var ttr = tt.getBoundingClientRect();

    var l, t;

    switch (pos) {
        case 'bottom':
            l = rect.left + rect.width / 2 - ttr.width / 2;
            t = rect.bottom + pad + 28;
            break;
        case 'top':
            l = rect.left + rect.width / 2 - ttr.width / 2;
            t = rect.top - ttr.height - pad - 28;
            break;
        case 'right':
            l = rect.right + pad + 28;
            t = rect.top + rect.height / 2 - ttr.height / 2;
            break;
        case 'left':
            l = rect.left - ttr.width - pad - 28;
            t = rect.top + rect.height / 2 - ttr.height / 2;
            break;
        default:
            l = rect.left + rect.width / 2 - ttr.width / 2;
            t = rect.bottom + pad + 28;
    }

    // Не даём подсказке выйти за границы экрана
    l = Math.max(10, Math.min(l, window.innerWidth - ttr.width - 10));
    t = Math.max(10, Math.min(t, window.innerHeight - ttr.height - 10));

    tt.style.left = l + 'px';
    tt.style.top = t + 'px';
}

// ---- ПОКАЗАТЬ ШАГ ТУТОРИАЛА ----

function showTutorialStep(idx) {
    if (idx < 0 || idx >= tutorialSteps.length) return;

    tutorialStep = idx;
    var s = tutorialSteps[idx];

    // Находим целевой элемент
    var el = document.querySelector(s.target);
    if (!el) return;

    // Заполняем текст
    document.getElementById('tutorialTitle').textContent = s.title;
    document.getElementById('tutorialText').innerHTML = s.text;

    // Предупреждение (если есть)
    var warnEl = document.getElementById('tutorialWarning');
    if (s.warning) {
        warnEl.style.display = 'block';
        warnEl.innerHTML = s.warning;
    } else {
        warnEl.style.display = 'none';
    }

    // Совет (если есть)
    var tipEl = document.getElementById('tutorialTip');
    if (s.tip) {
        tipEl.style.display = 'block';
        tipEl.innerHTML = s.tip;
    } else {
        tipEl.style.display = 'none';
    }

    // Счётчик шагов
    document.getElementById('tutorialStepCounter').textContent = (idx + 1) + ' / ' + tutorialSteps.length;

    // Кнопка «Назад» видна только не на первом шаге
    document.getElementById('tutorialPrev').style.display = idx === 0 ? 'none' : 'inline-block';

    // На последнем шаге кнопка «Далее» меняется на «Понятно!»
    document.getElementById('tutorialNext').textContent = idx === tutorialSteps.length - 1 ? '✅ Понятно!' : 'Далее →';

    // Показываем рамку и подсказку
    var frame = document.getElementById('tutorialFrame');
    var tooltip = document.getElementById('tutorialTooltip');

    frame.style.display = 'block';
    tooltip.style.display = 'block';

    // Начальная позиция (до анимации)
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(10px)';

    positionTutorialFrame(el, s.pad, s.round);

    // Запускаем анимацию появления
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            positionTutorialTooltip(el, s.pos, s.pad);
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });
    });
}

// ---- КНОПКА «ДАЛЕЕ» ----

function tutorialNext() {
    var tt = document.getElementById('tutorialTooltip');

    // Анимация исчезновения
    tt.style.opacity = '0';
    tt.style.transform = 'translateY(10px)';

    setTimeout(function() {
        if (tutorialStep >= tutorialSteps.length - 1) {
            // Последний шаг — закрываем туториал
            tutorialClose();
        } else {
            tutorialStep++;
            showTutorialStep(tutorialStep);
        }
    }, 300);
}

// ---- КНОПКА «НАЗАД» ----

function tutorialPrev() {
    var tt = document.getElementById('tutorialTooltip');

    tt.style.opacity = '0';
    tt.style.transform = 'translateY(10px)';

    setTimeout(function() {
        if (tutorialStep > 0) {
            tutorialStep--;
            showTutorialStep(tutorialStep);
        }
    }, 300);
}

// ---- ЗАКРЫТИЕ ТУТОРИАЛА ----

function tutorialClose() {
    document.getElementById('tutorialFrame').style.display = 'none';
    document.getElementById('tutorialTooltip').style.display = 'none';
    document.body.style.overflow = '';  // Возвращаем прокрутку
    localStorage.setItem('tutorialCompleted', 'true');
}

// ---- ЗАПУСК ТУТОРИАЛА ----

function tutorialStart() {
    tutorialStep = 0;
    document.getElementById('tutorialFrame').style.display = 'none';
    document.getElementById('tutorialTooltip').style.display = 'none';
    document.body.style.overflow = 'hidden';  // Убираем прокрутку на время обучения

    setTimeout(function() {
        showTutorialStep(0);
    }, 300);
}