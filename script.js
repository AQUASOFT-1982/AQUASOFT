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

// ============================================================
//  WEATHER WIDGET — Open-Meteo (free, no API key required)
// ============================================================
(function () {
    // WMO Weather Interpretation Codes → {icon, label_en, label_ar}
    const WMO = {
        0:  { icon: '☀️', en: 'Clear Sky',          ar: 'سماء صافية' },
        1:  { icon: '🌤️', en: 'Mainly Clear',        ar: 'صافٍ في معظمه' },
        2:  { icon: '⛅', en: 'Partly Cloudy',       ar: 'غائم جزئياً' },
        3:  { icon: '☁️', en: 'Overcast',             ar: 'غائم كلياً' },
        45: { icon: '🌫️', en: 'Foggy',               ar: 'ضبابي' },
        48: { icon: '🌫️', en: 'Icy Fog',             ar: 'ضباب جليدي' },
        51: { icon: '🌦️', en: 'Light Drizzle',       ar: 'رذاذ خفيف' },
        53: { icon: '🌦️', en: 'Drizzle',             ar: 'رذاذ' },
        55: { icon: '🌦️', en: 'Heavy Drizzle',       ar: 'رذاذ كثيف' },
        61: { icon: '🌧️', en: 'Light Rain',           ar: 'مطر خفيف' },
        63: { icon: '🌧️', en: 'Rain',                 ar: 'مطر' },
        65: { icon: '🌧️', en: 'Heavy Rain',           ar: 'مطر غزير' },
        71: { icon: '❄️', en: 'Light Snow',           ar: 'ثلج خفيف' },
        73: { icon: '❄️', en: 'Snow',                 ar: 'ثلج' },
        75: { icon: '❄️', en: 'Heavy Snow',           ar: 'ثلج كثيف' },
        77: { icon: '🌨️', en: 'Snow Grains',          ar: 'حبيبات ثلجية' },
        80: { icon: '🌦️', en: 'Light Showers',        ar: 'زخات خفيفة' },
        81: { icon: '🌧️', en: 'Showers',              ar: 'زخات مطرية' },
        82: { icon: '⛈️', en: 'Violent Showers',      ar: 'زخات عنيفة' },
        85: { icon: '🌨️', en: 'Snow Showers',         ar: 'زخات ثلجية' },
        86: { icon: '🌨️', en: 'Heavy Snow Showers',   ar: 'زخات ثلجية كثيفة' },
        95: { icon: '⛈️', en: 'Thunderstorm',         ar: 'عاصفة رعدية' },
        96: { icon: '⛈️', en: 'Thunderstorm w/ Hail', ar: 'عاصفة رعدية مع برد' },
        99: { icon: '⛈️', en: 'Severe Thunderstorm',  ar: 'عاصفة رعدية شديدة' },
    };

    function getWMO(code) {
        return WMO[code] || { icon: '🌡️', en: 'Unknown', ar: 'غير معروف' };
    }

    function isArabic() {
        return document.documentElement.lang === 'ar' || document.body.classList.contains('rtl');
    }

    function t(key) {
        const lang = isArabic() ? 'ar' : 'en';
        return (translations[lang] && translations[lang][key]) || key;
    }

    function getDayLabel(dateStr, index) {
        const lang = isArabic() ? 'ar' : 'en';
        if (index === 0) return t('w_today');
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function uvLevel(uv) {
        if (uv <= 2)  return { cls: 'uv-low',      label: isArabic() ? 'منخفض' : 'Low' };
        if (uv <= 5)  return { cls: 'uv-moderate',  label: isArabic() ? 'متوسط' : 'Moderate' };
        if (uv <= 7)  return { cls: 'uv-high',      label: isArabic() ? 'مرتفع' : 'High' };
        if (uv <= 10) return { cls: 'uv-very-high', label: isArabic() ? 'مرتفع جداً' : 'Very High' };
        return { cls: 'uv-extreme', label: isArabic() ? 'خطير' : 'Extreme' };
    }

    function windDir(deg) {
        const dirs = isArabic()
            ? ['شمال','شمال شرق','شرق','جنوب شرق','جنوب','جنوب غرب','غرب','شمال غرب']
            : ['N','NE','E','SE','S','SW','W','NW'];
        return dirs[Math.round(deg / 45) % 8];
    }

    function showLoading() {
        document.getElementById('weather-loading').style.display = 'flex';
        document.getElementById('weather-error').style.display = 'none';
        document.getElementById('weather-cards').style.display = 'none';
        document.getElementById('weather-summary').style.display = 'none';
    }

    function showError(msg) {
        document.getElementById('weather-loading').style.display = 'none';
        document.getElementById('weather-error').style.display = 'flex';
        document.getElementById('weather-error-msg').textContent = msg || t('weather_error');
    }

    function renderWeather(data, cityName) {
        const daily = data.daily;
        const lang = isArabic() ? 'ar' : 'en';

        // Update location text
        document.getElementById('weather-location-text').textContent = cityName;

        // Build cards
        const grid = document.getElementById('weather-cards');
        grid.innerHTML = '';

        const temps = [], rains = [], winds = [], uvs = [];

        daily.time.forEach((dateStr, i) => {
            const wmo    = getWMO(daily.weathercode[i]);
            const tmax   = Math.round(daily.temperature_2m_max[i]);
            const tmin   = Math.round(daily.temperature_2m_min[i]);
            const rain   = (daily.precipitation_sum[i] || 0).toFixed(1);
            const wind   = Math.round(daily.windspeed_10m_max[i]);
            const windD  = windDir(daily.winddirection_10m_dominant[i]);
            const uv     = Math.round(daily.uv_index_max[i] || 0);
            const uvInfo = uvLevel(uv);
            const humid  = Math.round(daily.relative_humidity_2m_mean ? daily.relative_humidity_2m_mean[i] : 0);

            temps.push((tmax + tmin) / 2);
            rains.push(parseFloat(rain));
            winds.push(wind);
            uvs.push(uv);

            const isToday = i === 0;
            const card = document.createElement('div');
            card.className = `weather-day-card${isToday ? ' weather-today' : ''}`;
            card.innerHTML = `
                <div class="wdc-day">${getDayLabel(dateStr, i)}</div>
                <div class="wdc-icon">${wmo.icon}</div>
                <div class="wdc-desc">${lang === 'ar' ? wmo.ar : wmo.en}</div>
                <div class="wdc-temps">
                    <span class="wdc-tmax">${tmax}°</span>
                    <span class="wdc-tmin">${tmin}°</span>
                </div>
                <div class="wdc-details">
                    <div class="wdc-detail"><i class="fa-solid fa-cloud-rain"></i> ${rain} mm</div>
                    <div class="wdc-detail"><i class="fa-solid fa-wind"></i> ${wind} km/h ${windD}</div>
                    ${humid > 0 ? `<div class="wdc-detail"><i class="fa-solid fa-droplet"></i> ${humid}%</div>` : ''}
                    <div class="wdc-detail"><span class="uv-badge ${uvInfo.cls}">UV ${uv} · ${uvInfo.label}</span></div>
                </div>
            `;
            grid.appendChild(card);
        });

        // Summary bar
        const avgTemp  = (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1);
        const totRain  = rains.reduce((a,b)=>a+b,0).toFixed(1);
        const avgWind  = Math.round(winds.reduce((a,b)=>a+b,0)/winds.length);
        const maxUV    = Math.max(...uvs);
        const uvInfo   = uvLevel(maxUV);

        document.getElementById('w-avg-temp').textContent = `${avgTemp} °C`;
        document.getElementById('w-total-rain').textContent = `${totRain} mm`;
        document.getElementById('w-avg-wind').textContent = `${avgWind} km/h`;
        document.getElementById('w-max-uv').innerHTML = `${maxUV} <span class="uv-badge ${uvInfo.cls}">${uvInfo.label}</span>`;

        document.getElementById('weather-loading').style.display = 'none';
        document.getElementById('weather-error').style.display = 'none';
        document.getElementById('weather-cards').style.display = 'grid';
        document.getElementById('weather-summary').style.display = 'flex';
    }

    async function fetchWeather(lat, lon) {
        showLoading();
        try {
            // Reverse geocode using Open-Meteo's geocoding service
            let cityName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
            try {
                const geoResp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${isArabic() ? 'ar' : 'en'}`);
                if (geoResp.ok) {
                    const geoData = await geoResp.json();
                    const addr = geoData.address;
                    cityName = addr.city || addr.town || addr.village || addr.county || addr.state || cityName;
                }
            } catch(_) {}

            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
                + `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,`
                + `windspeed_10m_max,winddirection_10m_dominant,uv_index_max,relative_humidity_2m_mean`
                + `&forecast_days=7&timezone=auto`;

            const resp = await fetch(url);
            if (!resp.ok) throw new Error('API error');
            const data = await resp.json();
            renderWeather(data, cityName);
        } catch (err) {
            showError(t('weather_error'));
        }
    }

    function initWeather() {
        showLoading();
        if (!navigator.geolocation) {
            showError(isArabic()
                ? 'متصفحك لا يدعم تحديد الموقع الجغرافي.'
                : 'Your browser does not support geolocation.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            err => {
                const msgs = {
                    1: isArabic() ? 'تم رفض الإذن بالوصول إلى الموقع.' : 'Location access denied.',
                    2: isArabic() ? 'تعذّر تحديد الموقع.' : 'Location unavailable.',
                    3: isArabic() ? 'انتهت مهلة تحديد الموقع.' : 'Location request timed out.',
                };
                showError(msgs[err.code] || t('weather_error'));
            },
            { timeout: 10000, maximumAge: 300000 }
        );
    }

    document.addEventListener('DOMContentLoaded', () => {
        initWeather();

        const refreshBtn = document.getElementById('weather-refresh-btn');
        if (refreshBtn) refreshBtn.addEventListener('click', initWeather);

        const retryBtn = document.getElementById('weather-retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', initWeather);

        // Re-render labels when language switches
        document.getElementById('lang-toggle')?.addEventListener('click', () => {
            // Small delay to let language switch complete
            setTimeout(() => {
                const cards = document.getElementById('weather-cards');
                if (cards && cards.style.display !== 'none') {
                    // Re-fetch with current coordinates
                    navigator.geolocation.getCurrentPosition(
                        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                        () => {}
                    );
                }
            }, 100);
        });
    });
})();
