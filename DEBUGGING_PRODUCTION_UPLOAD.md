# 🔍 Guía de Debugging para Problemas de Upload en Producción

## 📋 Resumen del Problema

**Síntoma**: Los uploads de archivos se congelan indefinidamente en producción (Vercel) pero funcionan perfectamente en desarrollo local.

**Causa Raíz Identificada**: Problemas de conectividad de red específicos entre Vercel y Supabase, posiblemente relacionados con:
- Headers de autenticación que se pierden en el transporte
- Timeouts agresivos de Vercel
- Configuración de CORS/Preflight
- Inicialización incorrecta del cliente Supabase en el contexto de Vercel

## 🛠️ Soluciones Implementadas

### 1. **Función de Upload Robusta** (`uploadFileRobust`)
- ✅ **Retry automático** con backoff exponencial (hasta 3 intentos)
- ✅ **Timeouts dinámicos** que aumentan en cada retry (15s → 22.5s → 33.75s)
- ✅ **Headers de autenticación explícitos** en cada request
- ✅ **Logging detallado** para debugging en producción
- ✅ **Fallback** a la función original si falla

### 2. **Monitoreo de Red en Tiempo Real**
- ✅ **Test de conexión automático** al inicializar
- ✅ **Logging de todas las requests** con detalles de red
- ✅ **Headers específicos para Vercel** (`x-client-info: webmuserverlist-vercel`)
- ✅ **Configuración optimizada** del cliente Supabase para Vercel

### 3. **Herramientas de Diagnóstico**
- ✅ **Clase ProductionDiagnostics** para debugging avanzado
- ✅ **Comandos de consola** para testing en vivo
- ✅ **Exportación de logs** para análisis posterior

## 🧪 Cómo Probar las Soluciones

### **Paso 1: Desplegar a Vercel**
```bash
# Asegúrate de que todos los cambios estén committeados
git add .
git commit -m "Implementar soluciones para bug de upload en producción"
git push origin main
```

### **Paso 2: Testing en Producción**
1. Ve a `https://webmuserverlist.vercel.app/agregar.html`
2. Abre las **Developer Tools** (F12)
3. Ve a la pestaña **Console**
4. Deberías ver logs como:
   ```
   🌐 [NETWORK MONITOR] SUPABASE_INIT_START
   🔗 [CONNECTION TEST]: {success: true, latency: 150}
   ✅ Cliente Supabase inicializado GLOBALMENTE con monitoreo de red
   ```

### **Paso 3: Ejecutar Diagnósticos**
En la consola del navegador, ejecuta:
```javascript
// Diagnóstico completo
await productionDiagnostics.runFullDiagnostic()

// Test específico de storage
await productionDiagnostics.testStorageConnection('server-images')

// Verificar autenticación
await productionDiagnostics.getAuthStatus()
```

### **Paso 4: Probar Upload Real**
1. Inicia sesión en la aplicación
2. Ve a "Agregar Servidor"
3. Selecciona un archivo de imagen (< 2MB)
4. Observa los logs en la consola:
   ```
   🔍 [PRODUCTION] NETWORK DIAGNOSTIC - UPLOAD_START
   🔍 [PRODUCTION] NETWORK DIAGNOSTIC - AUTH_CHECK
   🔍 [PRODUCTION] NETWORK DIAGNOSTIC - UPLOAD_ATTEMPT
   📤 [UPLOAD] UPLOAD_SUCCESS
   ```

## 🚨 Qué Buscar en los Logs

### **Logs de Éxito** ✅
```
🔍 [PRODUCTION] NETWORK DIAGNOSTIC - UPLOAD_SUCCESS: {
  fileName: "1234567890-abc123.jpg",
  path: "1234567890-abc123.jpg",
  retryAttempt: 0
}
```

### **Logs de Problemas** ❌
```
🔍 [PRODUCTION] NETWORK DIAGNOSTIC - UPLOAD_TIMEOUT: {
  fileName: "1234567890-abc123.jpg",
  timeout: 15000,
  retryAttempt: 0
}

🔍 [PRODUCTION] NETWORK DIAGNOSTIC - RETRY_ATTEMPT: {
  retryAttempt: 1,
  reason: "Timeout: La subida tardó más de 15 segundos"
}
```

### **Logs de Autenticación** 🔐
```
🔍 [PRODUCTION] NETWORK DIAGNOSTIC - AUTH_CHECK: {
  userId: "uuid-here",
  userEmail: "user@example.com",
  isExpired: false,
  tokenLength: 1234
}
```

## 🔧 Comandos de Debugging Disponibles

Una vez en producción, tienes acceso a estos comandos en la consola:

```javascript
// Test completo del sistema
await productionDiagnostics.runFullDiagnostic()

// Test de conexión básica
await productionDiagnostics.testSupabaseConnection()

// Test específico de storage
await productionDiagnostics.testStorageConnection('server-images')

// Verificar estado de autenticación
await productionDiagnostics.getAuthStatus()

// Mostrar resumen de logs
productionDiagnostics.showDiagnosticSummary()

// Exportar logs para análisis
productionDiagnostics.exportLogs()

// Test de conexión de red
await networkMonitor.testConnection()
```

## 📊 Interpretación de Resultados

### **Escenario 1: Upload Exitoso**
- ✅ `UPLOAD_SUCCESS` en el primer intento
- ✅ Latencia < 5000ms
- ✅ No hay logs de `RETRY_ATTEMPT`

### **Escenario 2: Upload con Retry Exitoso**
- ⚠️ `UPLOAD_TIMEOUT` o `UPLOAD_ERROR` en primer intento
- ✅ `RETRY_ATTEMPT` con `retryAttempt: 1`
- ✅ `UPLOAD_SUCCESS` en segundo o tercer intento

### **Escenario 3: Upload Fallido**
- ❌ `UPLOAD_FINAL_ERROR` después de 3 intentos
- ❌ Posibles causas: problemas de autenticación, CORS, o conectividad

## 🎯 Próximos Pasos si Persiste el Problema

Si después de implementar estas soluciones el problema persiste:

1. **Exportar logs**: `productionDiagnostics.exportLogs()`
2. **Analizar patrones** en los logs exportados
3. **Verificar configuración de Supabase**:
   - CORS settings en el dashboard
   - Storage policies
   - Rate limiting
4. **Considerar alternativas**:
   - Upload directo a Vercel Blob Storage
   - Proxy de upload a través de Vercel Functions
   - Chunked upload para archivos grandes

## 📞 Información de Contacto para Soporte

Si necesitas ayuda adicional, incluye en tu reporte:
- Logs exportados de `productionDiagnostics`
- Screenshots de la consola del navegador
- Información del navegador y dispositivo
- Pasos exactos para reproducir el problema
