// ===== LOADING SCREEN =====
window.addEventListener('load', () => {
    const loadingScreen = document.querySelector('.loading-screen');
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 1500);
});

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.stat-number');
const speed = 200;

const animateCounter = (counter) => {
    const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText.replace(/[^0-9]/g, '');
        const increment = target / speed;
        
        if (count < target) {
            counter.innerText = Math.ceil(count + increment);
            setTimeout(updateCount, 15);
        } else {
            counter.innerText = target;
        }
    };
    updateCount();
};

// Intersection Observer untuk counter
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => {
    counterObserver.observe(counter);
});

// ===== PRICING TOGGLE =====
const pricingSwitch = document.getElementById('pricing-switch');
const monthlyAmounts = document.querySelectorAll('.amount.monthly');
const yearlyAmounts = document.querySelectorAll('.amount.yearly');
const periods = document.querySelectorAll('.period');

pricingSwitch.addEventListener('change', () => {
    if (pricingSwitch.checked) {
        monthlyAmounts.forEach(amount => amount.style.display = 'none');
        yearlyAmounts.forEach(amount => amount.style.display = 'inline');
        periods.forEach(period => period.innerText = '/tahun');
    } else {
        monthlyAmounts.forEach(amount => amount.style.display = 'inline');
        yearlyAmounts.forEach(amount => amount.style.display = 'none');
        periods.forEach(period => period.innerText = '/bulan');
    }
});

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    // Here you would typically send to your backend
    console.log('Form submitted:', { name, email, subject, message });
    
    // Show success message
    alert('Terima kasih! Pesan Anda telah kami terima.');
    contactForm.reset();
});

// ===== PARTICLES ANIMATION =====
const particlesContainer = document.getElementById('particles');
const particleCount = 50;

for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    const size = Math.random() * 5 + 2;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(99, 102, 241, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        left: ${posX}%;
        top: ${posY}%;
        animation: particleFloat ${duration}s linear ${delay}s infinite;
        pointer-events: none;
    `;
    
    particlesContainer.appendChild(particle);
}

// Add particle animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== SCROLL ANIMATIONS (AOS-like) =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translate(0)';
        }
    });
}, observerOptions);

// Observe elements with data-aos
document.querySelectorAll('[data-aos]').forEach(el => {
    const animation = el.getAttribute('data-aos');
    let transform = 'translateY(0)';
    
    if (animation.includes('fade-up')) {
        transform = 'translateY(50px)';
    } else if (animation.includes('fade-down')) {
        transform = 'translateY(-50px)';
    } else if (animation.includes('fade-left')) {
        transform = 'translateX(50px)';
    } else if (animation.includes('fade-right')) {
        transform = 'translateX(-50px)';
    } else if (animation.includes('zoom-in')) {
        transform = 'scale(0.9)';
    }
    
    el.style.opacity = '0';
    el.style.transform = transform;
    el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    
    animationObserver.observe(el);
});

// ===== HAMBURGER MENU =====
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close menu when clicking on a nav link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// ===== TYPING EFFECT FOR HERO (Optional) =====
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    const text = heroTitle.innerHTML;
    heroTitle.innerHTML = '';
    let i = 0;
    
    const typeWriter = () => {
        if (i < text.length) {
            heroTitle.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    };
    
    // Start typing after initial fade-in
    setTimeout(typeWriter, 1000);
}

// ===== PARALLAX EFFECT FOR ORBS =====
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    
    orbs.forEach((orb, index) => {
        const speed = 0.2 + (index * 0.1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ===== CARD HOVER EFFECT =====
const featureCards = document.querySelectorAll('.feature-card, .pricing-card');

featureCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Add glow effect CSS
const glowStyle = document.createElement('style');
glowStyle.textContent = `
    .feature-card::after,
    .pricing-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(99, 102, 241, 0.15) 0%,
            transparent 50%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }
    
    .feature-card:hover::after,
    .pricing-card:hover::after {
        opacity: 1;
    }
`;
document.head.appendChild(glowStyle);

console.log('🚀 UniPlay Reseller Website Loaded Successfully!');
