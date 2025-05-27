// Game state management and core logic
class GameManager {
  constructor() {
    this.currentGame = null;
    this.currentPlayer = null;
    this.games = new Map(); // Store active games
    this.gameStates = {
      LANDING: 'landing',
      CREATE_GAME: 'create-game',
      JOIN_GAME: 'join-game',
      WAITING: 'waiting',
      READY: 'ready',
      FLIPPING: 'flipping',
      RESULT: 'result'
    };
    this.currentState = this.gameStates.LANDING;
    
    // Load games from localStorage
    this.loadGames();
    
    // Auto-save games every 5 seconds
    setInterval(() => this.saveGames(), 5000);
  }

  // Generate a unique game ID
  generateGameId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  // Generate cryptographically secure random result
  flipCoin() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % 2 === 0 ? 'heads' : 'tails';
  }

  // Create a new game
  createGame(playerName, betAmount, coinChoice) {
    const gameId = this.generateGameId();
    const game = {
      id: gameId,
      player1: {
        name: playerName,
        bet: parseInt(betAmount),
        choice: coinChoice,
        id: Date.now() // Simple player ID
      },
      player2: null,
      status: 'waiting', // waiting, ready, flipping, completed
      result: null,
      winner: null,
      createdAt: Date.now()
    };

    this.games.set(gameId, game);
    this.currentGame = game;
    this.currentPlayer = 1;
    this.saveGames();
    
    return game;
  }

  // Join an existing game
  joinGame(gameId, playerName) {
    const game = this.games.get(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    if (game.status !== 'waiting') {
      throw new Error('Game is not available to join');
    }
    
    if (game.player2) {
      throw new Error('Game is already full');
    }

    game.player2 = {
      name: playerName,
      bet: game.player1.bet, // Match the first player's bet
      choice: game.player1.choice === 'heads' ? 'tails' : 'heads', // Opposite choice
      id: Date.now()
    };
    
    game.status = 'ready';
    this.currentGame = game;
    this.currentPlayer = 2;
    this.saveGames();
    
    return game;
  }

  // Start the coin flip
  async startFlip() {
    if (!this.currentGame || this.currentGame.status !== 'ready') {
      throw new Error('Game is not ready for flip');
    }

    this.currentGame.status = 'flipping';
    this.saveGames();

    // Simulate flip delay for better UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = this.flipCoin();
    
    // Determine winner based on player choices
    let winner;
    if (this.currentGame.player1.choice === result) {
      winner = 1;
    } else {
      winner = 2;
    }
    
    this.currentGame.result = result;
    this.currentGame.winner = winner;
    this.currentGame.winnerName = winner === 1 ? this.currentGame.player1.name : this.currentGame.player2.name;
    this.currentGame.winnerChoice = winner === 1 ? this.currentGame.player1.choice : this.currentGame.player2.choice;
    this.currentGame.status = 'completed';
    this.currentGame.totalPot = this.currentGame.player1.bet + this.currentGame.player2.bet;
    this.currentGame.completedAt = Date.now();
    
    this.saveGames();
    
    return {
      result,
      winner,
      winnerName: this.currentGame.winnerName,
      winnerChoice: this.currentGame.winnerChoice,
      totalPot: this.currentGame.totalPot,
      player1Choice: this.currentGame.player1.choice,
      player2Choice: this.currentGame.player2.choice
    };
  }

  // Get available games
  getAvailableGames() {
    const availableGames = [];
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes timeout

    for (const [gameId, game] of this.games) {
      // Remove expired games
      if (now - game.createdAt > timeout) {
        this.games.delete(gameId);
        continue;
      }
      
      if (game.status === 'waiting') {
        availableGames.push({
          id: game.id,
          playerName: game.player1.name,
          betAmount: game.player1.bet,
          createdAt: game.createdAt
        });
      }
    }
    
    this.saveGames();
    return availableGames;
  }

  // Cancel current game
  cancelGame() {
    if (this.currentGame) {
      this.games.delete(this.currentGame.id);
      this.currentGame = null;
      this.currentPlayer = null;
      this.saveGames();
    }
  }

  // Reset for new game
  reset() {
    this.currentGame = null;
    this.currentPlayer = null;
    this.currentState = this.gameStates.LANDING;
  }

  // Save games to localStorage
  saveGames() {
    try {
      const gamesArray = Array.from(this.games.entries());
      localStorage.setItem('p2p-coinflip-games', JSON.stringify(gamesArray));
    } catch (error) {
      console.warn('Failed to save games:', error);
    }
  }

  // Load games from localStorage
  loadGames() {
    try {
      const saved = localStorage.getItem('p2p-coinflip-games');
      if (saved) {
        const gamesArray = JSON.parse(saved);
        this.games = new Map(gamesArray);
        
        // Clean up old games
        const now = Date.now();
        const timeout = 10 * 60 * 1000; // 10 minutes
        
        for (const [gameId, game] of this.games) {
          if (now - game.createdAt > timeout) {
            this.games.delete(gameId);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load games:', error);
      this.games = new Map();
    }
  }

  // Validate input
  validatePlayerName(name) {
    if (!name || name.trim().length < 2) {
      throw new Error('Player name must be at least 2 characters long');
    }
    if (name.trim().length > 20) {
      throw new Error('Player name must be less than 20 characters');
    }
    return name.trim();
  }

  validateBetAmount(amount) {
    const bet = parseInt(amount);
    if (isNaN(bet) || bet < 1) {
      throw new Error('Bet amount must be at least $1');
    }
    if (bet > 1000) {
      throw new Error('Bet amount cannot exceed $1000');
    }
    return bet;
  }

  validateGameId(gameId) {
    if (!gameId || gameId.trim().length !== 8) {
      throw new Error('Invalid game ID format');
    }
    return gameId.trim().toUpperCase();
  }

  // Get recent winners for ticker display
  getRecentWinners(limit = 10) {
    const completedGames = Array.from(this.games.values())
      .filter(game => game.status === 'completed')
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);
    
    return completedGames.map(game => ({
      name: game.winnerName,
      amount: game.totalPot,
      choice: game.winnerChoice,
      result: game.result,
      timestamp: game.completedAt
    }));
  }

  // Generate dummy winners for demonstration
  generateDummyWinners() {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const choices = ['heads', 'tails'];
    const dummy = [];
    
    for (let i = 0; i < 15; i++) {
      const choice = choices[Math.floor(Math.random() * choices.length)];
      dummy.push({
        name: names[Math.floor(Math.random() * names.length)],
        amount: Math.floor(Math.random() * 500) + 10,
        choice: choice,
        result: choice, // Winner's choice matches result
        timestamp: Date.now() - (i * 300000) // 5 minutes apart
      });
    }
    
    return dummy;
  }
}

export default GameManager;
