// import { BeforeInsert, Column, Entity, JoinTable, ManyToMany } from "typeorm";
// import { generateEntityId, SoftDeletableEntity } from "@medusajs/medusa";
// import { ProductCollection } from "../models/product-collection";

// @Entity()
// export class CollectionGroup extends SoftDeletableEntity {
//   @Column()
//   title: string;

//   @Column({ nullable: true })
//   description: string;

//   @Column({ default: false })
//   isVisible: boolean;

//   @Column({ default: 0 })
//   displayPriority: number;

//   @ManyToMany(() => ProductCollection)
//   @JoinTable()
//   collections: ProductCollection[];

//   @BeforeInsert()
//   private beforeInsert(): void {
//     this.id = generateEntityId(this.id, "colg");
//   }
// }
