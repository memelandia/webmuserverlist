// build-tools/minify.js
// Herramienta de minificación para MuServerList

const fs = require('fs');
const path = require('path');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {
    // Directorios
    sourceDir: '../',
    outputDir: '../dist/',
    
    // Archivos CSS a minificar
    cssFiles: [
        'css/style.css'
    ],
    
    // Archivos JS a minificar
    jsFiles: [
        'js/main.js',
        'js/main-app.js',
        'js/explorar.js',
        'js/ranking.js',
        'js/calendario.js',
        'js/profile.js',
        'js/modules/api.js',
        'js/modules/ui.js',
        'js/modules/utils.js',
        'js/modules/lazy-loading.js'
    ],
    
    // Archivos HTML a procesar
    htmlFiles: [
        'index.html',
        'explorar.html',
        'ranking.html',
        'calendario.html',
        'profile.html',
        'servidor.html'
    ]
};

// =====================================================
// FUNCIONES DE MINIFICACIÓN
// =====================================================

// Minificar CSS
function minifyCSS(css) {
    return css
        // Remover comentarios
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remover espacios en blanco innecesarios
        .replace(/\s+/g, ' ')
        // Remover espacios alrededor de caracteres especiales
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        // Remover punto y coma antes de }
        .replace(/;}/g, '}')
        // Remover espacios al inicio y final
        .trim();
}

// Minificar JavaScript (básico)
function minifyJS(js) {
    return js
        // Remover comentarios de línea
        .replace(/\/\/.*$/gm, '')
        // Remover comentarios de bloque
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remover espacios en blanco excesivos
        .replace(/\s+/g, ' ')
        // Remover espacios alrededor de operadores
        .replace(/\s*([=+\-*/%<>!&|^~?:;,(){}[\]])\s*/g, '$1')
        // Remover espacios al inicio y final
        .trim();
}

// Minificar HTML
function minifyHTML(html) {
    return html
        // Remover comentarios HTML
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remover espacios en blanco excesivos
        .replace(/\s+/g, ' ')
        // Remover espacios entre tags
        .replace(/>\s+</g, '><')
        // Remover espacios al inicio y final
        .trim();
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =====================================================
// PROCESO DE MINIFICACIÓN
// =====================================================

function processFiles() {
    console.log('🚀 Iniciando proceso de minificación...\n');
    
    // Crear directorio de salida
    ensureDirectoryExists(CONFIG.outputDir);
    
    let totalOriginalSize = 0;
    let totalMinifiedSize = 0;
    const results = [];
    
    // Procesar archivos CSS
    console.log('📄 Procesando archivos CSS...');
    CONFIG.cssFiles.forEach(file => {
        const sourcePath = path.join(CONFIG.sourceDir, file);
        const outputPath = path.join(CONFIG.outputDir, file);
        
        if (fs.existsSync(sourcePath)) {
            const originalContent = fs.readFileSync(sourcePath, 'utf8');
            const minifiedContent = minifyCSS(originalContent);
            
            ensureDirectoryExists(path.dirname(outputPath));
            fs.writeFileSync(outputPath, minifiedContent);
            
            const originalSize = originalContent.length;
            const minifiedSize = minifiedContent.length;
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
            
            totalOriginalSize += originalSize;
            totalMinifiedSize += minifiedSize;
            
            results.push({
                file,
                type: 'CSS',
                originalSize: formatBytes(originalSize),
                minifiedSize: formatBytes(minifiedSize),
                savings: `${savings}%`
            });
            
            console.log(`  ✅ ${file}: ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${savings}% reducción)`);
        } else {
            console.log(`  ⚠️ ${file}: Archivo no encontrado`);
        }
    });
    
    // Procesar archivos JavaScript
    console.log('\n📜 Procesando archivos JavaScript...');
    CONFIG.jsFiles.forEach(file => {
        const sourcePath = path.join(CONFIG.sourceDir, file);
        const outputPath = path.join(CONFIG.outputDir, file);
        
        if (fs.existsSync(sourcePath)) {
            const originalContent = fs.readFileSync(sourcePath, 'utf8');
            const minifiedContent = minifyJS(originalContent);
            
            ensureDirectoryExists(path.dirname(outputPath));
            fs.writeFileSync(outputPath, minifiedContent);
            
            const originalSize = originalContent.length;
            const minifiedSize = minifiedContent.length;
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
            
            totalOriginalSize += originalSize;
            totalMinifiedSize += minifiedSize;
            
            results.push({
                file,
                type: 'JS',
                originalSize: formatBytes(originalSize),
                minifiedSize: formatBytes(minifiedSize),
                savings: `${savings}%`
            });
            
            console.log(`  ✅ ${file}: ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${savings}% reducción)`);
        } else {
            console.log(`  ⚠️ ${file}: Archivo no encontrado`);
        }
    });
    
    // Procesar archivos HTML
    console.log('\n🌐 Procesando archivos HTML...');
    CONFIG.htmlFiles.forEach(file => {
        const sourcePath = path.join(CONFIG.sourceDir, file);
        const outputPath = path.join(CONFIG.outputDir, file);
        
        if (fs.existsSync(sourcePath)) {
            let htmlContent = fs.readFileSync(sourcePath, 'utf8');
            
            // Actualizar referencias a archivos minificados
            htmlContent = htmlContent
                .replace(/css\/style\.css/g, 'css/style.css')
                .replace(/js\/([\w\-\/]+)\.js/g, 'js/$1.js');
            
            const minifiedContent = minifyHTML(htmlContent);
            
            fs.writeFileSync(outputPath, minifiedContent);
            
            const originalSize = htmlContent.length;
            const minifiedSize = minifiedContent.length;
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
            
            totalOriginalSize += originalSize;
            totalMinifiedSize += minifiedSize;
            
            results.push({
                file,
                type: 'HTML',
                originalSize: formatBytes(originalSize),
                minifiedSize: formatBytes(minifiedSize),
                savings: `${savings}%`
            });
            
            console.log(`  ✅ ${file}: ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${savings}% reducción)`);
        } else {
            console.log(`  ⚠️ ${file}: Archivo no encontrado`);
        }
    });
    
    // Copiar otros archivos necesarios
    console.log('\n📁 Copiando archivos adicionales...');
    const additionalDirs = ['img', 'fonts'];
    additionalDirs.forEach(dir => {
        const sourcePath = path.join(CONFIG.sourceDir, dir);
        const outputPath = path.join(CONFIG.outputDir, dir);
        
        if (fs.existsSync(sourcePath)) {
            copyDirectory(sourcePath, outputPath);
            console.log(`  ✅ Copiado: ${dir}/`);
        }
    });
    
    // Mostrar resumen
    const totalSavings = ((totalOriginalSize - totalMinifiedSize) / totalOriginalSize * 100).toFixed(1);
    
    console.log('\n📊 RESUMEN DE MINIFICACIÓN');
    console.log('='.repeat(50));
    console.log(`📦 Tamaño original: ${formatBytes(totalOriginalSize)}`);
    console.log(`🗜️ Tamaño minificado: ${formatBytes(totalMinifiedSize)}`);
    console.log(`💾 Ahorro total: ${formatBytes(totalOriginalSize - totalMinifiedSize)} (${totalSavings}%)`);
    console.log(`📁 Archivos procesados: ${results.length}`);
    console.log(`📂 Directorio de salida: ${CONFIG.outputDir}`);
    
    // Generar reporte
    generateReport(results, totalOriginalSize, totalMinifiedSize);
    
    console.log('\n✅ Proceso de minificación completado exitosamente!');
}

function copyDirectory(source, destination) {
    ensureDirectoryExists(destination);
    
    const items = fs.readdirSync(source);
    items.forEach(item => {
        const sourcePath = path.join(source, item);
        const destPath = path.join(destination, item);
        
        if (fs.statSync(sourcePath).isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    });
}

function generateReport(results, totalOriginal, totalMinified) {
    const reportPath = path.join(CONFIG.outputDir, 'minification-report.json');
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: results.length,
            originalSize: totalOriginal,
            minifiedSize: totalMinified,
            totalSavings: totalOriginal - totalMinified,
            savingsPercentage: ((totalOriginal - totalMinified) / totalOriginal * 100).toFixed(1)
        },
        files: results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte generado: ${reportPath}`);
}

// =====================================================
// EJECUCIÓN
// =====================================================

if (require.main === module) {
    processFiles();
}

module.exports = { processFiles, minifyCSS, minifyJS, minifyHTML };
