// =====================================================
// audio-manager.js — Управление внешними аудиофайлами
// В отличие от SoundEngine (который синтезирует звуки),
// этот менеджер проигрывает загруженные .mp3/.ogg файлы:
//   - аудио при открытии коробки
//   - аудио режима «Задолбал» (циклично)
//   - аудио Netflix-заставки
//   - аудио Коробки PUTIN
//   - аудио Коробки Зрителей
// =====================================================

var AudioManager = {
    
    // ---- ОСТАНОВИТЬ ВСЁ ----
    // Выключает все проигрываемые аудиофайлы разом
    
    stopAll: function() {
        if (state.currentChestAudio) {
            state.currentChestAudio.pause();
            state.currentChestAudio = null;
        }
        if (state.currentAnnoyingAudio) {
            state.currentAnnoyingAudio.pause();
            state.currentAnnoyingAudio = null;
        }
        if (state.currentNetflixAudio) {
            state.currentNetflixAudio.pause();
            state.currentNetflixAudio.currentTime = 0;
            state.currentNetflixAudio = null;
        }
        if (state.viewerAudio) {
            state.viewerAudio.pause();
            state.viewerAudio = null;
        }
        this.stopPutinAudio();  // Отдельный метод для PUTIN (с затуханием)
    },
    
    // ---- ПРОИГРЫВАНИЕ АУДИО КОРОБКИ ----
    // url — ссылка на аудиофайл
    // loop — повторять ли бесконечно (true для режима «Задолбал»)
    
    playChestAudio: function(url, loop) {
        this.stopAll();
        
        if (!url || url.trim() === "") return;
        
        try {
            var audio = new Audio(url);
            audio.loop = loop || false;
            
            // ⭐ ДОБАВЬ ЭТИ СТРОЧКИ ДЛЯ ОТЛАДКИ
            console.log('🎵 playChestAudio:');
            console.log('  → URL:', url);
            console.log('  → chestAudioVolume:', state.chestAudioVolume);
            console.log('  → globalVolume:', state.globalVolume);
            console.log('  → итоговая громкость:', state.chestAudioVolume * state.globalVolume);
            
            audio.volume = state.chestAudioVolume * state.globalVolume;
            audio.play().catch(function(e) {
                console.log('Audio play error:', e);
            });
            
            if (!loop) {
                state.currentChestAudio = audio;
                var self = this;
                audio.addEventListener('ended', function() {
                    if (state.currentChestAudio === audio) {
                        state.currentChestAudio = null;
                    }
                });
            } else {
                state.currentAnnoyingAudio = audio;
            }
        } catch (e) {
            console.log('Error creating audio:', e);
        }
    },
    
    // ---- АУДИО РЕЖИМА «ЗАДОЛБАЛ» ----
    // Запускает зацикленное аудио для выбранной «задалбливающей» коробки
    
    playAnnoyingAudio: function() {
        if (state.annoyingAudioUrl && state.annoyingAudioUrl.trim() !== "" && state.annoyingChestEnabled) {
            this.playChestAudio(state.annoyingAudioUrl, true);  // true = зациклить
        }
    },
    
    // ---- АУДИО КОРОБКИ PUTIN ----
    // shuffleNumber — 1 или 2 (какая по счёту подкрутка)
    
    playPutinAudio: function(shuffleNumber) {
        // Останавливаем предыдущее PUTIN-аудио, если играло
        this.stopPutinAudio();
        
        var url = shuffleNumber === 1 ? state.putinAudio1Url : state.putinAudio2Url;
        if (!url || url.trim() === "") return;
        
        try {
            state.putinAudio = new Audio(url);
            state.putinAudio.volume = state.chestAudioVolume * state.globalVolume;
            state.putinAudio.play().catch(function() {});
        } catch (e) {}
    },
    
    // ---- ОСТАНОВКА PUTIN-АУДИО ----
    
    stopPutinAudio: function() {
        if (state.putinAudio) {
            state.putinAudio.pause();
            state.putinAudio.currentTime = 0;
            state.putinAudio = null;
        }
    },
    
    // ---- ТЕСТОВОЕ ПРОИГРЫВАНИЕ (2 секунды) ----
    // Используется в админ-панели для проверки аудио
    
    testAudio: function(url) {
        if (!url || url.trim() === "") return;
        try {
            var audio = new Audio(url);
            audio.volume = state.chestAudioVolume * state.globalVolume;
            audio.play().catch(function(e) {
                // Игнорируем ошибки автовоспроизведения
            });
            // Останавливаем через 2 секунды
            setTimeout(function() {
                audio.pause();
            }, 2000);
        } catch (e) {}
    },
    
    // ---- NETFLIX-ЗАСТАВКА ----
    // Включает эпичную музыку при показе заставки «ДА НАЧНЕТСЯ ИГРА»
    
    playNetflixSound: function() {
        // Если уже играет — не запускаем повторно
        if (state.currentNetflixAudio) return;
        
        // Стандартный звук Netflix-заставки (файл в интернете)
        var url = 'https://static.wfolio.ru/file/AqiFFw_TXMM4LDwoI2TPSYAM1lHVLAGB/F3eUE25SDaAaOfz9Lubl87eAATWSJOel/X6WMKlYhdcWqWmiJv7uvvhLdIs9AakDB/4_jT87_orDBhwl8qE0kwl-0WRgt_UebO/XIKo-IUc70bMi6VN7byqk6A89Cw59FjW/rE_-MIxqK6I.ogg';
        
        try {
            state.currentNetflixAudio = new Audio(url);
            state.currentNetflixAudio.loop = true;  // Зацикливаем, пока заставка на экране
            state.currentNetflixAudio.volume = state.chestAudioVolume * state.globalVolume * 0.9;
            state.currentNetflixAudio.play().catch(function() {});
        } catch (e) {}
    },
    
    // ---- ОСТАНОВКА NETFLIX-ЗВУКА ----
    
    stopNetflixSound: function() {
        if (state.currentNetflixAudio) {
            try {
                state.currentNetflixAudio.pause();
                state.currentNetflixAudio.currentTime = 0;
            } catch (e) {}
            state.currentNetflixAudio = null;
        }
    },
    
    // ---- КОРОБКА ЗРИТЕЛЕЙ: СЛУЧАЙНОЕ АУДИО ----
    // Выбирает случайный из трёх загруженных аудиофайлов и проигрывает
    
    playRandomViewerAudio: function() {
        // Собираем все непустые ссылки в массив
        var urls = [];
        if (state.viewerAudio1Url && state.viewerAudio1Url.trim() !== '') urls.push(state.viewerAudio1Url);
        if (state.viewerAudio2Url && state.viewerAudio2Url.trim() !== '') urls.push(state.viewerAudio2Url);
        if (state.viewerAudio3Url && state.viewerAudio3Url.trim() !== '') urls.push(state.viewerAudio3Url);
        
        if (urls.length === 0) return;  // Нет ни одной ссылки — выходим
        
        var randomUrl = urls[Math.floor(Math.random() * urls.length)];  // Случайный выбор
        
        try {
            this.stopViewerAudio();  // Останавливаем предыдущее
            state.viewerAudio = new Audio(randomUrl);
            state.viewerAudio.volume = state.chestAudioVolume * state.globalVolume;
            state.viewerAudio.play().catch(function() {});
        } catch (e) {}
    },
    
  // ---- ОСТАНОВКА АУДИО ЗРИТЕЛЕЙ (с плавным затуханием) ----
  
  stopViewerAudio: function() {
    if (!state.viewerAudio) return;
    
    var audio = state.viewerAudio;
    var startVol = audio.volume;
    var steps = 60;       // За сколько шагов затухаем
    var stepTime = 50;    // Миллисекунд между шагами (60 × 50 = 3000 мс = 3 секунды)
    var step = 0;
    
    var fadeInterval = setInterval(function() {
      step++;
      // Плавно уменьшаем громкость от начальной до 0
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      
      if (step >= steps) {
        // Затухание завершено — останавливаем
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load();
        if (state.viewerAudio === audio) {
          state.viewerAudio = null;
        }
      }
    }, stepTime);
  }
};