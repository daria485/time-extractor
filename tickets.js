// ===============================
// TICKETS
// Расчёт времени завершённых тикетов
// ===============================

(() => {
    "use strict";

    const HEADER_ALIASES = {
        number: ["№", "номер", "номер заявки", "номер тикета"],
        status: ["статус"],
        priority: ["приоритет"],
        workType: ["вид работ", "тип работ"],
        employee: ["исполнитель", "ответственный"],
        duration: [
            "длительность",
            "длительность выполнения",
            "длительность работ",
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

    const COMPLETED_STATUSES = new Set([
        "завершена",
        "завершен",
        "завершено",
        "закрыта",
        "закрыт",
        "закрыто",
        "выполнена",
        "выполнен",
        "выполнено"
    ]);

    const elements = {
        fileInput: document.getElementById("ticketFileInput"),
        status: document.getElementById("ticketStatus"),
        summary: document.getElementById("ticketSummary"),
        loadedCount: document.getElementById("ticketLoadedCount"),
        includedCount: document.getElementById("ticketIncludedCount"),
        totalResolution: document.getElementById("ticketTotalResolution"),
        totalActual: document.getElementById("ticketTotalActual"),
        resultsPanel: document.getElementById("ticketResultsPanel"),
        employeeBody: document.getElementById("ticketEmployeeBody"),
        workTypeBody: document.getElementById("ticketWorkTypeBody"),
        priorityBody: document.getElementById("ticketPriorityBody")
    };

    // Модуль тикетов не должен мешать работе расчёта диалогов,
    // даже если его HTML-блок временно отсутствует.
    if (!elements.fileInput) {
        return;
    }

    elements.fileInput.addEventListener("change", handleFileUpload);

    async function handleFileUpload(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        resetResults();

        if (typeof XLSX === "undefined") {
            showStatus(
                "Не подключён файл xlsx.full.min.js. " +
                "Положите его в корень проекта рядом с index.html.",
                "error"
            );
            return;
        }

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, {
                type: "array",
                cellDates: false
            });
            const parsed = parseTicketWorkbook(workbook);
            renderResult(parsed);
        } catch (error) {
            console.error("Ошибка чтения тикетов:", error);
            resetResults();
            showStatus(
                "Не удалось прочитать файл тикетов. " + error.message,
                "error"
            );
        }
    }

    function parseTicketWorkbook(workbook) {
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
                raw: false,
                blankrows: false
            });
            const headerRowIndex = findHeaderRow(rows);

            if (headerRowIndex === -1) {
                continue;
            }

            const headerMap = buildHeaderMap(rows[headerRowIndex]);
            validateColumns(headerMap);

            const records = [];

            for (
                let rowIndex = headerRowIndex + 1;
                rowIndex < rows.length;
                rowIndex++
            ) {
                const record = normalizeRow(
                    rows[rowIndex],
                    headerMap,
                    rowIndex + 1
                );

                if (record) {
                    records.push(record);
                }
            }

            if (records.length === 0) {
                throw new Error("В таблице не найдено строк с тикетами.");
            }

            return {
                records,
                pauseColumnFound: Number.isInteger(
                    headerMap.pauseDuration
                )
            };
        }

        throw new Error(
            "Не найдена строка заголовков с полями «№», «Статус», " +
            "«Исполнитель», «Длительность», «Заявка открыта» и «Заявка закрыта»."
        );
    }

    function findHeaderRow(rows) {
        return rows.findIndex(row => {
            if (!Array.isArray(row)) {
                return false;
            }

            const headers = new Set(row.map(normalizeHeader));

            return (
                hasAlias(headers, "number") &&
                hasAlias(headers, "status") &&
                hasAlias(headers, "employee") &&
                hasAlias(headers, "duration") &&
                hasAlias(headers, "openedAt") &&
                hasAlias(headers, "closedAt")
            );
        });
    }

    function hasAlias(headers, fieldName) {
        return HEADER_ALIASES[fieldName]
            .map(normalizeHeader)
            .some(alias => headers.has(alias));
    }

    function buildHeaderMap(headerRow) {
        const normalizedHeaders = headerRow.map(normalizeHeader);
        const result = {};

        Object.entries(HEADER_ALIASES).forEach(([fieldName, aliases]) => {
            const normalizedAliases = aliases.map(normalizeHeader);
            const index = normalizedHeaders.findIndex(header =>
                normalizedAliases.includes(header)
            );

            if (index !== -1) {
                result[fieldName] = index;
            }
        });

        return result;
    }

    function validateColumns(headerMap) {
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

    function normalizeRow(row, headerMap, sourceRowNumber) {
        const getValue = fieldName => {
            const index = headerMap[fieldName];
            return Number.isInteger(index) ? row[index] ?? "" : "";
        };

        const number = cleanText(getValue("number"));
        const status = cleanText(getValue("status"));
        const employee = cleanText(getValue("employee"));
        const openedRaw = cleanText(getValue("openedAt"));

        // Строки итогов отчёта отсеиваются по обязательным значениям.
        if (!number || !status || !employee || !openedRaw) {
            return null;
        }

        const openedAt = parseDate(getValue("openedAt"));
        const closedAt = parseDate(getValue("closedAt"));
        const duration = parseDuration(getValue("duration"), true);
        const pause = Number.isInteger(headerMap.pauseDuration)
            ? parseDuration(getValue("pauseDuration"), false)
            : { seconds: 0, filled: false, valid: true };
        const isCompleted = COMPLETED_STATUSES.has(
            normalizeValue(status)
        );

        let resolutionMs = null;

        if (isCompleted && openedAt && closedAt && pause.valid) {
            const grossMs = closedAt.getTime() - openedAt.getTime();
            const netMs = grossMs - pause.seconds * 1000;

            if (grossMs >= 0 && netMs >= 0) {
                resolutionMs = netMs;
            }
        }

        return {
            sourceRowNumber,
            number,
            status,
            employee,
            priority: cleanText(getValue("priority")) || "Не указано",
            workType: cleanText(getValue("workType")) || "Не указано",
            isCompleted,
            resolutionMs,
            durationSeconds: duration.seconds,
            durationFilled: duration.valid && duration.filled
        };
    }

    function parseDate(value) {
        if (!value && value !== 0) {
            return null;
        }

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        if (typeof value === "number" && typeof XLSX !== "undefined") {
            const parsed = XLSX.SSF.parse_date_code(value);

            if (!parsed) {
                return null;
            }

            return new Date(Date.UTC(
                parsed.y,
                parsed.m - 1,
                parsed.d,
                parsed.H || 0,
                parsed.M || 0,
                Math.floor(parsed.S || 0)
            ));
        }

        const text = cleanText(value);
        const ruDate = text.match(
            /^(\d{1,2})\.(\d{1,2})\.(\d{4})[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([+-])(\d{2}):?(\d{2}))?$/
        );

        if (ruDate) {
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
            ] = ruDate;
            let timestamp = Date.UTC(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hours),
                Number(minutes),
                Number(seconds)
            );

            if (offsetSign) {
                const offsetMs = (
                    Number(offsetHours) * 60 +
                    Number(offsetMinutes)
                ) * 60 * 1000;
                timestamp += offsetSign === "+" ? -offsetMs : offsetMs;
            }

            return new Date(timestamp);
        }

        const timestamp = Date.parse(text);
        return Number.isNaN(timestamp) ? null : new Date(timestamp);
    }

    function parseDuration(value, zeroMeansMissing) {
        if (value === null || value === undefined || value === "") {
            return { seconds: 0, filled: false, valid: true };
        }

        if (typeof value === "number" && Number.isFinite(value)) {
            const seconds = Math.max(0, Math.round(value * 86400));
            return {
                seconds,
                filled: !zeroMeansMissing || seconds > 0,
                valid: true
            };
        }

        let text = cleanText(value)
            .toLowerCase()
            .replaceAll(",", ".");

        if (!text || text === "-" || text === "—") {
            return { seconds: 0, filled: false, valid: true };
        }

        let days = 0;
        const dayMatch = text.match(
            /^(\d+)\s*д(?:н(?:я|ей)?)?\s*(.*)$/
        );

        if (dayMatch) {
            days = Number(dayMatch[1]);
            text = dayMatch[2].trim();
        }

        const parts = text.split(":");
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
            const minuteMatch = text.match(/^(\d+(?:\.\d+)?)\s*мин/);

            if (!minuteMatch) {
                return { seconds: 0, filled: false, valid: false };
            }

            seconds = Math.round(Number(minuteMatch[1]) * 60);
        }

        if (
            !Number.isFinite(hours) ||
            !Number.isFinite(minutes) ||
            !Number.isFinite(seconds) ||
            minutes >= 60 ||
            seconds >= 60
        ) {
            return { seconds: 0, filled: false, valid: false };
        }

        const totalSeconds =
            days * 86400 +
            hours * 3600 +
            minutes * 60 +
            seconds;

        return {
            seconds: totalSeconds,
            filled: !zeroMeansMissing || totalSeconds > 0,
            valid: true
        };
    }

    function renderResult(parsed) {
        const completed = parsed.records.filter(record =>
            record.isCompleted &&
            record.resolutionMs !== null
        );
        const completedWithInvalidDates = parsed.records.filter(record =>
            record.isCompleted &&
            record.resolutionMs === null
        ).length;
        const totalResolutionMs = completed.reduce(
            (sum, record) => sum + record.resolutionMs,
            0
        );

        elements.loadedCount.textContent = parsed.records.length;
        elements.includedCount.textContent = completed.length;
        elements.totalResolution.textContent =
            formatDuration(totalResolutionMs);
        elements.totalActual.textContent =
            formatActualTotal(completed);

        renderAggregate(
            elements.employeeBody,
            aggregateBy(completed, record => record.employee)
        );
        renderAggregate(
            elements.workTypeBody,
            aggregateBy(completed, record => record.workType)
        );
        renderAggregate(
            elements.priorityBody,
            aggregateBy(completed, record => record.priority)
        );

        elements.summary.hidden = false;
        elements.resultsPanel.hidden = false;

        const messages = [
            `Файл загружен: ${parsed.records.length} тикетов.`,
            `В расчёт включено: ${completed.length} завершённых тикетов.`
        ];

        if (completedWithInvalidDates > 0) {
            messages.push(
                `${completedWithInvalidDates} завершённых тикетов не учтено ` +
                "из-за некорректной даты создания, закрытия или паузы."
            );
        }

        if (!parsed.pauseColumnFound) {
            messages.push(
                "В файле нет столбца с длительностью пауз, " +
                "поэтому паузы приняты равными нулю."
            );
        }

        if (!completed.some(record => record.durationFilled)) {
            messages.push(
                "Поле «Длительность» пока не заполнено."
            );
        }

        showStatus(
            messages.join(" "),
            parsed.pauseColumnFound ? "success" : "warning"
        );
    }

    function aggregateBy(records, getKey) {
        const groups = new Map();

        records.forEach(record => {
            const key = cleanText(getKey(record)) || "Не указано";

            if (!groups.has(key)) {
                groups.set(key, {
                    name: key,
                    count: 0,
                    resolutionMs: 0,
                    actualSeconds: 0,
                    actualFilledCount: 0
                });
            }

            const group = groups.get(key);
            group.count += 1;
            group.resolutionMs += record.resolutionMs;

            if (record.durationFilled) {
                group.actualSeconds += record.durationSeconds;
                group.actualFilledCount += 1;
            }
        });

        return Array.from(groups.values()).sort((a, b) => {
            if (b.resolutionMs !== a.resolutionMs) {
                return b.resolutionMs - a.resolutionMs;
            }

            return a.name.localeCompare(b.name, "ru");
        });
    }

    function renderAggregate(body, rows) {
        body.innerHTML = "";

        if (rows.length === 0) {
            const row = document.createElement("tr");
            row.innerHTML =
                '<td colspan="4">Нет завершённых тикетов для расчёта.</td>';
            body.appendChild(row);
            return;
        }

        rows.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHtml(item.name)}</td>
                <td>${item.count}</td>
                <td>${formatDuration(item.resolutionMs)}</td>
                <td>${formatActualGroup(item)}</td>
            `;
            body.appendChild(row);
        });
    }

    function formatActualTotal(records) {
        const filled = records.filter(record => record.durationFilled);

        if (filled.length === 0) {
            return "Не заполнено";
        }

        const seconds = filled.reduce(
            (sum, record) => sum + record.durationSeconds,
            0
        );
        const coverage = filled.length === records.length
            ? ""
            : ` (${filled.length} из ${records.length} тикетов)`;

        return formatDuration(seconds * 1000) + coverage;
    }

    function formatActualGroup(group) {
        if (group.actualFilledCount === 0) {
            return "Не заполнено";
        }

        const coverage = group.actualFilledCount === group.count
            ? ""
            : ` (${group.actualFilledCount} из ${group.count} тикетов)`;

        return formatDuration(group.actualSeconds * 1000) + coverage;
    }

    function formatDuration(milliseconds) {
        const totalSeconds = Math.max(
            0,
            Math.round((milliseconds || 0) / 1000)
        );
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const parts = [];

        if (days > 0) {
            parts.push(`${days} д`);
        }

        if (hours > 0 || days > 0) {
            parts.push(`${hours} ч`);
        }

        if (minutes > 0 || hours > 0 || days > 0) {
            parts.push(`${minutes} мин`);
        }

        if (seconds > 0 || parts.length === 0) {
            parts.push(`${seconds} сек`);
        }

        return parts.join(" ");
    }

    function showStatus(message, type) {
        elements.status.textContent = message;
        elements.status.className = `ticket-status ${type}`;
        elements.status.hidden = false;
    }

    function resetResults() {
        elements.summary.hidden = true;
        elements.resultsPanel.hidden = true;
        elements.status.hidden = true;
        elements.employeeBody.innerHTML = "";
        elements.workTypeBody.innerHTML = "";
        elements.priorityBody.innerHTML = "";
    }

    function cleanText(value) {
        return String(value ?? "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeValue(value) {
        return cleanText(value).toLowerCase();
    }

    function normalizeHeader(value) {
        return normalizeValue(value)
            .replace(/[.:]+$/g, "")
            .replace(/\s+/g, " ");
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    window.TimeExtractorTickets = Object.freeze({
        parseWorkbook: parseTicketWorkbook
    });
})();