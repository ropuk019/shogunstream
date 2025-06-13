// Initialize search page
document.addEventListener('DOMContentLoaded', async () => {
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (!query) {
        window.location.href = '/';
        return;
    }
    
    // Display search query
    document.getElementById('searchQuery').textContent = query;
    
    // Perform search
    await performSearch(query);
    
    // Setup event listeners for filters
    setupSearchFilters();
});

// Perform anime search
async function performSearch(query, filters = {}) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    searchResults.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // Get all anime from Firebase
        const snapshot = await firebase.database().ref('anime').once('value');
        const allAnime = snapshot.val();
        
        if (!allAnime) {
            searchResults.innerHTML = '<p>No anime found</p>';
            return;
        }
        
        // Convert to array and filter
        let results = Object.values(allAnime);
        
        // Apply search query
        const lowerQuery = query.toLowerCase();
        results = results.filter(anime => 
            anime.title.toLowerCase().includes(lowerQuery) ||
            (anime.description && anime.description.toLowerCase().includes(lowerQuery)) ||
            (anime.genres && anime.genres.some(g => g.toLowerCase().includes(lowerQuery)))
        );
        
        // Apply filters
        if (filters.type && filters.type.length > 0) {
            results = results.filter(anime => 
                filters.type.includes(anime.type.toLowerCase())
            );
        }
        
        if (filters.rating && filters.rating.length > 0) {
            const minRatings = filters.rating.map(r => parseFloat(r));
            results = results.filter(anime => 
                minRatings.some(r => anime.rating >= r)
            );
        }
        
        // Apply sorting
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'rating':
                    results.sort((a, b) => b.rating - a.rating);
                    break;
                case 'newest':
                    results.sort((a, b) => b.year - a.year);
                    break;
                case 'oldest':
                    results.sort((a, b) => a.year - b.year);
                    break;
                case 'title':
                    results.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                default: // popularity
                    results.sort((a, b) => b.popularity - a.popularity);
            }
        }
        
        // Display results
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found</p>';
            return;
        }
        
        searchResults.innerHTML = results.map(anime => `
            <div class="search-result-item">
                <div class="result-image">
                    <img src="/assets/video-covers/${anime.id}.jpg" alt="${anime.title}">
                </div>
                <div class="result-info">
                    <h3><a href="/watch.html?id=${anime.id}">${anime.title}</a></h3>
                    <div class="result-meta">
                        <span>${anime.type}</span>
                        <span>${anime.year}</span>
                        <span class="rating"><i class="fas fa-star"></i> ${anime.rating}</span>
                    </div>
                    <p class="result-description">${anime.description || 'No description available'}</p>
                    <div class="result-genres">
                        ${anime.genres?.map(g => `<span class="genre-tag">${g}</span>`).join('') || ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Update pagination
        updatePagination(results.length);
    } catch (error) {
        console.error('Error performing search:', error);
        searchResults.innerHTML = '<p>Error performing search</p>';
    }
}

// Setup search filters
function setupSearchFilters() {
    const filterType = document.getElementById('filterType');
    const sortBy = document.getElementById('sortBy');
    
    if (filterType) {
        filterType.addEventListener('change', () => {
            applyFilters();
        });
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', () => {
            applyFilters();
        });
    }
}

// Apply current filters
function applyFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    const filters = {
        type: document.getElementById('filterType').value,
        sortBy: document.getElementById('sortBy').value
    };
    
    performSearch(query, filters);
}

// Update pagination
function updatePagination(totalResults) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const resultsPerPage = 10;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-container">';
    
    // Previous button
    paginationHTML += '<button class="pagination-btn" id="prevPage"><i class="fas fa-chevron-left"></i></button>';
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<button class="pagination-btn ${i === 1 ? 'active' : ''}">${i}</button>`;
    }
    
    // Next button
    paginationHTML += '<button class="pagination-btn" id="nextPage"><i class="fas fa-chevron-right"></i></button>';
    
    paginationHTML += '</div>';
    pagination.innerHTML = paginationHTML;
    
    // Setup pagination event listeners
    setupPaginationEvents();
}

// Setup pagination event listeners
function setupPaginationEvents() {
    const pageButtons = document.querySelectorAll('.pagination-btn:not(#prevPage):not(#nextPage)');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    let currentPage = 1;
    
    pageButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentPage = parseInt(button.textContent);
            updateActivePage(currentPage);
            // Here you would load the data for the selected page
        });
    });
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateActivePage(currentPage);
                // Load data for previous page
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const totalPages = pageButtons.length;
            if (currentPage < totalPages) {
                currentPage++;
                updateActivePage(currentPage);
                // Load data for next page
            }
        });
    }
}

// Update active page in pagination
function updateActivePage(newPage) {
    const pageButtons = document.querySelectorAll('.pagination-btn:not(#prevPage):not(#nextPage)');
    
    pageButtons.forEach(button => {
        button.classList.remove('active');
        if (parseInt(button.textContent) === newPage) {
            button.classList.add('active');
        }
    });
}