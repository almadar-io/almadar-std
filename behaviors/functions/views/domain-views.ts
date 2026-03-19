/**
 * domain-views
 *
 * Domain-specific view configurations for organism behaviors.
 * Each function returns display customization params that organisms
 * thread through to stdList/stdDetail/stdMessaging molecules.
 *
 * Uses DataGrid/DataList built-in field rendering (displayColumns)
 * instead of custom renderItem templates. This gives proper card styling
 * (shadows, borders, rounded corners), grid layouts, and format support.
 *
 * Field variant reference (DataGrid/DataList):
 *   h3     = card title (large, bold)
 *   h4     = card subtitle (medium, bold)
 *   badge  = inline badge in card header
 *   body   = body field (label: value pair)
 *   caption = small muted text
 *   progress = progress bar
 *
 * Field format reference:
 *   currency = $X.XX
 *   number   = locale-formatted number
 *   date     = formatted date
 *   boolean  = Yes/No
 *   percent  = X%
 *
 * @packageDocumentation
 */

// ============================================================================
// Types
// ============================================================================

export interface DomainViewConfig {
  displayPattern?: string;
  customRenderItem?: unknown;
  displayColumns?: unknown[];
  statsBar?: unknown[];
  displayProps?: Record<string, unknown>;
}

// ============================================================================
// CRM
// ============================================================================

export function crmContactView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'name', variant: 'h3', icon: 'user' },
      { name: 'status', variant: 'badge' },
      { name: 'company', variant: 'body' },
      { name: 'email', variant: 'caption' },
      { name: 'phone', variant: 'caption' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
    statsBar: [
      { type: 'stat-display', label: 'Total Contacts', value: ['array/len', '@entity'], icon: 'users' },
    ],
  };
}

export function crmDealView(): DomainViewConfig {
  return {
    displayPattern: 'data-grid',
    displayColumns: [
      { name: 'title', variant: 'h3', icon: 'briefcase' },
      { name: 'stage', variant: 'badge' },
      { name: 'value', variant: 'h4', format: 'currency' },
      { name: 'contactId', label: 'Contact', variant: 'caption' },
    ],
    displayProps: { cols: 2, gap: 'md' },
  };
}

export function crmNoteView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'subject', variant: 'h4', icon: 'file-text' },
      { name: 'author', variant: 'caption' },
      { name: 'createdAt', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// E-commerce
// ============================================================================

export function ecommerceProductView(): DomainViewConfig {
  return {
    displayPattern: 'data-grid',
    displayColumns: [
      { name: 'name', variant: 'h3', icon: 'package' },
      { name: 'category', variant: 'badge' },
      { name: 'price', variant: 'h4', format: 'currency' },
      { name: 'sku', variant: 'caption' },
      { name: 'inStock', label: 'In Stock', variant: 'body', format: 'boolean' },
    ],
    displayProps: { cols: 3, gap: 'md' },
  };
}

export function ecommerceOrderView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'customerName', label: 'Customer', variant: 'h3', icon: 'clipboard-list' },
      { name: 'status', variant: 'badge' },
      { name: 'orderTotal', label: 'Total', variant: 'h4', format: 'currency' },
      { name: 'email', variant: 'caption' },
      { name: 'shippingAddress', label: 'Address', variant: 'caption' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// Healthcare
// ============================================================================

export function healthcarePatientView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'firstName', variant: 'h3', icon: 'user' },
      { name: 'lastName', variant: 'h3' },
      { name: 'status', variant: 'badge' },
      { name: 'dateOfBirth', label: 'Date of Birth', variant: 'body', format: 'date' },
      { name: 'phone', variant: 'caption' },
      { name: 'insuranceId', label: 'Insurance ID', variant: 'caption' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
    statsBar: [
      { type: 'stat-display', label: 'Total Patients', value: ['array/len', '@entity'], icon: 'users' },
    ],
  };
}

export function healthcareAppointmentView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'patientName', label: 'Patient', variant: 'h3', icon: 'calendar' },
      { name: 'status', variant: 'badge' },
      { name: 'doctorName', label: 'Doctor', variant: 'body' },
      { name: 'date', variant: 'body', format: 'date' },
      { name: 'time', variant: 'caption' },
      { name: 'reason', variant: 'caption' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

export function healthcarePrescriptionView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'medication', variant: 'h3', icon: 'pill' },
      { name: 'dosage', variant: 'badge' },
      { name: 'frequency', variant: 'body' },
      { name: 'patientName', label: 'Patient', variant: 'body' },
      { name: 'prescribedBy', label: 'Prescribed By', variant: 'caption' },
      { name: 'startDate', label: 'Start Date', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// Helpdesk
// ============================================================================

export function helpdeskTicketView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'subject', variant: 'h3', icon: 'inbox' },
      { name: 'priority', variant: 'badge' },
      { name: 'status', variant: 'badge' },
      { name: 'assignee', variant: 'body' },
      { name: 'description', variant: 'caption' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
    statsBar: [
      { type: 'stat-display', label: 'Open Tickets', value: ['array/len', '@entity'], icon: 'inbox' },
    ],
  };
}

export function helpdeskResponseView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'author', variant: 'h4', icon: 'message-circle' },
      { name: 'body', variant: 'body' },
      { name: 'createdAt', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// Project Manager
// ============================================================================

export function projectTaskView(): DomainViewConfig {
  return {
    displayPattern: 'data-grid',
    displayColumns: [
      { name: 'title', variant: 'h3', icon: 'check-square' },
      { name: 'priority', variant: 'badge' },
      { name: 'status', variant: 'badge' },
      { name: 'assignee', variant: 'body' },
      { name: 'storyPoints', label: 'Points', variant: 'body', format: 'number' },
      { name: 'dueDate', label: 'Due', variant: 'caption', format: 'date' },
    ],
    displayProps: { cols: 2, gap: 'md' },
    statsBar: [
      { type: 'stat-display', label: 'Total Tasks', value: ['array/len', '@entity'], icon: 'check-square' },
    ],
  };
}

export function projectSprintView(): DomainViewConfig {
  return {
    displayPattern: 'data-grid',
    displayColumns: [
      { name: 'name', variant: 'h3', icon: 'zap' },
      { name: 'status', variant: 'badge' },
      { name: 'goal', variant: 'body' },
      { name: 'startDate', label: 'Start', variant: 'caption', format: 'date' },
      { name: 'endDate', label: 'End', variant: 'caption', format: 'date' },
      { name: 'taskCount', label: 'Tasks', variant: 'body', format: 'number' },
    ],
    displayProps: { cols: 2, gap: 'md' },
  };
}

// ============================================================================
// Realtime Chat
// ============================================================================

export function chatChannelView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'name', variant: 'h3', icon: 'hash' },
      { name: 'memberCount', label: 'Members', variant: 'badge', format: 'number' },
      { name: 'description', variant: 'body' },
      { name: 'isPrivate', label: 'Private', variant: 'body', format: 'boolean' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

export function chatMessageView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'sender', variant: 'h4' },
      { name: 'content', variant: 'body' },
      { name: 'timestamp', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'message', senderField: 'sender', gap: 'sm' },
  };
}

// ============================================================================
// Finance
// ============================================================================

export function financeTransactionView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'description', variant: 'h3', icon: 'credit-card' },
      { name: 'category', variant: 'badge' },
      { name: 'amount', variant: 'h4', format: 'currency' },
      { name: 'date', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

export function financeReportView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'title', variant: 'h3', icon: 'file-text' },
      { name: 'period', variant: 'badge' },
      { name: 'total', variant: 'h4', format: 'currency' },
      { name: 'generatedAt', label: 'Generated', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// IoT
// ============================================================================

export function iotDeviceView(): DomainViewConfig {
  return {
    displayPattern: 'data-grid',
    displayColumns: [
      { name: 'name', variant: 'h3', icon: 'cpu' },
      { name: 'status', variant: 'badge' },
      { name: 'type', variant: 'body' },
      { name: 'lastSeen', label: 'Last Seen', variant: 'caption', format: 'date' },
    ],
    displayProps: { cols: 3, gap: 'md' },
  };
}

// ============================================================================
// CMS
// ============================================================================

export function cmsArticleView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'title', variant: 'h3', icon: 'file-text' },
      { name: 'status', variant: 'badge' },
      { name: 'author', variant: 'body' },
      { name: 'slug', variant: 'caption' },
      { name: 'publishedAt', label: 'Published', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

export function cmsCategoryView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'name', variant: 'h3', icon: 'folder' },
      { name: 'articleCount', label: 'Articles', variant: 'badge', format: 'number' },
      { name: 'description', variant: 'body' },
      { name: 'slug', variant: 'caption' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

export function cmsMediaView(): DomainViewConfig {
  return {
    displayPattern: 'data-grid',
    displayColumns: [
      { name: 'fileName', label: 'File', variant: 'h3', icon: 'image' },
      { name: 'fileType', label: 'Type', variant: 'badge' },
      { name: 'fileSize', label: 'Size', variant: 'body', format: 'number' },
      { name: 'altText', label: 'Alt Text', variant: 'caption' },
    ],
    displayProps: { cols: 3, gap: 'md' },
  };
}

// ============================================================================
// LMS
// ============================================================================

export function lmsCourseView(): DomainViewConfig {
  return {
    displayPattern: 'data-grid',
    displayColumns: [
      { name: 'title', variant: 'h3', icon: 'book-open' },
      { name: 'level', variant: 'badge' },
      { name: 'instructor', variant: 'body' },
      { name: 'duration', variant: 'body' },
      { name: 'description', variant: 'caption' },
    ],
    displayProps: { cols: 2, gap: 'md' },
  };
}

// ============================================================================
// HR Portal
// ============================================================================

export function hrEmployeeView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'name', variant: 'h3', icon: 'user' },
      { name: 'department', variant: 'badge' },
      { name: 'role', variant: 'body' },
      { name: 'email', variant: 'caption' },
      { name: 'startDate', label: 'Joined', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

export function hrTimeOffView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'employeeName', label: 'Employee', variant: 'h3', icon: 'calendar' },
      { name: 'leaveType', label: 'Type', variant: 'badge' },
      { name: 'status', variant: 'badge' },
      { name: 'startDate', label: 'From', variant: 'body', format: 'date' },
      { name: 'endDate', label: 'To', variant: 'body', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// Trading
// ============================================================================

export function tradingOrderView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'symbol', variant: 'h3', icon: 'trending-up' },
      { name: 'side', variant: 'badge' },
      { name: 'quantity', variant: 'body', format: 'number' },
      { name: 'price', variant: 'h4', format: 'currency' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// API Gateway
// ============================================================================

export function apiRouteView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'method', variant: 'badge' },
      { name: 'path', variant: 'h3', icon: 'git-branch' },
      { name: 'backend', variant: 'body' },
      { name: 'rateLimit', label: 'Rate Limit', variant: 'caption', format: 'number' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// CI/CD
// ============================================================================

export function cicdBuildView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'branch', variant: 'h3', icon: 'git-branch' },
      { name: 'status', variant: 'badge' },
      { name: 'commit', variant: 'body' },
      { name: 'triggeredBy', label: 'Triggered By', variant: 'caption' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// DevOps
// ============================================================================

export function devopsLogView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'message', variant: 'h4', icon: 'file-text' },
      { name: 'level', variant: 'badge' },
      { name: 'service', variant: 'body' },
      { name: 'timestamp', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'compact', gap: 'sm' },
  };
}

// ============================================================================
// Booking
// ============================================================================

export function bookingProviderView(): DomainViewConfig {
  return {
    displayPattern: 'data-grid',
    displayColumns: [
      { name: 'name', variant: 'h3', icon: 'briefcase' },
      { name: 'specialty', variant: 'badge' },
      { name: 'rating', variant: 'body', format: 'number' },
      { name: 'location', variant: 'body' },
      { name: 'phone', variant: 'caption' },
    ],
    displayProps: { cols: 2, gap: 'md' },
  };
}

export function bookingAppointmentView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'customerName', label: 'Customer', variant: 'h3', icon: 'clock' },
      { name: 'status', variant: 'badge' },
      { name: 'providerName', label: 'Provider', variant: 'body' },
      { name: 'date', variant: 'body', format: 'date' },
      { name: 'time', variant: 'caption' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

// ============================================================================
// Social Feed
// ============================================================================

export function socialPostView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'title', variant: 'h3', icon: 'rss' },
      { name: 'likes', variant: 'badge', format: 'number' },
      { name: 'author', variant: 'body' },
      { name: 'content', variant: 'body' },
      { name: 'createdAt', label: 'Posted', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}

export function socialCommentView(): DomainViewConfig {
  return {
    displayPattern: 'data-list',
    displayColumns: [
      { name: 'author', variant: 'h4', icon: 'message-circle' },
      { name: 'body', variant: 'body' },
      { name: 'createdAt', variant: 'caption', format: 'date' },
    ],
    displayProps: { variant: 'card', gap: 'sm' },
  };
}
