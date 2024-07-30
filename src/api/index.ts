import { registerOverriddenValidators } from "@medusajs/medusa";
// import { AdminPostCollectionsReq } from "src/api/routes/admin/collections/create-collection";
import { AdminPostCollectionsCollectionReq } from "src/api/routes/admin/collections/update-collection";

// registerOverriddenValidators(AdminPostCollectionsReq);
registerOverriddenValidators(AdminPostCollectionsCollectionReq);
