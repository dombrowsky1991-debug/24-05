// =====================================================
// idle-engine.js — Анимации бездействия
// Когда никто не трогает игру, коробки начинают "жить своей жизнью":
//   - мягкие анимации (wiggle, bounce, shiver...)
//   - "гавканье" (bark-bark) — все закрытые коробки трясутся
//   - "обиженная" коробка (offended) — одна коробка уходит,
//     подглядывает и возвращается
// =====================================================

var IdleEngine = {
    
    // ---- СБРОС ТАЙМЕРА БЕЗДЕЙСТВИЯ ----
    // Вызывается при любом взаимодействии пользователя с игрой
    
    resetTimer: function() {
        if (!state.idleRunning) return;
        state.lastInteraction = Date.now();  // Запоминаем время последнего касания
        this.stopGentleAnimations();          // Останавливаем мягкие анимации
    },
    
    // ---- ОСТАНОВИТЬ ВСЕ МЯГКИЕ АНИМАЦИИ ----
    
    stopGentleAnimations: function() {
        state.idleTimeouts.forEach(function(t) {
            clearTimeout(t);  // Отменяем запланированный таймер
        });
        state.idleTimeouts = [];  // Очищаем список
    },
    
    // ---- ПОЛУЧИТЬ СЛУЧАЙНУЮ ЗАКРЫТУЮ КОРОБКУ ----
    // Возвращает номер коробки (1, 2, 3...), которая ещё не открыта и не заблокирована
    
    getRandomClosedBox: function() {
        var avail = [];
        for (var i = 1; i <= state.totalNumbers; i++) {
            var chest = state.chestsState[i];
            var locked = state.lockedChests[i];
            // Коробка доступна для анимации, если не открыта и не заблокирована
            if (!chest || !chest.opened) {
                if (!locked || !locked.isLocked) {
                    avail.push(i);
                }
            }
        }
        if (avail.length > 0) {
            return avail[Math.floor(Math.random() * avail.length)];
        }
        return null;  // Все коробки открыты
    },
    
    // ---- НАЙТИ HTML-ЭЛЕМЕНТ КОРОБКИ ПО НОМЕРУ ----
    
    getBoxElement: function(number) {
        return document.getElementById('box-' + number);
    },
    
    // ---- ОЧИСТИТЬ ВСЕ АНИМАЦИИ У ВСЕХ КОРОБОК ----
    
    clearAllBoxAnims: function() {
        for (var i = 1; i <= state.totalNumbers; i++) {
            var box = this.getBoxElement(i);
            if (box) {
                // Убираем все CSS-классы анимаций
                box.classList.remove(
                    'wiggle-sway', 'bounce-gentle', 'lid-peek', 'shiver',
                    'pop-forward', 'tilt-spin', 'pulse-glow', 'sneak-left',
                    'flap-lid', 'wobble', 'nudge', 'bark-bark', 'bark-shake',
                    'offended', 'walking', 'frozen', 'peeking', 'peek-return', 'returning'
                );
                // Сбрасываем inline-стили анимации
                box.style.animation = '';
                box.style.transform = '';
                box.style.transition = '';
                // Сбрасываем анимацию крышки
                var lid = box.querySelector('.lid');
                if (lid) {
                    lid.style.animation = '';
                    lid.style.transform = '';
                }
            }
        }
    },
    
    // ---- ОЧИСТИТЬ АНИМАЦИИ У ОДНОЙ КОРОБКИ ----
    
    clearBoxAnims: function(box) {
        box.classList.remove(
            'wiggle-sway', 'bounce-gentle', 'lid-peek', 'shiver',
            'pop-forward', 'tilt-spin', 'pulse-glow', 'sneak-left',
            'flap-lid', 'wobble', 'nudge', 'bark-bark', 'bark-shake'
        );
    },
    
    // ---- МЯГКАЯ АНИМАЦИЯ ДЛЯ ОДНОЙ КОРОБКИ ----
    
    animateGentle: function(number) {
        var box = this.getBoxElement(number);
        if (!box) return;
        
        // Не анимируем, если коробка уже открыта, заблокирована или "обижена"
        if (box.classList.contains('opened')) return;
        var locked = state.lockedChests[number];
        if (locked && locked.isLocked) return;
        if (state.isOffendedRunning) return;
        
        this.clearBoxAnims(box);
        void box.offsetWidth;  // "Магическая" строка: заставляет браузер перерисовать элемент перед новой анимацией
        
        // Список всех возможных мягких анимаций
        var anims = [
            'wiggle-sway',   // Покачивание из стороны в сторону
            'bounce-gentle', // Мягкий подскок
            'lid-peek',      // Крышка подпрыгивает (как будто подглядывает)
            'shiver',        // Дрожит
            'pop-forward',   // Выпрыгивает вперёд
            'tilt-spin',     // Наклоняется и крутится
            'pulse-glow',    // Пульсирует и светится
            'sneak-left',    // Крадётся влево
            'flap-lid',      // Крышка хлопает
            'wobble',        // Колеблется
            'nudge'          // Подталкивает
        ];
        
        var anim = anims[Math.floor(Math.random() * anims.length)];
        box.classList.add(anim);
        
        // Убираем класс анимации через 1.6 секунды
        var self = this;
        setTimeout(function() {
            if (box) box.classList.remove(anim);
        }, 1600);
    },
    
    // ---- "ГАВКАЮЩАЯ" АНИМАЦИЯ ----
    // Более резкая и заметная, чем мягкие анимации
    
    animateBark: function(number) {
        var box = this.getBoxElement(number);
        if (!box) return;
        
        if (box.classList.contains('opened')) return;
        var locked = state.lockedChests[number];
        if (locked && locked.isLocked) return;
        if (state.isOffendedRunning) return;
        
        this.clearBoxAnims(box);
        void box.offsetWidth;
        
        // bark-bark: анимация крышки (хлопает как пасть)
        // bark-shake: анимация всей коробки (трясётся)
        box.classList.add('bark-bark', 'bark-shake');
        
        setTimeout(function() {
            if (box) {
                box.classList.remove('bark-bark', 'bark-shake');
            }
        }, 1000);
    },
    
    // ---- ЗАПУСК "ГАВКАНЬЯ" ДЛЯ ВСЕХ ЗАКРЫТЫХ КОРОБОК ----
    
    triggerBarkBark: function() {
        if (state.isOffendedRunning || state.isAnimating) return;
        
        for (var i = 1; i <= state.totalNumbers; i++) {
            var chest = state.chestsState[i];
            var locked = state.lockedChests[i];
            if (!chest || !chest.opened) {
                if (!locked || !locked.isLocked) {
                    // Каждая коробка "гавкает" с небольшой случайной задержкой
                    var self = this;
                    (function(num) {
                        setTimeout(function() {
                            self.animateBark(num);
                        }, Math.random() * 300);
                    })(i);
                }
            }
        }
    },
    
    // ---- ЗАПЛАНИРОВАТЬ МЯГКУЮ АНИМАЦИЮ ----
    
    scheduleGentle: function() {
        if (!state.idleRunning) return;
        if (state.isOffendedRunning || state.isAnimating) return;
        
        // Случайный интервал между анимациями (от 1 до 11 секунд)
        var intervals = [2000, 1000, 4000, 7000, 5000, 9000, 11000, 6000];
        var interval = intervals[Math.floor(Math.random() * intervals.length)];
        
        var self = this;
        var t = setTimeout(function() {
            var num = self.getRandomClosedBox();
            if (num) self.animateGentle(num);
            self.scheduleGentle();  // Планируем следующую анимацию
        }, interval);
        
        state.idleTimeouts.push(t);
    },
    
    // ---- ЗАПЛАНИРОВАТЬ "ОБИЖЕННУЮ" КОРОБКУ ----
    // Запускается через 4-7 минут бездействия
    
    scheduleOffended: function() {
        if (state.offendedTimer) {
            clearTimeout(state.offendedTimer);
            state.offendedTimer = null;
        }
        if (!state.idleRunning) return;
        
        // Случайная задержка от 4 до 7 минут
        var delay = 240000 + Math.floor(Math.random() * 180000);
        
        var self = this;
        state.offendedTimer = setTimeout(function() {
            if (state.isOffendedRunning || state.isAnimating || state.isCountingDown || state.isAnyModalOpen) {
                self.scheduleOffended();  // Переносим, если сейчас нельзя
                return;
            }
            self.triggerOffendedFull();
        }, delay);
    },
    
    // ---- ПОЛНЫЙ ЦИКЛ "ОБИЖЕННОЙ" КОРОБКИ ----
    // Это главная сцена: коробка "обижается", уходит, подглядывает и возвращается
    // Весь цикл длится примерно 12 секунд
    
    triggerOffendedFull: function() {
        // Проверки: не запускаем, если что-то уже происходит
        if (state.isOffendedRunning || state.isAnimating || state.isCountingDown || state.isAnyModalOpen) return;
        
        // Находим доступную коробку
        var avail = [];
        for (var i = 1; i <= state.totalNumbers; i++) {
            var chest = state.chestsState[i];
            var locked = state.lockedChests[i];
            if (!chest || !chest.opened) {
                if (!locked || !locked.isLocked) {
                    avail.push(i);
                }
            }
        }
        if (avail.length === 0) {
            this.scheduleOffended();
            return;
        }
        
        // Выбираем случайную коробку для сцены
        var targetNum = avail[Math.floor(Math.random() * avail.length)];
        var box = this.getBoxElement(targetNum);
        if (!box) {
            this.scheduleOffended();
            return;
        }
        
        // ---- НАЧАЛО СЦЕНЫ ----
        state.isOffendedRunning = true;
        this.stopGentleAnimations();
        this.clearAllBoxAnims();
        
        // Отменяем запланированное "гавканье"
        if (state.idleBarkTimeout) {
            clearTimeout(state.idleBarkTimeout);
            state.idleBarkTimeout = null;
        }
        
        var lid = box.querySelector('.lid');
        var wrapper = box.closest('.box-wrapper');
        var boxShadow = wrapper ? wrapper.querySelector('.box-shadow') : null;
        var self = this;
        
        // Фаза 0: коробка начинает "обижаться" (машет крышкой)
        box.classList.add('offended');
        if (lid) {
            lid.style.animation = 'lidWaveGoodbye 0.6s ease-in-out 3';
            lid.style.animationDelay = '0.3s';
        }
        
        // Если пользователь наводит мышь или кликает — сцена прерывается
        var interruptHandler = function() {
            if (!state.isOffendedRunning) return;
            state.isOffendedRunning = false;
            
            box.classList.remove('offended', 'walking', 'frozen', 'peeking', 'peek-return', 'returning');
            box.style.animation = 'none';
            box.style.transform = '';
            box.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
            
            if (lid) {
                lid.style.animation = 'none';
                lid.style.transform = '';
            }
            if (boxShadow) {
                boxShadow.style.animation = 'none';
                boxShadow.style.opacity = '1';
                boxShadow.style.transform = '';
            }
            
            setTimeout(function() {
                box.style.transition = '';
                box.style.transform = '';
                if (lid) lid.style.transition = '';
                if (boxShadow) boxShadow.style.transition = '';
                self.clearAllBoxAnims();
                state.isOffendedRunning = false;
                state.lastInteraction = Date.now();
                self.scheduleGentle();
                self.scheduleOffended();
            }, 400);
        };
        
        box.addEventListener('mouseenter', interruptHandler);
        if (wrapper) wrapper.addEventListener('click', interruptHandler);
        
        // Фаза 1 (после 1.2 сек): коробка уходит
        setTimeout(function() {
            if (!state.isOffendedRunning) return;
            box.classList.add('walking');
            if (lid) {
                lid.style.animation = 'none';
                lid.style.transform = 'translateY(var(--lid-offset-y))';
            }
        }, 1200);
        
        // Фаза 2 (после 2.5 сек): коробка замерла вдали
        setTimeout(function() {
            if (!state.isOffendedRunning) return;
            box.classList.add('frozen');
            box.classList.remove('walking');
            box.style.animation = 'none';
            box.style.transform = 'rotateY(calc(var(--rotY) + 180deg)) rotateX(var(--rotX)) translateZ(100px) translateX(-40px)';
            if (lid) {
                lid.style.animation = 'none';
                lid.style.transform = 'translateY(var(--lid-offset-y))';
            }
        }, 2500);
        
        // Фаза 3 (после 5.5 сек): коробка подглядывает
        setTimeout(function() {
            if (!state.isOffendedRunning) return;
            box.classList.remove('frozen');
            box.style.animation = '';
            box.style.transform = '';
            if (lid) {
                lid.style.animation = 'none';
                lid.style.transform = 'translateY(var(--lid-offset-y))';
            }
            void box.offsetWidth;
            box.classList.add('peeking');
        }, 5500);
        
        // Фаза 4 (после 7.1 сек): коробка прячется обратно
        setTimeout(function() {
            if (!state.isOffendedRunning) return;
            box.classList.remove('peeking');
            box.classList.add('peek-return');
        }, 7100);
        
        // Фаза 5 (после 7.7 сек): снова замерла
        setTimeout(function() {
            if (!state.isOffendedRunning) return;
            box.classList.add('frozen');
            box.classList.remove('peek-return');
            box.style.animation = 'none';
            box.style.transform = 'rotateY(calc(var(--rotY) + 180deg)) rotateX(var(--rotX)) translateZ(100px) translateX(-40px)';
            if (lid) {
                lid.style.animation = 'none';
                lid.style.transform = 'translateY(var(--lid-offset-y))';
            }
        }, 7700);
        
        // Фаза 6 (после 10.7 сек): возвращается с "хохотом"
        setTimeout(function() {
            if (!state.isOffendedRunning) return;
            box.classList.remove('frozen');
            box.style.animation = '';
            box.style.transform = '';
            if (lid) {
                lid.style.animation = '';
                lid.style.transform = '';
            }
            void box.offsetWidth;
            box.classList.add('returning');
            if (lid) {
                lid.style.animation = 'lidLaugh 1.0s ease-in-out';
                lid.style.animationDelay = '0.4s';
            }
        }, 10700);
        
        // Финал (после 12.2 сек): всё возвращается в норму
        setTimeout(function() {
            if (!state.isOffendedRunning) return;
            box.classList.remove('returning', 'offended');
            box.style.animation = '';
            box.style.transform = '';
            if (lid) {
                lid.style.animation = '';
                lid.style.animationDelay = '';
                lid.style.transform = '';
            }
            if (boxShadow) {
                boxShadow.style.animation = 'none';
                boxShadow.style.opacity = '1';
                boxShadow.style.transform = '';
            }
            state.isOffendedRunning = false;
            state.lastInteraction = Date.now();
            self.scheduleGentle();
            self.scheduleOffended();
        }, 12200);
    },
    
    // ---- ЗАПУСК IDLE-ДВИЖКА ----
    
    start: function() {
        this.stop();  // На всякий случай останавливаем, если уже запущен
        state.idleRunning = true;
        state.lastInteraction = Date.now();
        
        this.scheduleOffended();
        
        var self = this;
        state.idleTimer = setInterval(function() {
            if (!state.idleRunning) return;
            if (state.isOffendedRunning || state.isAnimating) return;
            
            var elapsed = Date.now() - state.lastInteraction;
            
            // Если прошло больше IDLE_GENTLE_DELAY (30 сек) — запускаем мягкие анимации
            if (elapsed >= CONFIG.IDLE_GENTLE_DELAY && state.idleTimeouts.length === 0) {
                self.scheduleGentle();
            }
            
            // Если прошло больше IDLE_BARK_DELAY (3 мин) — все коробки "гавкают"
            if (elapsed >= CONFIG.IDLE_BARK_DELAY && !state.idleBarkTimeout) {
                self.stopGentleAnimations();
                self.triggerBarkBark();
                state.idleBarkTimeout = setTimeout(function() {
                    state.idleBarkTimeout = null;
                    state.lastInteraction = Date.now();
                }, 2000);
            }
        }, 500);  // Проверяем каждые полсекунды
    },
    
    // ---- ОСТАНОВКА IDLE-ДВИЖКА ----
    
    stop: function() {
        state.idleRunning = false;
        
        if (state.idleTimer) {
            clearInterval(state.idleTimer);
            state.idleTimer = null;
        }
        if (state.idleBarkTimeout) {
            clearTimeout(state.idleBarkTimeout);
            state.idleBarkTimeout = null;
        }
        if (state.offendedTimer) {
            clearTimeout(state.offendedTimer);
            state.offendedTimer = null;
        }
        
        this.stopGentleAnimations();
        this.clearAllBoxAnims();
        state.isOffendedRunning = false;
    }
};