import {
  ProductCollectionDetailsWidgetProps,
  WidgetConfig,
  WidgetProps,
} from "@medusajs/admin";
import {
  useAdminUpdateCollection,
  useAdminCollection,
  useMedusa,
} from "medusa-react";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Container,
  Switch,
  Input,
  Button,
  FocusModal,
  Heading,
  Text,
  Label,
  toast,
} from "@medusajs/ui";
import { PencilSquareSolid } from "@medusajs/icons";
import { FieldValues, useForm } from "react-hook-form";

const CollectionVisualForm = ({ defaultValues, onSubmit }) => {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      isVisible: defaultValues.isVisible,
      displaySection: defaultValues.displaySection,
      displayPriority: defaultValues.displayPriority,
      bannerImage: defaultValues.bannerImage,
    },
  });

  return (
    <FocusModal open={open} onOpenChange={(open) => setOpen(open)}>
      <FocusModal.Trigger asChild>
        <Button>
          <PencilSquareSolid />
          <span>Edit</span>
        </Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FocusModal.Header>
          {/* <Button onClick={handleUpdate}>Save</Button> */}
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center py-16">
          <form
            onSubmit={handleSubmit((formData) => {
              onSubmit(formData);
              setOpen(false);
            })}
            className="flex w-full max-w-lg flex-col gap-y-8"
          >
            <div className="flex flex-col gap-y-1">
              <Heading>Edit Collection Visual Configuration</Heading>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="isVisible" className="text-ui-fg-subtle">
                Should Visible On Storefront?
              </Label>
              <Switch
                id="isVisible"
                defaultChecked={defaultValues.isVisible}
                onCheckedChange={(checked) => setValue("isVisible", checked)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="display_section" className="text-ui-fg-subtle">
                Display Section
              </Label>
              <Input
                id="display_section"
                {...register("displaySection")}
                placeholder="eg: Hero , Body"
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="display_priority" className="text-ui-fg-subtle">
                Display Priority (Higher number == Higher Priority)
              </Label>
              <Input
                id="display_priority"
                type="number"
                {...register("displayPriority")}
                placeholder="eg: Hero , Body"
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="banner_image" className="text-ui-fg-subtle">
                Banner
              </Label>
              <Input
                id="banner_image"
                {...register("bannerImage")}
                placeholder="eg: Hero , Body"
              />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  );
};

const CollectionFeaturedWidget = (
  props: ProductCollectionDetailsWidgetProps
) => {
  const { collection, isLoading } = useAdminCollection(
    props.productCollection.id
  );

  const updateCollection = useAdminUpdateCollection(collection.id);

  const handleUpdate = (formData: FieldValues) => {
    console.log(formData);

    updateCollection.mutate(
      {
        metadata: {
          isVisible: formData.isVisible,
          displaySection: formData.displaySection,
          displayPriority: parseInt(formData.displayPriority),
          bannerImage: formData.bannerImage,
        },
      },
      {
        onSuccess: ({ collection }) => {
          toast.info("Toast title", {
            description: "Toast body",
          });
        },
        onError: (error) => {
          toast.error(error.message, {
            description: "Toast body",
          });
        },
      }
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Container className={"text-ui-fg-subtle p-4"}>
      <div className="flex justify-between items-center">
        <p className="text-2xl font-semibold">Visual Details</p>
        <CollectionVisualForm
          defaultValues={collection.metadata}
          onSubmit={handleUpdate}
        />
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex justify-between items-center">
          <Label>Should Visible On Storefront?</Label>
          <Switch
            checked={(collection.metadata.isVisible as boolean) ?? false}
          />
        </div>

        <div className="flex justify-between items-center">
          <Label>Display Section</Label>
          <Text>{(collection.metadata.displaySection as string) ?? "-"}</Text>
        </div>

        <div className="flex justify-between items-center">
          <Label>Display Priority</Label>
          <Text>{collection.metadata.displayPriority?.toString() ?? 0}</Text>
        </div>

        <div className="flex flex-col justify-between items-center gap-2">
          <Label>Banner</Label>
          {collection.metadata.bannerImage ? (
            <img
              src={(collection.metadata.bannerImage as string) ?? ""}
              alt="banner_image"
              width={1920}
              height={1080}
            />
          ) : (
            <div className="flex justify-center items-center border border-dashed p-12">
              <Text>Upload A Banner</Text>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export const config: WidgetConfig = {
  zone: ["product_collection.details.after"],
};

export default CollectionFeaturedWidget;
