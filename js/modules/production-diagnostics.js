// js/modules/production-diagnostics.js
// Herramientas de diagnóstico específicas para problemas de producción

export class ProductionDiagnostics {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.logs = [];
        this.maxLogs = 100;
    }

    log(category, event, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            category,
            event,
            environment: this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
            hostname: window.location.hostname,
            userAgent: navigator.userAgent.substring(0, 100),
            online: navigator.onLine,
            connection: navigator.connection?.effectiveType || 'unknown',
            ...data
        };

        this.logs.push(logEntry);
        
        // Mantener solo los últimos logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Log en consola con formato mejorado
        const emoji = this.getCategoryEmoji(category);
        console.log(`${emoji} [${category}] ${event}:`, logEntry);

        return logEntry;
    }

    getCategoryEmoji(category) {
        const emojis = {
            'UPLOAD': '📤',
            'AUTH': '🔐',
            'NETWORK': '🌐',
            'ERROR': '❌',
            'SUCCESS': '✅',
            'WARNING': '⚠️',
            'INFO': 'ℹ️',
            'DEBUG': '🔍'
        };
        return emojis[category] || '📝';
    }

    async testSupabaseConnection() {
        this.log('NETWORK', 'CONNECTION_TEST_START');
        
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized');
            }

            const startTime = performance.now();
            
            // Test básico de conexión
            const { data, error } = await window.supabaseClient
                .from('servers')
                .select('id')
                .limit(1);

            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);

            if (error) {
                this.log('ERROR', 'CONNECTION_TEST_FAILED', { 
                    error: error.message, 
                    latency 
                });
                return false;
            }

            this.log('SUCCESS', 'CONNECTION_TEST_SUCCESS', { 
                latency,
                recordCount: data?.length || 0
            });
            return true;

        } catch (error) {
            this.log('ERROR', 'CONNECTION_TEST_ERROR', { 
                error: error.message 
            });
            return false;
        }
    }

    async testStorageConnection(bucket = 'server-images') {
        this.log('NETWORK', 'STORAGE_TEST_START', { bucket });
        
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized');
            }

            const startTime = performance.now();
            
            // Test de listado de archivos (operación de lectura)
            const { data, error } = await window.supabaseClient.storage
                .from(bucket)
                .list('', { limit: 1 });

            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);

            if (error) {
                this.log('ERROR', 'STORAGE_TEST_FAILED', { 
                    bucket,
                    error: error.message, 
                    latency 
                });
                return false;
            }

            this.log('SUCCESS', 'STORAGE_TEST_SUCCESS', { 
                bucket,
                latency,
                fileCount: data?.length || 0
            });
            return true;

        } catch (error) {
            this.log('ERROR', 'STORAGE_TEST_ERROR', { 
                bucket,
                error: error.message 
            });
            return false;
        }
    }

    async getAuthStatus() {
        this.log('AUTH', 'AUTH_STATUS_CHECK');
        
        try {
            if (!window.supabaseClient) {
                return { error: 'Supabase client not initialized' };
            }

            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                this.log('ERROR', 'AUTH_STATUS_ERROR', { error: error.message });
                return { error: error.message };
            }

            if (!session) {
                this.log('WARNING', 'AUTH_STATUS_NO_SESSION');
                return { authenticated: false };
            }

            const authInfo = {
                authenticated: true,
                userId: session.user?.id,
                email: session.user?.email,
                tokenExpiry: session.expires_at,
                isExpired: session.expires_at ? new Date(session.expires_at * 1000) < new Date() : false,
                tokenLength: session.access_token?.length || 0
            };

            this.log('SUCCESS', 'AUTH_STATUS_SUCCESS', authInfo);
            return authInfo;

        } catch (error) {
            this.log('ERROR', 'AUTH_STATUS_EXCEPTION', { error: error.message });
            return { error: error.message };
        }
    }

    async runFullDiagnostic() {
        this.log('INFO', 'FULL_DIAGNOSTIC_START');
        
        const results = {
            timestamp: new Date().toISOString(),
            environment: this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
            hostname: window.location.hostname,
            tests: {}
        };

        // Test de autenticación
        results.tests.auth = await this.getAuthStatus();
        
        // Test de conexión básica
        results.tests.connection = await this.testSupabaseConnection();
        
        // Test de storage
        results.tests.storage = await this.testStorageConnection();
        
        // Información del navegador
        results.browser = {
            userAgent: navigator.userAgent,
            online: navigator.onLine,
            connection: navigator.connection?.effectiveType || 'unknown',
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage
        };

        this.log('INFO', 'FULL_DIAGNOSTIC_COMPLETE', results);
        
        return results;
    }

    exportLogs() {
        const exportData = {
            timestamp: new Date().toISOString(),
            environment: this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
            hostname: window.location.hostname,
            logs: this.logs
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `webmuserverlist-diagnostics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log('INFO', 'LOGS_EXPORTED', { logCount: this.logs.length });
    }

    // Método para mostrar diagnósticos en consola de forma organizada
    showDiagnosticSummary() {
        console.group('🔍 PRODUCTION DIAGNOSTICS SUMMARY');
        console.log('Environment:', this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
        console.log('Hostname:', window.location.hostname);
        console.log('Total logs:', this.logs.length);
        
        const categories = [...new Set(this.logs.map(log => log.category))];
        categories.forEach(category => {
            const categoryLogs = this.logs.filter(log => log.category === category);
            console.log(`${this.getCategoryEmoji(category)} ${category}:`, categoryLogs.length, 'events');
        });
        
        console.log('Recent errors:', this.logs.filter(log => log.category === 'ERROR').slice(-5));
        console.groupEnd();
    }
}

// Crear instancia global para debugging
window.productionDiagnostics = new ProductionDiagnostics();

// Comandos de consola para debugging en producción
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.log(`
🔍 PRODUCTION DEBUGGING COMMANDS:
- productionDiagnostics.runFullDiagnostic() - Ejecutar diagnóstico completo
- productionDiagnostics.testSupabaseConnection() - Test conexión Supabase
- productionDiagnostics.testStorageConnection() - Test storage
- productionDiagnostics.getAuthStatus() - Verificar autenticación
- productionDiagnostics.exportLogs() - Exportar logs para análisis
- productionDiagnostics.showDiagnosticSummary() - Mostrar resumen
- networkMonitor.testConnection() - Test conexión de red
    `);
}

export default ProductionDiagnostics;
