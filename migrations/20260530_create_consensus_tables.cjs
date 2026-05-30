const { Knex } = require("knex");

exports.up = async function(knex) {
  // Create Events table
  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.dateTime('start_time').notNullable();
    table.dateTime('end_time').notNullable();
    table.string('status').defaultTo('upcoming');
  });

  // Create Event Registrations (exhibitions)
  await knex.schema.createTable('event_registrations', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE');
    table.integer('dog_id').unsigned().references('id').inTable('dogs').onDelete('CASCADE');
    table.integer('consensus_score').defaultTo(0);
    table.unique(['event_id', 'dog_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('event_registrations');
  await knex.schema.dropTableIfExists('events');
};
