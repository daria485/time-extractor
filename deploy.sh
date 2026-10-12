#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
fail() { echo "ОШИБКА: $*" >&2; exit 1; }

[ "$(git branch --show-current)" = "main" ] || fail "Обновление разрешено только из ветки main."
[ "$(git remote get-url origin)" = "https://github.com/daria485/time-extractor.git" ] || fail "Проверьте адрес origin."
[ -z "$(git status --porcelain)" ] || fail "Есть локальные изменения. Обновление остановлено; файлы сохранены."
docker compose version >/dev/null
docker info >/dev/null
git pull --ff-only origin main
docker compose config --quiet
if ! docker compose up -d --build --wait --wait-timeout 60; then
    docker compose ps
    docker compose logs --tail=50 app
    fail "Запуск не прошёл проверку. Автоматический откат не выполнялся."
fi
if ! docker compose exec -T app node -e '
(async () => {
  for (const p of ["/health", "/", "/app.js", "/style.css", "/tickets.js", "/xlsx.full.min.js"]) {
    const r = await fetch("http://127.0.0.1:3000" + p);
    if (!r.ok) throw new Error(p + ": HTTP " + r.status);
    if (p === "/health") {
      if ((await r.json()).status !== "ok") throw new Error("health");
    } else await r.arrayBuffer();
  }
})().catch(e => { console.error(e.message); process.exit(1); });
'; then
    fail "Проверка интерфейса не пройдена."
fi
docker compose ps
echo "Обновление успешно. Коммит: $(git rev-parse --short HEAD)"
echo "Проверьте страницу в браузере по адресу сервера и порту из compose.yaml/.env (по умолчанию 8080)."

