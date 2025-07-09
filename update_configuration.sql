-- Ejecutar esta consulta en el SQL Editor de Supabase
UPDATE servers
SET configuration = 'Custom'
WHERE configuration IS NULL;