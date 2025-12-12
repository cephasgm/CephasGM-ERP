# CephasGM-ERP

CephasGM Enterprise Resource Planning (ERP) — a lightweight, modular, PWA-enabled front‑end designed to host multiple enterprise modules such as Finance, HR, Inventory, Sales, Projects, and more. The system is intentionally designed as a static GitHub Pages deployment, suitable for prototyping, UI/UX validation, and phased functional expansion.

---

## 📌 Features

* **PWA-ready**: Includes `manifest.json`, service worker (`sw.js`), and icons for installation on desktop/mobile.
* **Offline Support**: Designed to cache core assets for offline fallback.
* **Modular Architecture**: Each module is isolated as its own HTML file for clarity and simplicity.
* **Lightweight & Fast**: Pure HTML/CSS/JS — no framework overhead unless added later.
* **Scalable Structure**: Easy migration to SPA or templating engine (Eleventy, Hugo, etc.).

---

## 📁 Project Structure

```
CephasGM-ERP/
├── index.html                    # Main dashboard / landing page
├── manifest.json                 # PWA configuration
├── sw.js                         # Service Worker (offline caching)
├── pwa-intl.js                   # Internationalization handler
├── icon-192.png                  # PWA icon (small)
├── icon-512.png                  # PWA icon (large)
├── README.md                     # (You are here)
├── LICENSE                       # Project license (MIT)
├── Module Pages:
│   ├── admin.html                # Administration
│   ├── attendance.html           # Attendance tracking
│   ├── community.html            # Community & engagement
│   ├── customer-service.html     # Customer support
│   ├── finance.html              # Finance & accounting
│   ├── hr.html                   # Human Resources
│   ├── inventory.html            # Inventory management
│   ├── legal.html                # Legal documentation
│   ├── marketing.html            # Marketing & outreach
│   ├── meeting.html              # Meetings (converted from .shtml if needed)
│   ├── payroll.html              # Payroll processing
│   ├── procurement.html          # Procurement workflows
│   ├── projects.html             # Project management
│   ├── safety.html               # Safety, HSE & compliance
│   ├── sales.html                # Sales operations
│   ├── training.html             # Training & development
│   └── transport.html            # Transport & logistics
```

---

## 🚀 Getting Started

### **1. Clone the Repository**

```bash
git clone https://github.com/cephasgm/CephasGM-ERP.git
cd CephasGM-ERP
```

### **2. Run Locally**

Use any static server:

```bash
npx http-server . -p 8080
```

Then open:

```
http://localhost:8080/
```

GitHub Pages automatically serves the site from the `main` branch.

---

## 🧩 PWA Notes

* Ensure `icon-192.png` and `icon-512.png` are referenced correctly in `manifest.json`.
* Update `sw.js` cache version when modifying core assets.
* Add an `offline.html` page for better offline experience.

---

## 🔒 Security Recommendations

* Add a Content Security Policy (CSP) via `<meta http-equiv="Content-Security-Policy" ...>`.
* Use HTTPS-only external assets.
* Avoid caching sensitive pages in the service worker.

---

## 🤝 Contributing

1. Fork the repository
2. Create a new feature branch (`feature/module-updates`)
3. Commit improvements
4. Submit a pull request

Please ensure your PR passes linting and preserves modular structure.

---

## 📄 License

This project is licensed under the **MIT License** — see the `LICENSE` file for details.

---

# LICENSE (MIT License)

MIT License

Copyright (c) 2025 Cephas Gideon Mkama

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
