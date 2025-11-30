let familyData = [];
let currentEditId = null;
let photoDataUrls = [];
let currentPhotoIndex = 0;
let mediaRecorder = null;
let audioChunks = [];
let audioDataUrl = null;

window.addEventListener('load', () => {
    loadTheme();
    const saved = localStorage.getItem('familyTreeData');
    if (saved) familyData = JSON.parse(saved);
    renderTree();
});

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

function saveData() {
    localStorage.setItem('familyTreeData', JSON.stringify(familyData));
    renderTree();
}

function buildTree(parentId = null) {
    const children = familyData.filter(person => {
        if (parentId === null) return !familyData.some(p => p.children?.includes(person.id));
        return familyData.find(p => p.id === parentId)?.children?.includes(person.id);
    });

    if (!children.length) return '';

    let html = '<ul>';
    children.forEach(person => {
        const dates = person.deathDate 
            ? `${person.birthDate?.split('-')[0] || '?'} - ${person.deathDate.split('-')[0]}`
            : person.birthDate ? `р. ${person.birthDate.split('-')[0]}` : '';
        
        const photo = person.photos?.[0] || '';
        
        const spouses1 = familyData.filter(p => p.spouseId === person.id);
        const spouses2 = familyData.filter(p => person.spouseId === p.id);
        const allSpouses = [...new Set([...spouses1, ...spouses2])];
        const spouseInfo = allSpouses.length ? 
            `<div class="spouses-list">${allSpouses.map(s => `💍 ${s.name}`).join('<br>')}</div>` : '';

        html += `
            <li>
                <div class="person-card ${person.gender || ''}" data-id="${person.id}" onclick="showViewModal(${person.id})">
                    <button class="edit-btn" onclick="event.stopPropagation(); showEditModal(${person.id})">✏️</button>
                    ${photo ? `<img src="${photo}" alt="${person.name}" class="person-photo">` : `<div class="person-photo">👤</div>`}
                    <div class="person-name">${person.name}</div>
                    <div class="person-dates">${dates}</div>
                    ${spouseInfo}
                </div>
                ${buildTree(person.id)}
            </li>
        `;
    });
    return html + '</ul>';
}

function renderTree() {
    const tree = document.getElementById('familyTree');
    tree.innerHTML = familyData.length ? buildTree() : `
        <div class="empty-state">
            <div class="empty-state-icon">🌱</div>
            <h3>Древо пока пусто</h3>
            <p>Нажмите "Добавить" чтобы начать</p>
        </div>
    `;
}

function searchPerson() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.person-card');
    const clearBtn = document.querySelector('.btn-clear');
    
    clearBtn.style.display = query ? 'flex' : 'none';
    cards.forEach(card => {
        card.classList.toggle('highlighted', card.querySelector('.person-name')?.textContent.toLowerCase().includes(query));
        if (card.classList.contains('highlighted')) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.querySelector('.btn-clear').style.display = 'none';
    document.querySelectorAll('.person-card').forEach(card => card.classList.remove('highlighted'));
}

function showViewModal(personId) {
    const person = familyData.find(p => p.id === personId);
    if (!person) return;

    currentEditId = personId;
    currentPhotoIndex = 0;
    
    document.getElementById('viewModalName').textContent = person.name;
    
    const photo = document.getElementById('viewModalPhoto');
    const carousel = document.getElementById('photoCarousel');
    
    if (person.photos?.length) {
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
    if (person.gender) infoHtml += `<p><strong>Пол:</strong> ${person.gender === 'male' ? 'Мужской' : 'Женский'}</p>`;
    if (person.birthDate) infoHtml += `<p><strong>Дата рождения:</strong> ${formatDate(person.birthDate)}</p>`;
    if (person.birthPlace) infoHtml += `<p><strong>Место рождения:</strong> ${person.birthPlace}</p>`;
    if (person.deathDate) infoHtml += `<p><strong>Дата смерти:</strong> ${formatDate(person.deathDate)}</p>`;
    
    const spouses1 = familyData.filter(p => p.spouseId === person.id);
    const spouses2 = familyData.filter(p => person.spouseId === p.id);
    const allSpouses = [...new Set([...spouses1, ...spouses2])];
    if (allSpouses.length) {
        infoHtml += `<p><strong>Супруг(и/а):</strong></p><ul style="margin-left: 20px;">`;
        allSpouses.forEach(spouse => infoHtml += `<li>${spouse.name}</li>`);
        infoHtml += `</ul>`;
    }
    
    if (person.bio) infoHtml += `<p><strong>О персоне:</strong> ${person.bio}</p>`;
    if (person.events) {
        infoHtml += `<p><strong>Важные события:</strong></p><ul style="margin-left: 20px;">`;
        person.events.split('\n').forEach(event => event.trim() && (infoHtml += `<li>${event}</li>`));
        infoHtml += `</ul>`;
    }

    document.getElementById('viewModalInfo').innerHTML = infoHtml;
    
    let mediaHtml = '';
    if (person.videoUrl) {
        const videoId = person.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
        if (videoId) mediaHtml += `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
    }
    if (person.audioUrl) mediaHtml += `<div class="audio-container"><audio controls src="${person.audioUrl}"></audio></div>`;
    document.getElementById('mediaSection').innerHTML = mediaHtml;
    
    document.getElementById('viewModal').style.display = 'flex';
}

function prevPhoto() {
    const person = familyData.find(p => p.id === currentEditId);
    if (!person?.photos?.length || person.photos.length <= 1) return;
    currentPhotoIndex = (currentPhotoIndex - 1 + person.photos.length) % person.photos.length;
    document.getElementById('viewModalPhoto').src = person.photos[currentPhotoIndex];
}

function nextPhoto() {
    const person = familyData.find(p => p.id === currentEditId);
    if (!person?.photos?.length || person.photos.length <= 1) return;
    currentPhotoIndex = (currentPhotoIndex + 1) % person.photos.length;
    document.getElementById('viewModalPhoto').src = person.photos[currentPhotoIndex];
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
    document.getElementById('personName').value = person.name || '';
    document.getElementById('personBirthDate').value = person.birthDate || '';
    document.getElementById('personDeathDate').value = person.deathDate || '';
    document.getElementById('personBio').value = person.bio || '';
    document.getElementById('personGender').value = person.gender || '';
    document.getElementById('personBirthPlace').value = person.birthPlace || '';
    document.getElementById('personEvents').value = person.events || '';
    document.getElementById('personVideo').value = person.videoUrl || '';
    
    renderPhotosPreview();
    const audioPreview = document.getElementById('audioPreview');
    audioPreview.src = audioDataUrl || '';
    audioPreview.style.display = audioDataUrl ? 'block' : 'none';
    
    updateParentSelect(personId);
    updateSpouseSelect(personId);
    
    document.getElementById('deleteBtn').style.display = 'block';
    document.getElementById('editModal').style.display = 'flex';
}

function updateParentSelect(excludeId = null) {
    const select = document.getElementById('personParent');
    select.innerHTML = '<option value="">Нет родителя</option>';
    
    familyData.forEach(person => {
        if (person.id !== excludeId) {
            const option = new Option(person.name, person.id);
            if (excludeId) {
                const parent = familyData.find(p => p.children?.includes(excludeId));
                if (parent?.id === person.id) option.selected = true;
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
            select.appendChild(new Option(person.name, person.id));
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.getElementById('photoInput').addEventListener('change', e => {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
            photoDataUrls.push(event.target.result);
            renderPhotosPreview();
        };
        reader.readAsDataURL(file);
    });
    e.target.value = '';
});

function renderPhotosPreview() {
    const container = document.getElementById('photosPreview');
    container.innerHTML = photoDataUrls.map((url, i) => `
        <div class="photo-item">
            <img src="${url}" alt="Photo ${i + 1}">
            <button class="remove-photo" onclick="removePhoto(${i})">✕</button>
        </div>
    `).join('') + `
        <div class="add-photo-btn" onclick="document.getElementById('photoInput').click()">
            <span>➕</span><p>Добавить</p>
        </div>
    `;
}

function removePhoto(index) {
    photoDataUrls.splice(index, 1);
    renderPhotosPreview();
}

async function toggleRecording() {
    const btn = document.getElementById('recordBtn');
    if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();
        btn.textContent = '🎤 Записать';
        btn.classList.remove('recording');
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = e => {
                    audioDataUrl = e.target.result;
                    document.getElementById('audioPreview').src = audioDataUrl;
                    document.getElementById('audioPreview').style.display = 'block';
                };
                reader.readAsDataURL(blob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            btn.textContent = '⏹️ Остановить';
            btn.classList.add('recording');
        } catch (err) {
            alert('Ошибка микрофона');
        }
    }
}

document.getElementById('personForm').addEventListener('submit', e => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('personName').value,
        birthDate: document.getElementById('personBirthDate').value,
        deathDate: document.getElementById('personDeathDate').value,
        bio: document.getElementById('personBio').value,
        gender: document.getElementById('personGender').value,
        birthPlace: document.getElementById('personBirthPlace').value,
        events: document.getElementById('personEvents').value,
        videoUrl: document.getElementById('personVideo').value,
        parentId: document.getElementById('personParent').value,
        spouseId: document.getElementById('personSpouse').value
    };

    if (currentEditId) {
        const person = familyData.find(p => p.id === currentEditId);
        if (person) {
            if (person.spouseId) {
                const oldSpouse = familyData.find(p => p.id === person.spouseId);
                if (oldSpouse) oldSpouse.spouseId = null;
            }
            
            Object.assign(person, formData, { photos: photoDataUrls, audioUrl: audioDataUrl });
            
            if (formData.spouseId) {
                const spouse = familyData.find(p => p.id == formData.spouseId);
                if (spouse) spouse.spouseId = currentEditId;
            }
            
            familyData.forEach(p => p.children = p.children?.filter(id => id !== currentEditId) || []);
            if (formData.parentId) {
                const parent = familyData.find(p => p.id == formData.parentId);
                if (parent) parent.children = parent.children || [];
                if (!parent.children.includes(currentEditId)) parent.children.push(currentEditId);
            }
        }
    } else {
        const newId = Math.max(0, ...familyData.map(p => p.id)) + 1;
        const newPerson = { id: newId, children: [], ...formData, photos: photoDataUrls, audioUrl: audioDataUrl };
        
        familyData.push(newPerson);
        
        if (formData.spouseId) {
            const spouse = familyData.find(p => p.id == formData.spouseId);
            if (spouse) spouse.spouseId = newId;
        }
        if (formData.parentId) {
            const parent = familyData.find(p => p.id == formData.parentId);
            if (parent) parent.children = parent.children || [];
            if (!parent.children.includes(newId)) parent.children.push(newId);
        }
    }

    saveData();
    closeModal('editModal');
});

function deletePerson() {
    if (!currentEditId || !confirm('Удалить человека?')) return;
    
    const person = familyData.find(p => p.id === currentEditId);
    if (person?.spouseId) {
        const spouse = familyData.find(p => p.id === person.spouseId);
        if (spouse) spouse.spouseId = null;
    }
    
    familyData.forEach(p => p.children = p.children?.filter(id => id !== currentEditId) || []);
    familyData = familyData.filter(p => p.id !== currentEditId);
    
    saveData();
    closeModal('editModal');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return `${day} ${months[+month-1]} ${year} г.`;
}

function showGallery() {
    const gallery = document.getElementById('galleryGrid');
    const allPhotos = familyData.flatMap(p => p.photos?.map(photo => ({photo, person: p})) || []);
    
    gallery.innerHTML = allPhotos.length ? 
        allPhotos.map(item => `
            <div class="gallery-item" onclick="showViewModal(${item.person.id})">
                <img src="${item.photo}" alt="${item.person.name}">
                <div class="gallery-item-name">${item.person.name}</div>
            </div>
        `).join('') : '<div class="empty-state"><p>Нет фотографий</p></div>';
    
    document.getElementById('galleryModal').style.display = 'flex';
}

function showStats() {
    const stats = {
        totalPeople: familyData.length,
        males: familyData.filter(p => p.gender === 'male').length,
        females: familyData.filter(p => p.gender === 'female').length,
        totalPhotos: familyData.reduce((sum, p) => sum + (p.photos?.length || 0), 0),
        marriages: new Set(familyData.map(p => p.spouseId).filter(Boolean)).size,
        generations: calculateGenerations()
    };
    
    document.getElementById('statsContent').innerHTML = `
        <div class="stat-item"><span>Всего человек</span><span>${stats.totalPeople}</span></div>
        <div class="stat-item"><span>Поколений</span><span>${stats.generations}</span></div>
        <div class="stat-item"><span>Мужчин</span><span>${stats.males}</span></div>
        <div class="stat-item"><span>Женщин</span><span>${stats.females}</span></div>
        <div class="stat-item"><span>Фотографий</span><span>${stats.totalPhotos}</span></div>
        <div class="stat-item"><span>Супружеских пар</span><span>${stats.marriages}</span></div>
    `;
    document.getElementById('statsModal').style.display = 'flex';
}

function calculateGenerations() {
    const getDepth = (personId, depth = 1) => {
        const person = familyData.find(p => p.id === personId);
        return person?.children?.length ? Math.max(...person.children.map(id => getDepth(id, depth + 1))) : depth;
    };
    
    const roots = familyData.filter(p => !familyData.some(parent => parent.children?.includes(p.id)));
    return roots.length ? Math.max(...roots.map(r => getDepth(r.id))) : 1;
}

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
    });
    
    const sortedYears = Object.keys(timeline).sort((a, b) => b - a);
    const content = document.getElementById('timelineContent');
    
    content.innerHTML = sortedYears.length ? 
        sortedYears.map(year => `
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
        `).join('') : '<div class="empty-state"><p>Нет событий</p></div>';
    
    document.getElementById('timelineModal').style.display = 'flex';
}

function showMap() {
    const places = {};
    
    familyData.forEach(person => {
        if (person.birthPlace) {
            if (!places[person.birthPlace]) places[person.birthPlace] = [];
            places[person.birthPlace].push(person.name);
        }
    });
    
    const content = document.getElementById('mapContent');
    content.innerHTML = Object.keys(places).length ?
        '<div class="map-list">' + Object.entries(places).map(([place, people]) => `
            <div class="map-item">
                <div>
                    <div class="map-place">📍 ${place}</div>
                    <div class="map-people">${people.join(', ')}</div>
                </div>
                <div class="stat-value">${people.length}</div>
            </div>
        `).join('') + '</div>' : '<div class="empty-state"><p>Нет данных</p></div>';
    
    document.getElementById('mapModal').style.display = 'flex';
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const treeElement = document.getElementById('familyTree');
    
    try {
        html2canvas(treeElement, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.text('Генеалогическое древо семьи', 105, 15, { align: 'center' });
            pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
            pdf.save('family-tree.pdf');
        });
    } catch (err) {
        alert('Ошибка при создании PDF');
    }
}

function exportToExcel() {
    const wb = XLSX.utils.book_new();
    
    const excelData = familyData.map(person => {
        const parent = familyData.find(p => p.children && p.children.includes(person.id));
        const events = person.events ? person.events.replace(/\n/g, ';') : '';
        
        return {
            'ID': person.id,
            'Имя': person.name,
            'Пол (male/female)': person.gender || '',
            'Дата рождения (ГГГГ-ММ-ДД)': person.birthDate || '',
            'Дата смерти (ГГГГ-ММ-ДД)': person.deathDate || '',
            'Место рождения': person.birthPlace || '',
            'ID родителя': parent ? parent.id : '',
            'ID супруга': person.spouseId || '',
            'Биография': person.bio || '',
            'События (разделить ;)': events
        };
    });
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [{wch: 5}, {wch: 20}, {wch: 18}, {wch: 25}, {wch: 25}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 40}, {wch: 50}];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Семья');
    XLSX.writeFile(wb, 'family-tree.xlsx');
}

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

function importExcel() {
    document.getElementById('excelInput').click();
}

function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    
    const templateData = [
        ['ID', 'Имя', 'Пол (male/female)', 'Дата рождения (ГГГГ-ММ-ДД)', 'Дата смерти (ГГГГ-ММ-ДД)', 'Место рождения', 'ID родителя', 'ID супруга', 'Биография', 'События (разделить ;)'],
        [1, 'Иван Петрович', 'male', '1920-05-15', '1995-12-03', 'Москва', '', '', 'Ветеран', '1941 - Призван;1945 - Вернулся'],
        [2, 'Мария Ивановна', 'female', '1945-08-22', '', 'Санкт-Петербург', 1, '', 'Учительница', '1970 - Окончила']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{wch: 5}, {wch: 20}, {wch: 18}, {wch: 25}, {wch: 25}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 40}, {wch: 50}];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Семья');
    XLSX.writeFile(wb, 'family-tree-template.xlsx');
}

document.getElementById('excelInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            if (jsonData.length === 0) {
                alert('Таблица пустая!');
                return;
            }
            
            if (!confirm(`Найдено ${jsonData.length} записей. Заменить текущие данные?`)) {
                return;
            }
            
            const newFamilyData = jsonData.map((row, index) => {
                const person = {
                    id: row['ID'] || (index + 1),
                    name: row['Имя'] || 'Без имени',
                    gender: row['Пол (male/female)'] || '',
                    birthDate: row['Дата рождения (ГГГГ-ММ-ДД)'] || '',
                    deathDate: row['Дата смерти (ГГГГ-ММ-ДД)'] || '',
                    birthPlace: row['Место рождения'] || '',
                    bio: row['Биография'] || '',
                    events: row['События (разделить ;)'] || '',
                    photos: [],
                    children: []
                };
                
                if (person.events) person.events = person.events.replace(/;/g, '\n');
                
                if (typeof person.birthDate === 'number') person.birthDate = excelDateToJSDate(person.birthDate);
                if (typeof person.deathDate === 'number') person.deathDate = excelDateToJSDate(person.deathDate);
                
                return person;
            });
            
            jsonData.forEach((row, index) => {
                const parentId = row['ID родителя'];
                const spouseId = row['ID супруга'];
                
                if (parentId) {
                    const parent = newFamilyData.find(p => p.id == parentId);
                    if (parent) {
                        if (!parent.children) parent.children = [];
                        parent.children.push(newFamilyData[index].id);
                    }
                }
                
                if (spouseId) newFamilyData[index].spouseId = parseInt(spouseId);
            });
            
            familyData = newFamilyData;
            saveData();
            alert('✅ Данные успешно импортированы!');
            
        } catch (err) {
            console.error(err);
            alert('Ошибка при чтении Excel файла: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
});

document.getElementById('importInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            
            if (!Array.isArray(imported)) {
                alert('Некорректный формат JSON');
                return;
            }
            
            if (!confirm(`Найдено ${imported.length} записей. Заменить текущие данные?`)) {
                return;
            }
            
            familyData = imported;
            saveData();
            alert('✅ Данные успешно загружены!');
            
        } catch (err) {
            alert('Ошибка при чтении JSON файла');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    
    const year = date_info.getFullYear();
    const month = String(date_info.getMonth() + 1).padStart(2, '0');
    const day = String(date_info.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
};
