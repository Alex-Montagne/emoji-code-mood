// testSupabaseConnection.js - Version française avec table "humeur"
// Script de test détaillé de la connexion Supabase

(async function() {
    const output = document.getElementById('testOutput');
    function log(msg) {
        output.innerHTML += `<div>${msg}</div>`;
    }

    log('🔍 Test de connexion Supabase démarré (version française)...');

    // Étape 1 : Vérification de la config
    if (!window.PRIVATE_CONFIG) {
        log('❌ ERREUR : window.PRIVATE_CONFIG est introuvable.');
        return;
    }
    log('✅ window.PRIVATE_CONFIG trouvé.');

    if (!window.PRIVATE_CONFIG.supabaseUrl || !window.PRIVATE_CONFIG.supabaseAnonKey) {
        log('❌ ERREUR : Les clés Supabase sont manquantes dans la configuration.');
        return;
    }
    log('✅ Clés Supabase présentes.');

    // Étape 2 : Chargement de la librairie supabase-js
    try {
        if (!window.supabaseLib) {
            window.supabaseLib = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
            log('✅ Librairie supabase-js chargée.');
        } else {
            log('ℹ️ Librairie supabase-js déjà chargée.');
        }
    } catch (e) {
        log('❌ ERREUR : Impossible de charger la librairie supabase-js.');
        log(e.message);
        return;
    }

    // Étape 3 : Création du client
    let supabase;
    try {
        const { createClient } = window.supabaseLib;
        supabase = createClient(window.PRIVATE_CONFIG.supabaseUrl, window.PRIVATE_CONFIG.supabaseAnonKey);
        log('✅ Client Supabase créé.');
    } catch (e) {
        log('❌ ERREUR : Impossible de créer le client Supabase.');
        log(e.message);
        return;
    }

    // Étape 4 : Test de requête sur la table "humeur"
    try {
        log('⏳ Test de requête sur la table "moods"...');
        const { data, error } = await supabase.from('moods').select('*').limit(5);
        if (error) {
            log('❌ ERREUR lors de la requête : ' + error.message);
            if (error.message.includes('relation "public.moods" does not exist')) {
                log('💡 SOLUTION : La table "moods" n\'existe pas encore. Exécutez le script SQL de création de table.');
                log('📋 Script à exécuter dans Supabase SQL Editor :');
                log('<pre>CREATE TABLE public.moods (\n  id BIGSERIAL PRIMARY KEY,\n  nom TEXT NOT NULL,\n  emoji TEXT NOT NULL,\n  langage TEXT NOT NULL,\n  commentaire TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);</pre>');
            }
            return;
        }
        log('✅ Requête réussie sur la table "moods". Données trouvées :');
        log('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
        
        if (data.length === 0) {
            log('ℹ️ La table "moods" est vide. C\'est normal pour une nouvelle installation.');
        } else {
            log(`📊 ${data.length} enregistrement(s) trouvé(s) dans la table "moods".`);
        }

    } catch (e) {
        log('❌ ERREUR inattendue lors de la requête.');
        log(e.message);
    }

    // Étape 5 : Test des champs français
    try {
        log('⏳ Vérification de la structure de la table "moods"...');
        
        // Test d'insertion pour vérifier les champs
        const testData = {
            nom: 'Test',
            emoji: '🧪',
            langage: 'javascript',
            commentaire: 'Test de connexion'
        };

        const { data, error } = await supabase
            .from('humeur')
            .insert([testData])
            .select()
            .limit(1);

        if (error) {
            log('❌ Erreur lors du test d\'insertion : ' + error.message);
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                log('💡 La table "humeur" n\'a pas la bonne structure. Vérifiez les noms de colonnes.');
            }
            return;
        }

        log('✅ Test d\'insertion réussi avec les champs français !');
        log('<pre>' + JSON.stringify(data[0], null, 2) + '</pre>');

        // Nettoyer le test
        if (data[0]?.id) {
            await supabase.from('moods').delete().eq('id', data[0].id);
            log('🧹 Enregistrement de test supprimé.');
        }

    } catch (e) {
        log('❌ Erreur lors du test de structure.');
        log(e.message);
    }

    log('🎉 Test de connexion terminé !');
})();
