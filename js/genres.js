// List of anime genres
const animeGenres = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
    "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports",
    "Supernatural", "Thriller", "Psychological", "Mecha", "Historical",
    "Military", "Music", "School", "Shounen", "Shoujo", "Seinen", "Josei"
];

// Initialize genres page
document.addEventListener('DOMContentLoaded', async () => {
    // Load all genres
    loadAllGenres();
    
    // Check if a genre is selected from URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedGenre = urlParams.get('genre');
    
    if (selectedGenre) {
        await loadAnimeByGenre(selectedGenre);
    }
});

// Load all genres
function loadAllGenres() {
    const genreGrid = document.getElementById('genreGrid');
    if (!genreGrid) return;
    
    genreGrid.innerHTML = animeGenres.map(genre => `
        <div class="genre-card" onclick="window.location.href='/genre.html?genre=${encodeURIComponent(genre)}'">
            <div class="genre-icon">
                <i class="fas fa-${getGenreIcon(genre)}"></i>
            </div>
            <h3>${genre}</h3>
        </div>
    `).join('');
}

// Get appropriate icon for genre
function getGenreIcon(genre) {
    const icons = {
        "Action": "fist-raised",
        "Adventure": "map-marked-alt",
        "Comedy": "laugh-squint",
        "Drama": "theater-masks",
        "Fantasy": "dragon",
        "Horror": "skull",
        "Mystery": "search",
        "Romance": "heart",
        "Sci-Fi": "robot",
        "Slice of Life": "home",
        "Sports": "running",
        "Supernatural": "ghost",
        "Thriller": "exclamation-triangle",
        "Psychological": "brain",
        "Mecha": "robot",
        "Historical": "landmark",
        "Military": "fighter-jet",
        "Music": "music",
        "School": "graduation-cap",
        "Shounen": "male",
        "Shoujo": "female",
        "Seinen": "user-ninja",
        "Josei": "user-astronaut"
    };
    
    return icons[genre] || "tag";
}

// Load anime by selected genre
async function loadAnimeByGenre(genre) {
    const animeByGenre = document.getElementById('animeByGenre');
    if (!animeByGenre) return;
    
    animeByGenre.innerHTML = `
        <h2>${genre} Anime</h2>
        <div class="anime-grid" id="genreAnimeGrid">
            <div class="loading-spinner"></div>
        </div>
    `;
    
    try {
        // Get all anime from Firebase
        const snapshot = await firebase.database().ref('anime').once('value');
        const allAnime = snapshot.val();
        
        if (!allAnime) {
            document.getElementById('genreAnimeGrid').innerHTML = '<p>No anime found in this genre</p>';
            return;
        }
        
        // Filter anime by genre
        const filteredAnime = Object.values(allAnime).filter(anime => 
            anime.genres && anime.genres.includes(genre)
        );
        
        if (filteredAnime.length === 0) {
            document.getElementById('genreAnimeGrid').innerHTML = '<p>No anime found in this genre</p>';
            return;
        }
        
        // Display filtered anime
        document.getElementById('genreAnimeGrid').innerHTML = filteredAnime.map(anime => `
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
    } catch (error) {
        console.error('Error loading anime by genre:', error);
        document.getElementById('genreAnimeGrid').innerHTML = '<p>Error loading anime</p>';
    }
}