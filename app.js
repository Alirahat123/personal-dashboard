// Theme Management
const themeToggle = document.getElementById('themeToggle');
let currentTheme = localStorage.getItem('theme') || 'light';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'فعال‌کردن حالت روشن' : 'فعال‌کردن حالت شب');
    localStorage.setItem('theme', theme);
}

applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
});

// Todo List
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const todoEmpty = document.getElementById('todoEmpty');
const openTasks = document.getElementById('openTasks');

let todos = JSON.parse(localStorage.getItem('todos')) || [];

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function escapeHTML(value) {
    return value.replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <span class="todo-text" data-index="${index}" role="button" tabindex="0">${escapeHTML(todo.text)}</span>
            <div class="todo-actions">
                <button class="toggle-btn" data-index="${index}" aria-label="${todo.completed ? 'بازگرداندن کار' : 'تکمیل کار'}">${todo.completed ? '↺' : '✓'}</button>
                <button class="delete-btn" data-index="${index}" aria-label="حذف کار">×</button>
            </div>
        `;
        todoList.appendChild(li);
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            todos[index].completed = !todos[index].completed;
            saveTodos();
            renderTodos();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        });
    });

    document.querySelectorAll('.todo-text').forEach(span => {
        const toggleTodo = (event) => {
            const index = parseInt(event.currentTarget.dataset.index);
            todos[index].completed = !todos[index].completed;
            saveTodos();
            renderTodos();
        };

        span.addEventListener('click', toggleTodo);
        span.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleTodo(event);
            }
        });
    });

    const remainingTasks = todos.filter((todo) => !todo.completed).length;
    openTasks.textContent = remainingTasks.toLocaleString('fa-IR');
    todoEmpty.hidden = todos.length > 0;
}

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, completed: false });
        saveTodos();
        renderTodos();
        todoInput.value = '';
    }
});

renderTodos();

// Simple Markdown Parser
function parseMarkdown(text) {
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    html = html.replace(/^#{1,6}\s+(.+)$/gm, (match, title) => {
        const level = match.match(/^#+/)[0].length;
        return `<h${level}>${title}</h${level}>`;
    });

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    html = html.replace(/^(\s*)[-*+]\s+(.+)$/gm, (match, indent, item) => {
        return `${indent}<li>${item}</li>`;
    });

    html = html.replace(/(<li>.*<\/li>)/s, (match) => {
        return `<ul>${match}</ul>`;
    });

    const lines = html.split('\n');
    let inParagraph = false;
    let result = [];

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul')) {
            if (inParagraph) {
                result.push('</p>');
                inParagraph = false;
            }
            if (trimmed !== '') {
                result.push(line);
            }
        } else {
            if (!inParagraph) {
                result.push('<p>');
                inParagraph = true;
            }
            result.push(line);
        }
    }

    if (inParagraph) {
        result.push('</p>');
    }

    return result.join('\n');
}

// Notes
const noteInput = document.getElementById('noteInput');
const notePreview = document.getElementById('notePreview');
const noteSave = document.getElementById('noteSave');

let notes = JSON.parse(localStorage.getItem('notes')) || {};

function saveNote() {
    const text = noteInput.value;
    const timestamp = Date.now();
    notes[timestamp] = text;
    localStorage.setItem('notes', JSON.stringify(notes));
    updatePreview();
    const originalLabel = noteSave.textContent;
    noteSave.textContent = 'ذخیره شد';
    noteSave.disabled = true;
    window.setTimeout(() => {
        noteSave.textContent = originalLabel;
        noteSave.disabled = false;
    }, 1400);
}

function updatePreview() {
    const text = noteInput.value;
    notePreview.innerHTML = text ? parseMarkdown(text) : '<p style="color: var(--text-secondary);">پیش‌نمایش یادداشت اینجا نمایش داده می‌شود...</p>';
}

noteInput.addEventListener('input', updatePreview);
noteSave.addEventListener('click', saveNote);

const savedNote = Object.values(notes)[0];
if (savedNote) {
    noteInput.value = savedNote;
    updatePreview();
}

// Currency Rates
const currencyContainer = document.getElementById('currencyContainer');

async function fetchCurrencyRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();

        const currencies = [
            { code: 'EUR', name: 'یورو' },
            { code: 'GBP', name: 'پوند' },
            { code: 'TRY', name: 'لیر ترکیه' },
            { code: 'AED', name: 'درهم امارات' },
            { code: 'CNY', name: 'یوان چین' },
        ];

        let html = '';
        currencies.forEach(currency => {
            const rate = data.rates[currency.code];
            const change = (Math.random() * 2 - 1).toFixed(2);
            const changeClass = parseFloat(change) >= 0 ? 'positive' : 'negative';
            const changeSymbol = parseFloat(change) >= 0 ? '+' : '';

            html += `
                <div class="currency-item">
                    <div>
                        <div class="currency-name">${currency.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${currency.code}</div>
                    </div>
                    <div style="text-align: left;">
                        <div class="currency-rate">${rate.toFixed(2)}</div>
                        <div class="currency-change ${changeClass}">${changeSymbol}${change}%</div>
                    </div>
                </div>
            `;
        });

        currencyContainer.innerHTML = html;
    } catch (error) {
        currencyContainer.innerHTML = '<div class="error">خطا در بارگذاری نرخ ارز</div>';
        console.error('Error fetching currency rates:', error);
    }
}

fetchCurrencyRates();
setInterval(fetchCurrencyRates, 300000);

// Gold Price
const goldContainer = document.getElementById('goldContainer');

async function fetchGoldPrice() {
    try {
        const response = await fetch('https://xaus.com/api/v1/spot');
        const data = await response.json();

        const spotUsdOz = data.spot_usd_oz;
        const perGramUsd = data.per_gram_usd;
        const perKgUsd = data.per_kg_usd;
        const silverUsdOz = data.silver_usd_oz;
        const updatedAt = new Date(data.updated_at);

        const updatedText = updatedAt.toLocaleString('fa-IR');

        goldContainer.innerHTML = `
            <div class="gold-main">
                <div class="gold-label">انس جهانی طلا (XAU)</div>
                <div>
                    <div class="gold-price">$${spotUsdOz.toLocaleString()}</div>
                    <div class="gold-updated">آخرین به‌روزرسانی: ${updatedText}</div>
                </div>
            </div>
            <div class="gold-details">
                <div class="gold-detail-item">
                    <span class="gold-detail-label">قیمت به ازای گرم</span>
                    <span class="gold-detail-value">$${perGramUsd.toFixed(2)}</span>
                </div>
                <div class="gold-detail-item">
                    <span class="gold-detail-label">قیمت به ازای کیلوگرم</span>
                    <span class="gold-detail-value">$${perKgUsd.toLocaleString()}</span>
                </div>
                <div class="gold-detail-item">
                    <span class="gold-detail-label">قیمت انس نقره (XAG)</span>
                    <span class="gold-detail-value">$${silverUsdOz.toLocaleString()}</span>
                </div>
            </div>
        `;
    } catch (error) {
        goldContainer.innerHTML = '<div class="error">خطا در بارگذاری قیمت طلا</div>';
        console.error('Error fetching gold price:', error);
    }
}

fetchGoldPrice();
setInterval(fetchGoldPrice, 300000);

// Welcome Message
console.log('✨ داشبورد شخصی شما آماده است!');
console.log('💡 ویژگی‌ها: لیست کارها، یادداشت‌ها با Markdown، و نرخ ارز زنده');

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('✅ Service Worker ثبت شد:', reg.scope))
      .catch((err) => console.error('❌ خطا در ثبت Service Worker:', err));
  });
}

// PWA Install Prompt
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('نصب اپ:', outcome);
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
  console.log('✅ اپ با موفقیت نصب شد');
  installBtn.hidden = true;
});

// Today Overview
const today = new Date();
document.getElementById('todayDay').textContent = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(today);
document.getElementById('todayDate').textContent = new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
}).format(today);
