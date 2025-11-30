let familyData = [];
let currentEditId = null;
let photoDataUrls = [];
let currentPhotoIndex = 0;
let mediaRecorder = null;
let audioChunks = [];
let audioDataUrl = null;

// Загрузка данных из localStorage при старте
window.addEventListener('load', () => {
    loadTheme();
    const saved = localStorage.getItem('familyTreeData');
    if (saved) {
        familyData = JSON.parse(saved);
    } else {
        familyData = [];
    }
    renderTree();
});

// Тема
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Сохранение данных
function saveData() {
    localStorage.setItem('familyTreeData', JSON.stringify(familyData));
    renderTree();
}

// Построение дерева
function buildTree(parentId = null) {
    const children = familyData.filter(person => {
        if (parentId === null) {
            return !familyData.some(p => p.children && p.children.includes(person.id));
        }
        const parent = familyData.find(p => p.id === parentId);
        return parent && parent.children && parent.children.includes(person.id);
    });

    if (children.length === 0) return '';

    let html = '<ul>';
    children.forEach(person => {
        const dates = person.deathDate 
            ? `${person.birthDate?.split('-')[0] || '?'} - ${person.deathDate.split('-')[0]}`
            : person.birthDate ? `р. ${person.birthDate.split('-')[0]}` : '';

        const genderClass = person.gender ? person.gender : '';
        const photo = person.photos && person.photos.length > 0 ? person.photos[0] : '';
        
        const spouse = person.spouseId ? familyData.find(p => p.id === person.spouseId) : null;
        const spouseInfo = spouse ? `<div class="spouse-indicator">💍 ${spouse.name}</div>` : '';

        html += `
            <li>
                <div class="person-card ${genderClass}" data-id="${person.id}" onclick="showViewModal(${person.id})">
                    <button class="edit-btn" onclick="event.stopPropagation(); showEditModal(${person.id})">✏️</button>
                    ${photo ? 
                        `<img src="${photo}" alt="${person.name}" class="person-photo">` :
                        `<div class="person-photo">👤</div>`
                    }
                    <div class="person-name">${person.name}</div>
                    <div class="person-dates">${dates}</div>
                    ${spouseInfo}
                </div>
                ${buildTree(person.id)}
            </li>
        `;
    });
    html += '</ul>';
    return html;
}

function renderTree() {
    const tree = document.getElementById('familyTree');
    if (familyData.length === 0) {
        tree.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌱</div>
                <h3>Древо пока пусто</h3>
                <p>Нажмите "Добавить" чтобы начать</p>
            </div>
        `;
    } else {
        tree.innerHTML = buildTree();
    }
}

// Поиск
function searchPerson() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.person-card');
    const clearBtn = document.querySelector('.btn-clear');
    
    clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
    
    cards.forEach(card => {
        card.classList.remove('highlighted');
        if (query.length > 0) {
            const name = card.querySelector('.person-name').textContent.toLowerCase();
            if (name.includes(query)) {
                card.classList.add('highlighted');
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.querySelector('.btn-clear').style.display = 'none';
    document.querySelectorAll('.person-card').forEach(card => {
        card.classList.remove('highlighted');
    });
}

// Модальные окна
function showViewModal(personId) {
    const person = familyData.find(p => p.id === personId);
    if (!person) return;

    currentEditId = personId;
    currentPhotoIndex = 0;
    
    document.getElementById('viewModalName').textContent = person.name;
    
    const carousel = document.getElementById('photoCarousel');
    const photo = document.getElementById('viewModalPhoto');
    
    if (person.photos && person.photos.length > 0) {
        photo.src = person.photos[0];
        photo.style.display = 'block';
        carousel.querySelector('.prev').style.display = person.photos.length > 1 ? 'block' : 'none';
        carousel.querySelector('.next').style.display = person.photos.length > 1 ? 'block' : 'none';
    } else {
        photo.style.display = 'none';
        carousel.querySelector('.prev').style.display = 'none';
        carousel.querySelector('.next').style.display = 'none';
    }
    
    let infoHtml = '';
    if (person.gender) {
        infoHtml += `<p><strong>Пол:</strong> ${person.gender === 'male' ? 'Мужской' : 'Женский'}</p>`;
    }
    if (person.birthDate) {
        infoHtml += `<p><strong>Дата рождения:</strong> ${formatDate(person.birthDate)}</p>`;
    }
    if (person.birthPlace) {
        infoHtml += `<p><strong>Место рождения:</strong> ${person.birthPlace}</p>`;
    }
    if (person.deathDate) {
        infoHtml += `<p><strong>Дата смерти:</strong> ${formatDate(person.deathDate)}</p>`;
    }
    if (person.spouseId) {
        const spouse = familyData.find(p => p.id === person.spouseId);
        if (spouse) {
            infoHtml += `<p><strong>Супруг(а):</strong> ${spouse.name}</p>`;
        }
    }
    if (person.bio) {
        infoHtml += `<p><strong>О персоне:</strong> ${person.bio}</p>`;
    }
    if (person.events) {
        infoHtml += `<p><strong>Важные события:</strong></p><ul style="margin-left: 20px;">`;
        person.events.split('\n').forEach(event => {
            if (event.trim()) infoHtml += `<li>${event}</li>`;
        });
        infoHtml += `</ul>`;
    }

    document.getElementById('viewModalInfo').innerHTML = infoHtml;
    
    // Медиа секция
    let mediaHtml = '';
    if (person.videoUrl) {
        const videoId = extractVideoId(person.videoUrl);
        if (videoId) {
            mediaHtml += `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
        }
    }
    if (person.audioUrl) {
        mediaHtml += `<div class="audio-container"><audio controls src="${person.audioUrl}"></audio></div>`;
    }
    document.getElementById('mediaSection').innerHTML = mediaHtml;
    
    document.getElementById('viewModal').style.display = 'flex';
}

function prevPhoto() {
    const person = familyData.find(p => p.id === currentEditId);
    if (!person || !person.photos || person.photos.length <= 1) return;
    
    currentPhotoIndex = (currentPhotoIndex - 1 + person.photos.length) % person.photos.length;
    document.getElementById('viewModalPhoto').src = person.photos[currentPhotoIndex];
}

function nextPhoto() {
    const person = familyData.find(p => p.id === currentEditId);
    if (!person || !person.photos || person.photos.length <= 1) return;
    
    currentPhotoIndex = (currentPhotoIndex + 1) % person.photos.length;
    document.getElementById('viewModalPhoto').src = person.photos[currentPhotoIndex];
}

function extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
}

function showAddPersonModal() {
    currentEditId = null;
    photoDataUrls = [];
    audioDataUrl = null;
    document.getElementById('editModalTitle').textContent = 'Добавить человека';
    document.getElementById('personForm').reset();
    renderPhotosPreview();
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('audioPreview').style.display = 'none';
    updateParentSelect();
    updateSpouseSelect();
    document.getElementById('editModal').style.display = 'flex';
}

function showEditModal(personId) {
    const person = familyData.find(p => p.id === personId);
    if (!person) return;

    currentEditId = personId;
    photoDataUrls = person.photos ? [...person.photos] : [];
    audioDataUrl = person.audioUrl || null;
    
    document.getElementById('editModalTitle').textContent = 'Редактировать';
    document.getElementById('personName').value = person.name;
    document.getElementById('personBirthDate').value = person.birthDate || '';
    document.getElementById('personDeathDate').value = person.deathDate || '';
    document.getElementById('personBio').value = person.bio || '';
    document.getElementById('personGender').value = person.gender || '';
    document.getElementById('personBirthPlace').value = person.birthPlace || '';
    document.getElementById('personEvents').value = person.events || '';
    document.getElementById('personVideo').value = person.videoUrl || '';
    
    renderPhotosPreview();
    
    const audioPreview = document.getElementById('audioPreview');
    if (audioDataUrl) {
        audioPreview.src = audioDataUrl;
        audioPreview.style.display = 'block';
    } else {
        audioPreview.style.display = 'none';
    }
    
    updateParentSelect(personId);
    updateSpouseSelect(personId);
    
    if (person.spouseId) {
        document.getElementById('personSpouse').value = person.spouseId;
    }
    
    document.getElementById('deleteBtn').style.display = 'block';
    document.getElementById('editModal').style.display = 'flex';
}

function editCurrentPerson() {
    closeModal('viewModal');
    showEditModal(currentEditId);
}

function updateParentSelect(excludeId = null) {
    const select = document.getElementById('personParent');
    select.innerHTML = '<option value="">Нет родителя (корень древа)</option>';
    
    familyData.forEach(person => {
        if (person.id !== excludeId) {
            const option = document.createElement('option');
            option.value = person.id;
            option.textContent = person.name;
            
            if (excludeId) {
                const parent = familyData.find(p => p.children && p.children.includes(excludeId));
                if (parent && parent.id === person.id) {
                    option.selected = true;
                }
            }
            
            select.appendChild(option);
        }
    });
}

function updateSpouseSelect(excludeId = null) {
    const select = document.getElementById('personSpouse');
    select.innerHTML = '<option value="">Нет супруга</option>';
    
    familyData.forEach(person => {
        if (person.id !== excludeId) {
            const option = document.createElement('option');
            option.value = person.id;
            option.textContent = person.name;
            select.appendChild(option);
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Обработка загрузки фото
document.getElementById('photoInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            photoDataUrls.push(event.target.result);
            renderPhotosPreview();
        };
        reader.readAsDataURL(file);
    });
    
    e.target.value = '';
});

function renderPhotosPreview() {
    const container = document.getElementById('photosPreview');
    container.innerHTML = photoDataUrls.map((url, index) => `
        <div class="photo-item">
            <img src="${url}" alt="Photo ${index + 1}">
            <button class="remove-photo" onclick="removePhoto(${index})">✕</button>
        </div>
    `).join('') + `
        <div class="add-photo-btn" onclick="document.getElementById('photoInput').click()">
            <span>➕</span>
            <p>Добавить</p>
        </div>
    `;
}

function removePhoto(index) {
    photoDataUrls.splice(index, 1);
    renderPhotosPreview();
}

// Аудио запись
async function toggleRecording() {
    const btn = document.getElementById('recordBtn');
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        btn.textContent = '🎤 Записать';
        btn.classList.remove('recording');
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = (e) => {
                    audioDataUrl = e.target.result;
                    const audioPreview = document.getElementById('audioPreview');
                    audioPreview.src = audioDataUrl;
                    audioPreview.style.display = 'block';
                };
                reader.readAsDataURL(audioBlob);
                
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            btn.textContent = '⏹️ Остановить';
            btn.classList.add('recording');
        } catch (err) {
            alert('Не удалось получить доступ к микрофону');
        }
    }
}

// Сохранение формы
document.getElementById('personForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('personName').value;
    const birthDate = document.getElementById('personBirthDate').value;
    const deathDate = document.getElementById('personDeathDate').value;
    const bio = document.getElementById('personBio').value;
    const gender = document.getElementById('personGender').value;
    const birthPlace = document.getElementById('personBirthPlace').value;
    const events = document.getElementById('personEvents').value;
    const videoUrl = document.getElementById('personVideo').value;
    const parentId = document.getElementById('personParent').value;
    const spouseId = document.getElementById('personSpouse').value;

    if (currentEditId) {
        const person = familyData.find(p => p.id === currentEditId);
        if (person) {
            if (person.spouseId) {
                const oldSpouse = familyData.find(p => p.id === person.spouseId);
                if (oldSpouse) oldSpouse.spouseId = null;
            }
            
            person.name = name;
            person.birthDate = birthDate;
            person.deathDate = deathDate;
            person.bio = bio;
            person.gender = gender;
            person.birthPlace = birthPlace;
            person.events = events;
            person.videoUrl = videoUrl;
            person.spouseId = spouseId ? parseInt(spouseId) : null;
            person.photos = photoDataUrls;
            person.audioUrl = audioDataUrl;
            
            if (spouseId) {
                const spouse = familyData.find(p => p.id == spouseId);
                if (spouse) spouse.spouseId = currentEditId;
            }
            
            familyData.forEach(p => {
                if (p.children) {
                    p.children = p.children.filter(id => id !== currentEditId);
                }
            });
            if (parentId) {
                const parent = familyData.find(p => p.id == parentId);
                if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(currentEditId);
                }
            }
        }
    } else {
        const newId = Math.max(0, ...familyData.map(p => p.id)) + 1;
        const newPerson = {
            id: newId,
            name,
            photos: photoDataUrls,
            birthDate,
            deathDate,
            bio,
            gender,
            birthPlace,
            events,
            videoUrl,
            audioUrl: audioDataUrl,
            spouseId: spouseId ? parseInt(spouseId) : null,
            children: []
        };
        
        familyData.push(newPerson);
        
        if (spouseId) {
            const spouse = familyData.find(p => p.id == spouseId);
            if (spouse) spouse.spouseId = newId;
        }
        
        if (parentId) {
            const parent = familyData.find(p => p.id == parentId);
            if (parent) {
                if (!parent.children) parent.children = [];
                parent.children.push(newId);
            }
        }
    }

    saveData();
    closeModal('editModal');
});

function deletePerson() {
    if (!currentEditId) return;
    
    if (confirm('Вы уверены, что хотите удалить этого человека?')) {
        const person = familyData.find(p => p.id === currentEditId);
        
        if (person && person.spouseId) {
            const spouse = familyData.find(p => p.id === person.spouseId);
            if (spouse) spouse.spouseId = null;
        }
        
        familyData.forEach(p => {
            if (p.children) {
                p.children = p.children.filter(id => id !== currentEditId);
            }
        });
        
        familyData = familyData.filter(p => p.id !== currentEditId);
        
        saveData();
        closeModal('editModal');
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year} г.`;
}

// Галерея
function showGallery() {
    const gallery = document.getElementById('galleryGrid');
    let allPhotos = [];
    
    familyData.forEach(person => {
        if (person.photos && person.photos.length > 0) {
            person.photos.forEach(photo => {
                allPhotos.push({ photo, person });
            });
        }
    });
    
    if (allPhotos.length === 0) {
        gallery.innerHTML = '<div class="empty-state"><p>Нет фотографий</p></div>';
    } else {
        gallery.innerHTML = allPhotos.map(item => `
            <div class="gallery-item" onclick="showViewModal(${item.person.id})">
                <img src="${item.photo}" alt="${item.person.name}">
                <div class="gallery-item-name">${item.person.name}</div>
            </div>
        `).join('');
    }
    
    document.getElementById('galleryModal').style.display = 'flex';
}

// Статистика
function showStats() {
    const stats = calculateStats();
    const content = document.getElementById('statsContent');
    
    content.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Всего человек</span>
            <span class="stat-value">${stats.totalPeople}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Поколений</span>
            <span class="stat-value">${stats.generations}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Мужчин</span>
            <span class="stat-value">${stats.males}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Женщин</span>
            <span class="stat-value">${stats.females}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Фотографий</span>
            <span class="stat-value">${stats.totalPhotos}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Супружеских пар</span>
            <span class="stat-value">${stats.marriages}</span>
        </div>
        ${stats.oldestPerson ? `
        <div class="stat-item">
            <span class="stat-label">Самый старший</span>
            <span class="stat-value">${stats.oldestPerson.name} (${stats.oldestAge} лет)</span>
        </div>
        ` : ''}
    `;
    
    document.getElementById('statsModal').style.display = 'flex';
}

function calculateStats() {
    const stats = {
        totalPeople: familyData.length,
        generations: calculateGenerations(),
        males: familyData.filter(p => p.gender === 'male').length,
        females: familyData.filter(p => p.gender === 'female').length,
        totalPhotos: familyData.reduce((sum, p) => sum + (p.photos ? p.photos.length : 0), 0),
        marriages: familyData.filter(p => p.spouseId).length / 2,
        oldestPerson: null,
        oldestAge: 0
    };
    
    familyData.forEach(person => {
        if (person.birthDate) {
            const endDate = person.deathDate ? new Date(person.deathDate) : new Date();
            const age = Math.floor((endDate - new Date(person.birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
            if (age > stats.oldestAge) {
                stats.oldestAge = age;
                stats.oldestPerson = person;
            }
        }
    });
    
    return stats;
}

function calculateGenerations() {
    function getDepth(personId, depth = 1) {
        const person = familyData.find(p => p.id === personId);
        if (!person || !person.children || person.children.length === 0) {
            return depth;
        }
        return Math.max(...person.children.map(childId => getDepth(childId, depth + 1)));
    }
    
    const roots = familyData.filter(person => 
        !familyData.some(p => p.children && p.children.includes(person.id))
    );
    
    if (roots.length === 0) return 1;
    return Math.max(...roots.map(root => getDepth(root.id)));
}

// Временная шкала
function showTimeline() {
    const timeline = {};
    
    familyData.forEach(person => {
        if (person.birthDate) {
            const year = person.birthDate.split('-')[0];
            if (!timeline[year]) timeline[year] = [];
            timeline[year].push({ person: person.name, event: 'Родился(ась)' });
        }
        if (person.deathDate) {
            const year = person.deathDate.split('-')[0];
            if (!timeline[year]) timeline[year] = [];
            timeline[year].push({ person: person.name, event: 'Умер(ла)' });
        }
        if (person.events) {
            person.events.split('\n').forEach(event => {
                const match = event.match(/^(\d{4})\s*-\s*(.+)/);
                if (match) {
                    const [, year, description] = match;
                    if (!timeline[year]) timeline[year] = [];
                    timeline[year].push({ person: person.name, event: description });
                }
            });
        }
    });
    
    const sortedYears = Object.keys(timeline).sort((a, b) => b - a);
    
    const content = document.getElementById('timelineContent');
    if (sortedYears.length === 0) {
        content.innerHTML = '<div class="empty-state"><p>Нет событий для отображения</p></div>';
    } else {
        content.innerHTML = sortedYears.map(year => `
            <div class="timeline-item">
                <div class="timeline-year">${year}</div>
                <div class="timeline-events">
                    ${timeline[year].map(item => `
                        <div class="timeline-event">
                            <div class="timeline-person">${item.person}</div>
                            <div class="timeline-description">${item.event}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    document.getElementById('timelineModal').style.display = 'flex';
}

// Карта
function showMap() {
    const places = {};
    
    familyData.forEach(person => {
        if (person.birthPlace) {
            if (!places[person.birthPlace]) {
                places[person.birthPlace] = [];
            }
            places[person.birthPlace].push(person.name);
        }
    });
    
    const content = document.getElementById('mapContent');
    if (Object.keys(places).length === 0) {
        content.innerHTML = '<div class="empty-state"><p>Нет данных о местах рождения</p></div>';
    } else {
        content.innerHTML = '<div class="map-list">' + Object.entries(places).map(([place, people]) => `
            <div class="map-item">
                <div>
                    <div class="map-place">📍 ${place}</div>
                    <div class="map-people">${people.join(', ')}</div>
                </div>
                <div class="stat-value">${people.length}</div>
            </div>
        `).join('') + '</div>';
    }
    
    document.getElementById('mapModal').style.display = 'flex';
}

// Экспорт в PDF
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Захватываем древо
    const treeElement = document.getElementById('familyTree');
    
    try {
        const canvas = await html2canvas(treeElement, {
            scale: 2,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.text('Генеалогическое древо семьи', 105, 15, { align: 'center' });
        pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
        
        pdf.save('family-tree.pdf');
    } catch (err) {
        alert('Ошибка при создании PDF');
    }
}

// Экспорт/Импорт данных
function exportData() {
    const dataStr = JSON.stringify(familyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'family-tree-data.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('importInput').click();
}

document.getElementById('importInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                if (confirm('Импорт заменит текущие данные. Продолжить?')) {
                    familyData = imported;
                    saveData();
                }
            } catch (err) {
                alert('Ошибка при чтении файла');
            }
        };
        reader.readAsText(file);
    }
});

// Закрытие модального окна
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
};
