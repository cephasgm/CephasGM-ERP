// PWA Initializer for CephasGM ERP
class PWAInitializer {
  constructor() {
    this.deferredPrompt = null;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone;
    
    this.init();
  }
  
  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.setupEventListeners();
  }
  
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
  
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show install buttons
      this.showInstallButtons();
      
      // Show banner after 3 seconds
      setTimeout(() => {
        this.showInstallBanner();
      }, 3000);
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('App installed successfully');
      this.deferredPrompt = null;
      this.hideAllInstallOptions();
      this.showToast('App installed successfully!', 'success');
    });
  }
  
  showInstallButtons() {
    // Show all install buttons
    const installButtons = document.querySelectorAll('[data-pwa-install]');
    installButtons.forEach(btn => {
      btn.style.display = 'flex';
      btn.addEventListener('click', () => this.installPWA());
    });
  }
  
  hideAllInstallOptions() {
    // Hide banner
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.style.display = 'none';
    
    // Hide install buttons
    const installButtons = document.querySelectorAll('[data-pwa-install]');
    installButtons.forEach(btn => {
      btn.style.display = 'none';
    });
  }
  
  showInstallBanner() {
    // Don't show if already installed or dismissed recently
    if (this.isStandalone) return;
    
    const dismissed = localStorage.getItem('pwaBannerDismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return; // Don't show for 7 days after dismissal
    }
    
    const banner = document.getElementById('pwaInstallBanner');
    if (banner && this.deferredPrompt) {
      banner.classList.add('show');
    }
  }
  
  hideInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
      banner.classList.remove('show');
      localStorage.setItem('pwaBannerDismissed', Date.now().toString());
    }
  }
  
  async installPWA() {
    if (!this.deferredPrompt) {
      if (this.isIOS) {
        this.showIOSInstructions();
        return;
      }
      this.showToast('Installation not available', 'warning');
      return;
    }
    
    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install');
        this.hideInstallBanner();
      } else {
        console.log('User dismissed the install');
      }
      
      this.deferredPrompt = null;
    } catch (error) {
      console.error('Install failed:', error);
      this.showToast('Installation failed', 'error');
    }
  }
  
  showIOSInstructions() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        margin: 1rem;
        text-align: center;
      ">
        <h3 style="margin-bottom: 1rem;">Install on iOS</h3>
        <p style="margin-bottom: 1.5rem;">To install this app:</p>
        <ol style="text-align: left; margin-bottom: 1.5rem;">
          <li>Tap the Share button <span style="font-size: 1.2em;">⎋</span></li>
          <li>Scroll and tap "Add to Home Screen"</li>
          <li>Tap "Add" to install</li>
        </ol>
        <button onclick="this.closest('div[style*=\"background: white\"]').parentElement.remove()" 
                style="
                  background: #2563eb;
                  color: white;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 600;
                ">
          Got it!
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      document.getElementById('offlineIndicator')?.classList.remove('show');
    });
    
    window.addEventListener('offline', () => {
      document.getElementById('offlineIndicator')?.classList.add('show');
    });
    
    // Initial check
    if (!navigator.onLine) {
      document.getElementById('offlineIndicator')?.classList.add('show');
    }
  }
  
  setupEventListeners() {
    // Banner buttons
    document.getElementById('pwaInstallButton')?.addEventListener('click', () => {
      this.installPWA();
    });
    
    document.getElementById('pwaInstallDismiss')?.addEventListener('click', () => {
      this.hideInstallBanner();
    });
    
    document.getElementById('pwaInstallLater')?.addEventListener('click', () => {
      this.hideInstallBanner();
    });
    
    // Close banner button
    document.getElementById('closeBanner')?.addEventListener('click', () => {
      this.hideInstallBanner();
    });
  }
  
  showUpdateNotification() {
    if (confirm('A new version is available. Reload to update?')) {
      window.location.reload();
    }
  }
  
  showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
    
    // Add animation styles
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAInitializer();
  });
} else {
  window.pwaManager = new PWAInitializer();
}
