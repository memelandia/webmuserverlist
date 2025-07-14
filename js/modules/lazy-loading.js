// js/modules/lazy-loading.js
// Sistema completo de lazy loading para MuServerList

// TEMPORAL: Comentado import de WebP para evitar problemas de dependencias
// import { isWebPSupported, getWebPUrl, createLazyWebPImage } from './webp-support.js';

// =====================================================
// CONFIGURACIÓN DE LAZY LOADING
// =====================================================

const LAZY_CONFIG = {
    // Margen para cargar imágenes antes de que sean visibles
    rootMargin: '50px 0px',
    // Umbral de visibilidad para activar la carga
    threshold: 0.1,
    // Placeholder mientras carga
    placeholderClass: 'lazy-placeholder',
    // Clase para imágenes cargadas
    loadedClass: 'lazy-loaded',
    // Clase para imágenes con error
    errorClass: 'lazy-error'
};

// =====================================================
// INTERSECTION OBSERVER PARA LAZY LOADING
// =====================================================

let imageObserver = null;
let backgroundObserver = null;

// Inicializar observadores
function initLazyLoading() {
    // Observer para imágenes <img>
    if ('IntersectionObserver' in window) {
        imageObserver = new IntersectionObserver(handleImageIntersection, {
            rootMargin: LAZY_CONFIG.rootMargin,
            threshold: LAZY_CONFIG.threshold
        });

        backgroundObserver = new IntersectionObserver(handleBackgroundIntersection, {
            rootMargin: LAZY_CONFIG.rootMargin,
            threshold: LAZY_CONFIG.threshold
        });

        console.log('✅ Lazy loading inicializado con IntersectionObserver');
    } else {
        console.warn('⚠️ IntersectionObserver no soportado, usando fallback');
        // Fallback para navegadores antiguos
        loadAllImagesImmediately();
    }
}

// Manejar intersección de imágenes <img>
function handleImageIntersection(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            loadImage(img);
            observer.unobserve(img);
        }
    });
}

// Manejar intersección de elementos con background-image
function handleBackgroundIntersection(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const element = entry.target;
            loadBackgroundImage(element);
            observer.unobserve(element);
        }
    });
}

// =====================================================
// FUNCIONES DE CARGA DE IMÁGENES
// =====================================================

// Cargar imagen <img>
function loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (!src) return;

    // Crear nueva imagen para precargar
    const imageLoader = new Image();
    
    imageLoader.onload = () => {
        // Imagen cargada exitosamente
        img.src = src;
        if (srcset) img.srcset = srcset;
        
        img.classList.remove(LAZY_CONFIG.placeholderClass);
        img.classList.add(LAZY_CONFIG.loadedClass);
        
        // Animación de fade-in
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';
        
        requestAnimationFrame(() => {
            img.style.opacity = '1';
        });
    };
    
    imageLoader.onerror = () => {
        // Error cargando imagen, usar fallback
        const fallback = img.dataset.fallback;
        if (fallback) {
            img.src = fallback;
        }
        img.classList.remove(LAZY_CONFIG.placeholderClass);
        img.classList.add(LAZY_CONFIG.errorClass);
    };
    
    // Iniciar carga
    imageLoader.src = src;
    if (srcset) imageLoader.srcset = srcset;
}

// Cargar background-image
function loadBackgroundImage(element) {
    const bgSrc = element.dataset.bgSrc;
    if (!bgSrc) return;

    // Crear imagen para precargar
    const imageLoader = new Image();
    
    imageLoader.onload = () => {
        element.style.backgroundImage = `url('${bgSrc}')`;
        element.classList.remove(LAZY_CONFIG.placeholderClass);
        element.classList.add(LAZY_CONFIG.loadedClass);
        
        // Animación de fade-in
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.3s ease-in-out';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    };
    
    imageLoader.onerror = () => {
        const fallback = element.dataset.bgFallback;
        if (fallback) {
            element.style.backgroundImage = `url('${fallback}')`;
        }
        element.classList.remove(LAZY_CONFIG.placeholderClass);
        element.classList.add(LAZY_CONFIG.errorClass);
    };
    
    imageLoader.src = bgSrc;
}

// =====================================================
// FUNCIONES PÚBLICAS
// =====================================================

// Observar imagen para lazy loading
export function observeImage(img) {
    if (!imageObserver) return;
    
    // Añadir clase de placeholder
    img.classList.add(LAZY_CONFIG.placeholderClass);
    
    // Observar la imagen
    imageObserver.observe(img);
}

// Observar elemento con background-image
export function observeBackgroundImage(element) {
    if (!backgroundObserver) return;
    
    // Añadir clase de placeholder
    element.classList.add(LAZY_CONFIG.placeholderClass);
    
    // Observar el elemento
    backgroundObserver.observe(element);
}

// Observar todas las imágenes lazy en un contenedor
export function observeImagesInContainer(container) {
    if (!container) return;
    
    // Observar imágenes <img> con data-src
    const lazyImages = container.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => observeImage(img));
    
    // Observar elementos con data-bg-src
    const lazyBackgrounds = container.querySelectorAll('[data-bg-src]');
    lazyBackgrounds.forEach(element => observeBackgroundImage(element));
    
    console.log(`🖼️ Observando ${lazyImages.length} imágenes y ${lazyBackgrounds.length} backgrounds para lazy loading`);
}

// Cargar todas las imágenes inmediatamente (fallback)
function loadAllImagesImmediately() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const lazyBackgrounds = document.querySelectorAll('[data-bg-src]');
    
    lazyImages.forEach(img => {
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    });
    
    lazyBackgrounds.forEach(element => {
        element.style.backgroundImage = `url('${element.dataset.bgSrc}')`;
    });
    
    console.log('⚠️ Lazy loading fallback: cargadas todas las imágenes inmediatamente');
}

// Función para crear imagen lazy (WebP temporalmente deshabilitado)
export function createLazyImage(src, alt, options = {}) {
    const {
        width,
        height,
        className = '',
        fallback = 'img/logo_placeholder_small.png',
        loading = 'lazy'
    } = options;

    // Si el navegador soporta loading="lazy" nativo, usarlo
    if ('loading' in HTMLImageElement.prototype) {
        return `<img src="${src}" alt="${alt}" class="${className}" ${width ? `width="${width}"` : ''} ${height ? `height="${height}"` : ''} loading="${loading}">`;
    }

    // Si no, usar nuestro sistema de lazy loading
    return `<img data-src="${src}" data-fallback="${fallback}" alt="${alt}" class="${className} ${LAZY_CONFIG.placeholderClass}" ${width ? `width="${width}"` : ''} ${height ? `height="${height}"` : ''} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width || 100}' height='${height || 100}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E">`;
}

// Función para crear background lazy
export function createLazyBackground(src, options = {}) {
    const {
        className = '',
        fallback = 'img/banner_placeholder.png'
    } = options;
    
    return {
        className: `${className} ${LAZY_CONFIG.placeholderClass}`,
        'data-bg-src': src,
        'data-bg-fallback': fallback,
        style: 'background-color: #f0f0f0;' // Placeholder color
    };
}

// Función para actualizar imágenes existentes a lazy
export function convertToLazy(container) {
    if (!container) return;
    
    const images = container.querySelectorAll('img:not([data-src])');
    images.forEach(img => {
        if (img.src && !img.src.startsWith('data:')) {
            img.dataset.src = img.src;
            img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${img.width || 100}' height='${img.height || 100}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E`;
            observeImage(img);
        }
    });
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

// Auto-inicializar cuando se carga el módulo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyLoading);
} else {
    initLazyLoading();
}

// Observar imágenes existentes al cargar
document.addEventListener('DOMContentLoaded', () => {
    observeImagesInContainer(document);
});

// Exportar funciones principales
export { 
    initLazyLoading, 
    observeImagesInContainer, 
    observeImage, 
    observeBackgroundImage,
    createLazyImage,
    createLazyBackground,
    convertToLazy,
    LAZY_CONFIG 
};

console.log('🚀 Módulo de lazy loading cargado');
