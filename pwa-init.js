// pwa-init.js - Enhanced PWA Initialization for CephasGM ERP

class PWAInitializer {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.isInstalled = false;
    
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOnlineOfflineListeners();
    this.setupNavigationHandler();
    this.checkPWAStatus();
  }

  // Register Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.worker.register('./sw.js', {
          scope: './'
        });
        
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New Service Worker found:', newWorker);
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
        
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    } else {
      console.warn('⚠️ Service Workers are not supported');
    }
  }

  // Handle PWA Installation
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA install prompt available');
      
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      
      // Show install banner
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', (e) => {
      console.log('🎉 PWA installed successfully');
      this.isInstalled = true;
      this.hideInstallBanner();
      this.deferredPrompt = null;
      
      // Show success message
      this.showToast('CephasGM ERP installed successfully!', 'success');
    });

    // Setup install button
    const installButton = document.getElementById('pwaInstallButton');
    const dismissButton = document.getElementById('pwaInstallDismiss');
    
    if (installButton) {
      installButton.addEventListener('click', () => this.installPWA());
    }
    
    if (dismissButton) {
      dismissButton.addEventListener('click', () => this.hideInstallBanner());
    }
  }

  // Show PWA Install Banner
  showInstallBanner() {
    // Don't show if already installed or in standalone mode
    if (this.isInstalled || window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }
    
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
      // Show after a delay to not interrupt initial experience
      setTimeout(() => {
        banner.classList.add('show');
      }, 3000);
    }
  }

  hideInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
      banner.classList.remove('show');
    }
  }

  // Install PWA
  async installPWA() {
    if (!this.deferredPrompt) {
      this.showToast('Installation not available', 'error');
      return;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`User response to the install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        this.showToast('Installing CephasGM ERP...', 'info');
      } else {
        this.showToast('Installation cancelled', 'warning');
      }
      
      // Clear the saved prompt since it can't be used again
      this.deferredPrompt = null;
      
      // Hide the install banner regardless of outcome
      this.hideInstallBanner();
      
    } catch (error) {
      console.error('❌ PWA installation failed:', error);
      this.showToast('Installation failed', 'error');
    }
  }

  // Online/Offline Status Management
  setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 App is online');
      this.isOnline = true;
      this.hideOfflineIndicator();
      this.showToast('Connection restored', 'success');
      
      // Sync any pending operations
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('📴 App is offline');
      this.isOnline = false;
      this.showOfflineIndicator();
      this.showToast('You are offline', 'warning');
    });

    // Initial status check
    if (!this.isOnline) {
      this.showOfflineIndicator();
    }
  }

  showOfflineIndicator() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
      indicator.classList.add('show');
    }
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
      indicator.classList.remove('show');
    }
  }

  // Enhanced Navigation Management
  setupNavigationHandler() {
    // Handle internal navigation within PWA scope
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      
      if (link && link.href && this.isInternalLink(link.href)) {
        e.preventDefault();
        this.navigateTo(link.href);
      }
    });

    // Handle browser navigation (back/forward)
    window.addEventListener('popstate', () => {
      this.handleNavigation(window.location.href);
    });
  }

  isInternalLink(href) {
    const currentOrigin = window.location.origin;
    const linkUrl = new URL(href, window.location.href);
    
    return linkUrl.origin === currentOrigin && 
           !href.startsWith('tel:') && 
           !href.startsWith('mailto:') &&
           !href.includes('.pdf') &&
           !linkUrl.searchParams.has('external');
  }

  async navigateTo(url) {
    try {
      // Show loading state
      this.showLoading();
      
      // Use fetch API to get the page content
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse the HTML and extract main content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newContent = doc.querySelector('.main-content') || doc.body;
      
      // Update the page content
      const currentContent = document.querySelector('.main-content');
      if (currentContent && newContent) {
        currentContent.innerHTML = newContent.innerHTML;
      }
      
      // Update URL without page reload
      window.history.pushState({}, '', url);
      
      // Update page title
      document.title = doc.title;
      
      // Re-initialize any page-specific scripts
      this.initializePageScripts();
      
      // Hide loading state
      this.hideLoading();
      
      console.log('🧭 Navigation completed:', url);
      
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      this.hideLoading();
      
      // Fallback to traditional navigation
      window.location.href = url;
    }
  }

  handleNavigation(url) {
    // Handle browser back/forward navigation
    this.navigateTo(url);
  }

  // PWA Status Checking
  checkPWAStatus() {
    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('📱 Running in standalone PWA mode');
    }
    
    // Check display mode support
    if ('displayMode' in window) {
      console.log('🖥️ Display mode:', window.displayMode);
    }
  }

  // Update Notification
  showUpdateNotification() {
    if (confirm('A new version of CephasGM ERP is available. Reload to update?')) {
      window.location.reload();
    }
  }

  // Toast Notifications
  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
      </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'toast-styles';
      styles.textContent = `
        .toast {
          position: fixed;
          top: 100px;
          right: 20px;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          max-width: 300px;
          transform: translateX(400px);
          transition: transform 0.3s ease;
        }
        .toast.show {
          transform: translateX(0);
        }
        .toast-success { border-left: 4px solid #10b981; }
        .toast-error { border-left: 4px solid #ef4444; }
        .toast-warning { border-left: 4px solid #f59e0b; }
        .toast-info { border-left: 4px solid #3b82f6; }
        .toast-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .toast-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #64748b;
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
  }

  // Loading State Management
  showLoading() {
    // Create or show loading indicator
    let loader = document.querySelector('.global-loader');
    
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'global-loader';
      loader.innerHTML = `
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <div class="loader-text">Loading...</div>
        </div>
      `;
      
      // Add loader styles
      const styles = document.createElement('style');
      styles.textContent = `
        .global-loader {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .loader-content {
          text-align: center;
        }
        .loader-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        .loader-text {
          color: #64748b;
          font-weight: 500;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styles);
      document.body.appendChild(loader);
    }
    
    loader.style.display = 'flex';
  }

  hideLoading() {
    const loader = document.querySelector('.global-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  // Sync Pending Operations
  async syncPendingOperations() {
    // This would sync any operations that were queued while offline
    console.log('🔄 Syncing pending operations...');
    
    // Example: Sync form submissions, data updates, etc.
    // Implementation would depend on specific app requirements
  }

  // Initialize Page-specific Scripts
  initializePageScripts() {
    // Re-initialize any scripts that need to run after navigation
    // This is a placeholder for page-specific initialization logic
    
    // Example: Re-attach event listeners, initialize components, etc.
    console.log('🔄 Initializing page scripts...');
  }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pwaInitializer = new PWAInitializer();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAInitializer;
}
