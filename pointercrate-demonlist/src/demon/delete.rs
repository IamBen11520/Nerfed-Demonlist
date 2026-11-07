use crate::{demon::Demon, error::Result};
use sqlx::PgConnection;

impl Demon {
    /// Deletes a demon and all associated records and creators.
    /// Must run inside a transaction!
    pub async fn delete(self, connection: &mut PgConnection) -> Result<()> {
        let demon_id = self.base.id;
        let position = self.base.position;

        // Allow positions to be temporarily non-consecutive during deletion.
        sqlx::query("SET CONSTRAINTS unique_position DEFERRED")
            .execute(&mut *connection)
            .await?;

        // Delete associated data first so its existing audit triggers run.
        sqlx::query("DELETE FROM records WHERE demon = $1")
            .bind(demon_id)
            .execute(&mut *connection)
            .await?;

        sqlx::query("DELETE FROM creators WHERE demon = $1")
            .bind(demon_id)
            .execute(&mut *connection)
            .await?;

        // The demon deletion audit trigger records the deleted demon.
        sqlx::query("DELETE FROM demons WHERE id = $1")
            .bind(demon_id)
            .execute(&mut *connection)
            .await?;

        // Close the gap in the list positions.
        sqlx::query("UPDATE demons SET position = position - 1 WHERE position > $1")
            .bind(position)
            .execute(&mut *connection)
            .await?;

        // Recalculate scores affected by the deleted demon and its records.
        sqlx::query("SELECT recompute_player_scores()")
            .execute(&mut *connection)
            .await?;

        sqlx::query("SELECT recompute_nation_scores()")
            .execute(&mut *connection)
            .await?;

        sqlx::query("SELECT recompute_subdivision_scores()")
            .execute(&mut *connection)
            .await?;

        // A non-concurrent refresh is permitted inside this transaction.
        sqlx::query("REFRESH MATERIALIZED VIEW player_ranks")
            .execute(&mut *connection)
            .await?;

        Ok(())
    }
}
