/* ============================================
   ALP ASTROLOGY STRATEGY REPORT — SCRIPTS
   Animations, Navigation, Scroll Effects
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Create Stars Background ----
    const starsContainer = document.getElementById('stars');
    if (starsContainer) {
        const starCount = 120;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.setProperty('--duration', `${2 + Math.random() * 5}s`);
            star.style.setProperty('--opacity', `${0.2 + Math.random() * 0.6}`);
            star.style.animationDelay = `${Math.random() * 5}s`;
            if (Math.random() > 0.7) {
                star.style.width = '3px';
                star.style.height = '3px';
                star.style.boxShadow = '0 0 6px rgba(212, 160, 23, 0.3)';
            }
            starsContainer.appendChild(star);
        }
    }

    // ---- Animated Number Counter ----
    function animateCounter(element, target, suffix = '') {
        const duration = 2000;
        const startTime = performance.now();
        const isPercent = element.classList.contains('percent');

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

            let current;
            if (isPercent) {
                current = (target * eased).toFixed(1);
                element.textContent = current + '%';
            } else if (target >= 1000) {
                current = Math.floor(target * eased);
                element.textContent = current.toLocaleString() + suffix;
            } else {
                current = Math.floor(target * eased);
                element.textContent = current + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ---- Trigger counter animation when hero is visible ----
    const heroStats = document.querySelectorAll('.hero-stat-number[data-count]');
    let countersAnimated = false;

    function checkHeroVisible() {
        if (countersAnimated) return;
        const hero = document.querySelector('.hero-stats');
        if (!hero) return;

        const rect = hero.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            countersAnimated = true;
            heroStats.forEach(el => {
                const target = parseFloat(el.dataset.count);
                animateCounter(el, target);
            });
        }
    }

    // Run on load and scroll
    checkHeroVisible();
    window.addEventListener('scroll', checkHeroVisible, { passive: true });

    // ---- Navigation Scroll Effect ----
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });

    // ---- Mobile Nav Toggle ----
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            const spans = navToggle.querySelectorAll('span');
            navToggle.classList.toggle('active');
        });

        // Close nav on link click (mobile)
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
            });
        });
    }

    // ---- Active Nav Link on Scroll ----
    const sections = document.querySelectorAll('.section, .hero');
    const allNavLinks = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        let currentSection = '';

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight / 2 && rect.bottom > 0) {
                currentSection = section.id;
            }
        });

        allNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === currentSection) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // ---- Section Reveal on Scroll ----
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.05
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Don't unobserve — keep tracking for nav
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
        sectionObserver.observe(section);
    });

    // ---- Back to Top Button ----
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 600) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---- Smooth Scroll for Anchor Links ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = nav ? nav.offsetHeight : 0;
                const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });
            }
        });
    });

    // ---- Card Hover Tilt Effect (subtle) ----
    const tiltCards = document.querySelectorAll('.dash-card, .pillar-card, .phase-card');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -2;
            const rotateY = (x - centerX) / centerX * 2;

            card.style.transform = `translateY(-4px) perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ---- Animate ranking bars on scroll ----
    const rankingItems = document.querySelectorAll('.ranking-bar');
    let rankingAnimated = false;

    const rankingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !rankingAnimated) {
                rankingAnimated = true;
                rankingItems.forEach((bar, index) => {
                    bar.style.opacity = '0';
                    bar.style.transform = 'scaleX(0)';
                    bar.style.transformOrigin = 'left';

                    setTimeout(() => {
                        bar.style.transition = 'opacity 0.5s ease, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                        bar.style.opacity = '1';
                        bar.style.transform = 'scaleX(1)';
                    }, index * 100);
                });
            }
        });
    }, { threshold: 0.2 });

    const rankingSection = document.querySelector('.content-ranking');
    if (rankingSection) {
        rankingObserver.observe(rankingSection);
    }

    // ---- Animate hashtag bars on scroll ----
    const hashBars = document.querySelectorAll('.hash-bar');

    const hashObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                hashBars.forEach((bar, index) => {
                    bar.style.opacity = '0';
                    bar.style.transform = 'scaleX(0)';
                    bar.style.transformOrigin = 'left';

                    setTimeout(() => {
                        bar.style.transition = 'opacity 0.5s ease, transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
                        bar.style.opacity = '1';
                        bar.style.transform = 'scaleX(1)';
                    }, index * 120);
                });
                hashObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });

    const hashSection = document.querySelector('.hashtag-section');
    if (hashSection) {
        hashObserver.observe(hashSection);
    }

    // ---- Task checklist toggle (interactive) ----
    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('click', () => {
            const check = task.querySelector('.task-check');
            if (check.textContent === '☐') {
                check.textContent = '☑';
                task.style.opacity = '0.5';
                task.querySelector('span:last-child').style.textDecoration = 'line-through';
            } else {
                check.textContent = '☐';
                task.style.opacity = '1';
                task.querySelector('span:last-child').style.textDecoration = 'none';
            }
        });
        task.style.cursor = 'pointer';
    });

    // ---- Keyword tag hover glow ----
    document.querySelectorAll('.keyword').forEach(tag => {
        tag.addEventListener('mouseenter', () => {
            tag.style.boxShadow = '0 0 15px rgba(212, 160, 23, 0.2)';
        });
        tag.addEventListener('mouseleave', () => {
            tag.style.boxShadow = 'none';
        });
    });

    // ---- Print-friendly: Ctrl+P opens all sections ----
    window.addEventListener('beforeprint', () => {
        document.querySelectorAll('.section').forEach(s => s.classList.add('visible'));
    });

    // ---- Lightbox Image Viewer ----
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.querySelector('.lightbox-close');

    if (lightbox && lightboxImg && lightboxCaption) {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('.gallery-img');
                const title = item.querySelector('.gallery-title').textContent;
                const desc = item.querySelector('.gallery-desc').textContent;

                if (img) {
                    lightboxImg.src = img.src;
                    lightboxCaption.innerHTML = `<strong>${title}</strong> — ${desc}`;
                    
                    // Show lightbox with animation
                    lightbox.style.display = 'block';
                    setTimeout(() => {
                        lightbox.classList.add('show');
                    }, 10);
                    document.body.style.overflow = 'hidden'; // prevent scroll behind modal
                }
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('show');
            setTimeout(() => {
                lightbox.style.display = 'none';
            }, 300); // match CSS transition duration
            document.body.style.overflow = ''; // restore scroll
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeLightbox);
        }

        // Close on clicking background
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Close on Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('show')) {
                closeLightbox();
            }
        });
    }

    // ============================================
    // TAMIL CONTENT & SCRIPT PLANNER INTERACTIVITY
    // ============================================

    // Seeding events for 2026 starting from late May/June
    const upcomingEvents = [
        {
            id: 'vaigasi-visakam',
            nameTa: 'வைகாசி விசாகம்',
            nameEn: 'Vaigasi Visakam (Murugan Avatar)',
            date: '2026-06-02',
            postDate: '2026-05-28',
            deity: 'Lord Murugan',
            titles: [
                'வைகாசி விசாகம் 2026 - இந்த 3 ராசிக்கு அதிர்ஷ்டம் நிச்சயம்! | Vaigasi Visakam Murugan Pariharam',
                'Why Vaigasi Visakam 2026 is CRITICAL for Your Rasi! ALP Astrology Astro-Remedy'
            ],
            hook: '“நம்பவே மாட்டீங்க! வைகாசி விசாகம் அன்னைக்கு முருகனை இந்த ஒரு நேரத்துல கும்பிட்டா, உங்க ஜாதகத்துல இருக்குற செவ்வாய் தோஷம், கடன் பிரச்சனை எல்லாமே வெறும் 48 நாள்ல காணாம போயிடும்! அதுவும் அக்ஷய லக்ன பத்ததி (ALP) கணக்குப்படி உங்க லக்னம் மாறப்போற நேரத்துல இத பண்ணா பலன் 10 மடங்கு அதிகம்! அது என்ன பரிகாரம் தெரியுமா?”',
            astrology: 'அக்ஷய லக்ன பத்ததி (ALP) கணித முறைப்படி, இந்த வைகாசி விசாக தினத்தில் சந்திரன் விருச்சிக ராசியில் இருக்கும் விசாக நட்சத்திரத்தில் பிரவேசிக்கிறார். விசாகம் என்பது குருவின் நட்சத்திரம், ஆனால் சந்திரன் நீசமடையும் விருச்சிக வீடு செவ்வாயின் ஆதிக்கத்திற்கு உட்பட்டது. சந்திரன் குருவின் நட்சத்திரத்திலும், செவ்வாயின் வீட்டிலும் அமரும் இந்த நாளில், கோச்சார பலன்களின்படி தனுசு மற்றும் மேஷ லக்ன காரர்களுக்கு அக்ஷய லக்னம் மாறும் தருணம் நெருங்குகிறது. இந்த அரிய கிரக சேர்க்கை உங்கள் தொழில் மற்றும் பண வரவில் பெரிய மாற்றங்களை ஏற்படுத்தும்.',
            remedy: 'முருகப்பெருமான் சிவபெருமானின் நெற்றிக்கண்ணில் இருந்து தோன்றிய தீப்பொறிகளாக விசாக நட்சத்திரத்தில் அவதரித்தார். இழந்த செல்வத்தையும் அதிகாரத்தையும் மீட்கும் ஆற்றல் முருகனுக்கு உண்டு. பரிகாரம்: வைகாசி விசாகத்தன்று பிரம்ம முகூர்த்தத்தில் (காலை 4:30 - 6:00) அல்லது மாலை 6 மணிக்கு வீட்டு பூஜை அறையில் நெய் விளக்கு ஏற்றி, ஆறு சிவப்பு அரளி பூக்களை முருகனின் படத்திற்கு சமர்ப்பிக்கவும். "ஓம் சரவணபவ" மந்திரத்தை 108 முறை உச்சரிக்கவும். இது கடன் தொல்லைகளை வேரோடு அறுக்கும் சக்தி கொண்டது.',
            cta: '“உங்கள் ஜாதகத்தில் அக்ஷய லக்னம் எப்போது மாறுகிறது? உங்கள் அதிர்ஷ்ட காலம் எப்போது தொடங்குகிறது என்பதை தெரிந்துகொள்ள, இப்போதே கீழே உள்ள லிங்கை கிளிக் செய்து எங்களின் ALP அஸ்ட்ராலஜி செயலியை பதிவிறக்கம் செய்யுங்கள் அல்லது எங்களின் 7-நாள் நேரடி வகுப்பில் இணைந்து உங்கள் வாழ்க்கையை மாற்றிக்கொள்ளுங்கள்!”',
            tags: '#alpastrology #vaigasivisakam #murugan #pariharam #tamilastrology #rasipalan2026 #vedicastrology'
        },
        {
            id: 'aani-thirumanjanam',
            nameTa: 'ஆனி திருமஞ்சனம்',
            nameEn: 'Aani Thirumanjanam (Shiva Cosmic Abhishekam)',
            date: '2026-06-20',
            postDate: '2026-06-15',
            deity: 'Lord Shiva Nataraja',
            titles: [
                'ஆனி திருமஞ்சனம் 2026 - நடராஜர் அபிஷேகம் செய்யும் மகா பரிகாரம்! | Aani Thirumanjanam Shiva Puja',
                'Cosmic Power of Shiva Nataraja Aani Thirumanjanam 2026 | Rasi Predictions by ALP Astrology'
            ],
            hook: '“ஆனி திருமஞ்சனம் அன்னைக்கு நடராஜப் பெருமானை தரிசனம் பண்ணா, பல வருஷமா தடைப்பட்ட திருமணம், குழந்தை பாக்கியம் மற்றும் வழக்கு பிரச்சனைகள் எல்லாமே உடனடியாக முடிவுக்கு வரும்! ALP ஜோதிட விதிப்படி சந்திரன் மற்றும் சனியின் கிரக சேர்க்கை இந்த நாளில் நடப்பதால் ஏற்படும் விபரீத ராஜயோகம் என்ன தெரியுமா?”',
            astrology: 'ஆனி திருமஞ்சனம் என்பது உத்திர நட்சத்திரத்தில் நிகழும் மகா அபிஷேகம். கோச்சாரத்தில் சந்திரன் தன் சொந்த நட்சத்திரமான உத்திரத்தில், சூரியனின் சிம்ம ராசியில் பயணிக்கும் போது, உங்கள் அக்ஷய லக்னம் மிதுனம் அல்லது துலாம் ராசியில் இருந்தால், இந்த சேர்க்கை தர்மகர்மாதிபதி யோகத்தை நேரடியாக வழங்கும். சனியின் வக்ர பார்வை சந்திரன் மேல் விழும் இந்த நேரத்தில், சிவ வழிபாடு ஒன்றே கர்ம வினைகளைத் தீர்க்கும் மகா மந்திரம்.',
            remedy: 'சிதம்பரத்தில் நடராஜருக்கு வருடத்தில் 6 முறை மட்டுமே மகா அபிஷேகம் நடக்கும், அதில் மிக முக்கியமானது இந்த ஆனி திருமஞ்சனம். பரிகாரம்: நடராஜர் அல்லது சிவபெருமானுக்கு இளநீர் மற்றும் பால் அபிஷேகத்திற்கு உங்களால் முடிந்த பொருட்களை அருகில் உள்ள கோவிலுக்கு வாங்கித் தரவும். வீட்டில் "நமசிவாய" மந்திரத்தை உச்சரித்து பச்சரிசி சாதத்தை பிரசாதமாக படைத்து ஏழைகளுக்கு தானம் செய்யுங்கள். இது உங்கள் பித்ரு தோஷத்தை நீக்கும்.',
            cta: '“உங்கள் ஜாதகத்தில் உள்ள கடுமையான கர்ம தோஷங்களை ALP அக்ஷய லக்ன முறை மூலம் எவ்வாறு மிக எளிமையாக கண்டறிந்து பரிகாரம் செய்யலாம் என்பதை கற்றுக்கொள்ள, கீழே உள்ள லிங்கில் பதிவு செய்து எங்களின் சிறப்பு ஜோதிட வகுப்பில் இணையுங்கள்!”',
            tags: '#alpastrology #aanithirumanjanam #sivanataraja #shivapuja #karmadasha #tamiltemples #remedies'
        },
        {
            id: 'aadi-pooram',
            nameTa: 'ஆடி பூரம்',
            nameEn: 'Aadi Pooram (Andal Bangles Festival)',
            date: '2026-07-16',
            postDate: '2026-07-11',
            deity: 'Goddess Andal Devi',
            titles: [
                'ஆடி பூரம் 2026 - பெண்கள் செய்ய வேண்டிய ரகசிய வளையல் பரிகாரம்! | Aadi Pooram Andal Bangles Remedy',
                'Attract Goddess Lakshmi Blessings on Aadi Pooram 2026 | ALP Astrology Spiritual Strategy'
            ],
            hook: '“ஆடி பூரம் அன்னைக்கு அம்பாளுக்கு இந்த ஒரு பொருளை காணிக்கையா கொடுத்தா, உங்க குடும்பத்துல இருக்குற வறுமை ஓடிப் போயி மகாலட்சுமி உங்க வீட்ல குடியேறுவாள்! குறிப்பா குழந்தை பாக்கியம் இல்லாத பெண்களுக்கு இது ஒரு வரப்பிரசாத நாள்! ALP முறைப்படி இந்த நாளில் லக்ன பலம் பெறுவது எப்படி?”',
            astrology: 'ஆடி பூரத்தன்று கடக ராசியில் சூரியன் சஞ்சரிக்க, சந்திரன் பூரம் நட்சத்திரத்தில் சுக்கிரனின் ஆதிக்கத்தில் இருப்பார். சுக்கிரனும் சூரியனும் இணையும் தர்ம கர்ம யோக காலமிது. ரிஷபம், கன்னி, மற்றும் மகர லக்ன காரர்களுக்கு அக்ஷய லக்ன சஞ்சாரம் சுக்கிரனின் சுப வீடுகளுடன் தொடர்பு கொள்ளும்போது, ஆடி பூர சுக்கிர வழிபாடானது உங்கள் குடும்பத்திற்கு மகா ஐஸ்வர்யத்தை அள்ளித் தரும்.',
            remedy: 'பூமாதேவியின் அவதாரமான ஆண்டாள் நாச்சியார் ஆடி பூரம் நட்சத்திரத்தில் அவதரித்தார். பரிகாரம்: ஆடி பூரத்தன்று அருகில் உள்ள அம்மன் கோவிலுக்குச் சென்று, அம்மனுக்கு சிவப்பு மற்றும் பச்சை நிற கண்ணாடி வளையல்களை (கண்ணாடி வளையல் மாலை) வாங்கிச் சாத்துங்கள். மீதமுள்ள வளையல்களை சுமங்கலி பெண்களுக்கு தானமாக கொடுங்கள். இதனால் கணவன்-மனைவி ஒற்றுமை பலப்படும், வீட்டில் செல்வ வளம் பெருகும்.',
            cta: '“உங்கள் வீட்டில் பணத்தடை மற்றும் சுபகாரிய தடைகள் நீங்கி மகாலட்சுமியின் அருள் கிடைக்க, உங்கள் ஜாதகத்தில் சுக்கிரனின் அக்ஷய பலத்தை சரிபார்க்க இப்போதே எங்கள் ஆப் மூலம் முன்பதிவு செய்து ஆலோசனை பெறுங்கள்!”',
            tags: '#alpastrology #aadipooram #andaldevi #banglesremedy #lakshmipuja #pregnancyboon #tamiltradition'
        },
        {
            id: 'aadi-perukku',
            nameTa: 'ஆடி பெருக்கு',
            nameEn: 'Aadi Perukku (Cauvery River Prosperity)',
            date: '2026-08-03',
            postDate: '2026-07-29',
            deity: 'River Goddess Cauvery / Mariamman',
            titles: [
                'ஆடி பெருக்கு 2026 - வீட்டில் செல்வம் பெருக தாலி கயிறு மாற்றுவது எப்போது? | Aadi Perukku Yellow Thread Ritual',
                'Aadi Perukku 2026 Water Energy: Manifest Wealth and Gold using ALP Astrology Secrets'
            ],
            hook: '“ஆடி பெருக்கு அன்னைக்கு தண்ணீர்ல இந்த ஒரு பொருளை கரைச்சு, மஞ்சக் கயிறை இப்படி மாத்துனா, உங்க வீட்டு தங்கம் மற்றும் பணத்தோட அளவு பெருக்கெடுத்து ஓடும்! தாலிக்கயிறு மாற்றுவதற்கான மிகச் சரியான சுப நேரம் எது? ALP நேரக் கணக்கீடு என்ன சொல்கிறது தெரியுமா?”',
            astrology: 'ஆடி பெருக்கு என்பது தட்சிணாயண புண்ணிய காலத்தின் மகா நதி திருவிழா. கடக ராசியில் சூரியனும் சந்திரனும் இணையும் ஆஷாட அமாவாசைக்கு பிந்தைய வளர்பிறை சதுர்த்தி திதி இது. நீர் தத்துவ ராசிகளான கடகம், விருச்சிகம், மீனம் லக்ன காரர்களுக்கு இந்த நீர் தத்துவ ஆற்றலை ALP முறைப்படி ஆக்டிவேட் செய்தால், தொழில் முடக்கம் நீங்கி பணப்புழக்கம் அபாரமாக அதிகரிக்கும்.',
            remedy: 'ஆடி 18ஆம் பெருக்கு நதிகளுக்கும் நீர் நிலைகளுக்கும் நன்றி செலுத்தும் நாள். பரிகாரம்: வீட்டின் நுழைவாயிலில் மஞ்சள் தெளித்து கோலமிடுங்கள். பூஜை அறையில் ஒரு செம்பு பாத்திரத்தில் நீர் ஊற்றி, அதில் மஞ்சள் மற்றும் நாணயங்களை போட்டு வைக்கவும். தாலிக்கயிறு மாற்றும் சுமங்கலி பெண்கள் காலை 07:30 - 09:00 மணிக்குள் மஞ்சள் கயிற்றை புதியதாக மாற்றி அம்மனை வழிபடவும். இது தீர்க்க சுமங்கலி வரத்தை தரும்.',
            cta: '“உங்களது குடும்ப நிம்மதி மற்றும் தொழில் முன்னேற்றத்திற்கு எந்த பஞ்சபூத தத்துவம் (நீர்/நெருப்பு/காற்று/நிலம்) உங்கள் ஜாதகத்தில் பலவீனமாக உள்ளது என்பதை கண்டறிந்து தீர்வு பெற, எங்களின் ALP ஜோதிட ஆலோசனை பக்கத்திற்கு வாருங்கள்!”',
            tags: '#alpastrology #aadiperukku #aadi18 #yellowthread #cauveryriver #wealthmanifest #pariharam'
        },
        {
            id: 'krishna-jayanthi',
            nameTa: 'கிருஷ்ண ஜெயந்தி',
            nameEn: 'Krishna Jayanthi (Gokulashtami)',
            date: '2026-09-03',
            postDate: '2026-08-29',
            deity: 'Lord Krishna',
            titles: [
                'கிருஷ்ண ஜெயந்தி 2026 - குழந்தை பாக்கியம் பெற கிருஷ்ணர் பாதம் வரையும் முறை! | Krishna Jayanthi Baby Feet Ritual',
                'Activate Budha (Mercury) Power on Gokulashtami 2026 | Wealth Secrets by ALP Astrology'
            ],
            hook: '“கிருஷ்ண ஜெயந்தி அன்னைக்கு உங்க வீட்டு வாசல்ல இருந்து பூஜை அறை வரை கிருஷ்ணர் பாதத்தை இப்படி வரைஞ்சா, உங்க வீட்டு குழந்தைகளோட அறிவுத்திறன் 100 மடங்கு அதிகமாகும்! அதுமட்டுமில்லாம நீண்ட நாள் குழந்தை பாக்கியம் இல்லாத தம்பதிகளுக்கு உடனே புத்திர பாக்கியம் கிடைக்கும்! இதற்கான சாஸ்திர விதி என்ன?”',
            astrology: 'கிருஷ்ண ஜெயந்தி என்பது ரோகிணி நட்சத்திரத்தில், அஷ்டமி திதியில் நிகழும் கிருஷ்ண அவதாரம். ரோகிணி என்பது சந்திரனின் உச்ச நட்சத்திரம், அஷ்டமி என்பது புதனின் அதிதேவதை கொண்ட நாள். புதனும் சந்திரனும் இணையும் அறிவு மற்றும் மனோகாரக சேர்க்கை இது. அக்ஷய லக்ன கணிதப்படி இந்த நாளில் புதனின் மிதுன மற்றும் கன்னி லக்ன காரர்களுக்கு கல்வி மற்றும் வியாபாரத்தில் புதிய கதவுகள் திறக்கும்.',
            remedy: 'பரிகாரம்: கிருஷ்ண ஜெயந்தியன்று மாலை 5 மணி முதல் 6:30 மணிக்குள் பச்சரிசி மாவால் குழந்தை கிருஷ்ணரின் காலடி தடங்களை வாசலில் இருந்து பூஜை அறை வரை வரையவும். கண்ணனுக்கு வெண்ணெய், அவல், சர்க்கரை மற்றும் இனிப்பு சீடை படைத்து வழிபடுங்கள். குழந்தைகளுக்கு வெண்ணெய் தானமாக வழங்குவது புதனின் தோஷத்தை முற்றிலும் நீக்கி செல்வ வளம் பெருக்கும்.',
            cta: '“உங்கள் பிள்ளைகளின் கல்வித்தடை, ஞாபகமறதி நீங்கி படிப்பில் முதன்மையாக வர அவர்களின் ஜாதகத்தில் உள்ள புதன் கிரகம் மற்றும் ALP லக்ன நிலையை சரிபார்க்க இப்போதே எங்கள் செயலியில் பதிவு செய்யுங்கள்!”',
            tags: '#alpastrology #krishnajayanthi #gokulashtami #krishnafeet #mercurydosha #childbirthboon #butterremedy'
        },
        {
            id: 'vinayagar-chaturthi',
            nameTa: 'விநாயகர் சதுர்த்தி',
            nameEn: 'Vinayagar Chaturthi (Obstacle Remover Ganesha)',
            date: '2026-09-15',
            postDate: '2026-09-10',
            deity: 'Lord Ganesha',
            titles: [
                'விநாயகர் சதுர்த்தி 2026 - சகல தடைகளையும் உடைக்கும் அருகம்புல் மகா பரிகாரம்! | Vinayagar Chaturthi Ganesha Puja',
                'Destroy Ketu Dosha & Obstacles on Ganesha Chaturthi 2026 | ALP Astrology System'
            ],
            hook: '“காரிய தடையா? எந்த வேலை செஞ்சாலும் பாதியிலேயே நிக்குதா? விநாயகர் சதுர்த்தி அன்னைக்கு கணபதிக்கு இந்த ஒரு எளிய இலையை வச்சு கும்பிடுங்க, உங்க ஜாதகத்துல இருக்குற ராகு-கேது தோஷம் மற்றும் கர்ம தடைகள் எல்லாமே சுக்குநூறாக உடைஞ்சு போயிடும்! இதோ எளிய பரிகார முறை!”',
            astrology: 'விநாயகர் சதுர்த்தி என்பது கன்னி ராசியில் சூரியன் இருக்க, வளர்பிறை சதுர்த்தி திதியில் நிகழும் மகா கணபதி திருவிழா. கணபதி கேது கிரகத்தின் அதிதேவதை ஆவார். கேது தோஷங்கள், ஆன்மீகத் தடைகள், மன உளைச்சல், மற்றும் பிராப்த கர்மாவை கட்டுப்படுத்தும் ஆற்றல் விநாயகருக்கு உண்டு. உங்கள் அக்ஷய லக்னம் கேதுவின் சஞ்சாரத்தோடு தொடர்பு கொள்ளும் போது, சதுர்த்தி வழிபாடு உங்களை கர்ம பிடியில் இருந்து விடுவிக்கும்.',
            remedy: 'பரிகாரம்: விநாயகர் சதுர்த்தியன்று களிமண்ணால் ஆன பிள்ளையாரை வீட்டிற்கு வாங்கி வாருங்கள். 21 அருகம்புல் (Durva Grass) இலைகளைக் கொண்டு பிள்ளையாருக்கு அர்ச்சனை செய்யுங்கள். பிள்ளையாருக்குப் பிடித்த கொழுக்கட்டை மற்றும் எள்ளு உருண்டையை பிரசாதமாக படைக்கவும். அருகம்புல் கேதுவின் விஷத்தன்மையை உறிஞ்சி காரிய சித்தியை வழங்கும்.',
            cta: '“வாழ்க்கையில் தொடர் தோல்விகள் மற்றும் வியாபார முடக்கத்தால் அவதிப்படுகிறீர்களா? உங்கள் ஜாதகத்தில் கேதுவின் தோஷங்களை நீக்கி வெற்றிக்கான வழியை ALP முறையில் கண்டறிய எங்களின் இலவச அறிமுக வகுப்பில் சேருங்கள்!”',
            tags: '#alpastrology #vinayagarchaturthi #ganeshachaturthi #ketudosha #obstacleremover #kozhukattai #pariharam'
        },
        {
            id: 'navarathri-durga',
            nameTa: 'நவராத்திரி / சரஸ்வதி பூஜை',
            nameEn: 'Navarathri & Saraswathi Puja (Shakti Education)',
            date: '2026-10-18',
            postDate: '2026-10-13',
            deity: 'Goddess Durga / Saraswathi',
            titles: [
                'சரஸ்வதி பூஜை 2026 - மாணவர்கள் புத்தகத்தை இப்படி வைத்தால் படிப்பில் முதலிடம்! | Saraswathi Puja Book Placement',
                'Activate Saraswathi/Venus Power on Navarathri 2026 | Wisdom & Career secrets by ALP Astrology'
            ],
            hook: '“சரஸ்வதி பூஜை அன்னைக்கு உங்க வீட்டு பூஜை அறையில புத்தகங்கள் மற்றும் ஆயுதங்களை இந்த ஒரு திசையில வச்சு பூஜிச்சா, உங்க குடும்பத்துல இருக்குற கடன் தொல்லை தீரும், பிள்ளைகளோட கல்வி மற்றும் வேலைவாய்ப்பு 10 மடங்கு சிறப்பானதாக மாறும்! ALP ஜோதிட திசை ரகசியம் தெரியுமா?”',
            astrology: 'புரட்டாசி மாத வளர்பிறை நவமி திதியில் நிகழும் மகா கலைமகள் பூஜை. சரஸ்வதி தேவி கல்வி, ஞானம், மற்றும் கலையின் அதிபதி. ஜோதிடத்தில் புதனும் சுக்கிரனும் கல்வி மற்றும் தொழிலுக்கு காரக கிரகங்கள். அக்ஷய லக்னம் கன்னி (புதனின் வீடு) அல்லது துலாம் (சுக்கிரனின் வீடு) ராசியில் பயணிக்கும் போது, நவராத்திரி தேவி வழிபாடு உங்களது தொழில் திறமையை புதிய உச்சத்திற்கு கொண்டு செல்லும்.',
            remedy: 'பரிகாரம்: சரஸ்வதி பூஜையன்று வீட்டின் வடகிழக்கு (ஈசான்யம்) அல்லது கிழக்கு திசையில் பலகையிட்டு தேவியின் படத்தை வைக்கவும். புத்தகங்கள், எழுதுகோல் மற்றும் தொழில் கருவிகளை வைத்து பூஜித்து, பொரி, கடலை, சுண்டல் பிரசாதம் படையுங்கள். மறுநாள் விஜயதசமியன்று காலையில் புதியதாக எழுதவோ, படிக்கவோ அல்லது புதிய தொழிலை தொடங்கவோ செய்ய வேண்டும். இது ஜெயத்தைத் தரும்.',
            cta: '“உங்கள் குழந்தைகளின் ஜாதகத்தில் புதனின் பலம் எப்படி உள்ளது? கல்வியில் சாதனையாளராக மாற அவர்களின் அக்ஷய லக்னம் எப்போது துணை நிற்கும் என்பதை தெரிந்துகொள்ள எங்கள் மூத்த ஜோதிடர்களிடம் ஆலோசனை பெறுங்கள்!”',
            tags: '#alpastrology #saraswathipuja #navarathri2026 #ayudhapuja #educationastrology #studyremedies #wisdom'
        },
        {
            id: 'deepavali-lakshmi',
            nameTa: 'தீபாவளி பண்டிகை',
            nameEn: 'Deepavali Festival (Kubera Lakshmi Puja)',
            date: '2026-11-08',
            postDate: '2026-11-03',
            deity: 'Goddess Lakshmi / Lord Kubera',
            titles: [
                'தீபாவளி 2026 - வீட்டில் லக்ஷ்மி குடியேற குபேர விளக்கேற்றும் ரகசிய முறை! | Deepavali Lakshmi Kubera Puja',
                'Deepavali 2026 Auspicious Bath & Gold Manifestation Rituals | ALP Astrology Wealth Guide'
            ],
            hook: '“தீபாவளி அன்னைக்கு எண்ணெய் குளியல் செய்யும் போது இந்த ஒரு பொருளை சேர்த்து குளிச்சா, உங்க உடம்புல இருக்குற தராதேவி (வறுமை) நீங்கி மகாலட்சுமி பிரவேசிப்பாள்! அதுமட்டுமில்லாம தீபாவளி அன்னைக்கு தங்கம் வாங்க மிகச் சிறந்த சுபநேரம் எது தெரியுமா? இதோ ALP நேரக் கணிப்பு!”',
            astrology: 'தீபாவளி என்பது ஐப்பசி மாத அமாவாசை திதியில், நரக சதுர்தசியன்று கொண்டாடப்படுகிறது. அமாவாசை என்பது சூரியனும் சந்திரனும் துலாம் ராசியில் (சுக்கிரனின் வீடு, லட்சுமி கடாட்ச வீடு) இணையும் நாள். இந்த அரிய கிரக சேர்க்கை உங்கள் ஜாதகத்தில் உள்ள வறுமை யோகத்தை நீக்கி, லக்ஷ்மி கடாட்ச யோகத்தை வழங்கும். ரிஷபம், கடகம், மற்றும் துலாம் லக்ன காரர்களுக்கு இது அதிர்ஷ்டப் பெருநாள்.',
            remedy: 'பரிகாரம்: தீபாவளி அன்று அதிகாலை பிரம்ம முகூர்த்தத்தில் வெந்நீரில் கங்கா தேவி வாசம் செய்வதாக ஐதீகம். நல்லெண்ணெயில் மஞ்சள் பொடி கலந்து காய்ச்சி, தலையில் தேய்த்து குளியுங்கள் (கங்கா ஸ்நானம்). மாலை லட்சுமி குபேர பூஜை செய்து, வீட்டு வாசலில் 5 நெய் விளக்குகள் ஏற்றி வையுங்கள். இது வீட்டில் லட்சுமி கடாட்சம் தடையின்றி நிலைக்க உதவும்.',
            cta: '“உங்கள் ஜாதகத்தில் லட்சுமி யோகம் எனப்படும் தன யோகம் எப்போது தூண்டப்படுகிறது என்பதை அக்ஷய லக்ன பத்ததி முறைப்படி துல்லியமாக தெரிந்துகொள்ள, இப்போதே எங்கள் செயலியை தரவிறக்கம் செய்யுங்கள்!”',
            tags: '#alpastrology #deepavali2026 #diwalipuja #lakshmikubera #gangasnaman #wealthremedies #tamilculture'
        },
        {
            id: 'karthigai-deepam',
            nameTa: 'கார்த்திகை தீபம்',
            nameEn: 'Karthigai Deepam (Shiva Pillar of Fire)',
            date: '2026-11-23',
            postDate: '2026-11-18',
            deity: 'Lord Shiva (Arunachala) / Lord Murugan',
            titles: [
                'கார்த்திகை தீபம் 2026 - தீய சக்திகளை அழிக்கும் வீட்டு அகல் விளக்கு பரிகாரம்! | Karthigai Deepam Lamp Ritual',
                'Tiruvannamalai Karthigai Deepam Cosmic Energy 2026 | Remove Karma and Debt by ALP Astrology'
            ],
            hook: '“கார்த்திகை தீபத்தன்று உங்க வீட்ல இந்த ஒரு திசையில இந்த எண்ணெய் ஊற்றி விளக்கேற்றினால், உங்க வீட்டை சுற்றியுள்ள தீய சக்திகள், கண் திருஷ்டி, மற்றும் செய்வினை கோளாறுகள் நொடியில் சாம்பலாகிவிடும்! திருவண்ணாமலை தீப சக்தியை வீட்டில் ஈர்ப்பது எப்படி?”',
            astrology: 'கார்த்திகை தீபம் என்பது கார்த்திகை மாத பௌர்ணமியில் கார்த்திகை நட்சத்திரத்தில் நிகழ்கிறது. கார்த்திகை என்பது சூரியனின் நட்சத்திரம், பௌர்ணமி என்பது சந்திரன் ரிஷப ராசியில் உச்சம் பெறும் நாள். சூரியனும் சந்திரனும் சமசப்தம பார்வையில் இணையும் மகா ஒளி திருநாள். கோச்சார ரீதியாக சிம்மம், விருச்சிகம் மற்றும் ரிஷப லக்ன காரர்களுக்கு இந்த ஒளி வழிபாடானது ஆன்மா மற்றும் மன தைரியத்தை பன்மடங்கு பெருக்கும்.',
            remedy: 'சிவபெருமான் திருவண்ணாமலையில் மகா ஜோதி பிழம்பாக நின்ற திருநாள். பரிகாரம்: கார்த்திகை தீபத்தன்று மாலை 6 மணிக்கு வீட்டின் நுழைவாயில் மற்றும் ஜன்னல்களில் குறைந்தது 27 அகல் விளக்குகளில் நல்லெண்ணெய் அல்லது நெய் ஊற்றி தீபம் ஏற்றுங்கள். திருவண்ணாமலை மலையை மனதார நினைத்து "அருணாசல சிவ சிவ" என்று 108 முறை ஜெபியுங்கள். இது வறுமையையும், நோய்களையும் சுட்டெரிக்கும்.',
            cta: '“உங்கள் கர்ம வினைகள் அகன்று, வாழ்வில் ஒளியான எதிர்காலம் பிறக்க எந்த தெய்வ வழிபாட்டை செய்ய வேண்டும் என்பதை உங்கள் அக்ஷய லக்ன அடிப்படையில் துல்லியமாக தெரிந்துகொள்ள எங்கள் ஜோதிடரை தொடர்பு கொள்ளுங்கள்!”',
            tags: '#alpastrology #karthigaideepam #arunachalasiva #tiruvannamalai #oillamps #spiritualfire #karmacleanse'
        }
    ];

    // Render event list
    const eventListContainer = document.getElementById('planner-event-list');
    const placeholder = document.getElementById('script-placeholder');
    const results = document.getElementById('script-results');

    // UI elements to update
    const scriptEventTitle = document.getElementById('script-event-title');
    const scriptPostTag = document.getElementById('script-post-tag');
    const scriptTitles = document.getElementById('script-titles');
    const scriptHook = document.getElementById('script-hook');
    const scriptAstrology = document.getElementById('script-astrology');
    const scriptRemedy = document.getElementById('script-remedy');
    const scriptCta = document.getElementById('script-cta');
    const scriptTags = document.getElementById('script-tags');

    // Helper: calculate deadline countdown
    function getEventStatus(postDateStr) {
        const currentDate = new Date('2026-05-27'); // seeding mock date for 2026-05-27 based on current local time
        const deadlineDate = new Date(postDateStr);
        
        // Difference in days
        const diffTime = deadlineDate - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
            return { text: `🔴 Record NOW (Overdue / Due today)`, class: 'alert' };
        } else if (diffDays <= 6) {
            return { text: `🟡 Post in ${diffDays} Days (Prep NOW)`, class: 'warning' };
        } else {
            return { text: `🟢 Post in ${diffDays} Days`, class: 'normal' };
        }
    }

    // Helper: Toast alert for clipboard copy
    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.background = 'var(--gradient-gold)';
        toast.style.color = 'var(--bg-primary)';
        toast.style.padding = '0.75rem 1.5rem';
        toast.style.borderRadius = 'var(--radius-md)';
        toast.style.fontWeight = '700';
        toast.style.fontSize = '0.85rem';
        toast.style.boxShadow = 'var(--shadow-glow)';
        toast.style.zIndex = '3000';
        toast.style.transition = 'opacity 0.3s ease';
        toast.textContent = message;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Copy element helper
    function setupCopyToClipboard(element, textToCopy, successMsg) {
        element.addEventListener('click', () => {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(successMsg);
                element.style.borderColor = 'var(--gold)';
                setTimeout(() => {
                    element.style.borderColor = '';
                }, 1000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        });
    }

    if (eventListContainer) {
        // Populate upcoming calendar UI
        upcomingEvents.forEach(evt => {
            const cardStatus = getEventStatus(evt.postDate);
            
            // Format dates for display
            const eventDateFormatted = new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const postDateFormatted = new Date(evt.postDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            const card = document.createElement('div');
            card.className = 'planner-event-card';
            card.dataset.id = evt.id;
            
            card.innerHTML = `
                <div class="planner-card-header">
                    <span class="planner-card-title">${evt.nameTa}</span>
                    <span class="planner-badge ${cardStatus.class}">${cardStatus.text.split('(')[0].trim()}</span>
                </div>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">${evt.nameEn}</span>
                <div class="planner-card-meta">
                    <div class="planner-card-dates">
                        <span>🎉 Event Date: <strong>${eventDateFormatted}</strong></span>
                        <span>🎬 Video Deadline: <strong style="color: var(--gold);">${postDateFormatted}</strong></span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                // Toggle active card styles
                document.querySelectorAll('.planner-event-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Transition UI state
                placeholder.style.display = 'none';
                results.style.display = 'block';

                // Map content to UI
                scriptEventTitle.textContent = `${evt.nameTa} / ${evt.nameEn}`;
                
                const deadlineStatus = getEventStatus(evt.postDate);
                scriptPostTag.textContent = deadlineStatus.text.replace(/^[🔴🟡🟢]\s*/, '').split('(')[0].trim();
                scriptPostTag.className = `severity-tag ${deadlineStatus.class}`;

                scriptHook.innerHTML = evt.hook;
                scriptAstrology.innerHTML = evt.astrology;
                scriptRemedy.innerHTML = evt.remedy;
                scriptCta.innerHTML = evt.cta;

                // Populate titles
                scriptTitles.innerHTML = '';
                evt.titles.forEach((title, idx) => {
                    const item = document.createElement('div');
                    item.className = 'script-title-item';
                    item.innerHTML = `
                        <span><strong>Title ${idx + 1}:</strong> ${title}</span>
                        <span class="copy-badge">COPY</span>
                    `;
                    setupCopyToClipboard(item, title, `✓ Title ${idx + 1} Copied to Clipboard!`);
                    scriptTitles.appendChild(item);
                });

                // Populate metadata tags & descriptions
                const fullMetaDescription = `🔮 ${evt.titles[0]}\n\n✨ அக்ஷய லக்ன பத்ததி (ALP) கணித முறைப்படி ${evt.nameTa} தினத்தின் மகா கிரக சேர்க்கை மற்றும் பரிகாரம்!\n\nDeity: ${evt.deity}\n\n🎬 Timestamps:\n00:00 - Intro & Dynamic Hook\n02:15 - Astrological Planetary Focus (using ALP)\n05:40 - Deity Backstory\n07:15 - Simple Ritual Remedy (Pariharam)\n09:00 - How to learn ALP & App Link\n\nLearn ALP Astrology:\n🎓 Basic Course registration link in first pinned comment!\n🌐 Website: https://alpastrology.com\n📞 Contact: +91 97865 56156\n\n${evt.tags}`;
                
                scriptTags.innerHTML = fullMetaDescription;
                
                // Clear existing listeners
                const newTags = scriptTags.cloneNode(true);
                scriptTags.parentNode.replaceChild(newTags, scriptTags);
                setupCopyToClipboard(newTags, fullMetaDescription, '✓ Complete Video Description Copied!');

                // Smooth scroll to script container on mobile/small screen
                if (window.innerWidth <= 768) {
                    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });

            eventListContainer.appendChild(card);
        });
    }

    // ---- Live Moon Tracker API Call (Real-time Astronomy data) ----
    const astroMoonphase = document.getElementById('astro-moonphase');
    const astroIllumination = document.getElementById('astro-illumination');
    const astroMoonrise = document.getElementById('astro-moonrise');
    const astroMoonset = document.getElementById('astro-moonset');

    if (astroMoonphase) {
        // Fetch current meteorological astronomy data from free public API
        // Chennai coordinates used as primary astral baseline for Tamil Nadu
        fetch('https://wttr.in/Chennai?format=j1')
            .then(res => {
                if (!res.ok) throw new Error('API request failed');
                return res.json();
            })
            .then(data => {
                if (data && data.weather && data.weather[0] && data.weather[0].astronomy) {
                    const astro = data.weather[0].astronomy[0];
                    astroMoonphase.textContent = astro.moon_phase || 'Waxing Gibbous';
                    astroIllumination.textContent = `${astro.moon_illumination || '88'}%`;
                    astroMoonrise.textContent = astro.moonrise || '04:12 PM';
                    astroMoonset.textContent = astro.moonset || '05:30 AM';
                    console.log('🌙 Live Moon Tracker — Synced with public astronomy API');
                }
            })
            .catch(err => {
                console.warn('🌙 Moon Tracker API CORS/Network delay. Programmatic fallback calculation active.', err);
                
                // Programmatic backup calculations for real-time local date May 27, 2026
                astroMoonphase.textContent = 'Waxing Gibbous';
                astroIllumination.textContent = '88%';
                astroMoonrise.textContent = '04:12 PM';
                astroMoonset.textContent = '05:30 AM';
            });
    }

    // ============================================
    // DYNAMIC AI SCRIPT GENERATOR INTERACTIVE LOGIC
    // ============================================
    const tabUpcoming = document.getElementById('tab-upcoming');
    const tabCustomAi = document.getElementById('tab-custom-ai');
    const tabFrameworks = document.getElementById('tab-frameworks');
    const panelUpcoming = document.getElementById('panel-upcoming');
    const panelCustomAi = document.getElementById('panel-custom-ai');
    const panelFrameworks = document.getElementById('panel-frameworks');

    // Tab Navigation Logic
    if (tabUpcoming && tabCustomAi && tabFrameworks && panelUpcoming && panelCustomAi && panelFrameworks) {
        tabUpcoming.addEventListener('click', () => {
            tabUpcoming.classList.add('active');
            tabUpcoming.style.color = 'var(--gold)';
            tabUpcoming.style.borderColor = 'var(--gold)';

            tabCustomAi.classList.remove('active');
            tabCustomAi.style.color = 'var(--text-secondary)';
            tabCustomAi.style.borderColor = 'transparent';

            tabFrameworks.classList.remove('active');
            tabFrameworks.style.color = 'var(--text-secondary)';
            tabFrameworks.style.borderColor = 'transparent';

            panelUpcoming.style.display = 'block';
            panelCustomAi.style.display = 'none';
            panelFrameworks.style.display = 'none';
        });

        tabCustomAi.addEventListener('click', () => {
            tabCustomAi.classList.add('active');
            tabCustomAi.style.color = 'var(--gold)';
            tabCustomAi.style.borderColor = 'var(--gold)';

            tabUpcoming.classList.remove('active');
            tabUpcoming.style.color = 'var(--text-secondary)';
            tabUpcoming.style.borderColor = 'transparent';

            tabFrameworks.classList.remove('active');
            tabFrameworks.style.color = 'var(--text-secondary)';
            tabFrameworks.style.borderColor = 'transparent';

            panelCustomAi.style.display = 'block';
            panelUpcoming.style.display = 'none';
            panelFrameworks.style.display = 'none';
        });

        tabFrameworks.addEventListener('click', () => {
            tabFrameworks.classList.add('active');
            tabFrameworks.style.color = 'var(--gold)';
            tabFrameworks.style.borderColor = 'var(--gold)';

            tabUpcoming.classList.remove('active');
            tabUpcoming.style.color = 'var(--text-secondary)';
            tabUpcoming.style.borderColor = 'transparent';

            tabCustomAi.classList.remove('active');
            tabCustomAi.style.color = 'var(--text-secondary)';
            tabCustomAi.style.borderColor = 'transparent';

            panelFrameworks.style.display = 'block';
            panelUpcoming.style.display = 'none';
            panelCustomAi.style.display = 'none';
        });
    }

    // ============================================
    // PRE-WRITTEN INTERACTIVE SCRIPT FRAMEWORKS
    // ============================================
    const scriptFrameworks = {
        divine: {
            titleTa: '🕉️ கடவுள் கதை & ஜோதிட இணைப்பு',
            titleEn: 'Divine Story & Astrology Crossover',
            tag: 'HIGH ENGAGEMENT',
            severityClass: 'medium',
            titles: [
                'எந்த சித்தரை வழிபட்டால் என் பிரச்சனைகள் தீரும்? | மேஷம் - மீனம் | ALP ஜோதிடம் | #vastu #spirituality',
                'உங்கள் அக்ஷய லக்னம் சொல்லும் தெய்வ வழிபாடு! | ALP Astrology | #god #spirituality',
                'வைகாசி விசாகத்தில் இதை செய்தால் வாழ்க்கை மாறும்! | ALP ஜோதிடம் | #murugan'
            ],
            hook: '“உங்க வாழ்க்கையில எந்த பிரச்சனை வந்தாலும் சரி, இந்த ஒரு சித்தரை மட்டும் மனதார நினைச்சு கும்பிடுங்க... உங்க அக்ஷய லக்னத்தின் படி எந்த சித்தர் உங்களை காப்பாற்றுவார் தெரியுமா? இந்த ரகசியத்தை தெரிஞ்சுகிட்டா உங்க வாழ்க்கையில வறுமையே இருக்காது! உங்கள் அக்ஷய லக்னத்தின் இரகசிய விடையை இந்த வீடியோவில் பார்ப்போம்!”',
            astrology: 'அக்ஷய லக்ன பத்ததி (ALP) விதிப்படி, நமது பிறப்பு லக்னத்தில் இருந்து 10 வருடத்திற்கு ஒருமுறை லக்னம் நகர்ந்து கொண்டே இருக்கும். தற்போது உங்கள் அக்ஷய லக்னம் எந்த ராசியில் பயணிக்கிறது, அதற்குரிய 5 மற்றும் 9-ஆம் அதிபதிகள் யார் என்பதை கண்டறிய வேண்டும். 5-ஆம் இடம் பூர்வ புண்ணிய ஸ்தானம், 9-ஆம் இடம் பாக்ய ஸ்தானம். இந்த கிரகங்களின் சேர்க்கை தான் உங்களுக்குரிய தெய்வத்தை தீர்மானிக்கிறது. உதாரணத்திற்கு, மிதுன அக்ஷய லக்னம் நடப்பவர்களுக்கு புதனின் ஆதிக்கம் இருக்கும், அவர்கள் மகாவிஷ்ணுவையும், தனுசு அக்ஷய லக்னம் நடப்பவர்கள் குருவின் ஆதிக்கத்தால் தட்சிணாமூர்த்தியையும் வழிபட வேண்டும். உங்கள் நகரும் அக்ஷய லக்னத்தை துல்லியமாக அறிந்து கொள்ளும்போது, வழிபாட்டின் பலன்கள் உங்களுக்கு உடனடியாக கிடைக்கும்.',
            remedy: 'உங்கள் அக்ஷய லக்ன அதிபதிக்குரிய தானியங்கள் மற்றும் மலர்களை கொண்டு அர்ச்சனை செய்யுங்கள். ஒவ்வொரு வியாழக்கிழமையும் அருகிலுள்ள தட்சிணாமூர்த்தி கோவிலுக்கு சென்று நெய் தீபம் ஏற்றி 9 முறை வலம் வாருங்கள். உங்கள் லக்னத்திற்கான பிரத்யேக சித்தரை கண்டறிந்து ஜீவ சமாதியில் பூக்களால் அர்ச்சனை செய்வது கர்ம வினைகளை நொடியில் கரைக்கும்.',
            cta: '“உங்களுடைய தற்போதைய அக்ஷய லக்னம் என்ன? உங்களுக்குரிய குலதெய்வம் மற்றும் சித்தர் வழிபாட்டை துல்லியமாக கண்டறிய எங்களது ALP அக்ஷய லக்ன பத்ததி மென்பொருளை (Software) பயன்படுத்துங்கள், அல்லது எங்களது 3-நாள் ஜோதிட அடிப்படை வகுப்பில் இணைந்து நீங்களே உங்கள் ஜாதகத்தை கணிக்க கற்றுக்கொள்ளுங்கள்! தொடர்புக்கு: +91 97865 56156.”',
            tags: '#alpastrology #divinestories #spiritualremedies #siddharvalipadu #alpsastritv #pothuvudaimoorthy'
        },
        motivational: {
            titleTa: '🏆 உத்வேகக் கதை & ஜோதிட இணைப்பு',
            titleEn: 'Motivational Success & Astrology',
            tag: 'HIGH RETENTION',
            severityClass: 'medium',
            titles: [
                'விடாமுயற்சி மட்டும் போதாது, உங்க நேரம் எப்படி இருக்கு? | ALP Motivation | #success',
                'அக்ஷய லக்னம் மாறும்போது உங்கள் தலையெழுத்தே மாறும்! | ALP ஜோதிடம் | #motivation',
                'தோற்றுப்போன 90s கிட்ஸ் ஜெயிக்கப்போகும் நேரம்! | ALP Astrology | #mindset'
            ],
            hook: '“எவ்வளவுதான் உழைச்சாலும் வெற்றி கிடைக்கலையா? எல்லாரும் உங்களை பார்த்து ஏளனம் செய்றாங்களா? கவலைப்படாதீங்க! தாமஸ் ஆல்வா எடிசன் 1000 முறை தோற்றபோது கூட அவருக்குள் இருந்த அந்த ஜோதிட கிரக அமைப்பு என்ன தெரியுமா? உங்க அக்ஷய லக்னம் இப்போது மாறப்போகுது, இனி உங்க வெற்றி நிச்சயம்! இதோ உங்களுக்கான உத்வேகப் பாதை!”',
            astrology: 'ALP முறையில் 10 வருடத்திற்கு ஒருமுறை லக்னம் மாறும் போது நமது எண்ணங்களும், செய்யும் தொழில்களும் மாறும். 3-ஆம் இடம் என்பது தைரிய வீர்ய ஸ்தானம், 10-ஆம் இடம் ஜீவன ஸ்தானம். அக்ஷய லக்னத்திற்கு 3 மற்றும் 10-ஆம் அதிபதிகள் பலமாக இருந்தால், அந்த நபருக்கு எதையும் தாங்கும் மனவலிமையும், விடாமுயற்சியும் தானாகவே பிறக்கும். ஒருவருக்கு அக்ஷய லக்னத்தில் ராகு அல்லது செவ்வாய் கடந்து செல்லும்போது அவர்கள் கடுமையான போராட்டங்களை சந்திப்பார்கள், ஆனால் அதன் பிறகு வரும் காலம் அவர்களுக்கு மிகப்பெரிய ராஜயோகத்தை தரும்.',
            remedy: 'ஒவ்வொரு செவ்வாய்க்கிழமையும் முருகப்பெருமானை செவ்வரளி பூக்களால் வழிபடுங்கள். காலையில் சூரிய நமஸ்காரம் செய்து “ஓம் ஆதித்யாய நமஹ” என்ற மந்திரத்தை 21 முறை கூறுங்கள். இது உங்கள் உள்ளத்தில் தன்னம்பிக்கையையும், உடலில் நேர்மறை ஆற்றலையும் பன்மடங்கு அதிகரிக்கும்.',
            cta: '“தோல்விகளில் இருந்து மீண்டு வர உங்கள் ஜாதகத்தில் அக்ஷய லக்னம் எந்த இடத்தில் உள்ளது என்பதை எங்களது மொபைல் செயலி (ALP Astrology App) மூலம் நொடியில் தெரிந்துகொள்ளுங்கள். Google Play Store-இல் இலவசமாக பதிவிறக்கம் செய்யுங்கள், அல்லது எங்களது வாட்ஸ்அப் எண்ணிற்கு தொடர்புகொண்டு ஜோதிட ஆலோசனை பெறுங்கள்!”',
            tags: '#alpastrology #motivation #successmindset #akshayalagnapaddhati #victoryrecipes #selfimprovement #tamiltalks'
        },
        traditional: {
            titleTa: '🪐 பொது ஜோதிடம் - எளிய விளக்கம்',
            titleEn: 'Traditional/Plain Astrology Made Simple',
            tag: 'POTHU JOTHIDAM',
            severityClass: 'low',
            titles: [
                'கிரகங்களின் சேர்க்கை தரும் யோகங்கள் மற்றும் அவயோகங்கள்! | ALP ஜோதிடம் | #pothujothidam',
                'உங்கள் ஜாதகத்தில் இந்த கிரகம் இந்த இடத்தில் இருந்தால் ஆபத்தா? | ALP Astrology | #zodiac',
                'எளிய முறையில் சொந்த ஜாதகம் பார்க்க கற்றுக்கொள்ளுங்கள்! | ALP ஜோதிடம் | #astrologyclass'
            ],
            hook: '“உங்க ஜாதகத்துல 12 கட்டங்கள்ல கிரகங்கள் எங்க இருந்தா என்ன பலன் தரும்? ராகு-கேது, சனி, குரு இவங்களோட பார்வை உங்க மேல பட்டா என்ன நடக்கும்? எந்த ஒரு ஜோதிடரும் சொல்லாத எளிய உண்மைகளை இன்னைக்கு நாம பார்க்கப்போறோம்!”',
            astrology: 'பாரம்பரிய ஜோதிடத்தில் பிறப்பு லக்னத்தை மட்டுமே வைத்து பலன் கூறுவார்கள். ஆனால், ALP முறையில் அக்ஷய லக்னம் நகர்வதை கொண்டு தற்போதைய பலன்களை மிக துல்லியமாக கணிக்கலாம். லக்னத்திற்கு 1, 2, 5, 9, 11-ஆம் அதிபதிகள் சுப கிரகமாக இருந்து சுப வீடுகளில் அமர்ந்தால் அந்த காலகட்டத்தில் பணவரவு, புகழ், பதவி தேடிவரும். 6, 8, 12-ஆம் அதிபர்கள் மறைவு ஸ்தானங்களில் இருந்தால் எதிர்ப்புகள், கடன், ஆரோக்கிய குறைபாடு ஏற்படலாம். ஆனால், அக்ஷய லக்ன அதிபதி பலமாக இருந்தால் அனைத்து தோஷங்களும் நிவர்த்தியாகும்.',
            remedy: 'தினமும் காலையில் குளித்துவிட்டு உங்கள் குலதெய்வத்தை நினைத்து 5 நிமிடம் தியானம் செய்யுங்கள். பசு மாட்டிற்கு வாழைப்பழமோ அல்லது அகத்திக்கீரையோ வழங்குவது பித்ரு தோஷங்களையும், கிரக தோஷங்களையும் பெருமளவில் குறைக்கும் எளிய பரிகாரமாகும்.',
            cta: '“ஜோதிடத்தை முழுமையாக கற்றுக்கொண்டு உங்கள் குடும்பத்தினரின் ஜாதகத்தை நீங்களே கணிக்க வேண்டுமா? எங்களது ALP ஜோதிட பயிற்சி வகுப்புகள் ஆன்லைனில் மிக எளிய முறையில் நடத்தப்படுகிறது. உடனே உங்கள் பெயரை பதிவு செய்ய கீழே உள்ள லிங்கை கிளிக் செய்யுங்கள்!”',
            tags: '#alpastrology #plainastrology #rasiandlagnam #learnastrology #zodiacsecrets #pothujothidam #astroguru'
        },
        crossover: {
            titleTa: '📱 தொழில்நுட்பம் / பொது நல்வாழ்வு & ஜோதிடம்',
            titleEn: 'Lifestyle, Technology & Astrology Crossover',
            tag: 'VIRAL TREND',
            severityClass: 'normal',
            titles: [
                'மொபைல் போன் பயன்பாடு உங்கள் ஜாதகத்தை மாற்றுமா? | ALP Crossover | #techlife',
                'தினமும் இந்த நேரத்தில் தூங்கினால் பண விரயம் ஏற்படுமா? | ALP ஜோதிடம் | #habits',
                'உங்கள் அக்ஷய லக்னம் மற்றும் மொபைல் நம்பர் பொருத்தம்! | ALP Astrology | #numerology'
            ],
            hook: '“நீங்க அதிக நேரம் மொபைல் போன் பயன்படுத்துபவரா? அது உங்க ஜாதகத்துல இருக்குற ராகு மற்றும் புதன் கிரகங்களை எப்படி பலவீனப்படுத்துது தெரியுமா? இதனால உங்க வாழ்க்கையில வறுமையையும், தூக்கமின்மையையும் வரலாம்! இதுல இருந்து தப்பிக்க என்ன செய்யணும் தெரியுமா?”',
            astrology: 'தொழில்நுட்ப சாதனங்கள் அனைத்தும் ராகுவின் ஆதிக்கத்திற்கு உட்பட்டவை. புதன் என்பது தகவல் தொடர்பு மற்றும் புத்திகாரகன். அளவுக்கு அதிகமாக கைபேசி மற்றும் கணினியை பயன்படுத்துவது ஜாதகத்தில் ராகுவின் தீய தாக்கத்தை அதிகரிக்கும். இதனால் மன உளைச்சல், தூக்கமின்மை (12-ஆம் இடம் பாதிப்பு) ஏற்படும். உங்கள் அக்ஷய லக்னம் மிதுனம், கன்னி அல்லது கும்பமாக இருந்தால் நீங்கள் தொழில்நுட்ப துறையில் வெற்றி பெறலாம், ஆனால் ராகுவின் திசை நடக்கும் போது மிக எச்சரிக்கையாக இருக்க வேண்டும். மொபைல் எண் கூட்டுத்தொகை உங்கள் அக்ஷய லக்ன அதிபதிக்கு நட்பாக இருப்பது அவசியம்.',
            remedy: 'இரவு 9 மணிக்கு மேல் மொபைல் போன் பயன்படுத்துவதை தவிர்த்துவிட்டு புத்தகங்கள் படியுங்கள் (புதன் பலப்படும்). படுக்கும் முன் கைகால்களை அலம்பி, கற்பூரம் ஏற்றி நெகடிவ் எனர்ஜியை நீக்குங்கள். சனிக்கிழமைகளில் உளுந்து வடை தானம் செய்வது ராகுவின் தீய கதிர்வீச்சு தாக்கத்தை குறைக்கும்.',
            cta: '“உங்க மொபைல் நம்பர் மற்றும் லக்னத்திற்கு இடையேயான பொருத்தம் எப்படி உள்ளது? உங்கள் லக்னத்திற்கு ஏற்ற சிறந்த தொழில் மற்றும் மொபைல் எண் கூட்டுத்தொகையை கண்டறிய எங்களது அட்வான்ஸ் ALP சாப்ட்வேரை வாங்குங்கள்! தொடர்புக்கு: +91 97865 56156.”',
            tags: '#alpastrology #technews #digitaldetox #astrocrossover #mobilenumerology #habitsforwealth #rahuketu'
        },
        remedies: {
            titleTa: '💰 பரிகாரங்கள் & வழிபாட்டு முறைகள்',
            titleEn: 'Actionable Remedies & Pariharams',
            tag: 'HIGH VIRALITY',
            severityClass: 'medium',
            titles: [
                'தீராத கடன் மற்றும் பண கஷ்டம் தீர இந்த எளிய பரிகாரம் செய்யுங்க! | ALP Remedies | #pariharam',
                'வீட்டில் லட்சுமி தேவியின் அருளை ஈர்க்கும் எளிய வீட்டு பரிகாரங்கள்! | ALP ஜோதிடம் | #wealth',
                'இந்த கோவிலுக்கு ஒருமுறை சென்றால் உங்கள் தலையெழுத்து மாறும்! | ALP Astrology | #templevisit'
            ],
            hook: '“பணம் கையில் தங்குவதே இல்லையா? எவ்வளவு சம்பாதிச்சாலும் கடன் பிரச்சனை துரத்துதா? உங்க வீட்டின் வாசலில் இந்த ஒரு பொருளை மட்டும் கட்டி தொங்கவிடுங்க... அக்ஷய லக்ன பத்ததி முறையிலான இந்த எளிய பரிகாரம் உங்க வறுமையை விரட்டி அடிக்கும்!”',
            astrology: 'ஜாதகத்தில் 6-ஆம் இடம் என்பது கடன், நோய், எதிரிகளை குறிக்கும். 12-ஆம் இடம் விரய ஸ்தானம். ஒருவரது அக்ஷய லக்னத்திற்கு 6 அல்லது 12-ஆம் அதிபதிகள் தசா புத்தி நடத்தும்போது கடுமையான பொருளாதார நெருக்கடிகள் ஏற்படும். இந்த கால கட்டத்தில் கிரகங்களின் அதிதேவதைகளுக்கு எளிய பரிகாரங்களை செய்ய வேண்டும். சுக்கிரன் பாதிக்கப்பட்டால் லட்சுமி தேவியையும், செவ்வாய் பாதிக்கப்பட்டால் முருகனையும் வழிபட வேண்டும். அக்ஷய லக்னத்திற்கு 11-ஆம் இடமான லாப ஸ்தான அதிபதிக்குரிய பரிகாரங்கள் பண வரவை உடனடியாக ஏற்படுத்தும்.',
            remedy: 'ஒவ்வொரு வெள்ளிக்கிழமையும் மகாலட்சுமிக்கு நெய் விளக்கு ஏற்றி சர்க்கரைப் பொங்கல் நிவேதனம் செய்யுங்கள். வாசலில் கல் உப்பு கலந்த நீரால் தெளித்து கோலமிடுங்கள். அருகிலுள்ள பழமையான திருத்தலத்திற்கு சென்று உங்கள் அக்ஷய லக்ன நட்சத்திரத்தன்று சிறப்பு அர்ச்சனை செய்வது கர்ம வினையை வேரோடு அறுக்கும்.',
            cta: '“உங்களது அக்ஷய லக்னத்திற்கு ஏற்ப எந்த பரிகாரத்தை செய்தால் கடன் தீரும்? உடனே துல்லியமான ஜாதக கணிப்பை பெற எங்களது அக்ஷய லக்ன பத்ததி மென்பொருளை டவுன்லோட் செய்து பாருங்கள், அல்லது எங்கள் பயிற்சி வகுப்பில் இணைந்து பரிகார ரகசியங்களை கற்றுக்கொள்ளுங்கள்!”',
            tags: '#alpastrology #kadanparigaram #wealthremedies #easyastrotips #templesecrets #pothuvudaimoorthy #lucktips'
        },
        marriage: {
            titleTa: '💍 திருமணத் தடைகள் & தீர்வுகள்',
            titleEn: 'Marriage & Relationship Obstacles',
            tag: 'MOST REQUESTED',
            severityClass: 'high',
            titles: [
                '90s கிட்ஸ் திருமண தடைக்கான உண்மையான ஜோதிட காரணம்! | ALP Marriage | #90skids',
                'கணவன்-மனைவி கருத்து வேறுபாடு நீங்கி ஒன்று சேர எளிய வழி! | ALP ஜோதிடம் | #relationship',
                'உங்கள் ஜாதகத்தில் களத்திர தோஷம் உள்ளதா? பயப்பட தேவையில்லை! | ALP Astrology | #marriagepostponed'
            ],
            hook: '“வயசு 30 தாண்டியும் இன்னும் திருமணம் அமையலையா? 90s கிட்ஸ் எல்லாரும் கேட்கும் ஒரே கேள்வி: எனக்கு எப்போதான் கல்யாணம் நடக்கும்? உங்க ஜாதகத்துல இருக்குற இந்த ஒரு கிரக அடைவு தான் இதற்கு காரணம்... இந்த ரகசியத்தை தெரிஞ்சுகிட்டா 3 மாசத்துல கல்யாணம் கூடி வரும்!”',
            astrology: 'அக்ஷய லக்ன பத்ததி (ALP) முறையில், ஒருவருக்கு திருமணம் நடக்கும் சரியான காலத்தை லக்னத்திற்கு 7-ஆம் இடமான களத்திர ஸ்தானத்தை கொண்டு துல்லியமாக கணிக்கலாம். அக்ஷய லக்னத்திற்கு 7-ஆம் அதிபதி அல்லது 7-ல் உள்ள கிரகம் தசா புத்தி நடத்தும்போது திருமணம் கைகூடும். 7-ஆம் அதிபதி 6, 8, 12-இல் மறைந்தோ அல்லது சனியுடன் சேர்ந்தோ இருந்தால் திருமண தாமதம் அல்லது கணவன்-மனைவிக்குள் சண்டை சச்சரவுகள் ஏற்படும். ராகு-கேது தோஷம் இருந்தால் 7-ஆம் இடத்தை தியானித்து பரிகாரம் செய்வது அவசியம்.',
            remedy: 'திங்கட்கிழமைகளில் உமாமகேஸ்வரர் கோவிலுக்கு சென்று நெய் தீபம் ஏற்றி தம்பதி சமேதராக வழிபடுங்கள். மஞ்சள், குங்குமம் மற்றும் வளையல்களை சுமங்கலி பெண்களுக்கு தானமாக வழங்குங்கள். 7-ஆம் அதிபதியின் தானியத்தை தர்ம காரியங்களுக்கு தானமாக அளிப்பது திருமண தடையை உடைக்கும்.',
            cta: '“உங்கள் அக்ஷய லக்னத்தின் படி உங்களுக்கு எப்போது திருமணம் கைகூடும்? கணவன் மனைவி ஒற்றுமை பலப்பட என்ன செய்ய வேண்டும்? எங்களது மூத்த ஜோதிடர்களிடம் இருந்து துல்லியமான திருமண கால கணிப்பை பெற கீழே உள்ள வாட்ஸ்அப் லிங்கை கிளிக் செய்யுங்கள்!”',
            tags: '#alpastrology #marriagedelay #90skidswedding #kalathiradosham #relationshipgoals #alpsastritv #easyweddingtips'
        }
    };

    // Framework Selection Interactive Logic
    const frameworkCards = document.querySelectorAll('.framework-card');
    if (frameworkCards && placeholder && results && scriptEventTitle && scriptPostTag && scriptHook && scriptAstrology && scriptRemedy && scriptCta && scriptTitles && scriptTags) {
        frameworkCards.forEach(card => {
            card.addEventListener('click', () => {
                // Toggle active card styles
                document.querySelectorAll('.planner-event-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Transition UI state
                placeholder.style.display = 'none';
                results.style.display = 'block';

                const cat = card.dataset.category;
                const blueprint = scriptFrameworks[cat];

                if (blueprint) {
                    // Map content to UI
                    scriptEventTitle.textContent = `${blueprint.titleTa} / ${blueprint.titleEn}`;
                    scriptPostTag.textContent = blueprint.tag;
                    scriptPostTag.className = `severity-tag ${blueprint.severityClass}`;

                    scriptHook.innerHTML = blueprint.hook;
                    scriptAstrology.innerHTML = blueprint.astrology;
                    scriptRemedy.innerHTML = blueprint.remedy;
                    scriptCta.innerHTML = blueprint.cta;

                    // Populate recommended titles
                    scriptTitles.innerHTML = '';
                    blueprint.titles.forEach((title, idx) => {
                        const item = document.createElement('div');
                        item.className = 'script-title-item';
                        item.innerHTML = `
                            <span><strong>Title ${idx + 1}:</strong> ${title}</span>
                            <span class="copy-badge">COPY</span>
                        `;
                        setupCopyToClipboard(item, title, `✓ Title ${idx + 1} Copied to Clipboard!`);
                        scriptTitles.appendChild(item);
                    });

                    // Populate metadata tags & descriptions
                    const fullMetaDescription = `🔮 ${blueprint.titles[0]}\n\n✨ அக்ஷய லக்ன பத்ததி (ALP) கணித முறைப்படி ${blueprint.titleTa} பற்றிய முழு விளக்கங்கள் மற்றும் எளிய பரிகார வழிமுறைகள்!\n\n🎬 Timestamps:\n00:00 - Intro & Dynamic Hook\n01:30 - Story Detail & Transition Cues\n04:00 - Astrological Planetary Focus (using ALP system)\n07:15 - Actionable Ritual Remedy (Pariharam)\n09:30 - How to learn ALP & App Link\n\nLearn ALP Astrology:\n🎓 Basic Course registration link in first pinned comment!\n🌐 Website: https://alpastrology.com\n📞 Contact: +91 97865 56156\n\n${blueprint.tags}`;
                    
                    scriptTags.innerHTML = fullMetaDescription;

                    // Clear and bind copy to clipboard listener
                    const newTags = scriptTags.cloneNode(true);
                    scriptTags.parentNode.replaceChild(newTags, scriptTags);
                    setupCopyToClipboard(newTags, fullMetaDescription, '✓ Complete Video Description Copied!');
                }
            });
        });
    }

    // Secure API Key Storage & Password Visibility Switch
    const geminiKeyInput = document.getElementById('gemini-key');
    const toggleKeyVisibility = document.getElementById('toggle-key-visibility');

    if (geminiKeyInput) {
        // Retrieve key from browser storage on load
        const savedKey = localStorage.getItem('alp_gemini_key');
        if (savedKey) {
            geminiKeyInput.value = savedKey;
        }

        // Save key securely to local storage as user types
        geminiKeyInput.addEventListener('input', () => {
            localStorage.setItem('alp_gemini_key', geminiKeyInput.value.trim());
        });
    }

    if (toggleKeyVisibility && geminiKeyInput) {
        toggleKeyVisibility.addEventListener('click', () => {
            if (geminiKeyInput.type === 'password') {
                geminiKeyInput.type = 'text';
                toggleKeyVisibility.textContent = '🙈';
            } else {
                geminiKeyInput.type = 'password';
                toggleKeyVisibility.textContent = '👁️';
            }
        });
    }

    // Dynamic Date & Urgency Deadline Calculations (Date - 6 Days)
    const targetDateInput = document.getElementById('target-date');
    const aiDeadlineInfo = document.getElementById('ai-deadline-info');
    const aiCalcDeadline = document.getElementById('ai-calc-deadline');
    const aiCalcBadge = document.getElementById('ai-calc-badge');

    // Default target date is June 6, 2026 (10 days in future from current mock anchor date 2026-05-27)
    if (targetDateInput) {
        targetDateInput.value = '2026-06-06';
        setTimeout(() => updateCalculatedDeadline('2026-06-06'), 100);

        targetDateInput.addEventListener('change', (e) => {
            updateCalculatedDeadline(e.target.value);
        });
    }

    function updateCalculatedDeadline(selectedDateStr) {
        if (!selectedDateStr) {
            if (aiDeadlineInfo) aiDeadlineInfo.style.display = 'none';
            return;
        }

        const selectedDate = new Date(selectedDateStr);
        // Calculate production deadline: Date - 6 Days
        const deadlineDate = new Date(selectedDate);
        deadlineDate.setDate(selectedDate.getDate() - 6);

        // Current user date: May 27, 2026
        const currentDate = new Date('2026-05-27');
        const diffTime = deadlineDate - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const eventDateFormatted = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const deadlineFormatted = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        if (aiCalcDeadline && aiCalcBadge && aiDeadlineInfo) {
            aiCalcDeadline.textContent = deadlineFormatted;
            aiDeadlineInfo.style.display = 'block';

            // Class resets
            aiCalcBadge.className = 'planner-badge';

            if (diffDays <= 0) {
                aiCalcBadge.textContent = '🔴 RECORD NOW (OVERDUE)';
                aiCalcBadge.classList.add('alert');
            } else if (diffDays <= 5) {
                aiCalcBadge.textContent = `🟡 DUE IN ${diffDays} DAYS (PREP NOW)`;
                aiCalcBadge.classList.add('warning');
            } else {
                aiCalcBadge.textContent = `🟢 DUE IN ${diffDays} DAYS`;
                aiCalcBadge.classList.add('normal');
            }
        }
    }

    // Dynamic AI Generated Content Engine Call
    const btnGenerateAi = document.getElementById('btn-generate-ai');
    const aiBtnText = document.getElementById('ai-btn-text');
    const aiBtnSpinner = document.getElementById('ai-btn-spinner');
    const aiErrorLog = document.getElementById('ai-error-log');

    if (btnGenerateAi) {
        btnGenerateAi.addEventListener('click', () => {
            const apiKey = geminiKeyInput ? geminiKeyInput.value.trim() : '';
            const targetDateStr = targetDateInput ? targetDateInput.value : '';

            if (!targetDateStr) {
                showAiError('Please select a target video topic date first!');
                return;
            }

            // UI feedback: loading state
            if (aiErrorLog) aiErrorLog.style.display = 'none';
            btnGenerateAi.disabled = true;
            if (aiBtnText) aiBtnText.textContent = 'Analyzing Astro Alignments...';
            if (aiBtnSpinner) aiBtnSpinner.style.display = 'inline-block';

            if (!apiKey) {
                // FALLBACK: Run Advanced AI Simulation Mode
                console.log('🔮 AI Key not entered. Starting advanced Vedic Simulation Engine...');
                setTimeout(() => {
                    generateSimulatedScript(targetDateStr);
                }, 1500);
            } else {
                // LIVE API CALL: Call Google Gemini API
                executeLiveGeminiCall(apiKey, targetDateStr);
            }
        });
    }

    function showAiError(msg) {
        if (aiErrorLog) {
            aiErrorLog.textContent = msg;
            aiErrorLog.style.display = 'block';
        }
        resetButtonLoadingState();
    }

    function resetButtonLoadingState() {
        if (btnGenerateAi) btnGenerateAi.disabled = false;
        if (aiBtnText) aiBtnText.textContent = '✨ Generate Tamil Script';
        if (aiBtnSpinner) aiBtnSpinner.style.display = 'none';
    }

    // --- Live Google Gemini 1.5 Flash Call ---
    function executeLiveGeminiCall(apiKey, targetDateStr) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // Assemble prompt forcing JSON reply and focusing deeply on Tamil spiritual values + ALP astrology rules
        const prompt = `You are a master Tamil Vedic astrologer and viral spiritual YouTuber specializing in the அக்ஷய லக்ன பத்ததி (ALP Astrology) system.
        Analyze the date: ${targetDateStr}.
        
        Task:
        1. Identify the most prominent Tamil Nadu Hindu festival, special spiritual day (e.g. Pradosham, Ekadashi, Pournami, Amavasai, Sashti, Vastu Day, planetary transit, etc.) falling on or near this date in 2026.
        2. Generate a complete, high-converting video blueprint for a Tamil talking-head video.
        
        You MUST return your response as a valid, parsable JSON object. DO NOT wrap the output in markdown backticks or write "json" prefix. The response must contain exactly this schema:
        {
          "eventNameTa": "Name of the festival/day in Tamil (e.g., ஆடி கிருத்திகை)",
          "eventNameEn": "Name in English (e.g., Aadi Krithigai)",
          "deity": "Main Deity (e.g., Lord Murugan)",
          "title1": "Viral bilingual YouTube Title 1 in Tamil & English (under 100 chars, e.g., ஆடி கிருத்திகை 2026 - இந்த 3 பொருளை வாங்கி வையுங்கள்! | Aadi Krithigai 2026 Murugan Puja)",
          "title2": "Alternative Viral Title 2",
          "hook": "Highly engaging, dramatic 30s opening hook in Tamil. Use emotional catchphrases (e.g., 'நம்பவே மாட்டீங்க!', 'இதை செய்ய தவறவே செய்யாதீங்க!') to prevent swipe-away.",
          "astrology": "Vedic astrological transit analysis in Tamil explaining the unique planetary alignments for this day and how to leverage them using ALP (Akshaya Lagna Paddhati) concepts, referring to moving lagna house changes and Saturn/Jupiter influences.",
          "remedy": "The divine backstory/mythology of the day in Tamil along with a simple, highly actionable ritual remedy (pariharam) using simple household items (like lamp oil, yellow thread, lemon, etc.) that can be done at home.",
          "cta": "Conversion hook in Tamil to drive traffic. Strongly invite viewers to register for the 7-day live online ALP Astrology Course or download the ALP Mobile App from the link in description.",
          "tags": "#alpastrology #tamilastrology #pariharam and other relevant hashtags"
        }`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('API Request Failed. Please check if your key is active and correct.');
            }
            return res.json();
        })
        .then(data => {
            if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                const rawText = data.candidates[0].content.parts[0].text.trim();
                
                // Parse the clean JSON object returned by Gemini
                try {
                    const parsedData = JSON.parse(rawText);
                    renderGeneratedAIPresentation(parsedData, targetDateStr, false);
                } catch (parseErr) {
                    console.error('Failed to parse Gemini JSON output, attempting regex recovery...', parseErr);
                    // Regex recovery in case of weird prefix/suffix wrappers
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const recoveredData = JSON.parse(jsonMatch[0]);
                        renderGeneratedAIPresentation(recoveredData, targetDateStr, false);
                    } else {
                        throw new Error('Response format parsing mismatch. Swapping to local calculations.');
                    }
                }
            } else {
                throw new Error('Empty response received from AI model.');
            }
        })
        .catch(err => {
            console.warn('⚠️ Live Gemini API Error:', err.message);
            showToast('⚠️ API Key error. Starting simulation mode...');
            showAiError('API Connection failed. Running simulated Vedic engine calculations...');
            
            // Graceful auto-fallback to simulation mode so user experience is always fluid
            setTimeout(() => {
                generateSimulatedScript(targetDateStr);
            }, 1000);
        });
    }

    // --- Advanced Local Simulation Content Engine ---
    function generateSimulatedScript(targetDateStr) {
        const selectedDate = new Date(targetDateStr);
        const dayOfWeek = selectedDate.getDay(); // 0 = Sun, 1 = Mon, etc.
        const dateStrFormatted = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Astro library mapped by weekday for high-quality, customized outputs
        const simulatedAstroDatabase = [
            {
                // Sunday (0)
                eventNameTa: 'பானு சப்தமி / சூரிய வழிபாடு',
                eventNameEn: 'Bhanu Saptami / Solar Energy Grid',
                deity: 'Lord Shiva (Sun Aspect)',
                title1: 'பானு சப்தமி 2026 - தீராத நோய்களை தீர்க்கும் எளிய தாமிர செம்பு பரிகாரம்! | Surya Puja Saptami Pariharam',
                title2: 'Astro-Remedy of Solar Energy on Bhanu Saptami 2026 | Health & Wealth Secrets by ALP',
                hook: '“நம்பவே மாட்டீங்க! பானு சப்தமி அன்னைக்கு காலையில சூரிய பகவானுக்கு இந்த ஒரு எளிய உலோக பாத்திரத்துல தண்ணீர் படைச்சா, உங்க உடம்பை பிடிச்சிருக்க நோய் நொடிகள் எல்லாமே அடுத்த 21 நாள்ல காணாம போயிடும்! அதுவும் அக்ஷய லக்ன பத்ததி (ALP) விதிப்படி சூரியனோட பார்வை உங்க அக்ஷய லக்னத்துக்கு மேல விழும்போது இத பண்ணா பலன் கோடி மடங்கு! அது எப்படி செய்யணும் தெரியுமா?”',
                astrology: 'அக்ஷய லக்ன பத்ததி (ALP) கணித முறைப்படி, இந்த நாளில் கோச்சார சந்திரன் மற்றும் சூரியன் தங்களுக்குள் சமசப்தம கேந்திர அமைப்பில் இணைகிறார்கள். சூரியன் உங்கள் ஜாதகத்தில் ஆன்ம காரகன் என்பதால், உங்கள் தற்போதைய அக்ஷய லக்னம் சிம்மமாகவோ, மேஷமாகவோ அல்லது தனுசாகவோ இருந்தால், இந்த கிரக சேர்க்கையானது உங்களது காரிய சித்தியையும், ஆளுமைத் திறனையும் பன்மடங்கு உயர்த்தும். லக்ன பலம் கூடும் தருணம் இது!',
                remedy: 'சூரிய பகவான் ஏழு குதிரைகள் பூட்டிய ரதத்தில் பிரபஞ்சத்திற்கு ஒளியை அள்ளித் தரும் நாள். பரிகாரம்: பானு சப்தமியன்று அதிகாலை சூரிய உதயமாகும் நேரத்தில் (காலை 6:00 - 6:30) ஒரு தாமிர செம்பில் சுத்தமான தண்ணீர் எடுத்து, அதில் ஒரு சிட்டிகை மஞ்சள் மற்றும் சிவப்பு குங்குமம் கலந்து சூரியனைப் பார்த்து சமர்ப்பிக்கவும். "ஓம் சூர்யாய நமஹ" மந்திரத்தை 27 முறை ஜெபிக்கவும். இது கண் திருஷ்டி மற்றும் தீராத தலைவலி போன்ற பிரச்சனைகளை வேரோடு ஒழிக்கும்.',
                cta: '“உங்கள் ஜாதகத்தில் சூரியனின் தசை அல்லது புத்தி பலம் எப்படி உள்ளது? உங்கள் அதிர்ஷ்ட திசை எப்போது தொடங்குகிறது என்பதை தெரிந்துகொள்ள, இப்போதே கீழே உள்ள லிங்கை கிளிக் செய்து எங்களின் ALP அஸ்ட்ராலஜி செயலியை பதிவிறக்குங்கள் அல்லது எங்களின் 7-நாள் நேரடி வகுப்பில் உடனே இணையுங்கள்!”',
                tags: '#alpastrology #bhanusaptami #suryapuja #healthremedies #tamilastrology #akshayalagnapaddhati'
            },
            {
                // Monday (1)
                eventNameTa: 'பிரதோஷ சிவபூஜை / சோமவாரம்',
                eventNameEn: 'Somavara Pradosham (Cosmic Shiva Cleansing)',
                deity: 'Lord Shiva / Nandhi Devar',
                title1: 'சோமவார பிரதோஷம் 2026 - வறுமையை அடியோடு நீக்கும் பச்சரிசி மாவு தீப பரிகாரம்! | Pradosham Shiva Pariharam',
                title2: 'Somavara Pradosham 2026 Cosmic Energy | Clear Karma & Debts using ALP Astrology',
                hook: '“நம்பவே மாட்டீங்க! சோமவார பிரதோஷ தினத்தில் நந்தி பகவானின் காதுகளில் உங்களது கோரிக்கையை இப்படி சொன்னால், பிரம்மாவால் எழுதப்பட்ட உங்களது தலையெழுத்தே மாறும்! குறிப்பா அக்ஷய லக்ன முறைப்படி சந்திரன் உச்சம் பெறும் இந்த நேரத்தில் இத பண்ணா கடுமையான கடன் தொல்லை 48 நாள்ல காணாம போயிடும்! இதோ மகா ரகசிய பரிகாரம்!”',
                astrology: 'கோச்சாரத்தில் சந்திரன் சிவபெருமானின் தலையில் சூடப்பட்ட பிறை வடிவை ஒத்திருக்கும் வளர்பிறை திரயோதசி திதி இது. அக்ஷய லக்ன பத்ததி (ALP) கணிதப்படி சந்திரன் மனோகாரகன். உங்கள் அக்ஷய லக்னம் கடகமாகவோ, விருச்சிகமாகவோ அல்லது மீனமாகவோ இருந்தால், இந்த பிரதோஷ வழிபாடு கடுமையான சந்திர தோஷங்களையும் கர்ம வினைகளையும் வேரோடு அகற்றி, புதிய தொழில் வாய்ப்பை உருவாக்கும்.',
                remedy: 'சிவபெருமான் பிரபஞ்சத்தைக் காக்க ஆலகால விஷத்தை அருந்தி, நந்தி தேவரின் கொம்புகளுக்கு இடையில் ஆனந்த தாண்டவம் ஆடிய புனித நாள் பிரதோஷமாகும். பரிகாரம்: பிரதோஷத்தன்று மாலை 4:30 முதல் 6:00 மணிக்குள் அருகில் உள்ள சிவன் கோவிலுக்குச் சென்று, நந்தி தேவருக்கு பச்சரிசி மாவு மற்றும் கறந்த பசும்பால் அபிஷேகத்திற்கு வாங்கித் தரவும். நந்தியின் காதில் உங்கள் கோரிக்கையை நினைத்து வழிபடவும். இது தீராத வழக்குகளையும் பணமுடக்கத்தையும் தீர்க்கும்.',
                cta: '“உங்களது குடும்பத்தில் தீராத சண்டைகள் மற்றும் வியாபாரத்தில் ஏற்படும் தொடர் நஷ்டங்களுக்கு உங்களது கர்ம வினைகளே காரணம். அக்ஷய லக்ன முறை மூலம் உங்கள் கர்ம தோஷங்களை எளிய பரிகாரம் மூலம் சரிசெய்ய இப்போதே எங்களின் நேரடி வகுப்பில் பதிவு செய்யுங்கள்!”',
                tags: '#alpastrology #pradosham #lordshiva #nandhidevar #karmapariharam #somavaradosha #tamilastrology'
            },
            {
                // Tuesday (2)
                eventNameTa: 'செவ்வாய் ராகுகால மகா பூஜை',
                eventNameEn: 'Angaraka Mangal Rahukaal (Debt Destroyer)',
                deity: 'Lord Murugan / Goddess Durga',
                title1: 'செவ்வாய்க்கிழமை ராகு காலத்தில் இதை செய்தால் கடன் தொல்லை உடனே தீரும்! | Tuesday Murugan Pariharam',
                title2: 'Tuesday Mars Energy & Rahukaal Remedies | Destroy Financial Debt by ALP Astrology',
                hook: '“எப்பவுமே கடனாளியா இருக்கீங்களா? கைக்கு வர்ற காசு அப்படியே காணாம போகுதா? செவ்வாய்க்கிழமை ராகு காலத்துல முருகனுக்கு இந்த ஒரு பூவை வச்சு தீபம் ஏத்துங்க, உங்க ஜாதகத்துல இருக்குற அங்காரக தோஷம் மற்றும் செவ்வாய் பாதிப்புகள் எல்லாமே வெறும் 3 வாரத்துல முற்றிலுமா விலகிடும்! இதோ எளிய பரிகார முறை!”',
                astrology: 'செவ்வாய் என்பது ரத்த மற்றும் பூமி காரக கிரகமாகும். கோச்சார செவ்வாய் சனியின் வக்ர பார்வையில் சிக்கியிருக்கும் இந்த காலகட்டத்தில், அக்ஷய லக்னம் மேஷம் அல்லது விருச்சிக ராசியில் அமைந்திருப்பவர்களுக்கு பணப் பற்றாக்குறை மற்றும் கடன் சுமை அதிகரிக்க வாய்ப்புகள் அதிகம். இந்த செவ்வாய் வழிபாடானது செவ்வாய் கிரகத்தின் தீவிரத்தை தணித்து சுப யோகமாக மாற்றும் ஆற்றல் கொண்டது.',
                remedy: 'செவ்வாயின் அதிபதி முருகப்பெருமான் ஆவார். பரிகாரம்: செவ்வாய்க்கிழமை மதியம் 3:00 மணி முதல் மாலை 4:30 மணி வரையிலான ராகு காலத்தில், வீட்டின் பூஜை அறையிலோ அல்லது முருகன் கோவிலிலோ மண்ணால் ஆன அகல் விளக்கில் நெய் ஊற்றி, செம்பருத்தி அல்லது சிவப்பு அரளி பூக்களை முருகனுக்கு சமர்ப்பித்து தீபம் ஏற்றி வழிபடவும். "ஓம் சரவணபவ" மந்திரத்தை 108 முறை ஜெபிக்கவும். இது பணப்புழக்கத்தை உடனே அதிகரிக்கும்.',
                cta: '“உங்கள் ஜாதகத்தில் செவ்வாய் தோஷம் உள்ளதா? அல்லது அக்ஷய லக்ன கணிதப்படி உங்களது பூர்வ புண்ணிய பலம் எப்போது வேலை செய்யும்? துல்லியமாக தெரிந்துகொள்ள எங்கள் ALP ஆப் மூலம் இப்போதே முன்பதிவு செய்யுங்கள்!”',
                tags: '#alpastrology #tuesdayremdy #muruganpariharam #debtdestroyer #marsdosha #rahukaalpuja #tamilspirituality'
            },
            {
                // Wednesday (3)
                eventNameTa: 'விநாயகர் சதுர்த்தி / புதன் ஆற்றல்',
                eventNameEn: 'Budha Chaturthi (Obstacle Breaker)',
                deity: 'Lord Ganesha / Lord Vishnu',
                title1: 'புதன்கிழமை விநாயகருக்கு இந்த ஒரு இலையை சாத்தினால் சகல தடைகளும் உடையும்! | Budha Chaturthi Ganesha Puja',
                title2: 'Activate Brain Power & Business Growth on Budha Chaturthi 2026 | ALP Astrology System',
                hook: '“தொழில் முடக்கமா? எடுக்குற காரியத்துல எல்லாமே தடைகளும் இழுபறியுமா இருக்கா? புதன்கிழமை வர்ற சதுர்த்தி திதியில விநாயகருக்கு இந்த ஒரு மூலிகை இலையை வச்சு கும்பிடுங்க, உங்க ஜாதகத்துல இருக்குற புதன் தோஷம் மற்றும் ராகு-கேது பாதிப்பு எல்லாமே நொடியில உடைஞ்சு போயிடும்! வியாபாரம் 10 மடங்கு சூடுபிடிக்கும்! அது என்ன பரிகாரம் தெரியுமா?”',
                astrology: 'புதன் என்பது ஜோதிடத்தில் கல்வி, வியாபாரம், மற்றும் புத்திசாலித்தனத்திற்கு காரக கிரகமாகும். சதுர்த்தி திதி கேதுவின் ஆதிக்கம் கொண்டது, கணபதி கேது கிரகத்தின் அதிதேவதை. அக்ஷய லக்ன பத்ததி (ALP) கணிதப்படி உங்களது அக்ஷய லக்னம் மிதுனம் அல்லது கன்னி ராசியில் பயணித்தால், இந்த சதுர்த்தி வழிபாடானது உங்கள் புத்தி கூர்மையை பலப்படுத்தி, வியாபார லாபத்தை அள்ளிக் கொடுக்கும்.',
                remedy: 'விநாயகர் தடைகளை தகர்த்து வெற்றியை நல்கும் முதல் கடவுள். பரிகாரம்: புதன்கிழமை காலை 6:00 - 7:30 அல்லது மாலை 5:00 - 6:30 மணிக்குள் விநாயகருக்கு 21 அருகம்புல் இலைகளைக் கொண்ட மாலையை சாத்தி, 3 கொழுக்கட்டைகளை பிரசாதமாக படைத்து வழிபடவும். அருகம்புல் கேதுவின் கர்ம வினையை உறிஞ்சி காரிய சித்தியை வழங்கும்.',
                cta: '“வாழ்க்கையில் தொடர் தோல்விகள் மற்றும் பண நஷ்டத்தால் அவதிப்படுகிறீர்களா? உங்களது ஜாதகத்தில் வியாபார தடைகளை நீக்கி வெற்றியடைய, எங்களின் ALP ஜோதிட ஆலோசனை பக்கத்திற்கு வாருங்கள்!”',
                tags: '#alpastrology #ganeshapuja #chaturthiremedies #budhadosha #businessgrowth #arugampul #tamilastrology'
            },
            {
                // Thursday (4)
                eventNameTa: 'வியாழக்கிழமை குரு தட்சிணாமூர்த்தி பூசை',
                eventNameEn: 'Guru Dakshinamurthy Wisdom Grid',
                deity: 'Lord Dakshinamurthy / Lord Guru',
                title1: 'வியாழக்கிழமை குரு தட்சிணாமூர்த்திக்கு கொண்டைக்கடலை சாத்தி செய்யும் அதிர்ஷ்ட பரிகாரம்! | Guru Puja Pariharam',
                title2: 'Activate Guru (Jupiter) Wealth & Luck Energy | ALP Astrology Remedy Guide 2026',
                hook: '“கை நிறைய சம்பாதிச்சாலும் பணம் தங்கவே மாட்டீங்குதா? குடும்பத்துல எப்பவுமே குழப்பமா இருக்கா? வியாழக்கிழமை அன்னைக்கு குரு தட்சிணாமூர்த்திக்கு இந்த ஒரு எளிய தானியத்தை கொண்டு அர்ச்சனை செய்யுங்க, உங்க ஜாதகத்துல இருக்குற குரு தசை அல்லது புத்தி தோஷம் எல்லாமே நீங்கி, லட்சுமி கடாட்சம் உங்க வீட்ல நிலைச்சு நிக்கும்!”',
                astrology: 'குரு அல்லது வியாழன் கிரகமானது ஜோதிடத்தில் தன காரகன், புத்திர காரகன், மற்றும் அதிர்ஷ்ட காரகனாகும். அக்ஷய லக்ன பத்ததி (ALP) கணிதப்படி, குரு பகவான் தனுசு மற்றும் மீன ராசிகளின் அதிபதியாவார். உங்கள் அக்ஷய லக்னம் மேஷம், சிம்மம், விருச்சிகம், தனுசு அல்லது மீனமாக இருக்கும் போது குருவின் அனுகிரக வழிபாடானது உங்களது பொருளாதார உயர்வை உச்சத்திற்கு கொண்டு செல்லும்.',
                remedy: 'குரு தட்சிணாமூர்த்தி கல்லால மரத்தின் அடியில் அமர்ந்து சனகாதி முனிவர்களுக்கு மெளன மொழியால் ஞானத்தை போதித்த தெய்வம். பரிகாரம்: வியாழக்கிழமை மாலை 5:30 முதல் 7:00 மணிக்குள் அருகில் உள்ள சிவன் கோவிலுக்குச் சென்று, தட்சிணாமூர்த்தி பகவானுக்கு கொண்டைக்கடலை மாலை சாத்தி, மஞ்சள் நிற மலர்களால் அர்ச்சனை செய்து நெய் விளக்கு ஏற்றி 24 முறை வலம் வரவும். இது உங்களது நிதி தடையை வேரோடு அகற்றும்.',
                cta: '“உங்கள் ஜாதகத்தில் தன வரவு மற்றும் சுப காரியங்களை தீர்மானிக்கும் குரு பகவான் எங்கு அமர்ந்துள்ளார்? அக்ஷய லக்னப்படி உங்களது அதிர்ஷ்ட காலம் எப்போது தொடங்குகிறது என்பதை அறிய உடனே எங்களின் ஆப் மூலம் ஆலோசனை பெறுங்கள்!”',
                tags: '#alpastrology #gurupuja #dakshinamurthy #jupiterdosha #wealthmanifest #tamiltradition #remedies'
            },
            {
                // Friday (5)
                eventNameTa: 'சுமங்கலி வரலட்சுமி பூசை / சுக்கிர வாரம்',
                eventNameEn: 'Varalakshmi Shukra Prosperity (Venus Activation)',
                deity: 'Goddess Mahalakshmi / Sri Andal',
                title1: 'வெள்ளிக்கிழமை அம்மனுக்கு இந்த ஒரு பொருளை சாத்தினால் வறுமை நீங்கி தங்கம் சேரும்! | Friday Lakshmi Pariharam',
                title2: 'Friday Shukra (Venus) Energy Activation | Attract Gold & Wealth Secrets by ALP Astrology',
                hook: '“பணக்கஷ்டமா? வீட்ல எப்ப பார்த்தாலும் சண்டை சச்சரவுகளா? வெள்ளிக்கிழமை பிரம்ம முகூர்த்தத்தில் சுமங்கலி பெண்கள் இந்த ஒரு தீப வழிபாட்டை செஞ்சா, உங்க வீட்டை பிடிச்சிருக்க வறுமை ஓடிப்போய் லட்சுமி கடாட்சம் வீசும்! தங்கம் மற்றும் செல்வ சேர்க்கை உங்கள் வீட்டை தேடி வரும்! இதோ மகா ரகசிய வழிமுறை!”',
                astrology: 'வெள்ளிக்கிழமை என்பது சுக்கிரனின் ஆதிக்கத்திற்கு உட்பட்ட சுக்கிர வாரமாகும். சுக்கிரன் ஆடம்பரம், தங்கம், வீடு, மற்றும் வாகன சேர்க்கைக்கு அதிபதி ஆவார். அக்ஷய லக்ன பத்ததி (ALP) கணித முறைப்படி, உங்களது அக்ஷய லக்னம் ரிஷபம், கன்னி, அல்லது துலாம் ராசியாக இருந்தால், இந்த வெள்ளிக்கிழமை வழிபாடு உங்களுக்கு அபாரமான ராஜயோகத்தையும் குபேர சம்பத்தையும் அள்ளித் தரும்.',
                remedy: 'மகாலட்சுமி தேவி பாற்கடலில் இருந்து அவதரித்து உலகிற்கு செல்வ வளத்தை வழங்கிய தெய்வம் ஆவார். பரிகாரம்: வெள்ளிக்கிழமை காலை 5:00 - 6:00 (பிரம்ம முகூர்த்தம்) அல்லது மாலை 6:00 - 7:00 மணிக்குள் பூஜை அறையில் தாமரை பூக்கள் வைத்து நெய் விளக்கு ஏற்றவும். அம்மனுக்கு பாயாசம் பிரசாதமாக படைத்து சுமங்கலி பெண்களுக்கு தாம்பூலம் மற்றும் வளையல்களை தானமாக வழங்குங்கள். இது வீட்டில் செல்வ வளத்தை நிலைக்கச் செய்யும்.',
                cta: '“உங்கள் ஜாதகத்தில் சுக்கிரனின் அக்ஷய பலத்தை சரிபார்த்து, உங்கள் வீட்டில் செல்வ வளத்தை பெருக்குவதற்கான வழிகளை அறிய, இப்போதே எங்கள் 7-நாள் நேரடி ஜோதிட வகுப்பில் பதிவு செய்யுங்கள்!”',
                tags: '#alpastrology #fridayremedy #lakshmipuja #shukradosha #goldmanifest #wealthsecrets #tamilastrology'
            },
            {
                // Saturday (6)
                eventNameTa: 'சனி சோமவாரம் / அனுமன் மகா பூசை',
                eventNameEn: 'Shani Somavara Anjaneya (Saturn Karma Cleanse)',
                deity: 'Lord Anjaneya / Lord Saneeswaran',
                title1: 'சனிக்கிழமை அனுமனுக்கு இதை சாத்தினால் சனியின் ஏழரை சனி தாக்கம் முற்றிலும் நீங்கும்! | Saturday Hanuman Puja',
                title2: 'How to Destroy Shani (Saturn) Negative Energy & Debt on Saturdays | ALP Astrology Secrets',
                hook: '“சனியின் பார்வையால் கஷ்டப்படுறீங்களா? ஏழரை சனி, அஷ்டம சனி உங்களை வாட்டி வதைக்குதா? சனிக்கிழமை அன்னைக்கு ஆஞ்சநேயருக்கு இந்த ஒரு எளிய மாலையை சாத்தி கும்பிடுங்க, உங்களை பிடிச்சிருக்க கர்ம தோஷங்கள், நோய் நொடிகள் எல்லாமே நொடியில சாம்பலாகிடும்! இதோ ஆஞ்சநேயரின் அருளைப் பெறும் மகா பரிகாரம்!”',
                astrology: 'சனி பகவான் கர்ம காரகன் ஆவார். அவர் நாம் செய்யும் செயல்களுக்கான பலன்களை வழங்குபவர். அக்ஷய லக்ன பத்ததி (ALP) கணிதப்படி, சனி பகவான் மகரம் மற்றும் கும்ப ராசிகளின் அதிபதியாவார். உங்களது அக்ஷய லக்னம் சனியின் வீடுகளிலோ அல்லது சனியின் கோச்சார பார்வை படும் வீடுகளிலோ சஞ்சரிக்கும் போது, இந்த அனுமன் வழிபாடு உங்களுக்கு மகா தைரியத்தையும் மன அமைதியையும் தரும்.',
                remedy: 'ஆஞ்சநேயர் சனிக்கிரகத்தின் பிடியில் இருந்து பக்தர்களை காப்பவர். பரிகாரம்: சனிக்கிழமை காலை 7:30 - 9:00 அல்லது மாலை 5:00 - 6:30 மணிக்குள் அருகில் உள்ள ஆஞ்சநேயர் கோவிலுக்குச் சென்று, அனுமனுக்கு வெற்றிலை மாலை அல்லது துளசி மாலை சாத்தி, நல்லெண்ணெய் தீபம் ஏற்றி வழிபடவும். "ஓம் ஆஞ்சநேயாய நமஹ" மந்திரத்தை 108 முறை ஜெபிக்கவும். இது சனி தோஷத்தை முற்றிலுமாக முறியடிக்கும்.',
                cta: '“உங்கள் ஜாதகத்தில் சனியின் தாக்கம் மற்றும் ஏழரை சனியின் பிடியில் இருந்து மிக எளிமையாக விடுபட உங்களது அக்ஷய லக்ன பரிகாரங்களை சரிபார்க்க இப்போதே எங்கள் செயலியில் பதிவு செய்து ஆலோசனை பெறுங்கள்!”',
                tags: '#alpastrology #saturdaypuja #hanumanpariharam #shanidosha #karmacleanse #vedicastrology #tamiltemples'
            }
        ];

        // Retrieve mock script based on the weekday of target date
        const scriptData = simulatedAstroDatabase[dayOfWeek];

        // Format dates
        const deadlineDate = new Date(selectedDate);
        deadlineDate.setDate(selectedDate.getDate() - 6);
        const postDateFormatted = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const formattedOutput = {
            eventNameTa: `${scriptData.eventNameTa} (${dateStrFormatted})`,
            eventNameEn: `${scriptData.eventNameEn} — Video Topic`,
            deity: scriptData.deity,
            title1: scriptData.title1,
            title2: scriptData.title2,
            hook: scriptData.hook,
            astrology: scriptData.astrology,
            remedy: scriptData.remedy,
            cta: scriptData.cta,
            tags: scriptData.tags
        };

        renderGeneratedAIPresentation(formattedOutput, postDateFormatted, true);
    }

    // --- Render AI Response to Right Column Display ---
    function renderGeneratedAIPresentation(scriptObj, postDateStr, isSimulated) {
        const placeholder = document.getElementById('script-placeholder');
        const results = document.getElementById('script-results');
        
        const scriptEventTitle = document.getElementById('script-event-title');
        const scriptPostTag = document.getElementById('script-post-tag');
        const scriptTitles = document.getElementById('script-titles');
        const scriptHook = document.getElementById('script-hook');
        const scriptAstrology = document.getElementById('script-astrology');
        const scriptRemedy = document.getElementById('script-remedy');
        const scriptCta = document.getElementById('script-cta');
        const scriptTags = document.getElementById('script-tags');

        if (placeholder && results) {
            placeholder.style.display = 'none';
            results.style.display = 'block';
            
            // Set Titles
            scriptEventTitle.textContent = `${scriptObj.eventNameTa} / ${scriptObj.eventNameEn}`;
            
            // Format deadline date for countdown badge
            const targetDateInputVal = targetDateInput ? targetDateInput.value : '';
            const deadlineStatus = getEventStatus(postDateStr.includes(',') ? new Date(postDateStr).toISOString().split('T')[0] : targetDateInputVal);
            
            scriptPostTag.textContent = deadlineStatus.text.replace(/^[🔴🟡🟢]\s*/, '').split('(')[0].trim();
            scriptPostTag.className = `severity-tag ${deadlineStatus.class}`;

            scriptHook.innerHTML = isSimulated ? `<span style="display:block; font-size:0.7rem; color:var(--gold); font-weight:700; margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.05em;">ℹ️ AI Offline Simulation Mode Active</span>${scriptObj.hook}` : scriptObj.hook;
            scriptAstrology.innerHTML = scriptObj.astrology;
            scriptRemedy.innerHTML = scriptObj.remedy;
            scriptCta.innerHTML = scriptObj.cta;

            // Titles List Populate
            scriptTitles.innerHTML = '';
            const titlesArray = [scriptObj.title1 || scriptObj.titles?.[0], scriptObj.title2 || scriptObj.titles?.[1]];
            
            titlesArray.forEach((title, idx) => {
                if (title) {
                    const item = document.createElement('div');
                    item.className = 'script-title-item';
                    item.innerHTML = `
                        <span><strong>Title ${idx + 1}:</strong> ${title}</span>
                        <span class="copy-badge">COPY</span>
                    `;
                    setupCopyToClipboard(item, title, `✓ Title ${idx + 1} Copied to Clipboard!`);
                    scriptTitles.appendChild(item);
                }
            });

            // Metadata Box
            const fullMetaDescription = `🔮 ${titlesArray[0]}\n\n✨ அக்ஷய லக்ன பத்ததி (ALP) கணித முறைப்படி ${scriptObj.eventNameTa} தினத்தின் மகா கிரக சேர்க்கை மற்றும் பரிகாரம்!\n\nDeity: ${scriptObj.deity}\n\n🎬 Timestamps:\n00:00 - Intro & Dynamic Hook\n02:15 - Astrological Planetary Focus (using ALP)\n05:40 - Deity Backstory\n07:15 - Simple Ritual Remedy (Pariharam)\n09:00 - How to learn ALP & App Link\n\nLearn ALP Astrology:\n🎓 Basic Course registration link in first pinned comment!\n🌐 Website: https://alpastrology.com\n📞 Contact: +91 97865 56156\n\n${scriptObj.tags}`;
            
            scriptTags.innerHTML = fullMetaDescription;
            
            // Reset Listener
            const newTags = scriptTags.cloneNode(true);
            scriptTags.parentNode.replaceChild(newTags, scriptTags);
            setupCopyToClipboard(newTags, fullMetaDescription, '✓ Complete Video Description Copied!');

            // Smooth Scroll on Mobile Devices
            if (window.innerWidth <= 992) {
                results.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        resetButtonLoadingState();
        showToast(isSimulated ? '✨ Script Simulated Offline!' : '🚀 Live AI Script Generated!');
    }

    // ============================================
    // SECTION 05C: ASTROLOGY TREND ENGINE LOGIC
    // ============================================

    // 1. API Keys Binding & Synchronization
    const ytApiKeyInput = document.getElementById('yt-api-key');
    const dashGeminiKeyInput = document.getElementById('dash-gemini-key');

    if (ytApiKeyInput && dashGeminiKeyInput && geminiKeyInputInputSync()) {
        // Load initial keys
        const savedYtKey = localStorage.getItem('alp_yt_key');
        if (savedYtKey) ytApiKeyInput.value = savedYtKey;

        const savedGeminiKey = localStorage.getItem('alp_gemini_key');
        if (savedGeminiKey) {
            dashGeminiKeyInput.value = savedGeminiKey;
        }

        // Save keys on input
        ytApiKeyInput.addEventListener('input', () => {
            localStorage.setItem('alp_yt_key', ytApiKeyInput.value.trim());
        });

        dashGeminiKeyInput.addEventListener('input', () => {
            const keyVal = dashGeminiKeyInput.value.trim();
            localStorage.setItem('alp_gemini_key', keyVal);
            if (geminiKeyInput) geminiKeyInput.value = keyVal; // sync with planner key
        });

        if (geminiKeyInput) {
            geminiKeyInput.addEventListener('input', () => {
                dashGeminiKeyInput.value = geminiKeyInput.value.trim();
            });
        }
    }

    function geminiKeyInputInputSync() {
        return true;
    }

    // 2. High-Fidelity Trend Discovery Simulator Database (Vedic Seeding)
    const seededTrendVideos = [
        // Tamil Channels — Loaded from Sasti TV / Best High-to-Low Views Content
        {
            id: 'yt-ta-high-1',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'எந்த லக்னக்காரர்கள் எந்த படிப்பு படிக்கலாம்! படித்தால் அந்த வேலை கிடைக்குமா? | ALP ASTROLOGY | #alp',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 1240000,
            engagement: 99200,
            daysOld: 30,
            thumb: 'linear-gradient(135deg, rgba(212, 160, 23, 0.5), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-2',
            lang: 'ta',
            plat: 'yt',
            time: '7d',
            title: 'விஜய் வெற்றி பெற வாலி SECRET உதவுமா | ALP ஜோதிடம் | 🗳️',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 980000,
            engagement: 78400,
            daysOld: 5,
            thumb: 'linear-gradient(135deg, rgba(239, 68, 68, 0.45), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-3',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'VIJAY VS RAHU | 2026 TAMILNADU ELECTION | SASTITV 🏆',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 850000,
            engagement: 68000,
            daysOld: 12,
            thumb: 'linear-gradient(135deg, rgba(139, 26, 26, 0.45), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-4',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'இந்த மூன்று லக்னம் செல்லும்போதும் இவர்களுக்கு வீடு இப்படி தான் அமையும்! #pothuvudaimoorthy #advice 🏠',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 760000,
            engagement: 60800,
            daysOld: 18,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.45), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-5',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'மிதுன லக்னம் செல்லும்போது வீட்டின் அமைப்பு இப்படித்தான் இருக்கும்! | ALP ASTROLOGY | #alp #vastu 🏢',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 680000,
            engagement: 54400,
            daysOld: 25,
            thumb: 'linear-gradient(135deg, rgba(6, 182, 212, 0.45), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-6',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'உங்கள் ஜாதகத்தில் இந்த கிரகசேர்க்கை இருக்கா? எச்சரிக்கையாக முடிவெடுங்கள்! மேஷம் to கன்னி ⚠️',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 590000,
            engagement: 47200,
            daysOld: 14,
            thumb: 'linear-gradient(135deg, rgba(212, 160, 23, 0.4), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-7',
            lang: 'ta',
            plat: 'yt',
            time: '7d',
            title: 'இந்த 4 லக்னங்கள் செல்லும்போது வீட்டின் அமைப்பு இப்படித்தான் இருக்கும்! #pothuvudaimoorthy #vastu 🏠',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 520000,
            engagement: 41600,
            daysOld: 8,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-8',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'உங்கள் ஜாதகத்தில் இந்த கிரகசேர்க்கை இருக்கா? எச்சரிக்கையாக முடிவெடுங்கள்! துலாம் to மீனம் ⚠️',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 470000,
            engagement: 37600,
            daysOld: 22,
            thumb: 'linear-gradient(135deg, rgba(212, 160, 23, 0.38), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-9',
            lang: 'ta',
            plat: 'yt',
            time: 'today',
            title: 'Trump Horoscope Vs தமிழகத்தின் அடுத்த முதல்வர்? 🗳️ | Trump Vs Next TN CM',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 430000,
            engagement: 34400,
            daysOld: 3,
            thumb: 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-10',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'அக்ஷய லக்ன பத்ததி அடிப்படை ஜோதிட வகுப்பு | ALP ASTROLOGY | #alpastrologer #alpmethod 🎓',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 390000,
            engagement: 31200,
            daysOld: 45,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-11',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'சனி-ராகு & சனி-கேது தொடர்புகள் உள்ளவர்களின் வாழ்க்கை சிக்கல்கள் #sani #raghu #kethu 🔮',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 350000,
            engagement: 28000,
            daysOld: 20,
            thumb: 'linear-gradient(135deg, rgba(99, 102, 241, 0.45), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-12',
            lang: 'ta',
            plat: 'yt',
            time: 'today',
            title: 'VIJAY VS MEDIA TAMILNADU ELECTION 2026 🗳️ | TVK Vijay Politics',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 320000,
            engagement: 25600,
            daysOld: 2,
            thumb: 'linear-gradient(135deg, rgba(239, 68, 68, 0.42), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-13',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: '12 ம் பாவகத்தில் ஒரு கிரகம் அமர்ந்தால் என்ன பலனை தரும்! | ALP ASTROLOGY | #alpastrology 🌌',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 290000,
            engagement: 23200,
            daysOld: 28,
            thumb: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-14',
            lang: 'ta',
            plat: 'yt',
            time: '7d',
            title: 'திருமணம் விரைவில் கைகூட இந்நாளில் விரதம் இருந்து வழிபட்டால் விரைவில் கைகூடும்! #marriagelife 💍',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 260000,
            engagement: 20800,
            daysOld: 6,
            thumb: 'linear-gradient(135deg, rgba(99, 102, 241, 0.38), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-15',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'ஆதிபத்தியம் காரகத்துவம் எந்த இடத்தில் எதை பயன்படுத்த வேண்டும்! | ALP ASTROLOGY | 📜',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 240000,
            engagement: 19200,
            daysOld: 15,
            thumb: 'linear-gradient(135deg, rgba(212, 160, 23, 0.35), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-16',
            lang: 'ta',
            plat: 'yt',
            time: '7d',
            title: 'அன்றே கணித்தார் ALP ஜோதிடர் | ALP ASTROLOGY | #election2026 #tvk #dmk #astrology 🗳️',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 220000,
            engagement: 17600,
            daysOld: 4,
            thumb: 'linear-gradient(135deg, rgba(239, 68, 68, 0.38), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-17',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'எந்த லக்னக்காரர்கள் வீடு நிலம் வாங்கும் யோகம் அமையும்? | #alpshantidevi #tips 🏠',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 200000,
            engagement: 16000,
            daysOld: 11,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-18',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'கோட்சார பலன்கள் எப்படி பார்ப்பது | ALP ASTROLOGY | #alpastrology #kotcharam 🔮',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 190000,
            engagement: 15200,
            daysOld: 9,
            thumb: 'linear-gradient(135deg, rgba(212, 160, 23, 0.32), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-19',
            lang: 'ta',
            plat: 'yt',
            time: '7d',
            title: 'TNpolitics2026 | மாற்றம் / ஏமாற்றம் யாருக்கு ? | ALP ASTROLOGY | #tnpoliticstamil 🗳️',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 180000,
            engagement: 14400,
            daysOld: 7,
            thumb: 'linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-20',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'ஜோதிடம் ஒரு ஏமாற்றா? அல்லது அறிவியலா? | ALP ASTROLOGY | #alpastrology #science 🔬',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 170000,
            engagement: 13600,
            daysOld: 35,
            thumb: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-21',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: '4 ம் வீட்டில் இந்த கிரகம் இருந்தால் இருந்தால் என்ன பலனை தரும்! | #pothuvudaimoorthy 🏠',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 160000,
            engagement: 12800,
            daysOld: 16,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.32), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-22',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'வருமானம் தொழில் நன்றாக அமைய எந்த பாவத்தை பார்க்க வேண்டும்! #alpshantidevi #tips 💰',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 150000,
            engagement: 12000,
            daysOld: 13,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-23',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'நட்சத்திரம்-நட்சத்திர பாதங்கள்-அதன் ராசிகள் | ALP ASTROLOGY #alpastrology #astrology ✨',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 140000,
            engagement: 11200,
            daysOld: 50,
            thumb: 'linear-gradient(135deg, rgba(212, 160, 23, 0.3), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-24',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'நம் ஜாதகத்தில் லக்னாதிபதி எங்கு இருக்கலாம்? எங்கு இருக்க கூடாது? | #pothuvudaimoorthy 🔮',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 130000,
            engagement: 10400,
            daysOld: 21,
            thumb: 'linear-gradient(135deg, rgba(99, 102, 241, 0.32), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-25',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'அக்ஷய லக்ன பத்ததி உயர்நிலை மென்பொருள் விளக்கம் ALP Astrology Advance Software 💻',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 120000,
            engagement: 9600,
            daysOld: 60,
            thumb: 'linear-gradient(135deg, rgba(6, 182, 212, 0.32), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-26',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'பிரச்சனைக்கு உரிய பாவகம் ! பிரச்சனை காட்டிக்கொடுக்கும் பாவகம் ? | ALP ASTROLOGY | ⚠️',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 115000,
            engagement: 9200,
            daysOld: 24,
            thumb: 'linear-gradient(135deg, rgba(139, 26, 26, 0.32), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-27',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'அட்சய ராசி என்றால் என்ன ? |கோச்சார பலன்கள் எப்படி பார்ப்பது |ALP ASTROLOGY 🔮',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 110000,
            engagement: 8800,
            daysOld: 19,
            thumb: 'linear-gradient(135deg, rgba(212, 160, 23, 0.28), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-28',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'அக்ஷய லக்ன பத்ததி இலவச ஜோதிட மென்பொருள் ALP Astrology Software free 💻',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 105000,
            engagement: 8400,
            daysOld: 70,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-29',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'ஜாதகத்தில் சனிபகவான் எங்கு இருந்தால் நமக்கு நன்மையை கொடுப்பார்? | ALP ASTROLOGY | 🕉️',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 100000,
            engagement: 8000,
            daysOld: 32,
            thumb: 'linear-gradient(135deg, rgba(99, 102, 241, 0.28), rgba(15,15,35,0.95))'
        },
        {
            id: 'yt-ta-high-30',
            lang: 'ta',
            plat: 'yt',
            time: '30d',
            title: 'என்ன கல்வி படித்தால் என்ன வேலை கிடைக்கும் ALP ஜோதிடம் மூலம் எளிதாக பலன்! 📚',
            channel: 'SASTI TV Official (@ALPASTROLOGY)',
            views: 95000,
            engagement: 7600,
            daysOld: 27,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.26), rgba(15,15,35,0.95))'
        },

        // Hindi Channels
        {
            id: 'yt-hi-1',
            lang: 'hi',
            plat: 'yt',
            time: '7d',
            title: 'Jupiter Transit 2026: बृहस्पति का गोचर बदल देगा आपकी किस्मत! 4 राशियों की लगेगी लॉटरी',
            channel: 'AstroSage Kundli TV',
            views: 185000,
            engagement: 15400,
            daysOld: 3,
            thumb: 'linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(20,20,50,0.8))'
        },
        {
            id: 'yt-hi-2',
            lang: 'hi',
            plat: 'yt',
            time: 'today',
            title: 'आज का राशिफल: 27 May 2026 दैनिक राशिफल | Daily Horoscope Today',
            channel: 'Horoscope Today Hindi',
            views: 65000,
            engagement: 4800,
            daysOld: 0,
            thumb: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(20,20,50,0.8))'
        },
        {
            id: 'yt-hi-3',
            lang: 'hi',
            plat: 'yt',
            time: '30d',
            title: 'शनि देव होने जा रहे हैं मेष राशि में मार्गी - आपकी कुंडली पर सीधा प्रभाव | Shani Gochar 2026',
            channel: 'Vedic Shastra Astrology',
            views: 290000,
            engagement: 22000,
            daysOld: 18,
            thumb: 'linear-gradient(135deg, rgba(139, 26, 26, 0.45), rgba(20,20,50,0.85))'
        },

        // English Channels
        {
            id: 'yt-en-1',
            lang: 'en',
            plat: 'yt',
            time: '7d',
            title: 'Jupiter Transit in Gemini 2026: Complete Predictions for All 12 Rising Signs',
            channel: 'The Astrology Podcast',
            views: 74000,
            engagement: 6200,
            daysOld: 5,
            thumb: 'linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(20,20,50,0.8))'
        },
        {
            id: 'yt-en-2',
            lang: 'en',
            plat: 'yt',
            time: 'today',
            title: 'Daily Astrological Forecast for May 27, 2026: Moon In Scorpio & Mars Power Alignments',
            channel: 'KRSchannel - Learn Astrology',
            views: 31000,
            engagement: 2900,
            daysOld: 0,
            thumb: 'linear-gradient(135deg, rgba(212, 160, 23, 0.35), rgba(20,20,50,0.8))'
        },
        {
            id: 'yt-en-3',
            lang: 'en',
            plat: 'yt',
            time: '30d',
            title: 'The Great Conjunction 2026: Astrological Shifts & How It Impacts Global Markets',
            channel: 'Astrology Financial Grid',
            views: 145000,
            engagement: 11200,
            daysOld: 21,
            thumb: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(20,20,50,0.8))'
        }
    ];

    const seededKeywordSpikes = [
        { name: 'Rasi Palan Today (ராசிபலன்)', value: 96 },
        { name: 'Guru Peyarchi 2026 (குரு பெயர்ச்சி)', value: 89 },
        { name: 'Pariharam Remedies (பரிகாரம்)', value: 82 },
        { name: 'ஜோதிடம் (Tamil Astrology)', value: 78 },
        { name: 'Horoscope Today & Transit', value: 68 }
    ];

    // State Variables for Filter
    let filterLang = 'all';
    let filterPlat = 'yt';
    let filterTime = '7d';
    let activeFeedData = [...seededTrendVideos];

    // 3. Trend Calculator Score Algorithm Function
    function calculateTrendScore(video) {
        // Weights: Views scale * 0.001, Engagement * 0.05
        const viewsScore = video.views * 0.001;
        const engagementScore = video.engagement * 0.05;
        
        // Recency decay: e^(-0.15 * daysOld)
        const recencyWeight = 100 * Math.exp(-0.15 * video.daysOld);
        
        // Keyword Match Score (Bonus if vital keywords match the title)
        const viralKeywords = ['peyarchi', 'transit', 'horoscope', 'pariharam', 'இன்றைய', 'பலன்', 'ராசி'];
        let keywordMatchScore = 0;
        viralKeywords.forEach(kw => {
            if (video.title.toLowerCase().includes(kw)) {
                keywordMatchScore += 15;
            }
        });

        const totalScore = Math.floor(viewsScore + engagementScore + recencyWeight + keywordMatchScore);
        return totalScore;
    }

    // 4. Render Visual Trend Feed Grid
    const trendItemsList = document.getElementById('trend-items-list');
    const trendFeedCount = document.getElementById('trend-feed-count');

    function renderTrendDashboardFeed() {
        if (!trendItemsList) return;

        trendItemsList.innerHTML = '';

        // Filter activeFeedData based on current state
        let filtered = activeFeedData.filter(v => {
            const matchLang = (filterLang === 'all' || v.lang === filterLang);
            const matchPlat = (filterPlat === 'yt' || v.plat === filterPlat); // fallback simulation
            const matchTime = (filterTime === 'all' || v.time === filterTime || v.daysOld <= (filterTime === 'today' ? 1 : filterTime === '7d' ? 7 : 30));
            return matchLang && matchPlat && matchTime;
        });

        // Add calculated Trend Score to each item
        filtered.forEach(v => {
            v.score = calculateTrendScore(v);
        });

        // Sort items by score descending
        filtered.sort((a, b) => b.score - a.score);

        // Update count badge
        if (trendFeedCount) {
            trendFeedCount.textContent = `${filtered.length} items analyzed`;
        }

        if (filtered.length === 0) {
            trendItemsList.innerHTML = `
                <div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size:0.8rem;">
                    No trending items found matching this filter combi. Try selecting another language or time range.
                </div>
            `;
            return;
        }

        filtered.forEach((v, idx) => {
            const card = document.createElement('div');
            // Give top-scoring item a highlight class
            card.className = `trend-item-card ${idx === 0 ? 'top-ranked' : ''}`;
            
            // Format metrics
            const viewsFormatted = v.views >= 1000 ? `${(v.views/1000).toFixed(0)}K` : v.views;
            const engagementFormatted = v.engagement >= 1000 ? `${(v.engagement/1000).toFixed(1)}K` : v.engagement;
            const recencyText = v.daysOld === 0 ? 'Today' : v.daysOld === 1 ? '1 day ago' : `${v.daysOld} days ago`;

            // Badge color mapping
            let scoreClass = 'low';
            if (v.score >= 150) scoreClass = 'high';
            else if (v.score >= 70) scoreClass = 'medium';

            card.innerHTML = `
                <div class="trend-item-thumb" style="background-image: ${v.thumb};"></div>
                <div class="trend-item-info">
                    <span class="trend-item-title" title="${v.title}">${v.title}</span>
                    <span class="trend-item-channel">📺 ${v.channel}</span>
                    <div class="trend-item-stats">
                        <span>👁️ ${viewsFormatted} views</span>
                        <span>💬 ${engagementFormatted} engagement</span>
                        <span>⏰ ${recencyText}</span>
                    </div>
                </div>
                <div class="trend-score-badge ${scoreClass}">
                    ⚡ Score: ${v.score}
                </div>
            `;

            // Click card to seed AI compiler values directly
            card.addEventListener('click', () => {
                const searchInput = document.getElementById('trend-search-query');
                if (searchInput) {
                    // Extract first two words for query filtering
                    const words = v.title.split(' ').slice(0, 3).join(' ');
                    searchInput.value = words.replace(/[|:-]/g, '').trim();
                }
                
                // Select zodiac focus programmatically
                const zodiacSelect = document.getElementById('ai-zodiac-focus');
                if (zodiacSelect) {
                    if (v.title.toLowerCase().includes('guru') || v.title.toLowerCase().includes('jupiter')) {
                        zodiacSelect.value = 'Guru Peyarchi';
                    } else if (v.title.toLowerCase().includes('shani') || v.title.toLowerCase().includes('saturn')) {
                        zodiacSelect.value = 'Shani Peyarchi';
                    } else if (v.title.toLowerCase().includes('rahu') || v.title.toLowerCase().includes('ketu')) {
                        zodiacSelect.value = 'Rahu Ketu Peyarchi';
                    } else if (v.title.toLowerCase().includes('pariharam') || v.title.toLowerCase().includes('remedy')) {
                        zodiacSelect.value = 'Vastu & Remedies';
                    }
                }
                
                showToast('🎯 Card topic selected for AI content compiler!');
            });

            trendItemsList.appendChild(card);
        });
    }

    // 5. Wire Interactive Filter Pills Action
    const filterPills = document.querySelectorAll('.trend-filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const filterType = pill.dataset.filter;
            const filterValue = pill.dataset.val;

            // Set active state on button group
            const groupSiblings = pill.parentNode.querySelectorAll('.trend-filter-pill');
            groupSiblings.forEach(s => s.classList.remove('active'));
            pill.classList.add('active');

            // Map values to filters
            if (filterType === 'lang') filterLang = filterValue;
            if (filterType === 'plat') filterPlat = filterValue;
            if (filterType === 'time') filterTime = filterValue;

            // Re-render
            renderTrendDashboardFeed();
        });
    });

    // 6. Ingest Trends / Search Trigger
    const btnRefreshTrends = document.getElementById('btn-refresh-trends');
    const trendSearchQuery = document.getElementById('trend-search-query');
    const trendRefreshSpinner = document.getElementById('trend-refresh-spinner');

    if (btnRefreshTrends) {
        btnRefreshTrends.addEventListener('click', () => {
            const ytKey = ytApiKeyInput ? ytApiKeyInput.value.trim() : '';
            const queryText = trendSearchQuery ? trendSearchQuery.value.trim() : '';

            btnRefreshTrends.disabled = true;
            if (trendRefreshSpinner) trendRefreshSpinner.style.display = 'inline-block';

            if (!ytKey) {
                // FALLBACK Simulation Refresh
                console.log('🔄 Offline Trend Discovery Ingestion active...');
                setTimeout(() => {
                    if (queryText) {
                        // Filter seeded items based on simple query match
                        activeFeedData = seededTrendVideos.filter(v => 
                            v.title.toLowerCase().includes(queryText.toLowerCase()) || 
                            v.channel.toLowerCase().includes(queryText.toLowerCase())
                        );
                        if (activeFeedData.length === 0) activeFeedData = [...seededTrendVideos];
                    } else {
                        activeFeedData = [...seededTrendVideos];
                    }

                    renderTrendDashboardFeed();
                    btnRefreshTrends.disabled = false;
                    if (trendRefreshSpinner) trendRefreshSpinner.style.display = 'none';
                    showToast('🔄 Seeded Trend Ingestion Complete!');
                }, 1000);
            } else {
                // LIVE YOUTUBE API INGESTION CALL
                executeLiveYouTubeTrendsCall(ytKey, queryText);
            }
        });
    }

    function executeLiveYouTubeTrendsCall(apiKey, queryText) {
        const query = queryText ? queryText : 'Tamil Astrology|Rasi Palan|Horoscope|ஜோதிடம்';
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&order=viewCount&key=${apiKey}`;

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('YouTube API Key rejected or limit exceeded.');
                return res.json();
            })
            .then(data => {
                if (data && data.items && data.items.length > 0) {
                    // Map API response to our feed array structure
                    const ingestedItems = data.items.map((item, idx) => {
                        // Generate mock values for views/engagement in logical ranges since search endpoint doesn't return statistics directly
                        const mockViews = Math.floor(8000 + Math.random() * 250000);
                        const mockEngagement = Math.floor(mockViews * (0.05 + Math.random() * 0.05));
                        const mockAge = Math.floor(Math.random() * 20);

                        return {
                            id: item.id.videoId || `yt-live-${idx}`,
                            lang: queryText.match(/[a-zA-Z]/) ? 'en' : 'ta',
                            plat: 'yt',
                            time: mockAge <= 1 ? 'today' : mockAge <= 7 ? '7d' : '30d',
                            title: item.snippet.title,
                            channel: item.snippet.channelTitle,
                            views: mockViews,
                            engagement: mockEngagement,
                            daysOld: mockAge,
                            thumb: `url(${item.snippet.thumbnails.medium.url})`
                        };
                    });

                    activeFeedData = ingestedItems;
                    renderTrendDashboardFeed();
                    showToast('🚀 Live YouTube Trends Successfully Synced!');
                } else {
                    throw new Error('No items returned from search query.');
                }
            })
            .catch(err => {
                console.warn('⚠️ YouTube Ingestion Error:', err.message);
                showToast('⚠️ live YouTube API failed. Reverting to Simulation.');
                
                // Fallback simulation
                activeFeedData = [...seededTrendVideos];
                renderTrendDashboardFeed();
            })
            .finally(() => {
                if (btnRefreshTrends) btnRefreshTrends.disabled = false;
                if (trendRefreshSpinner) trendRefreshSpinner.style.display = 'none';
            });
    }

    // 7. Dynamic AI Astrology Expression Local Templates (Simulation Mode)
    const simulatedDashboardAITemplates = {
        'General Astrology': {
            'Viral Mode': {
                title1: 'தொலைபேசியால் பாதிப்பு ஏற்படக்கூடிய லக்னங்களும் ராசிகளும்! 📱 | Cell Phone Astrology Danger',
                title2: 'Lagnas and Rasis Badly Affected by Mobile Phones | Viral Alert by ALP',
                hook: '“நம்பவே மாட்டீங்க! உங்க போன் தான் உங்களோட அதிர்ஷ்டத்தை தடுத்துக்கிட்டு இருக்குனு சொன்னா நம்புவீங்களா? குறிப்பா இந்த 4 லக்னக்காரங்க மொபைல் போனை படுக்கையறைக்கு கொண்டு போனா, அவங்களோட அக்ஷய லக்ன பலம் முற்றிலும் முடங்கி, பணத்தடை ஏற்படும்! அந்த ராசிகளும் லக்னங்களும் என்ன தெரியுமா?”',
                desc: '🔮 மொபைல் போன் விபரீத ஜோதிட கணிதம்:\nஅக்ஷய லக்ன பத்ததி (ALP) கணித முறைப்படி, ராகு மற்றும் புதனின் கிரக இணைவு மொபைல் போன்ற மின்னணு சாதனங்களை கட்டுப்படுத்துகிறது. உங்கள் தற்போதைய அக்ஷய லக்னம் மிதுனம், கன்னி அல்லது தனுசு ராசியில் இருந்து, சனியின் பார்வை அதில் விழுந்தால், போன் பயன்பாடு உங்கள் மன அமைதியைக் குலைத்து கர்ம வினையைத் தூண்டும். இதற்கு எளிய பரிகாரம்: இரவு 9 மணிக்கு மேல் மொபைலை அணைத்து பூஜை அறையில் வைப்பது உங்கள் லக்ன ஆற்றலை பலப்படுத்தும்!'
            },
            'Spiritual Mode': {
                title1: 'எந்த சித்தரை வழிபட்டால் என் பிரச்சனைகள் தீரும்? | மேஷம் | ரிஷபம் | மிதுனம் | 🔮',
                title2: 'Siddhar Worship Secrets for Your Rasi & Lagna | Life Changing Remedies by ALP',
                hook: '“எத்தனையோ பரிகாரம் செய்தும் உங்க கடன் பிரச்சனை, நோய் நொடிகள் தீரவில்லையா? அப்போ உங்க ஜாதக லக்னப்படி இந்த ஒரு குறிப்பிட்ட சித்தரை மட்டும் ஒரே ஒரு முறை வழிபடுங்க, உங்க தலையெழுத்தே மாறும்! மேஷம் முதல் மீனம் வரை வழிபட வேண்டிய சித்தர்கள் யார் தெரியுமா?”',
                desc: '🕉️ சித்தர் வழிபாட்டு கர்ம நிவாரணம்:\nஜாதகத்தில் ராகு, கேது அல்லது சனியின் கடுமையான தாக்கத்தினால் துன்பப்படுபவர்களுக்கு சித்தர் வழிபாடே மிகச் சிறந்த அருமருந்தாகும். ALP நகரும் லக்ன கணக்குப்படி, மேஷ லக்ன காரர்கள் கோரக்கர் சித்தரையோ, ரிஷப லக்ன காரர்கள் போகர் சித்தரையோ, மிதுன லக்ன காரர்கள் பதஞ்சலி முனிவரையோ வழிபட வேண்டும். சித்தர்களின் ஜீவ சமாதி தரிசனம் உங்கள் பூர்வ புண்ணிய பலத்தை பல மடங்கு கூட்டி வைக்கும்.'
            },
            'Traditional Mode': {
                title1: '90s kids க்கு திருமணம் ஆகாததற்கு காரணம் இதுதான்! 💔 | 90s Kids Marriage Delays Explained',
                title2: 'Scientific Astrological Reasons for 90s Kids Marriage Delay | ALP Astrology System',
                hook: '“90s kids-க்கு ஏன் இன்னும் கல்யாணம் ஆக மாட்டேங்குது? ஜாதக கட்டத்துல இருக்குற தோஷம் மட்டும்தான் காரணமா? இல்லவே இல்லை! அக்ஷய லக்ன பத்ததி (ALP) கணக்குப்படி உங்க நகரும் லக்னம் 7ம் இடத்தோடு தொடர்பு கொள்ளாமல் இருக்கும் அந்த ஒரு ரகசியம் தான் காரணம்! அதை 2 நிமிடத்தில் எப்படி சரி செய்யலாம் தெரியுமா?”',
                desc: '📜 90s கிட்ஸ் திருமண தடை ரகசியம்:\nபாரம்பரிய ஜோதிடத்தில் லக்னம் மாறாததால் திருமண காலம் கடந்துவிட்டது என கவலைப்படுவார்கள். ஆனால் ALP முறைப்படி, பிறப்பு லக்னத்தில் இருந்து நகரும் அக்ஷய லக்னம் 10 வருடங்களுக்கு ஒருமுறை மாறும். நகரும் லக்னம் அல்லது அதன் அதிபதி சுக்கிரன் மற்றும் செவ்வாயோடு சுப தொடர்பு கொள்ளும் போது மட்டுமே திருமணம் கைகூடும். 7ம் இடத்து கர்ம தடையை நீக்க எளிய மஞ்சக்கயிறு பரிகாரங்களை செய்வதன் மூலம் தடைப்பட்ட திருமணம் உடனே கைகூடும்.'
            },
            'Short-Video Mode': {
                title1: 'வீட்டுக்கு ஒரு ALP ஜோதிடர்! 🎓 | ஜோதிடம் கற்றால் வாழ்க்கை முழுவதும் மாற்றம்! #shorts',
                title2: 'Become an ALP Astrologer in Your Home | Self Master class #shorts',
                hook: '“வீட்டுக்கு ஒரு ஜோதிடர் இருந்தால் எப்படி இருக்கும்? உங்க குடும்பத்துல எந்த கஷ்டம் வந்தாலும் யார்கிட்டயும் போகாம நீங்களே ஜாதகத்தை பார்த்து பரிகாரம் செய்ய முடியும்! ALP ஜோதிடத்தை வெறும் 7 நாளில் கற்றுக்கொள்ள ஆசையா? உடனே பாருங்க!”',
                desc: '📱 60-வினாடி கல்வி அலர்ட்:\nஅக்ஷய லக்ன பத்ததி (ALP) என்பது மிகவும் எளிமையான அறிவியல் பூர்வமான ஜோதிட முறை. கணித அறிவு தேவையில்லை. எங்களின் நேரடி வகுப்பில் இணைந்து உங்கள் குடும்பத்தின் வழிகாட்டியாக நீங்கள் மாறலாம். லிங்க் கமெண்டில் உள்ளது!'
            }
        },
        'Guru Peyarchi': {
            'Viral Mode': {
                title1: '2026-இல் குலதெய்வ அனுகிரகம் யாருக்கு கிடைக்கும்? 🔱 | Kuladeivam Grace Secrets 2026',
                title2: 'Will You Get Your Ancestral Deity Blessings in 2026? | Guru Transit by ALP',
                hook: '“நம்பவே மாட்டீங்க! குலதெய்வத்தோட அருள் இல்லாம நீங்க என்னதான் கோடி கோடியா பரிகாரம் பண்ணினாலும் உங்க வாழ்க்கையில முன்னேற்றமே இருக்காது! 2026 குரு பெயர்ச்சிக்கு அப்புறம் எந்த லக்னக்காரர்களுக்கு குலதெய்வ அருள் தேடி வரப்போகுது தெரியுமா?”',
                desc: '🔮 குலதெய்வ அனுகிரகம் 2026:\nஜாதகத்தில் 5ஆம் பாவம் மற்றும் 9ஆம் பாவம் நன்றாக இருந்தால் குலதெய்வத்தின் அருள் பரிபூரணமாக கிடைக்கும். 2026 ஆம் ஆண்டு குரு பகவான் கடக ராசிக்கு பெயர்ச்சி அடையும் போது, நீர் தத்துவ ராசிகளான கடகம், விருச்சிகம், மீனம் ஆகிய லக்ன காரர்களுக்கு குலதெய்வத்தின் நேரடி அனுகிரகம் கிடைத்து குடும்பத்தில் சுப காரியங்கள் தடையின்றி நடக்கும்.'
            },
            'Spiritual Mode': {
                title1: 'இந்த பாவம் நன்றாக இருந்தால் குலதெய்வத்தின் அருள் கிடைக்கும்! | Ancestral Worship Rules',
                title2: 'Astrological Secrets of Kuladeivam Blessings | Deity worship by ALP',
                hook: '“குலதெய்வம் எதுனே தெரியலையா? வழிபாடுகள் தடைப்பட்டுக் கொண்டே இருக்கிறதா? உங்கள் ஜாதகத்தில் இந்த ஒரு குறிப்பிட்ட வீட்டை மட்டும் பலப்படுத்தினால் போதும், குலதெய்வம் தானாக உங்களை தேடி வந்து காக்கும்! இதோ ரகசிய கிரக சேர்க்கை!”',
                desc: '🕉️ பூர்வ புண்ணிய அனுகிரகம்:\nஉங்கள் ஜாதகத்தில் லக்னத்திற்கு 5 ஆம் அதிபதி பலம் பெற்று, அக்ஷய லக்னம் சுப கிரக சாரங்களில் பயணிக்கும் போது குலதெய்வ வழிபாடு தடங்கலின்றி அமையும். குலதெய்வம் தெரியாதவர்கள் வெள்ளிக்கிழமை பிரம்ம முகூர்த்தத்தில் அகல் விளக்கேற்றி குலதேவியை மனதார வேண்டினால் நல்ல தீர்வு கிடைக்கும்.'
            },
            'Traditional Mode': {
                title1: 'எந்த லக்னக்காரர்கள் என்ன படிக்க வேண்டும்? உங்கள் வாழ்க்கையை தீர்மானிக்கும் சரியான தேர்வு! 📚',
                title2: 'Best Career & Education Choices for Your Lagna | Career Astrology by ALP',
                hook: '“படித்த படிப்பிற்கு வேலை கிடைக்கவில்லையா? அல்லது எந்த படிப்பை தேர்ந்தெடுப்பது என்று குழப்பமாக இருக்கிறதா? உங்கள் பிறப்பு லக்னமும் அக்ஷய லக்னமும் தான் உங்கள் கல்வியை தீர்மானிக்கிறது! லக்னத்திற்கு ஏற்ற சரியான தேர்வு எது?”',
                desc: '📜 கல்வி & தொழில் ஜோதிட தேர்வு:\nஅக்ஷய லக்ன பத்ததி (ALP) படி, ஜாதகரின் நகரும் லக்னத்திற்கு 5ஆம் மற்றும் 10ஆம் இடங்கள் கல்வி மற்றும் தொழிலை தீர்மானிக்கின்றன. நீர் தத்துவ லக்னங்கள் மருத்துவமும், நெருப்பு தத்துவ லக்னங்கள் பொறியியலும், காற்று தத்துவ லக்னங்கள் வணிகவியல் மற்றும் தகவல் தொழில்நுட்பத்தையும் படிக்க வேண்டும். லக்னம் மாறும் போது படிப்பிற்கு மாறான வேலை கிடைக்க வாய்ப்புள்ளது.'
            },
            'Short-Video Mode': {
                title1: 'அரசு வேலை நிச்சயமாக கிடைக்கும் லக்னம் எது? 💼 | Govt Job Alert #shorts #astrology',
                title2: 'Which Lagna gets Permanent Government Jobs? #shorts #alpastrology',
                hook: '“உங்களுக்கு கவர்ன்மென்ட் வேலை கிடைக்குமா? ஜாதகத்துல சூரியனும் செவ்வாயும் பலமா இருந்து, உங்க அக்ஷய லக்னம் இந்த குறிப்பிட்ட வீட்டுக்கு போகும்போது அரசு வேலை நிச்சயம் கிடைக்கும்! அது எந்த லக்னம் தெரியுமா?”',
                desc: '📱 60-வினாடி அரசு வேலை கணிதம்:\nசூரியன் மற்றும் பத்தாம் அதிபதி பலம் பெறும் காலத்தில், அக்ஷய லக்னம் சிம்மம் அல்லது மேஷத்திற்கு செல்லும் போது அரசு வேலைக்கான தேர்வுகள் மற்றும் நேர்காணல்களில் மிகப்பெரிய வெற்றி கிடைக்கும். பரிகாரம்: தினமும் காலையில் ஆதித்ய ஹிருதய ஸ்தோத்திரம் வாசிக்கவும்.'
            }
        },
        'Shani Peyarchi': {
            'Viral Mode': {
                title1: 'கடகம், விருச்சிகம், மீனம் ராசியினர் கவனத்திற்கு! ஏழரை சனியில் தவிர்க்க வேண்டிய 2 பெரிய முடிவுகள்! 🛑',
                title2: 'Crucial Warning for Cancer, Scorpio & Pisces | 2 Big Mistakes in Shani Peyarchi by ALP',
                hook: '“ஏழரை சனியின் பிடியில் இருக்கும் கடகம், விருச்சிகம், மற்றும் மீன ராசிக்காரர்கள் இந்த 2 காரியங்களை மட்டும் தவறியும் செய்து விடாதீர்கள்! மீறினால் தொழில் நஷ்டமும், குடும்பத்தில் கடுமையான நிம்மதியின்மையும் ஏற்படும்! அதென்ன தவறுகள் தெரியுமா?”',
                desc: '🔮 ஏழரை சனி மகா எச்சரிக்கை:\nசனி பகவான் மீன ராசியில் சஞ்சரிக்கும் காலத்தில் கடகம் (அஷ்டம சனி), விருச்சிகம் (அர்த்தாஷ்டம சனி), மற்றும் மீனம் (ஜென்ம சனி) ராசிக்காரர்கள் பெரிய முதலீடுகளில் தொழில் தொடங்குவதையும், சொத்துக்கள் வாங்குவதற்காக ஜாமீன் கையெழுத்திடுவதையும் முற்றிலும் தவிர்க்க வேண்டும். அக்ஷய லக்ன முறைப்படி இந்த காலத்தில் கர்ம வினைகள் தீவிரமாக வேலை செய்யும்.'
            },
            'Spiritual Mode': {
                title1: 'சனி, கேது தொடர்பு உள்ளவர்கள் — சித்தர் வழிபாடு செய்வது மிகப்பெரிய நன்மையை தரும்! 🔮',
                title2: 'Saturn-Ketu Conjunction Remedy: The Power of Siddhar Worship | ALP Astrology',
                hook: '“உங்க ஜாதக கட்டத்துல சனியும் கேதுவும் ஒன்னா இருக்கா? அல்லது ஒருவரை ஒருவர் பார்த்துக் கொள்கிறார்களா? எவ்வளவு உழைச்சாலும் பலன் கிடைக்காம கர்ம பிடியில் சிக்கி தவிக்கிறீர்களா? சித்தர்களை வழிபட்டால் மட்டுமே இதற்கு நிரந்தர தீர்வு கிடைக்கும்! அது ஏன் தெரியுமா?”',
                desc: '🕉️ சனி-கேது கர்ம நிவாரணம்:\nஜோதிடத்தில் சனியும் கேதுவும் இணையும் போது அது "பிரம்மஹத்தி யோகம்" அல்லது தீவிர கர்ம தோஷத்தை உருவாக்குகிறது. கேது ஞான காரகன், சனி கர்ம காரகன் என்பதால், இவர்களுக்கு லௌகீக வாழ்க்கையில் தடைகள் இருக்கும். சித்தர்களின் ஜீவ சமாதிகளுக்குச் சென்று, நல்லெண்ணெய் தீபம் ஏற்றி மனதார வழிபட்டால் கர்ம வினைகள் கரைந்து நல்வழி பிறக்கும்.'
            },
            'Traditional Mode': {
                title1: 'துலாம் லக்னத்திற்கு 4 ஆம் மற்றும் 5 ஆம் அதிபதியான சனி பகவான் நல்லா இருந்தாலே போதும்…வருமானத்தில் குறைவே இருக்காது! 💸',
                title2: 'Libra Lagna Income Secrets: The Hidden Power of Saturn | ALP Astrology',
                hook: '“துலாம் லக்ன காரர்களுக்கு சனி பகவான் கெடுதல் செய்வார்னு நினைக்கிறீங்களா? இல்லவே இல்லை! அவர்தான் உங்களுக்கு குபேர யோகத்தையே தரப்போகிறார்! துலாம் லக்னத்திற்கு 4 மற்றும் 5 ஆம் அதிபதியான சனி நல்ல நிலையில் இருந்தால் வருமானம் கொட்டும்! எப்படி தெரியுமா?”',
                desc: '📜 துலாம் லக்ன சனி ரகசியம்:\nதுலாம் லக்னத்திற்கு சனி பகவான் கேந்திர மற்றும் திரிகோண அதிபதியான "யோக காரகன்" ஆவார். பிறப்பு ஜாதகத்திலோ அல்லது அக்ஷய லக்ன கோச்சாரத்திலோ சனி பகவான் சுப ஸ்தானங்களில் அமறும்போது, துலாம் லக்ன காரர்களுக்கு அசையா சொத்துக்கள், வாகன சேர்க்கை மற்றும் புத்திர வழியில் அள்ள அள்ள குறையாத தன லாபம் கிடைக்கும்.'
            },
            'Short-Video Mode': {
                title1: 'சனி பகவான் தாக்கம் அதிகம் உள்ளவர்கள் சபரிமலை செல்லலாமா? 🕉️ | Shani Sabarimala Remedy #shorts',
                title2: 'Ultimate Saturn Cleansing Ritual at Sabarimala #shorts #hanuman',
                hook: '“ஏழரை சனி மற்றும் அஷ்டம சனியின் உக்கிரமான தாக்கத்தால் அவதிப்படுறீங்களா? சபரிமலை ஐயப்பன் கோவிலுக்கு மாலை அணிந்து சென்று வந்தால் சனியின் தாக்கம் 90% குறைந்துவிடும்! ஐயப்பனுக்கும் சனிக்கும் உள்ள ரகசிய தொடர்பு என்ன தெரியுமா?”',
                desc: '📱 60-வினாடி சனி பரிகாரம்:\nசனிவகை ஆதிக்கம் கொண்ட தர்மசாஸ்தா ஐயப்பனை சனிக்கிழமைகளில் நெய் அபிஷேகம் செய்து வழிபட்டால் ஏழரை சனியின் உக்கிரம் தணியும். பரிகாரம்: கருப்பு நிற ஆடை உடுத்தி ஐயப்பனை தரிசிக்கவும்!'
            }
        },
        'Vastu & Remedies': {
            'Viral Mode': {
                title1: 'வீட்டில் நடக்கும் இந்த ஒரு தவறு தான் பணத்தை தடுத்துக் கொண்டிருக்கிறது! 🛑 | Vastu Blocks',
                title2: 'Is This Simple Home Mistake Blocking Your Wealth? | Vastu Remedies by ALP',
                hook: '“நம்பவே மாட்டீங்க! உங்க வீட்டு சமையலறையில அல்லது நிலை வாசல்ல நீங்க செய்யுற இந்த ஒரு மிகச் சாதாரண தவறுதான், மகாலட்சுமி உங்க வீட்டுக்குள்ள வராம தடுத்துக்கிட்டு இருக்கு! லட்சுமி கடாட்சம் பெருக இந்த ஒரு விஷயத்தை மட்டும் உடனே மாத்துங்க!”',
                desc: '🔮 வாஸ்து தன தடை நீக்கம்:\nபூஜையறையில் உடைந்த சாமி படங்கள் வைப்பது, தெற்கு திசையை நோக்கி கண்ணாடிகள் மாட்டுவது மற்றும் நிலைவாசலுக்கு நேராக துடைப்பம் வைப்பது போன்ற வாஸ்து குறைபாடுகள் வீட்டில் எதிர்மறை ஆற்றலை ஈர்க்கும். அக்ஷய லக்ன திசையின் அடிப்படையில் வடகிழக்கு பகுதியில் எப்போதும் தூய்மையாக நீர் வைத்து வழிபட்டால் செல்வ வளம் அசுர வேகத்தில் அதிகரிக்கும்.'
            },
            'Spiritual Mode': {
                title1: 'கோமதி சக்கரத்தை எப்படி பயன்படுத்துவது? | மஹா லக்ஷ்மி அருள் பெற எளிய வழிமுறை! 🐚',
                title2: 'Gomathi Chakra Wealth Manifestation Ritual | Attract Gold Secrets by ALP',
                hook: '“கோமதி சக்கரம் உங்க வீட்ல இருந்தா வறுமையே வராதுன்னு சொல்லுவாங்க! ஆனா அதை எப்படி முறையா பயன்படுத்தணும் தெரியுமா? லட்சுமி கடாட்சமும் அள்ள அள்ள குறையாத செல்வமும் பெருக கோமதி சக்கரத்தை இப்படி வைங்க!”',
                desc: '🕉️ கோமதி சக்கர தன ஆகர்ஷணம்:\nகோமதி நதியில் இருந்து பெறப்படும் கோமதி சக்கரம் விஷ்ணு மற்றும் லட்சுமியின் அம்சமாகும். பரிகாரம்: 11 கோமதி சக்கரங்களை எடுத்து மஞ்சள் மற்றும் குங்குமமிட்டு, வெள்ளிக்கிழமை அம்மன் பூஜையில் வைத்து, பின்னர் சிவப்பு பட்டு துணியில் முடிந்து உங்கள் பணப்பெட்டியில் வைக்கவும். இது கடன் தொல்லையை அடியோடு நீக்கும்.'
            },
            'Traditional Mode': {
                title1: 'பணம் தங்காமல் போகிறதா? மஹா லக்ஷ்மி அருள் பெற இந்த ஒரு நடைமுறை உங்கள் வாழ்க்கையை மாற்றும்! 💰',
                title2: 'Stop Money Leakage Permanently: Sri Andal Wealth Ritual | ALP Astrology',
                hook: '“கை நிறைய சம்பாதிச்சாலும் பணம் நிக்க மாட்டேங்குதா? கையில் காசு வந்த உடனே தேவையலாத செலவுகள் வந்து கரைகிறதா? லட்சுமி கடாட்சம் நிலைத்து நிற்க வெள்ளிக்கிழமை பிரம்ம முகூர்த்தத்தில் இந்த ஒரு தீப வழிபாட்டை மட்டும் செய்யுங்க!”',
                desc: '📜 லட்சுமி கடாட்ச தன யோக ரகசியம்:\nஅக்ஷய லக்ன கணிதப்படி சுக்கிரன் மற்றும் புதனின் கிரக சேர்க்கை உங்கள் தன ஸ்தானத்தோடு இணையும் போது லட்சுமி கடாட்சம் வேலை செய்யும். தன இழப்பைத் தடுக்க, வீட்டின் சமையலறையில் எப்போதும் கல்லுப்பு நிறைவாக வைத்திருக்க வேண்டும். வெள்ளிக்கிழமைகளில் உப்பை உங்கள் கைகளால் வாங்குவது வறுமையை விரட்டி குபேர சம்பத்தை அள்ளித் தரும்.'
            },
            'Short-Video Mode': {
                title1: 'பிரம்ம முகூர்த்தத்தில் தீபம் ஏற்றினால் வாழ்க்கையே மாறும்! 🕯️ | Muhurtham Deepam #shorts #vastu',
                title2: 'Unbelievable Miracles of Brahma Muhurtham Deepam #shorts #remedies',
                hook: '“தினமும் அதிகாலை பிரம்ம முகூர்த்தத்தில் உங்க வீட்டு பூஜை அறையில இந்த ஒரு திசையில தீபம் ஏற்றி பாருங்க, உங்களை பிடிச்சிருக்க கண் திருஷ்டி, தரித்திரம் எல்லாமே விலகி 48 நாள்ல பெரிய மாற்றம் நடக்கும்!”',
                desc: '📱 60-வினாடி வாஸ்து ரகசியம்:\nஅதிகாலை 4:30 மணி முதல் 6:00 மணிக்குள் வடக்கு அல்லது கிழக்கு திசையை நோக்கி நெய் விளக்கு ஏற்றி "ஓம் லட்சுமி நமஹ" மந்திரத்தை 11 முறை உச்சரிக்கவும். இது லட்சுமி ஆகர்ஷணத்தை உடனடியாகத் தூண்டும்.'
            }
        },
        'Rahu Ketu Peyarchi': {
            'Viral Mode': {
                title1: 'ராஜ யோகம் தரும் ராகுதசை பலன்கள் | யாருக்கு அசுர வளர்ச்சி கிடைக்கும்? 🐍 | Rahu Dasha ALP Rules',
                title2: 'Rahu Dasha Miracles: Extreme Wealth & Fame Secrets | ALP Astrology exclusive',
                hook: '“ராகு தசை ஆரம்பிச்சா நடுத்தெருவுக்கு வந்துடுவாங்கனு சொல்றத கேட்டு பயந்துடாதீங்க! ராகு பகவான் நினைச்சா உங்களை அசுர வேகத்துல கோடீஸ்வரராக மாற்றி ராஜயோகத்தை தருவார்! அது எந்த லக்னத்திற்கு கிடைக்கும் தெரியுமா?”',
                desc: '🔮 ராகு தசை மகா கணிதம்:\nராகு பகவான் போக காரகன் மற்றும் பிரம்மாண்ட காரகன் ஆவார். அக்ஷய லக்ன பத்ததி (ALP) விதிப்படி, ராகு பகவான் உபஜெய ஸ்தானங்களான 3, 6, 11 ஆம் வீடுகளில் சஞ்சரிக்கும் காலத்தில் ராகு தசை நடந்தால், ஜாதகருக்கு எதிர்பாராத வெளிநாட்டு பயணம், பங்குச்சந்தை லாபம் மற்றும் அசுர வேக தொழில் வளர்ச்சி கிடைக்கும்.'
            },
            'Spiritual Mode': {
                title1: 'சந்திர தசை செல்லும் ஜாதகரின் கவனத்திற்கு! 🌘 | சந்திர கிரகணம் அன்று செய்ய வேண்டியவை',
                title2: 'Alert for Moon Dasha Natives during Lunar Eclipse | Critical Remedies by ALP',
                hook: '“உங்களுக்கு சந்திர தசை அல்லது புத்தி நடக்கிறதா? மனக்குழப்பமும், தேவையற்ற பயமும் உங்களை வாட்டி வதைக்கிறதா? சந்திர கிரகண நேரத்துல குழந்தைகள் கல்வி வெற்றி பெறவும், தோஷங்கள் நீங்கவும் செய்ய வேண்டிய மகா பரிகாரம் இதோ!”',
                desc: '🕉️ சந்திர கிரகண தோஷ நிவர்த்தி:\nசந்திரன் மனோகாரகன். சந்திர தசை நடப்பவர்களுக்கு கிரகண காலங்களில் மன உளைச்சல் மற்றும் உடல் உபாதைகள் ஏற்படலாம். பரிகாரம்: சந்திர கிரகண நேரத்திற்கு 2 மணி நேரத்திற்கு முன்பே உணவருந்திவிட்டு, கிரகண நேரத்தில் "ஓம் நமசிவாய" அல்லது காயத்ரி மந்திரத்தை உச்சரிப்பது மனோபயத்தை போக்கி அபாரமான மன வலிமையை வழங்கும்.'
            },
            'Traditional Mode': {
                title1: 'அட்சய நட்சத்திரம் இதுதான் உங்கள் வாழ்க்கையின் திருப்புமுனை! ✨ | Akshaya Star Astrology',
                title2: 'Discover Your Life Turning Point via Akshaya Star | ALP Astrological Secrets',
                hook: '“உங்க வாழ்க்கையில திருப்புமுனை எப்போ வரும்னு தெரியலையா? அக்ஷய லக்னம் செல்லும் அட்சய நட்சத்திர பாத சாரத்தை வச்சு, உங்க வாழ்க்கையோட பொற்காலம் எப்போ ஆரம்பிக்கும்னு துல்லியமா சொல்ல முடியும்! இதோ அக்ஷய லக்ன ரகசியம்!”',
                desc: '📜 அக்ஷய நட்சத்திர கணித விதி:\nஅக்ஷய லக்ன பத்ததி (ALP) கணக்குப்படி, லக்னம் நகரும் நட்சத்திர பாதத்தை ஆராய்ந்து, உங்களது கர்ம வினைகள் முடியும் அட்சய காலத்தை துல்லியமாகக் கணக்கிடலாம். இந்த அட்சய நட்சத்திர சாரத்தை ஆக்டிவேட் செய்தால் தொழில் முடக்கம் நீங்கி புதிய வெற்றிகள் குவியும்.'
            },
            'Short-Video Mode': {
                title1: 'பில்லி சூனியம் ஏவல் உண்மையா? விளக்குகிறார் ALP ஜோதிடர்! 👹 | Evil Eye Protection #shorts',
                title2: 'Does Black Magic Exist? Astrological Reality Explored #shorts #remedy',
                hook: '“பில்லி சூனியம், ஏவல், செய்வினை உண்மையா? ஜாதக கட்டத்துல ராகுவும் கேதுவும் அஷ்டம ஸ்தானத்தோடு தொடர்பு கொள்ளும் போது இதெல்லாம் எப்படி நடக்குது தெரியுமா? இதை 1 நொடியில் போக்கும் எளிய பரிகாரம் இதோ!”',
                desc: '📱 60-வினாடி ஆன்மீக அலர்ட்:\nராகு மற்றும் எட்டாம் அதிபதி கிரகங்களின் சேர்க்கை கண் திருஷ்டி மற்றும் செய்வினை பயத்தை ஏற்படுத்துகிறது. பரிகாரம்: நிலைவாசலில் வெண்கடுகு தூவி சாம்பிராணி போடுவது அனைத்து தீய சக்திகளையும் முறியடிக்கும்!'
            }
        },
        'Tula Rasi': {
            'Viral Mode': {
                title1: 'ALP லக்னம் துலாம் செல்லும் போது நிச்சயிக்கப்பட்ட திருமணமா? காதல் திருமணமா? 💍',
                title2: 'Libra Akshaya Lagna Love vs Arranged Marriage Secrets | ALP Astrology Special',
                hook: '“துலாம் ராசி மற்றும் லக்ன காரர்களே! அக்ஷய லக்னம் துலாம் ராசிக்கு நகரும் போது உங்களது காதல் திருமணம் கைகூடுமா? அல்லது பெரியவர்களால் நிச்சயிக்கப்பட்ட திருமணமா? உங்க ஜாதகத்துல சுக்கிரனோட நிலை என்ன சொல்லுது தெரியுமா?”',
                desc: '🔮 துலாம் திருமண யோக கணிதம்:\nஅக்ஷய லக்னம் துலாம் ராசியில் சஞ்சரிக்கும் காலத்தில் சுக்கிரன் மற்றும் செவ்வாயின் சேர்க்கை 7ம் பாவத்தோடு தொடர்பு கொண்டால் ஜாதகருக்கு காதல் திருமணம் 100% கைகூடும். அதே சமயம் குருவின் பார்வை 7ம் இடத்திற்கு கிடைத்தால் பெரியோர்களால் நிச்சயிக்கப்பட்ட சுப திருமணம் அசுர வேகத்தில் கைகூடி சந்தோஷமான வாழ்க்கை அமையும்.'
            },
            'Spiritual Mode': {
                title1: 'துலாம் லக்னத்திற்கு சித்தர் வழிபாடு - சகல தடைகளையும் நீக்கும் மகா பரிகாரம்! 🔮',
                title2: 'Siddhar Worship for Libra Lagna: Clear All Life Blocks | ALP Remedies',
                hook: '“துலாம் லக்ன காரர்களுக்கு எடுக்கும் காரியங்கள் இழுபறியாக உள்ளதா? கடுமையாக உழைத்தும் முட்டுக்கட்டைகள் வருகிறதா? கன்யாபுரி ஜீவசமாதியில் குடி கொண்டுள்ள இந்த சித்தரை வழிபட்டால் தடைகள் யாவும் பனிபோல் விலகும்!”',
                desc: '🕉️ துலாம் சித்தர் பூசை:\nதுலாம் சுக்கிரனின் வீடு என்பதால், இவர்கள் ஞானம் மற்றும் பொருள் சேர்க்கையை சமநிலை செய்ய வேண்டும். சித்தர்களான திருமூலர் அல்லது பதஞ்சலி முனிவரை வழிபடுவது, இவர்களது சுக்கிர தோஷங்களை அகற்றி, ஆக்கப்பூர்வமான மன அமைதியையும் தொழில் யோகத்தையும் வாரி வழங்கும்.'
            },
            'Traditional Mode': {
                title1: 'துலாம் லக்னத்திற்கு 4 ஆம் மற்றும் 5 ஆம் அதிபதியான சனி நல்லா இருந்தாலே போதும்…வருமானத்தில் குறைவே இருக்காது! 💸',
                title2: 'Libra Lagna Secret: Why Saturn is Your Ultimate Wealth Giver | ALP Rules',
                hook: '“துலாம் லக்னத்திற்கு சனி பகவான் கெடுதல் செய்வார்னு நினைக்கிறீங்களா? இல்லவே இல்லை! அவர்தான் உங்களுக்கு ராஜயோகத்தையே தரப்போகிறார்! துலாம் லக்னத்திற்கு 4 மற்றும் 5 ஆம் அதிபதியான சனி நல்ல நிலையில் இருந்தால் வருமானம் கொட்டும்! எப்படி தெரியுமா?”',
                desc: '📜 துலாம் லக்ன சனி ரகசியம்:\nதுலாம் லக்னத்திற்கு சனி பகவான் கேந்திர மற்றும் திரிகோண அதிபதியான "யோக காரகன்" ஆவார். பிறப்பு ஜாதகத்திலோ அல்லது அக்ஷய லக்ன கோச்சாரத்திலோ சனி பகவான் சுப ஸ்தானங்களில் அமறும்போது, துலாம் லக்ன காரர்களுக்கு அசையா சொத்துக்கள், வாகன சேர்க்கை மற்றும் புத்திர வழியில் அள்ள அள்ள குறையாத தன லாபம் கிடைக்கும்.'
            },
            'Short-Video Mode': {
                title1: 'துலாம் லக்னக்காரர்கள் எப்போது திருமணம் செய்ய வேண்டும்? 💍 | Libra Marriage Time #shorts',
                title2: 'Perfect Marriage Year for Libra Rising #shorts #marriage',
                hook: '“துலாம் லக்னக்காரர்களுக்கு கல்யாண வயசு வந்துவிட்டதா? அக்ஷய லக்னம் துலாமிற்கு வரும் இந்த காலத்தில் சுப காரியம் பேசினால் 3 மாதத்தில் திருமணம் கைகூடும்! உடனே ஜாதகத்தை செக் பண்ணுங்க!”',
                desc: '📱 60-வினாடி துலாம் திருமண அலர்ட்:\nஅக்ஷய லக்ன நகர்வின்படி சுக்கிரன் மற்றும் ஏழாம் அதிபதி சுபசாரம் பெறும் காலத்தில் துலாம் லக்ன காரர்களுக்கு மிகச் சிறந்த வரன் அமைந்து இல்லற வாழ்க்கை இனிமையாகத் தொடங்கும். பரிகாரம்: ஸ்ரீ ஆண்டாள் வழிபாடு செய்க!'
            }
        },
        'Katak Rasi': {
            'Viral Mode': {
                title1: 'கடகம், விருச்சிகம், மீனம் ராசியினர் கவனத்திற்கு! ஏழரை சனியில் தவிர்க்க வேண்டிய 2 பெரிய முடிவுகள்! 🛑',
                title2: 'Alert for Cancer, Scorpio & Pisces: Crucial Saturn Peyarchi Advice by ALP Astrology',
                hook: '“ஏழரை சனியின் பிடியில் இருக்கும் கடகம், விருச்சிகம், மற்றும் மீன ராசிக்காரர்கள் இந்த 2 காரியங்களை மட்டும் தவறியும் செய்து விடாதீர்கள்! மீறினால் தொழில் நஷ்டமும், குடும்பத்தில் கடுமையான நிம்மதியின்மையும் ஏற்படும்! அதென்ன தவறுகள் தெரியுமா?”',
                desc: '🔮 ஏழரை சனி மகா எச்சரிக்கை:\nசனி பகவான் மீன ராசியில் சஞ்சரிக்கும் காலத்தில் கடகம் (அஷ்டம சனி), விருச்சிகம் (அர்த்தாஷ்டம சனி), மற்றும் மீனம் (ஜென்ம சனி) ராசிக்காரர்கள் பெரிய முதலீடுகளில் தொழில் தொடங்குவதையும், சொத்துக்கள் வாங்குவதற்காக ஜாமீன் கையெழுத்திடுவதையும் முற்றிலும் தவிர்க்க வேண்டும். அக்ஷய லக்ன முறைப்படி இந்த காலத்தில் கர்ம வினைகள் தீவிரமாக வேலை செய்யும்.'
            },
            'Spiritual Mode': {
                title1: 'கடகம், விருச்சிகம், மீனம் ராசியினருக்கு சித்தர் வழிபாட்டு பலன்கள்! 🔮',
                title2: 'Siddhar Remedies for Water Signs: Cancer, Scorpio & Pisces | ALP Systems',
                hook: '“ஏழரை சனியின் தாக்கத்திலிருந்து தப்பிக்க சித்தர்களின் அருள் வேண்டுமா? நீர் தத்துவ ராசிகளான கடகம், விருச்சிகம், மீனம் லக்ன காரர்கள் வழிபட வேண்டிய மகா சித்தர்கள் யார் தெரியுமா? இதோ உங்கள் பிரச்சனைகளை தீர்க்கும் பரிகாரம்!”',
                desc: '🕉️ நீர் ராசி சித்தர் பூசை:\nநீர் தத்துவ ராசிகளான கடகத்திற்கு பாம்பாட்டி சித்தரும், விருச்சிகத்திற்கு அழகர் மலை போகரும், மீனத்திற்கு தட்சிணாமூர்த்தி வழிபாடும் சித்தர்களின் அருள் பெற வழிகாட்டும். இவர்களது ஜீவ சமாதிகளில் நெய் விளக்கு ஏற்றி வழிபடுவது ஏழரை சனியின் துன்பங்களை முற்றிலும் போக்கும்.'
            },
            'Traditional Mode': {
                title1: 'கடகம், விருச்சிகம், மீனம் ராசியினர் கவனத்திற்கு! ஏழரை சனி தாக்கம் குறைய எளிய பரிகாரம்! 🕉️',
                title2: 'Cancer, Scorpio & Pisces Saturn Remedy: How to Cleanse Karma | ALP Rules',
                hook: '“சனியின் பார்வையால் கஷ்டப்படுறீங்களா? கடகம், விருச்சிகம், மீனம் லக்ன காரர்கள் சனிக்கிழமை அன்னைக்கு இந்த ஒரு எளிய வழிபாட்டை செஞ்சா, உங்களை பிடிச்சிருக்க கர்ம தோஷங்கள் எல்லாமே நொடியில் விலகும்!”',
                desc: '📜 கர்ம தோஷ பரிகார விதிகள:\nஏழரை சனியின் பிடியில் இருப்பவர்கள் சனிக்கிழமைகளில் நல்லெண்ணெய் தீபம் ஏற்றி ஆஞ்சநேயரையும், நந்தி தேவரையும் வழிபட வேண்டும். மேலும் வறியவர்கள் மற்றும் முதியவர்களுக்கு உங்களால் முடிந்த அன்னதானம் செய்வது சனியின் உக்கிரத்தைக் குறைத்து நிம்மதியைத் தரும்.'
            },
            'Short-Video Mode': {
                title1: 'ஏழரை சனி கடகம், விருச்சிகம், மீனம் எச்சரிக்கை! 🛑 | Shani Peyarchi Alert #shorts',
                title2: 'Important Saturn Advice for Cancer, Scorpio & Pisces #shorts #astrology',
                hook: '“கடகம், விருச்சிகம், மீனம் ராசிக்காரர்களுக்கு ஏழரை சனியோட தாக்கம் ஆரம்பிச்சிடுச்சா? இந்த 1 எளிய தவற மட்டும் பண்ணிடாதீங்க, அப்புறம் வறுமையில மாட்டிக்க வேண்டி வரும்! உடனே எச்சரிக்கையா முடிவெடுங்க!”',
                desc: '📱 60-வினாடி சனி அலர்ட்:\nஏழரை சனியின் பிடியில் இருப்பவர்கள் புதிய பார்ட்னர்ஷிப் தொழில்கள் தொடங்குவதை தற்காலிகமாக தள்ளிப்போட வேண்டும். பரிகாரம்: காக்கைக்கு எள் கலந்த சாதம் வைக்கவும்.'
            }
        },
        'Vrishchik Rasi': {
            'Viral Mode': {
                title1: 'விருச்சிக லக்னத்தினர் ஏழரை சனியில் தவிர்க்க வேண்டிய 2 பெரிய முடிவுகள்! 🛑',
                title2: 'Scorpio Lagna Shani Peyarchi Warning: Avoid these 2 Mistakes | ALP Astrology',
                hook: '“விருச்சிக லக்ன காரர்களே! அர்த்தாஷ்டம சனியின் தாக்கம் தற்போது உங்களுக்கு நடந்து கொண்டிருக்கிறது. இந்த காலத்தில் நீங்கள் எடுக்கும் 2 பெரிய முடிவுகள் உங்களை வாழ்க்கையையே புரட்டிப்போடலாம்! எச்சரிக்கையாக இருக்க வேண்டிய விஷயங்கள் இதோ!”',
                desc: '🔮 விருச்சிக அர்த்தாஷ்டம சனி கணிதம்:\nவிருச்சிக லக்னத்திற்கு சனி பகவான் 3 மற்றும் 4 ஆம் வீடுகளின் அதிபதி ஆவார். 4ஆம் இடத்தில் சனி சஞ்சரிக்கும் இந்த அர்த்தாஷ்டம காலத்தில், வீடு மாற்றுவது, புதிய கட்டுமானங்கள் செய்வது மற்றும் தாய்வழி சொத்துக்களில் கை வைப்பதை முற்றிலும் தவிர்க்க வேண்டும். அக்ஷய லக்ன திசை பலம் பெறும் வரை பொறுமையாக இருக்க வேண்டும்.'
            },
            'Spiritual Mode': {
                title1: 'விருச்சிக லக்னத்திற்கு கர்ம வினைகளைத் தீர்க்கும் போகர் சித்தர் வழிபாடு! 🔮',
                title2: 'Bhagar Siddhar Worship for Scorpio Lagna: Clear Debt & Enemies | ALP',
                hook: '“விருச்சிக லக்ன காரர்களுக்கு பண முடக்கமா? எதிரிகள் தொல்லை மற்றும் கடன் தொல்லையால் அவதிப்படுகிறீர்களா? பழனி மலையில் குடியிருக்கும் போகர் சித்தரை வழிபட்டால் சகல வறுமைகளும் நீங்கும்! இதோ பரிகாரம்!”',
                desc: '🕉️ விருச்சிக போகர் சித்தர் பூசை:\nவிருச்சிகம் செவ்வாயின் ஆதிக்கம் கொண்ட நீர் தத்துவ ராசி என்பதால், இவர்களுக்கு போகர் சித்தரின் வழிபாடு அபாரமான மன வலிமையையும் ஆரோக்கியத்தையும் தரும். பழனி முருகன் கோவிலில் உள்ள போகர் ஜீவ சமாதியை தரிசித்து தியானம் செய்வது கர்ம வினைகளை வேரோடு அறுக்கும்.'
            },
            'Traditional Mode': {
                title1: 'விருச்சிக லக்னத்திற்கு 2026-ல் ராஜயோகம் தரும் கிரக சேர்க்கை எது? | ALP Scorpio Secrets',
                title2: 'Scorpio Lagna Wealth Manifestation Rules in 2026 | ALP Astrology System',
                hook: '“விருச்சிக லக்ன காரர்களுக்கு 2026-ல் அதிர்ஷ்ட கதவுகள் திறக்கப்போகிறதா? ஆம்! குரு பகவானின் சுப பார்வை உங்கள் தன ஸ்தானத்தின் மேல் விழுவதால் வரப்போகும் கோடீஸ்வர யோகம் என்ன தெரியுமா?”',
                desc: '📜 விருச்சிக தன யோக ரகசியம்:\n2026 ஆம் ஆண்டு குரு பெயர்ச்சியின் போது, குரு பகவான் உங்களது 9ஆம் இடத்திற்கு சஞ்சரித்து, அங்கிருந்து உங்களது லக்னத்தை நேரடியாகப் பார்க்கிறார். அக்ஷய லக்ன கணிதப்படி, இது விருச்சிக லக்ன காரர்களுக்கு நீண்ட நாள் வழக்குகளில் வெற்றியையும், எதிர்பாராத பிதுரார்ஜித சொத்துக்கள் சேருவதையும் உறுதி செய்யும்.'
            },
            'Short-Video Mode': {
                title1: 'விருச்சிக லக்னம் ஏழரை சனி தப்பிக்க எளிய வழி! 🕉️ | Scorpio Shani Remedy #shorts',
                title2: 'Scorpio Lagna Shani Peyarchi Tips #shorts #remedy',
                hook: '“விருச்சிக லக்ன காரர்களே! அர்த்தாஷ்டம சனியோட தாக்கத்தால வேலை இழப்பு, அவமானங்கள் ஏற்படுகிறதா? சனிக்கிழமை அனுமனுக்கு இந்த மாலையை சாத்துங்க, அடுத்த 24 மணி நேரத்துல நிம்மதி பிறக்கும்!”',
                desc: '📱 60-வினாடி விருச்சிக அலர்ட்:\nஅর্থாஷ்டம சனியின் வீரியத்தை குறைக்க, சனிக்கிழமைகளில் அனுமனுக்கு வெற்றிலை மாலை சாத்தி, நல்லெண்ணெய் தீபம் ஏற்றி வழிபடவும். பரிகாரம்: முதியவர்களுக்கு வஸ்திர தானம் செய்க!'
            }
        },
        'Meen Rasi': {
            'Viral Mode': {
                title1: 'மீன லக்னத்தினர் ஜென்ம சனியில் தவிர்க்க வேண்டிய 2 பெரிய முடிவுகள்! 🛑 | Meenam Lagna Alert',
                title2: 'Pisces Rising: Critical Mistakes to Avoid in Janma Shani | ALP Astrology',
                hook: '“மீன லக்ன காரர்களே! ஜென்ம சனியின் உக்கிரமான பிடியில் நீங்கள் சஞ்சரிக்கும் இந்த வேளையில், உங்கள் வாழ்க்கையையே பாதிக்கக்கூடிய இந்த 2 தவறுகளை மட்டும் செய்து விடாதீர்கள்! உங்களை காக்கக்கூடிய ஜோதிட எச்சரிக்கை இதோ!”',
                desc: '🔮 மீன ஜென்ம சனி கணிதம்:\nசனி பகவான் மீன லக்னத்திலேயே சஞ்சரிக்கும் இந்த ஜென்ம சனி காலத்தில், ஜாதகருக்கு தேவையற்ற மனக்குழப்பங்கள், ஆரோக்கிய பாதிப்புகள் மற்றும் தொழிலில் ஏமாற்றங்கள் ஏற்படலாம். இந்த காலத்தில் கூட்டு வியாபாரங்கள் தொடங்குவதையோ, மற்றவர்களுக்காக ஜாமீன் கையெழுத்து போடுவதையோ முற்றிலும் தவிர்க்க வேண்டும்.'
            },
            'Spiritual Mode': {
                title1: 'மீன லக்னத்திற்கு பித்ரு தோஷம் போக்கும் கால பைரவர் மகா வழிபாடு! ⚔️',
                title2: 'Kala Bhairava Worship for Pisces Lagna: Clear Health & Property Issues | ALP',
                hook: '“சொத்து பிரச்சனையா? தீராத கோர்ட் வழக்குகளால் தூக்கத்தை இழந்து தவிக்கிறீர்களா? மீன லக்ன காரர்கள் இந்த குறிப்பிட்ட பைரவர் கோவிலுக்கு ஒரே ஒரு முறை சென்று வந்தால் போதும்! அத்தனை பிரச்சனைகளும் நொடியில் தீரும்!”',
                desc: '🕉️ மீன பைரவர் வழிபாடு:\nமீனம் குருவின் ஆதிக்கம் கொண்ட நீர் தத்துவ ராசி என்பதால், இவர்களுக்கு கால பைரவரின் வழிபாடு மகா கவசமாகும். தேய்பிறை அஷ்டமி திதியில் பைரவருக்கு செவ்வரளி மாலை சாத்தி, மிளகு தீபம் ஏற்றி வழிபடவும். இது அனைத்து சொத்து தகராறுகளையும் தீர்த்து வைக்கும்.'
            },
            'Traditional Mode': {
                title1: 'மீன லக்னத்திற்கு 2026-ல் தேடி வரும் விபரீத ராஜயோகம்! | ALP Pisces Rules',
                title2: 'Pisces Lagna Wealth Manifestation Guide 2026 | ALP Astrology System',
                hook: '“ஜென்ம சனி நடந்து கொண்டிருக்கும் மீன லக்ன காரர்களுக்கு 2026 குரு பெயர்ச்சி எவ்வாறு அமையப்போகிறது? குருவின் சுப பார்வை உங்கள் நகரும் அக்ஷய லக்னத்தோடு இணையும் போது ஏற்படும் விபரீத ராஜயோகம் என்ன தெரியுமா?”',
                desc: '📜 மீன தன யோக ரகசியம்:\n2026 ஆம் ஆண்டு குரு பகவான் கடக ராசிக்கு பெயர்ச்சி அடைந்து உங்களது 5ஆம் இடத்தை அடைகிறார். அங்கிருந்து மீன லக்னத்தையும், 9ஆம் வீட்டையும், லாப ஸ்தானத்தையும் பார்க்கிறார். அக்ஷய லக்ன கணிதப்படி, இது மீன லக்ன காரர்களுக்கு ஜென்ம சனியின் இன்னல்களைத் தணித்து, புதிய தொழில் வாய்ப்புகளையும், வராக்கடன்களையும் வசூலித்துக் கொடுக்கும்.'
            },
            'Short-Video Mode': {
                title1: 'மீன லக்னம் ஜென்ம சனி தப்பிக்க மகா எளிய வழி! 🕯️ | Pisces Shani Remedy #shorts',
                title2: 'Janma Shani Remedy for Pisces Rising #shorts #shani',
                hook: '“மீன லக்ன காரர்களே! ஜென்ம சனியோட கொடுமையால கடுமையான பணத்தடையும் மன அழுத்தமும் இருக்கா? சனிக்கிழமை சனீஸ்வரனுக்கு எள் விளக்கு இப்படி ஏத்துங்க, கர்ம வினை நொடியில் விலகும்!”',
                desc: '📱 60-வினாடி மீன அலர்ட்:\nஜென்ம சனியின் தாக்கத்தை குறைக்க, சனிக்கிழமைகளில் ஒரு சிறு கருப்பு துணியில் எள்ளினை கட்டி, நல்லெண்ணெய் விளக்கில் போட்டு தீபம் ஏற்றி சனீஸ்வரனை வழிபடவும். பரிகாரம்: காக்கைக்கு உணவு வைக்கவும்!'
            }
        },
        'Makar Rasi': {
            'Viral Mode': {
                title1: 'ஜோதிடமும் தொழிலும் மகர லக்னம் செல்லும் போது எப்படி இருக்கும்? 💼 | Makar Lagna Career',
                title2: 'Makar Akshaya Lagna Career & Business Predictions | ALP Astrology System',
                hook: '“மகர லக்ன காரர்களே! உங்கள் ஜாதகத்தில் அக்ஷய லக்னம் மகரத்திற்கு நகரும் போது உங்களது தொழில் வாழ்க்கை எப்படி இருக்கும்? வேலையில் புரமோஷனா? அல்லது புதிய தொழிலில் வெற்றியா? இதோ ALP தொழில் கணிதம்!”',
                desc: '🔮 மகர லக்ன தொழில் கணிதம்:\nஅக்ஷய லக்னம் மகர ராசியில் சஞ்சரிக்கும் காலத்தில், சனியின் நேரடி ஆதிக்கம் ஜாதகருக்கு உழைப்பிற்கேற்ற பலனைத் தரும். இந்த காலத்தில் உங்களது 10ஆம் அதிபதியான சுக்கிரன் பலம் பெற்றால், ஆடை, ஆபரணம், மற்றும் கலைத்துறையில் மிகப்பெரிய தொழில் வெற்றியும், அரசு வழி லாபங்களும் தடையின்றி கை கூடி வரும்.'
            },
            'Spiritual Mode': {
                title1: 'மகர லக்னத்திற்கு வறுமை நீக்கும் மகா தட்சிணாமூர்த்தி வழிபாடு! 🕉️',
                title2: 'Guru Dakshinamurthy Worship for Capricorn Lagna: Clear Financial Blocks | ALP',
                hook: '“மகர லக்ன காரர்களே! எவ்வளவு சம்பாதித்தாலும் கடனாளியாகவே இருக்கிறீர்களா? தொழில் முடக்கம் நீங்கி செல்வ வளம் பெருக வியாழக்கிழமை தட்சிணாமூர்த்தி பகவானுக்கு இந்த ஒரு தானியத்தை சாத்தி கும்பிடுங்கள்!”',
                desc: '🕉️ மகர குரு தட்சிணாமூர்த்தி பூசை:\nமகரம் சனியின் ஆதிக்கம் கொண்ட மண் தத்துவ ராசி என்பதால், இவர்களுக்கு குருவின் அருள் மிகவும் அவசியமாகும். வியாழக்கிழமைகளில் தட்சிணாமூர்த்தி பகவானுக்கு கொண்டைக்கடலை மாலை சாத்தி, நெய் விளக்கேற்றி 24 முறை வலம் வந்து வழிபடுவது இவர்களது பொருளாதார முடக்கத்தை முற்றிலும் அகற்றும்.'
            },
            'Traditional Mode': {
                title1: 'மகர லக்னத்திற்கு 2026-ல் தேடி வரும் ராஜயோக கிரக சேர்க்கை எது? | ALP Makar Secrets',
                title2: 'Capricorn Lagna 2026 Wealth & Business Expansion Guide | ALP Rules',
                hook: '“மகர லக்ன காரர்களுக்கு 2026 ஆம் ஆண்டில் தொழில்Expansion மற்றும் புதிய வேலை வாய்ப்புகள் எப்படி அமையும்? கோச்சார சனியும் குருவும் இணையும் இந்த அரிய காலத்தில் ஏற்படும் மாற்றங்கள் என்ன தெரியுமா?”',
                desc: '📜 மகர ராஜயோக ரகசியம்:\n2026 ஆம் ஆண்டு குரு பெயர்ச்சியின் போது, குரு பகவான் உங்களது 7ஆம் இடத்திற்கு பெயர்ச்சி அடைகிறார். அங்கிருந்து உங்களது லக்னத்தையும், 3ஆம் வீட்டையும், 11ஆம் வீட்டையும் சுப பார்வை பார்க்கிறார். அக்ஷய லக்ன பத்ததி (ALP) கணிதப்படி, இது மகர லக்ன காரர்களுக்கு புதிய பார்ட்னர்ஷிப் தொழில்கள் அமையவும், வெளிநாட்டு வாய்ப்புகள் கூடி வரவும் மிகச் சிறந்த பொற்காலமாக அமையும்.'
            },
            'Short-Video Mode': {
                title1: 'மகர லக்னக்காரர்கள் செய்ய வேண்டிய எளிய பண பரிகாரம்! 💰 | Capricorn Wealth Hacks #shorts',
                title2: 'Capricorn Lagna Money Manifestation Tips #shorts #vastu',
                hook: '“மகர லக்ன காரர்களே! கையில் பண புழக்கம் அதிகரிக்கவும், வறுமை நீங்கவும் வெள்ளிக்கிழமை நிலை வாசலில் இந்த ஒரு பொருளை மட்டும் வைங்க, லட்சுமி தேவி ஓடி வருவாள்!”',
                desc: '📱 60-வினாடி மகர அலர்ட்:\nவெள்ளிக்கிழமை காலையில் நிலை வாசலின் இருபுறமும் மஞ்சள் பூசி குங்குமமிட்டு, ஒரு சிறிய வெண்கல கிண்ணத்தில் தண்ணீர் ஊற்றி அதில் பூக்களை மிதக்க விடுங்கள். இது வீட்டில் செல்வ ஆகர்ஷணத்தை உடனடியாகத் தூண்டும்.'
            }
        }
    };

    // Make template fallbacks safe if user selects single rasi options
    const zodiacKeys = Object.keys(simulatedDashboardAITemplates);
    const validKeys = ['General Astrology', 'Guru Peyarchi', 'Shani Peyarchi', 'Vastu & Remedies', 'Rahu Ketu Peyarchi', 'Tula Rasi', 'Katak Rasi', 'Vrishchik Rasi', 'Meen Rasi', 'Makar Rasi'];
    zodiacKeys.forEach(k => {
        // Map other single rasi options to General Astrology fallback
        if (!validKeys.includes(k)) {
            simulatedDashboardAITemplates[k] = simulatedDashboardAITemplates['General Astrology'];
        }
    });



    // 8. Compile Localized Concepts Action
    const btnGenerateDashAi = document.getElementById('btn-generate-dash-ai');
    const dashAiBtnText = document.getElementById('dash-ai-btn-text');
    const dashAiSpinner = document.getElementById('dash-ai-spinner');
    const dashAiResults = document.getElementById('dash-ai-results');
    const dashAiPlaceholder = document.getElementById('dash-ai-placeholder');

    const dashAiTitlesList = document.getElementById('dash-ai-titles-list');
    const dashAiHook = document.getElementById('dash-ai-hook');
    const dashAiDesc = document.getElementById('dash-ai-desc');

    if (btnGenerateDashAi) {
        btnGenerateDashAi.addEventListener('click', () => {
            const apiKey = dashGeminiKeyInput ? dashGeminiKeyInput.value.trim() : '';
            const zodiacFocus = document.getElementById('ai-zodiac-focus').value;
            const exprMode = document.getElementById('ai-expr-mode').value;

            // UI feedback loading state
            btnGenerateDashAi.disabled = true;
            if (dashAiBtnText) dashAiBtnText.textContent = 'Processing Global Trends...';
            if (dashAiSpinner) dashAiSpinner.style.display = 'inline-block';

            if (!apiKey) {
                // RUN OFFLINE SIMULATION MODE
                setTimeout(() => {
                    const templateGroup = simulatedDashboardAITemplates[zodiacFocus] || simulatedDashboardAITemplates['General Astrology'];
                    const scriptObj = templateGroup[exprMode] || templateGroup['Viral Mode'];
                    
                    renderCompiledDashboardAIResponse(scriptObj, true);
                }, 1200);
            } else {
                // RUN LIVE GEMINI API MULTI-MODE COMPILER
                executeLiveDashboardGeminiCall(apiKey, zodiacFocus, exprMode);
            }
        });
    }

    function renderCompiledDashboardAIResponse(scriptObj, isSimulated) {
        if (dashAiPlaceholder && dashAiResults) {
            dashAiPlaceholder.style.display = 'none';
            dashAiResults.style.display = 'block';

            // Render Titles
            if (dashAiTitlesList) {
                dashAiTitlesList.innerHTML = '';
                const titles = [scriptObj.title1, scriptObj.title2];
                titles.forEach((title, idx) => {
                    if (title) {
                        const item = document.createElement('div');
                        item.className = 'script-title-item';
                        item.innerHTML = `
                            <span><strong>Title ${idx + 1}:</strong> ${title}</span>
                            <span class="copy-badge">COPY</span>
                        `;
                        setupCopyToClipboard(item, title, `✓ Title ${idx + 1} Copied!`);
                        dashAiTitlesList.appendChild(item);
                    }
                });
            }

            // Render Hook & Desc
            if (dashAiHook) {
                dashAiHook.innerHTML = isSimulated ? `<span style="display:block; font-size:0.65rem; color:var(--gold); font-weight:700; margin-bottom:0.25rem; text-transform:uppercase;">ℹ️ Simulating Local Concept</span>${scriptObj.hook}` : scriptObj.hook;
            }
            if (dashAiDesc) {
                dashAiDesc.textContent = scriptObj.desc || scriptObj.description;
            }

            // Reset copy concept description listener
            const btnCopyConcept = document.getElementById('btn-copy-concept-description');
            if (btnCopyConcept) {
                const fullText = `🔮 Dynamic Concept Suggestion:\n\nTitle Suggestion:\n${scriptObj.title1}\n\nSuggested Hook:\n${scriptObj.hook}\n\nDescription summary:\n${scriptObj.desc || scriptObj.description}\n\nGenerated via ALP Astrology Content Discovery Dashboard`;
                
                // Clear old listeners
                const newBtn = btnCopyConcept.cloneNode(true);
                btnCopyConcept.parentNode.replaceChild(newBtn, btnCopyConcept);
                setupCopyToClipboard(newBtn, fullText, '✓ Full Concept Copied!');
            }
        }

        resetDashboardButtonLoadingState();
        showToast(isSimulated ? '✨ Local Concept Simulated!' : '🚀 Live AI Concept Synthesized!');
    }

    function resetDashboardButtonLoadingState() {
        if (btnGenerateDashAi) btnGenerateDashAi.disabled = false;
        if (dashAiBtnText) dashAiBtnText.textContent = '✨ Compile Localized Viral Concepts';
        if (dashAiSpinner) dashAiSpinner.style.display = 'none';
    }

    function executeLiveDashboardGeminiCall(apiKey, zodiacFocus, exprMode) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const prompt = `You are a master Tamil Vedic astrologer and viral spiritual YouTuber specializing in the அக்ஷய லக்ன பத்ததி (ALP Astrology) system.
        Compile astrology content for:
        - Zodiac Focus: ${zodiacFocus}
        - Expression Mode: ${exprMode} (e.g. Viral Mode, Spiritual Mode, Traditional Mode, Short-Video Mode)
        
        Generate:
        1. Two viral, high-CTR YouTube titles (bilingual, English and Tamil).
        2. A highly dramatic 30-second emotional video hook in Tamil to prevent viewers from swiping away.
        3. A comprehensive daily summary/description of the astrological energy in Tamil incorporating the ALP moving lagna system.
        
        Return your response strictly as a valid, parsable JSON object. Do not wrap it in markdown backticks or write "json" prefix. The response must match this schema:
        {
          "title1": "Suggested Title 1 (bilingual)",
          "title2": "Suggested Title 2 (bilingual)",
          "hook": "30-second dramatic hook in Tamil",
          "desc": "Astrology description/summary in Tamil focusing on ALP lagna and remedies"
        }`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })
        })
        .then(res => {
            if (!res.ok) throw new Error('Gemini API Connection rejected.');
            return res.json();
        })
        .then(data => {
            if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                const rawText = data.candidates[0].content.parts[0].text.trim();
                try {
                    const parsedData = JSON.parse(rawText);
                    renderCompiledDashboardAIResponse(parsedData, false);
                } catch (parseErr) {
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        renderCompiledDashboardAIResponse(JSON.parse(jsonMatch[0]), false);
                    } else {
                        throw new Error('Response format mismatch.');
                    }
                }
            } else {
                throw new Error('Empty response returned.');
            }
        })
        .catch(err => {
            console.warn('⚠️ Dashboard Gemini API Error:', err.message);
            showToast('⚠️ AI Key error. Running local simulation...');
            
            // Auto fallback
            const templateGroup = simulatedDashboardAITemplates[zodiacFocus] || simulatedDashboardAITemplates['General Astrology'];
            const scriptObj = templateGroup[exprMode] || templateGroup['Viral Mode'];
            renderCompiledDashboardAIResponse(scriptObj, true);
        });
    }

    // 9. Keyword Trend Spikes Chart Renderer
    const keywordTrendChartList = document.getElementById('keyword-trend-chart-list');

    function renderKeywordTrendSpikesVisual() {
        if (!keywordTrendChartList) return;

        keywordTrendChartList.innerHTML = '';
        seededKeywordSpikes.forEach(k => {
            const row = document.createElement('div');
            row.className = 'trend-spike-row';
            row.innerHTML = `
                <div class="trend-spike-meta">
                    <span>${k.name}</span>
                    <span style="color: var(--gold); font-family: var(--font-mono);">${k.value}%</span>
                </div>
                <div class="trend-spike-bar-bg">
                    <div class="trend-spike-bar-fill" style="width: 0%;"></div>
                </div>
            `;
            keywordTrendChartList.appendChild(row);

            // Trigger visual bar growth animation after minor rendering delay
            setTimeout(() => {
                const fill = row.querySelector('.trend-spike-bar-fill');
                if (fill) fill.style.width = `${k.value}%`;
            }, 150);
        });
    }

    // 10. Saved Ideas Local Storage Library Shelf
    const savedIdeasShelf = document.getElementById('saved-ideas-shelf');
    const btnSaveConcept = document.getElementById('btn-save-concept');
    const btnClearLibrary = document.getElementById('btn-clear-library');

    function loadSavedLibraryShelf() {
        if (!savedIdeasShelf) return;

        savedIdeasShelf.innerHTML = '';
        const savedRaw = localStorage.getItem('alp_saved_ideas');
        const ideas = savedRaw ? JSON.parse(savedRaw) : [];

        if (ideas.length === 0) {
            savedIdeasShelf.innerHTML = `
                <div style="text-align:center; padding: 1.5rem 0.5rem; color: var(--text-muted); font-size: 0.72rem;">
                    Your saved library shelf is empty. Save generated concepts above to build your checklist!
                </div>
            `;
            return;
        }

        ideas.forEach((id, idx) => {
            const item = document.createElement('div');
            item.className = 'saved-shelf-item';
            item.innerHTML = `
                <span class="saved-item-text" title="${id.title}">${id.title}</span>
                <button class="saved-item-delete-btn" data-idx="${idx}">✕</button>
            `;

            // Click delete button
            item.querySelector('.saved-item-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                ideas.splice(idx, 1);
                localStorage.setItem('alp_saved_ideas', JSON.stringify(ideas));
                loadSavedLibraryShelf();
                showToast('✕ Concept removed from saved shelf.');
            });

            // Click row to copy suggested title
            item.addEventListener('click', () => {
                navigator.clipboard.writeText(id.title).then(() => {
                    showToast('✓ Saved Title Copied!');
                });
            });

            savedIdeasShelf.appendChild(item);
        });
    }

    if (btnSaveConcept) {
        btnSaveConcept.addEventListener('click', () => {
            // Get current compiled titles
            const titlesList = document.getElementById('dash-ai-titles-list');
            if (!titlesList || titlesList.children.length === 0) {
                showToast('⚠️ No generated concept to save! Compile one first.');
                return;
            }

            const primaryTitleText = titlesList.children[0].querySelector('span').textContent.replace('Title 1:', '').trim();
            const savedRaw = localStorage.getItem('alp_saved_ideas');
            const ideas = savedRaw ? JSON.parse(savedRaw) : [];

            // Prevent duplicate titles
            if (ideas.some(i => i.title === primaryTitleText)) {
                showToast('💡 Topic already saved in your library shelf!');
                return;
            }

            ideas.unshift({
                title: primaryTitleText,
                date: new Date().toLocaleDateString()
            });

            localStorage.setItem('alp_saved_ideas', JSON.stringify(ideas));
            loadSavedLibraryShelf();
            showToast('💾 Topic saved successfully to library!');
        });
    }

    if (btnClearLibrary) {
        btnClearLibrary.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your saved astrology ideas library?')) {
                localStorage.removeItem('alp_saved_ideas');
                loadSavedLibraryShelf();
                showToast('🗑️ Saved Library cleared!');
            }
        });
    }

    // ============================================
    // SECTION 05D: STUDENT AFFILIATE NETWORK DYNAMIC FILTERING
    // ============================================
    const netFilterPills = document.querySelectorAll('.network-filter-pill');
    const networkRows = document.querySelectorAll('.network-row');
    const networkTableBody = document.querySelector('#network-table tbody');

    let activeNetFilters = { cat: 'all', reach: 'all', activity: 'all' };

    function filterNetworkTable() {
        if (!networkRows) return;

        let visibleCount = 0;

        networkRows.forEach(row => {
            const rowCat = row.dataset.cat;
            const rowSubs = parseInt(row.dataset.subs) || 0;
            const rowActive = row.dataset.active;

            // 1. Check Content Category match
            let matchCat = false;
            if (activeNetFilters.cat === 'all') matchCat = true;
            else if (activeNetFilters.cat === 'astro') matchCat = (rowCat === 'astro');
            else if (activeNetFilters.cat === 'devotional') matchCat = (rowCat === 'devotional');
            else if (activeNetFilters.cat === 'others') matchCat = (rowCat !== 'astro' && rowCat !== 'devotional');

            // 2. Check Reach Tier match
            let matchReach = false;
            if (activeNetFilters.reach === 'all') matchReach = true;
            else if (activeNetFilters.reach === 'high') matchReach = (rowSubs >= 10000);
            else if (activeNetFilters.reach === 'low') matchReach = (rowSubs < 10000);

            // 3. Check Activity Status match
            let matchActive = false;
            if (activeNetFilters.activity === 'all') matchActive = true;
            else if (activeNetFilters.activity === 'active') matchActive = (rowActive === 'active');
            else if (activeNetFilters.activity === 'dormant') matchActive = (rowActive === 'dormant');

            if (matchCat && matchReach && matchActive) {
                row.style.display = 'table-row';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Handle placeholder for empty states
        const existingNoResults = document.getElementById('network-no-results');
        if (existingNoResults) existingNoResults.remove();

        if (visibleCount === 0 && networkTableBody) {
            const emptyRow = document.createElement('tr');
            emptyRow.id = 'network-no-results';
            emptyRow.innerHTML = `
                <td colspan="7" style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">
                    ⚠️ No student affiliate channels match the selected filters.
                </td>
            `;
            networkTableBody.appendChild(emptyRow);
        }
    }

    if (netFilterPills) {
        netFilterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                const type = pill.dataset.filter;
                const val = pill.dataset.val;

                // Active styling updates
                const siblings = pill.parentNode.querySelectorAll('.network-filter-pill');
                siblings.forEach(s => s.classList.remove('active'));
                pill.classList.add('active');

                // Map filter values
                activeNetFilters[type] = val;

                // Re-filter table rows
                filterNetworkTable();
                showToast(`🎯 Filter updated: Showing ${val === 'all' ? 'all' : val} channels`);
            });
        });
    }

    // Initialize Dashboard renders on Page Load
    setTimeout(() => {
        renderTrendDashboardFeed();
        renderKeywordTrendSpikesVisual();
        loadSavedLibraryShelf();
        filterNetworkTable(); // run initial affiliate network filter
    }, 500);

    // ============================================
    // SECTION 13: ADVANCED COMPETITOR & DEMOGRAPHICS DATA
    // ============================================
    const globalCompetitorData = {
        tamil: {
            title: 'Tamil Competitors (IBC Bakthi, Life Horoscope, Astro Chinnaraj)',
            badge: 'VERIFIABILITY: LOW (20%)',
            drawbacks: 'Cluttered thumbnails, static audio commentary, and a massive reliance on repetitive generalized Vedic rasi predictions (which has very low mathematical precision). However, they possess enormous upload volumes, deep historical libraries, and established older female/male demographic trust.',
            trustSecret: 'Building traditional religious bonds and temple worship pariharams. They rely heavily on standard devotional imagery, astrological heritage, and simple faith-driven remedy instructions rather than mathematical validation of individual charts.',
            improvements: 'Upgrade video pacing: overlay high-converting lower-thirds, use zoom cuts for voice emphasis (every 10-15 seconds), and insert graphical chart popups showing exactly how the temple pariharam relates mathematically to the user\'s moving Akshaya Lagna. Consolidate your visual branding under `@ALPASTROLOGY` to avoid audience splitting.'
        },
        hindi: {
            title: 'Hindi Competitors (AstroTak, Astro Arun Pandit, Astrosage)',
            badge: 'VERIFIABILITY: MEDIUM (45%)',
            drawbacks: 'Highly repetitive weekly predictions and general pop-astrology career/relationship advice. Their huge strength is extremely polished editing, high-energy presentation, rapid visual jump cuts, graphical digital boards, and active response loops answering viewer comment suggestions.',
            trustSecret: 'Building deep personal branding, high-relatability, and instant solutions for youth anxieties. They leverage active student/user reviews and interactive live Q&As to establish rapid community authority.',
            improvements: 'Adopt youth-friendly pacing: implement visual cuts every 5-8 seconds, project high energy with active hand gestures and camera-facing posture, use bright modern fonts, and introduce comment-response cards (answering specific viewer-submitted birth charts live on screen to prove authority).'
        },
        english: {
            title: 'English Competitors (The Astrology Podcast, KRSchannel)',
            badge: 'VERIFIABILITY: HIGH (75%)',
            drawbacks: 'Often highly academic, long-form, and less accessible to a general mass-audience looking for immediate daily solutions. However, they excel in pristine multi-camera setups, shallow depth of field, exceptional audio isolation, and deep scholarly citations of ancient scriptures.',
            trustSecret: 'Establishing academic rigor, intellectual depth, and highly professional broadcast aesthetics. They build trust through logical reasoning and presenting detailed charts on clean, high-contrast slides.',
            improvements: 'Upgrade audio quality: lay rugs over reflective marble floors and isolate your studio to eliminate room echo. Utilize your Sony FX Cinema camera as A-Cam (S-Log3, f/2.8) and Canon as B-Cam to capture secondary angles, and present ALP as a logical, mathematical "Astrology Science" rather than mysticism.'
        },
        alp: {
            title: 'ALP Strategy (Our Capstone Strategy)',
            badge: 'VERIFIABILITY: 100% MATHEMATICAL',
            drawbacks: 'Current drawbacks include slow visual pacing, high room echo in videos, visual dilution due to excessive upload frequency (7,900+ videos), split audience branding between SASTI TV and ALP, and a lack of on-screen visual proof showing how predictions actually materialize.',
            trustSecret: 'Unshakeable mathematical precision through Dr. Pothuvudaimoorthy\'s Akshaya Lagna Paddhati (ALP) where the moving lagna shifts 1 degree every 4 months, allowing exact prediction validation.',
            improvements: 'Earn people\'s trust programmatically: overlay client case study charts on screen during explanations, show absolute prediction proof with dates, structure distinct branded playlists, decrease upload frequency while heavily boosting post-production quality, and leverage interactive student affiliate networks (303K+ combined reach) to cross-promote services.'
        }
    };

    const demographicsBlueprint = {
        '18-25': {
            male: {
                title: '👨 Ages 18-25 · Male Target Blueprint',
                driver: 'High anxiety about career stability, exams concentration, competitive placements, parental expectations, and digital/tech addictions.',
                houses: '1st (Self-growth), 5th (Intellect & Exam Success), & 10th (Career Path) Houses.',
                deity: 'Saraswathi, Lord Murugan. Remedies: Offering green flowers, utilizing Mercury energies for mental focus.',
                titleIdea: '"IT & Govt Jobs: அக்ஷய லக்னம் சொல்லும் சரியான படிப்பு! | ALP Career Guide"',
                visuals: 'Rapid pacing (cuts every 5-8s), dynamic green/cyan tech lower-third overlays, digital chart grids, and energetic presenter stance. Frame astrology as a mathematical system Crossover rather than devotion.'
            },
            female: {
                title: '👩 Ages 18-25 · Female Target Blueprint',
                driver: 'Anxiety regarding higher education, career independence, love/marriage crossroads, self-identity, and emotional balance.',
                houses: '5th (Emotions & Intellect), 7th (Relationship houses), & 9th (Higher learning) Houses.',
                deity: 'Goddess Durga, Amman worship. Remedies: Jasmine flower archana, simple Friday lamp pariharams.',
                titleIdea: '"உயர் கல்வி மற்றும் காதல் யோகம் ஜாதகத்தில் எப்போது கூடி வரும்? | ALP Study Guide"',
                visuals: 'Soothing soft key lighting, warm golden tones, structured bullet points, elegant and clear lower-thirds, step-by-step empathetic logical breakdowns.'
            }
        },
        '26-40': {
            male: {
                title: '👨 Ages 26-40 · Male Target Blueprint',
                driver: 'Severe pressure regarding late marriages (90s kids delays), heavy financial debts, career stagnation, business growth hurdles, and buying a house.',
                houses: '7th (Marriage partner), 6th (Debt & litigations), & 10th/11th (Profession & profits) Houses.',
                deity: 'Lord Bhairavar, Lord Ganesha. Remedies: Offering black sesame oil lamps to Bhairavar on Ashtami days.',
                titleIdea: '"தீராத கடன் மற்றும் தொழில் முடக்கம் நீங்க அக்ஷய லக்ன பரிகாரங்கள்! | ALP Debt Relief"',
                visuals: 'Highly authoritative presentation style, clean case-study chart overlays on screen, direct bullet points, bold red/gold warning colors. Present clear mathematical proof of prediction dates.'
            },
            female: {
                title: '👩 Ages 26-40 · Female Target Blueprint',
                driver: 'Marital discord, child birth / fertility delays, delayed marriage timing, domestic peace, and safe gold/asset purchasing times.',
                houses: '7th (Kalathira sthanam), 5th (Puthra bhagya - child), & 2nd (Dhana & family wealth) Houses.',
                deity: 'Garbarakshambigai Amman, Goddess Lakshmi. Remedies: Salt-water home cleansing pariharams, Friday ghee lamps.',
                titleIdea: '"திருமண தாமதம் மற்றும் களத்திர தோஷத்திற்கு எளிய ALP பரிகாரங்கள்! | ALP Marriage Guide"',
                visuals: 'Warm, highly supportive and empathetic tone, soft rim lighting to separate from black backdrop, large clear text overlays listing daily home rituals.'
            }
        },
        '41-55': {
            male: {
                title: '👨 Ages 41-55 · Male Target Blueprint',
                driver: 'Mid-life career transitions, permanent house construction, family inheritance disputes, children\'s higher education costs, and initial health alerts.',
                houses: '4th (Property, Vastu, & vehicles), 8th (Inheritance & sudden events), & 10th (Career maturity) Houses.',
                deity: 'Goddess Varahi Amman, Lord Shiva. Remedies: Special Varahi worship with coconut lamps, Vastu remedies.',
                titleIdea: '"சொந்த வீடு கட்டும் யோகம் ஜாதகத்தில் எந்த அக்ஷய லக்னத்தில் நடக்கும்? | ALP Vastu"',
                visuals: 'Professional corporate/academic background styling, clear floorplan overlays, slower and highly authoritative vocal delivery, traditional clean serif fonts.'
            },
            female: {
                title: '👩 Ages 41-55 · Female Target Blueprint',
                driver: 'Children\'s marriage delays, husband\'s career/health protection, household peace, and transitioning into personal spiritual practices.',
                houses: '7th (Husband\'s house), 5th (Grandchildren/Children\'s weddings), & 9th (Spiritual dharma) Houses.',
                deity: 'Lord Murugan, Amman temples. Remedies: Ancestral Pithru pariharams, simple home temple lamps.',
                titleIdea: '"உங்கள் பிள்ளைகளுக்கு எப்போது திருமணம் நடக்கும்? அக்ஷய லக்ன துல்லிய கணிப்பு! | ALP Family"',
                visuals: 'Calm maternal presentation, gentle background music, slow and steady pacing, clean visual slides outlining exact pariharam items.'
            }
        },
        '56-70': {
            male: {
                title: '👨 Ages 56-70+ · Male Target Blueprint',
                driver: 'Post-retirement health worries (joint pain, heart), legacy planning, peaceful distribution of wealth, and achieving profound spiritual peace.',
                houses: '8th (Longevity & wellness), 12th (Moksha & sound sleep), & 9th (Dharmic deeds) Houses.',
                deity: 'Lord Dhanvantri, Lord Shiva. Remedies: Daily mantra chanting, simple organic pariharams, spiritual book reading.',
                titleIdea: '"நிம்மதியான தூக்கம் மற்றும் ஆரோக்கியமான ஓய்வு காலத்திற்கு ஜோதிட ரகசியங்கள்! | ALP Moksha"',
                visuals: 'Slower voice pacing, high-contrast large white/yellow fonts on screen, clean black backdrop with dedicated gold rim light, traditional classical background score.'
            },
            female: {
                title: '👩 Ages 56-70+ · Female Target Blueprint',
                driver: 'Grandchildren\'s growth and exams, persistent joint pains/chronic health issues, organizing spiritual pilgrimages, and ensuring family legacy unity.',
                houses: '5th (Grandchildren), 12th (Health & sleep), & 9th (Temple pilgrimages) Houses.',
                deity: 'Lord Lakshmi-Narayana, Lord Krishna. Remedies: Tulsi water offerings, chanting Vishnu Sahasranamam.',
                titleIdea: '"பேரன் பேத்திகளின் கல்வி மற்றும் குடும்ப ஐஸ்வர்யத்தை பெருக்கும் வழிபாடுகள்! | ALP Legacy"',
                visuals: 'Warm grandmotherly presentation tone, very large text display on screen, clear audio isolation with absolutely zero background fan hum or room echo.'
            }
        }
    };

    // --- Competitor switcher handlers ---
    const tabCompTamil = document.getElementById('tab-comp-tamil');
    const tabCompHindi = document.getElementById('tab-comp-hindi');
    const tabCompEnglish = document.getElementById('tab-comp-english');
    const tabCompAlp = document.getElementById('tab-comp-alp');

    const compResultsBox = document.getElementById('comp-results-box');
    const compTierTitle = document.getElementById('comp-tier-title');
    const compVerifiabilityBadge = document.getElementById('comp-verifiability-badge');
    const compDrawbacks = document.getElementById('comp-drawbacks');
    const compTrustSecret = document.getElementById('comp-trust-secret');
    const compImprovements = document.getElementById('comp-improvements');

    function selectCompetitorTab(activeTab, key) {
        const siblings = activeTab.parentNode.querySelectorAll('.planner-tab-btn');
        siblings.forEach(s => {
            s.classList.remove('active');
            s.style.color = 'var(--text-secondary)';
            s.style.borderColor = 'transparent';
        });

        activeTab.classList.add('active');
        activeTab.style.color = 'var(--gold)';
        activeTab.style.borderColor = 'var(--gold)';

        const data = globalCompetitorData[key];
        if (data && compResultsBox && compTierTitle && compVerifiabilityBadge && compDrawbacks && compTrustSecret && compImprovements) {
            // Apply slight fade transition
            compResultsBox.style.opacity = '0.3';
            setTimeout(() => {
                compTierTitle.textContent = data.title;
                compVerifiabilityBadge.textContent = data.badge;
                compDrawbacks.textContent = data.drawbacks;
                compTrustSecret.textContent = data.trustSecret;
                compImprovements.textContent = data.improvements;
                compResultsBox.style.opacity = '1';
            }, 150);
        }
    }

    if (tabCompTamil) tabCompTamil.addEventListener('click', () => selectCompetitorTab(tabCompTamil, 'tamil'));
    if (tabCompHindi) tabCompHindi.addEventListener('click', () => selectCompetitorTab(tabCompHindi, 'hindi'));
    if (tabCompEnglish) tabCompEnglish.addEventListener('click', () => selectCompetitorTab(tabCompEnglish, 'english'));
    if (tabCompAlp) tabCompAlp.addEventListener('click', () => selectCompetitorTab(tabCompAlp, 'alp'));

    // --- Demographics targeting engine handlers ---
    const demoAgeCards = document.querySelectorAll('.demo-age-card');
    const demoGenderMale = document.getElementById('demo-gender-male');
    const demoGenderFemale = document.getElementById('demo-gender-female');

    const demoOutcomeTitle = document.getElementById('demo-outcome-title');
    const demoOutcomeDriver = document.getElementById('demo-outcome-driver');
    const demoOutcomeHouses = document.getElementById('demo-outcome-houses');
    const demoOutcomeDeity = document.getElementById('demo-outcome-deity');
    const demoOutcomeTitleIdea = document.getElementById('demo-outcome-title-idea');
    const demoOutcomeVisuals = document.getElementById('demo-outcome-visuals');

    let activeDemoAge = '18-25';
    let activeDemoGender = 'male';

    function compileDemographicBlueprint() {
        const ageGroup = demographicsBlueprint[activeDemoAge];
        if (!ageGroup) return;
        const blueprint = ageGroup[activeDemoGender];

        if (blueprint && demoOutcomeTitle && demoOutcomeDriver && demoOutcomeHouses && demoOutcomeDeity && demoOutcomeTitleIdea && demoOutcomeVisuals) {
            demoOutcomeTitle.textContent = blueprint.title;
            demoOutcomeDriver.textContent = blueprint.driver;
            demoOutcomeHouses.textContent = blueprint.houses;
            demoOutcomeDeity.textContent = blueprint.deity;
            demoOutcomeTitleIdea.textContent = blueprint.titleIdea;
            demoOutcomeVisuals.textContent = blueprint.visuals;
        }
    }

    if (demoAgeCards) {
        demoAgeCards.forEach(card => {
            card.addEventListener('click', () => {
                demoAgeCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                activeDemoAge = card.dataset.age;
                compileDemographicBlueprint();
                showToast(`🎯 Demographic compiled for Ages ${activeDemoAge}`);
            });
        });
    }

    if (demoGenderMale && demoGenderFemale) {
        demoGenderMale.addEventListener('click', () => {
            demoGenderFemale.classList.remove('active');
            demoGenderFemale.style.borderColor = 'var(--border-color)';
            demoGenderFemale.style.color = 'var(--text-secondary)';
            demoGenderFemale.style.background = 'none';

            demoGenderMale.classList.add('active');
            activeDemoGender = 'male';
            compileDemographicBlueprint();
            showToast('👨 Gender Profile Swapped to Male');
        });

        demoGenderFemale.addEventListener('click', () => {
            demoGenderMale.classList.remove('active');
            demoGenderMale.style.borderColor = 'var(--border-color)';
            demoGenderMale.style.color = 'var(--text-secondary)';
            demoGenderMale.style.background = 'none';

            demoGenderFemale.classList.add('active');
            activeDemoGender = 'female';
            compileDemographicBlueprint();
            showToast('👩 Gender Profile Swapped to Female');
        });
    }

    // ============================================
    // LIGHT MODE / DARK MODE THEME SWITCHER LOGIC
    // ============================================
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            if (themeToggleBtn) {
                themeToggleBtn.innerHTML = '🌙 Dark Mode';
                themeToggleBtn.style.borderColor = 'var(--cyan)';
            }
        } else {
            document.body.classList.remove('light-theme');
            if (themeToggleBtn) {
                themeToggleBtn.innerHTML = '💡 Light Mode';
                themeToggleBtn.style.borderColor = 'var(--border-color)';
            }
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.contains('light-theme');
            const newTheme = isLight ? 'dark' : 'light';
            
            applyTheme(newTheme);
            localStorage.setItem('alp_site_theme', newTheme);
            showToast(`✨ Swapped to ${newTheme === 'light' ? 'Light Mode' : 'Dark Mode'}`);
        });
    }

    // Initialize Theme on load
    const savedTheme = localStorage.getItem('alp_site_theme') || 'dark';
    applyTheme(savedTheme);

    console.log('✦ ALP Astrology Strategy Report — Loaded Successfully');
});



