// pwa-init.js - Robust PWA initializer for CephasGM ERP
class PWAInitializer {
  constructor(options = {}) {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.isInstalled = false;
    this.swRegistration = null;
    this.options = options;
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
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers are not supported in this browser');
      return;
    }

    try {
      // register with proper scope
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      this.swRegistration = registration;
      console.log('✅ Service Worker registered:', registration);

      // handle updatefound — show update UI when new SW installs
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        console.log('🔄 New service worker found:', newWorker);

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            // If there's an active controller, this is an update
            if (navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            } else {
              console.log('✅ Service worker installed for the first time');
            }
          }
        });
      });
    } catch (err) {
      console.error('❌ Service Worker registration failed:', err);
    }
  }

  // Setup beforeinstallprompt and appinstalled handlers
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent automatic mini-infobar on some browsers
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('📱 beforeinstallprompt captured');
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', (evt) => {
      console.log('🎉 App installed', evt);
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.hideInstallBanner();
      this.showToast('CephasGM ERP installed', 'success');
    });

    // install button handlers (if present in DOM)
    document.addEventListener('click', (ev) => {
      const target = ev.target.closest?.('#pwaInstallButton, #pwaInstallDismiss');
      if (!target) return;

      if (target.id === 'pwaInstallButton') {
        this.installPWA();
      } else if (target.id === 'pwaInstallDismiss') {
        this.hideInstallBanner();
      }
    });
  }

  // Prompt the saved beforeinstallprompt event
  async installPWA() {
    if (!this.deferredPrompt) {
      this.showToast('Install not available', 'warning');
      return;
    }
    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('PWA install result:', outcome);
      if (outcome === 'accepted') {
        this.showToast('Installation accepted', 'success');
      } else {
        this.showToast('Installation dismissed', 'info');
      }
      this.deferredPrompt = null;
      this.hideInstallBanner();
    } catch (err) {
      console.error('Install failed:', err);
      this.showToast('Installation failed', 'error');
    }
  }

  showInstallBanner() {
    // don't show if already installed or in standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;
    if (this.isInstalled || standalone) return;

    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
      banner.classList.add('show');
    }
  }

  hideInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.remove('show');
  }

  // Online/offline handling
  setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.hideOfflineIndicator();
      this.showToast('Connection restored', 'success');
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineIndicator();
      this.showToast('You are offline', 'warning');
    });

    // initial
    if (!this.isOnline) this.showOfflineIndicator();
  }

  showOfflineIndicator() {
    const el = document.getElementById('offlineIndicator');
    if (el) el.classList.add('show');
  }
  hideOfflineIndicator() {
    const el = document.getElementById('offlineIndicator');
    if (el) el.classList.remove('show');
  }

  // navigation handler - only intercept same-origin navigations
  setupNavigationHandler() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest?.('a');
      if (!a || !a.href) return;
      // allow native (external) links, tel:, mailto:, target=_blank, or explicit external param
      if (a.target === '_blank' || a.hasAttribute('download') || a.dataset.external !== undefined) return;
      if (a.href.startsWith('mailto:') || a.href.startsWith('tel:')) return;

      // only intercept same-origin links
      const linkUrl = new URL(a.href, window.location.href);
      if (linkUrl.origin !== location.origin) return;

      // intercept navigations that look like page loads (no fragment-only)
      e.preventDefault();
      this.navigateTo(linkUrl.pathname + linkUrl.search + linkUrl.hash);
    });

    // popstate
    window.addEventListener('popstate', () => {
      this.navigateTo(window.location.pathname + window.location.search + window.location.hash);
    });
  }

  // Client-side navigation with partial replacement
  async navigateTo(path) {
    // if path equals current path, do nothing
    if (path === window.location.pathname + window.location.search + window.location.hash) return;

    this.showLoading();
    try {
      const res = await fetch(path, { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error('Navigation fetch failed');
      }
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const newMain = doc.querySelector('.main-content') || doc.body;
      const currentMain = document.querySelector('.main-content') || document.body;

      if (currentMain && newMain) {
        currentMain.innerHTML = newMain.innerHTML;
      }

      // Update title and history
      document.title = doc.title || document.title;
      window.history.pushState({}, '', path);

      // Re-run page scripts if needed
      this.initializePageScripts();
    } catch (err) {
      console.warn('Navigation fallback to full load due to:', err);
      window.location.href = path; // fallback
    } finally {
      this.hideLoading();
    }
  }

  // Check PWA installation / display-mode
  checkPWAStatus() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('📱 Running as standalone PWA');
    }
  }

  showUpdateNotification() {
    // non-blocking update toast
    if (confirm('A new version is available. Reload now to update?')) {
      window.location.reload();
    }
  }

  // Basic toast helper
  showToast(message, type = 'info') {
    // simple implementation - keep concise
    const toast = document.createElement('div');
    toast.className = `ce-toast ce-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Loading UI (lightweight)
  showLoading() {
    if (document.querySelector('.ce-global-loader')) {
      document.querySelector('.ce-global-loader').style.display = 'flex';
      return;
    }
    const el = document.createElement('div');
    el.className = 'ce-global-loader';
    el.innerHTML = `<div class="ce-loader-inner"><div class="ce-spinner" aria-hidden="true"></div><div class="ce-loader-text">Loading...</div></div>`;
    document.body.appendChild(el);
    // minimal styles appended once
    if (!document.getElementById('ce-pwa-styles')) {
      const s = document.createElement('style');
      s.id = 'ce-pwa-styles';
      s.textContent = `
        .ce-global-loader{position:fixed;inset:0;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;z-index:9999}
        .ce-loader-inner{text-align:center}
        .ce-spinner{width:36px;height:36px;border:4px solid #e6eefb;border-top-color:#2563eb;border-radius:50%;animation:ce-spin 1s linear infinite;margin:0 auto 8px}
        @keyframes ce-spin{to{transform:rotate(360deg)}}
        .ce-loader-text{color:#334155;font-weight:500}
        .ce-toast{position:fixed;right:20px;top:70px;background:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 8px 24px rgba(2,6,23,0.12);opacity:0;transform:translateY(-8px);transition:opacity .25s,transform .25s;z-index:10000}
        .ce-toast.show{opacity:1;transform:translateY(0)}
        .ce-toast-info{border-left:4px solid #3b82f6}
        .ce-toast-success{border-left:4px solid #10b981}
        .ce-toast-warning{border-left:4px solid #f59e0b}
        .ce-toast-error{border-left:4px solid #ef4444}
      `;
      document.head.appendChild(s);
    }
  }

  hideLoading() {
    const el = document.querySelector('.ce-global-loader');
    if (el) el.style.display = 'none';
  }

  // Placeholder sync function
  async syncPendingOperations() {
    // Implement app-specific pending sync logic here
    console.log('🔄 Attempting to sync pending operations...');
    // Example: read from IndexedDB and push to API
  }

  initializePageScripts() {
    // Reinitialize any JS components after a partial navigation
    console.log('🔁 Re-initializing page scripts');
  }
}

// instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.pwaInitializer = new PWAInitializer();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAInitializer;
}
