// ===============================
// TIME EXTRACTOR
// \u0420\u0430\u0441\u0447\u0451\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0432 \u0447\u0430\u0442\u0430\u0445 1\u0421-\u041A\u043E\u043D\u043D\u0435\u043A\u0442
// ===============================

let rawData = null;
let analysisResult = [];
let detectedEmployees = [];

// ===============================
// \u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043B\u0438\u043D\u0438\u0439 1\u0421-\u041A\u043E\u043D\u043D\u0435\u043A\u0442
// ===============================

// ===============================
// \u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043B\u0438\u043D\u0438\u0439 \u0410\u043B\u044C\u0442\u0430\u043F
// ===============================

const CONNECT_LINES = [
    {
        id: "ca1744da-5079-11ed-9bb6-00505601495b",
        name: "! \u0410\u041B\u042C\u0422\u0410\u041F: \u041B\u041A"
    },
    {
        id: "b4da4d40-2978-11ef-9ef5-00505601495b",
        name: "ALTAPP \u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F"
    },
    {
        id: "2e6c5d29-bb84-11e6-80e3-0025904f970d",
        name: "ALTAPP \u041A\u043B\u0438\u0435\u043D\u0442\u0430\u043C"
    },
    {
        id: "65fe7282-bb83-11e6-80e3-0025904f970d",
        name: "ALTAPP \u041F\u0430\u0440\u0442\u043D\u0435\u0440\u0430\u043C"
    },
    {
        id: "c07f2a30-8f9e-11ef-887c-00505601495b",
        name: "ALTAPP \u0424\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 1\u0421 (1)"
    },
    {
        id: "8abecf72-a8cb-11ef-9815-00505601495b",
        name: "ALTAPP \u0424\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 1\u0421 (2)"
    },
    {
        id: "cdf56de4-f8fa-11ef-9819-00505601495b",
        name: "ALTAPP \u0411\u0443\u0445\u0433\u0430\u043B\u0442\u0435\u0440\u0438\u044F"
    },
    {
        id: "c45ec0e4-dcd1-11f0-98e9-00505601495b",
        name: "ALTAPP \u043F\u043E \u0440\u0430\u0431\u043E\u0442\u0435 \u0432 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430\u0445 1\u0421"
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
        alert("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0434\u0438\u0430\u043B\u043E\u0433\u043E\u0432.");
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
// \u0417\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u0441\u043F\u0438\u0441\u043A\u0430 \u043B\u0438\u043D\u0438\u0439
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

    const defaultLine = CONNECT_LINES.find(line => line.name === "ALTAPP \u041F\u0430\u0440\u0442\u043D\u0435\u0440\u0430\u043C");

    if (defaultLine) {
        dialogLineInput.value = defaultLine.id;
    }
}

// ===============================
// \u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0434\u0430\u043D\u043D\u044B\u0445
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
// \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0444\u0430\u0439\u043B\u0430
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
            setRawData(parsedData, "\u0424\u0430\u0439\u043B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D. \u041C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0438\u0440\u0430\u0442\u044C \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u0440\u0430\u0441\u0447\u0451\u0442.");
        } catch (error) {
            alert("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C JSON-\u0444\u0430\u0439\u043B. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435, \u0447\u0442\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u0430\u044F \u0432\u044B\u0433\u0440\u0443\u0437\u043A\u0430.");
            resetData();
        }
    };

    reader.readAsText(file, "UTF-8");
}

// ===============================
// HTTP-\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u0437 1\u0421 \u0447\u0435\u0440\u0435\u0437 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 proxy
// ===============================

async function loadDataByHttp() {
    const apiUrl = cleanText(apiUrlInput.value);
    const dateFrom = dateFromInput.value;
    const dateTo = dateToInput.value;
    const lineId = cleanText(dialogLineInput.value);
    const login = cleanText(apiLoginInput.value);
    const password = apiPasswordInput.value;

    if (!apiUrl) {
        alert("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 URL HTTP-\u0441\u0435\u0440\u0432\u0438\u0441\u0430.");
        return;
    }

    if (!dateFrom || !dateTo) {
        alert("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043F\u0435\u0440\u0438\u043E\u0434: \u0434\u0430\u0442\u0443 \u0441 \u0438 \u0434\u0430\u0442\u0443 \u043F\u043E.");
        return;
    }

    if (!lineId) {
        alert("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043B\u0438\u043D\u0438\u044E.");
        return;
    }

    if (!login || !password) {
        alert("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043B\u043E\u0433\u0438\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C \u0434\u043B\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A HTTP-\u0441\u0435\u0440\u0432\u0438\u0441\u0443 1\u0421.");
        return;
    }

    loadHttpBtn.disabled = true;
    loadHttpBtn.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044E \u0434\u0430\u043D\u043D\u044B\u0435...";

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

        setRawData(data, "\u0414\u0430\u043D\u043D\u044B\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B \u0438\u0437 1\u0421. \u041C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0438\u0440\u0430\u0442\u044C \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u0440\u0430\u0441\u0447\u0451\u0442.");

    } catch (error) {
        console.error(error);

        alert(
            "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 1\u0421 \u0447\u0435\u0440\u0435\u0437 \u0441\u0435\u0440\u0432\u0435\u0440 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F.\n\n" +
            "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435:\n" +
            "1. \u0417\u0430\u043F\u0443\u0449\u0435\u043D \u043B\u0438 server.js \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439 node server.js.\n" +
            "2. \u0412\u0435\u0440\u043D\u044B\u0439 \u043B\u0438 URL HTTP-\u0441\u0435\u0440\u0432\u0438\u0441\u0430.\n" +
            "3. \u0412\u0435\u0440\u043D\u044B\u0435 \u043B\u0438 \u043B\u043E\u0433\u0438\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C.\n" +
            "4. \u0412\u0435\u0440\u043D\u043E \u043B\u0438 \u0432\u044B\u0431\u0440\u0430\u043D\u044B \u043F\u0435\u0440\u0438\u043E\u0434 \u0438 \u043B\u0438\u043D\u0438\u044F.\n\n" +
            "\u0422\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430: " + error.message
        );
    } finally {
        loadHttpBtn.disabled = false;
        loadHttpBtn.textContent = "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 1\u0421";
    }
}

// ===============================
// \u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445
// ===============================

function setRawData(data, successMessage) {
    if (!data || !data.Dialogs || !Array.isArray(data.Dialogs)) {
        alert("\u0414\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u044B, \u043D\u043E \u043C\u0430\u0441\u0441\u0438\u0432 Dialogs \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0444\u043E\u0440\u043C\u0430\u0442 \u043E\u0442\u0432\u0435\u0442\u0430.");
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
// \u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432
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
            employee.dialogs.add(dialog.DialogID || "\u0411\u0435\u0437 ID");
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
        empty.textContent = "\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u043B\u0435 \u00AB\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432\u00BB.";
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
        stats.textContent = `${employee.dialogsCount} \u0434\u0438\u0430\u043B\u043E\u0433\u043E\u0432, ${employee.messages} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439`;

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
// \u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0430\u043D\u0430\u043B\u0438\u0437
// ===============================

function runAnalysis() {
    if (!rawData || !rawData.Dialogs) {
        alert("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 JSON-\u0444\u0430\u0439\u043B \u0438\u043B\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 1\u0421.");
        return;
    }

    const selectedEmployees = getSelectedEmployees();

    if (selectedEmployees.length === 0) {
        alert("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E\u0433\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430 \u0434\u043B\u044F \u0440\u0430\u0441\u0447\u0451\u0442\u0430.");
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

        const dialogId = dialog.DialogID || "\u0411\u0435\u0437 ID";
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

            const employeeName = currentMessage.author || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A";

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
// \u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439
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
            message.text.toLowerCase().includes("\u043D\u0430\u0447\u0430\u043B\u043E \u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u044F");
    });

    if (!startMessage) {
        return false;
    }

    const text = startMessage.text.toLowerCase();

    return text.includes("\u0438\u043D\u0438\u0446\u0438\u0430\u0442\u043E\u0440 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442");
}

// ===============================
// \u041E\u0442\u0440\u0438\u0441\u043E\u0432\u043A\u0430 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430
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
            <td colspan="7">\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0440\u0430\u0441\u0447\u0451\u0442\u0430. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432 \u0438 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432.</td>
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
                    \u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0434\u0438\u0430\u043B\u043E\u0433\u0438
                </button>
            </td>
        `;

        resultBody.appendChild(tr);
    });
}

function formatDuration(ms) {
    if (!ms || ms <= 0) {
        return "0 \u043C\u0438\u043D";
    }

    const totalSeconds = Math.round(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours} \u0447 ${minutes} \u043C\u0438\u043D`;
    }

    if (minutes > 0) {
        return `${minutes} \u043C\u0438\u043D ${seconds} \u0441\u0435\u043A`;
    }

    return `${seconds} \u0441\u0435\u043A`;
}

// ===============================
// \u0427\u0438\u0442\u0430\u0431\u0435\u043B\u044C\u043D\u044B\u0435 \u0434\u0438\u0430\u043B\u043E\u0433\u0438
// ===============================

function openReadableDialogsModal(employeeName) {
    if (!rawData || !rawData.Dialogs) {
        alert("\u0414\u0430\u043D\u043D\u044B\u0435 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B.");
        return;
    }

    if (!dialogsModal || !dialogsModalBody) {
        alert("\u041C\u043E\u0434\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u043A\u043D\u043E \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0434\u0438\u0430\u043B\u043E\u0433\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0432 index.html.");
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
                id: dialog.DialogID || "\u0411\u0435\u0437 ID",
                author: dialog.DialogAuthor || "\u0410\u0432\u0442\u043E\u0440 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D",
                line: dialog.DialogLine || "\u041B\u0438\u043D\u0438\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430",
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

    dialogsModalTitle.textContent = `\u0414\u0438\u0430\u043B\u043E\u0433\u0438: ${employeeName}`;
    dialogsModalSubtitle.textContent = `${dialogs.length} \u0434\u0438\u0430\u043B\u043E\u0433\u043E\u0432, ${employeeMessagesTotal} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430`;

    dialogsModalBody.innerHTML = "";

    if (dialogs.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "\u0414\u0438\u0430\u043B\u043E\u0433\u0438 \u0434\u043B\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B.";
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
        title.textContent = `\u0414\u0438\u0430\u043B\u043E\u0433 ${index + 1}`;

        const meta = document.createElement("div");
        meta.className = "dialog-meta";
        meta.innerHTML = `
            <div><b>ID:</b> ${escapeHtml(dialog.id)}</div>
            <div><b>\u041B\u0438\u043D\u0438\u044F:</b> ${escapeHtml(dialog.line)}</div>
            <div><b>\u0410\u0432\u0442\u043E\u0440 \u0434\u0438\u0430\u043B\u043E\u0433\u0430:</b> ${escapeHtml(dialog.author)}</div>
            <div><b>\u041F\u0435\u0440\u0438\u043E\u0434 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439:</b> ${escapeHtml(getDialogPeriodText(dialog.messages))}</div>
            <div><b>\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430 \u0432 \u044D\u0442\u043E\u043C \u0434\u0438\u0430\u043B\u043E\u0433\u0435:</b> ${dialog.employeeMessagesCount}</div>
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
            roleBadge.textContent = isSelectedEmployeeMessage ? "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A" : role.label;

            const authorName = document.createElement("span");
            authorName.className = "author-name";
            authorName.textContent = message.author || "\u0410\u0432\u0442\u043E\u0440 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D";

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
            label: "\u0421\u0438\u0441\u0442\u0435\u043C\u0430",
            className: "role-system"
        };
    }

    if (isEmployeeMessage(message, employeeCompany)) {
        return {
            type: "employee",
            label: "\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A",
            className: "role-employee"
        };
    }

    return {
        type: "client",
        label: "\u041F\u0430\u0440\u0442\u043D\u0451\u0440 / \u043A\u043B\u0438\u0435\u043D\u0442",
        className: "role-client"
    };
}

function getDialogPeriodText(messages) {
    if (!messages || messages.length === 0) {
        return "\u043D\u0435\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439";
    }

    const first = messages[0].date;
    const last = messages[messages.length - 1].date;

    if (!first || !last) {
        return "\u043D\u0435\u0442 \u0434\u0430\u0442";
    }

    if (first.getTime() === last.getTime()) {
        return formatDateTime(first);
    }

    return `${formatDateTime(first)} \u2014 ${formatDateTime(last)}`;
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
// \u042D\u043A\u0441\u043F\u043E\u0440\u0442 CSV
// ===============================

function exportCsv() {
    if (!analysisResult || analysisResult.length === 0) {
        alert("\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430.");
        return;
    }

    const rows = [];

    rows.push([
        "\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A",
        "\u0414\u0438\u0430\u043B\u043E\u0433\u043E\u0432",
        "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439",
        "\u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F, \u043C\u0438\u043D\u0443\u0442",
        "\u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F",
        "\u0421\u0440\u0435\u0434\u043D\u0435\u0435 \u043D\u0430 \u0434\u0438\u0430\u043B\u043E\u0433, \u043C\u0438\u043D\u0443\u0442",
        "\u0421\u0440\u0435\u0434\u043D\u0435\u0435 \u043D\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435, \u043C\u0438\u043D\u0443\u0442",
        "\u041B\u0438\u043D\u0438\u0438"
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
// \u041E\u0421\u041D\u041E\u0412\u041D\u042B\u0415 \u0412\u041A\u041B\u0410\u0414\u041A\u0418
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
// \u0417\u0410\u042F\u0412\u041A\u0418: \u0421\u041F\u0420\u0410\u0412\u041E\u0427\u041D\u0418\u041A \u041D\u041E\u0420\u041C\u0410\u0422\u0418\u0412\u041E\u0412
// ===============================

const DEFAULT_TICKET_CATEGORIES = [
    { key: "client_database_import_export", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0438\u043B\u0438 \u0432\u044B\u0433\u0440\u0443\u0437\u043A\u0438 \u0431\u0430\u0437\u044B (\u0440\u0443\u0447\u043D\u043E\u0435)", names: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0438\u043B\u0438 \u0432\u044B\u0433\u0440\u0443\u0437\u043A\u0438 \u0431\u0430\u0437\u044B (\u0440\u0443\u0447\u043D\u043E\u0435) | \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0431\u0430\u0437\u044B | \u0412\u044B\u0433\u0440\u0443\u0437\u043A\u0430 \u0431\u0430\u0437\u044B", minutes: 60 },
    { key: "client_database_update", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0431\u0430\u0437\u044B (\u0440\u0443\u0447\u043D\u043E\u0435)", names: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0431\u0430\u0437\u044B (\u0440\u0443\u0447\u043D\u043E\u0435) | \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044E | \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438", minutes: 60 },
    { key: "client_background_tasks", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435\u043C \u0417\u041C, \u0417\u041E \u0438\u043B\u0438 \u041F\u0435\u0440\u0435\u043D\u043E\u0441\u0430 \u0431\u0430\u0437", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435\u043C \u0417\u041C, \u0417\u041E \u0438\u043B\u0438 \u041F\u0435\u0440\u0435\u043D\u043E\u0441\u0430 \u0431\u0430\u0437", minutes: 15 },
    { key: "client_database_problem", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0432 \u0431\u0430\u0437\u0435 1\u0421", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0432 \u0431\u0430\u0437\u0435 1\u0421 | \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 \u0431\u0430\u0437\u0435", minutes: 30 },
    { key: "client_database_login", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441\u043E \u0432\u0445\u043E\u0434\u043E\u043C \u0432 \u0431\u0430\u0437\u0443 1\u0421", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441\u043E \u0432\u0445\u043E\u0434\u043E\u043C \u0432 \u0431\u0430\u0437\u0443 1\u0421 | \u041D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0431\u0430\u0437\u044B", minutes: 15 },
    { key: "client_exchange_transport", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u043E\u043C \u043E\u0431\u043C\u0435\u043D\u0430 \u043C\u0435\u0436\u0434\u0443 \u0431\u0430\u0437\u0430\u043C\u0438 1\u0421", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u043E\u043C \u043E\u0431\u043C\u0435\u043D\u0430 \u043C\u0435\u0436\u0434\u0443 \u0431\u0430\u0437\u0430\u043C\u0438 1\u0421 | \u041F\u0440\u043E\u043B\u0435\u043C\u0430 \u0441 \u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u043E\u043C \u043E\u0431\u043C\u0435\u043D\u0430 \u043C\u0435\u0436\u0434\u0443 \u0431\u0430\u0437\u0430\u043C\u0438 1\u0421", minutes: 30 },
    { key: "client_industry_licenses", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u043E\u0442\u0440\u0430\u0441\u043B\u0435\u0432\u044B\u043C\u0438 \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u044F\u043C\u0438 (\u0421\u041B\u041A, \u0420\u0430\u0440\u0443\u0441, \u0411\u0438\u0442 \u0438 \u043F\u0440.)", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u043E\u0442\u0440\u0430\u0441\u043B\u0435\u0432\u044B\u043C\u0438 \u043B\u0438\u0446\u0435\u043D\u0437\u0438\u044F\u043C\u0438 (\u0421\u041B\u041A, \u0420\u0430\u0440\u0443\u0441, \u0411\u0438\u0442 \u0438 \u043F\u0440.)", minutes: 15 },
    { key: "client_remote_desktop", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0443\u0434\u0430\u043B\u0435\u043D\u043D\u044B\u043C \u0440\u0430\u0431\u043E\u0447\u0438\u043C \u0441\u0442\u043E\u043B\u043E\u043C (RDS, \u0410\u043B\u044C\u0442\u0420\u0414)", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0443\u0434\u0430\u043B\u0435\u043D\u043D\u044B\u043C \u0440\u0430\u0431\u043E\u0447\u0438\u043C \u0441\u0442\u043E\u043B\u043E\u043C (RDS, \u0410\u043B\u044C\u0442\u0420\u0414)", minutes: 30 },
    { key: "client_publication", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 \u0431\u0430\u0437\u044B (\u0440\u0443\u0447\u043D\u043E\u0435)", names: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 \u0431\u0430\u0437\u044B (\u0440\u0443\u0447\u043D\u043E\u0435)", minutes: 30 },
    { key: "client_access", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u041F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 / \u0441\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F (RDS, FTP)", names: "\u041F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 / \u0441\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F (RDS, FTP) | \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F RDS | \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u0432\u0430\u0442\u0435\u043B\u044F RDS", minutes: 15 },
    { key: "client_release", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0433\u043E \u0440\u0435\u043B\u0438\u0437\u0430 \u0432 \u0423\u0421", names: "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0433\u043E \u0440\u0435\u043B\u0438\u0437\u0430 \u0432 \u0423\u0421 | \u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u0441\u0443\u0442\u0441\u0432\u0443\u044E\u0449\u0435\u0433\u043E \u0440\u0435\u043B\u0438\u0437\u0430 \u0432 \u0423\u0421", minutes: 15 },
    { key: "client_consultation", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u041A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u044F \u043F\u043E \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u0432\u043E\u043F\u0440\u043E\u0441\u0430\u043C", names: "\u041A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u044F \u043F\u043E \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u0432\u043E\u043F\u0440\u043E\u0441\u0430\u043C | \u041A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u044F", minutes: 30 },
    { key: "client_other", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043E\u043F\u0440\u043E\u0441\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)", name: "\u0414\u0440\u0443\u0433\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430", names: "\u0414\u0440\u0443\u0433\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430 | \u0414\u0440\u0443\u0433\u043E\u0435", minutes: 15 },
    { key: "internal_access", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B)", name: "\u041F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 / \u0441\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F", names: "\u041F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 / \u0441\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F | \u0421\u043C\u0435\u043D\u0430 \u043F\u0430\u0440\u043E\u043B\u044F", minutes: 15 },
    { key: "internal_equipment", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u043D\u0430 \u0440\u0430\u0431\u043E\u0447\u0435\u043C \u043C\u0435\u0441\u0442\u0435", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u043D\u0430 \u0440\u0430\u0431\u043E\u0447\u0435\u043C \u043C\u0435\u0441\u0442\u0435 | \u041E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435 \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u043C\u0435\u0441\u0442\u0430 | \u0420\u0430\u0431\u043E\u0447\u0435\u0435 \u043C\u0435\u0441\u0442\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430", minutes: 15 },
    { key: "internal_telephony", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0438\u0435\u0439 \u043D\u0430 \u0440\u0430\u0431\u043E\u0447\u0435\u043C \u043C\u0435\u0441\u0442\u0435", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0438\u0435\u0439 \u043D\u0430 \u0440\u0430\u0431\u043E\u0447\u0435\u043C \u043C\u0435\u0441\u0442\u0435 | \u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0438\u0435\u0439", minutes: 15 },
    { key: "internal_network", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0441\u0435\u0442\u0435\u0432\u044B\u043C \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u0438\u043B\u0438 \u043E\u0440\u0433\u0442\u0435\u0445\u043D\u0438\u043A\u043E\u0439", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441 \u0441\u0435\u0442\u0435\u0432\u044B\u043C \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435\u043C \u0438\u043B\u0438 \u043E\u0440\u0433\u0442\u0435\u0445\u043D\u0438\u043A\u043E\u0439 | \u0421\u0435\u0442\u0435\u0432\u044B\u0435 \u0438 \u0441\u0435\u0440\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B | \u041E\u0440\u0433\u0442\u0435\u0445\u043D\u0438\u043A\u0430", minutes: 15 },
    { key: "internal_external_service", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B)", name: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441\u043E \u0441\u0442\u043E\u0440\u043E\u043D\u043D\u0438\u043C \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u043C (\u0418\u043D\u0442\u0435\u0440\u043D\u0435\u0442, \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0438\u044F, \u0441\u0435\u0440\u0432\u0438\u0441\u044B \u043F\u043E\u0434\u0440\u044F\u0434\u0447\u0438\u043A\u043E\u0432 \u0438 \u043F\u0440.)", names: "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430 \u0441\u043E \u0441\u0442\u043E\u0440\u043E\u043D\u043D\u0438\u043C \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u043C (\u0418\u043D\u0442\u0435\u0440\u043D\u0435\u0442, \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0438\u044F, \u0441\u0435\u0440\u0432\u0438\u0441\u044B \u043F\u043E\u0434\u0440\u044F\u0434\u0447\u0438\u043A\u043E\u0432 \u0438 \u043F\u0440.)", minutes: 60 },
    { key: "internal_workplace", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B)", name: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043D\u043E\u0432\u043E\u0433\u043E \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u043C\u0435\u0441\u0442\u0430", names: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043D\u043E\u0432\u043E\u0433\u043E \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u043C\u0435\u0441\u0442\u0430 | \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A \u0440\u0430\u0431\u043E\u0447\u0435\u0439 \u0441\u0440\u0435\u0434\u0435 \u043D\u043E\u0432\u043E\u0433\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430", minutes: 120 },
    { key: "internal_other", group: "2 \u043B\u0438\u043D\u0438\u044F (\u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B)", name: "\u0414\u0440\u0443\u0433\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430", names: "\u0414\u0440\u0443\u0433\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430 | \u0414\u0440\u0443\u0433\u043E\u0435", minutes: 15 }
];

const TICKET_CATEGORIES_STORAGE_KEY = "timeExtractor.ticketCategories.v2";
let ticketCategories = loadTicketCategories();

// ===============================
// \u0417\u0410\u042F\u0412\u041A\u0418: \u041F\u0420\u041E\u0418\u0417\u0412\u041E\u0414\u0421\u0422\u0412\u0415\u041D\u041D\u042B\u0419 \u041A\u0410\u041B\u0415\u041D\u0414\u0410\u0420\u042C \u0420\u0424
// ===============================

// \u041F\u044F\u0442\u0438\u0434\u043D\u0435\u0432\u043D\u0430\u044F 40-\u0447\u0430\u0441\u043E\u0432\u0430\u044F \u0440\u0430\u0431\u043E\u0447\u0430\u044F \u043D\u0435\u0434\u0435\u043B\u044F.
// 2026: \u041F\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u041F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u0430 \u0420\u0424 \u043E\u0442 24.09.2025 \u2116 1466.
// \u0421\u043E\u043A\u0440\u0430\u0449\u0435\u043D\u0438\u0435 \u043F\u0440\u0435\u0434\u043F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u043E\u0433\u043E \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u0434\u043D\u044F \u043D\u0430 1 \u0447\u0430\u0441 \u2014 \u0441\u0442. 95 \u0422\u041A \u0420\u0424.
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
// \u0417\u0410\u042F\u0412\u041A\u0418: \u0421\u041E\u0421\u0422\u041E\u042F\u041D\u0418\u0415 \u0418 DOM
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
const exportTicketsCategoriesBtn = document.getElementById("exportTicketsCategoriesBtn");
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
    exportTicketsCategoriesBtn.addEventListener("click", exportTicketsExcelWithCategories);
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
            ? `\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E \u0437\u0430\u044F\u0432\u043E\u043A: ${ticketDatasets[source].length}. \u0421\u043E\u0431\u044B\u0442\u0438\u0439 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432: ${ticketHistoryDatasets[source].length}.`
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
    const defaultLine = CONNECT_LINES.find(line => line.name === "ALTAPP \u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F");
    if (defaultLine) {
        ticketHttpLine.value = defaultLine.id;
    }
}

// ===============================
// \u0417\u0410\u042F\u0412\u041A\u0418: \u0417\u0410\u0413\u0420\u0423\u0417\u041A\u0410 \u0424\u0410\u0419\u041B\u0410
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
        showTicketStatus(`\u0424\u0430\u0439\u043B \u00AB${file.name}\u00BB \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D. \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0437\u0430\u044F\u0432\u043E\u043A: ${ticketDatasets.file.length}. \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0441\u043C\u0435\u043D\u044B \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u0438 \u0443\u043A\u0430\u0436\u0438\u0442\u0435 \u043E\u0442\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0435 \u0447\u0430\u0441\u044B.`, false);
    } catch (error) {
        console.error(error);
        ticketDatasets.file = [];
        analyzeTicketsBtn.disabled = true;
        showTicketStatus("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0444\u0430\u0439\u043B: " + error.message, true);
    }
}

async function handleTicketHistoryFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const rows = await readTabularFile(file, data => extractStatusHistoryRows(data, true), "history");
        setTicketHistoryDataset("file", rows);
        showTicketStatus(`\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u00AB${file.name}\u00BB \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430. \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0441\u043E\u0431\u044B\u0442\u0438\u0439: ${ticketHistoryDatasets.file.length}.`, false);
        resetTicketResults();
    } catch (error) {
        console.error(error);
        ticketHistoryDatasets.file = [];
        showTicketStatus("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432: " + error.message, true);
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
                ? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0439\u0442\u0438 \u0441\u0442\u0440\u043E\u043A\u0443 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u043E\u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432. \u041D\u0443\u0436\u043D\u044B \u043F\u043E\u043B\u044F \u00AB\u041F\u0435\u0440\u0438\u043E\u0434\u00BB, ID/\u043D\u043E\u043C\u0435\u0440 \u0437\u0430\u044F\u0432\u043A\u0438 \u0438 \u043D\u043E\u0432\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441."
                : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0439\u0442\u0438 \u0441\u0442\u0440\u043E\u043A\u0443 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u043E\u0432 \u0437\u0430\u044F\u0432\u043E\u043A. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 Excel-\u0444\u0430\u0439\u043B\u0430."
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
            .map(value => normalizeText(value).replaceAll("\u0451", "\u0435"))
            .filter(Boolean);

        if (values.length === 0) continue;

        const hasAny = variants => variants.some(variant => values.includes(normalizeText(variant).replaceAll("\u0451", "\u0435")));

        if (tableKind === "history") {
            const hasPeriod = hasAny(["\u041F\u0435\u0440\u0438\u043E\u0434", "\u0414\u0430\u0442\u0430", "\u0414\u0430\u0442\u0430 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F"]);
            const hasTicketLink = hasAny(["\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "ID \u0437\u0430\u044F\u0432\u043A\u0438", "Id \u0437\u0430\u044F\u0432\u043A\u0438", "\u2116 \u0437\u0430\u044F\u0432\u043A\u0438", "\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "TicketID", "ticketId"]);
            const hasNewStatus = hasAny(["\u041D\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435", "\u041D\u043E\u0432\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441", "NewStatus", "newStatus"]);
            if (hasPeriod && hasTicketLink && hasNewStatus) return index;
            continue;
        }

        if (tableKind === "tickets") {
            const hasCreated = hasAny(["\u0412\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F", "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F", "CreatedAt", "createdAt"]);
            const hasEmployee = hasAny(["\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C", "Assignee", "Employee", "responsible"]);
            const hasIdentity = hasAny(["\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "ID \u0437\u0430\u044F\u0432\u043A\u0438", "\u2116 \u0437\u0430\u044F\u0432\u043A\u0438", "\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "TicketID", "ticketId"]);
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
            "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443 \u0434\u043B\u044F \u0447\u0442\u0435\u043D\u0438\u044F Excel. " +
            "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443 \u0438\u043B\u0438 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0447\u0435\u0440\u0435\u0437 npm start."
        );
    }

    if (typeof XLSX === "undefined") {
        xlsxLibraryLoadingPromise = null;
        throw new Error(
            "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 Excel \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0430\u0441\u044C \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E. \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443."
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
        script.onerror = () => reject(new Error(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C ${src}`));
        document.head.appendChild(script);
    });
}

function populateTicketFileFilters(tickets) {
    const lines = Array.from(new Set(tickets.map(ticket => ticket.line).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "ru"));

    ticketFileLine.innerHTML = '<option value="">\u0412\u0441\u0435 \u043B\u0438\u043D\u0438\u0438</option>';
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
// \u0417\u0410\u042F\u0412\u041A\u0418: HTTP
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
        showTicketStatus("\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 URL, \u043F\u0435\u0440\u0438\u043E\u0434, \u043B\u0438\u043D\u0438\u044E, \u043B\u043E\u0433\u0438\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C.", true);
        return;
    }
    if (dateFrom > dateTo) {
        showTicketStatus("\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0435\u0440\u0438\u043E\u0434\u0430 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u0434\u0430\u0442\u044B \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F.", true);
        return;
    }

    loadTicketsHttpBtn.disabled = true;
    loadTicketsHttpBtn.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044E \u0437\u0430\u044F\u0432\u043A\u0438...";
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
        showTicketStatus(`\u0414\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B. \u0417\u0430\u044F\u0432\u043E\u043A: ${ticketDatasets.http.length}. \u0421\u043E\u0431\u044B\u0442\u0438\u0439 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432: ${ticketHistoryDatasets.http.length}. \u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043E\u0442\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0435 \u0447\u0430\u0441\u044B \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432.`, false);
    } catch (error) {
        console.error(error);
        ticketDatasets.http = [];
        ticketHistoryDatasets.http = [];
        analyzeTicketsBtn.disabled = true;
        showTicketStatus("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0438: " + error.message, true);
    } finally {
        loadTicketsHttpBtn.disabled = false;
        loadTicketsHttpBtn.textContent = "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0438";
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
        throw new Error("\u0412 \u043E\u0442\u0432\u0435\u0442\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043C\u0430\u0441\u0441\u0438\u0432 \u0437\u0430\u044F\u0432\u043E\u043A.");
    }
    const candidateKeys = ["Tickets", "tickets", "Data", "data", "items", "Items", "\u0417\u0430\u044F\u0432\u043A\u0438"];
    for (const key of candidateKeys) {
        if (Array.isArray(data[key])) {
            return data[key];
        }
    }
    throw new Error("\u041E\u0436\u0438\u0434\u0430\u043B\u0441\u044F \u043C\u0430\u0441\u0441\u0438\u0432 \u0437\u0430\u044F\u0432\u043E\u043A \u0438\u043B\u0438 \u043E\u0431\u044A\u0435\u043A\u0442 \u0441 \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C Tickets, Data \u043B\u0438\u0431\u043E items.");
}

function extractStatusHistoryRows(data, required) {
    if (Array.isArray(data)) {
        const looksLikeHistory = data.some(row => getTicketValue(row || {}, ["\u041D\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435", "\u041D\u043E\u0432\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441", "newStatus", "NewStatus"]) !== null);
        if (looksLikeHistory || required) return data;
        return [];
    }
    if (data && typeof data === "object") {
        const candidateKeys = ["StatusHistory", "statusHistory", "History", "history", "Events", "events", "\u0418\u0441\u0442\u043E\u0440\u0438\u044F\u0421\u0442\u0430\u0442\u0443\u0441\u043E\u0432"];
        for (const key of candidateKeys) {
            if (Array.isArray(data[key])) return data[key];
        }
    }
    if (required) {
        throw new Error("\u0412 \u043E\u0442\u0432\u0435\u0442\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043C\u0430\u0441\u0441\u0438\u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0441\u043C\u0435\u043D\u044B \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432.");
    }
    return [];
}

function setTicketDataset(source, rows) {
    if (!Array.isArray(rows)) {
        throw new Error("\u0414\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u044F\u0432\u043E\u043A \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C.");
    }
    const normalized = rows
        .map((row, index) => normalizeTicket(row, index))
        .filter(ticket => ticket.id || ticket.number || ticket.createdAt || ticket.employee);
    if (normalized.length === 0) {
        throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0442\u044C \u043D\u0438 \u043E\u0434\u043D\u043E\u0439 \u0437\u0430\u044F\u0432\u043A\u0438. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0438 \u0441\u0442\u043E\u043B\u0431\u0446\u043E\u0432.");
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
        throw new Error("\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C.");
    }

    const normalized = rows
        .map(normalizeTicketStatusEvent)
        .filter(event => (event.ticketId || event.ticketNumber) && event.period && event.newStatus);

    if (rows.length > 0 && normalized.length === 0) {
        throw new Error(
            "\u0424\u0430\u0439\u043B \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D, \u043D\u043E \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u0441\u043C\u0435\u043D\u044B \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u043D\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u044B. " +
            "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043D\u0430\u043B\u0438\u0447\u0438\u0435 \u0441\u0442\u043E\u043B\u0431\u0446\u043E\u0432 \u00AB\u041F\u0435\u0440\u0438\u043E\u0434\u00BB, \u00ABID \u0437\u0430\u044F\u0432\u043A\u0438\u00BB \u0438\u043B\u0438 \u00AB\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u044F\u0432\u043A\u0438\u00BB, \u00AB\u041D\u043E\u0432\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441\u00BB \u0438\u043B\u0438 \u00AB\u041D\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435\u00BB."
        );
    }

    ticketHistoryDatasets[source] = normalized;
}

function normalizeTicketStatusEvent(row) {
    return {
        period: parseTicketDate(getTicketValue(row, ["\u041F\u0435\u0440\u0438\u043E\u0434", "period", "Period", "date", "Date", "eventDate"])),
        ticketId: cleanText(getTicketValue(row, ["\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "ID \u0437\u0430\u044F\u0432\u043A\u0438", "Id \u0437\u0430\u044F\u0432\u043A\u0438", "ticketId", "TicketID", "id", "ID"])),
        ticketNumber: cleanText(getTicketValue(row, ["\u2116 \u0437\u0430\u044F\u0432\u043A\u0438", "\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "ticketNumber", "TicketNumber", "number", "Number"])),
        object: cleanText(getTicketValue(row, ["\u041E\u0431\u044A\u0435\u043A\u0442 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F", "object", "Object", "field", "Field"])),
        oldStatus: cleanText(getTicketValue(row, ["\u0421\u0442\u0430\u0440\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435", "\u0421\u0442\u0430\u0440\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441", "oldStatus", "OldStatus", "oldValue"])),
        newStatus: cleanText(getTicketValue(row, ["\u041D\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435", "\u041D\u043E\u0432\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441", "newStatus", "NewStatus", "newValue"])),
        author: cleanText(getTicketValue(row, ["\u0410\u0432\u0442\u043E\u0440", "\u0410\u0432\u0442\u043E\u0440 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F", "author", "Author"]))
    };
}

function normalizeTicket(row, index) {
    const createdValue = getTicketValue(row, ["\u0412\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F", "createdAt", "CreatedAt", "creationDate", "dateCreated"]);
    const deadlineValue = getTicketValue(row, ["\u0421\u0440\u043E\u043A \u0437\u0430\u044F\u0432\u043A\u0438", "deadline", "Deadline", "dueDate", "DueDate"]);
    const actualValue = getTicketValue(row, ["\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u044B (\u0441\u0435\u043A)", "durationSeconds", "DurationSeconds", "workDuration", "resolutionTime"]);
    const actualSeconds = parseNumberValue(actualValue);
    const completedValue = getTicketValue(row, ["\u0412\u0440\u0435\u043C\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F", "\u0414\u0430\u0442\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F", "completedAt", "CompletedAt", "closedAt", "ClosedAt"]);
    const newStatusValue = getTicketValue(row, ["\u0412\u0440\u0435\u043C\u044F \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u041D\u043E\u0432\u0430\u044F", "newAt", "NewAt"]);

    return {
        sourceIndex: index,
        id: cleanText(getTicketValue(row, ["\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "ID \u0437\u0430\u044F\u0432\u043A\u0438", "Id \u0437\u0430\u044F\u0432\u043A\u0438", "id", "ID", "ticketId", "TicketID"])),
        number: cleanText(getTicketValue(row, ["\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "\u2116 \u0437\u0430\u044F\u0432\u043A\u0438", "number", "Number", "ticketNumber"])),
        createdAt: parseTicketDate(createdValue),
        line: cleanText(getTicketValue(row, ["\u041B\u0438\u043D\u0438\u044F", "line", "Line", "lineName"])),
        service: cleanText(getTicketValue(row, ["\u0412\u0438\u0434 \u0443\u0441\u043B\u0443\u0433\u0438", "service", "Service", "serviceType"])),
        category: cleanText(getTicketValue(row, ["\u0422\u0438\u043F \u0437\u0430\u044F\u0432\u043A\u0438", "category", "Category", "ticketType", "type"])),
        client: cleanText(getTicketValue(row, ["\u041A\u043B\u0438\u0435\u043D\u0442", "client", "Client"])),
        initiator: cleanText(getTicketValue(row, ["\u0418\u043D\u0438\u0446\u0438\u0430\u0442\u043E\u0440 \u0437\u0430\u044F\u0432\u043A\u0438", "initiator", "Initiator"])),
        employee: cleanText(getTicketValue(row, ["\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C", "employee", "Employee", "assignee", "Assignee", "responsible"])),
        status: cleanText(getTicketValue(row, ["\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u044F\u0432\u043A\u0438", "status", "Status"])),
        actualSeconds: Number.isFinite(actualSeconds) && actualSeconds > 0 ? actualSeconds : 0,
        deadlineAt: parseTicketDate(deadlineValue),
        completedAt: parseTicketDate(completedValue),
        newAt: parseTicketDate(newStatusValue),
        topic: cleanText(getTicketValue(row, ["\u0422\u0435\u043C\u0430 \u0437\u0430\u044F\u0432\u043A\u0438", "topic", "Topic", "title", "Title"])),
        problem: cleanText(getTicketValue(row, ["\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B", "problem", "Problem", "description", "Description"])),
        solution: cleanText(getTicketValue(row, ["\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F", "solution", "Solution"])),
        priority: cleanText(getTicketValue(row, ["\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442", "priority", "Priority"]))
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
// \u0417\u0410\u042F\u0412\u041A\u0418: \u0420\u0410\u0421\u0427\u0401\u0422
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
            .map(ticket => ticket.employee || "\u041D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D")
    )).sort((a, b) => a.localeCompare(b, "ru"));

    ticketWorkHoursBody.innerHTML = "";
    employees.forEach(employee => {
        if (!ticketWorkHoursTouched.has(employee)) ticketWorkHours[employee] = calendar.normHours;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(employee)}</td>
            <td>${calendar.workingDays}</td>
            <td>${formatHoursNumber(calendar.normHours)}</td>
            <td><input class="worked-hours-input" type="number" min="0" step="0.25" value="${ticketWorkHours[employee]}" data-employee="${escapeHtml(employee)}" aria-label="\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043E\u0442\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0435 \u0447\u0430\u0441\u044B: ${escapeHtml(employee)}"></td>
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
        showTicketStatus("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0444\u0430\u0439\u043B \u0438\u043B\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 HTTP-\u0441\u0435\u0440\u0432\u0438\u0441\u0430.", true);
        return;
    }

    const filters = getTicketFilters();
    if (!filters.dateFrom || !filters.dateTo) {
        showTicketStatus("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043F\u0435\u0440\u0438\u043E\u0434 \u0440\u0430\u0441\u0447\u0451\u0442\u0430.", true);
        return;
    }
    if (filters.dateFrom > filters.dateTo) {
        showTicketStatus("\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0435\u0440\u0438\u043E\u0434\u0430 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u0434\u0430\u0442\u044B \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F.", true);
        return;
    }

    const filtered = filterTicketsBySource(sourceTickets, filters);
    const completedTickets = filtered.filter(ticket => isCompletedTicket(ticket.status));
    if (completedTickets.length === 0) {
        showTicketStatus("\u0412 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u043C \u043F\u0435\u0440\u0438\u043E\u0434\u0435 \u043D\u0435\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A.", true);
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
        const employeeName = ticket.employee || "\u041D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D";
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
        `\u0412 \u0440\u0430\u0441\u0447\u0451\u0442 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A: ${completedTickets.length}.`,
        `\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432: ${ticketHistoryDatasets[ticketSourceMode].length} \u0441\u043E\u0431\u044B\u0442\u0438\u0439; \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0434\u043B\u044F ${linkedWithCompletion} \u0437\u0430\u044F\u0432\u043E\u043A.`
    ];
    if (withoutNorm > 0) notes.push(`\u0411\u0435\u0437 \u043D\u0430\u0439\u0434\u0435\u043D\u043D\u043E\u0433\u043E \u043D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u0430: ${withoutNorm}.`);
    if (withoutLifecycle > 0) notes.push(`\u0411\u0435\u0437 \u0438\u043D\u0442\u0435\u0440\u0432\u0430\u043B\u0430 \u00AB\u041D\u043E\u0432\u0430\u044F \u2192 \u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430\u00BB: ${withoutLifecycle}.`);
    if (unevaluatedDeadlines > 0) notes.push(`\u0414\u0435\u0434\u043B\u0430\u0439\u043D \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0446\u0435\u043D\u0438\u0442\u044C: ${unevaluatedDeadlines}.`);
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
    return normalizeText(status).includes("\u043E\u0442\u043C\u0435\u043D") || normalizeText(status) === "cancelled";
}

function isCompletedTicket(status) {
    const normalized = normalizeText(status);
    return normalized.includes("\u0437\u0430\u0432\u0435\u0440\u0448") || normalized === "completed" || normalized === "closed";
}

function isNewTicketStatus(status) {
    const normalized = normalizeText(status);
    return normalized === "\u043D\u043E\u0432\u0430\u044F" || normalized === "new";
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
        if (object && object !== "status" && !object.includes("\u0441\u0442\u0430\u0442\u0443\u0441")) return;
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
        classifiedCategory: classification?.name || "\u041D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430",
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
            `\u0414\u043B\u044F \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044F \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D \u0433\u043E\u0434: ${unsupportedYears.join(", ")}. ` +
            "\u0421\u0435\u0439\u0447\u0430\u0441 \u0432 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443 \u0432\u0441\u0442\u0440\u043E\u0435\u043D \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C \u0420\u0424 \u043D\u0430 2026 \u0433\u043E\u0434."
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

    const table = ticketResultBody.closest("table");
    fillTicketMetricTable(table, ticketAnalysisResult, true);

    ticketSummary.hidden = false;
    ticketResultsPanel.hidden = false;
    ticketChartsPanel.hidden = false;
    renderTicketCategoryCharts();
    exportTicketsBtn.disabled = ticketAnalysisResult.length === 0;
    exportTicketsCategoriesBtn.disabled = ticketAnalysisResult.length === 0;
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
    exportTicketsCategoriesBtn.disabled = true;
    exportTicketsPdfBtn.disabled = true;
}

function formatPercent(value) {
    if (!Number.isFinite(value)) return "\u2014";
    return new Intl.NumberFormat("ru-RU", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

function formatHoursNumber(value) {
    if (!Number.isFinite(value)) return "\u2014";
    return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

// ===============================
// \u0417\u0410\u042F\u0412\u041A\u0418: \u0422\u0410\u0411\u041B\u0418\u0426\u0410 \u041A\u0410\u0422\u0415\u0413\u041E\u0420\u0418\u0419
// ===============================

function loadTicketCategories() {
    try {
        const saved = JSON.parse(localStorage.getItem(TICKET_CATEGORIES_STORAGE_KEY));
        if (Array.isArray(saved) && saved.length > 0) {
            return saved;
        }
    } catch (error) {
        console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u043D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u044B", error);
    }
    return DEFAULT_TICKET_CATEGORIES.map(item => ({ ...item }));
}

function saveTicketCategories() {
    try {
        localStorage.setItem(TICKET_CATEGORIES_STORAGE_KEY, JSON.stringify(ticketCategories));
    } catch (error) {
        console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u044B", error);
    }
}

function renderTicketCategories() {
    categoriesBody.innerHTML = "";
    ticketCategories.forEach((category, index) => {
        const row = document.createElement("tr");
        row.dataset.index = String(index);
        row.innerHTML = `
            <td><input type="text" data-field="group" value="${escapeHtml(category.group || "")}" aria-label="\u0413\u0440\u0443\u043F\u043F\u0430 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"></td>
            <td><input type="text" data-field="names" value="${escapeHtml(category.names || "")}" aria-label="\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"></td>
            <td><input type="number" data-field="minutes" value="${Number(category.minutes) || 0}" min="0" step="1" aria-label="\u041D\u043E\u0440\u043C\u0430\u0442\u0438\u0432 \u0432 \u043C\u0438\u043D\u0443\u0442\u0430\u0445"></td>
            <td><button type="button" class="remove-category-btn" title="\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" aria-label="\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E">\u00D7</button></td>
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
    ticketCategories.push({ key: `custom_${Date.now()}`, group: "", name: "\u041D\u043E\u0432\u0430\u044F \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", names: "", minutes: 15 });
    saveTicketCategories();
    renderTicketCategories();
    categoriesBody.lastElementChild?.querySelector('input[data-field="group"]')?.focus();
    resetTicketResults();
}

function resetTicketCategories() {
    if (!confirm("\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u043E\u0432? \u0412\u043D\u0435\u0441\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u044B.")) {
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
    const text = normalizeText([ticket.category, ticket.topic, ticket.problem, ticket.solution].filter(Boolean).join(" ")).replaceAll("\u0451", "\u0435");
    const findByKey = key => categories.find(category => category.key === key) || null;
    const contains = (...terms) => terms.some(term => text.includes(term));

    // \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B, \u0447\u0442\u043E\u0431\u044B \u043E\u0431\u0449\u0438\u0435 \u0441\u043B\u043E\u0432\u0430 \u00AB\u0434\u043E\u0441\u0442\u0443\u043F\u00BB \u0438 \u00AB\u0434\u0440\u0443\u0433\u043E\u0435\u00BB \u043D\u0435 \u043E\u0442\u043D\u043E\u0441\u0438\u043B\u0438\u0441\u044C \u043A \u043A\u043B\u0438\u0435\u043D\u0442\u0441\u043A\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u0435.
    if (contains("\u043D\u043E\u0432\u044B\u0439 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A", "\u043D\u043E\u0432\u043E\u0433\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430", "\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u0442\u044C \u043C\u0435\u0441\u0442\u043E", "\u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u043E \u043C\u0435\u0441\u0442\u043E")) {
        return contains("\u043E\u0431\u043E\u0440\u0443\u0434", "\u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u043C\u0435\u0441\u0442\u043E") ? findByKey("internal_workplace") : findByKey("internal_access");
    }
    if (contains("\u043F\u0440\u0438\u043D\u0442\u0435\u0440", "\u043E\u0440\u0433\u0442\u0435\u0445\u043D\u0438\u043A", "\u0441\u043A\u0430\u043D\u0435\u0440")) return findByKey("internal_network");
    if (contains("\u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u0441\u0438\u043F\u0443\u043D\u0438", "sipuni", "\u0437\u0432\u043E\u043D\u043A\u0438", "\u043D\u0435 \u0437\u0432\u043E\u043D\u0438\u0442")) return findByKey("internal_telephony");
    if (contains("\u043D\u0430\u0443\u0448\u043D\u0438\u043A", "lightshot", "\u0441\u043A\u0440\u0438\u043D\u0448\u043E\u0442", "\u0437\u0432\u0443\u043A \u043D\u0430 \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440", "\u0437\u0432\u0443\u043A \u0432 \u043D\u0430\u0443\u0448")) return findByKey("internal_equipment");
    if (contains("connect", "\u043A\u043E\u043D\u043D\u0435\u043A\u0442", "\u0442\u0435\u043B\u0435\u0442\u0430\u0439\u043F", "chatgpt", "gmail", "amo crm", "\u044E\u0434\u0436\u0430\u0439\u043B", "\u043F\u043E\u0447\u0442", "winscp") && !contains("\u0431\u0430\u0437\u0430", "\u0434\u0430\u043C\u043F")) {
        return contains("\u0434\u043E\u0441\u0442\u0443\u043F", "\u0434\u043E\u0431\u0430\u0432", "\u0443\u0447\u0435\u0442\u043A", "\u043F\u0430\u0440\u043E\u043B", "\u0432\u043E\u0439\u0442\u0438", "\u0432\u0445\u043E\u0434") ? findByKey("internal_access") : findByKey("internal_external_service");
    }
    if (contains("vpn") && !contains("\u043A\u043B\u0438\u0435\u043D\u0442")) return findByKey("internal_external_service");
    if (contains("\u0434\u043E\u0441\u0442\u0443\u043F \u0432 \u0431\u0443\u0445", "\u0434\u043E\u0441\u0442\u0443\u043F \u043A \u0443\u0447\u0435\u0442\u043D\u043E\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u0435", "\u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F", "\u0434\u043E\u0441\u0442\u0443\u043F\u044B \u0437\u0430\u043A\u0440\u044B\u0442\u044B")) return findByKey("internal_access");

    // \u041A\u043B\u0438\u0435\u043D\u0442\u0441\u043A\u0438\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B 1\u0421.
    if (contains("\u0441\u043B\u043A", "\u043B\u0438\u0446\u0435\u043D\u0437", "auto.lic", "\u043A\u043B\u044E\u0447 \u0437\u0430\u0449\u0438\u0442\u044B", "\u0443\u0430\u0442")) return findByKey("client_industry_licenses");
    if (contains("\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446", "\u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442 \u043E\u0431\u043C\u0435\u043D", "\u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442", "\u043E\u0431\u043C\u0435\u043D \u043C\u0435\u0436\u0434\u0443 \u0431\u0430\u0437", "\u0444\u0430\u0439\u043B \u043E\u0431\u043C\u0435\u043D\u0430")) return findByKey("client_exchange_transport");
    if (contains("\u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446", "\u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432", "odata", "\u0432\u0435\u0431-\u043A\u043B\u0438\u0435\u043D\u0442", "\u0432\u0435\u0431 \u043A\u043B\u0438\u0435\u043D\u0442", "\u0432\u0435\u0431-\u0441\u0435\u0440\u0432\u0438\u0441", "\u0432\u0435\u0431 \u0441\u0435\u0440\u0432\u0438\u0441")) return findByKey("client_publication");
    if (contains("winrdp", "win rdp", "altrd", "\u0430\u043B\u044C\u0442\u0440\u0434", "rds", "\u0440\u0434\u043F")) {
        return contains("\u0441\u043E\u0437\u0434\u0430\u0442\u044C", "\u0443\u0447\u0435\u0442\u043A", "\u0434\u043E\u0441\u0442\u0443\u043F", "\u043F\u0430\u0440\u043E\u043B", "\u043A\u0432\u043E\u0442", "\u043C\u0435\u0441\u0442\u0430") ? findByKey("client_access") : findByKey("client_remote_desktop");
    }
    if (contains("ftp")) return findByKey("client_access");
    if (contains("\u0434\u0430\u0442\u0430 \u0434\u0430\u043C\u043F", "\u0434\u0430\u043C\u043F", "\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0431\u0430\u0437", "\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0431\u0430\u0437", "\u043F\u043E\u0434\u0433\u0440\u0443\u0437\u043A", "\u0432\u044B\u0433\u0440\u0443\u0437\u043A", "\u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u043B", "\u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C", "\u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D", "\u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0431\u0430\u0437")) return findByKey("client_database_import_export");
    if (contains("\u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D", "\u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C", "\u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435", "\u043F\u0430\u0442\u0447", "\u0440\u0435\u043B\u0438\u0437", "\u0444\u0430\u0439\u043B \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430", "\u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438")) {
        return contains("\u043D\u0435\u0442 \u0440\u0435\u043B\u0438\u0437\u0430", "\u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432", "\u0444\u0430\u0439\u043B \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430", "\u043F\u043E\u0434\u043B\u043E\u0436\u0438\u043B", "\u043F\u043E\u0434\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0440\u0435\u043B\u0438\u0437") ? findByKey("client_release") : findByKey("client_database_update");
    }
    if (contains("\u0437\u0430\u0434\u0430\u0447 \u043C\u043E\u0434\u0438\u0444", "\u0437\u0430\u0434\u0430\u0447\u0438 \u043C\u043E\u0434\u0438\u0444", "\u0437\u043C ", "\u0437\u043C \u043F\u043E", " \u0437\u043E ", "\u043A\u043E\u043D\u0432\u0435\u0440\u0442\u0430\u0446", "\u043F\u0435\u0440\u0435\u043D\u043E\u0441 \u0431\u0430\u0437", "\u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D")) return findByKey("client_background_tasks");
    if (contains("\u043D\u0435 \u0432\u0445\u043E\u0434\u0438\u0442", "\u043D\u0435 \u0432\u043E\u0439\u0442\u0438", "\u043F\u0440\u0438 \u0432\u0445\u043E\u0434\u0435", "\u0432\u0445\u043E\u0434 \u0432 \u0431\u0430\u0437", "\u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u043A \u0431\u0430\u0437\u0435", "\u043F\u043E\u0442\u0435\u0440\u044F\u043D\u043E \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435")) return findByKey("client_database_login");
    if (contains("\u043E\u0448\u0438\u0431\u043A\u0430 \u0432 \u0431\u0430\u0437\u0435", "\u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438", "\u0442\u0438\u0438", "\u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435", "\u0444\u043E\u043D\u043E\u0432\u044B\u0435 \u0437\u0430\u0434\u0430\u043D", "\u0441\u0441\u044B\u043B\u043E\u0447\u043D\u043E\u0439 \u0446\u0435\u043B\u043E\u0441\u0442", "\u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438", "\u043E\u0448\u0438\u0431\u043A\u0430 \u0440\u0435\u043B\u0438\u0437\u0430") || ticketType === "\u043E\u0448\u0438\u0431\u043A\u0430 \u0432 \u0431\u0430\u0437\u0435") return findByKey("client_database_problem");
    if (ticketType === "\u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0431\u0430\u0437\u044B") return findByKey("client_database_login");
    if (ticketType === "\u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u044F" || contains("\u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446", "\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442", "\u043C\u043E\u0436\u043D\u043E \u043B\u0438", "\u043F\u043E\u0434\u0441\u043A\u0430\u0436")) return findByKey("client_consultation");
    if (ticketType === "\u043E\u0440\u0433\u0442\u0435\u0445\u043D\u0438\u043A\u0430" || ticketType === "\u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u043C\u0435\u0441\u0442\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430") return findByKey("internal_equipment");
    if (ticketType === "\u0441\u0435\u0442\u0435\u0432\u044B\u0435 \u0438 \u0441\u0435\u0440\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B") return findByKey("internal_network");

    const exactMatches = categories.filter(category => category.aliases.includes(ticketType));
    if (exactMatches.length === 1) return exactMatches[0];
    return findByKey("client_other") || exactMatches[0] || null;
}

// ===============================
// \u0417\u0410\u042F\u0412\u041A\u0418: \u0414\u0415\u0422\u0410\u041B\u0418 \u0418 \u042D\u041A\u0421\u041F\u041E\u0420\u0422
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
        context.fillText("\u041D\u0435\u0442 \u0437\u0430\u044F\u0432\u043E\u043A", center, center);
        legend.innerHTML = '<div class="ticket-chart-empty">\u0412 \u044D\u0442\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u0435 \u043D\u0435\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A.</div>';
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
        row.title = `\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u00AB${item.name}\u00BB`;
        row.setAttribute("aria-label", `\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 ${item.name}: ${item.count}, ${formatPercent(share)}`);
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
        // \u0414\u043B\u044F \u0443\u0437\u043A\u0438\u0445 \u0441\u0435\u043A\u0442\u043E\u0440\u043E\u0432 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0440\u0430\u0437\u0432\u043E\u0434\u0438\u043C \u043F\u043E\u0434\u043F\u0438\u0441\u0438 \u043F\u043E \u0440\u0430\u0434\u0438\u0443\u0441\u0443, \u043D\u043E \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u0438\u0445 \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u0435\u043A\u0442\u043E\u0440\u0430.
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
            const category = normalizeText(ticket.classifiedCategory || "\u041D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430");
            return group.includes(normalizedGroup) && category === normalizedCategory;
        })
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    if (tickets.length === 0) return;
    const groupLabel = cleanText(tickets[0]?.classifiedGroup) || "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430";
    const standardMs = tickets.reduce((sum, ticket) => sum + (ticket.standardMs || 0), 0);
    const actualMs = tickets.reduce((sum, ticket) => sum + (ticket.actualMs || 0), 0);

    openTicketsCollectionModal({
        title: `\u0417\u0430\u044F\u0432\u043A\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438: ${categoryName}`,
        subtitle: `${groupLabel} \u00B7 ${tickets.length} \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A \u00B7 \u043D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F ${formatDuration(standardMs)} \u00B7 \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u0430\u044F \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C ${formatDuration(actualMs)}`,
        filenameLabel: `\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F_${categoryName}`,
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

// A shared matrix keeps screen and PDF values and labels consistent.
function fillTicketMetricTable(table, employees, interactive = false) {
    const groups = [
        ["Объём работы", [
            ["Завершено заявок", item => item.completedCount]
        ]],
        ["Время и загрузка", [
            ["Общее время заявок", item => formatDuration(item.lifecycleMs), "От создания до завершения, без пауз"],
            ["Длительность работ", item => formatDuration(item.actualMs), "Из поля «Длительность»"],
            ["Время по нормативу", item => formatDuration(item.standardMs), "Сумма нормативов тематик"],
            ["Рабочие дни", item => item.workDays, "По производственному календарю"],
            ["Норма рабочего времени, ч", item => formatHoursNumber(item.productionNormHours)],
            ["Фактически отработано, ч", item => formatHoursNumber(item.workedHours)],
            ["Доля времени на заявки", item => formatPercent(item.utilizationPercent), "Нормативное время / отработанное время", "accent"]
        ]],
        ["Соблюдение сроков", [
            ["Заявки с дедлайном", item => item.deadlineCount],
            ["Завершено в срок", item => item.onTimeCount],
            ["Просрочено заявок", item => item.overdueCount],
            ["Доля просроченных", item => formatPercent(item.overduePercent), "Среди заявок с оценённым дедлайном", "accent"]
        ]]
    ];
    table.classList.add("metric-table");
    table.style.minWidth = interactive ? `${280 + employees.length * 180}px` : "0";
    const head = table.tHead || table.createTHead();
    const body = table.tBodies[0] || table.createTBody();
    head.innerHTML = `<tr><th scope="col">Показатель</th>${employees.map(item => `<th scope="col">${escapeHtml(item.employee)}</th>`).join("")}</tr>`;
    body.innerHTML = "";
    if (!employees.length) {
        body.innerHTML = '<tr><td>Нет завершённых заявок для выбранных фильтров.</td></tr>';
        return;
    }
    groups.forEach(([title, metrics]) => {
        const section = body.insertRow();
        section.className = "metric-section";
        section.innerHTML = `<th colspan="${employees.length + 1}">${title}</th>`;
        metrics.forEach(([label, value, hint, className]) => {
            const row = body.insertRow();
            if (className) row.className = `metric-${className}`;
            row.innerHTML = `<th scope="row">${label}${hint ? `<small>${hint}</small>` : ""}</th>` +
                employees.map(item => `<td>${escapeHtml(String(value(item)))}</td>`).join("");
        });
    });
    if (interactive) {
        body.insertRow().innerHTML = '<th scope="row">Детализация заявок</th>' + employees.map(item =>
            `<td><button type="button" class="small-button view-tickets-btn" data-employee="${escapeHtml(item.employee)}">Посмотреть</button></td>`).join("");
    }
}

function buildTicketReportPdfElement(employees = ticketAnalysisResult, pageIndex = 0, pageCount = 1) {
    const totals = getTicketReportTotals();
    const root = document.createElement("div");
    root.className = "pdf-export-root pdf-report-export pdf-matrix-page";
    const overdue = totals.deadlineEvaluated > 0 ? totals.overdue / totals.deadlineEvaluated : null;
    root.innerHTML = `
        <div class="pdf-report-header">
            <div class="pdf-eyebrow">TIME EXTRACTOR / АНАЛИТИКА ПОДДЕРЖКИ</div>
            <h1>Отчёт по тикетам 2-й линии</h1>
            <p><b>${escapeHtml(getReportPeriodLabel())}</b> · ${escapeHtml(getReportSourceLabel())}</p>
        </div>
        <div class="pdf-summary-grid">
            <div><span>Завершено заявок</span><b>${totals.completed}</b></div>
            <div><span>Сотрудников</span><b>${ticketAnalysisResult.length}</b></div>
            <div><span>Время по нормативу</span><b>${escapeHtml(formatDuration(totals.standardMs))}</b></div>
            <div><span>Доля просроченных</span><b>${escapeHtml(formatPercent(overdue))}</b></div>
        </div>
        <h2>Показатели по сотрудникам</h2>
        <p class="pdf-page-caption">${pageCount > 1 ? `Сотрудники ${pageIndex * 4 + 1}–${pageIndex * 4 + employees.length} из ${ticketAnalysisResult.length}. ` : ""}Общие показатели сверху — по всей выборке.</p>
    `;
    const table = document.createElement("table");
    table.className = "pdf-report-table";
    fillTicketMetricTable(table, employees);
    root.appendChild(table);
    const note = document.createElement("div");
    note.className = "pdf-calculation-note";
    note.innerHTML = '<b>Как читать отчёт</b><br>Время по нормативу — расчётная оценка по тематикам, а не измеренное время работы. Доля времени на заявки = нормативное время / фактически отработанные часы. Доля просроченных = просроченные / заявки с оценённым дедлайном. «—» означает, что долю рассчитать нельзя.';
    root.appendChild(note);
    return root;
}

function buildTicketsPdfHeaderElement(context) {
    const exportRoot = document.createElement("div");
    exportRoot.className = "pdf-export-root pdf-ticket-list-export pdf-ticket-list-header";

    const header = document.createElement("div");
    header.className = "pdf-report-header";
    header.innerHTML = `
        <h1>${escapeHtml(context.title || "\u0417\u0430\u044F\u0432\u043A\u0438")}</h1>
        <p><b>\u041F\u0435\u0440\u0438\u043E\u0434:</b> ${escapeHtml(getReportPeriodLabel())}</p>
        <p>${escapeHtml(context.subtitle || `${context.tickets?.length || 0} \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A`)}</p>
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
    throw lastError || new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443 PDF.");
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

    await document.fonts.ready;
    await Promise.all(Array.from(element.querySelectorAll("img")).map(img =>
        img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
    [element, ...element.querySelectorAll("*")].forEach(node => {
        const computed = window.getComputedStyle(node);
        const declarations = Array.from(computed, property =>
            [property, computed.getPropertyValue(property)]);
        declarations.forEach(([property, value]) => node.style.setProperty(property, value));
    });

    const rect = element.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
        throw new Error("\u041F\u0435\u0447\u0430\u0442\u043D\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0438\u043C\u0435\u0435\u0442 \u043D\u0443\u043B\u0435\u0432\u043E\u0439 \u0440\u0430\u0437\u043C\u0435\u0440.");
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
        throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u0440\u0438\u0441\u043E\u0432\u0430\u0442\u044C \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u0434\u043B\u044F PDF.");
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
        const y = options.alignTop ? state.margin : (pageHeight - fittedHeight) / 2;
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

    // \u041E\u0447\u0435\u043D\u044C \u0434\u043B\u0438\u043D\u043D\u044B\u0439 \u0431\u043B\u043E\u043A \u0440\u0435\u0436\u0435\u043C \u043D\u0430 \u043F\u043E\u043B\u043E\u0441\u044B \u043F\u043E \u0432\u044B\u0441\u043E\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0434\u0430\u0436\u0435 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u0451\u0442 \u0433\u0438\u0433\u0430\u043D\u0442\u0441\u043A\u0438\u0439 canvas PDF.
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
        showTicketStatus("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0440\u0430\u0441\u0447\u0451\u0442 \u0437\u0430\u044F\u0432\u043E\u043A.", true);
        return;
    }

    const originalText = exportTicketsPdfBtn.textContent;
    exportTicketsPdfBtn.disabled = true;
    exportTicketsPdfBtn.textContent = "\u0424\u043E\u0440\u043C\u0438\u0440\u0443\u044E PDF...";
    let host = null;

    try {
        await ensurePdfExportLibrary();
        renderTicketCategoryCharts();
        await waitForPdfLayout();

        const JsPdf = getJsPdfConstructor();
        const pdf = new JsPdf({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
        const state = { margin: 8, y: 8, hasPageContent: false };
        host = createPdfRenderHost(1500);

        const pageCount = Math.ceil(ticketAnalysisResult.length / 4);
        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const employees = ticketAnalysisResult.slice(pageIndex * 4, pageIndex * 4 + 4);
            const reportCanvas = await renderPdfElementToCanvas(
                buildTicketReportPdfElement(employees, pageIndex, pageCount), host);
            addCanvasToPdf(pdf, reportCanvas, state, { forceNewPage: true, fitSinglePage: true, alignTop: true });
        }

        for (const definition of TICKET_CHART_DEFINITIONS) {
            const chartCard = cloneTicketChartCardForPdf(definition);
            if (!chartCard) continue;
            const chartPage = document.createElement("div");
            chartPage.className = "pdf-export-root pdf-report-export pdf-chart-page";
            chartPage.appendChild(chartCard);
            const chartCanvas = await renderPdfElementToCanvas(chartPage, host);
            pdf.addPage("a4", "landscape");
            state.hasPageContent = false;
            state.y = state.margin;
            addCanvasToPdf(pdf, chartCanvas, state, { forceNewPage: true, fitSinglePage: true });
        }

        const period = getReportPeriodLabel().replace(/\s+/g, "_");
        const filename = sanitizePdfFilename(`\u043E\u0442\u0447\u0451\u0442_\u043F\u043E_\u0437\u0430\u044F\u0432\u043A\u0430\u043C_${period}`) + ".pdf";
        pdf.save(filename);
        showTicketStatus("PDF-\u043E\u0442\u0447\u0451\u0442 \u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D.", false);
    } catch (error) {
        console.error(error);
        showTicketStatus("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u0442\u044C PDF: " + error.message, true);
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
    ticketsModalPdfBtn.textContent = "\u0424\u043E\u0440\u043C\u0438\u0440\u0443\u044E PDF...";
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
        const filename = sanitizePdfFilename(`\u0437\u0430\u044F\u0432\u043A\u0438_${context.filenameLabel || "\u0432\u044B\u0431\u043E\u0440\u043A\u0430"}_${period}`) + ".pdf";
        pdf.save(filename);
        showTicketStatus(`PDF \u0441\u043E \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u0437\u0430\u044F\u0432\u043E\u043A \u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D: ${context.tickets.length}.`, false);
    } catch (error) {
        console.error(error);
        showTicketStatus("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u0442\u044C PDF \u0441\u043F\u0438\u0441\u043A\u0430 \u0437\u0430\u044F\u0432\u043E\u043A: " + error.message, true);
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
        title: `\u0417\u0430\u044F\u0432\u043A\u0438: ${employeeName}`,
        subtitle: `${result.completedCount} \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A, \u043D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u0440\u0430\u0431\u043E\u0442 ${formatDuration(result.standardMs)}, \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u0430\u044F \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C ${formatDuration(result.actualMs)}`,
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
        title: title || "\u0417\u0430\u044F\u0432\u043A\u0438",
        subtitle: subtitle || `${sortedTickets.length} \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u044F\u0432\u043E\u043A`,
        filenameLabel: filenameLabel || "\u0432\u044B\u0431\u043E\u0440\u043A\u0430",
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
                <div><h3>${escapeHtml(ticket.number || ticket.id || "\u0417\u0430\u044F\u0432\u043A\u0430")}</h3><span class="ticket-status">${escapeHtml(ticket.status || "\u0421\u0442\u0430\u0442\u0443\u0441 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D")}</span></div>
                <div><b>${escapeHtml(ticket.classifiedCategory)}</b><br><span class="hint">${escapeHtml(ticket.classifiedGroup || ticket.line || "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430")}</span></div>
            </div>
            <div class="ticket-metrics">
                <div class="ticket-metric"><span>\u041D\u043E\u0432\u0430\u044F \u2192 \u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430</span><b>${ticket.lifecycleMs > 0 ? formatDuration(ticket.lifecycleMs) : "\u041D\u0435\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438"}</b></div>
                <div class="ticket-metric"><span>\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C</span><b>${ticket.actualMs > 0 ? formatDuration(ticket.actualMs) : "\u041D\u0435 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0430"}</b></div>
                <div class="ticket-metric"><span>\u041D\u043E\u0440\u043C\u0430\u0442\u0438\u0432 \u0442\u0435\u043C\u0430\u0442\u0438\u043A\u0438</span><b>${ticket.standardMs > 0 ? formatDuration(ticket.standardMs) : "\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"}</b></div>
                <div class="ticket-metric"><span>\u0414\u0435\u0434\u043B\u0430\u0439\u043D</span><b>${formatTicketDeadlineResult(ticket)}</b></div>
            </div>
            <div class="dialog-meta">
                <div><b>\u041D\u043E\u0432\u0430\u044F:</b> ${escapeHtml(formatTicketDateTime(ticket.newAt) || "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445")}</div>
                <div><b>\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430:</b> ${escapeHtml(formatTicketDateTime(ticket.completedAt) || "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445")}</div>
                <div><b>\u0421\u0440\u043E\u043A:</b> ${escapeHtml(formatTicketDateTime(ticket.deadlineAt) || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D")}</div>
                <div><b>\u041A\u043B\u0438\u0435\u043D\u0442:</b> ${escapeHtml(ticket.client || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D")}</div>
                <div><b>\u0418\u043D\u0438\u0446\u0438\u0430\u0442\u043E\u0440:</b> ${escapeHtml(ticket.initiator || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D")}</div>
            </div>
            ${ticket.topic ? `<div class="ticket-description"><b>\u0422\u0435\u043C\u0430:</b> ${escapeHtml(ticket.topic)}</div>` : ""}
            ${ticket.problem ? `<div class="ticket-description"><b>\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430:</b> ${escapeHtml(ticket.problem)}</div>` : ""}
            ${ticket.solution ? `<div class="ticket-description"><b>\u0420\u0435\u0448\u0435\u043D\u0438\u0435:</b> ${escapeHtml(ticket.solution)}</div>` : ""}
        `;
        ticketsModalBody.appendChild(card);
    });

    ticketsModal.hidden = false;
}

function formatTicketDeadlineResult(ticket) {
    if (!ticket.deadlineAt) return "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D";
    if (ticket.deadlineResult === "on-time") return "\u0412 \u0441\u0440\u043E\u043A";
    if (ticket.deadlineResult === "overdue") return "\u041F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043E";
    return "\u041D\u0435 \u043E\u0446\u0435\u043D\u0451\u043D";
}

function closeTicketsDetailsModal() {
    ticketsModal.hidden = true;
    ticketsModalBody.innerHTML = "";
    activeTicketsModalContext = null;
    ticketsModalPdfBtn.disabled = true;
}

function exportTicketsCsv() {
    if (ticketAnalysisResult.length === 0) {
        showTicketStatus("\u041D\u0435\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432 \u0434\u043B\u044F \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430.", true);
        return;
    }
    const rows = [[
        "\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C", "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043E \u0442\u0438\u043A\u0435\u0442\u043E\u0432", "\u041E\u0431\u0449\u0435\u0435 \u0432\u0440\u0435\u043C\u044F \u0442\u0438\u043A\u0435\u0442\u043E\u0432, \u043C\u0438\u043D\u0443\u0442", "\u041E\u0431\u0449\u0435\u0435 \u0432\u0440\u0435\u043C\u044F \u0442\u0438\u043A\u0435\u0442\u043E\u0432",
        "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C, \u043C\u0438\u043D\u0443\u0442", "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C", "\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u0440\u0430\u0431\u043E\u0442 \u043F\u043E \u043D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u0443, \u043C\u0438\u043D\u0443\u0442",
        "\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u0440\u0430\u0431\u043E\u0442 \u043F\u043E \u043D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u0443", "\u0420\u0430\u0431\u043E\u0447\u0438\u0445 \u0434\u043D\u0435\u0439", "\u041D\u043E\u0440\u043C\u0430 \u0447\u0430\u0441\u043E\u0432 \u043F\u043E \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u043C\u0443 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044E", "\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043E\u0442\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043E \u0447\u0430\u0441\u043E\u0432",
        "% \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430 \u0442\u0438\u043A\u0435\u0442\u044B", "\u0417\u0430\u044F\u0432\u043E\u043A \u0441 \u0434\u0435\u0434\u043B\u0430\u0439\u043D\u043E\u043C", "\u0412 \u0441\u0440\u043E\u043A", "\u041F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043E", "% \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0445"
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

async function exportTicketsExcelWithCategories() {
    const tickets = getAnalyzedTicketsFlat();
    if (tickets.length === 0) {
        showTicketStatus("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0440\u0430\u0441\u0447\u0451\u0442 \u0437\u0430\u044F\u0432\u043E\u043A.", true);
        return;
    }

    const originalText = exportTicketsCategoriesBtn.textContent;
    exportTicketsCategoriesBtn.disabled = true;
    exportTicketsCategoriesBtn.textContent = "\u0424\u043E\u0440\u043C\u0438\u0440\u0443\u044E Excel...";

    try {
        await ensureXlsxLibrary();

        const rows = [[
            "\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u044F\u0432\u043A\u0438",
            "\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u044F\u0432\u043A\u0438",
            "\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C",
            "\u0412\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F",
            "\u041B\u0438\u043D\u0438\u044F",
            "\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u0442\u0438\u043F \u0437\u0430\u044F\u0432\u043A\u0438",
            "\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D\u043D\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430",
            "\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D\u043D\u0430\u044F \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F",
            "\u041D\u043E\u0440\u043C\u0430\u0442\u0438\u0432 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438, \u043C\u0438\u043D\u0443\u0442",
            "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u044B, \u043C\u0438\u043D\u0443\u0442",
            "\u0422\u0435\u043C\u0430 \u0437\u0430\u044F\u0432\u043A\u0438",
            "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B",
            "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F",
            "\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u044F\u0432\u043A\u0438",
            "\u0421\u0442\u0430\u0442\u0443\u0441 \u041D\u043E\u0432\u0430\u044F",
            "\u0421\u0442\u0430\u0442\u0443\u0441 \u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430",
            "\u041D\u043E\u0432\u0430\u044F \u2192 \u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430, \u043C\u0438\u043D\u0443\u0442",
            "\u0421\u0440\u043E\u043A \u0437\u0430\u044F\u0432\u043A\u0438",
            "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043F\u043E \u0434\u0435\u0434\u043B\u0430\u0439\u043D\u0443",
            "\u041A\u043B\u0438\u0435\u043D\u0442",
            "\u0418\u043D\u0438\u0446\u0438\u0430\u0442\u043E\u0440 \u0437\u0430\u044F\u0432\u043A\u0438",
            "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442"
        ]];

        tickets
            .slice()
            .sort((a, b) => {
                const employeeCompare = (a.employee || "\u041D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D").localeCompare(b.employee || "\u041D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D", "ru");
                return employeeCompare || (a.createdAt || 0) - (b.createdAt || 0);
            })
            .forEach(ticket => rows.push([
                ticket.number || "",
                ticket.id || "",
                ticket.employee || "\u041D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D",
                formatTicketDateTime(ticket.createdAt),
                ticket.line || "",
                ticket.category || "",
                ticket.classifiedGroup || "\u041D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430",
                ticket.classifiedCategory || "\u041D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430",
                ticket.standardMs > 0 ? roundNumber(ticket.standardMs / 60000) : "",
                ticket.actualMs > 0 ? roundNumber(ticket.actualMs / 60000) : "",
                ticket.topic || "",
                ticket.problem || "",
                ticket.solution || "",
                ticket.status || "",
                formatTicketDateTime(ticket.newAt),
                formatTicketDateTime(ticket.completedAt),
                ticket.lifecycleMs > 0 ? roundNumber(ticket.lifecycleMs / 60000) : "",
                formatTicketDateTime(ticket.deadlineAt),
                formatTicketDeadlineResult(ticket),
                ticket.client || "",
                ticket.initiator || "",
                ticket.priority || ""
            ]));

        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        worksheet["!autofilter"] = { ref: worksheet["!ref"] };
        worksheet["!cols"] = [
            { wch: 16 }, { wch: 38 }, { wch: 24 }, { wch: 19 }, { wch: 24 },
            { wch: 24 }, { wch: 34 }, { wch: 48 }, { wch: 20 }, { wch: 23 },
            { wch: 36 }, { wch: 52 }, { wch: 52 }, { wch: 18 }, { wch: 19 },
            { wch: 19 }, { wch: 27 }, { wch: 19 }, { wch: 23 }, { wch: 28 },
            { wch: 28 }, { wch: 16 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "\u0417\u0430\u044F\u0432\u043A\u0438 \u0441 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C\u0438");

        const filters = getTicketFilters();
        const dateFrom = filters.dateFrom ? formatDateInputValue(filters.dateFrom) : "\u043F\u0435\u0440\u0438\u043E\u0434";
        const dateTo = filters.dateTo ? formatDateInputValue(filters.dateTo) : "\u043F\u0435\u0440\u0438\u043E\u0434";
        XLSX.writeFile(workbook, `\u0437\u0430\u044F\u0432\u043A\u0438_\u0441_\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C\u0438_${dateFrom}_${dateTo}.xlsx`, {
            bookType: "xlsx",
            compression: true
        });

        showTicketStatus(`Excel \u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D. \u0412\u044B\u0433\u0440\u0443\u0436\u0435\u043D\u043E \u0437\u0430\u044F\u0432\u043E\u043A \u0441 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C\u0438: ${tickets.length}.`, false);
    } catch (error) {
        console.error(error);
        showTicketStatus("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u0442\u044C Excel: " + error.message, true);
    } finally {
        exportTicketsCategoriesBtn.textContent = originalText;
        exportTicketsCategoriesBtn.disabled = ticketAnalysisResult.length === 0;
    }
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
// \u0417\u0410\u042F\u0412\u041A\u0418: \u0412\u0421\u041F\u041E\u041C\u041E\u0413\u0410\u0422\u0415\u041B\u042C\u041D\u042B\u0415 \u0424\u0423\u041D\u041A\u0426\u0418\u0418
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
        // \u0412\u044B\u0433\u0440\u0443\u0437\u043A\u0438 1\u0421 \u043C\u043E\u0433\u0443\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0442\u044C \u0447\u0430\u0441\u043E\u0432\u043E\u0439 \u043F\u043E\u044F\u0441 \u0442\u043E\u043B\u044C\u043A\u043E \u043A \u0434\u0435\u0434\u043B\u0430\u0439\u043D\u0443, \u043D\u043E \u043D\u0435 \u043A \u0438\u0441\u0442\u043E\u0440\u0438\u0438.
        // \u0421\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0435\u043C \u0432\u0441\u0435 \u043F\u043E\u043B\u044F \u043A\u0430\u043A \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0431\u0438\u0437\u043D\u0435\u0441-\u0432\u0440\u0435\u043C\u044F \u0438 \u043D\u0435 \u0434\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u043C \u0441\u0434\u0432\u0438\u0433 \u043D\u0430 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0447\u0430\u0441\u043E\u0432.
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
