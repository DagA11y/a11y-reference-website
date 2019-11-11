import React from "react"
import Heading from "../semantic-heading"
import { useOrder } from "../order"
import Button from "../button"
import DropDown from "../dropdown/dropdown"

const MiniCart = () => {
  const { order, numberOfItems, subtractFromCart } = useOrder()

  if (numberOfItems === 0) {
    return null
  }

  return (
    <DropDown buttonText={`Cart (${numberOfItems})`}>
      <Heading headingLevel={2}>Shopping Cart</Heading>
      <ul className="cart__list">
        {Object.keys(order).map(key => (
          <li key={key}>
            {order[key].displayName} - {order[key].count}
            <Button onClick={() => subtractFromCart(order[key])}>-</Button>
          </li>
        ))}
      </ul>
    </DropDown>
  )
}

export default MiniCart
