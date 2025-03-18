import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";

import { Product } from "@medusajs/medusa/dist/models/product";

@Entity()
export class ProductReview extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  product_id: string;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar" })
  user_name: string;

  @Column({ type: "int" })
  rating: number;

  @Column({ type: "text" })
  content: string;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "prod_rev");
  }
}
