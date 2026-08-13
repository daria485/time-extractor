// ===============================
// TIME EXTRACTOR
// Расчёт активного времени в чатах 1С-Коннект
// ===============================

let rawData = null;
let analysisResult = [];
let detectedEmployees = [];

// ===============================
// Справочник линий 1С-Коннект
// ===============================

// ===============================
// Справочник линий Альтап
// ===============================

const CONNECT_LINES = [
    {
        id: "ca1744da-5079-11ed-9bb6-00505601495b",
        name: "! АЛЬТАП: ЛК"
    },
    {
        id: "b4da4d40-2978-11ef-9ef5-00505601495b",
        name: "ALTAPP Внутренняя"
    },
    {
        id: "2e6c5d29-bb84-11e6-80e3-0025904f970d",
        name: "ALTAPP Клиентам"
    },
    {
        id: "65fe7282-bb83-11e6-80e3-0025904f970d",
        name: "ALTAPP Партнерам"
    },
    {
        id: "c07f2a30-8f9e-11ef-887c-00505601495b",
        name: "ALTAPP Федеральная линия поддержки клиентов 1С (1)"
    },
    {
        id: "8abecf72-a8cb-11ef-9815-00505601495b",
        name: "ALTAPP Федеральная линия поддержки клиентов 1С (2)"
    },
    {
        id: "cdf56de4-f8fa-11ef-9819-00505601495b",
        name: "ALTAPP Бухгалтерия"
    },
    {
        id: "c45ec0e4-dcd1-11f0-98e9-00505601495b",
        name: "ALTAPP по работе в программах 1С"
    }
];

// ===============================
// DOM
// ===============================

const tabFile = document.getElementById("tabFile");
const tabHttp = document.getElementById("tabHttp");

const fileSourceBlock = document.getElementById("fileSourceBlock");
const httpSourceBlock = document.getElementById("httpSourceBlock");

const fileInput = document.getElementById("fileInput");
const loadHttpBtn = document.getElementById("loadHttpBtn");

const apiUrlInput = document.getElementById("apiUrl");
const dateFromInput = document.getElementById("dateFrom");
const dateToInput = document.getElementById("dateTo");
const dialogLineInput = document.getElementById("dialogLine");
const apiLoginInput = document.getElementById("apiLogin");
const apiPasswordInput = document.getElementById("apiPassword");

const analyzeBtn = document.getElementById("analyzeBtn");
const exportBtn = document.getElementById("exportBtn");

const employeeCompanyInput = document.getElementById("employeeCompany");
const maxIntervalInput = document.getElementById("maxInterval");
const minMessageTimeInput = document.getElementById("minMessageTime");
const includeSpecialistInitiatedInput = document.getElementById("includeSpecialistInitiated");

const employeesPanel = document.getElementById("employeesPanel");
const employeesList = document.getElementById("employeesList");
const selectAllEmployeesBtn = document.getElementById("selectAllEmployeesBtn");
const clearEmployeesBtn = document.getElementById("clearEmployeesBtn");

const summary = document.getElementById("summary");
const resultsPanel = document.getElementById("resultsPanel");
const resultBody = document.getElementById("resultBody");

const totalDialogsEl = document.getElementById("totalDialogs");
const employeeDialogsEl = document.getElementById("employeeDialogs");
const employeeMessagesEl = document.getElementById("employeeMessages");
const totalTimeEl = document.getElementById("totalTime");

const dialogsModal = document.getElementById("dialogsModal");
const closeDialogsModal = document.getElementById("closeDialogsModal");
const dialogsModalTitle = document.getElementById("dialogsModalTitle");
const dialogsModalSubtitle = document.getElementById("dialogsModalSubtitle");
const dialogsModalBody = document.getElementById("dialogsModalBody");

// ===============================
// INIT
// ===============================

initApp();

function initApp() {
    fillLinesSelect();
}

// ===============================
// EVENTS
// ===============================

tabFile.addEventListener("click", () => switchSource("file"));
tabHttp.addEventListener("click", () => switchSource("http"));

fileInput.addEventListener("change", handleFileUpload);
loadHttpBtn.addEventListener("click", loadDataByHttp);

analyzeBtn.addEventListener("click", runAnalysis);
exportBtn.addEventListener("click", exportCsv);

selectAllEmployeesBtn.addEventListener("click", selectAllEmployees);
clearEmployeesBtn.addEventListener("click", clearEmployees);

employeeCompanyInput.addEventListener("change", () => {
    if (rawData) {
        detectAndRenderEmployees();
    }
});

resultBody.addEventListener("click", event => {
    const button = event.target.closest(".view-dialogs-btn");

    if (!button) {
        return;
    }

    const employeeName = button.dataset.employee;

    if (!employeeName) {
        alert("Не удалось определить сотрудника для просмотра диалогов.");
        return;
    }

    openReadableDialogsModal(employeeName);
});

if (closeDialogsModal) {
    closeDialogsModal.addEventListener("click", closeReadableDialogsModal);
}

if (dialogsModal) {
    dialogsModal.addEventListener("click", event => {
        if (event.target === dialogsModal) {
            closeReadableDialogsModal();
        }
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && dialogsModal && !dialogsModal.hidden) {
        closeReadableDialogsModal();
    }
});

// ===============================
// Заполнение списка линий
// ===============================

function fillLinesSelect() {
    dialogLineInput.innerHTML = "";

    CONNECT_LINES
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "ru"))
        .forEach(line => {
            const option = document.createElement("option");
            option.value = line.id;
            option.textContent = line.name;
            dialogLineInput.appendChild(option);
        });

    const defaultLine = CONNECT_LINES.find(line => line.name === "ALTAPP Партнерам");

    if (defaultLine) {
        dialogLineInput.value = defaultLine.id;
    }
}

// ===============================
// Источник данных
// ===============================

function switchSource(source) {
    if (source === "file") {
        tabFile.classList.add("active");
        tabHttp.classList.remove("active");
        fileSourceBlock.hidden = false;
        httpSourceBlock.hidden = true;
        return;
    }

    tabHttp.classList.add("active");
    tabFile.classList.remove("active");
    fileSourceBlock.hidden = true;
    httpSourceBlock.hidden = false;
}

// ===============================
// Загрузка файла
// ===============================

function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const parsedData = JSON.parse(e.target.result);
            setRawData(parsedData, "Файл успешно загружен. Можно выбирать сотрудников и запускать расчёт.");
        } catch (error) {
            alert("Не удалось прочитать JSON-файл. Проверьте, что загружена корректная выгрузка.");
            resetData();
        }
    };

    reader.readAsText(file, "UTF-8");
}

// ===============================
// HTTP-загрузка из 1С через локальный proxy
// ===============================

async function loadDataByHttp() {
    const apiUrl = cleanText(apiUrlInput.value);
    const dateFrom = dateFromInput.value;
    const dateTo = dateToInput.value;
    const lineId = cleanText(dialogLineInput.value);
    const login = cleanText(apiLoginInput.value);
    const password = apiPasswordInput.value;

    if (!apiUrl) {
        alert("Укажите URL HTTP-сервиса.");
        return;
    }

    if (!dateFrom || !dateTo) {
        alert("Укажите период: дату с и дату по.");
        return;
    }

    if (!lineId) {
        alert("Выберите линию.");
        return;
    }

    if (!login || !password) {
        alert("Укажите логин и пароль для доступа к HTTP-сервису 1С.");
        return;
    }

    loadHttpBtn.disabled = true;
    loadHttpBtn.textContent = "Загружаю данные...";

    try {
        const response = await fetch("/api/dialogs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                apiUrl,
                dateFrom,
                dateTo,
                lineId,
                login,
                password
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        setRawData(data, "Данные успешно загружены из 1С. Можно выбирать сотрудников и запускать расчёт.");

    } catch (error) {
        console.error(error);

        alert(
            "Не удалось загрузить данные из 1С через сервер приложения.\n\n" +
            "Проверьте:\n" +
            "1. Запущен ли server.js командой node server.js.\n" +
            "2. Верный ли URL HTTP-сервиса.\n" +
            "3. Верные ли логин и пароль.\n" +
            "4. Верно ли выбраны период и линия.\n\n" +
            "Техническая ошибка: " + error.message
        );
    } finally {
        loadHttpBtn.disabled = false;
        loadHttpBtn.textContent = "Загрузить данные из 1С";
    }
}

// ===============================
// Установка данных
// ===============================

function setRawData(data, successMessage) {
    if (!data || !data.Dialogs || !Array.isArray(data.Dialogs)) {
        alert("Данные получены, но массив Dialogs не найден. Проверьте формат ответа.");
        resetData();
        return;
    }

    rawData = data;
    analysisResult = [];

    analyzeBtn.disabled = false;
    exportBtn.disabled = true;

    summary.hidden = true;
    resultsPanel.hidden = true;
    resultBody.innerHTML = "";

    detectAndRenderEmployees();

    alert(successMessage);
}

function resetData() {
    rawData = null;
    analysisResult = [];
    detectedEmployees = [];

    analyzeBtn.disabled = true;
    exportBtn.disabled = true;

    employeesPanel.hidden = true;
    summary.hidden = true;
    resultsPanel.hidden = true;
    resultBody.innerHTML = "";
}

// ===============================
// Определение сотрудников
// ===============================

function detectAndRenderEmployees() {
    if (!rawData || !rawData.Dialogs) {
        return;
    }

    const employeeCompany = normalizeText(employeeCompanyInput.value);
    const employeesMap = new Map();

    rawData.Dialogs.forEach(dialog => {
        if (!dialog.DialogContent || !Array.isArray(dialog.DialogContent)) {
            return;
        }

        dialog.DialogContent.forEach(message => {
            const normalizedMessage = normalizeMessage(message);

            if (normalizedMessage.isSystem) {
                return;
            }

            if (!isEmployeeMessage(normalizedMessage, employeeCompany)) {
                return;
            }

            if (!normalizedMessage.author) {
                return;
            }

            if (!employeesMap.has(normalizedMessage.author)) {
                employeesMap.set(normalizedMessage.author, {
                    name: normalizedMessage.author,
                    messages: 0,
                    dialogs: new Set()
                });
            }

            const employee = employeesMap.get(normalizedMessage.author);
            employee.messages += 1;
            employee.dialogs.add(dialog.DialogID || "Без ID");
        });
    });

    detectedEmployees = Array.from(employeesMap.values())
        .map(employee => {
            return {
                name: employee.name,
                messages: employee.messages,
                dialogsCount: employee.dialogs.size
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name, "ru"));

    renderEmployeesList(detectedEmployees);
}

function renderEmployeesList(employees) {
    employeesList.innerHTML = "";

    if (employees.length === 0) {
        employeesPanel.hidden = false;

        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "Сотрудники не найдены. Проверьте поле «Компания сотрудников».";
        employeesList.appendChild(empty);

        return;
    }

    employees.forEach(employee => {
        const label = document.createElement("label");
        label.className = "employee-item selected";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "employee-checkbox";
        checkbox.value = employee.name;
        checkbox.checked = true;

        const textWrapper = document.createElement("span");

        const name = document.createElement("span");
        name.className = "employee-name";
        name.textContent = employee.name;

        const stats = document.createElement("span");
        stats.className = "employee-stats";
        stats.textContent = `${employee.dialogsCount} диалогов, ${employee.messages} сообщений`;

        textWrapper.appendChild(name);
        textWrapper.appendChild(stats);

        checkbox.addEventListener("change", () => {
            label.classList.toggle("selected", checkbox.checked);
        });

        label.appendChild(checkbox);
        label.appendChild(textWrapper);

        employeesList.appendChild(label);
    });

    employeesPanel.hidden = false;
}

function selectAllEmployees() {
    document.querySelectorAll(".employee-checkbox").forEach(checkbox => {
        checkbox.checked = true;
        checkbox.closest(".employee-item")?.classList.add("selected");
    });
}

function clearEmployees() {
    document.querySelectorAll(".employee-checkbox").forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest(".employee-item")?.classList.remove("selected");
    });
}

function getSelectedEmployees() {
    return Array.from(document.querySelectorAll(".employee-checkbox"))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
}

// ===============================
// Основной анализ
// ===============================

function runAnalysis() {
    if (!rawData || !rawData.Dialogs) {
        alert("Сначала загрузите JSON-файл или данные из 1С.");
        return;
    }

    const selectedEmployees = getSelectedEmployees();

    if (selectedEmployees.length === 0) {
        alert("Выберите хотя бы одного сотрудника для расчёта.");
        return;
    }

    const selectedEmployeesSet = new Set(selectedEmployees);

    const employeeCompany = normalizeText(employeeCompanyInput.value);
    const maxIntervalMinutes = Number(maxIntervalInput.value) || 15;
    const minMessageSeconds = Number(minMessageTimeInput.value) || 0;
    const includeSpecialistInitiated = includeSpecialistInitiatedInput.value === "yes";

    const maxIntervalMs = maxIntervalMinutes * 60 * 1000;
    const minMessageMs = minMessageSeconds * 1000;

    const employees = {};
    const allDialogs = rawData.Dialogs;

    let totalEmployeeMessages = 0;
    const dialogsWithEmployees = new Set();

    allDialogs.forEach(dialog => {
        if (!dialog.DialogContent || !Array.isArray(dialog.DialogContent)) {
            return;
        }

        const dialogId = dialog.DialogID || "Без ID";
        const dialogLine = dialog.DialogLine || "";

        const messages = dialog.DialogContent
            .map(message => normalizeMessage(message))
            .filter(message => message.date)
            .sort((a, b) => a.date - b.date);

        const nonSystemMessages = messages.filter(message => !message.isSystem);

        if (nonSystemMessages.length === 0) {
            return;
        }

        const isSpecialistInitiated = checkSpecialistInitiated(messages);

        if (isSpecialistInitiated && !includeSpecialistInitiated) {
            return;
        }

        for (let i = 0; i < nonSystemMessages.length; i++) {
            const currentMessage = nonSystemMessages[i];

            if (!isEmployeeMessage(currentMessage, employeeCompany)) {
                continue;
            }

            const employeeName = currentMessage.author || "Неизвестный сотрудник";

            if (!selectedEmployeesSet.has(employeeName)) {
                continue;
            }

            if (!employees[employeeName]) {
                employees[employeeName] = {
                    employee: employeeName,
                    dialogs: new Set(),
                    messages: 0,
                    activeMs: 0,
                    lines: new Set()
                };
            }

            employees[employeeName].dialogs.add(dialogId);
            employees[employeeName].lines.add(dialogLine);
            dialogsWithEmployees.add(dialogId);
            totalEmployeeMessages++;

            employees[employeeName].messages++;

            const previousMessage = findPreviousNonSystemMessage(nonSystemMessages, i);

            let calculatedMs = minMessageMs;

            if (previousMessage) {
                const diffMs = currentMessage.date - previousMessage.date;

                if (diffMs > 0) {
                    calculatedMs = Math.min(diffMs, maxIntervalMs);
                    calculatedMs = Math.max(calculatedMs, minMessageMs);
                }
            }

            employees[employeeName].activeMs += calculatedMs;
        }
    });

    analysisResult = Object.values(employees)
        .map(employee => {
            const dialogsCount = employee.dialogs.size;
            const messagesCount = employee.messages;
            const activeMs = employee.activeMs;

            return {
                employee: employee.employee,
                dialogsCount,
                messagesCount,
                activeMs,
                activeMinutes: activeMs / 1000 / 60,
                averagePerDialogMs: dialogsCount > 0 ? activeMs / dialogsCount : 0,
                averagePerMessageMs: messagesCount > 0 ? activeMs / messagesCount : 0,
                lines: Array.from(employee.lines).filter(Boolean).join(", "),
                dialogIds: Array.from(employee.dialogs)
            };
        })
        .sort((a, b) => b.activeMs - a.activeMs);

    renderSummary({
        totalDialogs: allDialogs.length,
        employeeDialogs: dialogsWithEmployees.size,
        employeeMessages: totalEmployeeMessages,
        totalActiveMs: analysisResult.reduce((sum, item) => sum + item.activeMs, 0)
    });

    renderTable(analysisResult);

    summary.hidden = false;
    resultsPanel.hidden = false;
    exportBtn.disabled = analysisResult.length === 0;
}

// ===============================
// Подготовка сообщений
// ===============================

function normalizeMessage(message) {
    return {
        date: parseDate(message.messageDate),
        author: cleanText(message.messageAuthor),
        company: cleanText(message.AuthorCompany),
        isSystem: Boolean(message.ItlsSystemMessage),
        text: message.messageText || ""
    };
}

function parseDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function cleanText(value) {
    if (!value) {
        return "";
    }

    return String(value).replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
    return cleanText(value).toLowerCase();
}

function isEmployeeMessage(message, employeeCompany) {
    if (!message.company) {
        return false;
    }

    return normalizeText(message.company) === employeeCompany;
}

function findPreviousNonSystemMessage(messages, currentIndex) {
    if (currentIndex <= 0) {
        return null;
    }

    return messages[currentIndex - 1];
}

function checkSpecialistInitiated(messages) {
    const startMessage = messages.find(message => {
        return message.isSystem &&
            message.text &&
            message.text.toLowerCase().includes("начало обращения");
    });

    if (!startMessage) {
        return false;
    }

    const text = startMessage.text.toLowerCase();

    return text.includes("инициатор специалист");
}

// ===============================
// Отрисовка результата
// ===============================

function renderSummary(data) {
    totalDialogsEl.textContent = data.totalDialogs;
    employeeDialogsEl.textContent = data.employeeDialogs;
    employeeMessagesEl.textContent = data.employeeMessages;
    totalTimeEl.textContent = formatDuration(data.totalActiveMs);
}

function renderTable(rows) {
    resultBody.innerHTML = "";

    if (rows.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="7">Нет данных для расчёта. Проверьте выбранных сотрудников и компанию сотрудников.</td>
        `;
        resultBody.appendChild(tr);
        return;
    }

    rows.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${escapeHtml(row.employee)}</td>
            <td>${row.dialogsCount}</td>
            <td>${row.messagesCount}</td>
            <td>${formatDuration(row.activeMs)}</td>
            <td>${formatDuration(row.averagePerDialogMs)}</td>
            <td>${formatDuration(row.averagePerMessageMs)}</td>
            <td>
                <button 
                    type="button" 
                    class="small-button view-dialogs-btn" 
                    data-employee="${escapeHtml(row.employee)}"
                >
                    Посмотреть диалоги
                </button>
            </td>
        `;

        resultBody.appendChild(tr);
    });
}

function formatDuration(ms) {
    if (!ms || ms <= 0) {
        return "0 мин";
    }

    const totalSeconds = Math.round(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours} ч ${minutes} мин`;
    }

    if (minutes > 0) {
        return `${minutes} мин ${seconds} сек`;
    }

    return `${seconds} сек`;
}

// ===============================
// Читабельные диалоги
// ===============================

function openReadableDialogsModal(employeeName) {
    if (!rawData || !rawData.Dialogs) {
        alert("Данные не загружены.");
        return;
    }

    if (!dialogsModal || !dialogsModalBody) {
        alert("Модальное окно для просмотра диалогов не найдено в index.html.");
        return;
    }

    const employeeCompany = normalizeText(employeeCompanyInput.value);

    const dialogs = rawData.Dialogs
        .filter(dialog => dialogHasEmployeeMessages(dialog, employeeName, employeeCompany))
        .map(dialog => {
            const messages = Array.isArray(dialog.DialogContent)
                ? dialog.DialogContent
                    .map(message => normalizeMessage(message))
                    .filter(message => message.date)
                    .sort((a, b) => a.date - b.date)
                : [];

            const employeeMessagesCount = messages.filter(message => {
                return !message.isSystem &&
                    message.author === employeeName &&
                    isEmployeeMessage(message, employeeCompany);
            }).length;

            return {
                id: dialog.DialogID || "Без ID",
                author: dialog.DialogAuthor || "Автор не указан",
                line: dialog.DialogLine || "Линия не указана",
                messages,
                employeeMessagesCount
            };
        })
        .sort((a, b) => {
            const firstDateA = a.messages[0]?.date || new Date(0);
            const firstDateB = b.messages[0]?.date || new Date(0);
            return firstDateA - firstDateB;
        });

    const employeeMessagesTotal = dialogs.reduce((sum, dialog) => {
        return sum + dialog.employeeMessagesCount;
    }, 0);

    dialogsModalTitle.textContent = `Диалоги: ${employeeName}`;
    dialogsModalSubtitle.textContent = `${dialogs.length} диалогов, ${employeeMessagesTotal} сообщений сотрудника`;

    dialogsModalBody.innerHTML = "";

    if (dialogs.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "Диалоги для выбранного сотрудника не найдены.";
        dialogsModalBody.appendChild(empty);
        dialogsModal.hidden = false;
        return;
    }

    dialogs.forEach((dialog, index) => {
        const card = document.createElement("div");
        card.className = "dialog-card";

        const header = document.createElement("div");
        header.className = "dialog-card-header";

        const title = document.createElement("h3");
        title.textContent = `Диалог ${index + 1}`;

        const meta = document.createElement("div");
        meta.className = "dialog-meta";
        meta.innerHTML = `
            <div><b>ID:</b> ${escapeHtml(dialog.id)}</div>
            <div><b>Линия:</b> ${escapeHtml(dialog.line)}</div>
            <div><b>Автор диалога:</b> ${escapeHtml(dialog.author)}</div>
            <div><b>Период сообщений:</b> ${escapeHtml(getDialogPeriodText(dialog.messages))}</div>
            <div><b>Сообщений сотрудника в этом диалоге:</b> ${dialog.employeeMessagesCount}</div>
        `;

        header.appendChild(title);
        header.appendChild(meta);

        const messagesList = document.createElement("div");
        messagesList.className = "messages-list";

        dialog.messages.forEach(message => {
            const role = getMessageRole(message, employeeCompany);
            const isSelectedEmployeeMessage = !message.isSystem &&
                message.author === employeeName &&
                isEmployeeMessage(message, employeeCompany);

            const row = document.createElement("div");
            row.className = `message-row ${role.type === "system" ? "system-message" : ""}`;

            if (isSelectedEmployeeMessage) {
                row.classList.add("selected-employee-message");
            }

            const time = document.createElement("div");
            time.className = "message-time";
            time.textContent = formatDateTime(message.date);

            const author = document.createElement("div");
            author.className = "message-author";

            const roleBadge = document.createElement("span");
            roleBadge.className = `message-role ${role.className}`;
            roleBadge.textContent = isSelectedEmployeeMessage ? "Выбранный сотрудник" : role.label;

            const authorName = document.createElement("span");
            authorName.className = "author-name";
            authorName.textContent = message.author || "Автор не указан";

            author.appendChild(roleBadge);
            author.appendChild(authorName);

            const text = document.createElement("div");
            text.className = "message-text";
            text.textContent = message.text || "";

            row.appendChild(time);
            row.appendChild(author);
            row.appendChild(text);

            messagesList.appendChild(row);
        });

        card.appendChild(header);
        card.appendChild(messagesList);

        dialogsModalBody.appendChild(card);
    });

    dialogsModal.hidden = false;
}

function dialogHasEmployeeMessages(dialog, employeeName, employeeCompany) {
    if (!dialog || !Array.isArray(dialog.DialogContent)) {
        return false;
    }

    return dialog.DialogContent.some(message => {
        const normalizedMessage = normalizeMessage(message);

        return !normalizedMessage.isSystem &&
            normalizedMessage.author === employeeName &&
            isEmployeeMessage(normalizedMessage, employeeCompany);
    });
}

function closeReadableDialogsModal() {
    if (!dialogsModal || !dialogsModalBody) {
        return;
    }

    dialogsModal.hidden = true;
    dialogsModalBody.innerHTML = "";
}

function getMessageRole(message, employeeCompany) {
    if (message.isSystem) {
        return {
            type: "system",
            label: "Система",
            className: "role-system"
        };
    }

    if (isEmployeeMessage(message, employeeCompany)) {
        return {
            type: "employee",
            label: "Сотрудник",
            className: "role-employee"
        };
    }

    return {
        type: "client",
        label: "Партнёр / клиент",
        className: "role-client"
    };
}

function getDialogPeriodText(messages) {
    if (!messages || messages.length === 0) {
        return "нет сообщений";
    }

    const first = messages[0].date;
    const last = messages[messages.length - 1].date;

    if (!first || !last) {
        return "нет дат";
    }

    if (first.getTime() === last.getTime()) {
        return formatDateTime(first);
    }

    return `${formatDateTime(first)} — ${formatDateTime(last)}`;
}

function formatDateTime(date) {
    if (!date) {
        return "";
    }

    return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

// ===============================
// Экспорт CSV
// ===============================

function exportCsv() {
    if (!analysisResult || analysisResult.length === 0) {
        alert("Нет данных для экспорта.");
        return;
    }

    const rows = [];

    rows.push([
        "Сотрудник",
        "Диалогов",
        "Сообщений",
        "Активное время, минут",
        "Активное время",
        "Среднее на диалог, минут",
        "Среднее на сообщение, минут",
        "Линии"
    ]);

    analysisResult.forEach(row => {
        rows.push([
            row.employee,
            row.dialogsCount,
            row.messagesCount,
            roundNumber(row.activeMinutes),
            formatDuration(row.activeMs),
            roundNumber(row.averagePerDialogMs / 1000 / 60),
            roundNumber(row.averagePerMessageMs / 1000 / 60),
            row.lines
        ]);
    });

    const csvContent = rows
        .map(row => row.map(escapeCsvValue).join(";"))
        .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "time_extractor_result.csv";
    link.click();

    URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
    const stringValue = String(value ?? "");

    if (
        stringValue.includes(";") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {
        return `"${stringValue.replaceAll('"', '""')}"`;
    }

    return stringValue;
}

function roundNumber(value) {
    return Math.round(value * 100) / 100;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ===============================
// ОСНОВНЫЕ ВКЛАДКИ
// ===============================

const employeesMainTab = document.getElementById("employeesMainTab");
const ticketsMainTab = document.getElementById("ticketsMainTab");
const employeesSection = document.getElementById("employeesSection");
const ticketsSection = document.getElementById("ticketsSection");

employeesMainTab.addEventListener("click", () => switchMainSection("employees"));
ticketsMainTab.addEventListener("click", () => switchMainSection("tickets"));

function switchMainSection(section) {
    const showEmployees = section === "employees";
    employeesMainTab.classList.toggle("active", showEmployees);
    ticketsMainTab.classList.toggle("active", !showEmployees);
    employeesSection.hidden = !showEmployees;
    ticketsSection.hidden = showEmployees;
}

// ===============================
// ЗАЯВКИ: СПРАВОЧНИК НОРМАТИВОВ
// ===============================

const DEFAULT_TICKET_CATEGORIES = [
    { key: "client_database_import_export", group: "2 линия (вопросы клиентов)", name: "Выполнение загрузки или выгрузки базы (ручное)", names: "Выполнение загрузки или выгрузки базы (ручное) | Загрузка базы | Выгрузка базы", minutes: 60 },
    { key: "client_database_update", group: "2 линия (вопросы клиентов)", name: "Выполнение обновления базы (ручное)", names: "Выполнение обновления базы (ручное) | Обновить конфигурацию | Обновление конфигурации", minutes: 60 },
    { key: "client_background_tasks", group: "2 линия (вопросы клиентов)", name: "Проблема с выполнением ЗМ, ЗО или Переноса баз", names: "Проблема с выполнением ЗМ, ЗО или Переноса баз", minutes: 15 },
    { key: "client_database_problem", group: "2 линия (вопросы клиентов)", name: "Проблема в базе 1С", names: "Проблема в базе 1С | Ошибка в базе", minutes: 30 },
    { key: "client_database_login", group: "2 линия (вопросы клиентов)", name: "Проблема со входом в базу 1С", names: "Проблема со входом в базу 1С | Недоступность базы", minutes: 15 },
    { key: "client_exchange_transport", group: "2 линия (вопросы клиентов)", name: "Проблема с транспортом обмена между базами 1С", names: "Проблема с транспортом обмена между базами 1С | Пролема с транспортом обмена между базами 1С", minutes: 30 },
    { key: "client_industry_licenses", group: "2 линия (вопросы клиентов)", name: "Проблема с отраслевыми лицензиями (СЛК, Рарус, Бит и пр.)", names: "Проблема с отраслевыми лицензиями (СЛК, Рарус, Бит и пр.)", minutes: 15 },
    { key: "client_remote_desktop", group: "2 линия (вопросы клиентов)", name: "Проблема с удаленным рабочим столом (RDS, АльтРД)", names: "Проблема с удаленным рабочим столом (RDS, АльтРД)", minutes: 30 },
    { key: "client_publication", group: "2 линия (вопросы клиентов)", name: "Создание или изменение публикации базы (ручное)", names: "Создание или изменение публикации базы (ручное)", minutes: 30 },
    { key: "client_access", group: "2 линия (вопросы клиентов)", name: "Предоставление доступа / сброс пароля (RDS, FTP)", names: "Предоставление доступа / сброс пароля (RDS, FTP) | Создать пользователя RDS | Создать пользвателя RDS", minutes: 15 },
    { key: "client_release", group: "2 линия (вопросы клиентов)", name: "Добавление отсутствующего релиза в УС", names: "Добавление отсутствующего релиза в УС | Добавление отсутсвующего релиза в УС", minutes: 15 },
    { key: "client_consultation", group: "2 линия (вопросы клиентов)", name: "Консультация по техническим вопросам", names: "Консультация по техническим вопросам | Консультация", minutes: 30 },
    { key: "client_other", group: "2 линия (вопросы клиентов)", name: "Другая задача", names: "Другая задача | Другое", minutes: 15 },
    { key: "internal_access", group: "2 линия (внутренние вопросы)", name: "Предоставление доступа / сброс пароля", names: "Предоставление доступа / сброс пароля | Смена пароля", minutes: 15 },
    { key: "internal_equipment", group: "2 линия (внутренние вопросы)", name: "Проблема с оборудованием на рабочем месте", names: "Проблема с оборудованием на рабочем месте | Оборудование рабочего места | Рабочее место сотрудника", minutes: 15 },
    { key: "internal_telephony", group: "2 линия (внутренние вопросы)", name: "Проблема с телефонией на рабочем месте", names: "Проблема с телефонией на рабочем месте | Проблемы с телефонией", minutes: 15 },
    { key: "internal_network", group: "2 линия (внутренние вопросы)", name: "Проблема с сетевым оборудованием или оргтехникой", names: "Проблема с сетевым оборудованием или оргтехникой | Сетевые и серверные вопросы | Оргтехника", minutes: 15 },
    { key: "internal_external_service", group: "2 линия (внутренние вопросы)", name: "Проблема со сторонним сервисом (Интернет, телефония, сервисы подрядчиков и пр.)", names: "Проблема со сторонним сервисом (Интернет, телефония, сервисы подрядчиков и пр.)", minutes: 60 },
    { key: "internal_workplace", group: "2 линия (внутренние вопросы)", name: "Подготовка нового рабочего места", names: "Подготовка нового рабочего места | Подключение к рабочей среде нового сотрудника", minutes: 120 },
    { key: "internal_other", group: "2 линия (внутренние вопросы)", name: "Другая задача", names: "Другая задача | Другое", minutes: 15 }
];

const TICKET_CATEGORIES_STORAGE_KEY = "timeExtractor.ticketCategories.v2";
let ticketCategories = loadTicketCategories();

// ===============================
// ЗАЯВКИ: ПРОИЗВОДСТВЕННЫЙ КАЛЕНДАРЬ РФ
// ===============================

// Пятидневная 40-часовая рабочая неделя.
// 2026: Постановление Правительства РФ от 24.09.2025 № 1466.
// Сокращение предпраздничного рабочего дня на 1 час — ст. 95 ТК РФ.
const RU_PRODUCTION_CALENDAR = {
    2026: {
        daysOff: new Set([
            "2026-01-01", "2026-01-02", "2026-01-05", "2026-01-06",
            "2026-01-07", "2026-01-08", "2026-01-09",
            "2026-02-23",
            "2026-03-09",
            "2026-05-01", "2026-05-11",
            "2026-06-12",
            "2026-11-04",
            "2026-12-31"
        ]),
        shortenedDays: new Set([
            "2026-04-30",
            "2026-05-08",
            "2026-06-11",
            "2026-11-03"
        ]),
        workingWeekends: new Set()
    }
};

// ===============================
// ЗАЯВКИ: СОСТОЯНИЕ И DOM
// ===============================

let ticketSourceMode = "file";
let ticketDatasets = { file: [], http: [] };
let ticketHistoryDatasets = { file: [], http: [] };
let ticketAnalysisResult = [];
let lastAnalyzedTickets = [];
let ticketWorkHours = {};
let ticketWorkHoursTouched = new Set();
let pdfExportLoadingPromise = null;
let activeTicketsModalContext = null;

const TICKET_CHART_COLORS = [
    "#315fce", "#5b8def", "#7c4dff", "#00a3a3", "#27a36a", "#84b547",
    "#e5a93d", "#e67e3f", "#d95555", "#b455b6", "#667085", "#8b6f47"
];

const TICKET_CHART_DEFINITIONS = [
    {
        key: "client",
        groupMatch: "\u0432\u043e\u043f\u0440\u043e\u0441\u044b \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432",
        canvasId: "ticketClientCategoryChart",
        legendId: "ticketClientCategoryLegend",
        cardId: "ticketClientChartCard"
    },
    {
        key: "internal",
        groupMatch: "\u0432\u043d\u0443\u0442\u0440\u0435\u043d\u043d\u0438\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b",
        canvasId: "ticketInternalCategoryChart",
        legendId: "ticketInternalCategoryLegend",
        cardId: "ticketInternalChartCard"
    }
];

const HTML2CANVAS_LIBRARY_URLS = [
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
];

const JSPDF_LIBRARY_URLS = [
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
];

const ticketTabFile = document.getElementById("ticketTabFile");
const ticketTabHttp = document.getElementById("ticketTabHttp");
const ticketFileSourceBlock = document.getElementById("ticketFileSourceBlock");
const ticketHttpSourceBlock = document.getElementById("ticketHttpSourceBlock");
const ticketFileInput = document.getElementById("ticketFileInput");
const ticketHistoryFileInput = document.getElementById("ticketHistoryFileInput");
const ticketFileDateFrom = document.getElementById("ticketFileDateFrom");
const ticketFileDateTo = document.getElementById("ticketFileDateTo");
const ticketFileLine = document.getElementById("ticketFileLine");
const ticketFileIncludeCancelled = document.getElementById("ticketFileIncludeCancelled");
const ticketApiUrl = document.getElementById("ticketApiUrl");
const ticketHistoryApiUrl = document.getElementById("ticketHistoryApiUrl");
const ticketHttpDateFrom = document.getElementById("ticketHttpDateFrom");
const ticketHttpDateTo = document.getElementById("ticketHttpDateTo");
const ticketHttpLine = document.getElementById("ticketHttpLine");
const ticketApiLogin = document.getElementById("ticketApiLogin");
const ticketApiPassword = document.getElementById("ticketApiPassword");
const ticketHttpIncludeCancelled = document.getElementById("ticketHttpIncludeCancelled");
const loadTicketsHttpBtn = document.getElementById("loadTicketsHttpBtn");
const analyzeTicketsBtn = document.getElementById("analyzeTicketsBtn");
const exportTicketsBtn = document.getElementById("exportTicketsBtn");
const exportTicketsPdfBtn = document.getElementById("exportTicketsPdfBtn");
const ticketLoadStatus = document.getElementById("ticketLoadStatus");
const categoriesBody = document.getElementById("categoriesBody");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const resetCategoriesBtn = document.getElementById("resetCategoriesBtn");
const ticketSummary = document.getElementById("ticketSummary");
const ticketWorkHoursPanel = document.getElementById("ticketWorkHoursPanel");
const ticketWorkHoursBody = document.getElementById("ticketWorkHoursBody");
const ticketResultsPanel = document.getElementById("ticketResultsPanel");
const ticketResultBody = document.getElementById("ticketResultBody");
const ticketTotalCount = document.getElementById("ticketTotalCount");
const ticketEmployeesCount = document.getElementById("ticketEmployeesCount");
const ticketTotalLifecycle = document.getElementById("ticketTotalLifecycle");
const ticketStandardTotal = document.getElementById("ticketStandardTotal");
const ticketOverduePercent = document.getElementById("ticketOverduePercent");
const ticketChartsPanel = document.getElementById("ticketChartsPanel");
const ticketClientCategoryChart = document.getElementById("ticketClientCategoryChart");
const ticketClientCategoryLegend = document.getElementById("ticketClientCategoryLegend");
const ticketInternalCategoryChart = document.getElementById("ticketInternalCategoryChart");
const ticketInternalCategoryLegend = document.getElementById("ticketInternalCategoryLegend");
const ticketsModal = document.getElementById("ticketsModal");
const closeTicketsModal = document.getElementById("closeTicketsModal");
const ticketsModalTitle = document.getElementById("ticketsModalTitle");
const ticketsModalSubtitle = document.getElementById("ticketsModalSubtitle");
const ticketsModalBody = document.getElementById("ticketsModalBody");
const ticketsModalPdfBtn = document.getElementById("ticketsModalPdfBtn");

initTicketsModule();

function initTicketsModule() {
    fillTicketHttpLines();
    renderTicketCategories();
    setDefaultTicketDates();

    ticketTabFile.addEventListener("click", () => switchTicketSource("file"));
    ticketTabHttp.addEventListener("click", () => switchTicketSource("http"));
    ticketFileInput.addEventListener("change", handleTicketFileUpload);
    ticketHistoryFileInput.addEventListener("change", handleTicketHistoryFileUpload);
    loadTicketsHttpBtn.addEventListener("click", loadTicketsByHttp);
    analyzeTicketsBtn.addEventListener("click", runTicketAnalysis);
    exportTicketsBtn.addEventListener("click", exportTicketsCsv);
    exportTicketsPdfBtn.addEventListener("click", exportTicketReportPdf);
    addCategoryBtn.addEventListener("click", addTicketCategory);
    resetCategoriesBtn.addEventListener("click", resetTicketCategories);
    categoriesBody.addEventListener("input", handleCategoryEdit);
    categoriesBody.addEventListener("click", handleCategoryAction);
    ticketWorkHoursBody.addEventListener("input", handleTicketWorkHoursInput);
    [ticketFileDateFrom, ticketFileDateTo, ticketFileLine, ticketFileIncludeCancelled,
        ticketHttpDateFrom, ticketHttpDateTo, ticketHttpLine, ticketHttpIncludeCancelled]
        .forEach(control => control.addEventListener("change", handleTicketPeriodChange));
    ticketResultBody.addEventListener("click", handleTicketResultAction);
    ticketsModalPdfBtn.addEventListener("click", exportActiveEmployeeTicketsPdf);
    closeTicketsModal.addEventListener("click", closeTicketsDetailsModal);
    ticketsModal.addEventListener("click", event => {
        if (event.target === ticketsModal) {
            closeTicketsDetailsModal();
        }
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !ticketsModal.hidden) {
            closeTicketsDetailsModal();
        }
    });
}

function setDefaultTicketDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const from = formatDateInputValue(firstDay);
    const to = formatDateInputValue(today);
    ticketFileDateFrom.value = from;
    ticketFileDateTo.value = to;
    ticketHttpDateFrom.value = from;
    ticketHttpDateTo.value = to;
}

function switchTicketSource(source) {
    ticketSourceMode = source;
    const isFile = source === "file";
    ticketTabFile.classList.toggle("active", isFile);
    ticketTabHttp.classList.toggle("active", !isFile);
    ticketFileSourceBlock.hidden = !isFile;
    ticketHttpSourceBlock.hidden = isFile;
    analyzeTicketsBtn.disabled = ticketDatasets[source].length === 0;
    resetTicketResults();
    prepareTicketWorkHours();
    showTicketStatus(
        ticketDatasets[source].length > 0
            ? `Загружено заявок: ${ticketDatasets[source].length}. Событий статусов: ${ticketHistoryDatasets[source].length}.`
            : "",
        false
    );
}

function fillTicketHttpLines() {
    ticketHttpLine.innerHTML = "";
    CONNECT_LINES
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "ru"))
        .forEach(line => {
            const option = document.createElement("option");
            option.value = line.id;
            option.textContent = line.name;
            ticketHttpLine.appendChild(option);
        });
    const defaultLine = CONNECT_LINES.find(line => line.name === "ALTAPP Внутренняя");
    if (defaultLine) {
        ticketHttpLine.value = defaultLine.id;
    }
}

// ===============================
// ЗАЯВКИ: ЗАГРУЗКА ФАЙЛА
// ===============================

async function handleTicketFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    try {
        const rows = await readTabularFile(file, extractTicketRows, "tickets");

        setTicketDataset("file", rows);
        populateTicketFileFilters(ticketDatasets.file);
        prepareTicketWorkHours();
        showTicketStatus(`Файл «${file.name}» загружен. Найдено заявок: ${ticketDatasets.file.length}. Загрузите историю смены статусов и укажите отработанные часы.`, false);
    } catch (error) {
        console.error(error);
        ticketDatasets.file = [];
        analyzeTicketsBtn.disabled = true;
        showTicketStatus("Не удалось прочитать файл: " + error.message, true);
    }
}

async function handleTicketHistoryFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const rows = await readTabularFile(file, data => extractStatusHistoryRows(data, true), "history");
        setTicketHistoryDataset("file", rows);
        showTicketStatus(`История «${file.name}» загружена. Найдено событий: ${ticketHistoryDatasets.file.length}.`, false);
        resetTicketResults();
    } catch (error) {
        console.error(error);
        ticketHistoryDatasets.file = [];
        showTicketStatus("Не удалось прочитать историю статусов: " + error.message, true);
    }
}

async function readTabularFile(file, jsonExtractor, tableKind = "generic") {
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "json") {
        return jsonExtractor(JSON.parse(await file.text()));
    }

    await ensureXlsxLibrary();

    const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: false
    });

    const detected = findWorksheetTable(workbook, tableKind);
    if (!detected) {
        throw new Error(
            tableKind === "history"
                ? "Не удалось найти строку заголовков истории статусов. Нужны поля «Период», ID/номер заявки и новый статус."
                : "Не удалось найти строку заголовков заявок. Проверьте структуру Excel-файла."
        );
    }

    return XLSX.utils.sheet_to_json(detected.sheet, {
        defval: null,
        raw: true,
        range: detected.headerRowIndex
    });
}

function findWorksheetTable(workbook, tableKind) {
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const matrix = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: null,
            raw: true,
            blankrows: false
        });

        const headerRowIndex = findTableHeaderRowIndex(matrix, tableKind);
        if (headerRowIndex >= 0) {
            return { sheet, sheetName, headerRowIndex };
        }
    }

    return null;
}

function findTableHeaderRowIndex(matrix, tableKind) {
    const maxRowsToCheck = Math.min(matrix.length, 80);

    for (let index = 0; index < maxRowsToCheck; index += 1) {
        const values = (matrix[index] || [])
            .map(value => normalizeText(value).replaceAll("ё", "е"))
            .filter(Boolean);

        if (values.length === 0) continue;

        const hasAny = variants => variants.some(variant => values.includes(normalizeText(variant).replaceAll("ё", "е")));

        if (tableKind === "history") {
            const hasPeriod = hasAny(["Период", "Дата", "Дата изменения"]);
            const hasTicketLink = hasAny(["Идентификатор заявки", "ID заявки", "Id заявки", "№ заявки", "Номер заявки", "TicketID", "ticketId"]);
            const hasNewStatus = hasAny(["Новое значение", "Новый статус", "NewStatus", "newStatus"]);
            if (hasPeriod && hasTicketLink && hasNewStatus) return index;
            continue;
        }

        if (tableKind === "tickets") {
            const hasCreated = hasAny(["Время создания", "Дата создания", "CreatedAt", "createdAt"]);
            const hasEmployee = hasAny(["Исполнитель", "Assignee", "Employee", "responsible"]);
            const hasIdentity = hasAny(["Идентификатор заявки", "ID заявки", "№ заявки", "Номер заявки", "TicketID", "ticketId"]);
            if (hasCreated && hasEmployee && hasIdentity) return index;
            continue;
        }

        return 0;
    }

    return tableKind === "generic" ? 0 : -1;
}

let xlsxLibraryLoadingPromise = null;

async function ensureXlsxLibrary() {
    if (typeof XLSX !== "undefined") {
        return;
    }

    if (!xlsxLibraryLoadingPromise) {
        xlsxLibraryLoadingPromise = loadScript(
            "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"
        );
    }

    try {
        await xlsxLibraryLoadingPromise;
    } catch (error) {
        xlsxLibraryLoadingPromise = null;
        throw new Error(
            "Не удалось загрузить библиотеку для чтения Excel. " +
            "Проверьте подключение к интернету или запустите приложение через npm start."
        );
    }

    if (typeof XLSX === "undefined") {
        xlsxLibraryLoadingPromise = null;
        throw new Error(
            "Библиотека Excel загрузилась некорректно. Обновите страницу и повторите попытку."
        );
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existingScript = Array.from(document.scripts).find(script => script.src === src);

        if (existingScript) {
            if (typeof XLSX !== "undefined") {
                resolve();
                return;
            }

            existingScript.addEventListener("load", resolve, { once: true });
            existingScript.addEventListener("error", reject, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Не удалось загрузить ${src}`));
        document.head.appendChild(script);
    });
}

function populateTicketFileFilters(tickets) {
    const lines = Array.from(new Set(tickets.map(ticket => ticket.line).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "ru"));

    ticketFileLine.innerHTML = '<option value="">Все линии</option>';
    lines.forEach(line => {
        const option = document.createElement("option");
        option.value = line;
        option.textContent = line;
        ticketFileLine.appendChild(option);
    });
    ticketFileLine.disabled = lines.length === 0;

    const dates = tickets.map(ticket => ticket.createdAt).filter(Boolean).sort((a, b) => a - b);
    if (dates.length > 0) {
        ticketFileDateFrom.value = formatDateInputValue(dates[0]);
        ticketFileDateTo.value = formatDateInputValue(dates[dates.length - 1]);
    }
}

// ===============================
// ЗАЯВКИ: HTTP
// ===============================

async function loadTicketsByHttp() {
    const apiUrl = cleanText(ticketApiUrl.value);
    const historyApiUrl = cleanText(ticketHistoryApiUrl.value);
    const dateFrom = ticketHttpDateFrom.value;
    const dateTo = ticketHttpDateTo.value;
    const lineId = cleanText(ticketHttpLine.value);
    const login = cleanText(ticketApiLogin.value);
    const password = ticketApiPassword.value;

    if (!apiUrl || !dateFrom || !dateTo || !lineId || !login || !password) {
        showTicketStatus("Заполните URL, период, линию, логин и пароль.", true);
        return;
    }
    if (dateFrom > dateTo) {
        showTicketStatus("Дата начала периода не может быть позже даты окончания.", true);
        return;
    }

    loadTicketsHttpBtn.disabled = true;
    loadTicketsHttpBtn.textContent = "Загружаю заявки...";
    showTicketStatus("", false);

    try {
        const data = await fetchTicketHttpData({ apiUrl, dateFrom, dateTo, lineId, login, password });
        setTicketDataset("http", extractTicketRows(data));

        let historyRows = extractStatusHistoryRows(data, false);
        if (historyApiUrl) {
            const historyData = await fetchTicketHttpData({ apiUrl: historyApiUrl, dateFrom, dateTo, lineId, login, password });
            historyRows = extractStatusHistoryRows(historyData, true);
        }
        setTicketHistoryDataset("http", historyRows);
        prepareTicketWorkHours();
        showTicketStatus(`Данные загружены. Заявок: ${ticketDatasets.http.length}. Событий статусов: ${ticketHistoryDatasets.http.length}. Укажите отработанные часы сотрудников.`, false);
    } catch (error) {
        console.error(error);
        ticketDatasets.http = [];
        ticketHistoryDatasets.http = [];
        analyzeTicketsBtn.disabled = true;
        showTicketStatus("Не удалось загрузить заявки: " + error.message, true);
    } finally {
        loadTicketsHttpBtn.disabled = false;
        loadTicketsHttpBtn.textContent = "Загрузить заявки";
    }
}

async function fetchTicketHttpData(payload) {
    const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || data.error) {
        throw new Error(data.message || `HTTP ${response.status}`);
    }
    return data;
}

function extractTicketRows(data) {
    if (Array.isArray(data)) {
        return data;
    }
    if (!data || typeof data !== "object") {
        throw new Error("В ответе не найден массив заявок.");
    }
    const candidateKeys = ["Tickets", "tickets", "Data", "data", "items", "Items", "Заявки"];
    for (const key of candidateKeys) {
        if (Array.isArray(data[key])) {
            return data[key];
        }
    }
    throw new Error("Ожидался массив заявок или объект с массивом Tickets, Data либо items.");
}

function extractStatusHistoryRows(data, required) {
    if (Array.isArray(data)) {
        const looksLikeHistory = data.some(row => getTicketValue(row || {}, ["Новое значение", "Новый статус", "newStatus", "NewStatus"]) !== null);
        if (looksLikeHistory || required) return data;
        return [];
    }
    if (data && typeof data === "object") {
        const candidateKeys = ["StatusHistory", "statusHistory", "History", "history", "Events", "events", "ИсторияСтатусов"];
        for (const key of candidateKeys) {
            if (Array.isArray(data[key])) return data[key];
        }
    }
    if (required) {
        throw new Error("В ответе не найден массив истории смены статусов.");
    }
    return [];
}

function setTicketDataset(source, rows) {
    if (!Array.isArray(rows)) {
        throw new Error("Данные заявок должны быть массивом.");
    }
    const normalized = rows
        .map((row, index) => normalizeTicket(row, index))
        .filter(ticket => ticket.id || ticket.number || ticket.createdAt || ticket.employee);
    if (normalized.length === 0) {
        throw new Error("Не удалось распознать ни одной заявки. Проверьте заголовки столбцов.");
    }
    ticketDatasets[source] = normalized;
    ticketWorkHours = {};
    ticketWorkHoursTouched = new Set();
    analyzeTicketsBtn.disabled = source !== ticketSourceMode;
    if (source === ticketSourceMode) {
        analyzeTicketsBtn.disabled = false;
    }
    resetTicketResults();
}

function setTicketHistoryDataset(source, rows) {
    if (!Array.isArray(rows)) {
        throw new Error("История статусов должна быть массивом.");
    }

    const normalized = rows
        .map(normalizeTicketStatusEvent)
        .filter(event => (event.ticketId || event.ticketNumber) && event.period && event.newStatus);

    if (rows.length > 0 && normalized.length === 0) {
        throw new Error(
            "Файл прочитан, но события смены статусов не распознаны. " +
            "Проверьте наличие столбцов «Период», «ID заявки» или «Идентификатор заявки», «Новый статус» или «Новое значение»."
        );
    }

    ticketHistoryDatasets[source] = normalized;
}

function normalizeTicketStatusEvent(row) {
    return {
        period: parseTicketDate(getTicketValue(row, ["Период", "period", "Period", "date", "Date", "eventDate"])),
        ticketId: cleanText(getTicketValue(row, ["Идентификатор заявки", "ID заявки", "Id заявки", "ticketId", "TicketID", "id", "ID"])),
        ticketNumber: cleanText(getTicketValue(row, ["№ заявки", "Номер заявки", "ticketNumber", "TicketNumber", "number", "Number"])),
        object: cleanText(getTicketValue(row, ["Объект изменения", "object", "Object", "field", "Field"])),
        oldStatus: cleanText(getTicketValue(row, ["Старое значение", "Старый статус", "oldStatus", "OldStatus", "oldValue"])),
        newStatus: cleanText(getTicketValue(row, ["Новое значение", "Новый статус", "newStatus", "NewStatus", "newValue"])),
        author: cleanText(getTicketValue(row, ["Автор", "Автор изменения", "author", "Author"]))
    };
}

function normalizeTicket(row, index) {
    const createdValue = getTicketValue(row, ["Время создания", "createdAt", "CreatedAt", "creationDate", "dateCreated"]);
    const deadlineValue = getTicketValue(row, ["Срок заявки", "deadline", "Deadline", "dueDate", "DueDate"]);
    const actualValue = getTicketValue(row, ["Длительность работы (сек)", "durationSeconds", "DurationSeconds", "workDuration", "resolutionTime"]);
    const actualSeconds = parseNumberValue(actualValue);
    const completedValue = getTicketValue(row, ["Время завершения", "Дата завершения", "completedAt", "CompletedAt", "closedAt", "ClosedAt"]);
    const newStatusValue = getTicketValue(row, ["Время статуса Новая", "newAt", "NewAt"]);

    return {
        sourceIndex: index,
        id: cleanText(getTicketValue(row, ["Идентификатор заявки", "ID заявки", "Id заявки", "id", "ID", "ticketId", "TicketID"])),
        number: cleanText(getTicketValue(row, ["Номер заявки", "№ заявки", "number", "Number", "ticketNumber"])),
        createdAt: parseTicketDate(createdValue),
        line: cleanText(getTicketValue(row, ["Линия", "line", "Line", "lineName"])),
        service: cleanText(getTicketValue(row, ["Вид услуги", "service", "Service", "serviceType"])),
        category: cleanText(getTicketValue(row, ["Тип заявки", "category", "Category", "ticketType", "type"])),
        client: cleanText(getTicketValue(row, ["Клиент", "client", "Client"])),
        initiator: cleanText(getTicketValue(row, ["Инициатор заявки", "initiator", "Initiator"])),
        employee: cleanText(getTicketValue(row, ["Исполнитель", "employee", "Employee", "assignee", "Assignee", "responsible"])),
        status: cleanText(getTicketValue(row, ["Статус заявки", "status", "Status"])),
        actualSeconds: Number.isFinite(actualSeconds) && actualSeconds > 0 ? actualSeconds : 0,
        deadlineAt: parseTicketDate(deadlineValue),
        completedAt: parseTicketDate(completedValue),
        newAt: parseTicketDate(newStatusValue),
        topic: cleanText(getTicketValue(row, ["Тема заявки", "topic", "Topic", "title", "Title"])),
        problem: cleanText(getTicketValue(row, ["Описание проблемы", "problem", "Problem", "description", "Description"])),
        solution: cleanText(getTicketValue(row, ["Описание решения", "solution", "Solution"])),
        priority: cleanText(getTicketValue(row, ["Приоритет", "priority", "Priority"]))
    };
}

function getTicketValue(row, keys) {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== null && row[key] !== undefined) {
            return row[key];
        }
    }
    const normalizedKeys = new Map(Object.keys(row).map(key => [normalizeText(key), key]));
    for (const key of keys) {
        const actualKey = normalizedKeys.get(normalizeText(key));
        if (actualKey !== undefined && row[actualKey] !== null && row[actualKey] !== undefined) {
            return row[actualKey];
        }
    }
    return null;
}

// ===============================
// ЗАЯВКИ: РАСЧЁТ
// ===============================

function prepareTicketWorkHours() {
    const sourceTickets = ticketDatasets[ticketSourceMode];
    if (!sourceTickets || sourceTickets.length === 0) {
        ticketWorkHoursPanel.hidden = true;
        ticketWorkHoursBody.innerHTML = "";
        return;
    }

    const filters = getTicketFilters();
    if (!filters.dateFrom || !filters.dateTo || filters.dateFrom > filters.dateTo) {
        ticketWorkHoursPanel.hidden = true;
        return;
    }

    const calendar = getProductionCalendarStats(filters.dateFrom, filters.dateTo);
    const employees = Array.from(new Set(
        filterTicketsBySource(sourceTickets, filters)
            .filter(ticket => isCompletedTicket(ticket.status))
            .map(ticket => ticket.employee || "Не назначен")
    )).sort((a, b) => a.localeCompare(b, "ru"));

    ticketWorkHoursBody.innerHTML = "";
    employees.forEach(employee => {
        if (!ticketWorkHoursTouched.has(employee)) ticketWorkHours[employee] = calendar.normHours;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(employee)}</td>
            <td>${calendar.workingDays}</td>
            <td>${formatHoursNumber(calendar.normHours)}</td>
            <td><input class="worked-hours-input" type="number" min="0" step="0.25" value="${ticketWorkHours[employee]}" data-employee="${escapeHtml(employee)}" aria-label="Фактически отработанные часы: ${escapeHtml(employee)}"></td>
        `;
        ticketWorkHoursBody.appendChild(row);
    });
    ticketWorkHoursPanel.hidden = employees.length === 0;
}

function handleTicketWorkHoursInput(event) {
    const input = event.target.closest(".worked-hours-input");
    if (!input) return;
    const value = Number(input.value);
    ticketWorkHours[input.dataset.employee] = Number.isFinite(value) && value >= 0 ? value : 0;
    ticketWorkHoursTouched.add(input.dataset.employee);
    resetTicketResults();
}

function handleTicketPeriodChange() {
    ticketWorkHours = {};
    ticketWorkHoursTouched = new Set();
    resetTicketResults();
    prepareTicketWorkHours();
}

function filterTicketsBySource(sourceTickets, filters) {
    return sourceTickets.filter(ticket => {
        if (!ticket.createdAt || ticket.createdAt < filters.dateFrom || ticket.createdAt > filters.dateTo) return false;
        if (ticketSourceMode === "file" && filters.line && ticket.line !== filters.line) return false;
        if (!filters.includeCancelled && isCancelledTicket(ticket.status)) return false;
        return true;
    });
}

function runTicketAnalysis() {
    const sourceTickets = ticketDatasets[ticketSourceMode];
    if (!sourceTickets || sourceTickets.length === 0) {
        showTicketStatus("Сначала загрузите файл или данные из HTTP-сервиса.", true);
        return;
    }

    const filters = getTicketFilters();
    if (!filters.dateFrom || !filters.dateTo) {
        showTicketStatus("Укажите период расчёта.", true);
        return;
    }
    if (filters.dateFrom > filters.dateTo) {
        showTicketStatus("Дата начала периода не может быть позже даты окончания.", true);
        return;
    }

    const filtered = filterTicketsBySource(sourceTickets, filters);
    const completedTickets = filtered.filter(ticket => isCompletedTicket(ticket.status));
    if (completedTickets.length === 0) {
        showTicketStatus("В выбранном периоде нет завершённых заявок.", true);
        resetTicketResults();
        return;
    }

    prepareTicketWorkHours();
    const categories = buildTicketCategoryIndex();
    const timelineMap = buildTicketTimelineMap(ticketHistoryDatasets[ticketSourceMode]);
    const productionCalendar = getProductionCalendarStats(filters.dateFrom, filters.dateTo);
    const workDays = productionCalendar.workingDays;
    const productionNormHours = productionCalendar.normHours;

    const employees = new Map();
    completedTickets.forEach(ticket => {
        const employeeName = ticket.employee || "Не назначен";
        if (!employees.has(employeeName)) {
            employees.set(employeeName, {
                employee: employeeName,
                completedCount: 0,
                lifecycleMs: 0,
                standardMs: 0,
                actualMs: 0,
                workDays,
                productionNormHours,
                workedHours: Number(ticketWorkHours[employeeName]) || 0,
                deadlineCount: 0,
                deadlineEvaluatedCount: 0,
                onTimeCount: 0,
                overdueCount: 0,
                withoutStandard: 0,
                withoutLifecycle: 0,
                tickets: []
            });
        }

        const result = employees.get(employeeName);
        const enriched = enrichCompletedTicket(ticket, timelineMap, categories);
        result.completedCount += 1;
        result.lifecycleMs += enriched.lifecycleMs;
        result.standardMs += enriched.standardMs;
        result.actualMs += enriched.actualMs;
        result.deadlineCount += enriched.deadlineAt ? 1 : 0;
        result.deadlineEvaluatedCount += enriched.deadlineResult ? 1 : 0;
        result.onTimeCount += enriched.deadlineResult === "on-time" ? 1 : 0;
        result.overdueCount += enriched.deadlineResult === "overdue" ? 1 : 0;
        result.withoutStandard += enriched.standardMs > 0 ? 0 : 1;
        result.withoutLifecycle += enriched.lifecycleMs > 0 ? 0 : 1;
        result.tickets.push(enriched);
    });

    lastAnalyzedTickets = completedTickets;
    ticketAnalysisResult = Array.from(employees.values())
        .map(item => ({
            ...item,
            utilizationPercent: item.workedHours > 0 ? item.standardMs / (item.workedHours * 3600000) : null,
            overduePercent: item.deadlineEvaluatedCount > 0
                ? item.overdueCount / item.deadlineEvaluatedCount
                : null
        }))
        .sort((a, b) => b.completedCount - a.completedCount || a.employee.localeCompare(b.employee, "ru"));

    renderTicketAnalysis();
    const withoutNorm = ticketAnalysisResult.reduce((sum, row) => sum + row.withoutStandard, 0);
    const withoutLifecycle = ticketAnalysisResult.reduce((sum, row) => sum + row.withoutLifecycle, 0);
    const unevaluatedDeadlines = ticketAnalysisResult.reduce((sum, row) => sum + row.deadlineCount - row.deadlineEvaluatedCount, 0);
    const linkedWithCompletion = completedTickets.filter(ticket => Boolean(getTicketTimeline(ticket, timelineMap).completedAt || ticket.completedAt)).length;
    const notes = [
        `В расчёт включено завершённых заявок: ${completedTickets.length}.`,
        `История статусов: ${ticketHistoryDatasets[ticketSourceMode].length} событий; завершение найдено для ${linkedWithCompletion} заявок.`
    ];
    if (withoutNorm > 0) notes.push(`Без найденного норматива: ${withoutNorm}.`);
    if (withoutLifecycle > 0) notes.push(`Без интервала «Новая → Завершена»: ${withoutLifecycle}.`);
    if (unevaluatedDeadlines > 0) notes.push(`Дедлайн не удалось оценить: ${unevaluatedDeadlines}.`);
    showTicketStatus(notes.join(" "), false);
}

function getTicketFilters() {
    const isFile = ticketSourceMode === "file";
    const fromValue = isFile ? ticketFileDateFrom.value : ticketHttpDateFrom.value;
    const toValue = isFile ? ticketFileDateTo.value : ticketHttpDateTo.value;
    return {
        dateFrom: parseDateInputBoundary(fromValue, false),
        dateTo: parseDateInputBoundary(toValue, true),
        line: isFile ? ticketFileLine.value : ticketHttpLine.value,
        includeCancelled: (isFile ? ticketFileIncludeCancelled.value : ticketHttpIncludeCancelled.value) === "yes"
    };
}

function isCancelledTicket(status) {
    return normalizeText(status).includes("отмен") || normalizeText(status) === "cancelled";
}

function isCompletedTicket(status) {
    const normalized = normalizeText(status);
    return normalized.includes("заверш") || normalized === "completed" || normalized === "closed";
}

function isNewTicketStatus(status) {
    const normalized = normalizeText(status);
    return normalized === "новая" || normalized === "new";
}

function buildTicketTimelineMap(events) {
    const grouped = new Map();

    const addEvent = (key, event) => {
        const normalizedKey = normalizeTicketLinkKey(key);
        if (!normalizedKey) return;
        if (!grouped.has(normalizedKey)) grouped.set(normalizedKey, []);
        grouped.get(normalizedKey).push(event);
    };

    (events || []).forEach(event => {
        const object = normalizeText(event.object);
        if (object && object !== "status" && !object.includes("статус")) return;
        addEvent(event.ticketId, event);
        addEvent(event.ticketNumber, event);
    });

    const timelines = new Map();
    grouped.forEach((ticketEvents, ticketKey) => {
        const sorted = ticketEvents.slice().sort((a, b) => a.period - b.period);
        timelines.set(ticketKey, {
            newAt: sorted.find(event => isNewTicketStatus(event.newStatus))?.period || null,
            completedAt: sorted.find(event => isCompletedTicket(event.newStatus))?.period || null
        });
    });

    return timelines;
}

function normalizeTicketLinkKey(value) {
    return cleanText(value)
        .replace(/[{}]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();
}

function getTicketTimeline(ticket, timelineMap) {
    const idKey = normalizeTicketLinkKey(ticket.id);
    const numberKey = normalizeTicketLinkKey(ticket.number);
    return timelineMap.get(idKey) || timelineMap.get(numberKey) || {};
}

function enrichCompletedTicket(ticket, timelineMap, categories) {
    const timeline = getTicketTimeline(ticket, timelineMap);
    const newAt = timeline.newAt || ticket.newAt || ticket.createdAt;
    const completedAt = timeline.completedAt || ticket.completedAt;
    const lifecycleMs = newAt && completedAt && completedAt >= newAt ? completedAt - newAt : 0;
    const classification = classifyTicketCategory(ticket, categories);
    const standardMs = classification ? classification.minutes * 60000 : 0;
    const actualMs = ticket.actualSeconds * 1000;
    let deadlineResult = null;
    if (ticket.deadlineAt && completedAt) deadlineResult = completedAt <= ticket.deadlineAt ? "on-time" : "overdue";
    return {
        ...ticket,
        newAt,
        completedAt,
        lifecycleMs,
        standardMs,
        actualMs,
        classifiedGroup: classification?.group || "",
        classifiedCategory: classification?.name || "Не определена",
        deadlineResult
    };
}

function getProductionCalendarStats(dateFrom, dateTo) {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
        return { workingDays: 0, normHours: 0, shortenedDays: 0 };
    }

    const start = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
    const end = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
    const years = new Set();

    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) years.add(year);
    const unsupportedYears = Array.from(years).filter(year => !RU_PRODUCTION_CALENDAR[year]);
    if (unsupportedYears.length > 0) {
        throw new Error(
            `Для производственного календаря не настроен год: ${unsupportedYears.join(", ")}. ` +
            "Сейчас в программу встроен официальный календарь РФ на 2026 год."
        );
    }

    let workingDays = 0;
    let normHours = 0;
    let shortenedDays = 0;
    const current = new Date(start);

    while (current <= end) {
        const year = current.getFullYear();
        const calendar = RU_PRODUCTION_CALENDAR[year];
        const key = formatIsoDateLocal(current);
        const weekDay = current.getDay();
        const isWeekend = weekDay === 0 || weekDay === 6;
        const isWorkingWeekend = calendar.workingWeekends.has(key);
        const isDayOff = calendar.daysOff.has(key);
        const isWorkingDay = !isDayOff && (!isWeekend || isWorkingWeekend);

        if (isWorkingDay) {
            workingDays += 1;
            const isShortened = calendar.shortenedDays.has(key);
            normHours += isShortened ? 7 : 8;
            if (isShortened) shortenedDays += 1;
        }

        current.setDate(current.getDate() + 1);
    }

    return { workingDays, normHours, shortenedDays };
}

function formatIsoDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function renderTicketAnalysis() {
    const total = ticketAnalysisResult.reduce((acc, row) => {
        acc.tickets += row.completedCount;
        acc.lifecycle += row.lifecycleMs;
        acc.standard += row.standardMs;
        acc.deadlineEvaluated += row.deadlineEvaluatedCount;
        acc.overdue += row.overdueCount;
        return acc;
    }, { tickets: 0, lifecycle: 0, standard: 0, deadlineEvaluated: 0, overdue: 0 });

    ticketTotalCount.textContent = total.tickets;
    ticketEmployeesCount.textContent = ticketAnalysisResult.length;
    ticketTotalLifecycle.textContent = formatDuration(total.lifecycle);
    ticketStandardTotal.textContent = formatDuration(total.standard);
    ticketOverduePercent.textContent = formatPercent(
        total.deadlineEvaluated > 0 ? total.overdue / total.deadlineEvaluated : null
    );

    ticketResultBody.innerHTML = "";
    if (ticketAnalysisResult.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = '<td colspan="14">Нет завершённых заявок для выбранных фильтров.</td>';
        ticketResultBody.appendChild(row);
    } else {
        ticketAnalysisResult.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(item.employee)}</td>
                <td>${item.completedCount}</td>
                <td>${formatDuration(item.lifecycleMs)}</td>
                <td>${formatDuration(item.actualMs)}</td>
                <td>${formatDuration(item.standardMs)}</td>
                <td>${item.workDays}</td>
                <td>${formatHoursNumber(item.productionNormHours)}</td>
                <td>${formatHoursNumber(item.workedHours)}</td>
                <td>${formatPercent(item.utilizationPercent)}</td>
                <td>${item.deadlineCount}</td>
                <td>${item.onTimeCount}</td>
                <td>${item.overdueCount}</td>
                <td>${formatPercent(item.overduePercent)}</td>
                <td><button type="button" class="small-button view-tickets-btn" data-employee="${escapeHtml(item.employee)}">Посмотреть</button></td>
            `;
            ticketResultBody.appendChild(row);
        });
    }

    ticketSummary.hidden = false;
    ticketResultsPanel.hidden = false;
    ticketChartsPanel.hidden = false;
    renderTicketCategoryCharts();
    exportTicketsBtn.disabled = ticketAnalysisResult.length === 0;
    exportTicketsPdfBtn.disabled = ticketAnalysisResult.length === 0;
}

function resetTicketResults() {
    ticketAnalysisResult = [];
    lastAnalyzedTickets = [];
    ticketSummary.hidden = true;
    ticketResultsPanel.hidden = true;
    ticketChartsPanel.hidden = true;
    ticketResultBody.innerHTML = "";
    clearTicketCategoryCharts();
    exportTicketsBtn.disabled = true;
    exportTicketsPdfBtn.disabled = true;
}

function formatPercent(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("ru-RU", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

function formatHoursNumber(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

// ===============================
// ЗАЯВКИ: ТАБЛИЦА КАТЕГОРИЙ
// ===============================

function loadTicketCategories() {
    try {
        const saved = JSON.parse(localStorage.getItem(TICKET_CATEGORIES_STORAGE_KEY));
        if (Array.isArray(saved) && saved.length > 0) {
            return saved;
        }
    } catch (error) {
        console.warn("Не удалось загрузить сохранённые нормативы", error);
    }
    return DEFAULT_TICKET_CATEGORIES.map(item => ({ ...item }));
}

function saveTicketCategories() {
    try {
        localStorage.setItem(TICKET_CATEGORIES_STORAGE_KEY, JSON.stringify(ticketCategories));
    } catch (error) {
        console.warn("Не удалось сохранить нормативы", error);
    }
}

function renderTicketCategories() {
    categoriesBody.innerHTML = "";
    ticketCategories.forEach((category, index) => {
        const row = document.createElement("tr");
        row.dataset.index = String(index);
        row.innerHTML = `
            <td><input type="text" data-field="group" value="${escapeHtml(category.group || "")}" aria-label="Группа категории"></td>
            <td><input type="text" data-field="names" value="${escapeHtml(category.names || "")}" aria-label="Названия категории"></td>
            <td><input type="number" data-field="minutes" value="${Number(category.minutes) || 0}" min="0" step="1" aria-label="Норматив в минутах"></td>
            <td><button type="button" class="remove-category-btn" title="Удалить категорию" aria-label="Удалить категорию">×</button></td>
        `;
        categoriesBody.appendChild(row);
    });
}

function handleCategoryEdit(event) {
    const input = event.target.closest("input[data-field]");
    const row = event.target.closest("tr[data-index]");
    if (!input || !row) return;
    const index = Number(row.dataset.index);
    if (!ticketCategories[index]) return;
    ticketCategories[index][input.dataset.field] = input.dataset.field === "minutes"
        ? Math.max(0, Number(input.value) || 0)
        : input.value;
    saveTicketCategories();
    resetTicketResults();
}

function handleCategoryAction(event) {
    const button = event.target.closest(".remove-category-btn");
    const row = event.target.closest("tr[data-index]");
    if (!button || !row) return;
    ticketCategories.splice(Number(row.dataset.index), 1);
    saveTicketCategories();
    renderTicketCategories();
    resetTicketResults();
}

function addTicketCategory() {
    ticketCategories.push({ key: `custom_${Date.now()}`, group: "", name: "Новая категория", names: "", minutes: 15 });
    saveTicketCategories();
    renderTicketCategories();
    categoriesBody.lastElementChild?.querySelector('input[data-field="group"]')?.focus();
    resetTicketResults();
}

function resetTicketCategories() {
    if (!confirm("Вернуть исходный справочник нормативов? Внесённые изменения будут удалены.")) {
        return;
    }
    ticketCategories = DEFAULT_TICKET_CATEGORIES.map(item => ({ ...item }));
    saveTicketCategories();
    renderTicketCategories();
    resetTicketResults();
}

function buildTicketCategoryIndex() {
    return ticketCategories
        .map(category => ({
            ...category,
            name: category.name || String(category.names || "").split("|")[0].trim(),
            minutes: Number(category.minutes),
            aliases: String(category.names || "").split("|").map(normalizeText).filter(Boolean)
        }))
        .filter(category => category.aliases.length > 0 && Number.isFinite(category.minutes) && category.minutes >= 0);
}

function classifyTicketCategory(ticket, categories) {
    const ticketType = normalizeText(ticket.category);
    const text = normalizeText([ticket.category, ticket.topic, ticket.problem, ticket.solution].filter(Boolean).join(" ")).replaceAll("ё", "е");
    const findByKey = key => categories.find(category => category.key === key) || null;
    const contains = (...terms) => terms.some(term => text.includes(term));

    // Сначала внутренние вопросы, чтобы общие слова «доступ» и «другое» не относились к клиентской группе.
    if (contains("новый сотрудник", "нового сотрудника", "оборудовать место", "оборудовано место")) {
        return contains("оборуд", "рабочее место") ? findByKey("internal_workplace") : findByKey("internal_access");
    }
    if (contains("принтер", "оргтехник", "сканер")) return findByKey("internal_network");
    if (contains("телефон", "сипуни", "sipuni", "звонки", "не звонит")) return findByKey("internal_telephony");
    if (contains("наушник", "lightshot", "скриншот", "звук на компьютер", "звук в науш")) return findByKey("internal_equipment");
    if (contains("connect", "коннект", "телетайп", "chatgpt", "gmail", "amo crm", "юджайл", "почт", "winscp") && !contains("база", "дамп")) {
        return contains("доступ", "добав", "учетк", "парол", "войти", "вход") ? findByKey("internal_access") : findByKey("internal_external_service");
    }
    if (contains("vpn") && !contains("клиент")) return findByKey("internal_external_service");
    if (contains("доступ в бух", "доступ к учетной системе", "закрыть доступ", "доступы закрыты")) return findByKey("internal_access");

    // Клиентские вопросы 1С.
    if (contains("слк", "лиценз", "auto.lic", "ключ защиты", "уат")) return findByKey("client_industry_licenses");
    if (contains("синхронизац", "транспорт обмен", "транспорт", "обмен между баз", "файл обмена")) return findByKey("client_exchange_transport");
    if (contains("публикац", "опубликов", "odata", "веб-клиент", "веб клиент", "веб-сервис", "веб сервис")) return findByKey("client_publication");
    if (contains("winrdp", "win rdp", "altrd", "альтрд", "rds", "рдп")) {
        return contains("создать", "учетк", "доступ", "парол", "квот", "места") ? findByKey("client_access") : findByKey("client_remote_desktop");
    }
    if (contains("ftp")) return findByKey("client_access");
    if (contains("дата дамп", "дамп", "загрузить баз", "загрузка баз", "подгрузк", "выгрузк", "развернул", "развернуть", "восстановлен", "восстановить баз")) return findByKey("client_database_import_export");
    if (contains("обновлен", "обновить", "обновление", "патч", "релиз", "файл перехода", "конфигураци")) {
        return contains("нет релиза", "отсутств", "файл перехода", "подложил", "подгрузить релиз") ? findByKey("client_release") : findByKey("client_database_update");
    }
    if (contains("задач модиф", "задачи модиф", "зм ", "зм по", " зо ", "конвертац", "перенос баз", "предоставлен")) return findByKey("client_background_tasks");
    if (contains("не входит", "не войти", "при входе", "вход в баз", "подключиться к базе", "потеряно соединение")) return findByKey("client_database_login");
    if (contains("ошибка в базе", "ошибка при", "тии", "тестирование и исправление", "фоновые задан", "ссылочной целост", "расширени", "ошибка релиза") || ticketType === "ошибка в базе") return findByKey("client_database_problem");
    if (ticketType === "недоступность базы") return findByKey("client_database_login");
    if (ticketType === "консультация" || contains("консультац", "возможност", "можно ли", "подскаж")) return findByKey("client_consultation");
    if (ticketType === "оргтехника" || ticketType === "рабочее место сотрудника") return findByKey("internal_equipment");
    if (ticketType === "сетевые и серверные вопросы") return findByKey("internal_network");

    const exactMatches = categories.filter(category => category.aliases.includes(ticketType));
    if (exactMatches.length === 1) return exactMatches[0];
    return findByKey("client_other") || exactMatches[0] || null;
}

// ===============================
// ЗАЯВКИ: ДЕТАЛИ И ЭКСПОРТ
// ===============================

function getAnalyzedTicketsFlat() {
    return ticketAnalysisResult.flatMap(item => Array.isArray(item.tickets) ? item.tickets : []);
}

function getTicketCategoryDistribution(groupMatch) {
    const normalizedMatch = normalizeText(groupMatch);
    const counts = new Map();

    getAnalyzedTicketsFlat().forEach(ticket => {
        const group = normalizeText(ticket.classifiedGroup);
        if (!group.includes(normalizedMatch)) return;
        const category = cleanText(ticket.classifiedCategory) || "\u041d\u0435 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0430";
        counts.set(category, (counts.get(category) || 0) + 1);
    });

    return Array.from(counts, ([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ru"));
}

function renderTicketCategoryCharts() {
    TICKET_CHART_DEFINITIONS.forEach(definition => {
        const canvas = document.getElementById(definition.canvasId);
        const legend = document.getElementById(definition.legendId);
        const data = getTicketCategoryDistribution(definition.groupMatch);
        drawTicketDonutChart(canvas, legend, data, definition);
    });
}

function clearTicketCategoryCharts() {
    TICKET_CHART_DEFINITIONS.forEach(definition => {
        const canvas = document.getElementById(definition.canvasId);
        const legend = document.getElementById(definition.legendId);
        if (canvas) {
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (legend) legend.innerHTML = "";
    });
}

function drawTicketDonutChart(canvas, legend, data, definition) {
    if (!canvas || !legend) return;

    const parentWidth = canvas.parentElement?.clientWidth || 760;
    const viewportLimit = Math.max(300, window.innerWidth - 72);
    const cssSize = Math.round(Math.max(300, Math.min(760, parentWidth - 12, viewportLimit)));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssSize * pixelRatio);
    canvas.height = Math.round(cssSize * pixelRatio);
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;

    const context = canvas.getContext("2d");
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, cssSize, cssSize);
    legend.innerHTML = "";

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const center = cssSize / 2;
    const radius = cssSize * 0.455;

    if (total === 0) {
        context.beginPath();
        context.arc(center, center, radius, 0, Math.PI * 2);
        context.fillStyle = "#eef2f7";
        context.fill();
        context.fillStyle = "#667085";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `600 ${Math.max(16, cssSize * 0.028)}px Arial, sans-serif`;
        context.fillText("Нет заявок", center, center);
        legend.innerHTML = '<div class="ticket-chart-empty">В этой группе нет завершённых заявок.</div>';
        return;
    }

    let startAngle = -Math.PI / 2;
    const sectors = [];

    data.forEach((item, index) => {
        const share = item.count / total;
        const endAngle = startAngle + share * Math.PI * 2;
        const color = TICKET_CHART_COLORS[index % TICKET_CHART_COLORS.length];

        context.beginPath();
        context.moveTo(center, center);
        context.arc(center, center, radius, startAngle, endAngle);
        context.closePath();
        context.fillStyle = color;
        context.fill();

        context.strokeStyle = "#ffffff";
        context.lineWidth = Math.max(2, cssSize * 0.004);
        context.stroke();

        sectors.push({ item, share, startAngle, endAngle, color, index });
        startAngle = endAngle;

        const row = document.createElement("button");
        row.type = "button";
        row.className = "ticket-chart-legend-row";
        row.dataset.category = item.name;
        row.dataset.groupMatch = definition?.groupMatch || "";
        row.title = `Открыть заявки категории «${item.name}»`;
        row.setAttribute("aria-label", `Открыть заявки категории ${item.name}: ${item.count}, ${formatPercent(share)}`);
        row.innerHTML = `
            <span class="ticket-chart-legend-color" style="background:${color}"></span>
            <span class="ticket-chart-legend-name">${escapeHtml(item.name)}</span>
            <span class="ticket-chart-legend-stats"><b>${item.count}</b><span>${formatPercent(share)}</span></span>
        `;
        row.addEventListener("click", () => openTicketsByCategory(row.dataset.groupMatch, row.dataset.category));
        legend.appendChild(row);
    });

    sectors.forEach(({ share, startAngle, endAngle, index }) => {
        const middleAngle = (startAngle + endAngle) / 2;
        // Для узких секторов немного разводим подписи по радиусу, но оставляем их внутри сектора.
        const labelRadiusFactor = share < 0.045 ? (index % 2 === 0 ? 0.76 : 0.63) : 0.62;
        const labelRadius = radius * labelRadiusFactor;
        const x = center + Math.cos(middleAngle) * labelRadius;
        const y = center + Math.sin(middleAngle) * labelRadius;
        const percentValue = share * 100;
        const label = percentValue >= 10
            ? `${Math.round(percentValue)}%`
            : `${percentValue.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
        const fontSize = Math.max(10, Math.min(cssSize * 0.034, 22, share * cssSize * 0.52));

        context.save();
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `700 ${fontSize}px Arial, sans-serif`;
        context.lineJoin = "round";
        context.strokeStyle = "rgba(0, 0, 0, 0.32)";
        context.lineWidth = Math.max(2.4, fontSize * 0.19);
        context.strokeText(label, x, y);
        context.fillStyle = "#ffffff";
        context.fillText(label, x, y);
        context.restore();
    });
}

function openTicketsByCategory(groupMatch, categoryName) {
    const normalizedGroup = normalizeText(groupMatch);
    const normalizedCategory = normalizeText(categoryName);
    const tickets = getAnalyzedTicketsFlat()
        .filter(ticket => {
            const group = normalizeText(ticket.classifiedGroup);
            const category = normalizeText(ticket.classifiedCategory || "Не определена");
            return group.includes(normalizedGroup) && category === normalizedCategory;
        })
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    if (tickets.length === 0) return;
    const groupLabel = cleanText(tickets[0]?.classifiedGroup) || "Группа не определена";
    const standardMs = tickets.reduce((sum, ticket) => sum + (ticket.standardMs || 0), 0);
    const actualMs = tickets.reduce((sum, ticket) => sum + (ticket.actualMs || 0), 0);

    openTicketsCollectionModal({
        title: `Заявки категории: ${categoryName}`,
        subtitle: `${groupLabel} · ${tickets.length} завершённых заявок · нормативное время ${formatDuration(standardMs)} · указанная длительность ${formatDuration(actualMs)}`,
        filenameLabel: `категория_${categoryName}`,
        tickets
    });
}

function getTicketReportTotals() {
    return ticketAnalysisResult.reduce((acc, item) => {
        acc.completed += item.completedCount;
        acc.lifecycleMs += item.lifecycleMs;
        acc.actualMs += item.actualMs;
        acc.standardMs += item.standardMs;
        acc.deadlineCount += item.deadlineCount;
        acc.deadlineEvaluated += item.deadlineEvaluatedCount;
        acc.onTime += item.onTimeCount;
        acc.overdue += item.overdueCount;
        return acc;
    }, {
        completed: 0,
        lifecycleMs: 0,
        actualMs: 0,
        standardMs: 0,
        deadlineCount: 0,
        deadlineEvaluated: 0,
        onTime: 0,
        overdue: 0
    });
}

function getReportPeriodLabel() {
    const filters = getTicketFilters();
    const formatter = new Intl.DateTimeFormat("ru-RU");
    if (!filters.dateFrom || !filters.dateTo) return "";
    return `${formatter.format(filters.dateFrom)} - ${formatter.format(filters.dateTo)}`;
}

function getReportSourceLabel() {
    if (ticketSourceMode === "file") {
        const line = cleanText(ticketFileLine.value);
        return line ? `\u0424\u0430\u0439\u043b; \u043b\u0438\u043d\u0438\u044f: ${line}` : "\u0424\u0430\u0439\u043b; \u0432\u0441\u0435 \u043b\u0438\u043d\u0438\u0438";
    }
    const line = cleanText(ticketHttpLine.options[ticketHttpLine.selectedIndex]?.textContent || ticketHttpLine.value);
    return line ? `HTTP; \u043b\u0438\u043d\u0438\u044f: ${line}` : "HTTP";
}

function cloneTicketChartCardForPdf(definition) {
    const sourceCard = document.getElementById(definition.cardId);
    const sourceCanvas = document.getElementById(definition.canvasId);
    if (!sourceCard || !sourceCanvas) return null;

    const clone = sourceCard.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.add("pdf-chart-card");
    clone.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));

    const cloneCanvas = clone.querySelector("canvas");
    if (cloneCanvas) {
        const image = document.createElement("img");
        image.className = "pdf-chart-image";
        image.alt = "";
        image.src = sourceCanvas.toDataURL("image/png");
        cloneCanvas.replaceWith(image);
    }

    clone.querySelectorAll("button.ticket-chart-legend-row").forEach(button => {
        const row = document.createElement("div");
        row.className = button.className;
        row.innerHTML = button.innerHTML;
        button.replaceWith(row);
    });

    return clone;
}

function buildTicketReportPdfElement() {
    const totals = getTicketReportTotals();
    const exportRoot = document.createElement("div");
    exportRoot.className = "pdf-export-root pdf-report-export";

    const evaluatedOverduePercent = totals.deadlineEvaluated > 0 ? totals.overdue / totals.deadlineEvaluated : null;
    const header = document.createElement("div");
    header.className = "pdf-report-header";
    header.innerHTML = `
        <h1>Отчёт по заявкам</h1>
        <p><b>Период:</b> ${escapeHtml(getReportPeriodLabel())}</p>
        <p><b>Источник:</b> ${escapeHtml(getReportSourceLabel())}</p>
    `;
    exportRoot.appendChild(header);

    const summary = document.createElement("div");
    summary.className = "pdf-summary-grid";
    summary.innerHTML = `
        <div><span>Обработано тикетов</span><b>${totals.completed}</b></div>
        <div><span>Исполнителей</span><b>${ticketAnalysisResult.length}</b></div>
        <div><span>Общее время тикетов</span><b>${escapeHtml(formatDuration(totals.lifecycleMs))}</b></div>
        <div><span>Время по нормативу</span><b>${escapeHtml(formatDuration(totals.standardMs))}</b></div>
        <div><span>Просрочено</span><b>${escapeHtml(formatPercent(evaluatedOverduePercent))}</b></div>
    `;
    exportRoot.appendChild(summary);

    const sectionTitle = document.createElement("h2");
    sectionTitle.textContent = "Сводка по исполнителям";
    exportRoot.appendChild(sectionTitle);

    const table = document.createElement("table");
    table.className = "pdf-report-table";
    table.innerHTML = `
        <thead><tr>
            <th>Исполнитель</th>
            <th>Тикетов</th>
            <th>Новая - Завершена</th>
            <th>Длительность</th>
            <th>Норматив</th>
            <th>Раб. дней</th>
            <th>Норма часов</th>
            <th>Факт. часов</th>
            <th>% на тикеты</th>
            <th>С дедлайном</th>
            <th>В срок</th>
            <th>Просрочено</th>
            <th>% просроч.</th>
        </tr></thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");
    ticketAnalysisResult.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(item.employee)}</td>
            <td>${item.completedCount}</td>
            <td>${escapeHtml(formatDuration(item.lifecycleMs))}</td>
            <td>${escapeHtml(formatDuration(item.actualMs))}</td>
            <td>${escapeHtml(formatDuration(item.standardMs))}</td>
            <td>${item.workDays}</td>
            <td>${escapeHtml(formatHoursNumber(item.productionNormHours))}</td>
            <td>${escapeHtml(formatHoursNumber(item.workedHours))}</td>
            <td>${escapeHtml(formatPercent(item.utilizationPercent))}</td>
            <td>${item.deadlineCount}</td>
            <td>${item.onTimeCount}</td>
            <td>${item.overdueCount}</td>
            <td>${escapeHtml(formatPercent(item.overduePercent))}</td>
        `;
        tbody.appendChild(row);
    });
    exportRoot.appendChild(table);

    const calculationNote = document.createElement("p");
    calculationNote.className = "pdf-calculation-note";
    calculationNote.textContent = "Процент времени на тикеты = сумма нормативов по тематикам / фактически отработанные часы. Процент просроченных = просроченные / заявки с оценённым дедлайном.";
    exportRoot.appendChild(calculationNote);

    return exportRoot;
}

function buildTicketsPdfHeaderElement(context) {
    const exportRoot = document.createElement("div");
    exportRoot.className = "pdf-export-root pdf-ticket-list-export pdf-ticket-list-header";

    const header = document.createElement("div");
    header.className = "pdf-report-header";
    header.innerHTML = `
        <h1>${escapeHtml(context.title || "Заявки")}</h1>
        <p><b>Период:</b> ${escapeHtml(getReportPeriodLabel())}</p>
        <p>${escapeHtml(context.subtitle || `${context.tickets?.length || 0} завершённых заявок`)}</p>
    `;
    exportRoot.appendChild(header);
    return exportRoot;
}

function loadExternalScript(src, readyCheck) {
    return new Promise((resolve, reject) => {
        if (readyCheck()) {
            resolve();
            return;
        }

        const absoluteSrc = new URL(src, window.location.href).href;
        const existing = Array.from(document.scripts).find(script => script.src === absoluteSrc);
        if (existing) {
            existing.addEventListener("load", () => readyCheck() ? resolve() : reject(new Error(`Library did not initialize: ${src}`)), { once: true });
            existing.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => readyCheck() ? resolve() : reject(new Error(`Library did not initialize: ${src}`));
        script.onerror = () => reject(new Error(`Could not load ${src}`));
        document.head.appendChild(script);
    });
}

function getJsPdfConstructor() {
    return window.jspdf?.jsPDF || window.jsPDF || null;
}

async function loadLibraryFromUrls(urls, readyCheck) {
    let lastError = null;
    for (const url of urls) {
        try {
            await loadExternalScript(url, readyCheck);
            if (readyCheck()) return;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error("Не удалось загрузить библиотеку PDF.");
}

async function ensurePdfExportLibrary() {
    if (typeof window.html2canvas === "function" && getJsPdfConstructor()) return;
    if (pdfExportLoadingPromise) return pdfExportLoadingPromise;

    pdfExportLoadingPromise = (async () => {
        if (typeof window.html2canvas !== "function") {
            await loadLibraryFromUrls(HTML2CANVAS_LIBRARY_URLS, () => typeof window.html2canvas === "function");
        }
        if (!getJsPdfConstructor()) {
            await loadLibraryFromUrls(JSPDF_LIBRARY_URLS, () => Boolean(getJsPdfConstructor()));
        }
    })();

    try {
        await pdfExportLoadingPromise;
    } catch (error) {
        pdfExportLoadingPromise = null;
        throw error;
    }
}

function waitForPdfLayout() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function sanitizePdfFilename(value) {
    const cleaned = String(value || "")
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
    return cleaned.slice(0, 140) || "report";
}

function createPdfRenderHost(widthPx) {
    const host = document.createElement("div");
    host.className = "pdf-render-host";
    host.style.width = `${widthPx}px`;
    document.body.appendChild(host);
    return host;
}

async function renderPdfElementToCanvas(element, host) {
    host.replaceChildren(element);
    await waitForPdfLayout();

    const rect = element.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
        throw new Error("Печатная область имеет нулевой размер.");
    }

    const canvas = await window.html2canvas(element, {
        scale: 1.6,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.ceil(Math.max(rect.width, document.documentElement.clientWidth)),
        windowHeight: Math.ceil(Math.max(rect.height, document.documentElement.clientHeight))
    });

    if (!canvas || canvas.width < 10 || canvas.height < 10) {
        throw new Error("Не удалось отрисовать содержимое для PDF.");
    }
    return canvas;
}

function addNewPdfPage(pdf, state) {
    if (state.hasPageContent) pdf.addPage();
    state.y = state.margin;
    state.hasPageContent = false;
}

function addCanvasToPdf(pdf, canvas, state, options = {}) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - state.margin * 2;
    const usableHeight = pageHeight - state.margin * 2;
    const gap = options.gapMm ?? 4;

    if (options.forceNewPage && state.hasPageContent) addNewPdfPage(pdf, state);

    if (options.fitSinglePage) {
        const scale = Math.min(usableWidth / canvas.width, usableHeight / canvas.height);
        const fittedWidth = canvas.width * scale;
        const fittedHeight = canvas.height * scale;
        const x = (pageWidth - fittedWidth) / 2;
        const y = (pageHeight - fittedHeight) / 2;
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", x, y, fittedWidth, fittedHeight, undefined, "FAST");
        state.y = pageHeight - state.margin;
        state.hasPageContent = true;
        return;
    }

    const targetWidth = usableWidth;
    const fullTargetHeight = canvas.height * targetWidth / canvas.width;
    const remaining = pageHeight - state.margin - state.y;

    if (fullTargetHeight <= usableHeight) {
        if (state.hasPageContent && fullTargetHeight > remaining) addNewPdfPage(pdf, state);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
        pdf.addImage(dataUrl, "JPEG", state.margin, state.y, targetWidth, fullTargetHeight, undefined, "FAST");
        state.y += fullTargetHeight + gap;
        state.hasPageContent = true;
        return;
    }

    // Очень длинный блок режем на полосы по высоте страницы, поэтому даже большой список не создаёт гигантский canvas PDF.
    const sourcePixelsPerMm = canvas.width / targetWidth;
    const maxSliceHeightPx = Math.max(1, Math.floor(usableHeight * sourcePixelsPerMm));
    let sourceY = 0;

    while (sourceY < canvas.height) {
        if (state.hasPageContent) addNewPdfPage(pdf, state);
        const sliceHeight = Math.min(maxSliceHeightPx, canvas.height - sourceY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const sliceContext = sliceCanvas.getContext("2d");
        sliceContext.fillStyle = "#ffffff";
        sliceContext.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        sliceContext.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const sliceTargetHeight = sliceHeight * targetWidth / canvas.width;
        const dataUrl = sliceCanvas.toDataURL("image/jpeg", 0.94);
        pdf.addImage(dataUrl, "JPEG", state.margin, state.margin, targetWidth, sliceTargetHeight, undefined, "FAST");
        state.y = state.margin + sliceTargetHeight + gap;
        state.hasPageContent = true;
        sourceY += sliceHeight;
    }
}

async function exportTicketReportPdf() {
    if (ticketAnalysisResult.length === 0) {
        showTicketStatus("Сначала выполните расчёт заявок.", true);
        return;
    }

    const originalText = exportTicketsPdfBtn.textContent;
    exportTicketsPdfBtn.disabled = true;
    exportTicketsPdfBtn.textContent = "Формирую PDF...";
    let host = null;

    try {
        await ensurePdfExportLibrary();
        renderTicketCategoryCharts();
        await waitForPdfLayout();

        const JsPdf = getJsPdfConstructor();
        const pdf = new JsPdf({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
        const state = { margin: 8, y: 8, hasPageContent: false };
        host = createPdfRenderHost(1500);

        const reportCanvas = await renderPdfElementToCanvas(buildTicketReportPdfElement(), host);
        addCanvasToPdf(pdf, reportCanvas, state);

        for (const definition of TICKET_CHART_DEFINITIONS) {
            const chartCard = cloneTicketChartCardForPdf(definition);
            if (!chartCard) continue;
            const chartPage = document.createElement("div");
            chartPage.className = "pdf-export-root pdf-report-export pdf-chart-page";
            chartPage.appendChild(chartCard);
            const chartCanvas = await renderPdfElementToCanvas(chartPage, host);
            addCanvasToPdf(pdf, chartCanvas, state, { forceNewPage: true, fitSinglePage: true });
        }

        const period = getReportPeriodLabel().replace(/\s+/g, "_");
        const filename = sanitizePdfFilename(`отчёт_по_заявкам_${period}`) + ".pdf";
        pdf.save(filename);
        showTicketStatus("PDF-отчёт сформирован.", false);
    } catch (error) {
        console.error(error);
        showTicketStatus("Не удалось сформировать PDF: " + error.message, true);
    } finally {
        host?.remove();
        exportTicketsPdfBtn.textContent = originalText;
        exportTicketsPdfBtn.disabled = ticketAnalysisResult.length === 0;
    }
}

async function exportActiveEmployeeTicketsPdf() {
    const context = activeTicketsModalContext;
    if (!context || !Array.isArray(context.tickets) || context.tickets.length === 0) return;

    const originalText = ticketsModalPdfBtn.textContent;
    ticketsModalPdfBtn.disabled = true;
    ticketsModalPdfBtn.textContent = "Формирую PDF...";
    let host = null;

    try {
        await ensurePdfExportLibrary();
        const JsPdf = getJsPdfConstructor();
        const pdf = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
        const state = { margin: 9, y: 9, hasPageContent: false };
        host = createPdfRenderHost(920);

        const headerCanvas = await renderPdfElementToCanvas(buildTicketsPdfHeaderElement(context), host);
        addCanvasToPdf(pdf, headerCanvas, state, { gapMm: 5 });

        const cards = Array.from(ticketsModalBody.querySelectorAll(".ticket-card"));
        for (const sourceCard of cards) {
            const wrapper = document.createElement("div");
            wrapper.className = "pdf-export-root pdf-ticket-list-export pdf-single-ticket-export";
            const card = sourceCard.cloneNode(true);
            card.querySelectorAll("button").forEach(button => button.remove());
            wrapper.appendChild(card);
            const cardCanvas = await renderPdfElementToCanvas(wrapper, host);
            addCanvasToPdf(pdf, cardCanvas, state, { gapMm: 4 });
        }

        const period = getReportPeriodLabel().replace(/\s+/g, "_");
        const filename = sanitizePdfFilename(`заявки_${context.filenameLabel || "выборка"}_${period}`) + ".pdf";
        pdf.save(filename);
        showTicketStatus(`PDF со списком заявок сформирован: ${context.tickets.length}.`, false);
    } catch (error) {
        console.error(error);
        showTicketStatus("Не удалось сформировать PDF списка заявок: " + error.message, true);
    } finally {
        host?.remove();
        ticketsModalPdfBtn.textContent = originalText;
        ticketsModalPdfBtn.disabled = false;
    }
}

function handleTicketResultAction(event) {
    const button = event.target.closest(".view-tickets-btn");
    if (!button) return;
    openTicketsDetailsModal(button.dataset.employee);
}

function openTicketsDetailsModal(employeeName) {
    const result = ticketAnalysisResult.find(item => item.employee === employeeName);
    if (!result) return;

    openTicketsCollectionModal({
        title: `Заявки: ${employeeName}`,
        subtitle: `${result.completedCount} завершённых заявок, нормативное время работ ${formatDuration(result.standardMs)}, указанная длительность ${formatDuration(result.actualMs)}`,
        filenameLabel: employeeName,
        tickets: result.tickets
    });
}

function openTicketsCollectionModal({ title, subtitle, filenameLabel, tickets }) {
    const sortedTickets = (tickets || [])
        .slice()
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    if (sortedTickets.length === 0) return;

    activeTicketsModalContext = {
        title: title || "Заявки",
        subtitle: subtitle || `${sortedTickets.length} завершённых заявок`,
        filenameLabel: filenameLabel || "выборка",
        tickets: sortedTickets
    };

    ticketsModalPdfBtn.disabled = false;
    ticketsModalTitle.textContent = activeTicketsModalContext.title;
    ticketsModalSubtitle.textContent = activeTicketsModalContext.subtitle;
    ticketsModalBody.innerHTML = "";

    sortedTickets.forEach(ticket => {
        const card = document.createElement("article");
        card.className = "ticket-card";
        card.innerHTML = `
            <div class="ticket-card-header">
                <div><h3>${escapeHtml(ticket.number || ticket.id || "Заявка")}</h3><span class="ticket-status">${escapeHtml(ticket.status || "Статус не указан")}</span></div>
                <div><b>${escapeHtml(ticket.classifiedCategory)}</b><br><span class="hint">${escapeHtml(ticket.classifiedGroup || ticket.line || "Группа не определена")}</span></div>
            </div>
            <div class="ticket-metrics">
                <div class="ticket-metric"><span>Новая → Завершена</span><b>${ticket.lifecycleMs > 0 ? formatDuration(ticket.lifecycleMs) : "Нет истории"}</b></div>
                <div class="ticket-metric"><span>Длительность</span><b>${ticket.actualMs > 0 ? formatDuration(ticket.actualMs) : "Не заполнена"}</b></div>
                <div class="ticket-metric"><span>Норматив тематики</span><b>${ticket.standardMs > 0 ? formatDuration(ticket.standardMs) : "Не найден"}</b></div>
                <div class="ticket-metric"><span>Дедлайн</span><b>${formatTicketDeadlineResult(ticket)}</b></div>
            </div>
            <div class="dialog-meta">
                <div><b>Новая:</b> ${escapeHtml(formatTicketDateTime(ticket.newAt) || "Нет данных")}</div>
                <div><b>Завершена:</b> ${escapeHtml(formatTicketDateTime(ticket.completedAt) || "Нет данных")}</div>
                <div><b>Срок:</b> ${escapeHtml(formatTicketDateTime(ticket.deadlineAt) || "Не указан")}</div>
                <div><b>Клиент:</b> ${escapeHtml(ticket.client || "Не указан")}</div>
                <div><b>Инициатор:</b> ${escapeHtml(ticket.initiator || "Не указан")}</div>
            </div>
            ${ticket.topic ? `<div class="ticket-description"><b>Тема:</b> ${escapeHtml(ticket.topic)}</div>` : ""}
            ${ticket.problem ? `<div class="ticket-description"><b>Проблема:</b> ${escapeHtml(ticket.problem)}</div>` : ""}
            ${ticket.solution ? `<div class="ticket-description"><b>Решение:</b> ${escapeHtml(ticket.solution)}</div>` : ""}
        `;
        ticketsModalBody.appendChild(card);
    });

    ticketsModal.hidden = false;
}

function formatTicketDeadlineResult(ticket) {
    if (!ticket.deadlineAt) return "Не указан";
    if (ticket.deadlineResult === "on-time") return "В срок";
    if (ticket.deadlineResult === "overdue") return "Просрочено";
    return "Не оценён";
}

function closeTicketsDetailsModal() {
    ticketsModal.hidden = true;
    ticketsModalBody.innerHTML = "";
    activeTicketsModalContext = null;
    ticketsModalPdfBtn.disabled = true;
}

function exportTicketsCsv() {
    if (ticketAnalysisResult.length === 0) {
        showTicketStatus("Нет результатов для экспорта.", true);
        return;
    }
    const rows = [[
        "Исполнитель", "Обработано тикетов", "Общее время тикетов, минут", "Общее время тикетов",
        "Длительность, минут", "Длительность", "Фактическое время работ по нормативу, минут",
        "Фактическое время работ по нормативу", "Рабочих дней", "Норма часов по производственному календарю", "Фактически отработано часов",
        "% времени на тикеты", "Заявок с дедлайном", "В срок", "Просрочено", "% просроченных"
    ]];
    ticketAnalysisResult.forEach(item => rows.push([
        item.employee,
        item.completedCount,
        roundNumber(item.lifecycleMs / 60000),
        formatDuration(item.lifecycleMs),
        roundNumber(item.actualMs / 60000),
        formatDuration(item.actualMs),
        roundNumber(item.standardMs / 60000),
        formatDuration(item.standardMs),
        item.workDays,
        item.productionNormHours,
        item.workedHours,
        Number.isFinite(item.utilizationPercent) ? roundNumber(item.utilizationPercent * 100) : "",
        item.deadlineCount,
        item.onTimeCount,
        item.overdueCount,
        Number.isFinite(item.overduePercent) ? roundNumber(item.overduePercent * 100) : ""
    ]));
    downloadCsv(rows, "ticket_time_result.csv");
}

function downloadCsv(rows, filename) {
    const csv = rows.map(row => row.map(escapeCsvValue).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// ===============================
// ЗАЯВКИ: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===============================

function parseTicketDate(value) {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === "number" && value > 20000 && value < 100000) {
        const excelEpoch = Date.UTC(1899, 11, 30);
        const utcDate = new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
        return new Date(
            utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(),
            utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds(), utcDate.getUTCMilliseconds()
        );
    }
    const text = cleanText(value);
    const ruMatch = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:([+-]\d{2}:?\d{2}))?$/);
    if (ruMatch) {
        const [, day, month, year, hour, minute, second = "00"] = ruMatch;
        // Выгрузки 1С могут добавлять часовой пояс только к дедлайну, но не к истории.
        // Сравниваем все поля как локальное бизнес-время и не допускаем сдвиг на несколько часов.
        const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
        return isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
}

function parseNumberValue(value) {
    if (typeof value === "number") return value;
    if (value === null || value === undefined || value === "") return NaN;
    return Number(String(value).replace(/\s+/g, "").replace(",", "."));
}

function parseDateInputBoundary(value, endOfDay) {
    if (!value) return null;
    const parts = value.split("-").map(Number);
    if (parts.length !== 3) return null;
    return endOfDay
        ? new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
        : new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

function formatDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatTicketDateTime(date) {
    if (!date) return "";
    return date.toLocaleString("ru-RU", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
    });
}

function showTicketStatus(message, isError) {
    ticketLoadStatus.hidden = !message;
    ticketLoadStatus.textContent = message;
    ticketLoadStatus.classList.toggle("error", Boolean(isError));
}
