import { AdminPostCollectionsCollectionReq as MedusaAdminPostCollectionsCollectionReq } from "@medusajs/medusa/dist/api/routes/admin/collections/update-collection";
import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";

export class AdminPostCollectionsCollectionReq extends MedusaAdminPostCollectionsCollectionReq {
  @IsOptional()
  @IsString()
  bannerImage: string;

  @IsOptional()
  @IsString()
  displaySection: string;

  @IsNumber()
  displayPriority: number;

  @IsBoolean()
  isVisible: boolean;
}
