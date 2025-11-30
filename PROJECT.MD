# 📘 Техническая документация проекта

## 🎯 Обзор проекта

**Название:** Family Tree - Генеалогическое древо семьи  
**Версия:** 2.0  
**Тип:** Single Page Application (SPA)  
**Язык:** JavaScript (Vanilla), HTML5, CSS3  
**Лицензия:** MIT  

### Цель проекта
Создание простого в использовании веб-приложения для построения, визуализации и управления генеалогическим древом семьи с поддержкой мультимедиа и возможностью импорта/экспорта данных в различных форматах.

---

## 🏗️ Архитектура

### Общая структура

```
┌─────────────────────────────────────────────────────────┐
│                    Пользователь                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              index.html (View Layer)                     │
│  • Структура DOM                                         │
│  • Модальные окна                                        │
│  • Формы ввода                                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           css/style.css (Presentation)                   │
│  • Тёмная/светлая тема                                   │
│  • Адаптивная вёрстка                                    │
│  • Анимации                                              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           js/app.js (Business Logic)                     │
│  • Управление состоянием                                 │
│  • CRUD операции                                         │
│  • Импорт/экспорт                                        │
│  • Визуализация древа                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               localStorage (Data Layer)                  │
│  • Персистентное хранилище                               │
│  • Автосохранение                                        │
└─────────────────────────────────────────────────────────┘
```

### Паттерны проектирования

1. **MVC-подобная структура**
   - Model: `familyData` массив в app.js
   - View: HTML-шаблоны и DOM манипуляции
   - Controller: Функции обработки событий

2. **Модульность**
   - Разделение по функциональности
   - Независимые функции для каждой операции

3. **Event-driven architecture**
   - Обработка событий DOM
   - Lifecycle hooks (window.load)

---

## 📦 Структура данных

### Основная модель данных

```javascript
const familyData = [
  {
    id: Number,              // Уникальный идентификатор
    name: String,            // Полное имя
    gender: String,          // 'male' | 'female' | ''
    birthDate: String,       // 'YYYY-MM-DD'
    deathDate: String,       // 'YYYY-MM-DD' или ''
    birthPlace: String,      // Место рождения
    bio: String,             // Биография
    events: String,          // События (разделены \n)
    photos: Array<String>,   // Массив Base64 изображений
    videoUrl: String,        // URL YouTube видео
    audioUrl: String,        // Base64 аудио
    spouseId: Number,        // ID супруга
    children: Array<Number>  // Массив ID детей
  }
]
```

### Связи между объектами

```
Родитель
   ├─► children: [child1.id, child2.id]
   │
   └─► Дети
        ├─► child1 (parent найден через поиск в familyData)
        └─► child2

Супруги
   ├─► person1.spouseId = person2.id
   └─► person2.spouseId = person1.id (двусторонняя связь)
```

### Схема хранения в localStorage

```javascript
localStorage.setItem('familyTreeData', JSON.stringify(familyData));
localStorage.setItem('theme', 'dark' | 'light');
```

---

## 🔧 Технический стек

### Frontend
- **HTML5** - семантическая разметка
- **CSS3** - стилизация, Grid, Flexbox
- **JavaScript ES6+** - логика приложения

### Библиотеки (CDN)
```html
<!-- Excel обработка -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

<!-- PDF генерация -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<!-- HTML to Canvas -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

### Web APIs
- **localStorage** - хранение данных
- **FileReader** - чтение файлов
- **MediaRecorder** - запись аудио
- **Blob** - работа с бинарными данными
- **URL.createObjectURL** - создание ссылок для скачивания

---

## 🎨 CSS Архитектура

### CSS Custom Properties (переменные)

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --bg-gradient-start: #667eea;
  --bg-gradient-end: #764ba2;
  --text-color: #333;
  /* ... другие переменные */
}

[data-theme="dark"] {
  --primary-color: #8b9cff;
  --text-color: #e2e8f0;
  /* ... переопределение для тёмной темы */
}
```

### Методология

1. **BEM-подобное именование**
   ```css
   .person-card {}
   .person-card__photo {}
   .person-card--male {}
   ```

2. **Mobile-first подход**
   ```css
   /* Базовые стили для мобильных */
   .person-card { width: 100%; }
   
   /* Медиа-запросы для больших экранов */
   @media (min-width: 768px) {
     .person-card { width: 50%; }
   }
   ```

3. **CSS Grid & Flexbox**
   ```css
   .gallery-grid {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
   }
   ```

---

## 🔄 Жизненный цикл приложения

### 1. Инициализация

```javascript
window.addEventListener('load', () => {
  loadTheme();                    // Загрузка темы
  const saved = localStorage.getItem('familyTreeData');
  if (saved) {
    familyData = JSON.parse(saved);  // Восстановление данных
  }
  renderTree();                    // Первичный рендер
});
```

### 2. Рендеринг древа

```javascript
renderTree()
  └─► buildTree(parentId = null)
       ├─► Фильтрация детей
       ├─► Рекурсивное построение HTML
       └─► Вставка в DOM
```

### 3. CRUD операции

**Create:**
```javascript
showAddPersonModal()
  └─► Пользователь заполняет форму
       └─► personForm.submit
            ├─► Создание объекта person
            ├─► familyData.push(person)
            ├─► saveData()
            │    └─► localStorage.setItem()
            └─► renderTree()
```

**Read:**
```javascript
showViewModal(personId)
  └─► familyData.find(p => p.id === personId)
       └─► Отображение в модальном окне
```

**Update:**
```javascript
showEditModal(personId)
  └─► Загрузка данных в форму
       └─► personForm.submit
            ├─► Обновление объекта
            ├─► saveData()
            └─► renderTree()
```

**Delete:**
```javascript
deletePerson()
  └─► Удаление связей (spouse, children)
       ├─► familyData = familyData.filter()
       ├─► saveData()
       └─► renderTree()
```

---

## 📊 Импорт/Экспорт

### Формат Excel

#### Импорт
```javascript
importExcel()
  └─► FileReader.readAsArrayBuffer()
       └─► XLSX.read(data)
            └─► XLSX.utils.sheet_to_json()
                 ├─► Маппинг колонок
                 ├─► Создание объектов person
                 ├─► Установка связей
                 ├─► familyData = newData
                 └─► saveData()
```

#### Экспорт
```javascript
exportToExcel()
  └─► Маппинг familyData в Excel формат
       └─► XLSX.utils.json_to_sheet()
            └─► XLSX.utils.book_append_sheet()
                 └─► XLSX.writeFile()
```

### Формат JSON

**Экспорт:**
```javascript
JSON.stringify(familyData, null, 2)
  └─► Blob(['json string'])
       └─► URL.createObjectURL()
            └─► Скачивание файла
```

**Импорт:**
```javascript
FileReader.readAsText()
  └─► JSON.parse()
       └─► familyData = imported
            └─► saveData()
```

### PDF Экспорт

```javascript
exportToPDF()
  └─► html2canvas(treeElement)
       └─► canvas.toDataURL()
            └─► jsPDF.addImage()
                 └─► pdf.save()
```

---

## 🎤 Работа с медиа

### Множественные фотографии

```javascript
photos: ['data:image/png;base64,iVBOR...', 'data:image/jpeg;base64,/9j/4...']
```

**Загрузка:**
```javascript
photoInput.addEventListener('change', (e) => {
  Array.from(e.target.files).forEach(file => {
    FileReader.readAsDataURL(file)
      └─► photoDataUrls.push(result)
  });
});
```

### Аудио запись

```javascript
toggleRecording()
  └─► navigator.mediaDevices.getUserMedia({audio: true})
       └─► MediaRecorder(stream)
            ├─► mediaRecorder.start()
            └─► mediaRecorder.onstop
                 └─► Blob(audioChunks)
                      └─► FileReader.readAsDataURL()
                           └─► audioDataUrl = result
```

### Видео встраивание

```javascript
extractVideoId(url)
  └─► RegExp match для YouTube
       └─► <iframe src="youtube.com/embed/{videoId}">
```

---

## 🔍 Алгоритмы

### Построение дерева (рекурсивный)

```javascript
function buildTree(parentId = null) {
  // 1. Найти всех детей данного родителя
  const children = familyData.filter(person => {
    if (parentId === null) {
      // Корневые элементы (без родителей)
      return !familyData.some(p => 
        p.children && p.children.includes(person.id)
      );
    }
    const parent = familyData.find(p => p.id === parentId);
    return parent?.children?.includes(person.id);
  });

  // 2. Для каждого ребёнка создать HTML
  let html = '<ul>';
  children.forEach(person => {
    html += `<li>
      <div class="person-card">...</div>
      ${buildTree(person.id)}  // Рекурсия для потомков
    </li>`;
  });
  html += '</ul>';
  
  return html;
}
```

### Расчёт количества поколений

```javascript
function calculateGenerations() {
  function getDepth(personId, depth = 1) {
    const person = familyData.find(p => p.id === personId);
    if (!person?.children?.length) return depth;
    
    return Math.max(
      ...person.children.map(childId => 
        getDepth(childId, depth + 1)
      )
    );
  }
  
  // Найти корневые узлы
  const roots = familyData.filter(person => 
    !familyData.some(p => 
      p.children?.includes(person.id)
    )
  );
  
  return Math.max(...roots.map(root => getDepth(root.id)));
}
```

### Поиск по имени

```javascript
function searchPerson() {
  const query = searchInput.value.toLowerCase();
  
  document.querySelectorAll('.person-card').forEach(card => {
    const name = card.querySelector('.person-name')
                     .textContent.toLowerCase();
    
    if (name.includes(query)) {
      card.classList.add('highlighted');
      card.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  });
}
```

---

## 🎯 Оптимизация производительности

### 1. Минимизация DOM манипуляций

```javascript
// ❌ Плохо: много обращений к DOM
familyData.forEach(person => {
  const div = document.createElement('div');
  document.body.appendChild(div);
});

// ✅ Хорошо: один рендер
const html = familyData.map(person => 
  `<div>...</div>`
).join('');
container.innerHTML = html;
```

### 2. Debouncing для поиска

```javascript
let searchTimeout;
function searchPerson() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    // Поиск через 300мс после прекращения ввода
    performSearch();
  }, 300);
}
```

### 3. Ленивая загрузка фото

```javascript
<img src="placeholder.jpg" 
     data-src="real-photo.jpg" 
     loading="lazy">
```

### 4. Оптимизация Base64

```javascript
// Сжатие изображений перед сохранением
function compressImage(base64, maxWidth = 800) {
  const img = new Image();
  img.src = base64;
  
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = maxWidth / img.width;
    canvas.width = maxWidth;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };
}
```

---

## 🔐 Безопасность

### 1. XSS защита

```javascript
// ❌ Опасно
container.innerHTML = userInput;

// ✅ Безопасно
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### 2. Валидация данных

```javascript
function validatePerson(data) {
  if (!data.name || data.name.trim() === '') {
    throw new Error('Имя обязательно');
  }
  
  if (data.birthDate && !isValidDate(data.birthDate)) {
    throw new Error('Неверный формат даты');
  }
  
  return true;
}
```

### 3. Ограничение размера данных

```javascript
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

function checkStorageSize() {
  const dataSize = new Blob([
    JSON.stringify(familyData)
  ]).size;
  
  if (dataSize > MAX_STORAGE_SIZE) {
    alert('Превышен лимит хранилища');
    return false;
  }
  return true;
}
```

---

## 🧪 Тестирование

### Ручное тестирование

**Чек-лист функциональности:**
- [ ] Добавление человека
- [ ] Редактирование
- [ ] Удаление
- [ ] Загрузка фото
- [ ] Запись аудио
- [ ] Связь родитель-ребёнок
- [ ] Связь супругов
- [ ] Экспорт JSON
- [ ] Импорт JSON
- [ ] Экспорт Excel
- [ ] Импорт Excel
- [ ] Экспорт PDF
- [ ] Поиск
- [ ] Галерея
- [ ] Статистика
- [ ] Временная шкала
- [ ] Карта мест
- [ ] Смена темы

### Тестовые данные

```javascript
const testData = [
  {
    id: 1,
    name: "Test Person 1",
    gender: "male",
    birthDate: "1990-01-01",
    children: [2, 3]
  },
  {
    id: 2,
    name: "Test Person 2",
    gender: "female",
    birthDate: "2010-01-01",
    spouseId: 3
  }
];
```

---

## 🐛 Отладка

### Console logging

```javascript
function debugTree() {
  console.log('=== Family Tree Debug ===');
  console.log('Total people:', familyData.length);
  console.log('Data:', familyData);
  
  // Проверка связей
  familyData.forEach(person => {
    const parent = familyData.find(p => 
      p.children?.includes(person.id)
    );
    console.log(`${person.name} -> Parent: ${parent?.name}`);
  });
}
```

### Проверка localStorage

```javascript
// В консоли браузера
localStorage.getItem('familyTreeData');
JSON.parse(localStorage.getItem('familyTreeData'));
```

### Сброс данных

```javascript
function resetData() {
  if (confirm('Удалить все данные?')) {
    localStorage.clear();
    familyData = [];
    renderTree();
  }
}
```

---

## 📱 Адаптивность

### Breakpoints

```css
/* Mobile: < 768px */
@media (max-width: 768px) {
  .person-card { min-width: 120px; }
  .btn { padding: 6px 12px; }
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) and (max-width: 1024px) {
  .container { max-width: 900px; }
}

/* Desktop: > 1024px */
@media (min-width: 1024px) {
  .container { max-width: 1400px; }
}
```

### Touch events

```javascript
// Обработка свайпов для карусели
let touchStartX = 0;

photoCarousel.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});

photoCarousel.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchStartX - touchEndX;
  
  if (diff > 50) nextPhoto();
  if (diff < -50) prevPhoto();
});
```

---

## 🚀 Deployment

### GitHub Pages

```bash
# 1. Push в main
git add .
git commit -m "Update"
git push origin main

# 2. GitHub автоматически деплоит
# Доступно: https://username.github.io/family-tree
```

### Альтернативные хостинги

**Netlify:**
```bash
# Подключить репозиторий GitHub
# Автодеплой при каждом push
```

**Vercel:**
```bash
vercel --prod
```

**Свой сервер:**
```bash
# Просто скопировать файлы в web-директорию
scp -r family-tree/* user@server:/var/www/html/
```

---

## 🔄 Версионирование

### Semantic Versioning

```
MAJOR.MINOR.PATCH

2.0.0 - Текущая версия
│ │ │
│ │ └─► Исправления багов
│ └───► Новые функции (обратная совместимость)
└─────► Несовместимые изменения
```

### Changelog

**v2.0.0** (2025-01-30)
- ✨ Добавлен импорт/экспорт Excel
- ✨ Множественные фотографии
- ✨ Аудио заметки
- ✨ Видео встраивание
- ✨ Временная шкала
- ✨ Карта мест рождения

**v1.0.0** (2025-01-15)
- 🎉 Первый релиз
- ✨ Базовое древо
- ✨ CRUD операции
- ✨ Экспорт JSON

---

## 📚 Зависимости

### Внешние библиотеки

| Библиотека | Версия | Назначение | Лицензия |
|-----------|--------|------------|----------|
| SheetJS | 0.18.5 | Excel обработка | Apache 2.0 |
| jsPDF | 2.5.1 | PDF генерация | MIT |
| html2canvas | 1.4.1 | HTML → Canvas | MIT |

### Размеры библиотек

- xlsx.full.min.js: ~700KB
- jspdf.umd.min.js: ~180KB
- html2canvas.min.js: ~70KB

**Итого:** ~950KB внешних библиотек

---

## 🎓 Обучение

### Для разработчиков

**Изучить код:**
1. Начните с `index.html` (структура)
2. Посмотрите `css/style.css` (стили)
3. Разберите `js/app.js` (логика)

**Ключевые концепции:**
- Работа с localStorage
- Рекурсивное построение древа
- FileReader API
- MediaRecorder API
- Excel parsing

---

## 📞 Контрибьюция

### Как помочь проекту

1. **Форкните** репозиторий
2. **Создайте ветку** `feature/amazing-feature`
3. **Коммитьте** изменения
4. **Пушьте** в ветку
5. **Откройте** Pull Request

### Code Style

```javascript
// Используйте camelCase
const personData = {};

// Функции с глаголами
function addPerson() {}
function removePerson() {}

// Константы UPPER_CASE
const MAX_PHOTO_SIZE = 5000000;

// Комментарии для сложной логики
// Рекурсивное построение древа
function buildTree(parentId) { ... }
```

---

## 📝 Лицензия

MIT License

Copyright (c) 2025 Family Tree Project

---

## 🔗 Полезные ссылки

- [MDN Web Docs](https://developer.mozilla.org/)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [jsPDF GitHub](https://github.com/parallax/jsPDF)
- [html2canvas](https://html2canvas.hertzen.com/)

---

*Последнее обновление: 30 ноября 2025*
