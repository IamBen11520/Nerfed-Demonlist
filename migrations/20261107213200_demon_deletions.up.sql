CREATE TABLE demon_deletions (
    id INTEGER NOT NULL,
    name CITEXT NOT NULL,
    position SMALLINT NOT NULL,
    requirement SMALLINT NOT NULL,
    video VARCHAR(200),
    thumbnail TEXT NOT NULL,
    verifier INTEGER NOT NULL,
    publisher INTEGER NOT NULL
) INHERITS (audit_log2);

CREATE FUNCTION audit_demon_deletion() RETURNS trigger AS $demon_deletion_trigger$
BEGIN
    INSERT INTO demon_deletions (
        userid, id, name, position, requirement,
        video, thumbnail, verifier, publisher
    )
    SELECT
        active_user.id, OLD.id, OLD.name, OLD.position, OLD.requirement,
        OLD.video, OLD.thumbnail, OLD.verifier, OLD.publisher
    FROM active_user
    LIMIT 1;

    RETURN OLD;
END;
$demon_deletion_trigger$ LANGUAGE plpgsql;

CREATE TRIGGER demon_deletion_trigger
AFTER DELETE ON demons
FOR EACH ROW EXECUTE PROCEDURE audit_demon_deletion();
