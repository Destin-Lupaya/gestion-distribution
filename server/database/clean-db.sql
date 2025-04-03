-- Suppression de la base de données et nettoyage des tablespaces
SET FOREIGN_KEY_CHECKS = 0;

-- Suppression des tables si elles existent
DROP TABLE IF EXISTS distribution_items;
DROP TABLE IF EXISTS distributions;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS sites;

-- Nettoyage des tablespaces
ALTER TABLE distribution_items DISCARD TABLESPACE;
ALTER TABLE distributions DISCARD TABLESPACE;
ALTER TABLE signatures DISCARD TABLESPACE;
ALTER TABLE recipients DISCARD TABLESPACE;
ALTER TABLE households DISCARD TABLESPACE;
ALTER TABLE items DISCARD TABLESPACE;
ALTER TABLE sites DISCARD TABLESPACE;

SET FOREIGN_KEY_CHECKS = 1;
