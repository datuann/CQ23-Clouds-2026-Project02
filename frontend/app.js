// ==========================================================================
// COGNITO CONFIGURATION & STORAGE KEYS
// ==========================================================================
const CONFIG = {
  region: "ap-southeast-1",
  userPoolId: "ap-southeast-1_kG2xh3fUP",
  clientId: "444s4t2ma8qendcc0ool3fp9p7",
  cognitoDomain: "https://ap-southeast-1kg2xh3fup.auth.ap-southeast-1.amazoncognito.com",
  redirectUri: "https://d2atra32tlg2yg.cloudfront.net",
  signOutUri: "https://d2atra32tlg2yg.cloudfront.net",
  apiBaseUrl: "https://nbht4903s6.execute-api.ap-southeast-1.amazonaws.com/prod",
  useMockData: false
};

const STORAGE_KEYS = {
  token: "taskManager.idToken",
  accessToken: "taskManager.accessToken",
  refreshToken: "taskManager.refreshToken",
  codeVerifier: "taskManager.pkceCodeVerifier",
  oauthState: "taskManager.oauthState",
  mockTasks: "taskManager.mockTasks"
};

// ==========================================================================
// APPLICATION STATE
// ==========================================================================
const state = {
  tasks: [],
  filters: {
    due: 'all',
    priority: 'all',
    search: ''
  },
  sortBy: 'dueDateAsc',
  editingTaskId: null,
  deletingTaskId: null,
  currentView: 'list', // 'list' | 'calendar'
  calendarDate: new Date(), // Month currently displayed
  selectedCalendarDate: null, // YYYY-MM-DD clicked for detailed view
  user: null // Active user session
};

// ==========================================================================
// DOM SELECTORS
// ==========================================================================
const DOM = {
  tasksGrid: document.getElementById('tasksGrid'),
  emptyState: document.getElementById('emptyState'),
  btnCreateTask: document.getElementById('btnCreateTask'),
  btnCreateTaskEmpty: document.getElementById('btnCreateTaskEmpty'),
  btnCloseDialog: document.getElementById('btnCloseDialog'),
  btnCancelTask: document.getElementById('btnCancelTask'),
  taskDialog: document.getElementById('taskDialog'),
  taskForm: document.getElementById('taskForm'),
  modalTitle: document.getElementById('modalTitle'),
  editTaskId: document.getElementById('editTaskId'),
  inputTitle: document.getElementById('inputTitle'),
  inputDesc: document.getElementById('inputDesc'),
  inputDueDate: document.getElementById('inputDueDate'),
  inputPriority: document.getElementById('inputPriority'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  
  // Stats
  statTotal: document.getElementById('statTotal'),
  statCompleted: document.getElementById('statCompleted'),
  statPending: document.getElementById('statPending'),
  statOverdue: document.getElementById('statOverdue'),
  
  // Badges
  badgeOverdue: document.getElementById('badgeOverdue'),
  badgeToday: document.getElementById('badgeToday'),
  
  // Filters & Search
  dueFilters: document.getElementById('dueFilters'),
  priorityFilters: document.getElementById('priorityFilters'),
  searchInput: document.getElementById('searchInput'),
  sortTasksSelect: document.getElementById('sortTasksSelect'),
  currentViewTitle: document.getElementById('currentViewTitle'),
  
  // Confirm Delete Dialog
  confirmDialog: document.getElementById('confirmDialog'),
  btnConfirmCancel: document.getElementById('btnConfirmCancel'),
  btnConfirmDelete: document.getElementById('btnConfirmDelete'),
  
  // Toasts
  toastContainer: document.getElementById('toastContainer'),
  
  // View Toggle and Calendar
  viewList: document.getElementById('viewList'),
  viewCalendar: document.getElementById('viewCalendar'),
  calendarContainer: document.getElementById('calendarContainer'),
  calendarMonthTitle: document.getElementById('calendarMonthTitle'),
  calendarDays: document.getElementById('calendarDays'),
  btnPrevMonth: document.getElementById('btnPrevMonth'),
  btnNextMonth: document.getElementById('btnNextMonth'),
  btnToday: document.getElementById('btnToday'),
  
  // Date Tasks Modal Dialog
  dateTasksDialog: document.getElementById('dateTasksDialog'),
  dateTasksTitle: document.getElementById('dateTasksTitle'),
  dateTasksList: document.getElementById('dateTasksList'),
  dateTasksEmpty: document.getElementById('dateTasksEmpty'),
  btnCloseDateTasks: document.getElementById('btnCloseDateTasks'),
  btnAddTaskForDate: document.getElementById('btnAddTaskForDate'),
  
  // Authentication Elements
  appWrapper: document.getElementById('appWrapper'),
  loginBtn: document.getElementById('loginBtn'),
  signupBtn: document.getElementById('signupBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  authActions: document.getElementById('authActions'),
  userProfileMenu: document.getElementById('userProfileMenu'),
  btnUserAvatar: document.getElementById('btnUserAvatar'),
  profileDropdown: document.getElementById('profileDropdown'),
  dropdownUserName: document.getElementById('dropdownUserName'),
  dropdownUserEmail: document.getElementById('dropdownUserEmail'),
  headerUserAvatar: document.getElementById('headerUserAvatar'),
  sessionStatus: document.getElementById('sessionStatus')
};

// ==========================================================================
// SEED INITIAL MOCK DATA
// ==========================================================================
const MOCK_TASKS = [
  {
    id: 'mock-1',
    title: 'Design review proposal for homepage',
    description: 'Create a clean, fluid mesh gradient layout using pastel shapes. Reference colors from the client mockup sheet.',
    dueDate: getRelativeDateString(0), // Today
    priority: 'high',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-2',
    title: 'Verify Cognito authentication redirect links',
    description: 'Ensure redirectUri points to CloudFront CDN endpoint to bypass any login loops during staging tests.',
    dueDate: getRelativeDateString(2), // 2 days from now
    priority: 'medium',
    completed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-3',
    title: 'VPC Endpoint route mapping audit',
    description: 'Confirm DynamoDB prefix list routes traffic directly through VPC Endpoint instead of public routing networks.',
    dueDate: getRelativeDateString(-2), // 2 days ago (Overdue)
    priority: 'low',
    completed: false,
    createdAt: new Date().toISOString()
  }
];

// Helper to get formatted date relative to today
function getRelativeDateString(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
async function initApp() {
  setupEventListeners();
  try {
    await readTokenFromRedirect();
  } catch (error) {
    clearAuthStorage();
    showToast(error.message, "error");
  }
  updateAuthUi();
  await loadTasks();
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Load tasks from API/Mock API
async function loadTasks() {
  try {
    const apiTasks = await requestApi("/tasks");
    
    // Normalize tasks from API format to modern client format
    state.tasks = apiTasks.map(t => ({
      id: t.taskId || t.id,
      title: t.title,
      description: t.description || '',
      priority: t.priority,
      dueDate: t.dueDate,
      completed: t.status === 'done',
      createdAt: t.createdAt
    }));
    
    updateStats();
    if (state.currentView === 'calendar') {
      renderCalendar();
    } else {
      renderTasks();
    }
  } catch (error) {
    showToast(error.message, "error");
    state.tasks = [];
    updateStats();
    if (state.currentView === 'calendar') {
      renderCalendar();
    } else {
      renderTasks();
    }
  }
}

// Stub function to maintain compatibility with legacy triggers
function saveTasksToStorage() {}

// ==========================================================================
// EVENT LISTENERS SETUP
// ==========================================================================
function setupEventListeners() {
  // Modal toggle listeners
  DOM.btnCreateTask.addEventListener('click', () => openTaskModal());
  DOM.btnCreateTaskEmpty.addEventListener('click', () => openTaskModal());
  DOM.btnCloseDialog.addEventListener('click', closeTaskModal);
  DOM.btnCancelTask.addEventListener('click', closeTaskModal);
  
  // Form submission
  DOM.taskForm.addEventListener('submit', handleFormSubmit);

  // Search input with basic debounce
  let searchTimeout;
  DOM.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value.trim().toLowerCase();
      if (state.currentView === 'calendar') {
        renderCalendar();
      } else {
        renderTasks();
      }
    }, 150);
  });

  // Sort change
  DOM.sortTasksSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderTasks();
  });

  // Sidebar Due Date filters - Switch back to list view to show specific list
  DOM.dueFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Reset active states
    DOM.dueFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.filters.due = btn.dataset.due;
    updateViewTitle();
    switchView('list');
  });

  // Sidebar Priority filters - Supports active calendar view filtering
  DOM.priorityFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Reset active states
    DOM.priorityFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.filters.priority = btn.dataset.priority;
    if (state.currentView === 'calendar') {
      renderCalendar();
    } else {
      renderTasks();
    }
  });

  // Confirm delete buttons
  DOM.btnConfirmCancel.addEventListener('click', closeDeleteConfirm);
  DOM.btnConfirmDelete.addEventListener('click', executeTaskDeletion);

  // View Toggle Bindings
  DOM.viewList.addEventListener('click', () => switchView('list'));
  DOM.viewCalendar.addEventListener('click', () => switchView('calendar'));

  // Calendar Month Navigation
  DOM.btnPrevMonth.addEventListener('click', () => navigateMonth(-1));
  DOM.btnNextMonth.addEventListener('click', () => navigateMonth(1));
  DOM.btnToday.addEventListener('click', () => {
    state.calendarDate = new Date();
    renderCalendar();
  });

  // Date Tasks Popover actions
  DOM.btnCloseDateTasks.addEventListener('click', () => DOM.dateTasksDialog.close());
  DOM.btnAddTaskForDate.addEventListener('click', handleAddFromDatePopover);

  // Authentication Bindings
  if (DOM.loginBtn) {
    DOM.loginBtn.addEventListener('click', () => {
      buildCognitoUrl("login")
        .then((url) => { window.location.href = url; })
        .catch((error) => showToast(error.message, "error"));
    });
  }
  if (DOM.signupBtn) {
    DOM.signupBtn.addEventListener('click', () => {
      buildCognitoUrl("signup")
        .then((url) => { window.location.href = url; })
        .catch((error) => showToast(error.message, "error"));
    });
  }
  if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener('click', () => {
      clearAuthStorage();
      window.location.href = buildCognitoLogoutUrl();
    });
  }
  if (DOM.btnUserAvatar) {
    DOM.btnUserAvatar.addEventListener('click', toggleUserDropdown);
  }
  
  // Close dropdown menu when clicking outside
  window.addEventListener('click', (e) => {
    if (DOM.profileDropdown && !e.target.closest('#userProfileMenu')) {
      DOM.profileDropdown.classList.remove('show');
    }
  });
}

// ==========================================================================
// RENDER & FILTER LOGIC
// ==========================================================================
function renderTasks() {
  const filtered = filterTasks(state.tasks);
  const sorted = sortTasks(filtered);

  // Clear task grid
  DOM.tasksGrid.innerHTML = '';

  if (sorted.length === 0) {
    DOM.tasksGrid.style.display = 'none';
    DOM.emptyState.style.display = 'flex';
  } else {
    DOM.emptyState.style.display = 'none';
    DOM.tasksGrid.style.display = 'grid';

    sorted.forEach(task => {
      const card = createTaskCard(task);
      DOM.tasksGrid.appendChild(card);
    });
  }
}

// Filter tasks combining Due Date, Priority, and Search parameters
function filterTasks(tasks) {
  const todayStr = new Date().toISOString().split('T')[0];
  const startOfWeek = getStartOfWeek();
  const endOfWeek = getEndOfWeek();

  return tasks.filter(task => {
    // 1. Search Query filter
    const matchesSearch = task.title.toLowerCase().includes(state.filters.search) || 
                          task.description.toLowerCase().includes(state.filters.search);

    // 2. Priority Filter
    const matchesPriority = state.filters.priority === 'all' || task.priority === state.filters.priority;

    // 3. Due Date Filter
    let matchesDue = true;
    if (state.filters.due === 'overdue') {
      matchesDue = task.dueDate < todayStr && !task.completed;
    } else if (state.filters.due === 'today') {
      matchesDue = task.dueDate === todayStr;
    } else if (state.filters.due === 'week') {
      matchesDue = task.dueDate >= startOfWeek && task.dueDate <= endOfWeek;
    }

    return matchesSearch && matchesPriority && matchesDue;
  });
}

// Sort tasks based on chosen metric
function sortTasks(tasks) {
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  return [...tasks].sort((a, b) => {
    if (state.sortBy === 'dueDateAsc') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (state.sortBy === 'dueDateDesc') {
      return new Date(b.dueDate) - new Date(a.dueDate);
    }
    if (state.sortBy === 'priorityDesc') {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    if (state.sortBy === 'priorityAsc') {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }
    if (state.sortBy === 'titleAsc') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });
}

// Update workspace title based on filters
function updateViewTitle() {
  const titles = {
    all: 'All Tasks',
    overdue: 'Overdue Tasks',
    today: 'Due Today',
    week: 'Due This Week'
  };
  DOM.currentViewTitle.textContent = titles[state.filters.due] || 'Tasks';
}

// ==========================================================================
// CARD DOM CREATION & EVENT BINDINGS
// ==========================================================================
function createTaskCard(task) {
  const card = document.createElement('article');
  card.className = `task-card ${task.completed ? 'completed' : ''}`;
  card.dataset.id = task.id;

  // Due date rendering helper
  const todayStr = new Date().toISOString().split('T')[0];
  let dueClass = '';
  let dueLabel = formatDateString(task.dueDate);

  if (!task.completed) {
    if (task.dueDate < todayStr) {
      dueClass = 'overdue';
      dueLabel = `Overdue (${dueLabel})`;
    } else if (task.dueDate === todayStr) {
      dueClass = 'today';
      dueLabel = 'Today';
    }
  }

  // Construct Inner HTML utilizing embedded SVGs
  card.innerHTML = `
    <div class="task-card-header">
      <div class="checkbox-container" role="checkbox" aria-checked="${task.completed}">
        <div class="checkbox-trigger">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
      </div>
      <div class="task-actions">
        <button class="btn-icon edit" aria-label="Edit task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>
        <button class="btn-icon delete" aria-label="Delete task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
    <p class="task-desc">${escapeHtml(task.description || 'No description provided.')}</p>
    <div class="task-card-footer">
      <div class="due-indicator ${dueClass}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>${dueLabel}</span>
      </div>
      <span class="priority-badge ${task.priority}">${task.priority}</span>
    </div>
  `;

  // Event bindings inside the card
  card.querySelector('.checkbox-container').addEventListener('click', () => {
    toggleTaskCompleted(task.id);
  });

  card.querySelector('.btn-icon.edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openTaskModal(task.id);
  });

  card.querySelector('.btn-icon.delete').addEventListener('click', (e) => {
    e.stopPropagation();
    openDeleteConfirm(task.id);
  });

  return card;
}

// ==========================================================================
// CRUD LOGIC & STATS UPDATING
// ==========================================================================

// Update Stats Panel and Filter Badge counts
function updateStats() {
  const todayStr = new Date().toISOString().split('T')[0];
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const overdue = state.tasks.filter(t => t.dueDate < todayStr && !t.completed).length;
  const todayCount = state.tasks.filter(t => t.dueDate === todayStr).length;

  DOM.statTotal.textContent = total;
  DOM.statCompleted.textContent = completed;
  DOM.statPending.textContent = pending;
  DOM.statOverdue.textContent = overdue;

  // Update badges
  if (overdue > 0) {
    DOM.badgeOverdue.textContent = overdue;
    DOM.badgeOverdue.style.display = 'inline-block';
  } else {
    DOM.badgeOverdue.style.display = 'none';
  }

  if (todayCount > 0) {
    DOM.badgeToday.textContent = todayCount;
    DOM.badgeToday.style.display = 'inline-block';
  } else {
    DOM.badgeToday.style.display = 'none';
  }
}

// Create or update task on form submission
// Create or update task on form submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = DOM.editTaskId.value;
  const title = DOM.inputTitle.value.trim();
  const description = DOM.inputDesc.value.trim();
  const dueDate = DOM.inputDueDate.value;
  const priority = DOM.inputPriority.value;

  if (!title || !dueDate) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const payload = {
    title,
    description,
    dueDate,
    priority,
    status: 'pending'
  };

  if (id) {
    // Edit existing task
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      payload.status = task.completed ? 'done' : 'pending';
      try {
        const updatedTask = await requestApi(`/tasks/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        
        task.title = updatedTask.title;
        task.description = updatedTask.description || '';
        task.dueDate = updatedTask.dueDate;
        task.priority = updatedTask.priority;
        task.completed = updatedTask.status === 'done';
        
        showToast('Task updated successfully.');
      } catch (error) {
        showToast(error.message, 'error');
        return;
      }
    }
  } else {
    // Create new task
    try {
      const createdTask = await requestApi('/tasks', {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      const newTask = {
        id: createdTask.taskId,
        title: createdTask.title,
        description: createdTask.description || '',
        dueDate: createdTask.dueDate,
        priority: createdTask.priority,
        completed: createdTask.status === 'done',
        createdAt: createdTask.createdAt
      };
      state.tasks.push(newTask);
      showToast('Task created successfully.');
    } catch (error) {
      showToast(error.message, 'error');
      return;
    }
  }

  updateStats();
  if (state.currentView === 'calendar') {
    renderCalendar();
  } else {
    renderTasks();
  }
  closeTaskModal();
}

// Toggle status of a task
async function toggleTaskCompleted(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const payload = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
    status: !task.completed ? 'done' : 'pending'
  };

  try {
    const updatedTask = await requestApi(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    
    task.completed = updatedTask.status === 'done';
    updateStats();
    
    if (state.currentView === 'calendar') {
      renderCalendar();
    } else {
      renderTasks();
    }
    
    if (task.completed) {
      showToast('Task marked as completed.');
    } else {
      showToast('Task marked as pending.');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Initiate task deletion flow
function openDeleteConfirm(id) {
  state.deletingTaskId = id;
  DOM.confirmDialog.showModal();
}

function closeDeleteConfirm() {
  state.deletingTaskId = null;
  DOM.confirmDialog.close();
}

function executeTaskDeletion() {
  const id = state.deletingTaskId;
  if (!id) return;

  const card = DOM.tasksGrid.querySelector(`.task-card[data-id="${id}"]`);
  
  // Close confirmation dialog immediately
  closeDeleteConfirm();

  // Apply smooth scale/fade-out animation
  if (card) {
    card.classList.add('fade-out');
    
    // Wait for animation frame to complete before deleting from state
    setTimeout(async () => {
      try {
        await requestApi(`/tasks/${id}`, { method: "DELETE" });
        state.tasks = state.tasks.filter(t => t.id !== id);
        updateStats();
        if (state.currentView === 'calendar') {
          renderCalendar();
        } else {
          renderTasks();
        }
        showToast('Task deleted successfully.', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    }, 300);
  } else {
    setTimeout(async () => {
      try {
        await requestApi(`/tasks/${id}`, { method: "DELETE" });
        state.tasks = state.tasks.filter(t => t.id !== id);
        updateStats();
        if (state.currentView === 'calendar') {
          renderCalendar();
        } else {
          renderTasks();
        }
        showToast('Task deleted successfully.', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    }, 10);
  }
}

// ==========================================================================
// MODAL DRAWER MANAGEMENT
// ==========================================================================
function openTaskModal(taskId = null) {
  state.editingTaskId = taskId;

  if (taskId) {
    // Editing Mode
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    DOM.modalTitle.textContent = 'Edit Task';
    DOM.editTaskId.value = task.id;
    DOM.inputTitle.value = task.title;
    DOM.inputDesc.value = task.description;
    DOM.inputDueDate.value = task.dueDate;
    DOM.inputPriority.value = task.priority;
  } else {
    // Creation Mode
    DOM.modalTitle.textContent = 'Create New Task';
    DOM.editTaskId.value = '';
    DOM.taskForm.reset();
    
    // Default due date to today
    DOM.inputDueDate.value = new Date().toISOString().split('T')[0];
    DOM.inputPriority.value = 'medium';
  }

  // Show dialog and backdrop
  DOM.modalBackdrop.classList.add('show');
  DOM.taskDialog.showModal();
  DOM.inputTitle.focus();
}

function closeTaskModal() {
  DOM.taskDialog.close();
  DOM.modalBackdrop.classList.remove('show');
  state.editingTaskId = null;
}

// ==========================================================================
// TOAST NOTIFICATIONS SYSTEM
// ==========================================================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // SVGs for success/error alerts
  let icon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  `;
  if (type === 'error') {
    icon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `;
  }

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  // Auto remove toast after 3.5s
  setTimeout(() => {
    toast.classList.add('fade-out');
    // Wait for fade-out animation to complete
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// ==========================================================================
// HELPER UTILITIES
// ==========================================================================
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDateString(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getStartOfWeek() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const start = new Date(date.setDate(diff));
  return start.toISOString().split('T')[0];
}

function getEndOfWeek() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) + 6;
  const end = new Date(date.setDate(diff));
  return end.toISOString().split('T')[0];
}

// ==========================================================================
// CALENDAR VIEW ENGINE & LOGIC
// ==========================================================================

function switchView(viewMode) {
  state.currentView = viewMode;
  
  if (viewMode === 'list') {
    DOM.viewCalendar.classList.remove('active');
    DOM.viewList.classList.add('active');
    DOM.calendarContainer.style.display = 'none';
    DOM.sortTasksSelect.disabled = false;
    renderTasks();
  } else {
    DOM.viewList.classList.remove('active');
    DOM.viewCalendar.classList.add('active');
    DOM.tasksGrid.style.display = 'none';
    DOM.emptyState.style.display = 'none';
    DOM.sortTasksSelect.disabled = true;
    DOM.calendarContainer.style.display = 'flex';
    renderCalendar();
  }
}

function renderCalendar() {
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  
  // Set Month Title Header
  DOM.calendarMonthTitle.textContent = state.calendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  
  DOM.calendarDays.innerHTML = '';
  
  // First day of current month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust firstDayIndex to make Monday index 0 (Sun becomes 6)
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Total days in previous month
  const prevTotalDays = new Date(year, month, 0).getDate();
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Render Previous Month offset days (Faded cells)
  for (let i = startOffset; i > 0; i--) {
    const dayNum = prevTotalDays - i + 1;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = formatDateToLocalISO(prevDate);
    const dayCell = createDayCell(dayNum, dateStr, true);
    DOM.calendarDays.appendChild(dayCell);
  }
  
  // 2. Render Current Month days
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(year, month, i);
    const dateStr = formatDateToLocalISO(date);
    const isToday = dateStr === todayStr;
    const dayCell = createDayCell(i, dateStr, false, isToday);
    DOM.calendarDays.appendChild(dayCell);
  }
  
  // 3. Render Next Month offset days (Faded cells) to complete a 42-cell grid (6 rows)
  const cellsRendered = startOffset + totalDays;
  const remainingCells = 42 - cellsRendered;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = formatDateToLocalISO(nextDate);
    const dayCell = createDayCell(i, dateStr, true);
    DOM.calendarDays.appendChild(dayCell);
  }
}

// Format Helper avoiding local timezone skewing
function formatDateToLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function navigateMonth(direction) {
  state.calendarDate.setMonth(state.calendarDate.getMonth() + direction);
  renderCalendar();
}

function createDayCell(dayNumber, dateStr, isOutsideMonth = false, isToday = false) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day';
  if (isOutsideMonth) cell.classList.add('outside-month');
  if (isToday) cell.classList.add('today');
  cell.dataset.date = dateStr;
  
  // Day indicator
  const numberSpan = document.createElement('span');
  numberSpan.className = 'day-number';
  numberSpan.textContent = dayNumber;
  cell.appendChild(numberSpan);
  
  // Filter & fetch tasks for this date
  const dayTasks = state.tasks.filter(task => {
    // Direct date string check (YYYY-MM-DD)
    const matchesDate = task.dueDate === dateStr;
    // Honor Priority filter
    const matchesPriority = state.filters.priority === 'all' || task.priority === state.filters.priority;
    // Honor Search term
    const matchesSearch = task.title.toLowerCase().includes(state.filters.search) || 
                          task.description.toLowerCase().includes(state.filters.search);
    
    return matchesDate && matchesPriority && matchesSearch;
  });
  
  const tasksWrapper = document.createElement('div');
  tasksWrapper.className = 'day-tasks';
  
  const maxVisible = 3;
  const visibleTasks = dayTasks.slice(0, maxVisible);
  
  visibleTasks.forEach(task => {
    const badge = document.createElement('div');
    badge.className = `calendar-task-badge ${task.priority} ${task.completed ? 'completed' : ''}`;
    badge.textContent = task.title;
    tasksWrapper.appendChild(badge);
  });
  
  if (dayTasks.length > maxVisible) {
    const moreBadge = document.createElement('div');
    moreBadge.className = 'calendar-task-more';
    moreBadge.textContent = `+${dayTasks.length - maxVisible} more`;
    tasksWrapper.appendChild(moreBadge);
  }
  
  cell.appendChild(tasksWrapper);
  
  // Bind click trigger to popover dialog
  cell.addEventListener('click', () => openDatePopover(dateStr));
  
  return cell;
}

function openDatePopover(dateStr) {
  state.selectedCalendarDate = dateStr;
  
  // Set formatted title
  DOM.dateTasksTitle.textContent = `Tasks for ${formatDateString(dateStr)}`;
  
  renderDateTasksList();
  
  DOM.dateTasksDialog.showModal();
}

function renderDateTasksList() {
  DOM.dateTasksList.innerHTML = '';
  
  const filteredTasks = state.tasks.filter(task => task.dueDate === state.selectedCalendarDate);
  
  if (filteredTasks.length === 0) {
    DOM.dateTasksEmpty.style.display = 'block';
    DOM.dateTasksList.style.display = 'none';
  } else {
    DOM.dateTasksEmpty.style.display = 'none';
    DOM.dateTasksList.style.display = 'flex';
    
    filteredTasks.forEach(task => {
      const item = document.createElement('div');
      item.className = `date-task-item ${task.completed ? 'completed' : ''}`;
      
      item.innerHTML = `
        <div class="date-task-left">
          <div class="checkbox-container" role="checkbox" aria-checked="${task.completed}">
            <div class="checkbox-trigger">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span class="date-task-title">${escapeHtml(task.title)}</span>
          </div>
        </div>
        <div class="date-task-right">
          <span class="priority-badge ${task.priority}">${task.priority}</span>
          <button class="btn-icon edit-popover" aria-label="Edit task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="btn-icon delete-popover" aria-label="Delete task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
      
      // Bind inline complete click
      item.querySelector('.checkbox-container').addEventListener('click', () => {
        toggleTaskCompleted(task.id);
        // Re-render current popover list to update visual complete status
        renderDateTasksList();
        // Update calendar cells in the background
        if (state.currentView === 'calendar') renderCalendar();
      });
      
      // Bind edit click
      item.querySelector('.edit-popover').addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.dateTasksDialog.close();
        openTaskModal(task.id);
      });
      
      // Bind delete click
      item.querySelector('.delete-popover').addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.dateTasksDialog.close();
        openDeleteConfirm(task.id);
      });
      
      DOM.dateTasksList.appendChild(item);
    });
  }
}

function handleAddFromDatePopover() {
  DOM.dateTasksDialog.close();
  
  // Open default task Modal
  openTaskModal();
  // Override standard default date with selected popover date
  DOM.inputDueDate.value = state.selectedCalendarDate;
}

// ==========================================================================
// COGNITO AUTHENTICATION & API HELPERS
// ==========================================================================

function getIdToken() {
  return sessionStorage.getItem(STORAGE_KEYS.token);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function seedMockTasks() {
  const existing = localStorage.getItem(STORAGE_KEYS.mockTasks);
  if (existing) {
    return JSON.parse(existing);
  }

  const demoTasks = [
    {
      taskId: crypto.randomUUID(),
      title: "Hoàn thiện giao diện frontend",
      description: "CRUD, filter priority/dueDate và responsive.",
      priority: "high",
      dueDate: todayIsoDate(),
      status: "pending",
      createdAt: new Date().toISOString()
    },
    {
      taskId: crypto.randomUUID(),
      title: "Chuẩn bị screenshot SE-1 đến SE-4",
      description: "S3 private, CloudFront OAC, curl kiểm tra 403/200.",
      priority: "medium",
      dueDate: todayIsoDate(),
      status: "pending",
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(STORAGE_KEYS.mockTasks, JSON.stringify(demoTasks));
  return demoTasks;
}

function saveMockTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.mockTasks, JSON.stringify(tasks));
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function randomBase64Url(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return base64UrlEncode(digest);
}

async function buildCognitoUrl(mode) {
  const path = mode === "signup" ? "signup" : "login";
  const codeVerifier = randomBase64Url(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const oauthState = randomBase64Url(24);

  sessionStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.oauthState, oauthState);

  const params = new URLSearchParams({
    client_id: CONFIG.clientId,
    response_type: "code",
    scope: "email openid profile",
    redirect_uri: CONFIG.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state: oauthState
  });
  return `${CONFIG.cognitoDomain}/${path}?${params.toString()}`;
}

function buildCognitoLogoutUrl() {
  const params = new URLSearchParams({
    client_id: CONFIG.clientId,
    logout_uri: CONFIG.signOutUri
  });
  return `${CONFIG.cognitoDomain}/logout?${params.toString()}`;
}

function clearAuthStorage() {
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.accessToken);
  sessionStorage.removeItem(STORAGE_KEYS.refreshToken);
  sessionStorage.removeItem(STORAGE_KEYS.codeVerifier);
  sessionStorage.removeItem(STORAGE_KEYS.oauthState);
}

async function exchangeCodeForTokens(code) {
  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.codeVerifier);
  if (!codeVerifier) {
    throw new Error("Không tìm thấy PKCE code verifier. Hãy thử login lại.");
  }

  const response = await fetch(`${CONFIG.cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CONFIG.clientId,
      code,
      redirect_uri: CONFIG.redirectUri,
      code_verifier: codeVerifier
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Token exchange failed with HTTP ${response.status}`);
  }

  const tokens = await response.json();
  sessionStorage.setItem(STORAGE_KEYS.token, tokens.id_token);
  sessionStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token);
  if (tokens.refresh_token) {
    sessionStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
  }
  sessionStorage.removeItem(STORAGE_KEYS.codeVerifier);
  sessionStorage.removeItem(STORAGE_KEYS.oauthState);
}

async function readTokenFromRedirect() {
  const query = new URLSearchParams(window.location.search);
  const code = query.get("code");
  const returnedState = query.get("state");
  const expectedState = sessionStorage.getItem(STORAGE_KEYS.oauthState);

  if (code) {
    if (!expectedState || returnedState !== expectedState) {
      throw new Error("OAuth state không hợp lệ. Hãy thử login lại.");
    }
    await exchangeCodeForTokens(code);
    history.replaceState(null, document.title, window.location.pathname);
    return;
  }

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return;
  }

  const params = new URLSearchParams(hash);
  const idToken = params.get("id_token");
  if (idToken) {
    sessionStorage.setItem(STORAGE_KEYS.token, idToken);
    history.replaceState(null, document.title, window.location.pathname);
  }
}

async function requestApi(path, options = {}) {
  if (CONFIG.useMockData || !CONFIG.apiBaseUrl) {
    return requestMockApi(path, options);
  }

  const token = getIdToken();
  if (!token) {
    throw new Error("Bạn cần đăng nhập Cognito trước khi gọi API thật.");
  }

  const response = await fetch(`${CONFIG.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with HTTP ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

async function requestMockApi(path, options = {}) {
  const method = options.method || "GET";
  const idMatch = path.match(/^\/tasks\/(.+)$/);
  let tasks = seedMockTasks();

  if (path === "/tasks" && method === "GET") {
    return tasks;
  }

  if (path === "/tasks" && method === "POST") {
    const body = JSON.parse(options.body || "{}");
    const task = {
      taskId: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString()
    };
    tasks = [task, ...tasks];
    saveMockTasks(tasks);
    return task;
  }

  if (idMatch && method === "PUT") {
    const taskId = idMatch[1];
    const body = JSON.parse(options.body || "{}");
    tasks = tasks.map((task) => (task.taskId === taskId ? { ...task, ...body } : task));
    saveMockTasks(tasks);
    return tasks.find((task) => task.taskId === taskId);
  }

  if (idMatch && method === "DELETE") {
    const taskId = idMatch[1];
    tasks = tasks.filter((task) => task.taskId !== taskId);
    saveMockTasks(tasks);
    return { message: "Deleted" };
  }

  throw new Error("Mock API route not found");
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function updateAuthUi() {
  const token = getIdToken();
  const isLoggedIn = Boolean(token);
  
  if (isLoggedIn) {
    if (DOM.authActions) DOM.authActions.style.display = 'none';
    if (DOM.userProfileMenu) DOM.userProfileMenu.style.display = 'block';
    
    const payload = parseJwt(token);
    if (payload) {
      state.user = {
        email: payload.email || '',
        name: payload.name || payload['cognito:username'] || payload.email.split('@')[0] || 'User'
      };
      updateUserAvatarUI();
    }
  } else {
    if (DOM.authActions) DOM.authActions.style.display = 'flex';
    if (DOM.userProfileMenu) DOM.userProfileMenu.style.display = 'none';
    state.user = null;
  }

  if (DOM.sessionStatus) {
    DOM.sessionStatus.textContent = CONFIG.useMockData
      ? isLoggedIn
        ? "Đã đăng nhập Cognito, CRUD đang chạy bằng dữ liệu mock local."
        : "Đang chạy bằng dữ liệu mock local."
      : isLoggedIn
        ? "Đã đăng nhập Cognito, sẵn sàng gọi API."
        : "Chưa đăng nhập. API thật sẽ yêu cầu JWT token.";
  }
}

function updateUserAvatarUI() {
  if (!state.user) return;
  
  // Extract initials
  let initials = 'JD';
  const nameParts = state.user.name.split(' ');
  if (nameParts.length > 0) {
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : '';
    initials = firstInitial + lastInitial;
  }
  
  // Update header avatar text
  if (DOM.headerUserAvatar) {
    const span = DOM.headerUserAvatar.querySelector('span');
    if (span) span.textContent = initials;
  }
  
  // Update dropdown texts
  if (DOM.dropdownUserName) DOM.dropdownUserName.textContent = state.user.name;
  if (DOM.dropdownUserEmail) DOM.dropdownUserEmail.textContent = state.user.email;
}

function toggleUserDropdown(e) {
  e.stopPropagation();
  if (DOM.profileDropdown) DOM.profileDropdown.classList.toggle('show');
}
