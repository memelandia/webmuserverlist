// /js/main-app.js
import { initAuth } from './modules/auth.js';
import { initHomePage } from './main.js';
import { initRankingPage } from './ranking.js';
import { initExplorarPage } from './explorar.js';
import { initCalendarioPage } from './calendario.js';
import { initServidorPage } from './servidor.js';
import { initProfilePage } from './profile.js';
import { initAddServerPage } from './add-server.js';
import { initEditServerPage } from './editar-servidor.js';  
import { initAdminPage } from './admin.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Aplicación MuServerList iniciada.");
    
    // La autenticación (y carga de modal) se inicializa siempre.
    await initAuth(); 
    
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
        case 'page-calendario':
            initCalendarioPage();
            break;
        case 'page-servidor':
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
        case 'page-admin':
            initAdminPage();
            break;
        default:
            // No es necesario un mensaje de error, algunas páginas pueden no tener JS específico.
            console.log(`No hay un script de inicialización específico para la página "${pageId}".`);
            break;
    }
});