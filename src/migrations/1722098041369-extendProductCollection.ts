import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class ExtendProductCollection1722098041369
  implements MigrationInterface
{
  name = "ExtendProductCollection1722098041369";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("product_collection", [
      new TableColumn({
        name: "bannerImage",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
      new TableColumn({
        name: "displaySection",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
      new TableColumn({
        name: "displayPriority",
        type: "int",
        default: 0,
      }),
      new TableColumn({
        name: "isVisible",
        type: "boolean",
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns("product_collection", [
      new TableColumn({
        name: "bannerImage",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
      new TableColumn({
        name: "displaySection",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
      new TableColumn({
        name: "displayPriority",
        type: "int",
        default: 0,
      }),
      new TableColumn({
        name: "isVisible",
        type: "boolean",
        default: false,
      }),
    ]);
  }
}
