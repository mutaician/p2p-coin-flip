// Gun.js powered P2P game management
import Gun from 'gun'

class GunGameManager {
  constructor() {
    // Initialize Gun with multiple reliable relay servers + local fallback
    this.gun = Gun([
      'https://gun-manhattan.herokuapp.com/gun',
      'https://gundb.herokuapp.com/gun',
      'wss://gun-us.herokuapp.com/gun',
      'wss://gunjs.herokuapp.com/gun'
    ])
    
    // Connection event handlers (minimal logging)
    this.gun.on('hi', () => {})
    this.gun.on('bye', () => {})
    this.gun.on('timeout', () => {})
    
    // Game namespace
    this.games = this.gun.get('p2p-coinflip-games')
    
    this.currentGame = null
    this.currentPlayer = null
    this.gameListeners = new Map() // Track active listeners
    
    this.gameStates = {
      LANDING: 'landing',
      CREATE_GAME: 'create-game',
      JOIN_GAME: 'join-game',
      WAITING: 'waiting',
      READY: 'ready',
      FLIPPING: 'flipping',
      RESULT: 'result'
    }
    this.currentState = this.gameStates.LANDING
  }

  // Generate a unique game ID
  generateGameId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase()
  }

  // Generate cryptographically secure random result
  flipCoin() {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] % 2 === 0 ? 'heads' : 'tails'
  }

  // Create a new game
  async createGame(playerName, betAmount, coinChoice) {
    const gameId = this.generateGameId()
    
    const gameData = {
      id: gameId,
      status: 'waiting',
      createdAt: Date.now(),
      // Store player data as flat properties to avoid Gun.js nesting issues
      player1_name: playerName,
      player1_bet: parseInt(betAmount),
      player1_choice: coinChoice,
      player1_id: Date.now(),
      player2_name: null,
      player2_bet: null,
      player2_choice: null,
      player2_id: null,
      result: null,
      winner: null
    }

    // Store in Gun with callback to ensure it's saved
    await new Promise((resolve) => {
      this.games.get(gameId).put(gameData, () => {
        resolve()
      })
    })
    
    // Convert back to expected format for local use
    this.currentGame = this.convertGunDataToGame(gameData)
    this.currentPlayer = 1
    
    return this.currentGame
  }

  // Convert Gun's flat data structure to expected nested format
  convertGunDataToGame(gunData) {
    return {
      id: gunData.id,
      player1: {
        name: gunData.player1_name,
        bet: gunData.player1_bet,
        choice: gunData.player1_choice,
        id: gunData.player1_id
      },
      player2: gunData.player2_name ? {
        name: gunData.player2_name,
        bet: gunData.player2_bet,
        choice: gunData.player2_choice,
        id: gunData.player2_id
      } : null,
      status: gunData.status || 'waiting',
      result: gunData.result || null,
      winner: gunData.winner || null,
      createdAt: gunData.createdAt,
      winnerName: gunData.winnerName || null,
      winnerChoice: gunData.winnerChoice || null,
      totalPot: gunData.totalPot || null,
      completedAt: gunData.completedAt || null
    }
  }

  // Join an existing game
  async joinGame(gameId, playerName) {
    return new Promise((resolve, reject) => {
      // Get the game data first
      this.games.get(gameId).once((gameData) => {
        if (!gameData || !gameData.id) {
          reject(new Error('Game not found'))
          return
        }
        
        if (gameData.status !== 'waiting') {
          reject(new Error('Game is not available to join'))
          return
        }
        
        if (gameData.player2_name) {
          reject(new Error('Game is already full'))
          return
        }

        // Calculate opposite choice
        const oppositeChoice = gameData.player1_choice === 'heads' ? 'tails' : 'heads'
        
        // Create updated game with player 2 (using flat structure)
        const updatedGame = {
          id: gameData.id,
          status: 'ready', // Important: Update status to ready
          createdAt: gameData.createdAt,
          player1_name: gameData.player1_name,
          player1_bet: gameData.player1_bet,
          player1_choice: gameData.player1_choice,
          player1_id: gameData.player1_id,
          player2_name: playerName,
          player2_bet: gameData.player1_bet, // Same bet amount
          player2_choice: oppositeChoice,
          player2_id: Date.now(),
          result: null,
          winner: null
        }

        // Update in Gun with explicit overwrite
        this.games.get(gameId).put(updatedGame, (ack) => {
          if (ack.err) {
            reject(new Error('Failed to join game: ' + ack.err))
            return
          }
          
          // Convert to expected format
          this.currentGame = this.convertGunDataToGame(updatedGame)
          this.currentPlayer = 2
          
          resolve(this.currentGame)
        })
      })
    })
  }

  // Listen for game updates
  subscribeToGame(gameId, callback) {
    // Clean up existing listener for this game
    if (this.gameListeners.has(gameId)) {
      this.gameListeners.get(gameId).off()
    }

    // Set up new listener with better error handling
    const listener = this.games.get(gameId).on((data, key) => {
      if (data && data.id) {
        try {
          // Convert Gun's flat data to expected nested format
          const convertedGame = this.convertGunDataToGame(data)
          this.currentGame = convertedGame
          
          // Call the callback with converted data
          callback(convertedGame)
        } catch (error) {
          // Silent error handling to avoid console spam
        }
      }
    })

    this.gameListeners.set(gameId, listener)
    
    // Return a promise that resolves when subscription is active
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100)
    })
  }

  // Stop listening to a game
  unsubscribeFromGame(gameId) {
    if (this.gameListeners.has(gameId)) {
      this.gameListeners.get(gameId).off()
      this.gameListeners.delete(gameId)
    }
  }

  // Start the coin flip
  async startFlip() {
    if (!this.currentGame) {
      throw new Error('No current game found')
    }
    
    if (this.currentGame.status !== 'ready') {
      throw new Error(`Game is not ready for flip. Current status: ${this.currentGame.status}`)
    }
    
    if (!this.currentGame.player2) {
      throw new Error('Waiting for second player to join')
    }

    // Convert current game back to flat structure for Gun storage
    const flatGame = {
      id: this.currentGame.id,
      status: 'flipping',
      createdAt: this.currentGame.createdAt,
      player1_name: this.currentGame.player1.name,
      player1_bet: this.currentGame.player1.bet,
      player1_choice: this.currentGame.player1.choice,
      player1_id: this.currentGame.player1.id,
      player2_name: this.currentGame.player2.name,
      player2_bet: this.currentGame.player2.bet,
      player2_choice: this.currentGame.player2.choice,
      player2_id: this.currentGame.player2.id,
      result: null,
      winner: null,
      winnerName: null,
      winnerChoice: null,
      totalPot: null,
      completedAt: null
    }
    
    // Update status to flipping first
    await new Promise((resolve) => {
      this.games.get(this.currentGame.id).put(flatGame, () => {
        resolve()
      })
    })

    // Simulate flip delay for better UX
    await new Promise(resolve => setTimeout(resolve, 3000))

    const result = this.flipCoin()
    
    // Determine winner based on player choices
    let winner
    if (this.currentGame.player1.choice === result) {
      winner = 1
    } else {
      winner = 2
    }
    
    const winnerName = winner === 1 ? this.currentGame.player1.name : this.currentGame.player2.name
    const winnerChoice = winner === 1 ? this.currentGame.player1.choice : this.currentGame.player2.choice
    const totalPot = this.currentGame.player1.bet + this.currentGame.player2.bet
    
    // Update with flat structure for Gun
    const completedFlatGame = {
      ...flatGame,
      result: result,
      winner: winner,
      winnerName: winnerName,
      winnerChoice: winnerChoice,
      status: 'completed',
      totalPot: totalPot,
      completedAt: Date.now()
    }

    // Update in Gun
    await new Promise((resolve) => {
      this.games.get(this.currentGame.id).put(completedFlatGame, () => {
        resolve()
      })
    })
    
    // Also add to completed games list for winners ticker
    this.gun.get('completed-games').get(this.currentGame.id).put({
      winnerName: winnerName,
      totalPot: totalPot,
      winnerChoice: winnerChoice,
      result: result,
      completedAt: Date.now()
    })
    
    return {
      result: result,
      winner: winner,
      winnerName: winnerName,
      totalPot: totalPot,
      game: this.convertGunDataToGame(completedFlatGame)
    }
  }

  // Get all available games
  async getAvailableGames() {
    return new Promise((resolve) => {
      const availableGames = new Map() // Use Map to prevent duplicates
      
      this.games.map().once((game, gameId) => { // Use .once() instead of .on() to prevent multiple callbacks
        // Check for flat structure properties
        if (game && 
            game.id && 
            game.status === 'waiting' && 
            game.createdAt &&
            game.player1_name &&
            game.player1_bet &&
            game.player1_choice &&
            !game.player2_name) { // Ensure no player 2 yet
          
          // Only show games from the last 10 minutes
          const tenMinutesAgo = Date.now() - (10 * 60 * 1000)
          if (game.createdAt > tenMinutesAgo) {
            // Convert to expected format for UI and store in Map with gameId as key
            const convertedGame = this.convertGunDataToGame(game)
            availableGames.set(game.id, convertedGame)
          }
        }
      })

      // Return available games after a delay to collect data
      setTimeout(() => {
        const gamesArray = Array.from(availableGames.values())
        resolve(gamesArray.sort((a, b) => b.createdAt - a.createdAt))
      }, 1500)
    })
  }

  // Get recent winners for ticker
  async getRecentWinners(limit = 10) {
    return new Promise((resolve) => {
      const winners = []
      
      this.gun.get('completed-games').map().on((winner, gameId) => {
        if (winner && winner.winnerName) {
          winners.push(winner)
        }
      })

      setTimeout(() => {
        const sortedWinners = winners
          .sort((a, b) => b.completedAt - a.completedAt)
          .slice(0, limit)
          .map(winner => ({
            name: winner.winnerName,
            amount: winner.totalPot,
            choice: winner.winnerChoice,
            result: winner.result,
            timestamp: winner.completedAt
          }))
        
        resolve(sortedWinners)
      }, 500)
    })
  }

  // Generate dummy winners for demonstration
  generateDummyWinners() {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack']
    const choices = ['heads', 'tails']
    const dummy = []
    
    for (let i = 0; i < 8; i++) {
      const choice = choices[Math.floor(Math.random() * choices.length)]
      dummy.push({
        name: names[Math.floor(Math.random() * names.length)],
        amount: Math.floor(Math.random() * 500) + 10,
        choice: choice,
        result: choice,
        timestamp: Date.now() - (i * 300000)
      })
    }
    
    return dummy
  }

  // Validation methods
  validatePlayerName(name) {
    if (!name || name.trim().length < 2) {
      throw new Error('Player name must be at least 2 characters long')
    }
    if (name.trim().length > 20) {
      throw new Error('Player name cannot exceed 20 characters')
    }
    return name.trim()
  }

  validateBetAmount(amount) {
    const bet = parseInt(amount)
    if (isNaN(bet) || bet < 1) {
      throw new Error('Bet amount must be at least $1')
    }
    if (bet > 1000) {
      throw new Error('Bet amount cannot exceed $1000')
    }
    return bet
  }

  validateGameId(gameId) {
    if (!gameId || gameId.trim().length !== 8) {
      throw new Error('Invalid game ID format')
    }
    return gameId.trim().toUpperCase()
  }

  // Cancel current game
  cancelGame() {
    if (this.currentGame && this.currentGame.status === 'waiting') {
      // Convert to flat structure for Gun storage
      const flatGame = {
        id: this.currentGame.id,
        status: 'cancelled',
        createdAt: this.currentGame.createdAt,
        player1_name: this.currentGame.player1.name,
        player1_bet: this.currentGame.player1.bet,
        player1_choice: this.currentGame.player1.choice,
        player1_id: this.currentGame.player1.id,
        player2_name: this.currentGame.player2?.name || null,
        player2_bet: this.currentGame.player2?.bet || null,
        player2_choice: this.currentGame.player2?.choice || null,
        player2_id: this.currentGame.player2?.id || null,
        result: this.currentGame.result,
        winner: this.currentGame.winner
      }
      
      // Mark game as cancelled in Gun
      this.games.get(this.currentGame.id).put(flatGame)
    }
    
    // Clean up listeners
    if (this.currentGame) {
      this.unsubscribeFromGame(this.currentGame.id)
    }
    
    this.currentGame = null
    this.currentPlayer = null
  }

  // Clean up all listeners
  destroy() {
    this.gameListeners.forEach((listener, gameId) => {
      listener.off()
    })
    this.gameListeners.clear()
  }

  // Reset game state
  reset() {
    if (this.currentGame) {
      this.unsubscribeFromGame(this.currentGame.id)
    }
    this.currentGame = null
    this.currentPlayer = null
    this.currentState = this.gameStates.LANDING
  }
}

export default GunGameManager
