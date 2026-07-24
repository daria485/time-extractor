// ===============================
// TICKET ANALYTICS
// Расчёт времени завершённых тикетов
// ===============================

"use strict";

let ticketRecords = [];
let filteredTicketRecords = [];
let latestChatResults = [];
let ticketPauseColumnFound = false;

const TICKET_HEADER_ALIASES = {
    number: ["№", "номер", "номер заявки", "номер тикета"],
    subject: ["тема", "наименование", "название"],
    status: ["статус"],
    priority: ["приоритет"],
    workType: ["вид работ", "тип работ"],
    employee: ["исполнитель", "ответственный"],
    duration: [
        "длительность",
        "длительность выполнения",
        "время выполнения"
    ],
    openedAt: [
        "заявка открыта",
        "дата регистрации",
        "дата открытия",
        "зарегистрирована"
    ],
    closedAt: [
        "заявка закрыта",
        "дата завершения",
        "дата закрытия",
        "завершена"
    ],
    pauseDuration: [
        "длительность паузы",
        "длительность пауз",
        "время паузы",
        "время пауз",
        "пауза"
    ]
};

const COMPLETED_TICKET_STATUSES = new Set([
    "завершена",
    "завершен",
    "завершено",
    "закрыта",
    "закрыт",
    "закрыто"
]);

const ticketFileInput =
    document.getElementById("ticketFileInput");
const ticketStatus =
    document.getElementById("ticketStatus");
const ticketFiltersPanel =
    document.getElementById("ticketFiltersPanel");
const ticketEmployeeFilter =
    document.getElementById("ticketEmployeeFilter");
const ticketPriorityFilter =
    document.getElementById("ticketPriorityFilter");
const ticketWorkTypeFilter =
    document.getElementById("ticketWorkTypeFilter");
const ticketResetFiltersBtn =
    document.getElementById("ticketResetFiltersBtn");
const ticketExportBtn =
    document.getElementById("ticketExportBtn");

const ticketSummary =
    document.getElementById("ticketSummary");
const ticketLoadedCount =
    document.getElementById("ticketLoadedCount");
const ticketIncludedCount =
    document.getElementById("ticketIncludedCount");
const ticketAverageResolution =
    document.getElementById("ticketAverageResolution");
const ticketMedianResolution =
    document.getElementById("ticketMedianResolution");
const ticketActualTime =
    document.getElementById("ticketActualTime");
const ticketDurationCoverage =
    document.getElementById("ticketDurationCoverage");

const ticketResultsPanel =
    document.getElementById("ticketResultsPanel");
const ticketEmployeeBody =
    document.getElementById("ticketEmployeeBody");
const ticketPriorityBody =
    document.getElementById("ticketPriorityBody");
const ticketWorkTypeBody =
    document.getElementById("ticketWorkTypeBody");
const ticketMatrixHead =
    document.getElementById("ticketMatrixHead");
const ticketMatrixBody =
    document.getElementById("ticketMatrixBody");
const ticketDetailsBody =
    document.getElementById("ticketDetailsBody");

const combinedPanel =
    document.getElementById("combinedPanel");
const combinedBody =
    document.getElementById("combinedBody");

initTicketAnalytics();

function initTicketAnalytics() {
    ticketFileInput.addEventListener(
        "change",
        handleTicketFileUpload
    );

    ticketEmployeeFilter.addEventListener(
        "change",
        applyTicketFilters
    );

    ticketPriorityFilter.addEventListener(
        "change",
        applyTicketFilters
    );

    ticketWorkTypeFilter.addEventListener(
        "change",
        applyTicketFilters
    );

    ticketResetFiltersBtn.addEventListener(
        "click",
        resetTicketFilters
    );

    ticketExportBtn.addEventListener(
        "click",
        exportTicketCsv
    );

    window.addEventListener(
        "chat-analysis-updated",
        event => {
            latestChatResults =
                Array.isArray(event.detail?.results)
                    ? event.detail.results
                    : [];

            renderCombinedWorkload();
        }
    );
}

// ===============================
// ЗАГРУЗКА XLS / XLSX
// ===============================

function handleTicketFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    if (typeof XLSX === "undefined") {
        showTicketStatus(
            "Не подключена библиотека чтения Excel. Проверьте файл xlsx.full.min.js.",
            "error"
        );
        resetTicketData();
        return;
    }

    const reader = new FileReader();

    reader.onload = function(loadEvent) {
        try {
            const workbook = XLSX.read(
                loadEvent.target.result,
                {
                    type: "array",
                    cellDates: false
                }
            );

            const parsed = parseTicketWorkbook(workbook);

            ticketRecords = parsed.records;
            ticketPauseColumnFound =
                parsed.pauseColumnFound;

            if (ticketRecords.length === 0) {
                throw new Error(
                    "В файле не найдено строк с тикетами."
                );
            }

            fillTicketFilters(ticketRecords);
            applyTicketFilters();

            const completedCount =
                ticketRecords.filter(
                    ticket => ticket.isCompleted
                ).length;

            const validCount =
                ticketRecords.filter(
                    ticket =>
                        ticket.isCompleted &&
                        ticket.hasValidResolution
                ).length;

            const invalidCompleted =
                completedCount - validCount;

            const messages = [
                `Файл загружен: ${ticketRecords.length} тикетов.`,
                `В расчёт включено: ${validCount} завершённых тикетов.`
            ];

            if (invalidCompleted > 0) {
                messages.push(
                    `${invalidCompleted} завершённых тикетов исключено из-за некорректных дат.`
                );
            }

            if (!ticketPauseColumnFound) {
                messages.push(
                    "В файле нет поля длительности пауз: паузы приняты равными нулю."
                );
            }

            const durationFilledCount =
                ticketRecords.filter(
                    ticket =>
                        ticket.isCompleted &&
                        ticket.hasValidResolution &&
                        ticket.durationFilled
                ).length;

            if (durationFilledCount === 0) {
                messages.push(
                    "Поле «Длительность» пока не заполнено."
                );
            }

            showTicketStatus(
                messages.join(" "),
                !ticketPauseColumnFound
                    ? "warning"
                    : "success"
            );
        } catch (error) {
            console.error(
                "Ошибка чтения файла тикетов:",
                error
            );

            resetTicketData();

            showTicketStatus(
                "Не удалось прочитать файл тикетов. " +
                error.message,
                "error"
            );
        }
    };

    reader.onerror = function() {
        resetTicketData();
        showTicketStatus(
            "Не удалось прочитать выбранный файл.",
            "error"
        );
    };

    reader.readAsArrayBuffer(file);
}

function parseTicketWorkbook(workbook) {
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(
            sheet,
            {
                header: 1,
                defval: "",
                raw: false,
                blankrows: false
            }
        );

        const headerRowIndex =
            findTicketHeaderRow(rows);

        if (headerRowIndex === -1) {
            continue;
        }

        const headerMap =
            buildTicketHeaderMap(
                rows[headerRowIndex]
            );

        validateRequiredTicketColumns(headerMap);

        const records = [];

        for (
            let rowIndex = headerRowIndex + 1;
            rowIndex < rows.length;
            rowIndex++
        ) {
            const record = normalizeTicketRow(
                rows[rowIndex],
                headerMap,
                rowIndex
            );

            if (record) {
                records.push(record);
            }
        }

        return {
            records,
            pauseColumnFound:
                Number.isInteger(
                    headerMap.pauseDuration
                )
        };
    }

    throw new Error(
        "Не найдена строка заголовков с полями «№», «Статус», «Исполнитель», «Длительность», «Заявка открыта» и «Заявка закрыта»."
    );
}

function findTicketHeaderRow(rows) {
    return rows.findIndex(row => {
        if (!Array.isArray(row)) {
            return false;
        }

        const headers = new Set(
            row.map(normalizeTicketHeader)
        );

        return (
            hasHeaderAlias(headers, "number") &&
            hasHeaderAlias(headers, "status") &&
            hasHeaderAlias(headers, "employee") &&
            hasHeaderAlias(headers, "duration") &&
            hasHeaderAlias(headers, "openedAt") &&
            hasHeaderAlias(headers, "closedAt")
        );
    });
}

function hasHeaderAlias(headers, fieldName) {
    return TICKET_HEADER_ALIASES[fieldName]
        .map(normalizeTicketHeader)
        .some(alias => headers.has(alias));
}

function buildTicketHeaderMap(headerRow) {
    const normalizedHeaders =
        headerRow.map(normalizeTicketHeader);

    const map = {};

    Object
        .entries(TICKET_HEADER_ALIASES)
        .forEach(([fieldName, aliases]) => {
            const normalizedAliases =
                aliases.map(normalizeTicketHeader);

            const index =
                normalizedHeaders.findIndex(
                    header =>
                        normalizedAliases.includes(
                            header
                        )
                );

            if (index !== -1) {
                map[fieldName] = index;
            }
        });

    return map;
}

function validateRequiredTicketColumns(headerMap) {
    const required = [
        ["number", "№"],
        ["status", "Статус"],
        ["priority", "Приоритет"],
        ["workType", "Вид работ"],
        ["employee", "Исполнитель"],
        ["duration", "Длительность"],
        ["openedAt", "Заявка открыта"],
        ["closedAt", "Заявка закрыта"]
    ];

    const missing = required
        .filter(([fieldName]) =>
            !Number.isInteger(headerMap[fieldName])
        )
        .map(([, title]) => title);

    if (missing.length > 0) {
        throw new Error(
            "В файле отсутствуют обязательные поля: " +
            missing.join(", ") +
            "."
        );
    }
}

function normalizeTicketRow(
    row,
    headerMap,
    sourceRowIndex
) {
    const getValue = fieldName => {
        const columnIndex =
            headerMap[fieldName];

        if (!Number.isInteger(columnIndex)) {
            return "";
        }

        return row[columnIndex] ?? "";
    };

    const number =
        cleanTicketText(getValue("number"));
    const status =
        cleanTicketText(getValue("status"));
    const employee =
        cleanTicketText(getValue("employee"));
    const openedRaw =
        cleanTicketText(getValue("openedAt"));

    // Итоги и служебные строки отчёта не содержат
    // одновременно номер, статус, исполнителя и дату открытия.
    if (
        !number ||
        !status ||
        !employee ||
        !openedRaw
    ) {
        return null;
    }

    const closedRaw =
        cleanTicketText(getValue("closedAt"));

    const openedAt =
        parseTicketDate(openedRaw);
    const closedAt =
        parseTicketDate(closedRaw);

    const duration =
        parseTicketDuration(
            getValue("duration"),
            true
        );

    const pause =
        Number.isInteger(headerMap.pauseDuration)
            ? parseTicketDuration(
                getValue("pauseDuration"),
                false
            )
            : {
                seconds: 0,
                filled: false,
                valid: true
            };

    const isCompleted =
        COMPLETED_TICKET_STATUSES.has(
            normalizeTicketValue(status)
        );

    let resolutionMs = null;
    let hasValidResolution = false;

    if (
        isCompleted &&
        openedAt &&
        closedAt
    ) {
        const grossMs =
            closedAt.getTime() -
            openedAt.getTime();

        const pauseMs =
            pause.valid
                ? pause.seconds * 1000
                : 0;

        const netMs =
            grossMs - pauseMs;

        if (
            grossMs >= 0 &&
            netMs >= 0
        ) {
            resolutionMs = netMs;
            hasValidResolution = true;
        }
    }

    return {
        sourceRowIndex,
        number,
        subject:
            cleanTicketText(getValue("subject")) ||
            "Без темы",
        status,
        priority:
            cleanTicketText(getValue("priority")) ||
            "Не указано",
        workType:
            cleanTicketText(getValue("workType")) ||
            "Не указано",
        employee,
        openedRaw,
        closedRaw,
        openedAt,
        closedAt,
        durationRaw:
            cleanTicketText(getValue("duration")),
        durationSeconds: duration.seconds,
        durationFilled:
            duration.filled &&
            duration.valid,
        pauseRaw:
            cleanTicketText(
                getValue("pauseDuration")
            ),
        pauseSeconds:
            pause.valid
                ? pause.seconds
                : 0,
        pauseValid: pause.valid,
        isCompleted,
        resolutionMs,
        hasValidResolution
    };
}

// ===============================
// ПАРСИНГ ДАТ И ДЛИТЕЛЬНОСТЕЙ
// ===============================

function parseTicketDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : value;
    }

    if (
        typeof value === "number" &&
        typeof XLSX !== "undefined"
    ) {
        const parsed =
            XLSX.SSF.parse_date_code(value);

        if (parsed) {
            return new Date(
                Date.UTC(
                    parsed.y,
                    parsed.m - 1,
                    parsed.d,
                    parsed.H || 0,
                    parsed.M || 0,
                    Math.floor(parsed.S || 0)
                )
            );
        }
    }

    const text =
        cleanTicketText(value);

    const ruMatch = text.match(
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:([+-])(\d{2}):?(\d{2}))?$/
    );

    if (ruMatch) {
        const [
            ,
            day,
            month,
            year,
            hours,
            minutes,
            seconds = "0",
            offsetSign,
            offsetHours,
            offsetMinutes
        ] = ruMatch;

        let timestamp = Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hours),
            Number(minutes),
            Number(seconds)
        );

        if (offsetSign) {
            const offsetMs =
                (
                    Number(offsetHours) * 60 +
                    Number(offsetMinutes)
                ) *
                60 *
                1000;

            timestamp +=
                offsetSign === "+"
                    ? -offsetMs
                    : offsetMs;
        }

        return new Date(timestamp);
    }

    const isoTimestamp =
        Date.parse(text);

    if (!Number.isNaN(isoTimestamp)) {
        return new Date(isoTimestamp);
    }

    return null;
}

function parseTicketDuration(
    value,
    zeroMeansMissing
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return {
            seconds: 0,
            filled: false,
            valid: true
        };
    }

    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        const seconds =
            Math.max(
                0,
                Math.round(value * 86400)
            );

        return {
            seconds,
            filled:
                !zeroMeansMissing ||
                seconds > 0,
            valid: true
        };
    }

    const text = cleanTicketText(value)
        .toLowerCase()
        .replaceAll(",", ".");

    if (
        !text ||
        text === "-" ||
        text === "—"
    ) {
        return {
            seconds: 0,
            filled: false,
            valid: true
        };
    }

    let days = 0;
    let timeText = text;

    const dayMatch =
        timeText.match(
            /^(\d+)\s*д(?:н(?:я|ей)?)?\s*(.*)$/
        );

    if (dayMatch) {
        days = Number(dayMatch[1]);
        timeText = dayMatch[2].trim();
    }

    const parts =
        timeText.split(":");

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (
        parts.length === 2 &&
        parts.every(part => /^\d+$/.test(part))
    ) {
        hours = Number(parts[0]);
        minutes = Number(parts[1]);
    } else if (
        parts.length === 3 &&
        parts.every(part => /^\d+$/.test(part))
    ) {
        hours = Number(parts[0]);
        minutes = Number(parts[1]);
        seconds = Number(parts[2]);
    } else {
        const minuteMatch =
            timeText.match(
                /^(\d+(?:\.\d+)?)\s*мин/
            );

        if (minuteMatch) {
            seconds = Math.round(
                Number(minuteMatch[1]) * 60
            );
        } else {
            return {
                seconds: 0,
                filled: false,
                valid: false
            };
        }
    }

    if (
        minutes >= 60 ||
        seconds >= 60
    ) {
        return {
            seconds: 0,
            filled: false,
            valid: false
        };
    }

    const totalSeconds =
        days * 86400 +
        hours * 3600 +
        minutes * 60 +
        seconds;

    return {
        seconds: totalSeconds,
        filled:
            !zeroMeansMissing ||
            totalSeconds > 0,
        valid: true
    };
}

// ===============================
// ФИЛЬТРЫ
// ===============================

function fillTicketFilters(records) {
    const included = records.filter(
        ticket =>
            ticket.isCompleted &&
            ticket.hasValidResolution
    );

    fillTicketSelect(
        ticketEmployeeFilter,
        uniqueTicketValues(
            included.map(ticket => ticket.employee)
        ),
        "Все сотрудники"
    );

    fillTicketSelect(
        ticketPriorityFilter,
        uniqueTicketValues(
            included.map(ticket => ticket.priority)
        ),
        "Все приоритеты"
    );

    fillTicketSelect(
        ticketWorkTypeFilter,
        uniqueTicketValues(
            included.map(ticket => ticket.workType)
        ),
        "Все виды работ"
    );

    ticketFiltersPanel.hidden = false;
}

function fillTicketSelect(
    select,
    values,
    allLabel
) {
    select.innerHTML = "";

    const allOption =
        document.createElement("option");

    allOption.value = "";
    allOption.textContent = allLabel;
    select.appendChild(allOption);

    values.forEach(value => {
        const option =
            document.createElement("option");

        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function applyTicketFilters() {
    const employee =
        ticketEmployeeFilter.value;
    const priority =
        ticketPriorityFilter.value;
    const workType =
        ticketWorkTypeFilter.value;

    filteredTicketRecords =
        ticketRecords.filter(ticket => {
            if (
                !ticket.isCompleted ||
                !ticket.hasValidResolution
            ) {
                return false;
            }

            if (
                employee &&
                ticket.employee !== employee
            ) {
                return false;
            }

            if (
                priority &&
                ticket.priority !== priority
            ) {
                return false;
            }

            if (
                workType &&
                ticket.workType !== workType
            ) {
                return false;
            }

            return true;
        });

    renderTicketAnalytics(
        filteredTicketRecords
    );
}

function resetTicketFilters() {
    ticketEmployeeFilter.value = "";
    ticketPriorityFilter.value = "";
    ticketWorkTypeFilter.value = "";
    applyTicketFilters();
}

// ===============================
// РАСЧЁТ И ОТРИСОВКА
// ===============================

function renderTicketAnalytics(tickets) {
    renderTicketSummary(tickets);

    renderTicketGroupTable({
        tickets,
        groupField: "employee",
        tbody: ticketEmployeeBody,
        emptyColspan: 7,
        includeShare: false
    });

    renderTicketGroupTable({
        tickets,
        groupField: "priority",
        tbody: ticketPriorityBody,
        emptyColspan: 8,
        includeShare: true
    });

    renderTicketGroupTable({
        tickets,
        groupField: "workType",
        tbody: ticketWorkTypeBody,
        emptyColspan: 8,
        includeShare: true
    });

    renderTicketMatrix(tickets);
    renderTicketDetails(tickets);

    ticketSummary.hidden = false;
    ticketResultsPanel.hidden = false;
    ticketExportBtn.disabled =
        tickets.length === 0;

    renderCombinedWorkload();
}

function renderTicketSummary(tickets) {
    const resolutionValues =
        tickets.map(
            ticket => ticket.resolutionMs
        );

    const durationTickets =
        tickets.filter(
            ticket => ticket.durationFilled
        );

    const totalDurationMs =
        durationTickets.reduce(
            (sum, ticket) =>
                sum +
                ticket.durationSeconds * 1000,
            0
        );

    ticketLoadedCount.textContent =
        ticketRecords.length;
    ticketIncludedCount.textContent =
        tickets.length;
    ticketAverageResolution.textContent =
        resolutionValues.length > 0
            ? formatTicketDuration(
                averageTicketValue(
                    resolutionValues
                )
            )
            : "—";
    ticketMedianResolution.textContent =
        resolutionValues.length > 0
            ? formatTicketDuration(
                medianTicketValue(
                    resolutionValues
                )
            )
            : "—";
    ticketActualTime.textContent =
        durationTickets.length > 0
            ? formatTicketDuration(
                totalDurationMs
            )
            : "Не заполнено";

    const coveragePercent =
        tickets.length > 0
            ? Math.round(
                durationTickets.length /
                tickets.length *
                100
            )
            : 0;

    ticketDurationCoverage.textContent =
        `${durationTickets.length} из ` +
        `${tickets.length} (${coveragePercent}%)`;
}

function renderTicketGroupTable({
    tickets,
    groupField,
    tbody,
    emptyColspan,
    includeShare
}) {
    tbody.innerHTML = "";

    if (tickets.length === 0) {
        renderTicketEmptyRow(
            tbody,
            emptyColspan
        );
        return;
    }

    const groups = new Map();

    tickets.forEach(ticket => {
        const groupName =
            ticket[groupField] ||
            "Не указано";

        if (!groups.has(groupName)) {
            groups.set(groupName, []);
        }

        groups.get(groupName).push(ticket);
    });

    const rows = Array.from(groups.entries())
        .map(([groupName, groupTickets]) => {
            const resolutionValues =
                groupTickets.map(
                    ticket =>
                        ticket.resolutionMs
                );

            const durationTickets =
                groupTickets.filter(
                    ticket =>
                        ticket.durationFilled
                );

            const durationValues =
                durationTickets.map(
                    ticket =>
                        ticket.durationSeconds *
                        1000
                );

            return {
                groupName,
                ticketsCount:
                    groupTickets.length,
                share:
                    groupTickets.length /
                    tickets.length,
                averageResolution:
                    averageTicketValue(
                        resolutionValues
                    ),
                medianResolution:
                    medianTicketValue(
                        resolutionValues
                    ),
                totalDuration:
                    durationValues.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    ),
                averageDuration:
                    durationValues.length > 0
                        ? averageTicketValue(
                            durationValues
                        )
                        : null,
                durationFilled:
                    durationValues.length
            };
        })
        .sort((a, b) =>
            b.ticketsCount -
            a.ticketsCount ||
            a.groupName.localeCompare(
                b.groupName,
                "ru"
            )
        );

    rows.forEach(row => {
        const tr =
            document.createElement("tr");

        const shareCell =
            includeShare
                ? `<td>${formatTicketPercent(row.share)}</td>`
                : "";

        tr.innerHTML = `
            <td>${escapeTicketHtml(row.groupName)}</td>
            <td>${row.ticketsCount}</td>
            ${shareCell}
            <td>${formatTicketDuration(row.averageResolution)}</td>
            <td>${formatTicketDuration(row.medianResolution)}</td>
            <td>${
                row.durationFilled > 0
                    ? formatTicketDuration(row.totalDuration)
                    : "Не заполнено"
            }</td>
            <td>${
                row.durationFilled > 0
                    ? formatTicketDuration(row.averageDuration)
                    : "Не заполнено"
            }</td>
            <td>${row.durationFilled} из ${row.ticketsCount}</td>
        `;

        tbody.appendChild(tr);
    });
}

function renderTicketMatrix(tickets) {
    ticketMatrixHead.innerHTML = "";
    ticketMatrixBody.innerHTML = "";

    if (tickets.length === 0) {
        const headRow =
            document.createElement("tr");

        headRow.innerHTML =
            "<th>Вид работ</th><th>Всего</th>";
        ticketMatrixHead.appendChild(headRow);

        renderTicketEmptyRow(
            ticketMatrixBody,
            2
        );
        return;
    }

    const priorities =
        uniqueTicketValues(
            tickets.map(
                ticket => ticket.priority
            )
        );

    const workTypes =
        uniqueTicketValues(
            tickets.map(
                ticket => ticket.workType
            )
        );

    const headRow =
        document.createElement("tr");

    headRow.innerHTML =
        "<th>Вид работ</th>" +
        priorities
            .map(priority =>
                `<th>${escapeTicketHtml(priority)}</th>`
            )
            .join("") +
        "<th>Всего</th>";

    ticketMatrixHead.appendChild(headRow);

    workTypes.forEach(workType => {
        const tr =
            document.createElement("tr");

        const counts =
            priorities.map(priority =>
                tickets.filter(ticket =>
                    ticket.workType === workType &&
                    ticket.priority === priority
                ).length
            );

        const total =
            counts.reduce(
                (sum, value) => sum + value,
                0
            );

        tr.innerHTML =
            `<td>${escapeTicketHtml(workType)}</td>` +
            counts
                .map(count =>
                    `<td>${count}</td>`
                )
                .join("") +
            `<td><b>${total}</b></td>`;

        ticketMatrixBody.appendChild(tr);
    });
}

function renderTicketDetails(tickets) {
    ticketDetailsBody.innerHTML = "";

    if (tickets.length === 0) {
        renderTicketEmptyRow(
            ticketDetailsBody,
            10
        );
        return;
    }

    tickets
        .slice()
        .sort((a, b) =>
            a.openedAt - b.openedAt
        )
        .forEach(ticket => {
            const tr =
                document.createElement("tr");

            const pauseText =
                ticketPauseColumnFound
                    ? formatTicketDuration(
                        ticket.pauseSeconds *
                        1000
                    )
                    : "Нет данных";

            tr.innerHTML = `
                <td>${escapeTicketHtml(ticket.number)}</td>
                <td>${escapeTicketHtml(ticket.subject)}</td>
                <td>${escapeTicketHtml(ticket.employee)}</td>
                <td>${escapeTicketHtml(ticket.priority)}</td>
                <td>${escapeTicketHtml(ticket.workType)}</td>
                <td>${escapeTicketHtml(ticket.openedRaw)}</td>
                <td>${escapeTicketHtml(ticket.closedRaw)}</td>
                <td>${escapeTicketHtml(pauseText)}</td>
                <td>${formatTicketDuration(ticket.resolutionMs)}</td>
                <td>${
                    ticket.durationFilled
                        ? formatTicketDuration(
                            ticket.durationSeconds *
                            1000
                        )
                        : "Не заполнено"
                }</td>
            `;

            ticketDetailsBody.appendChild(tr);
        });
}

function renderTicketEmptyRow(
    tbody,
    colspan
) {
    const tr =
        document.createElement("tr");

    tr.innerHTML = `
        <td colspan="${colspan}">
            Нет завершённых тикетов для выбранных фильтров.
        </td>
    `;

    tbody.appendChild(tr);
}

// ===============================
// ОБЩАЯ ЗАГРУЗКА: ЧАТЫ + ТИКЕТЫ
// ===============================

function renderCombinedWorkload() {
    const employees = new Map();

    latestChatResults.forEach(item => {
        const key =
            normalizeTicketValue(
                item.employee
            );

        if (!employees.has(key)) {
            employees.set(key, {
                employee: item.employee,
                chatMs: 0,
                ticketMs: 0,
                ticketCount: 0,
                durationFilled: 0
            });
        }

        employees.get(key).chatMs +=
            Number(item.activeMs) || 0;
    });

    filteredTicketRecords.forEach(ticket => {
        const key =
            normalizeTicketValue(
                ticket.employee
            );

        if (!employees.has(key)) {
            employees.set(key, {
                employee: ticket.employee,
                chatMs: 0,
                ticketMs: 0,
                ticketCount: 0,
                durationFilled: 0
            });
        }

        const employee =
            employees.get(key);

        employee.ticketCount++;

        if (ticket.durationFilled) {
            employee.ticketMs +=
                ticket.durationSeconds *
                1000;
            employee.durationFilled++;
        }
    });

    combinedBody.innerHTML = "";

    const rows =
        Array.from(employees.values())
            .sort((a, b) =>
                (
                    b.chatMs +
                    b.ticketMs
                ) -
                (
                    a.chatMs +
                    a.ticketMs
                )
            );

    if (rows.length === 0) {
        combinedPanel.hidden = true;
        return;
    }

    rows.forEach(row => {
        const tr =
            document.createElement("tr");

        const ticketTime =
            row.ticketCount === 0
                ? "Нет тикетов"
                : row.durationFilled > 0
                    ? formatTicketDuration(
                        row.ticketMs
                    )
                    : "Не заполнено";

        const totalKnownMs =
            row.chatMs +
            row.ticketMs;

        const completeness =
            row.ticketCount === 0
                ? "Тикетов нет"
                : `${row.durationFilled} из ${row.ticketCount}`;

        tr.innerHTML = `
            <td>${escapeTicketHtml(row.employee)}</td>
            <td>${formatTicketDuration(row.chatMs)}</td>
            <td>${escapeTicketHtml(ticketTime)}</td>
            <td>${formatTicketDuration(totalKnownMs)}</td>
            <td>${completeness}</td>
        `;

        combinedBody.appendChild(tr);
    });

    combinedPanel.hidden = false;
}

// ===============================
// ЭКСПОРТ ТИКЕТОВ
// ===============================

function exportTicketCsv() {
    if (filteredTicketRecords.length === 0) {
        alert(
            "Нет завершённых тикетов для экспорта."
        );
        return;
    }

    const rows = [[
        "№",
        "Тема",
        "Исполнитель",
        "Приоритет",
        "Вид работ",
        "Статус",
        "Заявка открыта",
        "Заявка закрыта",
        "Пауза, секунд",
        "Время решения без пауз, минут",
        "Длительность работы, минут"
    ]];

    filteredTicketRecords.forEach(ticket => {
        rows.push([
            ticket.number,
            ticket.subject,
            ticket.employee,
            ticket.priority,
            ticket.workType,
            ticket.status,
            ticket.openedRaw,
            ticket.closedRaw,
            ticketPauseColumnFound
                ? ticket.pauseSeconds
                : "",
            roundTicketNumber(
                ticket.resolutionMs /
                1000 /
                60
            ),
            ticket.durationFilled
                ? roundTicketNumber(
                    ticket.durationSeconds /
                    60
                )
                : ""
        ]);
    });

    const csvContent = rows
        .map(row =>
            row
                .map(escapeTicketCsvValue)
                .join(";")
        )
        .join("\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
            type:
                "text/csv;charset=utf-8;"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        "time_extractor_tickets.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// ===============================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===============================

function resetTicketData() {
    ticketRecords = [];
    filteredTicketRecords = [];
    ticketPauseColumnFound = false;

    ticketFiltersPanel.hidden = true;
    ticketSummary.hidden = true;
    ticketResultsPanel.hidden = true;
    ticketExportBtn.disabled = true;

    renderCombinedWorkload();
}

function showTicketStatus(
    message,
    type
) {
    ticketStatus.textContent = message;
    ticketStatus.className =
        `ticket-status ${type}`;
    ticketStatus.hidden = false;
}

function normalizeTicketHeader(value) {
    return cleanTicketText(value)
        .toLowerCase()
        .replaceAll("ё", "е");
}

function normalizeTicketValue(value) {
    return cleanTicketText(value)
        .toLowerCase()
        .replaceAll("ё", "е");
}

function cleanTicketText(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("\u00A0", " ")
        .replace(/\s+/g, " ")
        .trim();
}

function uniqueTicketValues(values) {
    return Array.from(
        new Set(
            values
                .map(cleanTicketText)
                .filter(Boolean)
        )
    ).sort((a, b) =>
        a.localeCompare(b, "ru")
    );
}

function averageTicketValue(values) {
    if (!values || values.length === 0) {
        return null;
    }

    return values.reduce(
        (sum, value) => sum + value,
        0
    ) / values.length;
}

function medianTicketValue(values) {
    if (!values || values.length === 0) {
        return null;
    }

    const sorted =
        values.slice().sort((a, b) => a - b);

    const middle =
        Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (
            sorted[middle - 1] +
            sorted[middle]
        ) / 2;
    }

    return sorted[middle];
}

function formatTicketDuration(ms) {
    if (
        ms === null ||
        ms === undefined ||
        Number.isNaN(ms)
    ) {
        return "—";
    }

    if (ms <= 0) {
        return "0 сек";
    }

    const totalSeconds =
        Math.round(ms / 1000);

    const days =
        Math.floor(
            totalSeconds / 86400
        );

    const hours =
        Math.floor(
            (
                totalSeconds % 86400
            ) /
            3600
        );

    const minutes =
        Math.floor(
            (
                totalSeconds % 3600
            ) /
            60
        );

    const seconds =
        totalSeconds % 60;

    if (days > 0) {
        return (
            `${days} д ` +
            `${hours} ч ` +
            `${minutes} мин`
        );
    }

    if (hours > 0) {
        return (
            `${hours} ч ` +
            `${minutes} мин`
        );
    }

    if (minutes > 0) {
        return (
            `${minutes} мин ` +
            `${seconds} сек`
        );
    }

    return `${seconds} сек`;
}

function formatTicketPercent(value) {
    return (
        Math.round(value * 1000) /
        10
    )
        .toFixed(1)
        .replace(".", ",") + "%";
}

function roundTicketNumber(value) {
    return Math.round(value * 100) / 100;
}

function escapeTicketCsvValue(value) {
    const stringValue =
        String(value ?? "");

    if (
        stringValue.includes(";") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {
        return (
            `"${stringValue.replaceAll(
                '"',
                '""'
            )}"`
        );
    }

    return stringValue;
}

function escapeTicketHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}