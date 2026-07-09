// ===============================
// TIME EXTRACTOR LOCAL PROXY
// Локальный прокси для загрузки диалогов из HTTP-сервиса 1С
// ===============================

const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/api/dialogs") {
        try {
            const body = await readRequestBody(req);
            const params = JSON.parse(body);

            const result = await loadDialogsFromOneC(params);

            res.writeHead(200, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(result);
            return;

        } catch (error) {
            console.error("Ошибка загрузки данных:", error);

            res.writeHead(500, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                error: true,
                message: error.message
            }));
            return;
        }
    }

    res.writeHead(404, {
        "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
        error: true,
        message: "Маршрут не найден"
    }));
});

server.listen(PORT, () => {
    console.log(`Time extractor proxy запущен на порту ${PORT}`);
});

function setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            resolve(body);
        });

        req.on("error", error => {
            reject(error);
        });
    });
}

function loadDialogsFromOneC(params) {
    return new Promise((resolve, reject) => {
        const apiUrl = cleanText(params.apiUrl);
        const lineId = cleanText(params.lineId);
        const dateFrom = cleanText(params.dateFrom);
        const dateTo = cleanText(params.dateTo);
        const login = cleanText(params.login);
        const password = String(params.password || "");

        if (!apiUrl) {
            reject(new Error("Не указан URL HTTP-сервиса 1С"));
            return;
        }

        if (!lineId) {
            reject(new Error("Не указана линия"));
            return;
        }

        if (!dateFrom || !dateTo) {
            reject(new Error("Не указан период"));
            return;
        }

        if (!login || !password) {
            reject(new Error("Не указан логин или пароль"));
            return;
        }

        const requestUrl = buildOneCApiUrl({
            apiUrl,
            lineId,
            dateFrom,
            dateTo
        });

        console.log("Запрос в 1С:", requestUrl);

        const url = new URL(requestUrl);

        const authString = Buffer
            .from(`${login}:${password}`, "utf8")
            .toString("base64");

        const options = {
            method: "GET",
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                "Authorization": `Basic ${authString}`,
                "Accept": "application/json"
            }
        };

        const client = url.protocol === "https:" ? https : http;

        const request = client.request(options, response => {
            let responseBody = "";

            response.setEncoding("utf8");

            response.on("data", chunk => {
                responseBody += chunk;
            });

            response.on("end", () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`1С вернула ошибку HTTP ${response.statusCode}: ${responseBody}`));
                    return;
                }

                try {
                    JSON.parse(responseBody);
                } catch (error) {
                    reject(new Error("1С вернула ответ, но это не JSON. Ответ: " + responseBody.slice(0, 500)));
                    return;
                }

                resolve(responseBody);
            });
        });

        request.on("error", error => {
            reject(error);
        });

        request.end();
    });
}

function buildOneCApiUrl(params) {
    const url = new URL(params.apiUrl);

    url.searchParams.set("line", params.lineId);
    url.searchParams.set("StartDate", formatDateForOneC(params.dateFrom));
    url.searchParams.set("EndDate", formatDateForOneC(params.dateTo));

    return url.toString();
}

function formatDateForOneC(dateValue) {
    return String(dateValue || "").replaceAll("-", ".");
}

function cleanText(value) {
    if (!value) {
        return "";
    }

    return String(value).replace(/\s+/g, " ").trim();
}