import {
  ProductCollection,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/medusa";
import { EntityManager, In, JsonContains } from "typeorm";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const manager: EntityManager = req.scope.resolve("manager");
  const collectionsRepo = manager.getRepository(ProductCollection);

  const jsonSearchObject = {};

  jsonSearchObject["isVisible"] = true;

  const displaySection = req.query?.displaySection as string;
  let displaySectionCondition = "";
  if (displaySection) {
    const displaySections = displaySection.split(",");
    const conditions = displaySections.map(
      (section) =>
        `collection.metadata->>'displaySection' LIKE '%${section.trim()}%'`
    );
    displaySectionCondition = conditions.join(" OR ");
  }

  console.log(displaySectionCondition);

  const skip = req.query.offset ?? 0;
  const take = req.query.limit ?? 0;

  const relations = [];
  if (req.query.expand) {
    const expand = req.query.expand as string;
    const expandArray = expand.split(",");
    for (let i = 0; i < expandArray.length; i++) {
      relations.push(expandArray[i]);
    }
  }

  const query = collectionsRepo.createQueryBuilder("collection");

  query.where("collection.metadata @> :jsonSearchObject", {
    jsonSearchObject: JSON.stringify(jsonSearchObject),
  });

  if (displaySectionCondition) {
    query.andWhere(`(${displaySectionCondition})`);
  }

  query
    .orderBy("CAST(collection.metadata->>'displayPriority' AS INTEGER)", "ASC")
    .skip(skip as number)
    .take(take as number);

  if (relations.length > 0) {
    relations.forEach((relation) => {
      query.leftJoinAndSelect(`collection.${relation}`, relation);
    });
  }
  const [collections, count] = await query.getManyAndCount();

  return res.json({
    collections,
    count,
  });
};
