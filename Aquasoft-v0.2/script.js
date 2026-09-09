// Sticky Navbar on Scroll
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });

    document.querySelectorAll('.nav-links li a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileBtn.querySelector('i');
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        });
    });
}

// Subtle entrance animations for tool cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.tool-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
    observer.observe(card);
});

// ===== Localization / Language Switching =====
(function () {
    const langToggleBtn = document.getElementById('lang-toggle');
    if (!langToggleBtn) return;

    let currentLang = localStorage.getItem('aqasoft_lang') || 'en';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('aqasoft_lang', lang);

        if (lang === 'ar') {
            langToggleBtn.textContent = 'English';
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');
        } else {
            langToggleBtn.textContent = 'عربي';
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'en');
        }

        // Apply translations to all tagged elements
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key] !== undefined) {
                el.innerHTML = translations[lang][key];
            }
        });
    }

    setLanguage(currentLang);

    langToggleBtn.addEventListener('click', function () {
        setLanguage(currentLang === 'en' ? 'ar' : 'en');
    });
})();

// ===== Register PWA Service Worker =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[AQUASoft PWA] Service Worker registered:', reg.scope))
            .catch(err => console.log('[AQUASoft PWA] SW registration failed:', err));
    });
}

// ===== PWA App Installation Prompt =====
(function () {
    let deferredPrompt = null;
    const installBtn = document.getElementById('pwa-install-btn');

    if (!installBtn) return;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'inline-flex';
    });

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`[AQUASoft PWA] User response: ${outcome}`);
            deferredPrompt = null;
            installBtn.style.display = 'none';
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const isArabic = document.documentElement.lang === 'ar';
            if (isIOS) {
                alert(isArabic 
                    ? 'لتثبيت التطبيق على جهاز iOS: اضغط على أيقونة المشاركة (Share) في المتصفح ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                    : 'To install on iOS: Tap the Share button in Safari and select "Add to Home Screen".');
            } else {
                alert(isArabic
                    ? 'لتثبيت التطبيق: افتح قائمة خيارات المتصفح (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".'
                    : 'To install the app: Open your browser menu (⋮) and select "Install App" or "Add to Home Screen".');
            }
        }
    });

    window.addEventListener('appinstalled', () => {
        console.log('[AQUASoft PWA] App was installed successfully');
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });
})();

