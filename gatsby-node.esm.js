import wcag from "./libraries/wcag-as-json/wcag"
import path from "path"

import products from "./src/data/products"
import sizes from "./src/data/sizes"
import credits from "./src/data/credits"
import rules from "./src/data/rules"
import { createProductId } from "./src/util/products-util"
import { capitalizeAllWords } from "./src/util/text-util"
import { createProductUrl, toSlug } from "./src/util/url-util"
import TEXTS from "./src/data/texts"

/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const createBreadcrumbs = (language, gender, type, product) => {
  const breadcrumbs = []
  if (gender) {
    breadcrumbs.push({
      title: TEXTS[language].HOME,
      path: `/${language}/${TEXTS[language].SHOP}`,
    })
    breadcrumbs.push({
      title: capitalizeAllWords(gender),
      path: createProductUrl(language, gender),
    })
  }
  if (type) {
    breadcrumbs.push({
      title: capitalizeAllWords(type),
      path: createProductUrl(language, gender, type),
    })
  }
  if (product) {
    breadcrumbs.push({
      title: capitalizeAllWords(product.displayName),
      path: createProductUrl(language, gender, type, product.displayName),
    })
  }
  return breadcrumbs
}

const getPageTitle = (language, gender, productType, product) => {
  if (product) {
    return capitalizeAllWords(product.displayName)
  } else if (productType) {
    return capitalizeAllWords(productType)
  } else if (gender) {
    return TEXTS[language].PRODUCT_FOR_GENDER_HEADING(gender, language)
  } else {
    return TEXTS[language].HOME
  }
}

const createProductPage = (
  createPage,
  component,
  language,
  gender,
  productType,
  product
) => {
  createPage({
    path: createProductUrl(
      language,
      gender,
      productType,
      product ? product.displayName : undefined
    ),
    component: component,
    context: {
      gender: gender ? gender : undefined,
      langKey: language,
      pageTitle: getPageTitle(language, gender, productType, product),
      productType: productType ? productType : undefined,
      slug: product ? toSlug(product.displayName) : undefined,
      breadcrumbs: createBreadcrumbs(language, gender, productType, product),
    },
  })
}

exports.createPages = ({ graphql, actions }) => {
  const { createPage, createRedirect } = actions
  const ProductListPageByLanguage = path.resolve(
    "./src/page-templates/product-list-by-language-page.js"
  )
  const ProductListPageByGender = path.resolve(
    "./src/page-templates/product-list-by-gender-page.js"
  )
  const ProductListPageByType = path.resolve(
    "./src/page-templates/product-list-by-type-page.js"
  )
  const ProductPage = path.resolve("./src/page-templates/product-page.js")

  createRedirect({
    fromPath: "/v1",
    toPath: "/en/shop/campaign?enableRules=true",
  })
  createRedirect({
    fromPath: "/v2",
    toPath: "/en/shop/campaign?enableRules=false",
  })

  return graphql(
    `
      {
        allProduct {
          nodes {
            description
            displayName
            gender
            id
            imageAlt
            imageName
            language
            price
            sizes {
              id
              label
              name
              value
            }
            type
          }
        }
      }
    `,
    { folder: "products" }
  ).then(result => {
    if (result.errors) {
      throw result.errors
    }

    const products = result.data.allProduct.nodes
    const productsByLanguage = products.reduce(
      (productsByLanguage, product) => ({
        ...productsByLanguage,
        [product.language]: [
          ...(productsByLanguage[product.language] || []),
          product,
        ],
      }),
      {}
    )
    Object.keys(productsByLanguage).forEach(language => {
      createProductPage(createPage, ProductListPageByLanguage, language)
      const productsByGender = productsByLanguage[language].reduce(
        (productsByGender, product) => ({
          ...productsByGender,
          [product.gender]: [
            ...(productsByGender[product.gender] || []),
            product,
          ],
        }),
        {}
      )
      Object.keys(productsByGender).forEach(gender => {
        createProductPage(createPage, ProductListPageByGender, language, gender)
        const productsByType = productsByGender[gender].reduce(
          (productsByType, product) => ({
            ...productsByType,
            [product.type]: [...(productsByType[product.type] || []), product],
          }),
          {}
        )
        Object.keys(productsByType).forEach(type => {
          createProductPage(
            createPage,
            ProductListPageByType,
            language,
            gender,
            type
          )
          productsByType[type].forEach(product => {
            createProductPage(
              createPage,
              ProductPage,
              language,
              gender,
              type,
              product
            )
          })
        })
      })
    })
  })
}

const addProductNodes = (
  products,
  sizes,
  createContentDigest,
  createNode,
  createNodeId
) => {
  products.forEach(({ products, language }) => {
    products.forEach(product => {
      const productNode = {
        campaignPrice: product.campaignPrice,
        description: product.description,
        displayName: product.displayName,
        gender: product.gender,
        id: createNodeId(
          `Product-${language}-${product.gender}-${product.type}-${toSlug(
            product.displayName
          )}`
        ),
        imageAlt: product.imageAlt,
        imageName: product.imageName,
        internal: {
          contentDigest: createContentDigest({
            ...product,
            sizes,
            language,
          }),
          type: "product",
        },
        language,
        price: product.price,
        sizes: sizes[language].map(size => ({
          id: `${createProductId(product)}-${size.id}`,
          label: size.displayName,
          name: `${createProductId(product)}-size`,
          value: size.id,
        })),
        slug: toSlug(product.displayName),
        type: product.type,
        video: product.video,
      }
      createNode(productNode)
    })
  })
}

const addCreditNodes = (
  credits,
  createContentDigest,
  createNode,
  createNodeId
) => {
  credits.forEach(credit => {
    const creditNode = {
      id: createNodeId(`Credit-${credit.userName}`),
      name: credit.name,
      userName: credit.userName,
      imageSrc: credit.imageSrc,
      imageAlt: credit.imageAlt,
      internal: {
        contentDigest: createContentDigest(credit),
        type: "credit",
      },
    }
    createNode(creditNode)
  })
}

const addInternalRuleNodes = (
  rules,
  createContentDigest,
  createNode,
  createNodeId
) => {
  rules.forEach(rule => {
    const { description, title } = rule
    const ruleNode = {
      ...rule,
      id: createNodeId(`Rule-${rule.wcagId}-${toSlug(title)}`),
      key: `${rule.wcagId}-${toSlug(title)}`,
      title,
      description,
      internal: {
        contentDigest: createContentDigest(rule),
        type: "internalRule",
      },
    }
    createNode(ruleNode)
  })
}

const createPrincipleNode = (principle, createContentDigest, createNodeId) => ({
  ...principle,
  id: createNodeId(`Principle-${principle["ref_id"]}`),
  internal: {
    contentDigest: createContentDigest(principle),
    type: "wcagPrinciple",
  },
})

const createGuidelineNode = (
  guideline,
  principle,
  createContentDigest,
  createNodeId
) => ({
  ...guideline,
  id: createNodeId(`Guideline-${guideline["ref_id"]}`),
  principle: principle["ref_id"],
  internal: {
    contentDigest: createContentDigest(guideline),
    type: "wcagGuideline",
  },
})

const createSuccessCriterionNode = (
  successCriterion,
  guideline,
  principle,
  createContentDigest,
  createNodeId
) => ({
  ...successCriterion,
  id: createNodeId(`SuccessCriteria-${successCriterion["ref_id"]}`),
  guideline: guideline["ref_id"],
  principle: principle["ref_id"],
  internal: {
    contentDigest: createContentDigest(successCriterion),
    type: "wcagSuccessCriteria",
  },
})

const addWcagSuccessCriteria = (
  wcag,
  createContentDigest,
  createNode,
  createNodeId
) => {
  wcag.forEach(principle => {
    createNode(
      createPrincipleNode(principle, createContentDigest, createNodeId)
    )
    principle.guidelines.forEach(guideline => {
      createNode(
        createGuidelineNode(
          guideline,
          principle,
          createContentDigest,
          createNodeId
        )
      )
      guideline["success_criteria"].forEach(successCriterion => {
        createNode(
          createSuccessCriterionNode(
            successCriterion,
            guideline,
            principle,
            createContentDigest,
            createNodeId
          )
        )
      })
    })
  })
}

exports.sourceNodes = ({ actions, createContentDigest, createNodeId }) => {
  const { createNode } = actions
  addProductNodes(
    products,
    sizes,
    createContentDigest,
    createNode,
    createNodeId
  )
  addCreditNodes(credits, createContentDigest, createNode, createNodeId)
  addInternalRuleNodes(rules, createContentDigest, createNode, createNodeId)
  addWcagSuccessCriteria(wcag, createContentDigest, createNode, createNodeId)
}
