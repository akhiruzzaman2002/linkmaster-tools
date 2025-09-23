// LinkMaster - Main JavaScript File
class LinkMaster {
    constructor() {
        this.links = JSON.parse(localStorage.getItem('linkmaster_links')) || [];
        this.currentTheme = localStorage.getItem('linkmaster_theme') || 'light';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.displayStats();
        this.hideLoadingScreen();
        this.checkPWA();
    }

    setupEventListeners() {
        // URL শর্টেনার ইভেন্ট
        const shortenBtn = document.getElementById('shortenBtn');
        const longUrlInput = document.getElementById('longUrl');
        
        if (shortenBtn) {
            shortenBtn.addEventListener('click', () => this.shortenUrl());
        }
        
        if (longUrlInput) {
            longUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.shortenUrl();
            });
        }

        // কপি বাটন ইভেন্ট
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        // QR বাটন ইভেন্ট
        const qrBtn = document.getElementById('qrBtn');
        if (qrBtn) {
            qrBtn.addEventListener('click', () => this.generateQR());
        }

        // শেয়ার বাটন ইভেন্ট
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareUrl());
        }

        // সেভ বাটন ইভেন্ট
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveLink());
        }

        // থিম টগল বাটন
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // স্মুথ স্ক্রোলিং for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    shortenUrl() {
        const longUrlInput = document.getElementById('longUrl');
        const longUrl = longUrlInput.value.trim();
        
        if (!this.isValidUrl(longUrl)) {
            this.showNotification('দয়া করে একটি বৈধ URL দিন', 'error');
            return;
        }

        this.showLoadingState();
        
        // সিমুলেট API কল (২ সেকেন্ড ডিলে)
        setTimeout(() => {
            const shortUrl = this.generateShortUrl();
            this.displayShortUrl(shortUrl);
            this.hideLoadingState();
            this.showNotification('লিংক সফলভাবে শর্টেন করা হয়েছে!', 'success');
            
            // অটো সেভ
            this.saveLink();
        }, 2000);
    }

    isValidUrl(url) {
        try {
            // সহজ URL ভ্যালিডেশন
            if (!url) return false;
            if (!url.includes('.') || url.length < 5) return false;
            
            // প্রোটোকল যোগ করুন যদি না থাকে
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
                document.getElementById('longUrl').value = url;
            }
            
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    generateShortUrl() {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let slug = '';
        for (let i = 0; i < 6; i++) {
            slug += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return `https://lnkmstr.com/${slug}`;
    }

    displayShortUrl(shortUrl) {
        const resultBox = document.getElementById('shortUrlResult');
        const shortUrlElement = document.getElementById('shortUrl');
        
        if (resultBox && shortUrlElement) {
            shortUrlElement.textContent = shortUrl;
            resultBox.style.display = 'block';
            resultBox.classList.add('show');
            
            // অটো স্ক্রোল to result
            setTimeout(() => {
                resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    copyToClipboard() {
        const shortUrl = document.getElementById('shortUrl');
        if (!shortUrl) return;
        
        const urlText = shortUrl.textContent;
        const copyBtn = document.getElementById('copyBtn');
        
        navigator.clipboard.writeText(urlText).then(() => {
            // বাটন স্টাইল পরিবর্তন
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'কপি হয়েছে!';
            copyBtn.style.background = '#10b981';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
            
            this.showNotification('লিংক ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
        }).catch(err => {
            this.showNotification('কপি করতে সমস্যা হয়েছে', 'error');
            console.error('Copy failed:', err);
        });
    }

    generateQR() {
        const shortUrl = document.getElementById('shortUrl');
        if (!shortUrl) {
            this.showNotification('প্রথমে একটি লিংক তৈরি করুন', 'error');
            return;
        }
        
        const urlText = shortUrl.textContent;
        this.showNotification('QR কোড তৈরি হচ্ছে...', 'info');
        
        // QR জেনারেশন সিমুলেশন
        setTimeout(() => {
            // QR জেনারেটর পেজে redirect
            window.open(`tools/qr-generator.html?url=${encodeURIComponent(urlText)}`, '_blank');
            this.showNotification('QR কোড সফলভাবে তৈরি হয়েছে!', 'success');
        }, 1000);
    }

    shareUrl() {
        const shortUrl = document.getElementById('shortUrl');
        if (!shortUrl) {
            this.showNotification('প্রথমে একটি লিংক তৈরি করুন', 'error');
            return;
        }
        
        const urlText = shortUrl.textContent;
        
        if (navigator.share) {
            // Web Share API সাপোর্ট করলে
            navigator.share({
                title: 'LinkMaster শর্টেন্ড লিংক',
                text: 'এই লিংকটি দেখুন:',
                url: urlText
            }).then(() => {
                this.showNotification('লিংক সফলভাবে শেয়ার করা হয়েছে!', 'success');
            }).catch(err => {
                console.error('Share failed:', err);
                this.fallbackShare(urlText);
            });
        } else {
            // Fallback: কপি টু ক্লিপবোর্ড
            this.fallbackShare(urlText);
        }
    }

    fallbackShare(url) {
        this.copyToClipboard();
        this.showNotification('লিংক কপি করা হয়েছে! শেয়ার করতে পেস্ট করুন।', 'info');
    }

    saveLink() {
        const shortUrl = document.getElementById('shortUrl');
        const longUrl = document.getElementById('longUrl');
        
        if (!shortUrl || !longUrl) return;
        
        const urlText = shortUrl.textContent;
        const longUrlText = longUrl.value;
        
        if (!urlText || urlText === 'https://lnkmstr.com/abc123') {
            this.showNotification('প্রথমে একটি লিংক তৈরি করুন', 'error');
            return;
        }

        const link = {
            id: Date.now(),
            longUrl: longUrlText,
            shortUrl: urlText,
            clicks: 0,
            createdAt: new Date().toLocaleString('bn-BD'),
            title: this.extractTitleFromUrl(longUrlText)
        };

        // ডুপ্লিকেট চেক
        const existingIndex = this.links.findIndex(l => l.shortUrl === urlText);
        if (existingIndex !== -1) {
            this.links[existingIndex] = link;
        } else {
            this.links.unshift(link); // নতুন লিংক প্রথমে যোগ করুন
        }
        
        localStorage.setItem('linkmaster_links', JSON.stringify(this.links));
        
        this.updateStats();
        this.showNotification('লিংক সফলভাবে সেভ করা হয়েছে!', 'success');
    }

    extractTitleFromUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '').replace('.com', '').replace('.org', '');
        } catch {
            return 'অজানা সাইট';
        }
    }

    displayStats() {
        const totalLinks = this.links.length;
        const totalClicks = this.links.reduce((sum, link) => sum + link.clicks, 0);
        
        const totalLinksElement = document.getElementById('totalLinks');
        const totalClicksElement = document.getElementById('totalClicks');
        
        if (totalLinksElement) {
            totalLinksElement.textContent = totalLinks.toLocaleString('bn-BD');
        }
        if (totalClicksElement) {
            totalClicksElement.textContent = totalClicks.toLocaleString('bn-BD');
        }
    }

    updateStats() {
        this.displayStats();
    }

    showLoadingState() {
        const button = document.getElementById('shortenBtn');
        if (button) {
            button.textContent = 'শর্টেন হচ্ছে...';
            button.disabled = true;
        }
    }

    hideLoadingState() {
        const button = document.getElementById('shortenBtn');
        if (button) {
            button.textContent = 'শর্টেন করুন';
            button.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // একটি সিম্পল নোটিফিকেশন সিস্টেম তৈরি করুন
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // ৩ সেকেন্ড পর নোটিফিকেশন অটো রিমুভ
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);

        // CSS animation যোগ করুন
        this.addNotificationStyles();
    }

    addNotificationStyles() {
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
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

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('linkmaster_theme', this.currentTheme);
        
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
            themeBtn.style.background = this.currentTheme === 'light' ? '#f8fafc' : '#374151';
            themeBtn.style.color = this.currentTheme === 'light' ? '#1f2937' : '#f9fafb';
        }
    }

    loadTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
            themeBtn.style.background = this.currentTheme === 'light' ? '#f8fafc' : '#374151';
            themeBtn.style.color = this.currentTheme === 'light' ? '#1f2937' : '#f9fafb';
        }
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
        }, 1500);
    }

    checkPWA() {
        // PWA ইনস্টলেশন প্রম্পট চেক করুন
        if ('serviceWorker' in navigator) {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                console.log('PWA installation available');
            });
        }
    }
}

// গ্লোবাল ফাংশনস
function openTool(toolName) {
    const toolUrls = {
        'url-shortener': 'tools/url-shortener.html',
        'qr-generator': 'tools/qr-generator.html',
        'bio-links': 'tools/bio-links.html',
        'link-tracking': 'tools/link-tracking.html'
    };
    
    const url = toolUrls[toolName];
    if (url) {
        window.location.href = url;
    } else {
        alert('টুলটি শীঘ্রই আসছে!');
    }
}

// অ্যাপ্লিকেশন শুরু করুন
document.addEventListener('DOMContentLoaded', function() {
    window.linkMaster = new LinkMaster();
    
    // কীবোর্ড শর্টকাট
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            const urlInput = document.getElementById('longUrl');
            if (urlInput) {
                urlInput.focus();
            }
        }
    });

    // অফলাইন সাপোর্ট
    window.addEventListener('online', () => {
        if (window.linkMaster) {
            window.linkMaster.showNotification('ইন্টারনেট কানেকশন পুনরুদ্ধার করা হয়েছে', 'success');
        }
    });

    window.addEventListener('offline', () => {
        if (window.linkMaster) {
            window.linkMaster.showNotification('আপনি অফলাইনে আছেন', 'warning');
        }
    });

    console.log('LinkMaster loaded successfully! 🚀');
});
