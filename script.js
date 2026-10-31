// === НАСТРОЙКИ TELEGRAM (Заполните своими данными) ===
const TG_BOT_TOKEN = '9063521967:AAFnqr3V_N0lL6jMU0ugCZ1g4mAQI4eaDQk'; // Например: '6012345678:AAH...'
const TG_CHAT_ID = '1976088155';     // Например: '123456789'

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    checkWorkStatus();
    // Устанавливаем минимальную дату сегодня
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;
    document.getElementById('bookingDate').value = today;
    updateTimeSlots();
});

// Навигация
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    // Простая логика подсветки кнопок (можно улучшить)
    const navMap = {'screen-home':0, 'screen-prices':1, 'screen-booking':2, 'screen-contacts':3};
    if(navMap[screenId] !== undefined) {
        document.querySelectorAll('.nav-btn')[navMap[screenId]].classList.add('active');
    }
    window.scrollTo(0,0);
}

// Проверка статуса работы
function checkWorkStatus() {
    const now = new Date();
    const day = now.getDay(); // 0=Вс, 1=Пн...
    const hour = now.getHours();
    
    let isOpen = false;
    let closeTime = '';

    if (day >= 1 && day <= 5) { if (hour >= 8 && hour < 18) { isOpen = true; closeTime = '18:00'; } }
    else if (day === 6) { if (hour >= 8 && hour < 17) { isOpen = true; closeTime = '17:00'; } }
    else if (day === 0) { if (hour >= 8 && hour < 16) { isOpen = true; closeTime = '16:00'; } }

    const statusEl = document.getElementById('workStatus');
    if (isOpen) {
        statusEl.textContent = `🟢 Открыто до ${closeTime}`;
        statusEl.style.background = 'rgba(39, 174, 96, 0.3)';
    } else {
        statusEl.textContent = '🔴 Сейчас закрыто';
        statusEl.style.background = 'rgba(231, 76, 60, 0.3)';
    }
}

// Генерация временных слотов
function updateTimeSlots() {
    const service = document.getElementById('serviceSelect').value;
    const dateStr = document.getElementById('bookingDate').value;
    const container = document.getElementById('timeSlotsContainer');
    container.innerHTML = '';
    document.getElementById('selectedTime').value = '';

    if (!dateStr) return;

    const date = new Date(dateStr);
    const day = date.getDay();
    
    let openHour = 8, closeHour = 18;
    if (day === 6) closeHour = 17;
    if (day === 0) closeHour = 16;

    const duration = (service.includes('Сход-развал')) ? 1.5 : 1.0;
    const step = 30; // шаг проверки в минутах

    let currentHour = openHour;
    let currentMin = 0;

    while (true) {
        const endMin = currentMin + (duration * 60);
        const endHour = currentHour + Math.floor(endMin / 60);
        const finalMin = endMin % 60;

        if (endHour > closeHour || (endHour === closeHour && finalMin > 0)) {
            break; // Время вышло за пределы рабочего дня
        }

        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        const slotBtn = document.createElement('div');
        slotBtn.className = 'time-slot';
        slotBtn.textContent = timeStr;
        slotBtn.onclick = () => selectTime(slotBtn, timeStr);
        container.appendChild(slotBtn);

        currentMin += step;
        if (currentMin >= 60) {
            currentHour += 1;
            currentMin -= 60;
        }
    }
}

function selectTime(element, time) {
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('selectedTime').value = time;
}

// Отправка в Telegram
async function submitBooking() {
    const service = document.getElementById('serviceSelect').value;
    const car = document.getElementById('carModel').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('selectedTime').value;
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;

    if (!car || !time || !name || !phone) {
        alert('Пожалуйста, заполните все поля и выберите время!');
        return;
    }

    const message = `🔔 *Новая запись на сайте!*%0A%0A🔧 *Услуга:* ${service}%0A🚗 *Авто:* ${car}%0A📅 *Дата:* ${date}%0A⏰ *Время:* ${time}%0A👤 *Клиент:* ${name}%0A📞 *Телефон:* ${phone}`;

    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage?chat_id=${TG_CHAT_ID}&text=${message}&parse_mode=Markdown`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            alert('✅ Заявка успешно отправлена! Мастер свяжется с вами для подтверждения.');
            // Сброс формы
            document.getElementById('carModel').value = '';
            document.getElementById('clientName').value = '';
            document.getElementById('clientPhone').value = '';
            document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
            showScreen('screen-home');
        } else {
            alert('❌ Ошибка отправки. Пожалуйста, позвоните нам по телефону.');
        }
    } catch (error) {
        alert('❌ Ошибка сети. Пожалуйста, позвоните нам по телефону.');
    }
}
