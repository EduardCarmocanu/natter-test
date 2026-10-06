/** A product page found during discovery. */
export interface ProductPage {
  url: string;
}

/** Product information extracted from a product page. */
export interface Product {
  name: string;
  description: string;
  price: number;
  colors?: string[];
}

/** The final result returned by the pipeline. */
export interface PipelineResult {
  result: Product[];
  total: number
}
