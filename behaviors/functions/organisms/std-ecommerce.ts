/**
 * std-ecommerce
 *
 * E-commerce organism. Composes molecules via compose:
 * - stdList(Product): product catalog with CRUD
 * - stdCart(CartItem): shopping cart with add/remove
 * - stdWizard(Checkout): checkout wizard
 * - stdList(OrderRecord): order history
 *
 * Cross-orbital connections:
 * - ADD_TO_CART: ProductBrowse -> CartItemCartBrowse
 * - CHECKOUT_STARTED: CartItemCartBrowse -> CheckoutWizard
 * - ORDER_PLACED: CheckoutWizard -> OrderRecordBrowse
 *
 * @level organism
 * @family commerce
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdCart } from '../molecules/std-cart.js';
import { stdWizard } from '../atoms/std-wizard.js';

// ============================================================================
// Params
// ============================================================================

export interface StdEcommerceParams {
  appName?: string;
  productFields?: EntityField[];
  cartItemFields?: EntityField[];
  orderFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_PRODUCT_FIELDS: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'description', type: 'string' },
  { name: 'price', type: 'number', required: true },
  { name: 'category', type: 'string' },
  { name: 'sku', type: 'string' },
  { name: 'inStock', type: 'boolean', default: true },
];

const DEFAULT_CART_ITEM_FIELDS: EntityField[] = [
  { name: 'productName', type: 'string', required: true },
  { name: 'quantity', type: 'number', required: true, default: 1 },
  { name: 'unitPrice', type: 'number', required: true },
  { name: 'totalPrice', type: 'number' },
];

const DEFAULT_ORDER_FIELDS: EntityField[] = [
  { name: 'customerName', type: 'string', required: true },
  { name: 'email', type: 'string', required: true },
  { name: 'shippingAddress', type: 'string', required: true },
  { name: 'paymentMethod', type: 'string', required: true },
  { name: 'orderTotal', type: 'number' },
  { name: 'status', type: 'string', default: 'pending' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdEcommerce(params: StdEcommerceParams): OrbitalSchema {
  const productFields = params.productFields ?? DEFAULT_PRODUCT_FIELDS;
  const cartItemFields = params.cartItemFields ?? DEFAULT_CART_ITEM_FIELDS;
  const orderFields = params.orderFields ?? DEFAULT_ORDER_FIELDS;

  const products = stdList({
    entityName: 'Product',
    fields: productFields,
    pageTitle: 'Products',
    headerIcon: 'package',
    pageName: 'ProductsPage',
    pagePath: '/products',
    isInitial: true,
  });

  const cart = stdCart({
    entityName: 'CartItem',
    fields: cartItemFields,
    pageTitle: 'Shopping Cart',
    headerIcon: 'shopping-cart',
    pageName: 'CartPage',
    pagePath: '/cart',
  });

  const checkout = stdWizard({
    entityName: 'Checkout',
    fields: orderFields,
    wizardTitle: 'Checkout',
    headerIcon: 'credit-card',
    pageName: 'CheckoutPage',
    pagePath: '/checkout',
    steps: [
      { name: 'Customer Info', fields: ['customerName', 'email'] },
      { name: 'Shipping', fields: ['shippingAddress'] },
      { name: 'Payment', fields: ['paymentMethod'] },
    ],
    completeTitle: 'Order Placed',
    completeDescription: 'Your order has been placed successfully.',
    submitButtonLabel: 'Place Order',
  });

  const orderHistory = stdList({
    entityName: 'OrderRecord',
    fields: orderFields,
    pageTitle: 'Order History',
    headerIcon: 'clipboard-list',
    pageName: 'OrdersPage',
    pagePath: '/orders',
  });

  return compose(
    [products, cart, checkout, orderHistory],
    [
      { name: 'ProductsPage', path: '/products', traits: ['ProductBrowse', 'ProductCreate', 'ProductEdit', 'ProductView', 'ProductDelete'], isInitial: true },
      { name: 'CartPage', path: '/cart', traits: ['CartItemCartBrowse', 'CartItemAddItem'] },
      { name: 'CheckoutPage', path: '/checkout', traits: ['CheckoutWizard'] },
      { name: 'OrdersPage', path: '/orders', traits: ['OrderRecordBrowse', 'OrderRecordCreate', 'OrderRecordEdit', 'OrderRecordView', 'OrderRecordDelete'] },
    ],
    [
      { from: 'ProductBrowse', to: 'CartItemCartBrowse', event: { event: 'ADD_TO_CART', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'CartItemCartBrowse', to: 'CheckoutWizard', event: { event: 'CHECKOUT_STARTED', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'CheckoutWizard', to: 'OrderRecordBrowse', event: { event: 'ORDER_PLACED', payload: [{ name: 'id', type: 'string', required: true }] } },
    ],
    params.appName ?? 'EcommerceApp',
  );
}
