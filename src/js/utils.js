// Utility functions and helpers

// Format currency values
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format time relative to now
export const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

// Generate secure random values
export const generateSecureRandom = (min = 0, max = 1) => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] / (0xFFFFFFFF + 1)) * (max - min);
};

// Debounce function for input handling
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Validate email format (if needed for future features)
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize HTML to prevent XSS
export const sanitizeHTML = (str) => {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Show toast notification
export const showToast = (message, type = 'info', duration = 3000) => {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-card);
    color: var(--text-primary);
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: var(--shadow-card);
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
    border-left: 4px solid var(--primary-color);
  `;
  
  if (type === 'success') {
    toast.style.borderLeftColor = 'var(--success-color)';
  } else if (type === 'error') {
    toast.style.borderLeftColor = 'var(--danger-color)';
  } else if (type === 'warning') {
    toast.style.borderLeftColor = 'var(--warning-color)';
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
};

// Local storage helpers with error handling
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }
};

// Device detection
export const device = {
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  isTablet: () => {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  },
  
  isDesktop: () => {
    return !device.isMobile() && !device.isTablet();
  },
  
  supportsTouch: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
};

// Animation helpers
export const animate = {
  fadeIn: (element, duration = 300) => {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    
    const fade = (timestamp) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };
    
    requestAnimationFrame(fade);
  },
  
  fadeOut: (element, duration = 300) => {
    const start = performance.now();
    const initialOpacity = parseFloat(getComputedStyle(element).opacity);
    
    const fade = (timestamp) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = initialOpacity * (1 - progress);
      
      if (progress >= 1) {
        element.style.display = 'none';
      } else {
        requestAnimationFrame(fade);
      }
    };
    
    requestAnimationFrame(fade);
  },
  
  slideIn: (element, direction = 'down', duration = 300) => {
    const transforms = {
      down: 'translateY(-20px)',
      up: 'translateY(20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)'
    };
    
    element.style.transform = transforms[direction];
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    
    const slide = (timestamp) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.transform = `${transforms[direction]} scale(${0.9 + 0.1 * progress})`;
      element.style.opacity = progress;
      
      if (progress >= 1) {
        element.style.transform = 'none';
      } else {
        requestAnimationFrame(slide);
      }
    };
    
    requestAnimationFrame(slide);
  }
};

// Performance monitoring
export const performance = {
  mark: (name) => {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  },
  
  measure: (name, startMark, endMark) => {
    if (window.performance && window.performance.measure) {
      window.performance.measure(name, startMark, endMark);
    }
  },
  
  getEntriesByType: (type) => {
    if (window.performance && window.performance.getEntriesByType) {
      return window.performance.getEntriesByType(type);
    }
    return [];
  }
};
