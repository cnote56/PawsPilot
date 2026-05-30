import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create Events table
  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.dateTime('start_time').notNullable();
    table.dateTime('end_time').notNullable();
    table.string('status').defaultTo('upcoming'); // upcoming, active, finished
  });

  // Create Event Registrations (exhibitions)
  await knex.schema.createTable('event_registrations', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE');
    table.integer('dog_id').unsigned().references('id').inTable('dogs').onDelete('CASCADE');
    table.integer('consensus_score').defaultTo(0);
    table.unique(['event_id', 'dog_id']); // One dog per event
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('event_registrations');
  await knex.schema.dropTableIfExists('events');
}
