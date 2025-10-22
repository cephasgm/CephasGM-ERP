// sw.js - Enhanced Service Worker for CephasGM ERP

const CACHE_NAME = 'cephasgm-erp-v4';
const API_CACHE_NAME = 'cephasgm-api-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './pwa-init.js',
  
  // Core module pages
  './admin.html',
  './attendance.html',
  './community.html',
  './customer-service.html',
  './finance.html',
  './hr.html',
  './inventory.html',
  './legal.html',
  './marketing.html',
  './meetings.html',
  './payroll.html',
  './procurement.html',
  './projects.html',
  './safety.html',
  './sales.html',
  './training.html',
  './transport.html'
];

// Install event - cache all essential resources
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Opened cache, adding resources...');
        return cache
