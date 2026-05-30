exports.up = function(knex) {
  return knex.schema
    .createTable('users', function (table) {
      table.increments('id').primary();
      table.string('username', 255).notNullable().unique();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.timestamps(true, true);
    })
    .createTable('dogs', function (table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('breed', 255);
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
    })
    .createTable('achievements', function (table) {
      table.increments('id').primary();
      table.integer('dog_id').unsigned().notNullable();
      table.foreign('dog_id').references('id').inTable('dogs').onDelete('CASCADE');
      table.string('type', 255).notNullable(); // e.g., 'Sit', 'Stay', 'Milestone'
      table.integer('score').notNullable().defaultTo(0);
      table.timestamp('date_achieved').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('achievements')
    .dropTableIfExists('dogs')
    .dropTableIfExists('users');
};