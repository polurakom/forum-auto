// --- Управление экранами ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Обновляем активную кнопку в нижнем меню
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const navMap = {
        'screen-home': 0, 'screen-prices': 1, 'screen-booking': 2, 'screen-contacts': 3
    };
    if (navMap[screenId] !== undefined) {
        document.querySelectorAll('.nav-btn')[navMap[screenId]].classList.add('active');
    }
}

// --- Проверка статуса работы ---
function checkWorkStatus() {
    const now = new Date();
    const day = now.getDay(); // 0 = Вс, 1 = Пн, ..., 6 = Сб
    const hour = now.getHours();
    
    let isOpen = false;
    let closeTime = "";

    if (day >= 1 && day <= 5) { // Пн-Пт
        if (hour >= 8 && hour < 18) { isOpen = true; closeTime = "18:00"; }
    } else if (day === 6) { // Сб
        if (hour >= 8 && hour < 17) { isOpen = true; closeTime = "17:00"; }
    } else if (day === 0) { // Вс
        if (hour >= 8 && hour < 16) { isOpen = true; closeTime = "16:00"; }
    }

    const statusEl = document.getElementById('workStatus');
    if (isOpen) {
        statusEl.innerHTML = `<span style="color: #2ecc71;">● Открыто до ${closeTime}</span>`;
    } else {
        statusEl.innerHTML = `<span style="color: #e74c3c;">● Сейчас закрыто</span>`;
    }
}

// --- Генерация доступных слотов времени ---
function updateTimeSlots() {
    const dateInput = document.getElementById('bookingDate');
    const container = document.getElementById('timeSlotsContainer');
    const selectedTimeInput = document.getElementById('selectedTime');
    
    // Сбрасываем выбранное время при смене даты
    selectedTimeInput.value = '';
    container.innerHTML = '';

    if (!dateInput.value) return;

    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    const currentHour = today.getHours();

    // Определяем рабочие часы в зависимости от дня недели
    const day = selectedDate.getDay();
    let startHour = 8, endHour = 18;
    if (day === 6) endHour = 17; // Суббота
    if (day === 0) endHour = 16; // Воскресенье

    let hasAvailableSlots = false;

    // Генерируем слоты с шагом в 1 час
    for (let h = startHour; h < endHour; h++) {
        // ГЛАВНОЕ ИСПРАВЛЕНИЕ: Если сегодня, пропускаем часы, которые уже прошли + 1 час на подготовку
        if (isToday && h <= currentHour) {
            continue;
        }

        hasAvailableSlots = true;
        const timeString = `${h}:00`;
        
        const btn = document.createElement('button');
        btn.className = 'time-slot-btn';
        btn.textContent = timeString;
        btn.onclick = function() {
            // Убираем выделение со всех кнопок
            document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
            // Выделяем нажатую
            this.classList.add('selected');
            selectedTimeInput.value = timeString;
        };
        container.appendChild(btn);
    }

    if (!hasAvailableSlots) {
        container.innerHTML = '<p class="no-slots">На сегодня время для записи уже закончилось. Пожалуйста, выберите другой день.</p>';
    }
}

// --- Отправка заявки ---
function submitBooking() {
    const service = document.getElementById('serviceSelect').value;
    const car = document.getElementById('carModel').value.trim();
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('selectedTime').value;
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();

    // Валидация
    if (!car || !date || !time || !name || !phone) {
        alert('Пожалуйста, заполните все поля и выберите время!');
        return;
    }

    // Формируем сообщение для Telegram
    const message = `🔔 *Новая заявка на запись!*%0A%0A` +
                    `🔧 *Услуга:* ${service}%0A` +
                    `🚗 *Авто:* ${car}%0A` +
                    `📅 *Дата:* ${date}%0A` +
                    `⏰ *Время:* ${time}%0A` +
                    `👤 *Клиент:* ${name}%0A` +
                    `📞 *Телефон:* ${phone}%0A%0A` +
                    `⚠️ *Требуется подтверждение мастером!*`;

    // ЗАМЕНИТЕ 'ВАШ_ТОКЕН' и 'ВАШ_CHAT_ID' на реальные данные от @BotFather
    const BOT_TOKEN = 'ВАШ_ТОКЕН'; 
    const CHAT_ID = 'ВАШ_CHAT_ID';
    
    // Если токена нет, показываем демо-успех (для теста)
    if (BOT_TOKEN === 'ВАШ_ТОКЕН') {
        alert('✅ Заявка сформирована! (Вставьте реальный токен бота в script.js для отправки в Telegram)');
        console.log(decodeURIComponent(message));
        return;
    }

    // Отправка в Telegram
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${message}&parse_mode=Markdown`;
    
    fetch(url)
        .then(response => {
            if (response.ok) {
                alert('✅ Заявка успешно отправлена! Мастер свяжется с вами для подтверждения.');
                // Очистка формы
                document.getElementById('carModel').value = '';
                document.getElementById('clientName').value = '';
                document.getElementById('clientPhone').value = '';
                document.getElementById('selectedTime').value = '';
                document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
                showScreen('screen-home');
            } else {
                alert('❌ Ошибка отправки. Пожалуйста, позвоните нам по телефону.');
            }
        })
        .catch(error => {
            alert('❌ Ошибка сети. Пожалуйста, позвоните нам по телефону.');
        });
}

// --- Инициализация при загрузке ---
document.addEventListener('DOMContentLoaded', () => {
    checkWorkStatus();
    
    // Устанавливаем минимальную дату = сегодня
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;
    document.getElementById('bookingDate').value = today;
    
    updateTimeSlots();

    // Регистрация Service Worker для PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        });
    }
});

// Маска для телефона (простая)
document.getElementById('clientPhone').addEventListener('input', function (e) {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    if (!x[2] && x[1] !== '') {
        e.target.value = x[1] === '8' ? '8' : '+7';
    } else {
        e.target.value = !x[2] ? x[1] : '+7 (' + x[2] + (x[3] ? ') ' + x[3] : '') + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
    }
});
