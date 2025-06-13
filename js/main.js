// Initialize main functionality
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    initSearch();
    initNavigation();
    initTheme();
    
    // Page-specific initializations
    if (document.getElementById('featuredAnime')) {
        loadFeaturedAnime();
    }
    
    if (document.getElementById('exploreAnimeGrid')) {
        loadExploreAnime();
    }
});

// Check user authentication state
function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const profileBtn = document.getElementById('profileBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminBtn = document.getElementById('adminBtn');
        
        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            
            // Check if user is admin
            user.getIdTokenResult().then((idTokenResult) => {
                if (idTokenResult.claims.admin) {
                    if (adminBtn) adminBtn.style.display = 'inline-block';
                }
            });
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
            if (profileBtn) profileBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
        }
    });
}


// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
            }
        });
    }
}

// Perform search and redirect to search page
function performSearch(query) {
    if (!query || query.trim() === '') return;
    
    window.location.href = `/search.html?q=${encodeURIComponent(query.trim())}`;
}

// Initialize navigation
function initNavigation() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = '/';
            }).catch((error) => {
                console.error('Logout error:', error);
            });
        });
    }
    
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
}

// Initialize theme (dark/light mode)
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.add(savedTheme);
    themeToggle.checked = savedTheme === 'light';
    
    // Listen for toggle changes
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.remove('dark');
            document.body.classList.add('light');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light');
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// Load featured anime
async function loadFeaturedAnime() {
    try {
        const snapshot = await firebase.database().ref('anime').orderByChild('isFeatured').equalTo(true).limitToFirst(8).once('value');
        const featuredAnime = snapshot.val();
        
        if (!featuredAnime) {
            document.getElementById('featuredAnime').innerHTML = '<p>No featured anime found</p>';
            return;
        }
        
        displayAnimeGrid('featuredAnime', Object.values(featuredAnime));
    } catch (error) {
        console.error('Error loading featured anime:', error);
    }
}

// Load anime for explore page
async function loadExploreAnime() {
    try {
        const snapshot = await firebase.database().ref('anime').once('value');
        const allAnime = snapshot.val();
        
        if (!allAnime) {
            document.getElementById('exploreAnimeGrid').innerHTML = '<p>No anime found</p>';
            return;
        }
        
        displayAnimeGrid('exploreAnimeGrid', Object.values(allAnime));
    } catch (error) {
        console.error('Error loading explore anime:', error);
    }
}

function displayAnimeGrid(elementId, animeList) {
    const grid = document.getElementById(elementId);
    if (!grid) return;
    
    grid.innerHTML = animeList.map(anime => `
        <div class="anime-card" onclick="window.location.href='/watch.html?id=${anime.id}'">
            <img src="${anime.imageUrl || 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${anime.title}">
            <div class="anime-info">
                <div class="anime-title">${anime.title}</div>
                <div class="anime-meta">
                    <span>${anime.type}</span>
                    <span class="anime-rating"><i class="fas fa-star"></i> ${anime.rating || 'N/A'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Track watch time (to be called periodically while watching)
function trackWatchTime(animeId, episodeNumber, secondsWatched) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const watchData = {
        animeId,
        episodeNumber,
        secondsWatched,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    firebase.database().ref(`users/${user.uid}/watchTime`).push(watchData);
}

// Add to watchlist
async function addToWatchlist(animeId) {
    const user = firebase.auth().currentUser;
    if (!user) return false;
    
    try {
        await firebase.database().ref(`users/${user.uid}/watchlist/${animeId}`).set(true);
        return true;
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return false;
    }
}

// Remove from watchlist
async function removeFromWatchlist(animeId) {
    const user = firebase.auth().currentUser;
    if (!user) return false;
    
    try {
        await firebase.database().ref(`users/${user.uid}/watchlist/${animeId}`).remove();
        return true;
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return false;
    }
}

// Check if anime is in watchlist
async function isInWatchlist(animeId) {
    const user = firebase.auth().currentUser;
    if (!user) return false;
    
    try {
        const snapshot = await firebase.database().ref(`users/${user.uid}/watchlist/${animeId}`).once('value');
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking watchlist:', error);
        return false;
    }
}