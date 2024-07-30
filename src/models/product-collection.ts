import { Column, Entity } from "typeorm";
import { ProductCollection as MedusaProductCollection } from "@medusajs/medusa";

@Entity()
export class ProductCollection extends MedusaProductCollection {
  @Column({ nullable: true })
  bannerImage: string;

  @Column({ nullable: true })
  displaySection: string;

  @Column({ default: 0 })
  displayPriority: number;

  @Column({ default: false })
  isVisible: boolean;
}
