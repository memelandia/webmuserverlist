// /js/main-app.js
// Este es el punto de entrada principal de toda la aplicación.
// Se carga en cada página y decide qué scripts ejecutar.

// Importamos los "inicializadores" de cada sección de nuestra web.
import { initAuth } from './modules/auth.js';
import { initHomePage } from './main.js';
import { initRankingPage } from './ranking.js';
import { initExplorarPage } from './explorar.js';
import { initCalendarioPage } from './calendario.js'; // <-- AÑADIR
import { initServidorPage } from './servidor.js';     // <-- AÑADIR
import { initProfilePage } from './profile.js';
import { initAddServerPage } from './add-server.js';
import { initEditServerPage } from './editar-servidor.js';  
import { initAdminPage } from './admin.js'; // <-- AÑADIR IMPORT 


// Función que se ejecuta en cuanto el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Aplicación MuServerList iniciada.");
    
    // --- LÓGICA COMÚN A TODAS LAS PÁGINAS ---
    // La autenticación (botones de login/logout, modal) se inicializa siempre.
    initAuth(); 
    
    // --- LÓGICA ESPECÍFICA DE CADA PÁGINA ---
    // Leemos el ID que pusimos en la etiqueta <body> para saber en qué página estamos.
    const pageId = document.body.id;

    console.log(`Página actual detectada: "${pageId}"`);

     switch (pageId) {
        case 'page-home':
            initHomePage();
            break;
        case 'page-ranking':
            initRankingPage();
            break;
        case 'page-explorar':
            initExplorarPage();
            break;
        case 'page-calendario': // <-- AÑADIR
            initCalendarioPage();
            break;
        case 'page-servidor': // <-- AÑADIR
            initServidorPage();
            break;
        case 'page-profile':
            initProfilePage();
            break;
        case 'page-agregar':
            initAddServerPage();
            break;
        case 'page-editar-servidor':
            initEditServerPage();
            break;
        case 'page-admin': // <-- AÑADIR ESTE
            initAdminPage();
            break;

        default:
            // Este console.log es útil para saber qué páginas nos falta por "conectar"
            console.log(`%cAtención: No se ha definido un script de inicialización para la página con id "${pageId}".`, "color: orange; font-weight: bold;");
            break;
    }
});