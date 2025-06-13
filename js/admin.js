// Admin functionality
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initAnimeForm();
});

function checkAdminAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        
        user.getIdTokenResult().then((idTokenResult) => {
            if (!idTokenResult.claims.admin) {
                window.location.href = '/';
            }
        });
    });
}

function initAnimeForm() {
    const form = document.getElementById('animeForm');
    const generateDescBtn = document.getElementById('generateDescBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (generateDescBtn) {
        generateDescBtn.addEventListener('click', generateDescription);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = '/admin.html';
        });
    }
    
    if (form) {
        form.addEventListener('submit', handleAnimeSubmit);
    }
}

async function generateDescription() {
    const title = document.getElementById('title').value;
    if (!title) {
        alert('Please enter a title first');
        return;
    }
    
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": "Bearer YOUR_OPENROUTER_API_KEY",
                "HTTP-Referer": window.location.href,
                "X-Title": "AnimeStream Admin",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-r1-0528-qwen3-8b:free",
                "messages": [
                    {
                        "role": "user",
                        "content": `Generate a compelling anime description for "${title}" in 2-3 paragraphs.`
                    }
                ]
            })
        });
        
        const data = await response.json();
        if (data.choices && data.choices[0].message.content) {
            document.getElementById('description').value = data.choices[0].message.content;
        }
    } catch (error) {
        console.error('Error generating description:', error);
        alert('Failed to generate description');
    }
}

async function handleAnimeSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const animeId = form.dataset.animeId || generateId(form.title.value);
    const episodes = [];
    
    const episodeCount = parseInt(form.episodeCount.value);
    for (let i = 1; i <= episodeCount; i++) {
        episodes.push({
            number: i,
            title: `Episode ${i}`,
            duration: "23m",
            videoUrl: form[`episode${i}Url`].value,
            thumbnail: form[`episode${i}Thumb`].value || ''
        });
    }
    
    const animeData = {
        id: animeId,
        title: form.title.value,
        type: form.type.value,
        rating: parseFloat(form.rating.value) || 0,
        description: form.description.value,
        genres: form.genres.value.split(',').map(g => g.trim()),
        year: parseInt(form.year.value) || new Date().getFullYear(),
        status: form.status.value,
        imageUrl: form.imageUrl.value,
        episodes: episodes,
        isFeatured: form.isFeatured.checked,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        await firebase.database().ref(`anime/${animeId}`).set(animeData);
        alert('Anime saved successfully!');
        window.location.href = '/admin.html';
    } catch (error) {
        console.error('Error saving anime:', error);
        alert('Failed to save anime');
    }
}

function generateId(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Render episode URL inputs based on count
function setupEpisodeInputs() {
    const countInput = document.getElementById('episodeCount');
    const episodeContainer = document.getElementById('episodeInputs');
    
    countInput.addEventListener('change', () => {
        const count = parseInt(countInput.value);
        episodeContainer.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            episodeContainer.innerHTML += `
                <div class="episode-input-group">
                    <h4>Episode ${i}</h4>
                    <div class="form-group">
                        <label>Video URL</label>
                        <input type="text" name="episode${i}Url" required placeholder="https://example.com/embed/...">
                    </div>
                    <div class="form-group">
                        <label>Thumbnail URL (optional)</label>
                        <input type="text" name="episode${i}Thumb" placeholder="https://example.com/thumb.jpg">
                    </div>
                </div>
            `;
        }
    });
}