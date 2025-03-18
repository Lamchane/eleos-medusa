import type { WidgetConfig, ProductDetailsWidgetProps } from "@medusajs/admin";
import { useAdminCustomQuery } from "medusa-react";
import { ProductReview } from "src/models/product-review";

import { Container } from "@medusajs/ui";
import { StarSolid } from "@medusajs/icons";

// type RequestQuery = {};

// type ResponseData = {
//   reviews: ProductReview[];
// };

const ProductReviewsWidget = ({
  product,
  notify,
}: ProductDetailsWidgetProps) => {
  const { data, isLoading } = useAdminCustomQuery(
    `/products/${product.id}/reviews`,
    ["reviews", product.id]
  );

  console.log("REVIEWS::\n", data);

  if (isLoading) return <div>Loading reviews...</div>;

  if (data.reviews.length < 1) return <div>No Product Reviews.</div>;

  return (
    <Container className={"text-ui-fg-subtle p-4"}>
      <h1>Product Reviews </h1>

      {data.reviews.map((review) => (
        <div
          key={review.id}
          style={{ marginTop: "10px", marginBottom: "10px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>{review.title}</h3>
            <div style={{ display: "flex" }}>
              {Array(review.rating)
                .fill("")
                .map((_, index) => (
                  <StarSolid
                    key={index}
                    style={{
                      color: "#FFDF00",
                      height: "24px",
                      width: "24px",
                    }}
                  />
                ))}
            </div>
          </div>
          <small style={{ color: "grey" }}>By {review.user_name}</small>
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            {review.content}
          </div>
          <small style={{ color: "grey" }}>
            {new Date(review.created_at ?? new Date()).toLocaleDateString()}
          </small>
        </div>
      ))}
    </Container>
  );
};

export const config: WidgetConfig = {
  zone: "product.details.after",
};

export default ProductReviewsWidget;
