"use strict";

// Отдельный сервер интерфейса: существующий server.js сохранён.
// Прокси к 1С отключён до настройки разрешённых адресов.
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT должен быть числом от 1 до 65535");
}
const assets = new Map([
    ["/", ["index.html", "text/html; charset=utf-8"]],
    ["/index.html", ["index.html", "text/html; charset=utf-8"]],
    ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
    ["/tickets.js", ["tickets.js", "text/javascript; charset=utf-8"]],
    ["/style.css", ["style.css", "text/css; charset=utf-8"]],
    ["/xlsx.full.min.js", ["xlsx.full.min.js", "text/javascript; charset=utf-8"]],
    ["/XLSX-LICENSE.txt", ["XLSX-LICENSE.txt", "text/plain; charset=utf-8"]]
]);

function json(res, status, data, head = false) {
    const body = Buffer.from(JSON.stringify(data));
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": body.length
    });
    res.end(head ? undefined : body);
}

const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    let pathname;
    try {
        pathname = new URL(req.url, "http://localhost").pathname;
    } catch {
        json(res, 400, { error: true, message: "Неверный адрес запроса" });
        return;
    }
    if (pathname.startsWith("/api/")) {
        req.resume();
        json(res, 503, {
            error: true,
            message: "Загрузка из 1С пока отключена. Используйте загрузку из файла."
        }, req.method === "HEAD");
        return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
        req.resume();
        res.setHeader("Allow", "GET, HEAD");
        json(res, 405, { error: true, message: "Метод не разрешён" });
        return;
    }
    const head = req.method === "HEAD";
    if (pathname === "/health") {
        try {
            await Promise.all([...assets.values()].map(([file]) =>
                fs.access(path.join(__dirname, file))));
            json(res, 200, { status: "ok", mode: "interface" }, head);
        } catch {
            json(res, 503, { status: "error", message: "Не хватает файлов интерфейса" }, head);
        }
        return;
    }
    const asset = assets.get(pathname);
    if (!asset) {
        json(res, 404, { error: true, message: "Страница не найдена" }, head);
        return;
    }
    try {
        const body = await fs.readFile(path.join(__dirname, asset[0]));
        res.writeHead(200, {
            "Content-Type": asset[1],
            "Content-Length": body.length
        });
        res.end(head ? undefined : body);
    } catch {
        json(res, 500, { error: true, message: "Не удалось прочитать файл интерфейса" }, head);
    }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, "0.0.0.0", () =>
    console.log("Time extractor: интерфейс запущен, порт " + port));
function stop() {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);

