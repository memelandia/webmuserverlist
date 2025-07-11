# 🔍 Testing del Problema de Tamaño de Archivo

## 📋 Cambios Realizados

### ✅ **Límite de Archivo Aumentado**
- **Antes**: 2MB máximo
- **Ahora**: 10MB máximo (temporalmente para testing)

### ✅ **Logging Detallado Agregado**
- Tamaño de archivo en MB
- Información del entorno
- Logs paso a paso del proceso de upload

### ✅ **Función de Test Disponible**
- `testUpload()` disponible en la consola del navegador
- Funciones de API expuestas globalmente para debugging

## 🧪 Instrucciones de Testing

### **Paso 1: Desplegar los Cambios**
```bash
git add .
git commit -m "Aumentar límite de archivo y agregar logging detallado"
git push origin main
```

### **Paso 2: Testing en Producción**

1. **Ve a la página de agregar servidor**: `https://webmuserverlist.vercel.app/agregar.html`

2. **Abre Developer Tools** (F12) y ve a la pestaña **Console**

3. **Inicia sesión** en la aplicación

4. **Selecciona un archivo** en el campo de logo (cualquier imagen)

5. **Ejecuta el test desde la consola**:
   ```javascript
   // Test directo del upload
   await testUpload()
   ```

### **Paso 3: Observar los Logs**

Deberías ver logs detallados como:
```
🧪 [TEST] Iniciando test de upload...
🧪 [TEST] Archivo seleccionado: mi-imagen.jpg (3.45MB)
🧪 [TEST] Probando uploadFileRobust...
🔍 [PRODUCTION] NETWORK DIAGNOSTIC - UPLOAD_START: {
  fileName: "mi-imagen.jpg",
  fileSize: 3617280,
  fileSizeMB: "3.45",
  fileType: "image/jpeg"
}
🚀 [UPLOAD] Iniciando upload: 1234567890-abc123.jpg (3.45MB) -> server-images
⏳ [UPLOAD] Esperando resultado para: 1234567890-abc123.jpg
```

### **Paso 4: Análisis de Resultados**

#### **Si el archivo es > 2MB y < 10MB:**

**Escenario A - Éxito**:
```
📋 [UPLOAD] Resultado para 1234567890-abc123.jpg: {
  success: true,
  hasData: true,
  hasPath: true
}
✅ [TEST] Upload exitoso: 1234567890-abc123.jpg
```
**→ Confirmado: El problema era el límite de 2MB**

**Escenario B - Timeout**:
```
⏰ [UPLOAD] TIMEOUT después de 15s: 1234567890-abc123.jpg
🔍 [PRODUCTION] NETWORK DIAGNOSTIC - RETRY_ATTEMPT: {
  retryAttempt: 1,
  reason: "Timeout: La subida tardó más de 15 segundos"
}
```
**→ El problema no es solo el tamaño, sino también la conectividad**

**Escenario C - Error de Supabase**:
```
📋 [UPLOAD] Resultado para 1234567890-abc123.jpg: {
  success: false,
  hasData: false,
  hasPath: false,
  errorMessage: "Payload too large"
}
```
**→ Supabase tiene su propio límite de tamaño**

### **Paso 5: Testing Adicional**

Si el test básico funciona, prueba el flujo completo:

1. **Llena el formulario** de agregar servidor
2. **Selecciona archivos** (logo, banner, galería)
3. **Envía el formulario** y observa los logs
4. **Verifica** que se muestren los logs detallados para cada archivo

## 🔧 Comandos de Debugging Disponibles

```javascript
// Test directo de upload
await testUpload()

// Test con archivo específico
await testUpload(document.getElementById('banner-file'))

// Test de conexión
await networkMonitor.testConnection()

// Diagnóstico completo
await productionDiagnostics.runFullDiagnostic()

// Ver funciones disponibles
console.log(window.api)

// Upload manual
await api.uploadFileRobust(file, 'server-images')
```

## 📊 Información a Recopilar

Durante las pruebas, anota:

1. **Tamaño exacto** de los archivos que fallan
2. **Tipo de archivo** (JPEG, PNG, etc.)
3. **Tiempo** antes del timeout
4. **Mensajes de error** específicos
5. **Si funciona en retry** o falla completamente

## 🎯 Próximos Pasos Según Resultados

### **Si el problema se resuelve con 10MB:**
- Ajustar el límite a un valor razonable (ej: 5MB)
- Verificar límites en Supabase Storage
- Implementar compresión de imágenes del lado cliente

### **Si persiste el timeout:**
- Investigar configuración de Vercel Edge Functions
- Considerar upload chunked
- Implementar upload directo a Vercel Blob Storage

### **Si hay errores de Supabase:**
- Verificar configuración de Storage en Supabase
- Revisar políticas de RLS
- Verificar límites de plan de Supabase

## 📞 Información para Reportar

Si el problema persiste, incluye:
- Screenshots de los logs de la consola
- Tamaño exacto de los archivos de prueba
- Navegador y versión
- Cualquier mensaje de error específico
