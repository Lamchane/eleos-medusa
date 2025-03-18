import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class ProductReview1742295621602 implements MigrationInterface {
  name = "ProductReview1742295621602";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the product_review table
    await queryRunner.createTable(
      new Table({
        name: "product_review",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
            isNullable: false,
          },
          {
            name: "product_id",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "title",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "user_name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "rating",
            type: "int",
            isNullable: false,
          },
          {
            name: "content",
            type: "text",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamptz",
            isNullable: false,
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            isNullable: false,
            default: "now()",
          },
        ],
      }),
      true
    );

    // Create a foreign key from product_review.product_id to product.id
    await queryRunner.createForeignKey(
      "product_review",
      new TableForeignKey({
        columnNames: ["product_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get the table to retrieve its foreign keys
    const table = await queryRunner.getTable("product_review");
    if (table) {
      // Find the foreign key on product_id
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("product_id") !== -1
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey("product_review", foreignKey);
      }
    }
    // Drop the product_review table
    await queryRunner.dropTable("product_review");
  }
}
