-- Param cleanup: drop the dead medianPrice key (removed from the engine in
-- src/model.ts; nothing read it) and seed millMult so every engine param has
-- an explicit D1 default. Safe to re-apply (DELETE is idempotent, INSERT guarded).
DELETE FROM model_params WHERE key = 'medianPrice';
INSERT OR IGNORE INTO model_params VALUES ('millMult','1.0');
