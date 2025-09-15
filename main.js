// main.js - Version avec module corrigé
// ========================================
// CONFIGURATION ET INITIALISATION
// ========================================

console.log('🎭 Emoji Code mood - Version Module Corrigé v2.3');

// Variables globales
let supabase = null;
let moods = [];
let selectedEmoji = '';
let sessionStartTime = new Date();
let autoRefreshInterval = null;
let isConnected = false;
let realtimeChannel = null;

// Configuration auto-actualisation
const AUTO_REFRESH_INTERVAL = 30000; // 30 secondes
const CONNECTION_CHECK_INTERVAL = 10000; // 10 secondes

// ========================================
// INITIALISATION SUPABASE AVEC MODULE CORRIGÉ
// ========================================

async function initSupabase() {
    try {
        console.log('🔧 Initialisation Supabase via module corrigé...');
        
        // Import dynamique du module avec gestion d'erreur
        const { getSupabaseClient, checkSupabaseStatus } = await import('./supabaseClient.js');
        
        // Vérifier l'état avant d'essayer
        const status = checkSupabaseStatus();
        console.log('🔍 État Supabase:', status);
        
        // Initialisation du client via le module (avec attente intégrée)
        supabase = await getSupabaseClient();
        
        // Test de connexion avec la table "mood"
        console.log('🧪 Test de connexion à la table mood...');
        const { data, error } = await supabase.from('mood').select('count').limit(1);
        if (error) {
            throw new Error(`Erreur de connexion à la table 'mood': ${error.message}`);
        }
        
        console.log('🚀 Supabase connecté avec succès via module (table mood accessible)');
        console.log('📊 URL configurée:', window.PRIVATE_CONFIG?.supabaseUrl);
        
        isConnected = true;
        updateConnectionStatus(true);
        
        // Charger les données existantes
        await loadMoodsFromSupabase();
        
        // Configurer le temps réel
        setupRealtimeSubscription();
        
        // Démarrer l'auto-refresh
        startAutoRefresh();
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Supabase via module:', error);
        
        // Afficher l'erreur à l'utilisateur
        showConnectionError(error);
        
        isConnected = false;
        updateConnectionStatus(false);
        return false;
    }
}

function showConnectionError(error) {
    // Supprimer les erreurs précédentes
    const existingError = document.querySelector('.connection-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorContainer = document.createElement('div');
    errorContainer.className = 'connection-error';
    errorContainer.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ffebee;
        border: 2px solid #f44336;
        border-radius: 8px;
        padding: 20px;
        max-width: 600px;
        z-index: 10000;
        font-family: system-ui, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    errorContainer.innerHTML = `
        <div class="error-message">
            <h3 style="color: #d32f2f; margin: 0 0 10px 0;">❌ Erreur de connexion Supabase</h3>
            <p style="margin: 0 0 10px 0;"><strong>Détails :</strong> ${error.message}</p>
            
            <details style="margin: 10px 0;">
                <summary style="cursor: pointer; color: #1976d2;">🔍 Diagnostic détaillé</summary>
                <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
                    <strong>Configuration :</strong><br>
                    • URL Supabase : ${window.PRIVATE_CONFIG?.supabaseUrl || '❌ Manquant'}<br>
                    • Clé Supabase : ${window.PRIVATE_CONFIG?.supabaseAnonKey ? '✅ Présente' : '❌ Manquante'}<br>
                    • Bibliothèque : ${typeof window.supabase !== 'undefined' ? '✅ Chargée' : '❌ Non chargée'}<br>
                    • CreateClient : ${typeof window.supabase?.createClient === 'function' ? '✅ Disponible' : '❌ Indisponible'}
                </div>
            </details>
            
            <div class="error-actions" style="margin-top: 15px;">
                <button onclick="window.location.reload()" style="
                    background: #f44336; color: white; border: none; padding: 8px 16px; 
                    border-radius: 4px; cursor: pointer; margin-right: 10px;
                ">🔄 Recharger la page</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    background: #757575; color: white; border: none; padding: 8px 16px; 
                    border-radius: 4px; cursor: pointer;
                ">Fermer</button>
            </div>
        </div>
    `;
    
    document.body.insertBefore(errorContainer, document.body.firstChild);
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('modeIndicator');
    const icon = document.getElementById('modeIcon');
    const text = document.getElementById('modeText');
    
    if (indicator && icon && text) {
        if (connected) {
            indicator.style.background = '#e3f2fd';
            indicator.style.color = '#1976d2';
            icon.textContent = '⚡';
            text.textContent = 'Connecté via module - Synchronisation automatique';
        } else {
            indicator.style.background = '#ffebee';
            indicator.style.color = '#d32f2f';
            icon.textContent = '🔌';
            text.textContent = 'Erreur de connexion - Voir détails';
        }
    } else {
        // Fallback pour la console si les éléments n'existent pas
        console.log(connected ? '✅ Connecté via module' : '❌ Déconnecté');
    }
}

async function loadMoodsFromSupabase() {
    if (!supabase || !isConnected) {
        console.log('⏭️ Chargement ignoré - Supabase non connecté');
        return;
    }

    try {
        console.log('📥 Chargement des moods depuis Supabase...');
        
        const { data, error } = await supabase
            .from('mood')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            throw error;
        }

        moods = data || [];
        updateDisplay();
        console.log(`📊 ${moods.length} codes mood chargés automatiquement`);
        
        // Réactiver la connexion si elle était en erreur
        if (!isConnected) {
            isConnected = true;
            updateConnectionStatus(true);
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement Supabase:', error);
        isConnected = false;
        updateConnectionStatus(false);
        
        // Optionnel : essayer de se reconnecter
        setTimeout(() => {
            console.log('🔄 Tentative de reconnexion automatique...');
            initSupabase();
        }, 5000);
    }
}

function setupRealtimeSubscription() {
    if (!supabase) {
        console.log('⏭️ Temps réel ignoré - Supabase non connecté');
        return;
    }

    console.log('📡 Configuration du temps réel...');

    realtimeChannel = supabase
        .channel('mood_realtime')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'mood' },
            (payload) => {
                console.log('🔄 Changement temps réel:', payload.eventType);

                if (payload.eventType === 'INSERT') {
                    moods.unshift(payload.new);
                    updateDisplay();

                    // Animation d'arrivée
                    setTimeout(() => {
                        const newItem = document.querySelector('.mood-item');
                        if (newItem) {
                            newItem.style.animation = 'slideIn 0.5s ease, glow 2s ease';
                            setTimeout(() => {
                                newItem.style.animation = '';
                            }, 2500);
                        }
                    }, 100);
                } else if (payload.eventType === 'DELETE') {
                    loadMoodsFromSupabase();
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 Statut temps réel:', status);
            
            if (status === 'SUBSCRIBED') {
                console.log('✅ Temps réel activé avec succès');
                isConnected = true;
                updateConnectionStatus(true);
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Erreur du canal temps réel');
                isConnected = false;
                updateConnectionStatus(false);
            }
        });
}

function startAutoRefresh() {
    console.log('⏰ Démarrage de l\'auto-refresh...');
    
    // Actualisation automatique périodique
    autoRefreshInterval = setInterval(async () => {
        console.log('🔄 Actualisation automatique...');
        await loadMoodsFromSupabase();
    }, AUTO_REFRESH_INTERVAL);

    // Vérification de connexion périodique
    setInterval(async () => {
        if (!isConnected && supabase) {
            console.log('🔌 Tentative de reconnexion...');
            try {
                const { data, error } = await supabase.from('mood').select('count').limit(1);
                if (!error) {
                    isConnected = true;
                    updateConnectionStatus(true);
                    await loadMoodsFromSupabase();
                    console.log('✅ Reconnexion réussie');
                }
            } catch (error) {
                console.log('❌ Reconnexion échouée:', error.message);
            }
        }
    }, CONNECTION_CHECK_INTERVAL);
}

// ========================================
// GESTION DES ÉVÉNEMENTS UI
// ========================================

function setupEventListeners() {
    console.log('🔧 Initialisation des interactions utilisateur');

    // Boutons emoji
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedEmoji = btn.dataset.emoji;
            console.log('😊 Emoji sélectionné:', selectedEmoji);
        });
    });

    // Soumission formulaire
    const form = document.getElementById('moodForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitMood();
        });
        console.log('✅ Formulaire configuré');
    } else {
        console.warn('⚠️ Formulaire moodForm non trouvé');
    }

    // Raccourcis clavier pour enseignants
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            toggleAdminPanel();
        }
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportMoods();
        }
        if (e.ctrlKey && e.key === 'j') {
            e.preventDefault();
            exportMoodsJSON();
        }
    });

    console.log('✅ Event listeners configurés');
}

// ========================================
// GESTION DES moods
// ========================================

async function submitMood() {
    console.log('📝 Soumission d\'une nouvelle mood...');
    
    const nom = document.getElementById('studentName')?.value?.trim();
    const langagePrefere = document.getElementById('favoriteLanguage')?.value;
    const autrePreference = document.getElementById('otherPreference')?.value;
    const commentaire = document.getElementById('comment')?.value?.trim();
    const submitBtn = document.getElementById('submitBtn');

    // Empêcher double soumission
    if (submitBtn?.disabled) {
        console.log('⏭️ Soumission ignorée - bouton déjà désactivé');
        return;
    }
    
    // Validations
    if (!selectedEmoji) {
        alert('N\'oublie pas de choisir un emoji ! 😊');
        return;
    }

    if (!nom || nom.length < 2) {
        alert('Le prénom doit contenir au moins 2 caractères');
        return;
    }

    if (!langagePrefere) {
        alert('Choisis ton langage préféré !');
        return;
    }

    if (!autrePreference) {
        alert('Choisis ta préférence additionnelle !');
        return;
    }

    // Désactiver le formulaire
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🔄 Envoi en cours...';
    }

    const mood = {
        nom: nom,
        emoji: selectedEmoji,
        langage_prefere: langagePrefere,
        autre_preference: autrePreference,
        commentaire: commentaire || null
    };

    console.log('📤 Données à envoyer:', mood);

    const success = await addMood(mood);

    if (success) {
        resetForm();
        if (submitBtn) {
            submitBtn.textContent = '✅ Envoyé avec succès !';
            setTimeout(() => {
                submitBtn.textContent = '🚀 Partager mon mood';
                submitBtn.disabled = false;
            }, 2500);
        }
        console.log('✅ mood soumise avec succès');
    } else {
        if (submitBtn) {
            submitBtn.textContent = '❌ Erreur - Réessayer';
            setTimeout(() => {
                submitBtn.textContent = '🚀 Partager mon mood';
                submitBtn.disabled = false;
            }, 3000);
        }
        console.log('❌ Échec de la soumission');
    }
}

async function addMood(mood) {
    if (!supabase) {
        console.error('❌ Supabase non initialisé pour ajout mood');
        alert('Erreur : Connexion à la base de données non établie');
        return false;
    }

    try {
        console.log('🔍 Vérification anti-doublon...');
        
        // Anti-doublon 5 minutes
        const cinqMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: existing, error: selectError } = await supabase
            .from('mood')
            .select('*')
            .eq('nom', mood.nom)
            .eq('emoji', mood.emoji)
            .eq('langage_prefere', mood.langage_prefere)
            .eq('autre_preference', mood.autre_preference)
            .gte('created_at', cinqMinutesAgo)
            .limit(1);

        if (selectError) {
            throw selectError;
        }
        
        if (existing && existing.length > 0) {
            console.warn('⚠️ Doublon détecté');
            alert('Ce code mood a déjà été enregistré récemment. Attendez quelques minutes avant de renvoyer.');
            return false;
        }

        console.log('💾 Insertion en base de données...');
        const { error } = await supabase
            .from('mood')
            .insert([mood]);
            
        if (error) {
            throw error;
        }
        
        console.log('✅ mood ajoutée à Supabase avec succès');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur ajout Supabase:', error);
        alert(`Erreur lors de l'envoi: ${error.message}`);
        return false;
    }
}

function resetForm() {
    const form = document.getElementById('moodForm');
    if (form) {
        form.reset();
    }
    
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
    selectedEmoji = '';
    console.log('🔄 Formulaire réinitialisé');
}

// ========================================
// AFFICHAGE ET VISUALISATION
// ========================================

function updateDisplay() {
    updateStats();
    updateMoodList();
    updateVisualization();
}

function updateStats() {
    const totalEl = document.getElementById('totalParticipants');
    const varietyEl = document.getElementById('moodVariety');
    const timeEl = document.getElementById('sessionTime');
    
    if (totalEl) totalEl.textContent = moods.length;
    
    if (varietyEl) {
        const uniqueEmojis = new Set(moods.map(h => h.emoji));
        varietyEl.textContent = uniqueEmojis.size;
    }
    
    if (timeEl) {
        const minutes = Math.floor((new Date() - sessionStartTime) / 60000);
        timeEl.textContent = minutes;
    }
}

function updateMoodList() {
    const listContainer = document.getElementById('moodList');
    if (!listContainer) return;

    if (moods.length === 0) {
        listContainer.innerHTML = `
            <div class="loading">
                <p>🤖 En attente des premiers codes mood...</p>
                <p style="font-size: 0.9em; margin-top: 10px; color: #666;">
                    Partage ton mood pour commencer !
                </p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = moods.map(mood => {
        const codeSnippet = generateCodeSnippet(mood);
        const timeDisplay = formatTime(mood.created_at);
        const isRecent = new Date() - new Date(mood.created_at) < 60000;
        
        return `
            <div class="mood-item ${isRecent ? 'new-post' : ''}">
                <div class="mood-header">
                    <div class="mood-user">
                        <span class="mood-name">${escapeHtml(mood.nom)}</span>
                        <span class="mood-emoji">${mood.emoji}</span>
                        <span class="mood-lang">${mood.langage_prefere}</span>
                    </div>
                    <span class="mood-time">${timeDisplay}</span>
                </div>
                <div class="mood-content">
                    <div class="mood-code">${codeSnippet}</div>
                    ${mood.commentaire ? `<div class="mood-comment">"${escapeHtml(mood.commentaire)}"</div>` : ''}
                    <div class="mood-tags">
                        <span class="tag">${formatPreference(mood.autre_preference)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateCodeSnippet(mood) {
    const langagePrefere = mood.langage_prefere || 'javascript';
    
    const templates = {
        javascript: `let mood = "${mood.emoji}";${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        typescript: `const mood: string = "${mood.emoji}";${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        python: `mood = "${mood.emoji}"${mood.commentaire ? `  # ${escapeHtml(mood.commentaire)}` : ''}`,
        java: `String mood = "${mood.emoji}";${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        csharp: `string mood = "${mood.emoji}";${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        php: `$mood = "${mood.emoji}";${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        cpp: `std::string mood = "${mood.emoji}";${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        rust: `let mood = "${mood.emoji}";${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        go: `mood := "${mood.emoji}"${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        kotlin: `val mood = "${mood.emoji}"${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        swift: `let mood = "${mood.emoji}"${mood.commentaire ? ` // ${escapeHtml(mood.commentaire)}` : ''}`,
        ruby: `mood = "${mood.emoji}"${mood.commentaire ? ` # ${escapeHtml(mood.commentaire)}` : ''}`
    };

    return templates[langagePrefere] || templates.javascript;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h${diffMinutes % 60}min`;
}

function formatPreference(preference) {
    if (!preference) return '';
    const formatted = preference.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateVisualization() {
    const container = document.getElementById('moodVisualization');
    if (!container) return;

    if (moods.length === 0) {
        container.innerHTML = '';
        return;
    }

    const emojiCounts = {};
    const langageCounts = {};
    
    moods.forEach(mood => {
        emojiCounts[mood.emoji] = (emojiCounts[mood.emoji] || 0) + 1;
        langageCounts[mood.langage_prefere] = (langageCounts[mood.langage_prefere] || 0) + 1;
    });

    container.innerHTML = `
        <div class="viz-section">
            <h4>🎭 Top Émojis</h4>
            <div class="viz-items">
                ${Object.entries(emojiCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([emoji, count]) => `
                        <div class="mood-bubble">
                            <span>${emoji}</span>
                            <span class="mood-count">${count}</span>
                        </div>
                    `).join('')}
            </div>
        </div>
        <div class="viz-section">
            <h4>💻 Langages Populaires</h4>
            <div class="viz-items">
                ${Object.entries(langageCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([langage, count]) => `
                        <div class="lang-bubble">
                            <span>${langage}</span>
                            <span class="lang-count">${count}</span>
                        </div>
                    `).join('')}
            </div>
        </div>
    `;
}

// ========================================
// FONCTIONS ADMIN
// ========================================

function toggleAdminPanel() {
    let panel = document.getElementById('hiddenAdminPanel');
    
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'hiddenAdminPanel';
        panel.className = 'hidden-admin-panel';
        panel.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 10000; display: none;
        `;
        
        panel.innerHTML = `
            <div class="admin-overlay" onclick="closeAdminPanel()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
            <div class="admin-content" style="
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                max-width: 500px; width: 90%; color: #333;
            ">
                <div class="admin-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #1976d2;">🎓 Panneau Enseignant</h3>
                    <button onclick="closeAdminPanel()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
                <div class="admin-body">
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                            <strong>📊 Statistiques :</strong><br>
                            • ${moods.length} participants<br>
                            • ${new Set(moods.map(h => h.emoji)).size} emojis différents<br>
                            • Session : ${Math.floor((new Date() - sessionStartTime) / 60000)} minutes<br><br>
                            <strong>⌨️ Raccourcis :</strong><br>
                            • <kbd>Ctrl+Shift+A</kbd> : Ce panneau<br>
                            • <kbd>Ctrl+E</kbd> : Export CSV<br>
                            • <kbd>Ctrl+J</kbd> : Export JSON
                        </p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        <button onclick="clearAllMoods()" style="
                            background: #f44336; color: white; border: none; padding: 12px 16px; 
                            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
                        ">🗑️ Effacer tout</button>
                        <button onclick="exportMoods()" style="
                            background: #4caf50; color: white; border: none; padding: 12px 16px; 
                            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
                        ">📄 Export CSV</button>
                        <button onclick="exportMoodsJSON()" style="
                            background: #2196f3; color: white; border: none; padding: 12px 16px; 
                            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
                        ">💾 Export JSON</button>
                        <button onclick="loadMoodsFromSupabase()" style="
                            background: #ff9800; color: white; border: none; padding: 12px 16px; 
                            border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
                        ">🔄 Actualiser</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
    }
    
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

window.closeAdminPanel = function() {
    const panel = document.getElementById('hiddenAdminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
};

window.clearAllMoods = async function() {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir effacer TOUS les codes mood ?\n\nCette action est irréversible !')) {
        return;
    }

    try {
        console.log('🗑️ Suppression de toutes les moods...');
        
        const { error } = await supabase
            .from('mood')
            .delete()
            .neq('id', 0); // Supprimer tous les enregistrements

        if (error) {
            throw error;
        }
        
        console.log('✅ Toutes les moods supprimées');
        
        // Actualiser l'affichage
        setTimeout(() => {
            loadMoodsFromSupabase();
        }, 1000);
        
        // Fermer le panel admin
        closeAdminPanel();
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        alert('Erreur lors de la suppression: ' + error.message);
    }
};

window.exportMoods = function() {
    if (moods.length === 0) {
        alert('Aucun code mood à exporter !');
        return;
    }

    console.log('📊 Export CSV en cours...');

    const exportData = moods.map(mood => ({
        'Prénom': mood.nom,
        'Emoji': mood.emoji,
        'Langage Préféré': mood.langage_prefere,
        'Autre Préférence': mood.autre_preference || '',
        'Commentaire': mood.commentaire || '',
        'Date/Heure': formatTime(mood.created_at),
        'Timestamp': mood.created_at,
        'Mode': 'Supabase Module'
    }));

    const headers = Object.keys(exportData[0]);
    const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
            headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
    ].join('\n');

    downloadFile(csvContent, `emoji-code-mood-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    console.log('✅ Export CSV téléchargé');
};

window.exportMoodsJSON = function() {
    if (moods.length === 0) {
        alert('Aucun code mood à exporter !');
        return;
    }

    console.log('💾 Export JSON en cours...');

    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            mode: 'Supabase Module',
            sessionDuration: Math.floor((new Date() - sessionStartTime) / 60000),
            totalParticipants: moods.length,
            uniqueEmojis: new Set(moods.map(h => h.emoji)).size,
            version: 'module-corrigé-2.3',
            supabaseConfig: {
                url: window.PRIVATE_CONFIG?.supabaseUrl,
                connected: isConnected
            }
        },
        statistics: {
            emojiDistribution: moods.reduce((acc, h) => {
                acc[h.emoji] = (acc[h.emoji] || 0) + 1;
                return acc;
            }, {}),
            languageDistribution: moods.reduce((acc, h) => {
                acc[h.langage_prefere] = (acc[h.langage_prefere] || 0) + 1;
                return acc;
            }, {}),
            preferenceDistribution: moods.reduce((acc, h) => {
                acc[h.autre_preference] = (acc[h.autre_preference] || 0) + 1;
                return acc;
            }, {})
        },
        moods: moods
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `emoji-code-mood-session-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    console.log('✅ Export JSON téléchargé');
};

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ========================================
// NETTOYAGE À LA FERMETURE
// ========================================

window.addEventListener('beforeunload', () => {
    console.log('🧹 Nettoyage avant fermeture...');
    
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        console.log('✅ Auto-refresh arrêté');
    }
    
    if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
        console.log('✅ Canal temps réel fermé');
    }
});

// ========================================
// INITIALISATION DE L'APPLICATION
// ========================================

async function initApp() {
    console.log('🚀 Initialisation Emoji Code mood (version module corrigé)...');

    try {
        // 1. Configuration des event listeners d'abord
        setupEventListeners();

        // 2. Initialisation Supabase avec module corrigé
        console.log('🔧 Tentative d\'initialisation Supabase...');
        const supabaseSuccess = await initSupabase();
        
        if (!supabaseSuccess) {
            console.warn('⚠️ Échec de la connexion Supabase');
            console.log('ℹ️ L\'application peut fonctionner en mode lecture seule');
            return;
        }

        // 3. Mise à jour initiale de l'affichage
        updateDisplay();

        console.log('✅ Application initialisée avec succès');
        console.log('📊 Mode actuel: Supabase (module corrigé)');
        console.log('📈 moods chargées:', moods.length);
        console.log('🔗 Configuration URL:', window.PRIVATE_CONFIG?.supabaseUrl);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        
        // Afficher une erreur utilisateur friendly
        const errorMsg = `Erreur lors de l'initialisation de l'application.\n\nDétails: ${error.message}\n\nVérifiez la console pour plus d'informations.`;
        alert(errorMsg);
    }
}

// ========================================
// DÉMARRAGE AUTOMATIQUE AVEC ATTENTE
// ========================================

function startApp() {
    console.log('🎬 Démarrage de l\'application...');
    
    if (document.readyState === 'loading') {
        console.log('⏳ Attente du chargement du DOM...');
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        console.log('📄 DOM déjà chargé, initialisation immédiate');
        initApp();
    }
}

// Démarrage immédiat
startApp();

// Fallback supplémentaire après chargement complet
window.addEventListener('load', () => {
    // Vérifier si l'app n'est pas encore initialisée après 2 secondes
    setTimeout(() => {
        if (moods.length === 0 && !isConnected) {
            console.log('🔄 Initialisation fallback après chargement complet...');
            initApp();
        }
    }, 2000);
});

// ========================================
// LOGS DE DEBUG ET MONITORING
// ========================================

// Log périodique de l'état de l'application
setInterval(() => {
    if (isConnected) {
        console.log(`📊 État: ${moods.length} moods, connexion ${isConnected ? 'OK' : 'KO'}, temps réel ${realtimeChannel ? 'actif' : 'inactif'}`);
    }
}, 60000); // Toutes les minutes

console.log('✅ Fin de main.js chargée (version module corrigé avec diagnostic complet)');
