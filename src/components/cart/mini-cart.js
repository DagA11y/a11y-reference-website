import React, { useEffect } from "react"
import { useLocation } from "@reach/router"

import TEXTS from "../../data/texts"
import Heading from "../semantic-heading"
import { useOrder } from "../order"
import DropDown from "../dropdown"
import Link from "../link"
import { useLanguage } from "../language"
import Cart from "./cart"

import "./mini-cart.css"

const MiniCart = () => {
  const { loadOrder } = useOrder()
  const { language } = useLanguage()
  const location = useLocation()

  useEffect(() => {
    loadOrder()
  }, [])

  const { order, numberOfItems, addToCart, subtractFromCart } = useOrder()

  if (location.pathname.includes(`${TEXTS[language].CHECKOUT}`)) {
    return null // Hide cart in checkout
  }

  if (numberOfItems === 0) {
    return null
  }

  const mapProducts = order =>
    Object.keys(order).map(productId => ({
      ...order[productId],
      id: productId,
    }))

  return (
    <DropDown
      buttonText={TEXTS[language].CART_WITH_ITEMS(numberOfItems)}
      className="mini-cart"
    >
      <div className="mini-cart__content">
        <Heading headingLevel={2}>{TEXTS[language].CART}</Heading>
        <Cart
          order={mapProducts(order)}
          addFn={addToCart}
          subtractFn={subtractFromCart}
        />
        <Link
          url={TEXTS[language].PAGES.CHECKOUT_CART.URL}
          title={TEXTS[language].GO_TO_CART}
        />
      </div>
    </DropDown>
  )
}

export default MiniCart
