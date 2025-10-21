// pwa-init.js - PWA Initialization for CephasGM ERP
class PWAInitializer {
  constructor() {
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.setupAppBadge();
    this.checkForUpdates();
  }

  // Register Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('✅ Service Worker registered successfully:', registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New Service Worker found...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  // Handle Install Prompt
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      this.deferredPrompt = null;
      this.hideInstallButton();
      this.showNotification('App installed successfully!', 'success');
    });
  }

  // Show Install Button
  showInstallButton() {
    // Create install button if it doesn't exist
    let installBtn = document.getElementById('pwa-install-btn');
    if (!installBtn) {
      installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.innerHTML = '📱 Install App';
      installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2563eb;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        z-index: 10000;
        transition: all 0.3s ease;
      `;
      
      installBtn.addEventListener('mouseenter', () => {
        installBtn.style.transform = 'translateY(-2px)';
        installBtn.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
      });
      
      installBtn.addEventListener('mouseleave', () => {
        installBtn.style.transform = 'translateY(0)';
        installBtn.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
      });

      installBtn.addEventListener('click', () => this.installApp());
      document.body.appendChild(installBtn);
    }
  }

  hideInstallButton() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.remove();
    }
  }

  // Install App
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
      } else {
        console.log('❌ User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
    }
  }

  // Offline Detection
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.showNotification('Connection restored', 'success');
      document.body.classList.remove('offline');
    });

    window.addEventListener('offline', () => {
      this.showNotification('You are currently offline', 'warning');
      document.body.classList.add('offline');
    });

    // Initial check
    if (!navigator.onLine) {
      document.body.classList.add('offline');
      this.showNotification('You are currently offline', 'warning');
    }
  }

  // App Badge (for notifications)
  setupAppBadge() {
    if ('setAppBadge' in navigator) {
      // You can set app badge for notifications count
      // navigator.setAppBadge(0);
    }
  }

  // Update Notifications
  showUpdateNotification() {
    if (this.isStandalone) {
      this.showNotification('New version available. Restart the app to update.', 'info');
    } else {
      const updateBtn = this.createUpdateButton();
      document.body.appendChild(updateBtn);
    }
  }

  createUpdateButton() {
    const updateBtn = document.createElement('button');
    updateBtn.innerHTML = '🔄 Update Available';
    updateBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
    `;
    
    updateBtn.addEventListener('click', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        });
      }
    });

    return updateBtn;
  }

  // Check for updates
  checkForUpdates() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
  }

  // Notification System
  showNotification(message, type = 'info') {
    // Use your existing notification system or create a simple one
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      // Fallback notification
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add meta tags for PWA
  this.addPWAMetaTags();
  
  // Initialize PWA
  window.pwa = new PWAInitializer();
  
  // Log PWA status
  console.log('🚀 CephasGM ERP PWA Initialized');
  console.log('📱 Standalone Mode:', window.matchMedia('(display-mode: standalone)').matches);
  console.log('🔧 Service Worker:', 'serviceWorker' in navigator);
});

// Add necessary meta tags
function addPWAMetaTags() {
  const existingMeta = document.querySelector('meta[name="theme-color"]');
  if (!existingMeta) {
    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    metaThemeColor.content = '#2563eb';
    document.head.appendChild(metaThemeColor);
  }

  const metaApple = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
  if (!metaApple) {
    const appleMeta1 = document.createElement('meta');
    appleMeta1.name = 'apple-mobile-web-app-capable';
    appleMeta1.content = 'yes';
    document.head.appendChild(appleMeta1);

    const appleMeta2 = document.createElement('meta');
    appleMeta2.name = 'apple-mobile-web-app-status-bar-style';
    appleMeta2.content = 'black-translucent';
    document.head.appendChild(appleMeta2);

    const appleMeta3 = document.createElement('meta');
    appleMeta3.name = 'apple-mobile-web-app-title';
    appleMeta3.content = 'CephasGM ERP';
    document.head.appendChild(appleMeta3);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAInitializer;
}
