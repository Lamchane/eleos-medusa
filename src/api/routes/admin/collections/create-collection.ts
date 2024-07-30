import { AdminPostCollectionsReq as MedusaAdminPostCollectionsReq } from "@medusajs/medusa/dist/api/routes/admin/collections/create-collection";
import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";

export class AdminPostCollectionsReq extends MedusaAdminPostCollectionsReq {
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
