import './style.css'
import GunGameManager from './js/gun-game.js'
import UIManager from './js/ui.js'
import { showToast, device } from './js/utils.js'

// Initialize the application
class App {
  constructor() {
    this.gameManager = new GunGameManager();
    this.uiManager = new UIManager(this.gameManager);
    
    this.init();
  }

  init() {
    // Show welcome message
    console.log('🪙 P2P Coin Flip - Game Initialized');
    
    // Add device-specific classes
    if (device.isMobile()) {
      document.body.classList.add('mobile');
    } else if (device.isTablet()) {
      document.body.classList.add('tablet');
    } else {
      document.body.classList.add('desktop');
    }
    
    // Add touch support detection
    if (device.supportsTouch()) {
      document.body.classList.add('touch');
    }
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Handle page visibility changes
    this.setupVisibilityHandling();
    
    // Show initial toast
    setTimeout(() => {
      showToast('Welcome to P2P Coin Flip! 🪙', 'info');
    }, 1000);
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ESC key to go back or cancel
      if (e.key === 'Escape') {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
          const screenId = activeScreen.id;
          
          switch (screenId) {
            case 'create-game-screen':
            case 'join-game-screen':
              this.uiManager.showScreen('landing');
              break;
            case 'waiting-screen':
              this.gameManager.cancelGame();
              this.uiManager.showScreen('landing');
              break;
            case 'result-screen':
              this.gameManager.reset();
              this.uiManager.showScreen('landing');
              break;
          }
        }
      }
      
      // Enter key shortcuts
      if (e.key === 'Enter' && e.ctrlKey) {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
          const screenId = activeScreen.id;
          
          if (screenId === 'game-ready-screen') {
            document.getElementById('start-flip').click();
          }
        }
      }
    });
  }

  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('Game paused - tab not visible');
      } else {
        console.log('Game resumed - tab visible');
        // Refresh available games when user returns
        this.uiManager.updateAvailableGames();
      }
    });
  }
}

// Error handling
window.addEventListener('error', (e) => {
  console.error('Application error:', e.error);
  showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  showToast('A network error occurred. Please check your connection.', 'error');
  e.preventDefault();
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new App();
  });
} else {
  new App();
}

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
