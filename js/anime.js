// Sample anime data structure
const animeDatabase = {
    "demon-slayer": {
        id: "demon-slayer",
        title: "Demon Slayer: Kimetsu no Yaiba",
        type: "TV Series",
        rating: 9.2,
        description: "Tanjiro Kamado, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself.",
        genres: ["Action", "Adventure", "Fantasy"],
        year: 2019,
        status: "Completed",
        episodes: [
            {
                number: 1,
                title: "Cruelty",
                duration: "23m",
                megaUrl: "https://mega.nz/embed/YOUR_MEGA_LINK_1",
                thumbnail: "/images/thumbnails/demon-slayer-1.jpg"
            },
            // More episodes...
        ]
    },
    // More anime...
};

// Get anime data
async function getAnimeData(animeId) {
    try {
        // First try to fetch from Firebase
        const snapshot = await firebase.database().ref('anime/' + animeId).once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
        
        // Fallback to local data
        return animeDatabase[animeId] || null;
    } catch (error) {
        console.error('Error fetching anime data:', error);
        return animeDatabase[animeId] || null;
    }
}

// Get all anime (for explore page)
async function getAllAnime() {
    try {
        // First try to fetch from Firebase
        const snapshot = await firebase.database().ref('anime').once('value');
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        }
        
        // Fallback to local data
        return Object.values(animeDatabase);
    } catch (error) {
        console.error('Error fetching all anime:', error);
        return Object.values(animeDatabase);
    }
}

// Track watch history
async function trackWatchHistory(animeId, episodeNumber) {
    const user = auth.currentUser;
    if (!user) return;

    const anime = await getAnimeData(animeId);
    if (!anime) return;

    const timestamp = firebase.database.ServerValue.TIMESTAMP;
    
    try {
        await firebase.database().ref(`users/${user.uid}/watchHistory/${animeId}`).set({
            lastWatched: timestamp,
            lastEpisode: episodeNumber,
            animeTitle: anime.title,
            animeImage: `/assets/video-covers/${animeId}.jpg`
        });
    } catch (error) {
        console.error('Error tracking watch history:', error);
    }
}

// Get watch history
async function getWatchHistory() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const snapshot = await firebase.database().ref(`users/${user.uid}/watchHistory`).once('value');
        if (snapshot.exists()) {
            return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching watch history:', error);
        return [];
    }
}

// Search anime
async function searchAnime(query) {
    const allAnime = await getAllAnime();
    const lowerQuery = query.toLowerCase();
    
    return allAnime.filter(anime => 
        anime.title.toLowerCase().includes(lowerQuery) ||
        anime.description.toLowerCase().includes(lowerQuery) ||
        anime.genres.some(genre => genre.toLowerCase().includes(lowerQuery))
    );
}

// Get anime by genre
async function getAnimeByGenre(genre) {
    const allAnime = await getAllAnime();
    return allAnime.filter(anime => 
        anime.genres.some(g => g.toLowerCase() === genre.toLowerCase())
    );
}

// Initialize featured anime on home page
async function initFeaturedAnime() {
    const featuredContainer = document.getElementById('featuredAnime');
    if (!featuredContainer) return;

    const allAnime = await getAllAnime();
    const featured = allAnime.slice(0, 8); // Get first 8 as featured
    
    featuredContainer.innerHTML = featured.map(anime => `
        <div class="anime-card" onclick="window.location.href='/watch.html?id=${anime.id}'">
            <img src="/assets/video-covers/${anime.id}.jpg" alt="${anime.title}">
            <div class="anime-info">
                <div class="anime-title">${anime.title}</div>
                <div class="anime-meta">
                    <span>${anime.type}</span>
                    <span class="anime-rating"><i class="fas fa-star"></i> ${anime.rating}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize latest anime on home page
async function initLatestAnime() {
    const latestContainer = document.getElementById('latestAnime');
    if (!latestContainer) return;

    const allAnime = await getAllAnime();
    const latest = [...allAnime].sort((a, b) => b.year - a.year).slice(0, 8);
    
    latestContainer.innerHTML = latest.map(anime => `
        <div class="anime-card" onclick="window.location.href='/watch.html?id=${anime.id}'">
            <img src="/assets/video-covers/${anime.id}.jpg" alt="${anime.title}">
            <div class="anime-info">
                <div class="anime-title">${anime.title}</div>
                <div class="anime-meta">
                    <span>${anime.type}</span>
                    <span class="anime-rating"><i class="fas fa-star"></i> ${anime.rating}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize anime-related functionality
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        initFeaturedAnime();
        initLatestAnime();
    }
});