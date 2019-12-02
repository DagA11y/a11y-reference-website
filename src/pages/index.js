import React from "react"
import { graphql } from "gatsby"
import * as PropTypes from "prop-types"

import App from "../components/app"
import {
  ImageQueryPropType,
  ProductQueryPropType,
} from "../prop-types/product-query"
import { mapProducts } from "../util/products-util"
import ProductCategory from "../components/product-category"
import TEXTS from "../data/texts"
import { useLanguage } from "../components/language"

const IndexPage = ({ data, location }) => {
  const { language } = useLanguage()
  const products = mapProducts(data.allProduct.nodes, data.allFile.nodes)
  return (
    <App location={location} pageTitle={TEXTS[language].HOME}>
      <ProductCategory products={products} />
    </App>
  )
}

IndexPage.propTypes = {
  data: PropTypes.shape({
    allProduct: ProductQueryPropType.allProduct,
    allFile: ImageQueryPropType.allFile,
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }),
}

export const query = graphql`
  query FrontPageQuery($productType: String, $gender: String) {
    allProduct(
      filter: {
        type: { eq: $productType }
        gender: { eq: $gender }
        language: { eq: "en" }
      }
    ) {
      nodes {
        displayName
        id
        imageAlt
        imageName
        language
        price
        type
        gender
        slug
      }
    }
    allFile(filter: { relativeDirectory: { eq: "products" } }) {
      nodes {
        childImageSharp {
          fixed(width: 300, cropFocus: CENTER, height: 350) {
            src
            originalName
          }
        }
      }
    }
  }
`

export default IndexPage
