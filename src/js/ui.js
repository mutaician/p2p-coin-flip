// UI management and DOM interactions
class UIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.screens = {
      landing: document.getElementById('landing-screen'),
      createGame: document.getElementById('create-game-screen'),
      joinGame: document.getElementById('join-game-screen'),
      waiting: document.getElementById('waiting-screen'),
      gameReady: document.getElementById('game-ready-screen'),
      coinFlip: document.getElementById('coin-flip-screen'),
      result: document.getElementById('result-screen')
    };
    
    this.initializeEventListeners();
    this.initializeCoinChoiceButtons();
    this.initializeWinnersTicker();
    this.showScreen('landing');
    this.updateAvailableGames();
    
    // Auto-refresh available games every 10 seconds for Gun.js
    setInterval(() => this.updateAvailableGames(), 10000);
  }

  // Initialize all event listeners
  initializeEventListeners() {
    // Landing screen
    document.getElementById('create-game-btn').addEventListener('click', () => {
      this.showScreen('createGame');
    });
    
    document.getElementById('join-game-btn').addEventListener('click', () => {
      this.showScreen('joinGame');
      this.updateAvailableGames();
    });

    // Create game screen
    document.getElementById('create-game-form').addEventListener('submit', (e) => {
      this.handleCreateGame(e);
    });
    
    document.getElementById('back-to-landing').addEventListener('click', () => {
      this.showScreen('landing');
    });

    // Join game screen
    document.getElementById('join-game-form').addEventListener('submit', (e) => {
      this.handleJoinGame(e);
    });
    
    document.getElementById('back-to-landing-2').addEventListener('click', () => {
      this.showScreen('landing');
    });

    // Waiting screen
    document.getElementById('cancel-game').addEventListener('click', () => {
      this.handleCancelGame();
    });

    // Game ready screen
    document.getElementById('start-flip').addEventListener('click', () => {
      this.handleStartFlip();
    });

    // Result screen
    document.getElementById('play-again').addEventListener('click', () => {
      this.gameManager.reset();
      this.showScreen('landing');
    });
    
    document.getElementById('back-to-home').addEventListener('click', () => {
      this.gameManager.reset();
      this.showScreen('landing');
    });
  }

  // Show a specific screen
  showScreen(screenName) {
    // Hide all screens
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });
    
    // Show the requested screen
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
    
    this.gameManager.currentState = screenName;
  }

  // Handle create game form submission
  async handleCreateGame(e) {
    e.preventDefault();
    
    try {
      const playerName = this.gameManager.validatePlayerName(
        document.getElementById('player-name').value
      );
      const betAmount = this.gameManager.validateBetAmount(
        document.getElementById('bet-amount').value
      );
      const coinChoice = document.getElementById('coin-choice').value;
      
      if (!coinChoice) {
        throw new Error('Please select heads or tails');
      }

      const game = await this.gameManager.createGame(playerName, betAmount, coinChoice);
      
      // Set up real-time subscription for game updates
      await this.gameManager.subscribeToGame(game.id, (updatedGame) => {
        this.handleGameUpdate(updatedGame);
      });
      
      this.showWaitingScreen(game);
      
      // Clear form
      document.getElementById('create-game-form').reset();
      document.getElementById('coin-choice').value = '';
      document.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('active'));
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  // Handle join game form submission
  async handleJoinGame(e) {
    e.preventDefault();
    
    try {
      const playerName = this.gameManager.validatePlayerName(
        document.getElementById('joiner-name').value
      );
      const gameId = this.gameManager.validateGameId(
        document.getElementById('game-id').value
      );

      const game = await this.gameManager.joinGame(gameId, playerName);
      
      // Set up real-time subscription for game updates
      await this.gameManager.subscribeToGame(game.id, (updatedGame) => {
        this.handleGameUpdate(updatedGame);
      });
      
      this.showGameReadyScreen(game);
      
      // Clear form
      document.getElementById('join-game-form').reset();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  // Handle join game by clicking on available game
  async handleJoinAvailableGame(gameId) {
    const playerName = document.getElementById('joiner-name').value;
    
    if (!playerName) {
      this.showError('Please enter your name first');
      return;
    }
    
    try {
      const validatedName = this.gameManager.validatePlayerName(playerName);
      const game = await this.gameManager.joinGame(gameId, validatedName);
      
      // Set up real-time subscription for game updates
      await this.gameManager.subscribeToGame(game.id, (updatedGame) => {
        this.handleGameUpdate(updatedGame);
      });
      
      this.showGameReadyScreen(game);
      
      // Clear form
      document.getElementById('join-game-form').reset();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  // Handle cancel game
  handleCancelGame() {
    this.gameManager.cancelGame();
    this.showScreen('landing');
  }

  // Handle start flip
  async handleStartFlip() {
    try {
      this.showCoinFlipScreen();
      
      const result = await this.gameManager.startFlip();
      
      // Wait for animation to complete
      setTimeout(() => {
        this.showResultScreen(result);
      }, 2500);
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  // Show waiting screen
  showWaitingScreen(game) {
    document.getElementById('current-game-id').textContent = game.id;
    document.getElementById('current-player-name').textContent = game.player1.name;
    document.getElementById('current-bet-amount').textContent = game.player1.bet;
    
    this.showScreen('waiting');
    
    // Gun.js real-time subscription will handle updates, no need for polling
  }

  // Show game ready screen
  showGameReadyScreen(game) {
    document.getElementById('player1-name').textContent = game.player1.name;
    document.getElementById('player1-bet').textContent = game.player1.bet;
    document.getElementById('player1-choice').textContent = game.player1.choice.toUpperCase();
    document.getElementById('player1-choice').className = `choice-badge ${game.player1.choice}`;
    
    if (game.player2) {
      document.getElementById('player2-name').textContent = game.player2.name;
      document.getElementById('player2-bet').textContent = game.player2.bet;
      document.getElementById('player2-choice').textContent = game.player2.choice.toUpperCase();
      document.getElementById('player2-choice').className = `choice-badge ${game.player2.choice}`;
    }
    
    document.getElementById('total-pot').textContent = game.player1.bet + (game.player2 ? game.player2.bet : 0);
    
    this.showScreen('gameReady');
  }

  // Show coin flip screen with animation
  showCoinFlipScreen() {
    this.showScreen('coinFlip');
    
    const coin = document.getElementById('coin');
    const flipStatus = document.getElementById('flip-status');
    
    // Reset coin
    coin.className = 'coin';
    flipStatus.textContent = 'Flipping...';
    
    // Start flip animation
    setTimeout(() => {
      coin.classList.add('flipping');
    }, 100);
    
    // Update status during flip
    setTimeout(() => {
      flipStatus.textContent = 'Computing result...';
    }, 1000);
    
    // The result will be shown when the game updates to 'completed' status
    // No need to try to access result here since it might not be available yet
  }

  // Show result screen
  showResultScreen(result) {
    const game = this.gameManager.currentGame;
    
    // Handle missing result data
    if (!result || !result.result) {
      this.showError('Invalid game result data');
      return;
    }
    
    const isWinner = (this.gameManager.currentPlayer === result.winner);
    
    // Update result display
    document.getElementById('result-title').textContent = 
      isWinner ? '🎉 You Won!' : '😔 You Lost';
    
    // Show coin result
    const resultCoin = document.getElementById('result-coin-display');
    resultCoin.textContent = result.result === 'heads' ? 'H' : 'T';
    resultCoin.className = `coin-result ${result.result}`;
    
    // Update result text
    document.getElementById('result-text').textContent = 
      `The coin landed on ${result.result.toUpperCase()}!`;
    
    // Safe property access for winner info
    const winnerName = result.winnerName || 'Unknown';
    const winnerChoice = result.winnerChoice || result.result;
    const totalPot = result.totalPot || 0;
    
    document.getElementById('winner-text').textContent = 
      `🏆 Winner: ${winnerName} (chose ${winnerChoice.toUpperCase()})`;
    
    document.getElementById('payout-text').textContent = 
      `💰 Total Winnings: $${totalPot}`;
    
    this.showScreen('result');
    
    // Update winners ticker with new winner
    this.updateWinnersTicker();
    
    // Add confetti effect for winners
    if (isWinner) {
      this.showConfetti();
    }
  }

  // Update available games list
  async updateAvailableGames() {
    const gamesList = document.getElementById('games-list');
    
    try {
      const availableGames = await this.gameManager.getAvailableGames();
      
      gamesList.innerHTML = '';
      
      if (availableGames.length === 0) {
        gamesList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No games available</p>';
        return;
      }
      
      availableGames.forEach(game => {
        const gameElement = this.createGameListItem(game);
        gamesList.appendChild(gameElement);
      });
    } catch (error) {
      console.error('Error updating available games:', error);
      gamesList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">Error loading games</p>';
    }
  }

  // Create game list item element
  createGameListItem(game) {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game-item';
    
    // Safe access to nested properties
    const playerName = game.player1?.name || 'Unknown';
    const playerBet = game.player1?.bet || 0;
    const playerChoice = game.player1?.choice || 'heads';
    const choiceDisplay = playerChoice ? playerChoice.toUpperCase() : 'HEADS';
    
    gameDiv.innerHTML = `
      <p><strong>Game ID:</strong> ${game.id}</p>
      <p><strong>Player:</strong> ${playerName}</p>
      <p><strong>Bet:</strong> $${playerBet}</p>
      <p><strong>Choice:</strong> <span class="choice-badge ${playerChoice}">${choiceDisplay}</span></p>
      <p><strong>Created:</strong> ${this.formatTime(game.createdAt)}</p>
    `;
    
    gameDiv.addEventListener('click', () => {
      document.getElementById('game-id').value = game.id;
      this.handleJoinAvailableGame(game.id);
    });
    
    return gameDiv;
  }

  // Initialize coin choice buttons
  initializeCoinChoiceButtons() {
    const choiceButtons = document.querySelectorAll('.choice-btn');
    const hiddenInput = document.getElementById('coin-choice');
    
    choiceButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        choiceButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Set hidden input value
        const choice = button.dataset.choice;
        hiddenInput.value = choice;
      });
    });
  }

  // Initialize winners ticker
  initializeWinnersTicker() {
    this.updateWinnersTicker();
    
    // Update ticker every 30 seconds
    setInterval(() => this.updateWinnersTicker(), 30000);
  }

  // Update winners ticker content
  async updateWinnersTicker() {
    const tickerElement = document.getElementById('winners-ticker');
    
    try {
      // Get recent winners and combine with dummy data
      const recentWinners = await this.gameManager.getRecentWinners(5);
      const dummyWinners = this.gameManager.generateDummyWinners();
      const allWinners = [...recentWinners, ...dummyWinners];
      
      if (allWinners.length === 0) {
        tickerElement.innerHTML = '<div class="ticker-item">🎰 No recent winners - Be the first!</div>';
        return;
      }
      
      const tickerHTML = allWinners.map(winner => `
        <div class="ticker-item">
          <span class="winner-name">🏆 ${winner.name}</span>
          won
          <span class="winner-amount">$${winner.amount}</span>
           with
          <span class="winner-choice">${winner.choice}</span>
        </div>
      `).join('');
      
      tickerElement.innerHTML = tickerHTML;
    } catch (error) {
      console.error('Error updating winners ticker:', error);
      tickerElement.innerHTML = '<div class="ticker-item">🎰 Loading winners...</div>';
    }
  }

  // Handle real-time game updates
  handleGameUpdate(game) {
    if (!game) return;
    
    // Update current game reference
    this.gameManager.currentGame = game;
    
    // Handle different game states
    switch (game.status) {
      case 'ready':
        if (this.gameManager.currentState === 'waiting') {
          this.showGameReadyScreen(game);
        }
        break;
      case 'flipping':
        if (this.gameManager.currentState === 'gameReady') {
          this.showCoinFlipScreen();
        }
        break;
      case 'completed':
        // Allow transition from both gameReady and coinFlip states to handle race conditions
        if (this.gameManager.currentState === 'coinFlip' || this.gameManager.currentState === 'gameReady') {
          // Show final coin result first if we're in coin flip screen
          if (this.gameManager.currentState === 'coinFlip' && game.result) {
            const coin = document.getElementById('coin');
            const flipStatus = document.getElementById('flip-status');
            if (coin && flipStatus) {
              coin.className = `coin result-${game.result}`;
              flipStatus.textContent = `Result: ${game.result.toUpperCase()}!`;
            }
            
            // Wait a moment to show the final coin state before transitioning
            setTimeout(() => {
              this.showResultScreen({
                result: game.result,
                winner: game.winner,
                winnerName: game.winnerName,
                winnerChoice: game.winnerChoice,
                totalPot: game.totalPot,
                game: game
              });
            }, 1500);
          } else {
            // Direct transition for other cases
            this.showResultScreen({
              result: game.result,
              winner: game.winner,
              winnerName: game.winnerName,
              winnerChoice: game.winnerChoice,
              totalPot: game.totalPot,
              game: game
            });
          }
          
          // Update winners ticker after game completion
          setTimeout(() => this.updateWinnersTicker(), 1000);
        }
        break;
    }
  }

  // Show error message
  showError(message) {
    // Create or update error element
    let errorElement = document.getElementById('error-message');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'error-message';
      errorElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-card);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }, 5000);
  }

  // Show confetti animation for winners
  showConfetti() {
    const confettiElement = document.createElement('div');
    confettiElement.innerHTML = '🎉'.repeat(50);
    confettiElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      font-size: 2rem;
      animation: confetti 3s ease-out;
    `;
    
    document.body.appendChild(confettiElement);
    
    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(confettiElement);
    }, 3000);
  }

  // Format timestamp
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }
}

export default UIManager;
