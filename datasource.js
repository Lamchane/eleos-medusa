const { DataSource } = require("typeorm");

const AppDataSource = new DataSource({
  type: "postgres",
  port: 21575,
  username: "postgres",
  password: "aTTTYJwimxviJKXeDWGXrbFIPcivbGDJ",
  host: "roundhouse.proxy.rlwy.net",
  database: "railway",
  entities: ["dist/models/*.js"],
  migrations: ["dist/migrations/*.js"],
});

module.exports = {
  datasource: AppDataSource,
};
