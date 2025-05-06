// Deno KV server for Pong leaderboard API and static file serving

import { serveFile } from "jsr:@std/http/file-server";// <--- ДОБАВЛЕНО

// Открываем KV хранилище один раз при старте сервера
const kv = await Deno.openKv();

// Централизованные заголовки для CORS (в основном для API)
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Вспомогательная функция для создания успешного JSON Response с CORS заголовками.
 */
function jsonResponse(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
        },
    });
}

/**
 * Вспомогательная функция для создания JSON Response с ошибкой и CORS заголовками.
 */
function errorResponse(message: string, status = 500, errorDetails?: any): Response {
    console.error(`Server Error Occurred (${status}): ${message}`, errorDetails);
    return new Response(JSON.stringify({ success: false, error: message || "An unexpected error occurred" }), {
        status: status,
        headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
        },
    });
}

/**
 * Обработчик запроса для сохранения результата игры.
 * Метод: POST, Путь: /api/save-result
 */
async function handleSaveResult(request: Request): Promise<Response> {
    try {
        const data = await request.json();
        if (typeof data.playerScore !== 'number' || typeof data.playerName !== 'string') {
            return errorResponse("Invalid data format: body must contain 'playerScore' (number) and 'playerName' (string)", 400);
        }
        const timestamp = new Date().toISOString();
        const id = crypto.randomUUID();
        await kv.set(["gameResults", id], { ...data, timestamp, id });
        console.log(`Saved game result with ID: ${id}`);
        return jsonResponse({ success: true, id });
    } catch (error: any) {
        return errorResponse(error.message || "Failed to save game result", 500, error);
    }
}

/**
 * Обработчик запроса для получения данных лидерборда.
 * Метод: GET, Путь: /api/leaderboard
 */
async function handleGetLeaderboard(): Promise<Response> {
    try {
        const entries = kv.list({ prefix: ["gameResults"] });
        const results: any[] = [];
        for await (const entry of entries) {
            const gameResult = entry.value as { playerScore?: number, [key: string]: any } | null;
            if (gameResult && typeof gameResult.playerScore === 'number') {
                results.push(gameResult);
            } else {
                console.warn(`Skipping invalid or missing game result entry for key: ${entry.key}`);
            }
        }
        results.sort((a, b) => (b.playerScore || 0) - (a.playerScore || 0));
        console.log(`Fetched leaderboard with ${results.length} entries.`);
        return jsonResponse(results);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to retrieve leaderboard", 500, error);
    }
}

/**
 * Основной обработчик всех входящих запросов.
 */
async function requestHandler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;

    // Обработка preflight OPTIONS запросов для CORS
    if (method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
    }

    // Маршрутизация API
    switch (pathname) {
        case "/api/save-result":
            if (method === "POST") {
                return handleSaveResult(req);
            }
            // Если метод не POST, запрос упадет в обработку статических файлов или 404
            break;
        case "/api/leaderboard":
            if (method === "GET") {
                return handleGetLeaderboard();
            }
            // Если метод не GET, запрос упадет в обработку статических файлов или 404
            break;
    }

    // --- ОБРАБОТКА СТАТИЧЕСКИХ ФАЙЛОВ ---
    // Если ни один API маршрут не подошел, пытаемся отдать статический файл
    try {
        let requestedPath = pathname;
        // Если запрашивается корень сайта ("/"), или пустой путь, отдаем index.html
        if (requestedPath === "/" || requestedPath === "") {
            requestedPath = "/index.html";
        }

        // Формируем путь к файлу относительно текущей рабочей директории (корень проекта на Deno Deploy)
        // Безопаснее всего использовать относительный путь, начинающийся с './'
        const filePath = `.${requestedPath}`; // Например, "./index.html" или "./game.js"

        console.log(`Attempting to serve static file: ${filePath} for request path: ${pathname}`);

        // serveFile автоматически определяет Content-Type по расширению файла
        // и обрабатывает ошибки NotFound, возвращая 404 Response.
        const response = await serveFile(req, filePath);

        console.log(
            `Served ${filePath}. Response status: ${response.status}. Original Content-Type from serveFile: ${
                response.headers.get("Content-Type")
            }`
        );

        // Проверка и принудительная коррекция MIME-типа для JS файлов, если serveFile не справился
        // Это может быть необходимо на Deno Deploy, если есть странности с определением типов.
        if (filePath.endsWith(".js") &&响应.status === 200) { // Проверяем, что файл .js и успешно найден
            const currentContentType = response.headers.get("Content-Type");
            const expectedJsContentType1 = "application/javascript";
            const expectedJsContentType2 = "text/javascript"; // Тоже валидный

            if (currentContentType !== expectedJsContentType1 && currentContentType !== expectedJsContentType2) {
                console.warn(
                    `WARN: Incorrect Content-Type "${currentContentType}" for ${filePath}. Overriding to "${expectedJsContentType1}".`
                );
                // Нужно создать новый Response, так как headers у существующего могут быть иммутабельными.
                // Читаем тело оригинального ответа
                const body = await response.arrayBuffer();
                // Копируем оригинальные заголовки и устанавливаем правильный Content-Type
                const newHeaders = new Headers(response.headers);
                newHeaders.set("Content-Type", expectedJsContentType1);

                return new Response(body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
            }
        }

        return response;

    } catch (error) {
        // Если serveFile или Deno.stat вызвали ошибку (кроме NotFound, обработанной выше)
        console.error("Error serving static file:", error);
        // Возвращаем простую ошибку сервера, можно использовать вашу errorResponse,
        // но она для JSON API, здесь лучше текстовый ответ.
        return new Response("Internal Server Error while serving file", { status: 500 });
    }
}

// Запускаем сервер Deno
console.log("Deno Server (API & Static Files) running on http://localhost:8000");
Deno.serve(requestHandler);
