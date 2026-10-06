/** A product page found during discovery. */
export interface ProductPage {
  url: string;
}

/** Product information extracted from a product page. */
export interface Product {
  url: string;
  // TODO: add product fields once extraction is designed
}

/** The final result returned by the pipeline. */
export interface PipelineResult {
  products: Product[];
}
