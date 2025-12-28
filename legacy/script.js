// ===== Coding Experience Counter =====
// Assuming started coding in January 2022 (based on education start in 2023)
const codingStartDate = new Date('2022-01-01T00:00:00');

function updateCodingCounter() {
    const now = new Date();
    const diff = now - codingStartDate;
    const years = diff / (1000 * 60 * 60 * 24 * 365.25);
    
    const counterElement = document.getElementById('coding-counter');
    if (counterElement) {
        counterElement.textContent = years.toFixed(10);
    }
}

// Update counter immediately and then every 50ms for smooth animation
updateCodingCounter();
setInterval(updateCodingCounter, 50);

// ===== Theme Toggle =====
const themeToggle = document.getElementById('theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Get saved theme or default to dark
function getTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }
    return 'dark'; // Default to dark theme
}

// Apply theme
function setTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
}

// Initialize theme
setTheme(getTheme());

// Toggle theme on click
themeToggle.addEventListener('click', () => {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

// ===== Newsletter Form =====
const newsletterForm = document.getElementById('newsletter-form');

newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    
    // Show success feedback
    const button = e.target.querySelector('button');
    const originalText = button.textContent;
    
    button.textContent = 'subscribed! ✓';
    button.style.background = '#22c55e';
    
    // Reset after 2 seconds
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
        e.target.reset();
    }, 2000);
    
    // Here you would typically send the email to your backend
    console.log('Newsletter subscription:', email);
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// ===== Add Animation on Scroll =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate sections on scroll
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Also animate work cards
document.querySelectorAll('.work-card, .award-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// ===== Dock Tooltip Enhancement =====
document.querySelectorAll('.dock-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px) scale(1.1)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

// ===== Console Easter Egg =====
console.log(`
%c👋 Hey there, fellow developer!
%c
Looking at my code? Feel free to reach out!
📧 adityamedhane.dev@gmail.com
🐦 @adityaamedhane

Built with 💜 using vanilla HTML, CSS & JS
`, 
'color: #3b82f6; font-size: 20px; font-weight: bold;',
'color: #a1a1aa; font-size: 14px;'
);
