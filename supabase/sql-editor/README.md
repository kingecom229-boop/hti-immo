# Scripts SQL pour Supabase — SQL Editor

Ces fichiers permettent d'installer HTI-IMMO **sans la CLI Supabase**, en collant
simplement le code dans **Supabase Dashboard › SQL Editor**.

## Ordre d'exécution

| Ordre | Fichier                                                          | Effet                                                                                                | Modifie des données ?      |
| ----- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------- |
| 1     | [`01_schema_complet.sql`](01_schema_complet.sql)                 | Crée types, tables, contraintes, index, fonctions, triggers, politiques RLS et le bucket de stockage | Non (crée la structure)    |
| 2     | [`02_verifications.sql`](02_verifications.sql)                   | Contrôle l'installation (10 vérifications)                                                           | **Non** — lecture seule    |
| 3     | [`03_premier_administrateur.sql`](03_premier_administrateur.sql) | Attribue le rôle `admin` à **ton** compte                                                            | **Oui** — 1 colonne `role` |

## Mode opératoire

1. `01_schema_complet.sql` → copier tout le contenu → **Run**.
   Résultat attendu : `Success. No rows returned`.
2. `02_verifications.sql` → **Run**. Chaque requête renvoie un statut `OK` ou
   `À CORRIGER`. Tout doit être `OK` avant de continuer.
3. Créer ton compte depuis l'application (page « Créer un compte »), puis
   `03_premier_administrateur.sql` en remplaçant `remplace-moi@exemple.fr` par
   ton adresse.

## Garanties

- **Idempotent** : `01` peut être rejoué sans erreur ni perte de données
  (`create table if not exists`, `drop policy if exists`, `on conflict do nothing`).
- **Aucune destruction** : aucun `drop table`, `drop schema`, `truncate` ni
  `delete` dans `01`.
- **Transactionnel** : chaque migration est encadrée par `BEGIN … COMMIT`.
  En cas d'erreur, le bloc concerné est annulé ; on corrige puis on relance.
- **Validé** : les trois scripts ont été exécutés dans PostgreSQL réel (PGlite),
  y compris le bloc `storage` avec un schéma `storage` simulé.

## Différence avec `supabase/migrations/`

`01_schema_complet.sql` est une **copie fidèle et concaténée** des quatre
migrations versionnées, dans l'ordre. Les deux chemins produisent un schéma
identique.

- **Projet déjà suivi par la CLI** → utiliser `supabase db push`
  (ne pas utiliser ces fichiers, au risque de désynchroniser l'historique).
- **Installation manuelle via le dashboard** → utiliser ces fichiers.

## Ce que ces scripts ne font pas

- Aucune donnée de démonstration en production (`seed.demo.sql` est séparé et
  réservé au local).
- Aucune configuration d'authentification (URL de redirection, SMTP) : cela se
  fait dans le dashboard, voir [`docs/SUPABASE.md`](../../docs/SUPABASE.md).
- Aucun déploiement, aucune connexion à un projet distant.
