import PgsqlDataSource from "../src/dataSource/PgsqlDataSource";

let res = PgsqlDataSource.replacePlaceholders(`INSERT INTO test ("id","list", "a", "create_time", "name", "update_time") VALUES (?,?,?,?,?,?)`, [1, "DEFAULT", "a", "NULL", "hello", "2024-12-30"]);
console.log(res.sql);
console.log(JSON.stringify(res.args));
