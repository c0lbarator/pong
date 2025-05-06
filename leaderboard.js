export class Leaderboard {
    constructor(serverUrl = "") {
        this.serverUrl = serverUrl
        this.leaderboardElement = document.getElementById("leaderboard")
        this.leaderboardTableBody = document.getElementById("leaderboard-table-body")
        this.closeLeaderboardButton = document.getElementById("close-leaderboard")

        this.loadLeaderboard = this.loadLeaderboard.bind(this)
        this.renderLeaderboard = this.renderLeaderboard.bind(this)
        this.show = this.show.bind(this)
        this.hide = this.hide.bind(this)

        // Set up event listeners
        document.getElementById("view-leaderboard-button").addEventListener("click", this.show)
        this.closeLeaderboardButton.addEventListener("click", this.hide)
    }

    async loadLeaderboard() {
        try {
            const response = await fetch(`${this.serverUrl}/api/leaderboard`)
            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard data")
            }

            const data = await response.json()
            return data
        } catch (error) {
            console.error("Error loading leaderboard:", error)
            return []
        }
    }

    renderLeaderboard(data) {
        // Clear existing rows
        this.leaderboardTableBody.innerHTML = ""

        if (data.length === 0) {
            const row = document.createElement("tr")
            row.innerHTML = `
            <td colspan="5" class="no-results">No game results yet</td>
            `
            this.leaderboardTableBody.appendChild(row)
            return
        }

        // Add rows for each result
        data.forEach((result, index) => {
            const row = document.createElement("tr")

            const date = new Date(result.timestamp)
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

            if (result.gameMode === "1 Player") {
                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${result.playerName}</td>
                <td>${result.playerScore}</td>
                <td>${result.difficulty}</td>
                <td>${formattedDate}</td>
                `
            } else {
                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${result.playerName}</td>
                <td>${result.playerScore}</td>
                <td>${result.winner}</td>
                <td>${formattedDate}</td>
                `
            }

            this.leaderboardTableBody.appendChild(row)
        })
    }

    async show() {
        // Show loading state
        this.leaderboardTableBody.innerHTML = '<tr><td colspan="5" class="loading">Loading leaderboard data...</td></tr>'
        this.leaderboardElement.classList.remove("hidden")

        // Load and render data
        const data = await this.loadLeaderboard()
        this.renderLeaderboard(data)
    }

    hide() {
        this.leaderboardElement.classList.add("hidden")
    }
}
