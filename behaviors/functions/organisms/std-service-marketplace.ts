/**
 * std-service-marketplace
 *
 * Service marketplace organism. Composes molecules and atoms via compose:
 * - stdList(Product): product catalog with CRUD
 * - stdServiceOauth(AuthSession): OAuth login with standalone provider picker
 * - stdServicePaymentFlow(OrderPayment): Stripe payment + email receipt
 * - stdList(Order): order history with CRUD
 *
 * Cross-orbital connections:
 * - CHECKOUT: ProductBrowse -> OrderPaymentPayment
 *
 * @level organism
 * @family service
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import { compose } from '@almadar/core/builders';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { stdList } from '../molecules/std-list.js';
import { stdServiceOauth } from '../atoms/std-service-oauth.js';
import { stdServicePaymentFlow } from '../molecules/std-service-payment-flow.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceMarketplaceParams {
  appName?: string;
  productFields?: EntityField[];
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
  { name: 'inStock', type: 'boolean', default: true },
];

const DEFAULT_ORDER_FIELDS: EntityField[] = [
  { name: 'productName', type: 'string', required: true },
  { name: 'amount', type: 'number', required: true },
  { name: 'paymentStatus', type: 'string', default: 'pending' },
  { name: 'orderDate', type: 'string' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdServiceMarketplace(params: StdServiceMarketplaceParams = {}): OrbitalSchema {
  const productFields = params.productFields ?? DEFAULT_PRODUCT_FIELDS;
  const orderFields = params.orderFields ?? DEFAULT_ORDER_FIELDS;

  const products = stdList({
    entityName: 'Product',
    fields: productFields,
    pageTitle: 'Products',
    headerIcon: 'shopping-bag',
    emptyTitle: 'No products yet',
    emptyDescription: 'Add products to build your catalog.',
    pageName: 'ProductsPage',
    pagePath: '/products',
    isInitial: true,
  });

  const login = stdServiceOauth({
    standalone: true,
    pageName: 'LoginPage',
    pagePath: '/login',
  });

  const checkout = stdServicePaymentFlow({
    pageName: 'CheckoutPage',
    pagePath: '/checkout',
  });

  const orders = stdList({
    entityName: 'Order',
    fields: orderFields,
    pageTitle: 'Orders',
    headerIcon: 'list',
    emptyTitle: 'No orders yet',
    emptyDescription: 'Orders will appear here after checkout.',
    pageName: 'OrdersPage',
    pagePath: '/orders',
  });

  const appName = params.appName ?? 'ServiceMarketplace';

  const pages: ComposePage[] = [
    { name: 'ProductsPage', path: '/products', traits: ['ProductBrowse', 'ProductCreate', 'ProductEdit', 'ProductView', 'ProductDelete'], isInitial: true },
    { name: 'LoginPage', path: '/login', traits: ['AuthSessionOauth'] },
    { name: 'CheckoutPage', path: '/checkout', traits: ['OrderPaymentPayment', 'OrderPaymentReceipt'] },
    { name: 'OrdersPage', path: '/orders', traits: ['OrderBrowse', 'OrderCreate', 'OrderEdit', 'OrderView', 'OrderDelete'] },
  ];

  const connections: ComposeConnection[] = [
    { from: 'ProductBrowse', event: { event: 'CHECKOUT', payload: [{ name: 'id', type: 'string', required: true }] }, to: 'OrderPaymentPayment' },
  ];

  const schema = compose(
    [products, login, checkout, orders],
    pages,
    connections,
    appName,
  );

  // Remove orbital-level service declarations for platform services.
  // The validator loads services-registry.json and treats those as globally known.
  // Only custom services (not in the registry) should be declared on orbitals.
  if (schema.orbitals) {
    for (const orbital of schema.orbitals) {
      const o = orbital as unknown as Record<string, unknown>;
      const services = (o.services ?? []) as Array<{ name: string }>;
      o.services = services.filter(s => s.name.startsWith('custom-'));
    }
  }

  const navItems = buildNavItems([
    { name: 'Products', path: '/products' },
    { name: 'Login', path: '/login' },
    { name: 'Checkout', path: '/checkout' },
    { name: 'Orders', path: '/orders' },
  ]);

  return wrapInDashboardLayout(schema, appName, navItems);
}
