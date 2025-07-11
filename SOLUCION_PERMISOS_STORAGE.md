# SOLUCIÓN: Error de Permisos en Supabase Storage

## PROBLEMA IDENTIFICADO
```
Error: Fallo al subir el archivo 1.jpg: No tienes permisos para subir archivos a este bucket.
```

Este error indica que **las políticas de seguridad (RLS Policies) de Supabase Storage no están configuradas** para permitir que usuarios autenticados suban archivos.

## PASOS PARA SOLUCIONAR

### 1. VERIFICAR ESTADO DE AUTENTICACIÓN

Primero, en `test-upload.html`, haz clic en **"Verificar Autenticación"** para confirmar que:
- ✅ El usuario está autenticado
- ✅ La sesión es válida
- ✅ Los buckets existen

Si no estás autenticado, ve a `index.html` e inicia sesión primero.

### 2. CONFIGURAR POLÍTICAS DE SEGURIDAD EN SUPABASE

**Ve al Dashboard de Supabase:**
1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

**Ejecuta el archivo SQL:**
1. Abre el archivo `supabase_storage_policies.sql` que he creado
2. Copia todo el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** para ejecutar

### 3. VERIFICAR BUCKETS EN STORAGE

**Ve a Storage en Supabase:**
1. En el Dashboard, ve a **Storage** en el menú lateral
2. Verifica que existan estos buckets:
   - ✅ `server-images`
   - ✅ `server-banners` 
   - ✅ `server-gallery`
   - ✅ `avatars`

**Si no existen, créalos manualmente:**
1. Haz clic en **"New bucket"**
2. Nombre: `server-images`, Público: ✅ Activado
3. Repite para los otros buckets

### 4. VERIFICAR POLÍTICAS RLS

**En Storage > Policies:**
1. Ve a la pestaña **"Policies"** en Storage
2. Deberías ver políticas como:
   - "Usuarios autenticados pueden subir imágenes de servidor"
   - "Imágenes de servidor son públicamente visibles"
   - etc.

**Si no aparecen las políticas:**
- Ejecuta de nuevo el archivo SQL
- Verifica que no haya errores en la consola

### 5. PROBAR DE NUEVO

1. Regresa a `test-upload.html`
2. Haz clic en **"Verificar Autenticación"** de nuevo
3. Intenta subir un archivo
4. Debería funcionar sin errores

## POLÍTICAS CREADAS AUTOMÁTICAMENTE

El archivo SQL crea estas políticas para cada bucket:

### Para INSERT (Subida):
```sql
CREATE POLICY "Usuarios autenticados pueden subir [tipo]"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = '[bucket-name]' 
    AND auth.role() = 'authenticated'
);
```

### Para SELECT (Lectura):
```sql
CREATE POLICY "[Tipo] son públicamente visibles"
ON storage.objects FOR SELECT
USING (bucket_id = '[bucket-name]');
```

### Para UPDATE y DELETE:
```sql
-- Políticas similares para actualizar y eliminar archivos
```

## DIAGNÓSTICO ADICIONAL

### Si sigue sin funcionar:

1. **Verifica en SQL Editor:**
```sql
-- Ver buckets existentes
SELECT * FROM storage.buckets;

-- Ver políticas activas
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

2. **Verifica autenticación en consola del navegador:**
```javascript
// En la consola del navegador
const { data: { session } } = await window.supabaseClient.auth.getSession();
console.log('Sesión:', session);
```

3. **Verifica permisos específicos:**
```javascript
// Probar listar archivos del bucket
const { data, error } = await window.supabaseClient.storage
  .from('server-images')
  .list();
console.log('Lista:', data, 'Error:', error);
```

## ERRORES COMUNES Y SOLUCIONES

### Error: "Bucket not found"
- **Solución**: Crear el bucket manualmente en Storage

### Error: "JWT expired" 
- **Solución**: Cerrar sesión y volver a iniciar sesión

### Error: "RLS policy violation"
- **Solución**: Ejecutar de nuevo el archivo SQL de políticas

### Error: "Invalid bucket name"
- **Solución**: Verificar que los nombres de buckets sean exactos

## VERIFICACIÓN FINAL

Una vez aplicadas las correcciones:

1. ✅ `test-upload.html` debería mostrar "Usuario autenticado"
2. ✅ Los logs deberían mostrar "Permisos de lectura OK" para cada bucket
3. ✅ La subida de archivos debería completarse sin errores
4. ✅ Los archivos deberían aparecer en Storage > [bucket-name]

## ARCHIVOS RELACIONADOS

- `supabase_storage_policies.sql` - Políticas de seguridad completas
- `test-upload.html` - Herramienta de diagnóstico mejorada
- `js/modules/api.js` - Función uploadFile con mejor manejo de errores

## CONTACTO PARA SOPORTE

Si después de seguir estos pasos el problema persiste:
1. Ejecuta `test-upload.html` y copia todos los logs
2. Verifica en Supabase Dashboard > Storage > Policies que las políticas existan
3. Comparte los mensajes de error específicos para diagnóstico adicional
