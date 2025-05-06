document.addEventListener("DOMContentLoaded", () => {
    const serverUrl = "" // Update this with your Deno server URL
    const leaderboardTableBody = document.getElementById("leaderboard-table-body")
    const refreshButton = document.getElementById("refresh-button")
    const gameModeFilter = document.getElementById("game-mode-filter")
    const difficultyFilter = document.getElementById("difficulty-filter")
    const sortableHeaders = document.querySelectorAll("th[data-sort]")

    let leaderboardData = []
    const currentSort = {
        column: "rank",
        direction: "desc",
    }

    // Load leaderboard data
    async function loadLeaderboard() {
        try {
            leaderboardTableBody.innerHTML = '<tr><td colspan="5" class="loading">Loading leaderboard data...</td></tr>'

            const response = await fetch(`${serverUrl}/api/leaderboard`)
            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard data")
            }

            leaderboardData = await response.json()
            filterAndRenderLeaderboard()
        } catch (error) {
            console.error("Error loading leaderboard:", error)
            leaderboardTableBody.innerHTML = `
            <tr>
            <td colspan="5" class="no-results">
            Error loading leaderboard data. Please try again later.
            </td>
            </tr>
            `
        }
    }

    // Filter and render leaderboard data
    function filterAndRenderLeaderboard() {
        const gameMode = gameModeFilter.value
        const difficulty = difficultyFilter.value

        // Apply filters
        const filteredData = leaderboardData.filter((result) => {
            // Game mode filter
            if (gameMode !== "all" && result.gameMode !== gameMode) {
                return false
            }

            // Difficulty filter (only applies to single player games)
            if (difficulty !== "all" && result.gameMode === "1 Player" && result.difficulty !== difficulty) {
                return false
            }

            return true
        })

        // Sort data
        sortData(filteredData)

        // Render filtered and sorted data
        renderLeaderboard(filteredData)
    }

    // Sort data based on current sort settings
    function sortData(data) {
        data.sort((a, b) => {
            let valueA, valueB

            switch (currentSort.column) {
                case "rank":
                    // Default sort by score (highest first)
                    valueA = a.gameMode === "1 Player" ? a.playerScore : a.playerScore
                    valueB = b.gameMode === "1 Player" ? b.playerScore : b.playerScore
                    break
                case "player":
                    valueA = a.gameMode === "1 Player" ? a.playerName : a.playerName
                    valueB = b.gameMode === "1 Player" ? b.playerName : b.playerName
                    break
                case "score":
                    valueA = a.gameMode === "1 Player" ? a.playerScore : a.playerScore
                    valueB = b.gameMode === "1 Player" ? b.playerScore : b.playerScore
                    break
                case "winner":
                    valueA = a.winner || a.difficulty || ""
                    valueB = b.winner || b.difficulty || ""
                    break
                case "date":
                    valueA = new Date(a.timestamp).getTime()
                    valueB = new Date(b.timestamp).getTime()
                    break
                default:
                    valueA = 0
                    valueB = 0
            }

            // Handle string comparison
            if (typeof valueA === "string" && typeof valueB === "string") {
                return currentSort.direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
            }

            // Handle numeric comparison
            return currentSort.direction === "asc" ? valueA - valueB : valueB - valueA
        })
    }

    // Render leaderboard data
    function renderLeaderboard(data) {
        if (data.length === 0) {
            leaderboardTableBody.innerHTML =
            '<tr><td colspan="5" class="no-results">No game results match the selected filters</td></tr>'
            return
        }

        // Clear existing rows
        leaderboardTableBody.innerHTML = ""

        // Add rows for each result
        data.forEach((result, index) => {
            const row = document.createElement("tr")

            const date = new Date(result.timestamp)
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

            if (result.gameMode === "1 Player") {
                const isWinner = result.winner === result.playerName

                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${result.playerName}</td>
                <td>${result.playerScore}</td>
                <td>${result.winner} (${result.difficulty})</td>
                <td>${formattedDate}</td>
                `
            } else {
                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${result.playerName}</td>
                <td>${result.playerScore}</td>
                <td><span class="winner">${result.winner}</span></td>
                <td>${formattedDate}</td>
                `
            }

            leaderboardTableBody.appendChild(row)
        })
    }

    // Set up event listeners
    refreshButton.addEventListener("click", loadLeaderboard)

    gameModeFilter.addEventListener("change", filterAndRenderLeaderboard)
    difficultyFilter.addEventListener("change", filterAndRenderLeaderboard)

    // Set up sortable headers
    sortableHeaders.forEach((header) => {
        header.addEventListener("click", () => {
            const column = header.getAttribute("data-sort")

            // Toggle direction if clicking the same column
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc"
            } else {
                currentSort.column = column
                currentSort.direction = "asc"
            }

            // Update UI to show sort direction
            sortableHeaders.forEach((h) => h.classList.remove("sort-asc", "sort-desc"))
            header.classList.add(`sort-${currentSort.direction}`)

            filterAndRenderLeaderboard()
        })
    })

    // Initial load
    loadLeaderboard()
})
