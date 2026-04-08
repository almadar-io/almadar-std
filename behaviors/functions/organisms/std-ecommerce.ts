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
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposePage } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdCart } from '../molecules/std-cart.js';
import { stdWizard } from '../atoms/std-wizard.js';
import { ecommerceProductView, ecommerceOrderView } from '../views/domain-views.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

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
  { name: 'status', type: 'string', default: 'pending', values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
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
    emptyTitle: 'No products yet',
    emptyDescription: 'Add products to build your catalog.',
    pageName: 'ProductsPage',
    pagePath: '/products',
    isInitial: true,
    ...ecommerceProductView(),
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
    emptyTitle: 'No orders yet',
    emptyDescription: 'Orders will appear here as customers complete checkout.',
    pageName: 'OrdersPage',
    pagePath: '/orders',
    ...ecommerceOrderView(),
  });

  const appName = params.appName ?? 'EcommerceApp';



  const pages: ComposePage[] = [
      { name: 'ProductsPage', path: '/products', traits: ['ProductBrowse', 'ProductCreate', 'ProductEdit', 'ProductView', 'ProductDelete'], isInitial: true },
      { name: 'CartPage', path: '/cart', traits: ['CartItemCartBrowse', 'CartItemAddItem'] },
      { name: 'CheckoutPage', path: '/checkout', traits: ['CheckoutWizard'] },
      { name: 'OrdersPage', path: '/orders', traits: ['OrderRecordBrowse', 'OrderRecordCreate', 'OrderRecordEdit', 'OrderRecordView', 'OrderRecordDelete'] },
    ];



  const schema = compose(


    [products, cart, checkout, orderHistory],


    pages,


    [
      { from: 'ProductBrowse', to: 'CartItemCartBrowse', event: { event: 'ADD_TO_CART', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'CartItemCartBrowse', to: 'CheckoutWizard', event: { event: 'CHECKOUT_STARTED', payload: [{ name: 'id', type: 'string', required: true }] } },
      { from: 'CheckoutWizard', to: 'OrderRecordBrowse', event: { event: 'ORDER_PLACED', payload: [{ name: 'id', type: 'string', required: true }] } },
    ],


    appName,


  );


  return wrapInDashboardLayout(schema, appName, buildNavItems(pages));
}
