let tasks = [];
let currentFilter = 'all';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskDescription = document.getElementById('task-description');
const taskPriority = document.getElementById('task-priority');
const taskList = document.getElementById('task-list');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const filterTabs = document.querySelectorAll('.filter-tab');

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
        renderTasks();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTask(e) {
    e.preventDefault();
    
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        description: taskDescription.value.trim(),
        priority: taskPriority.value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    taskInput.value = '';
    taskDescription.value = '';
    taskPriority.value = 'medium';
    
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleComplete(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function editTask(id) {
    const taskItem = document.querySelector(`[data-id="${id}"]`);
    if (!taskItem) return;
    
    const taskTextElement = taskItem.querySelector('.task-main-text');
    const editBtn = taskItem.querySelector('.btn-edit');
    
    if (!editBtn || !taskTextElement) return;
    
    const currentText = taskTextElement.textContent;
    
    taskTextElement.contentEditable = true;
    taskTextElement.classList.add('editing');
    taskTextElement.focus();
    
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(taskTextElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;
    editBtn.classList.remove('btn-edit');
    editBtn.classList.add('btn-save');
    
    editBtn.onclick = () => saveEdit(id, taskTextElement, currentText, editBtn, keydownHandler);
    
    const keydownHandler = function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit(id, taskTextElement, currentText, editBtn, keydownHandler);
        } else if (e.key === 'Escape') {
            taskTextElement.textContent = currentText;
            cancelEdit(taskTextElement, editBtn, id, keydownHandler);
        }
    };
    
    taskTextElement.addEventListener('keydown', keydownHandler);
}

function saveEdit(id, taskTextElement, originalText, editBtn, keydownHandler) {
    const newText = taskTextElement.textContent.trim();
    
    if (newText === '') {
        taskTextElement.textContent = originalText;
    } else {
        const task = tasks.find(task => task.id === id);
        if (task) {
            task.text = newText;
            saveTasks();
        }
    }
    
    if (editBtn) {
        cancelEdit(taskTextElement, editBtn, id, keydownHandler);
    }
}

function cancelEdit(taskTextElement, editBtn, id, keydownHandler) {
    if (keydownHandler) {
        taskTextElement.removeEventListener('keydown', keydownHandler);
    }
    
    taskTextElement.contentEditable = false;
    taskTextElement.classList.remove('editing');
    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>`;
    editBtn.classList.remove('btn-save');
    editBtn.classList.add('btn-edit');
    editBtn.onclick = () => editTask(id);
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    
    totalTasksEl.textContent = totalTasks;
    completedTasksEl.textContent = completedTasks;
    pendingTasksEl.textContent = pendingTasks;
    progressPercent.textContent = `${percentage}%`;
    
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% Complete`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

function setFilter(filter) {
    currentFilter = filter;
    filterTabs.forEach(tab => {
        if (tab.dataset.filter === filter) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    renderTasks();
}

function getFilteredTasks() {
    if (currentFilter === 'completed') {
        return tasks.filter(task => task.completed);
    } else if (currentFilter === 'active') {
        return tasks.filter(task => !task.completed);
    }
    return tasks;
}

function renderTasks() {
    taskList.innerHTML = '';
    
    const filteredTasks = getFilteredTasks();
    
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);
        
        li.innerHTML = `
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
            >
            <div class="task-content">
                <div class="task-header">
                    <span class="task-main-text">${escapeHtml(task.text)}</span>
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-date">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Created: ${formatDate(task.createdAt)}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-edit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-icon btn-delete">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleComplete(task.id));
        
        const editBtn = li.querySelector('.btn-edit');
        editBtn.onclick = () => editTask(task.id);
        
        const deleteBtn = li.querySelector('.btn-delete');
        deleteBtn.onclick = () => deleteTask(task.id);
        
        taskList.appendChild(li);
    });
    
    updateStats();
}

taskForm.addEventListener('submit', addTask);

filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        setFilter(tab.dataset.filter);
    });
});

loadTasks();
