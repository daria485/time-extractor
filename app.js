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

const employeesPanel = document.getElementById("employeesPanel");
const employeesList = document.getElementById("employeesList");
const selectAllEmployeesBtn = document.getElementById("selectAllEmployeesBtn");
const clearEmployeesBtn = document.getElementById("clearEmployeesBtn");

const summary = document.getElementById("summary");
const resultsPanel = document.getElementById("resultsPanel");
const resultBody = document.getElementById("resultBody");

const totalDialogsEl = document.getElementById("totalDialogs");
const employeeDialogsEl = document.getElementById("employeeDialogs");
const employeeResponsesEl = document.getElementById("employeeResponses");
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
        const response = await fetch("https://time-extractor-proxy.onrender.com/api/dialogs", {
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
            "Не удалось загрузить данные из 1С через локальный прокси.\n\n" +
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
        textWrapper.className = "employee-info";

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
    const maxIntervalMinutes = Number(maxIntervalInput.value);
    const minMessageSeconds = Number(minMessageTimeInput.value);

    if (
        !Number.isFinite(maxIntervalMinutes) ||
        maxIntervalMinutes <= 0 ||
        maxIntervalMinutes > 120
    ) {
        alert("Максимальный активный интервал должен быть от 1 до 120 минут.");
        return;
    }

    if (
        !Number.isFinite(minMessageSeconds) ||
        minMessageSeconds < 0 ||
        minMessageSeconds > 300
    ) {
        alert("Минимальное время на ответ должно быть от 0 до 300 секунд.");
        return;
    }

    const maxIntervalMs = maxIntervalMinutes * 60 * 1000;
    const minResponseMs = minMessageSeconds * 1000;

    if (minResponseMs > maxIntervalMs) {
        alert(
            "Минимальное время на ответ не может быть больше максимального активного интервала."
        );
        return;
    }

    const employees = {};
    const allDialogs = rawData.Dialogs;

    let totalEmployeeResponses = 0;
    const dialogsWithEmployees = new Set();

    allDialogs.forEach((dialog, dialogIndex) => {
        if (!dialog.DialogContent || !Array.isArray(dialog.DialogContent)) {
            return;
        }

        const dialogId = dialog.DialogID || `Без ID — диалог ${dialogIndex + 1}`;
        const dialogLine = dialog.DialogLine || "";

        const messages = dialog.DialogContent
            .map(message => normalizeMessage(message))
            .filter(message => message.date)
            .sort((a, b) => a.date - b.date);

        const responseEvents = buildResponseEvents(
            messages,
            employeeCompany,
            minResponseMs,
            maxIntervalMs
        );

        responseEvents.forEach(event => {
            if (!event.isCounted) {
                return;
            }

            const employeeName =
                event.responseMessage.author || "Неизвестный сотрудник";

            if (!selectedEmployeesSet.has(employeeName)) {
                return;
            }

            if (!employees[employeeName]) {
                employees[employeeName] = {
                    employee: employeeName,
                    dialogs: new Set(),
                    responses: 0,
                    activeMs: 0,
                    lines: new Set(),
                    dialogIndexes: new Set(),
                    dialogStats: new Map()
                };
            }

            employees[employeeName].dialogs.add(dialogId);
            employees[employeeName].lines.add(dialogLine);
            employees[employeeName].dialogIndexes.add(dialogIndex);
            dialogsWithEmployees.add(dialogId);
            totalEmployeeResponses++;

            employees[employeeName].responses++;
            employees[employeeName].activeMs += event.activeMs;

            if (!employees[employeeName].dialogStats.has(dialogIndex)) {
                employees[employeeName].dialogStats.set(dialogIndex, {
                    responsesCount: 0,
                    activeMs: 0,
                    responseDates: []
                });
            }

            const dialogStat =
                employees[employeeName].dialogStats.get(dialogIndex);

            dialogStat.responsesCount++;
            dialogStat.activeMs += event.activeMs;
            dialogStat.responseDates.push(
                event.responseMessage.date.getTime()
            );
        });
    });

    analysisResult = Object.values(employees)
        .map(employee => {
            const dialogsCount = employee.dialogs.size;
            const responsesCount = employee.responses;
            const activeMs = employee.activeMs;

            return {
                employee: employee.employee,
                dialogsCount,
                responsesCount,
                activeMs,
                activeMinutes: activeMs / 1000 / 60,
                averagePerDialogMs: dialogsCount > 0 ? activeMs / dialogsCount : 0,
                averagePerResponseMs:
                    responsesCount > 0 ? activeMs / responsesCount : 0,
                lines: Array.from(employee.lines).filter(Boolean).join(", "),
                dialogIds: Array.from(employee.dialogs),
                dialogIndexes: Array.from(employee.dialogIndexes),
                dialogStats: Array.from(employee.dialogStats.entries())
                    .map(([dialogIndex, stat]) => ({
                        dialogIndex,
                        responsesCount: stat.responsesCount,
                        activeMs: stat.activeMs,
                        responseDates: stat.responseDates
                    }))
            };
        })
        .sort((a, b) => b.activeMs - a.activeMs);

    renderSummary({
        totalDialogs: allDialogs.length,
        employeeDialogs: dialogsWithEmployees.size,
        employeeResponses: totalEmployeeResponses,
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

function buildResponseEvents(
    messages,
    employeeCompany,
    minResponseMs,
    maxIntervalMs
) {
    const events = [];
    let lastClientMessage = null;

    messages
        .filter(message => !message.isSystem)
        .forEach(message => {
            const isEmployee = isEmployeeMessage(
                message,
                employeeCompany
            );

            if (!isEmployee) {
                // Последовательные сообщения 1-й линии образуют один вопрос.
                // Точка отсчёта — последнее сообщение перед ответом 2-й линии.
                lastClientMessage = message;
                return;
            }

            // Сообщения 2-й линии без предшествующего вопроса не учитываются.
            // После первого ответа следующие сообщения сотрудника также
            // не создают новые расчётные интервалы.
            if (!lastClientMessage) {
                return;
            }

            const responseDelayMs =
                message.date - lastClientMessage.date;

            const isValidDelay =
                responseDelayMs >= 0 &&
                responseDelayMs <= maxIntervalMs;

            events.push({
                clientMessage: lastClientMessage,
                responseMessage: message,
                responseDelayMs,
                isCounted: isValidDelay,
                activeMs: isValidDelay
                    ? Math.max(responseDelayMs, minResponseMs)
                    : 0
            });

            lastClientMessage = null;
        });

    return events;
}

// ===============================
// Отрисовка результата
// ===============================

function renderSummary(data) {
    totalDialogsEl.textContent = data.totalDialogs;
    employeeDialogsEl.textContent = data.employeeDialogs;
    employeeResponsesEl.textContent = data.employeeResponses;
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
            <td>${row.responsesCount}</td>
            <td>${formatDuration(row.activeMs)}</td>
            <td>${formatDuration(row.averagePerDialogMs)}</td>
            <td>${formatDuration(row.averagePerResponseMs)}</td>
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

    const employeeCompany =
        normalizeText(employeeCompanyInput.value);

    const employeeResult = analysisResult.find(
        item => item.employee === employeeName
    );

    if (!employeeResult) {
        alert(
            "Для сотрудника нет актуального результата. Повторно запустите расчёт."
        );
        return;
    }

    const dialogStatsByIndex = new Map(
        employeeResult.dialogStats.map(stat => [
            stat.dialogIndex,
            stat
        ])
    );

    const dialogs = rawData.Dialogs
        .map((dialog, dialogIndex) => ({
            dialog,
            dialogIndex
        }))
        .filter(item =>
            dialogStatsByIndex.has(item.dialogIndex)
        )
        .map(item => {
            const { dialog, dialogIndex } = item;
            const messages = Array.isArray(dialog.DialogContent)
                ? dialog.DialogContent
                    .map(message => normalizeMessage(message))
                    .filter(message => message.date)
                    .sort((a, b) => a.date - b.date)
                : [];

            const dialogStat =
                dialogStatsByIndex.get(dialogIndex);

            return {
                id:
                    dialog.DialogID ||
                    `Без ID — диалог ${dialogIndex + 1}`,
                author: dialog.DialogAuthor || "Автор не указан",
                line: dialog.DialogLine || "Линия не указана",
                messages,
                responsesCount: dialogStat.responsesCount,
                activeMs: dialogStat.activeMs,
                responseDates: new Set(dialogStat.responseDates)
            };
        })
        .sort((a, b) => {
            const firstDateA = a.messages[0]?.date || new Date(0);
            const firstDateB = b.messages[0]?.date || new Date(0);
            return firstDateA - firstDateB;
        });

    dialogsModalTitle.textContent = `Диалоги: ${employeeName}`;
    dialogsModalSubtitle.textContent =
        `${employeeResult.dialogsCount} диалогов, ` +
        `${employeeResult.responsesCount} учтённых ответов, ` +
        `${formatDuration(employeeResult.activeMs)}`;

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
            <div><b>Учтённых ответов сотрудника:</b> ${dialog.responsesCount}</div>
            <div><b>Расчётное время:</b> ${escapeHtml(formatDuration(dialog.activeMs))}</div>
        `;

        header.appendChild(title);
        header.appendChild(meta);

        const messagesList = document.createElement("div");
        messagesList.className = "messages-list";

        dialog.messages.forEach(message => {
            const role = getMessageRole(message, employeeCompany);
            const isCountedResponse = !message.isSystem &&
                message.author === employeeName &&
                isEmployeeMessage(message, employeeCompany) &&
                dialog.responseDates.has(message.date.getTime());

            const row = document.createElement("div");
            row.className = `message-row ${role.type === "system" ? "system-message" : ""}`;

            if (isCountedResponse) {
                row.classList.add("selected-employee-message");
            }

            const time = document.createElement("div");
            time.className = "message-time";
            time.textContent = formatDateTime(message.date);

            const author = document.createElement("div");
            author.className = "message-author";

            const roleBadge = document.createElement("span");
            roleBadge.className = `message-role ${role.className}`;
            roleBadge.textContent = isCountedResponse
                ? "Учтённый ответ"
                : role.label;

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
        "Учтённых ответов",
        "Активное время, минут",
        "Активное время",
        "Среднее на диалог, минут",
        "Среднее на ответ, минут",
        "Линии"
    ]);

    analysisResult.forEach(row => {
        rows.push([
            row.employee,
            row.dialogsCount,
            row.responsesCount,
            roundNumber(row.activeMinutes),
            formatDuration(row.activeMs),
            roundNumber(row.averagePerDialogMs / 1000 / 60),
            roundNumber(row.averagePerResponseMs / 1000 / 60),
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