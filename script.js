const STORAGE_KEY = "daymark-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyMessage = document.querySelector("#empty-message");
const totalCount = document.querySelector("#total-count");
const completedCount = document.querySelector("#completed-count");
const filters = document.querySelector(".filters");
const todayLabel = document.querySelector("#today-label");

let tasks = loadTasks();
let currentFilter = "all";

todayLabel.textContent = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
}).format(new Date());

renderTasks();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    input.value = "";
    input.focus();
    return;
  }

  tasks.unshift({ id: createId(), text, completed: false });
  saveTasks();
  renderTasks();
  form.reset();
  input.focus();
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  currentFilter = button.dataset.filter;
  filters.querySelectorAll("[data-filter]").forEach((filterButton) => {
    const isSelected = filterButton === button;
    filterButton.classList.toggle("is-selected", isSelected);
    filterButton.setAttribute("aria-pressed", String(isSelected));
  });
  renderTasks();
});

taskList.addEventListener("change", (event) => {
  if (!event.target.matches(".task-checkbox")) return;

  const task = tasks.find((item) => item.id === event.target.dataset.id);
  if (!task) return;

  task.completed = event.target.checked;
  saveTasks();
  renderTasks();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) return;

  tasks = tasks.filter((task) => task.id !== button.dataset.id);
  saveTasks();
  renderTasks();
});

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(saved)) return [];

    const usedIds = new Set();
    return saved.flatMap((item) => {
      if (!item || typeof item.text !== "string" || !item.text.trim()) return [];

      let id = typeof item.id === "string" && item.id ? item.id : createId();
      while (usedIds.has(id)) id = createId();
      usedIds.add(id);

      return [{ id, text: item.text.trim(), completed: item.completed === true }];
    });
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    return;
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function renderTasks() {
  const completedTotal = tasks.filter((task) => task.completed).length;
  totalCount.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  completedCount.textContent = `${completedTotal} completed`;

  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  taskList.replaceChildren(...visibleTasks.map(createTaskElement));
  emptyState.hidden = visibleTasks.length > 0;

  if (tasks.length === 0) {
    emptyMessage.textContent = "No tasks yet";
  } else if (currentFilter === "active") {
    emptyMessage.textContent = "No active tasks";
  } else {
    emptyMessage.textContent = "No completed tasks";
  }
}

function createTaskElement(task) {
  const row = document.createElement("li");
  row.className = `task-row${task.completed ? " is-completed" : ""}`;

  const main = document.createElement("div");
  main.className = "task-main";

  const checkbox = document.createElement("input");
  checkbox.className = "task-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.dataset.id = task.id;
  checkbox.setAttribute("aria-label", `Mark ${task.text} as ${task.completed ? "active" : "completed"}`);

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.id = task.id;
  deleteButton.setAttribute("aria-label", `Delete ${task.text}`);
  deleteButton.textContent = "Delete";

  main.append(checkbox, text);
  row.append(main, deleteButton);
  return row;
}