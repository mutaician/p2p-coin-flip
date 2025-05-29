// UI management and DOM interactions
import JSConfetti from 'js-confetti';

class UIManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.jsConfetti = new JSConfetti();
    this.screens = {
      landing: document.getElementById('landing-screen'),
      createGame: document.getElementById('create-game-screen'),
      joinGame: document.getElementById('join-game-screen'),
      waiting: document.getElementById('waiting-screen'),
      gameReady: document.getElementById('game-ready-screen'),
      coinFlip: document.getElementById('coin-flip-screen'),
      result: document.getElementById('result-screen')
    };
    
    this.setupEventListeners();
    this.initializeCoinChoiceButtons();
    this.initializeWinnersTicker();
    this.showScreen('landing');
    
    // Initialize main page games
    this.updateMainPageGames();
    
    // Auto-refresh available games every 15 seconds
    setInterval(() => {
      this.updateMainPageGames();
    }, 15000);
  }

  // Initialize all event listeners
  setupEventListeners() {
    // Landing screen
    document.getElementById('create-game-btn').addEventListener('click', () => {
      this.showScreen('createGame');
    });

    // Quick join modal events
    document.getElementById('quick-join-close').addEventListener('click', () => {
      this.hideQuickJoinModal();
    });
    
    document.getElementById('quick-join-cancel').addEventListener('click', () => {
      this.hideQuickJoinModal();
    });
    
    document.getElementById('quick-join-modal').addEventListener('click', (e) => {
      if (e.target.id === 'quick-join-modal') {
        this.hideQuickJoinModal();
      }
    });
    
    document.getElementById('quick-join-form').addEventListener('submit', (e) => {
      this.handleQuickJoinGame(e);
    });

    // Create game screen
    document.getElementById('create-game-form').addEventListener('submit', (e) => {
      this.handleCreateGame(e);
    });
    
    document.getElementById('back-to-landing').addEventListener('click', () => {
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
    const gameElement = document.createElement('div');
    gameElement.className = 'game-item';
    gameElement.innerHTML = `
      <div class="game-info">
        <strong>${game.player1.name}</strong>
        <span>Bet: $${game.player1.bet}</span>
        <span>Choice: ${game.player1.choice}</span>
      </div>
      <button class="btn btn--small btn--secondary join-available-game" data-game-id="${game.id}">
        Join
      </button>
    `;
    
    const joinButton = gameElement.querySelector('.join-available-game');
    joinButton.addEventListener('click', () => {
      this.handleJoinAvailableGame(game.id);
    });
    
    return gameElement;
  }

  // Update available games on main page
  async updateMainPageGames() {
    const container = document.getElementById('main-available-games');
    const noGamesMessage = document.querySelector('.no-games-message');
    
    try {
      // Show loading state
      container.innerHTML = `
        <div class="loading-games">
          <div class="loading-spinner"></div>
          <p>Loading available games...</p>
        </div>
      `;
      noGamesMessage.style.display = 'none';
      
      const games = await this.gameManager.getAvailableGames();
      
      if (games.length === 0) {
        container.innerHTML = '';
        noGamesMessage.style.display = 'block';
        return;
      }
      
      container.innerHTML = games.map(game => `
        <div class="game-card quick-join-game" data-game-id="${game.id}">
          <div class="game-header">
            <h4>${game.player1.name}</h4>
            <span class="game-bet">💰 $${game.player1.bet}</span>
          </div>
          <div class="game-details">
            <div class="detail-item">
              <span class="detail-label">Choice</span>
              <div class="choice-display ${game.player1.choice}">
                ${game.player1.choice === 'heads' ? 'H' : 'T'}
              </div>
            </div>
            <div class="detail-item">
              <span class="detail-label">Created</span>
              <span class="detail-value">${this.getTimeAgo(game.createdAt)}</span>
            </div>
          </div>
          <div class="game-actions">
            <button class="btn btn--primary btn--small">
              🎯 Quick Join
            </button>
          </div>
        </div>
      `).join('');
      
      // Add click handlers for quick join
      container.querySelectorAll('.quick-join-game').forEach(gameCard => {
        gameCard.addEventListener('click', (e) => {
          const gameId = gameCard.dataset.gameId;
          const game = games.find(g => g.id === gameId);
          this.showQuickJoinModal(game);
        });
      });
      
      noGamesMessage.style.display = 'none';
      
    } catch (error) {
      console.error('Error updating main page games:', error);
      container.innerHTML = `
        <div class="error-state">
          <p>❌ Failed to load games</p>
          <button class="btn btn--secondary btn--small" onclick="this.updateMainPageGames()">
            Try Again
          </button>
        </div>
      `;
    }
  }

  // Show quick join modal
  showQuickJoinModal(game) {
    const modal = document.getElementById('quick-join-modal');
    const gameInfo = document.getElementById('selected-game-info');
    
    // Populate game info
    gameInfo.innerHTML = `
      <h4>🎮 Joining ${game.player1.name}'s Game</h4>
      <div class="game-details">
        <div class="detail-item">
          <span class="detail-label">Bet Amount</span>
          <span class="detail-value">💰 $${game.player1.bet}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">${game.player1.name} Chose</span>
          <div class="choice-display ${game.player1.choice}">
            ${game.player1.choice === 'heads' ? '👑 Heads' : '🔥 Tails'}
          </div>
        </div>
        <div class="detail-item">
          <span class="detail-label">You Get</span>
          <div class="choice-display ${game.player1.choice === 'heads' ? 'tails' : 'heads'}">
            ${game.player1.choice === 'heads' ? '🔥 Tails' : '👑 Heads'}
          </div>
        </div>
        <div class="detail-item">
          <span class="detail-label">Total Pot</span>
          <span class="detail-value">💰 $${game.player1.bet * 2}</span>
        </div>
      </div>
    `;
    
    // Store game info for form submission
    modal.dataset.gameId = game.id;
    modal.dataset.gameChoice = game.player1.choice === 'heads' ? 'tails' : 'heads';
    
    // Clear previous input
    document.getElementById('quick-join-name').value = '';
    
    // Show modal
    modal.classList.add('active');
    document.getElementById('quick-join-name').focus();
  }

  // Hide quick join modal
  hideQuickJoinModal() {
    const modal = document.getElementById('quick-join-modal');
    modal.classList.remove('active');
  }

  // Handle quick join form submission
  async handleQuickJoinGame(e) {
    e.preventDefault();
    
    try {
      const modal = document.getElementById('quick-join-modal');
      const gameId = modal.dataset.gameId;
      const choice = modal.dataset.gameChoice;
      const playerName = this.gameManager.validatePlayerName(
        document.getElementById('quick-join-name').value
      );
      
      // Hide modal first
      this.hideQuickJoinModal();
      
      // Show loading
      this.showToast('Joining game...', 'info');
      
      // Join the game with the predetermined choice
      const game = await this.gameManager.joinGame(gameId, playerName);
      
      // Set up real-time subscription for game updates
      await this.gameManager.subscribeToGame(game.id, (updatedGame) => {
        this.handleGameUpdate(updatedGame);
      });
      
      this.showGameReadyScreen(game);
      this.showToast(`Successfully joined the game! 🎮`, 'success');
      
    } catch (error) {
      this.hideQuickJoinModal();
      console.error('Quick join error:', error);
      this.showToast(`Error: ${error.message}`, 'error');
    }
  }

  // Show a toast message
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 3000);
  }

  // Helper method to get time ago string
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
    // Use js-confetti for better effects
    this.jsConfetti.addConfetti({
      confettiColors: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'
      ],
      confettiRadius: 6,
      confettiNumber: 200
    });
    
    // Add a second burst with emojis
    setTimeout(() => {
      this.jsConfetti.addConfetti({
        emojis: ['🎉', '🎊', '🏆', '💰', '🪙', '🎯'],
        emojiSize: 30,
        confettiNumber: 30
      });
    }, 300);
  }

  // Format timestamp
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }
}

export default UIManager;
