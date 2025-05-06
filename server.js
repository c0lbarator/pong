// Deno KV server for Pong leaderboard API

// Открываем KV хранилище один раз при старте сервера
// Это важно делать вне обработчика requestHandler, чтобы избежать повторного открытия для каждого запроса.
const kv = await Deno.openKv();

// Централизованные заголовки для CORS
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*", // Разрешаем запросы с любого источника
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", // Разрешаем заголовок Content-Type для POST запросов
};

/**
 * Вспомогательная функция для создания успешного JSON Response с CORS заголовками.
 */
function jsonResponse(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS, // Добавляем CORS заголовки
        },
    });
}

/**
 * Вспомогательная функция для создания JSON Response с ошибкой и CORS заголовками.
 * Логирует ошибку на сервере, но возвращает клиенту более общее сообщение.
 */
function errorResponse(message: string, status = 500, errorDetails?: any): Response {
    console.error(`Server Error Occurred (${status}): ${message}`, errorDetails); // Логируем полную ошибку на сервере
    // Возвращаем клиенту сообщение без деталей внутреннего исключения
    return new Response(JSON.stringify({ success: false, error: message || "An unexpected error occurred" }), {
        status: status,
        headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS, // Добавляем CORS заголовки
        },
    });
}

/**
 * Обработчик запроса для сохранения результата игры.
 * Метод: POST
 * Путь: /api/save-result
 */
async function handleSaveResult(request: Request): Promise<Response> {
    try {
        const data = await request.json();

        // Базовая валидация входящих данных (убедимся, что есть хотя бы score и name)
        if (typeof data.playerScore !== 'number' || typeof data.playerName !== 'string') {
            return errorResponse("Invalid data format: body must contain 'playerScore' (number) and 'playerName' (string)", 400);
        }

        const timestamp = new Date().toISOString();
        const id = crypto.randomUUID(); // Генерируем уникальный ID

        // Структура ключа: ["gameResults", id]
        await kv.set(["gameResults", id], {
            ...data, // Сохраняем все данные, пришедшие от клиента
            timestamp,
            id,
        });

        console.log(`Saved game result with ID: ${id}`);
        return jsonResponse({ success: true, id });

    } catch (error: any) {
        // В случае ошибки (например, при чтении JSON), возвращаем ошибку сервера
        return errorResponse(error.message || "Failed to save game result", 500, error);
    }
}

/**
 * Обработчик запроса для получения данных лидерборда.
 * Метод: GET
 * Путь: /api/leaderboard
 */
async function handleGetLeaderboard(): Promise<Response> {
    try {
        // Получаем все записи с префиксом ["gameResults"]
        const entries = kv.list({ prefix: ["gameResults"] });
        const results: any[] = []; // Будет хранить валидные результаты игр

        // Итерируемся по всем найденным записям
        for await (const entry of entries) {
            // Добавляем проверку, что значение существует и имеет нужную структуру
            const gameResult = entry.value as { playerScore?: number, [key: string]: any } | null;
            if (gameResult && typeof gameResult.playerScore === 'number') {
                results.push(gameResult); // Добавляем только entries с валидным номером score
            } else {
                console.warn(`Skipping invalid or missing game result entry for key: ${entry.key}`);
            }
        }

        // Сортируем результаты по счету в порядке убывания (от большего к меньшему)
        // Убеждаемся, что сравниваются числа
        results.sort((a, b) => (b.playerScore || 0) - (a.playerScore || 0));

        console.log(`Fetched leaderboard with ${results.length} entries.`);
        return jsonResponse(results);

    } catch (error: any) {
        // В случае ошибки при чтении из KV или сортировке
        return errorResponse(error.message || "Failed to retrieve leaderboard", 500, error);
    }
}

/**
 * Основной обработчик всех входящих запросов.
 * Использует URL пути и метод для определения, какой хендлер вызвать.
 */
async function requestHandler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;

    // Сначала обрабатываем preflight OPTIONS запросы для CORS
    if (method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
    }

    // Логика маршрутизации: определяем, какой обработчик вызвать
    switch (pathname) {
        case "/api/save-result":
            if (method === "POST") {
                return handleSaveResult(req);
            }
            break; // Если метод не POST, переходим к 404

        case "/api/leaderboard":
            if (method === "GET") {
                return handleGetLeaderboard();
            }
            break; // Если метод не GET, переходим к 404

            // Добавьте сюда другие маршруты, если они появятся
            // case "/api/another-route": ...

    }

    // Если ни один маршрут не подошел или метод не совпал - возвращаем 404 Not Found
    return new Response("Not Found", { status: 404 });
}

// Запускаем сервер Deno, используя функцию requestHandler как входную точку для каждого запроса.
console.log("Deno KV Leaderboard Server running on http://localhost:8000");
Deno.serve(requestHandler); // Указываем порт явно, хотя Deno Deploy его проигнорирует и использует свой.
