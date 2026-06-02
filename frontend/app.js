const CONFIG = {
  region: "ap-southeast-1",
  userPoolId: "ap-southeast-1_kG2xh3fUP",
  clientId: "444s4t2ma8qendcc0ool3fp9p7",
  cognitoDomain: "https://ap-southeast-1kg2xh3fup.auth.ap-southeast-1.amazoncognito.com",
  redirectUri: "https://d2atra32tlg2yg.cloudfront.net",
  signOutUri: "https://d2atra32tlg2yg.cloudfront.net",
  apiBaseUrl: "",
  useMockData: true
};

const STORAGE_KEYS = {
  token: "taskManager.idToken",
  accessToken: "taskManager.accessToken",
  refreshToken: "taskManager.refreshToken",
  codeVerifier: "taskManager.pkceCodeVerifier",
  oauthState: "taskManager.oauthState",
  mockTasks: "taskManager.mockTasks"
};

const state = {
  tasks: [],
  editingTaskId: null
};

const elements = {
  loginBtn: document.querySelector("#loginBtn"),
  signupBtn: document.querySelector("#signupBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  taskForm: document.querySelector("#taskForm"),
  formTitle: document.querySelector("#taskFormTitle"),
  submitTaskBtn: document.querySelector("#submitTaskBtn"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  titleInput: document.querySelector("#titleInput"),
  descriptionInput: document.querySelector("#descriptionInput"),
  priorityInput: document.querySelector("#priorityInput"),
  dueDateInput: document.querySelector("#dueDateInput"),
  statusInput: document.querySelector("#statusInput"),
  priorityFilter: document.querySelector("#priorityFilter"),
  dueDateFilter: document.querySelector("#dueDateFilter"),
  clearFiltersBtn: document.querySelector("#clearFiltersBtn"),
  refreshBtn: document.querySelector("#refreshBtn"),
  taskList: document.querySelector("#taskList"),
  sessionStatus: document.querySelector("#sessionStatus"),
  messageBox: document.querySelector("#messageBox")
};

function getIdToken() {
  return sessionStorage.getItem(STORAGE_KEYS.token);
}

function setMessage(text, type = "") {
  elements.messageBox.textContent = text;
  elements.messageBox.className = `message ${type}`.trim();
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
  const state = randomBase64Url(24);

  sessionStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.oauthState, state);

  const params = new URLSearchParams({
    client_id: CONFIG.clientId,
    response_type: "code",
    scope: "email openid profile",
    redirect_uri: CONFIG.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state
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

async function loadTasks() {
  try {
    state.tasks = await requestApi("/tasks");
    renderTasks();
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function getFilteredTasks() {
  const priority = elements.priorityFilter.value;
  const dueDate = elements.dueDateFilter.value;

  return state.tasks.filter((task) => {
    const matchPriority = !priority || task.priority === priority;
    const matchDueDate = !dueDate || task.dueDate === dueDate;
    return matchPriority && matchDueDate;
  });
}

function renderTasks() {
  const tasks = getFilteredTasks();

  if (tasks.length === 0) {
    elements.taskList.innerHTML = '<div class="empty-state">Không có task phù hợp.</div>';
    return;
  }

  elements.taskList.innerHTML = tasks
    .map(
      (task) => `
        <article class="task-card">
          <header>
            <div>
              <h3>${escapeHtml(task.title)}</h3>
              <div class="task-meta">
                <span class="badge ${task.priority}">${task.priority}</span>
                <span>Hạn: ${escapeHtml(task.dueDate)}</span>
                <span>Trạng thái: ${escapeHtml(task.status)}</span>
              </div>
            </div>
          </header>
          <p>${escapeHtml(task.description || "Không có mô tả")}</p>
          <div class="task-actions">
            <button type="button" class="secondary" data-action="edit" data-id="${task.taskId}">Edit</button>
            <button type="button" class="danger" data-action="delete" data-id="${task.taskId}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetForm() {
  state.editingTaskId = null;
  elements.taskForm.reset();
  elements.dueDateInput.value = todayIsoDate();
  elements.priorityInput.value = "medium";
  elements.statusInput.value = "pending";
  elements.formTitle.textContent = "Tạo task";
  elements.submitTaskBtn.textContent = "Tạo task";
  elements.cancelEditBtn.hidden = true;
}

function startEdit(taskId) {
  const task = state.tasks.find((item) => item.taskId === taskId);
  if (!task) {
    return;
  }

  state.editingTaskId = taskId;
  elements.titleInput.value = task.title;
  elements.descriptionInput.value = task.description || "";
  elements.priorityInput.value = task.priority;
  elements.dueDateInput.value = task.dueDate;
  elements.statusInput.value = task.status;
  elements.formTitle.textContent = "Sửa task";
  elements.submitTaskBtn.textContent = "Lưu thay đổi";
  elements.cancelEditBtn.hidden = false;
  elements.titleInput.focus();
}

async function deleteTask(taskId) {
  await requestApi(`/tasks/${taskId}`, { method: "DELETE" });
  state.tasks = state.tasks.filter((task) => task.taskId !== taskId);
  renderTasks();
  setMessage("Đã xóa task.", "success");
}

async function handleSubmit(event) {
  event.preventDefault();
  const payload = {
    title: elements.titleInput.value.trim(),
    description: elements.descriptionInput.value.trim(),
    priority: elements.priorityInput.value,
    dueDate: elements.dueDateInput.value,
    status: elements.statusInput.value
  };

  try {
    if (state.editingTaskId) {
      const updatedTask = await requestApi(`/tasks/${state.editingTaskId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      state.tasks = state.tasks.map((task) =>
        task.taskId === state.editingTaskId ? updatedTask : task
      );
      setMessage("Đã cập nhật task.", "success");
    } else {
      const createdTask = await requestApi("/tasks", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      state.tasks = [createdTask, ...state.tasks];
      setMessage("Đã tạo task.", "success");
    }
    resetForm();
    renderTasks();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function updateAuthUi() {
  const isLoggedIn = Boolean(getIdToken());
  elements.loginBtn.hidden = isLoggedIn;
  elements.signupBtn.hidden = isLoggedIn;
  elements.logoutBtn.hidden = !isLoggedIn;
  elements.sessionStatus.textContent = CONFIG.useMockData
    ? isLoggedIn
      ? "Đã đăng nhập Cognito, CRUD đang chạy bằng dữ liệu mock local."
      : "Đang chạy bằng dữ liệu mock local."
    : isLoggedIn
      ? "Đã đăng nhập Cognito, sẵn sàng gọi API."
      : "Chưa đăng nhập. API thật sẽ yêu cầu JWT token.";
}

elements.loginBtn.addEventListener("click", () => {
  buildCognitoUrl("login")
    .then((url) => {
      window.location.href = url;
    })
    .catch((error) => setMessage(error.message, "error"));
});

elements.signupBtn.addEventListener("click", () => {
  buildCognitoUrl("signup")
    .then((url) => {
      window.location.href = url;
    })
    .catch((error) => setMessage(error.message, "error"));
});

elements.logoutBtn.addEventListener("click", () => {
  clearAuthStorage();
  window.location.href = buildCognitoLogoutUrl();
});

elements.taskForm.addEventListener("submit", handleSubmit);
elements.cancelEditBtn.addEventListener("click", resetForm);
elements.refreshBtn.addEventListener("click", loadTasks);
elements.priorityFilter.addEventListener("change", renderTasks);
elements.dueDateFilter.addEventListener("change", renderTasks);

elements.clearFiltersBtn.addEventListener("click", () => {
  elements.priorityFilter.value = "";
  elements.dueDateFilter.value = "";
  renderTasks();
});

elements.taskList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const taskId = button.dataset.id;
  if (button.dataset.action === "edit") {
    startEdit(taskId);
  }
  if (button.dataset.action === "delete") {
    await deleteTask(taskId);
  }
});

async function initApp() {
  try {
    await readTokenFromRedirect();
  } catch (error) {
    clearAuthStorage();
    setMessage(error.message, "error");
  }
  resetForm();
  updateAuthUi();
  loadTasks();
}

initApp();
