-- =====================================================
-- POLÍTICAS DE SEGURIDAD PARA SUPABASE STORAGE
-- =====================================================
-- Ejecutar estas consultas en el SQL Editor de Supabase
-- para permitir que usuarios autenticados suban archivos

-- =====================================================
-- 1. CREAR BUCKETS SI NO EXISTEN
-- =====================================================

-- Crear bucket para imágenes de servidores (logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('server-images', 'server-images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para banners de servidores
INSERT INTO storage.buckets (id, name, public)
VALUES ('server-banners', 'server-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para galería de servidores
INSERT INTO storage.buckets (id, name, public)
VALUES ('server-gallery', 'server-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. ELIMINAR POLÍTICAS EXISTENTES (SI LAS HAY)
-- =====================================================

-- Eliminar políticas existentes para server-images
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes de servidor" ON storage.objects;
DROP POLICY IF EXISTS "Imágenes de servidor son públicamente visibles" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus imágenes de servidor" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus imágenes de servidor" ON storage.objects;

-- Eliminar políticas existentes para server-banners
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir banners de servidor" ON storage.objects;
DROP POLICY IF EXISTS "Banners de servidor son públicamente visibles" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus banners de servidor" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus banners de servidor" ON storage.objects;

-- Eliminar políticas existentes para server-gallery
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir galería de servidor" ON storage.objects;
DROP POLICY IF EXISTS "Galería de servidor es públicamente visible" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su galería de servidor" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su galería de servidor" ON storage.objects;

-- Eliminar políticas existentes para avatars
DROP POLICY IF EXISTS "Usuarios pueden subir su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatares son públicamente visibles" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su avatar" ON storage.objects;

-- =====================================================
-- 3. CREAR POLÍTICAS PARA SERVER-IMAGES
-- =====================================================

-- Permitir subida de imágenes de servidor a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir imágenes de servidor"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'server-images' 
    AND auth.role() = 'authenticated'
);

-- Permitir lectura pública de imágenes de servidor
CREATE POLICY "Imágenes de servidor son públicamente visibles"
ON storage.objects FOR SELECT
USING (bucket_id = 'server-images');

-- Permitir actualización de imágenes de servidor a usuarios autenticados
CREATE POLICY "Usuarios pueden actualizar sus imágenes de servidor"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'server-images' 
    AND auth.role() = 'authenticated'
);

-- Permitir eliminación de imágenes de servidor a usuarios autenticados
CREATE POLICY "Usuarios pueden eliminar sus imágenes de servidor"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'server-images' 
    AND auth.role() = 'authenticated'
);

-- =====================================================
-- 4. CREAR POLÍTICAS PARA SERVER-BANNERS
-- =====================================================

-- Permitir subida de banners de servidor a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir banners de servidor"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'server-banners' 
    AND auth.role() = 'authenticated'
);

-- Permitir lectura pública de banners de servidor
CREATE POLICY "Banners de servidor son públicamente visibles"
ON storage.objects FOR SELECT
USING (bucket_id = 'server-banners');

-- Permitir actualización de banners de servidor a usuarios autenticados
CREATE POLICY "Usuarios pueden actualizar sus banners de servidor"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'server-banners' 
    AND auth.role() = 'authenticated'
);

-- Permitir eliminación de banners de servidor a usuarios autenticados
CREATE POLICY "Usuarios pueden eliminar sus banners de servidor"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'server-banners' 
    AND auth.role() = 'authenticated'
);

-- =====================================================
-- 5. CREAR POLÍTICAS PARA SERVER-GALLERY
-- =====================================================

-- Permitir subida de galería de servidor a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir galería de servidor"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'server-gallery' 
    AND auth.role() = 'authenticated'
);

-- Permitir lectura pública de galería de servidor
CREATE POLICY "Galería de servidor es públicamente visible"
ON storage.objects FOR SELECT
USING (bucket_id = 'server-gallery');

-- Permitir actualización de galería de servidor a usuarios autenticados
CREATE POLICY "Usuarios pueden actualizar su galería de servidor"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'server-gallery' 
    AND auth.role() = 'authenticated'
);

-- Permitir eliminación de galería de servidor a usuarios autenticados
CREATE POLICY "Usuarios pueden eliminar su galería de servidor"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'server-gallery' 
    AND auth.role() = 'authenticated'
);

-- =====================================================
-- 6. CREAR POLÍTICAS PARA AVATARS
-- =====================================================

-- Permitir subida de avatares a usuarios autenticados
CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Permitir lectura pública de avatares
CREATE POLICY "Avatares son públicamente visibles"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir actualización de avatares a usuarios autenticados
CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Permitir eliminación de avatares a usuarios autenticados
CREATE POLICY "Usuarios pueden eliminar su avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- =====================================================
-- 7. VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que los buckets existen
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('server-images', 'server-banners', 'server-gallery', 'avatars');

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;
