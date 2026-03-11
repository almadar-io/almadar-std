/**
 * Healthcare Domain Behaviors
 *
 * Standard behaviors for vital signs, patient intake forms,
 * and prescription management.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * Molecule-first UI composition: all render-ui effects use atom/molecule
 * primitives (stack, typography, icon, button, badge, etc.) instead of
 * organism-level patterns (entity-cards, entity-table, detail-panel, page-header).
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from '../types.js';

// ============================================================================
// Healthcare Domain Design
// ============================================================================

const HEALTHCARE_THEME = {
  name: 'healthcare-rose',
  tokens: {
    colors: {
      primary: '#e11d48',
      'primary-hover': '#be123c',
      'primary-foreground': '#ffffff',
      accent: '#f43f5e',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-vitals - Vital Signs Tracking
// ============================================================================

// Shared main-view effect for vitals browsing
const vitalsMainView: BehaviorEffect[] = [['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'lg',
  children: [
    {
      type: 'stack',
      direction: 'horizontal',
      gap: 'md',
      align: 'center',
      justify: 'between',
      children: [
        {
          type: 'stack',
          direction: 'horizontal',
          gap: 'sm',
          align: 'center',
          children: [
            { type: 'icon', name: 'heart-pulse', size: 'lg', color: 'primary' },
            { type: 'typography', variant: 'h2', text: 'Vital Signs' },
          ],
        },
        {
          type: 'button',
          label: 'Record',
          event: 'RECORD',
          variant: 'primary',
          icon: 'plus',
        },
      ],
    },
    {
      type: 'stack',
      direction: 'horizontal',
      gap: 'md',
      children: [
        { type: 'stats', entity: 'VitalReading' },
        { type: 'line-chart', height: 200, label: 'Trend' },
      ],
    },
    {
      type: 'data-list',
      entity: 'VitalReading',
      itemLayout: {
        type: 'stack',
        direction: 'horizontal',
        gap: 'md',
        align: 'center',
        justify: 'between',
        children: [
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'stethoscope', size: 'md', color: 'primary' },
              { type: 'typography', variant: 'h4', text: '@entity.vitalType' },
            ],
          },
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'xs',
            align: 'baseline',
            children: [
              { type: 'typography', variant: 'body-lg', text: '@entity.value', weight: 'bold' },
              { type: 'typography', variant: 'body-sm', text: '@entity.unit', color: 'muted' },
            ],
          },
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'calendar', size: 'sm', color: 'muted' },
              { type: 'typography', variant: 'body-sm', text: '@entity.recordedAt', color: 'muted' },
            ],
          },
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'user', size: 'sm', color: 'muted' },
              { type: 'typography', variant: 'body-sm', text: '@entity.patientId', color: 'muted' },
            ],
          },
          {
            type: 'button',
            label: 'View',
            event: 'VIEW',
            variant: 'ghost',
            icon: 'eye',
          },
        ],
      },
    },
  ],
}]];

/**
 * std-vitals - Vital signs recording and monitoring.
 * States: browsing -> recording -> viewing
 */
export const VITALS_BEHAVIOR: BehaviorSchema = {
  name: "std-vitals",
  version: "1.0.0",
  description: "Vital signs recording and monitoring dashboard",
  theme: {
    name: "healthcare-rose",
    tokens: {
      colors: {
        primary: "#e11d48",
        "primary-hover": "#be123c",
        "primary-foreground": "#ffffff",
        accent: "#f43f5e",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "VitalsOrbital",
      entity: {
        name: "VitalReading",
        persistence: "persistent",
        collection: "vital_readings",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "vitalType",
            type: "string",
            default: "",
          },
          {
            name: "value",
            type: "number",
            default: 0,
          },
          {
            name: "unit",
            type: "string",
            default: "",
          },
          {
            name: "recordedAt",
            type: "string",
            default: "",
          },
          {
            name: "patientId",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "VitalsControl",
          linkedEntity: "VitalReading",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "recording",
              },
              {
                name: "viewing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "RECORD",
                name: "Record Vitals",
              },
              {
                key: "SAVE",
                name: "Save Reading",
                payloadSchema: [
                  {
                    name: "vitalType",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "value",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "unit",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "VIEW",
                name: "View Reading",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "VitalReading"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          align: "center",
                          justify: "between",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Patient Vitals",
                            },
                            {
                              type: "button",
                              label: "Record Vitals",
                              event: "RECORD",
                              variant: "primary",
                              icon: "plus",
                            },
                          ],
                        },
                        {
                          type: "simple-grid",
                          cols: 4,
                          gap: "md",
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "heart-pulse",
                                      size: "lg",
                                      color: "primary",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h2",
                                      content: "72",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "bpm",
                                      color: "muted",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "xs",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Normal",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "activity",
                                      size: "lg",
                                      color: "primary",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h2",
                                      content: "120/80",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "mmHg",
                                      color: "muted",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "xs",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Normal",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "thermometer",
                                      size: "lg",
                                      color: "primary",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h2",
                                      content: "98.6",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "F",
                                      color: "muted",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "xs",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Normal",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "wind",
                                      size: "lg",
                                      color: "primary",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h2",
                                      content: "98",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "%",
                                      color: "muted",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "xs",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Normal",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Vital History",
                        },
                        {
                          type: "data-list",
                          entity: "VitalReading",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              variant: "ghost",
                              icon: "eye",
                            },
                          ],
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "activity",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.vitalType",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.value",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.unit",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "recording",
                event: "RECORD",
                effects: [
                  ["fetch", "VitalReading"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "thermometer",
                              size: "md",
                              color: "primary",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "Record Vital Signs",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "VitalReading",
                          submitEvent: "SAVE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "vitalType",
                              type: "string",
                            },
                            {
                              name: "value",
                              type: "number",
                            },
                            {
                              name: "unit",
                              type: "string",
                            },
                            {
                              name: "recordedAt",
                              type: "string",
                            },
                            {
                              name: "patientId",
                              type: "string",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "recording",
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.vitalType", "@payload.vitalType"],
                  ["set", "@entity.value", "@payload.value"],
                  ["set", "@entity.unit", "@payload.unit"],
                  ["render-ui", "modal", null],
                  ["fetch", "VitalReading"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          align: "center",
                          justify: "between",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Patient Vitals",
                            },
                            {
                              type: "button",
                              label: "Record Vitals",
                              event: "RECORD",
                              variant: "primary",
                              icon: "plus",
                            },
                          ],
                        },
                        {
                          type: "simple-grid",
                          cols: 4,
                          gap: "md",
                          children: [
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "heart-pulse",
                                      size: "lg",
                                      color: "primary",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h2",
                                      content: "72",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "bpm",
                                      color: "muted",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "xs",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Normal",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "activity",
                                      size: "lg",
                                      color: "primary",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h2",
                                      content: "120/80",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "mmHg",
                                      color: "muted",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "xs",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Normal",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "thermometer",
                                      size: "lg",
                                      color: "primary",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h2",
                                      content: "98.6",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "F",
                                      color: "muted",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "xs",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Normal",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: "card",
                              children: [
                                {
                                  type: "stack",
                                  direction: "vertical",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "wind",
                                      size: "lg",
                                      color: "primary",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h2",
                                      content: "98",
                                    },
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "%",
                                      color: "muted",
                                    },
                                    {
                                      type: "stack",
                                      direction: "horizontal",
                                      gap: "xs",
                                      align: "center",
                                      children: [
                                        {
                                          type: "status-dot",
                                          status: "online",
                                          size: "sm",
                                        },
                                        {
                                          type: "typography",
                                          variant: "caption",
                                          content: "Normal",
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "typography",
                          variant: "h4",
                          content: "Vital History",
                        },
                        {
                          type: "data-list",
                          entity: "VitalReading",
                          itemActions: [
                            {
                              label: "View",
                              event: "VIEW",
                              variant: "ghost",
                              icon: "eye",
                            },
                          ],
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "activity",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.vitalType",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.value",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.unit",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "recording",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "recording",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
                  ["fetch", "VitalReading"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          justify: "between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "md",
                                  color: "primary",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "Vital Reading",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Close",
                              event: "CLOSE",
                              variant: "ghost",
                              icon: "x",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "meter",
                          value: "@entity.value",
                          label: "Current Reading",
                          min: 0,
                          max: 200,
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "md",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "stethoscope",
                                  size: "sm",
                                  color: "muted",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Type",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.vitalType",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "hash",
                                  size: "sm",
                                  color: "muted",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Value",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.value",
                                },
                                {
                                  type: "typography",
                                  variant: "body-sm",
                                  content: "@entity.unit",
                                  color: "muted",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "calendar",
                                  size: "sm",
                                  color: "muted",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Recorded",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.recordedAt",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "user",
                                  size: "sm",
                                  color: "muted",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Patient",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.patientId",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "VitalsPage",
          path: "/vitals",
          isInitial: true,
          traits: [
            {
              ref: "VitalsControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-intake-form - Patient Intake
// ============================================================================

const intakeWizardSteps = [
  { label: 'Patient Info' },
  { label: 'Symptoms' },
  { label: 'Medications' },
];

// Shared idle main-view for intake
const intakeIdleView: BehaviorEffect[] = [['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'lg',
  children: [
    {
      type: 'stack',
      direction: 'horizontal',
      gap: 'md',
      align: 'center',
      justify: 'between',
      children: [
        {
          type: 'stack',
          direction: 'horizontal',
          gap: 'sm',
          align: 'center',
          children: [
            { type: 'icon', name: 'clipboard-list', size: 'lg', color: 'primary' },
            { type: 'typography', variant: 'h2', text: 'Patient Intake' },
          ],
        },
        {
          type: 'button',
          label: 'New Intake',
          action: 'START',
          variant: 'primary',
          icon: 'plus',
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'wizard-progress',
      currentStep: 0,
      steps: intakeWizardSteps,
    },
    { type: 'divider' },
    {
      type: 'data-list',
      entity: 'IntakeForm',
      itemLayout: {
        type: 'stack',
        direction: 'horizontal',
        gap: 'md',
        align: 'center',
        justify: 'between',
        children: [
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'user', size: 'md', color: 'primary' },
              { type: 'typography', variant: 'h4', text: '@entity.patientName' },
            ],
          },
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'calendar', size: 'sm', color: 'muted' },
              { type: 'typography', variant: 'body-sm', text: '@entity.dateOfBirth', color: 'muted' },
            ],
          },
          {
            type: 'badge',
            text: '@entity.symptoms',
            variant: 'outline',
          },
          {
            type: 'button',
            label: 'Refresh',
            action: 'INIT',
            variant: 'ghost',
            icon: 'refresh-cw',
          },
        ],
      },
    },
  ],
}]];

// Shared filling view builder
const intakeFillingView = (currentStep: number): BehaviorEffect[] => [['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'lg',
  children: [
    {
      type: 'stack',
      direction: 'horizontal',
      gap: 'sm',
      align: 'center',
      children: [
        { type: 'icon', name: 'clipboard-list', size: 'lg', color: 'primary' },
        { type: 'typography', variant: 'h2', text: 'Patient Intake' },
      ],
    },
    {
      type: 'wizard-progress',
      currentStep,
      steps: intakeWizardSteps,
    },
    { type: 'divider' },
    {
      type: 'form-section',
      entity: 'IntakeForm',
    },
  ],
}]];

/**
 * std-intake-form - Multi-step patient intake form.
 * States: idle -> filling -> reviewing -> submitted
 */
export const INTAKE_FORM_BEHAVIOR: BehaviorSchema = {
  name: "std-intake-form",
  version: "1.0.0",
  description: "Multi-step patient intake form with review",
  theme: {
    name: "healthcare-rose",
    tokens: {
      colors: {
        primary: "#e11d48",
        "primary-hover": "#be123c",
        "primary-foreground": "#ffffff",
        accent: "#f43f5e",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "IntakeFormOrbital",
      entity: {
        name: "IntakeForm",
        persistence: "persistent",
        collection: "intake_forms",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "patientName",
            type: "string",
            default: "",
          },
          {
            name: "dateOfBirth",
            type: "string",
            default: "",
          },
          {
            name: "symptoms",
            type: "string",
            default: "",
          },
          {
            name: "medications",
            type: "string",
            default: "",
          },
        ],
      },
      traits: [
        {
          name: "IntakeFormControl",
          linkedEntity: "IntakeForm",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "idle",
                isInitial: true,
              },
              {
                name: "filling",
              },
              {
                name: "reviewing",
              },
              {
                name: "submitted",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "START",
                name: "Start Form",
              },
              {
                key: "UPDATE",
                name: "Update Fields",
                payloadSchema: [
                  {
                    name: "patientName",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "symptoms",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "REVIEW",
                name: "Review Form",
              },
              {
                key: "SUBMIT",
                name: "Submit Form",
              },
              {
                key: "BACK",
                name: "Go Back",
              },
            ],
            transitions: [
              {
                from: "idle",
                to: "idle",
                event: "INIT",
                effects: [
                  ["fetch", "IntakeForm"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          align: "center",
                          justify: "between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "clipboard-list",
                                  size: "lg",
                                  color: "primary",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  text: "Patient Intake",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Intake",
                              variant: "primary",
                              icon: "plus",
                              action: "START",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "IntakeForm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "clipboard-list",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.patientName",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.dateOfBirth",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              action: "INIT",
                              variant: "ghost",
                              icon: "eye",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "idle",
                to: "filling",
                event: "START",
                effects: [
                  ["fetch", "IntakeForm"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          text: "Patient Intake",
                        },
                        {
                          type: "wizard-progress",
                          currentStep: 0,
                          steps: [
                            {
                              label: "Demographics",
                            },
                            {
                              label: "Medical History",
                            },
                            {
                              label: "Current Symptoms",
                            },
                            {
                              label: "Review",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Demographics",
                          children: [
                            {
                              type: "form-section",
                              entity: "IntakeForm",
                              fields: [
                                {
                                  name: "patientName",
                                  type: "string",
                                },
                                {
                                  name: "dateOfBirth",
                                  type: "string",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          justify: "end",
                          children: [
                            {
                              type: "button",
                              label: "Continue",
                              variant: "primary",
                              icon: "arrow-right",
                              action: "UPDATE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "filling",
                to: "filling",
                event: "UPDATE",
                effects: [
                  ["fetch", "IntakeForm"],
                  ["set", "@entity.patientName", "@payload.patientName"],
                  ["set", "@entity.symptoms", "@payload.symptoms"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          text: "Patient Intake",
                        },
                        {
                          type: "wizard-progress",
                          currentStep: 1,
                          steps: [
                            {
                              label: "Demographics",
                            },
                            {
                              label: "Medical History",
                            },
                            {
                              label: "Current Symptoms",
                            },
                            {
                              label: "Review",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Medical History",
                          children: [
                            {
                              type: "form-section",
                              entity: "IntakeForm",
                              fields: [
                                {
                                  name: "medications",
                                  type: "string",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "card",
                          title: "Current Symptoms",
                          children: [
                            {
                              type: "form-section",
                              entity: "IntakeForm",
                              fields: [
                                {
                                  name: "symptoms",
                                  type: "string",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          justify: "between",
                          children: [
                            {
                              type: "button",
                              label: "Back",
                              variant: "ghost",
                              icon: "arrow-left",
                              action: "START",
                            },
                            {
                              type: "button",
                              label: "Continue",
                              variant: "primary",
                              icon: "arrow-right",
                              action: "REVIEW",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "filling",
                to: "reviewing",
                event: "REVIEW",
                effects: [
                  ["fetch", "IntakeForm"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          text: "Review Intake",
                        },
                        {
                          type: "wizard-progress",
                          currentStep: 3,
                          steps: [
                            {
                              label: "Demographics",
                            },
                            {
                              label: "Medical History",
                            },
                            {
                              label: "Current Symptoms",
                            },
                            {
                              label: "Review",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Demographics",
                          children: [
                            {
                              type: "stat-display",
                              entity: "IntakeForm",
                              data: [
                                {
                                  label: "Patient Name",
                                  value: "@entity.patientName",
                                  icon: "user",
                                },
                                {
                                  label: "Date of Birth",
                                  value: "@entity.dateOfBirth",
                                  icon: "calendar",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "card",
                          title: "Medical History",
                          children: [
                            {
                              type: "stat-display",
                              entity: "IntakeForm",
                              data: [
                                {
                                  label: "Medications",
                                  value: "@entity.medications",
                                  icon: "pill",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "card",
                          title: "Current Symptoms",
                          children: [
                            {
                              type: "stat-display",
                              entity: "IntakeForm",
                              data: [
                                {
                                  label: "Symptoms",
                                  value: "@entity.symptoms",
                                  icon: "thermometer",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          justify: "between",
                          children: [
                            {
                              type: "button",
                              label: "Back",
                              action: "BACK",
                              variant: "ghost",
                              icon: "arrow-left",
                            },
                            {
                              type: "button",
                              label: "Submit",
                              action: "SUBMIT",
                              variant: "primary",
                              icon: "check",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "reviewing",
                to: "submitted",
                event: "SUBMIT",
                effects: [
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      align: "center",
                      children: [
                        {
                          type: "icon",
                          name: "check-circle",
                          size: "xl",
                          color: "success",
                        },
                        {
                          type: "typography",
                          variant: "h2",
                          text: "Form Submitted",
                        },
                        {
                          type: "typography",
                          variant: "body",
                          text: "The patient intake form has been submitted successfully.",
                          color: "muted",
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stat-display",
                          entity: "IntakeForm",
                          data: [
                            {
                              label: "Patient Name",
                              value: "@entity.patientName",
                              icon: "user",
                            },
                            {
                              label: "Date of Birth",
                              value: "@entity.dateOfBirth",
                              icon: "calendar",
                            },
                            {
                              label: "Symptoms",
                              value: "@entity.symptoms",
                              icon: "thermometer",
                            },
                            {
                              label: "Medications",
                              value: "@entity.medications",
                              icon: "pill",
                            },
                          ],
                        },
                        {
                          type: "button",
                          label: "Back to Intake",
                          action: "BACK",
                          variant: "ghost",
                          icon: "arrow-left",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "reviewing",
                to: "filling",
                event: "BACK",
                effects: [
                  ["fetch", "IntakeForm"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "typography",
                          variant: "h2",
                          text: "Patient Intake",
                        },
                        {
                          type: "wizard-progress",
                          currentStep: 1,
                          steps: [
                            {
                              label: "Demographics",
                            },
                            {
                              label: "Medical History",
                            },
                            {
                              label: "Current Symptoms",
                            },
                            {
                              label: "Review",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "card",
                          title: "Medical History",
                          children: [
                            {
                              type: "form-section",
                              entity: "IntakeForm",
                              fields: [
                                {
                                  name: "medications",
                                  type: "string",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "card",
                          title: "Current Symptoms",
                          children: [
                            {
                              type: "form-section",
                              entity: "IntakeForm",
                              fields: [
                                {
                                  name: "symptoms",
                                  type: "string",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          justify: "between",
                          children: [
                            {
                              type: "button",
                              label: "Back",
                              variant: "ghost",
                              icon: "arrow-left",
                              action: "START",
                            },
                            {
                              type: "button",
                              label: "Continue",
                              variant: "primary",
                              icon: "arrow-right",
                              action: "REVIEW",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "submitted",
                to: "idle",
                event: "BACK",
                effects: [
                  ["fetch", "IntakeForm"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          align: "center",
                          justify: "between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "clipboard-list",
                                  size: "lg",
                                  color: "primary",
                                },
                                {
                                  type: "typography",
                                  variant: "h2",
                                  text: "Patient Intake",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "New Intake",
                              variant: "primary",
                              icon: "plus",
                              action: "START",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "IntakeForm",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "clipboard-list",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.patientName",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.dateOfBirth",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "View",
                              action: "INIT",
                              variant: "ghost",
                              icon: "eye",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "IntakePage",
          path: "/intake",
          isInitial: true,
          traits: [
            {
              ref: "IntakeFormControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-prescription - Prescription Management
// ============================================================================

// Shared main-view effect for prescription browsing
const prescriptionMainView: BehaviorEffect[] = [['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'lg',
  children: [
    {
      type: 'stack',
      direction: 'horizontal',
      gap: 'md',
      align: 'center',
      justify: 'between',
      children: [
        {
          type: 'stack',
          direction: 'horizontal',
          gap: 'sm',
          align: 'center',
          children: [
            { type: 'icon', name: 'pill', size: 'lg', color: 'primary' },
            { type: 'typography', variant: 'h2', text: 'Prescriptions' },
          ],
        },
        {
          type: 'button',
          label: 'New',
          event: 'CREATE',
          variant: 'primary',
          icon: 'plus',
        },
      ],
    },
    {
      type: 'search-input',
      placeholder: 'Search prescriptions...',
      event: 'VIEW',
      icon: 'search',
    },
    { type: 'divider' },
    {
      type: 'data-list',
      entity: 'Prescription',
      itemLayout: {
        type: 'stack',
        direction: 'horizontal',
        gap: 'md',
        align: 'center',
        justify: 'between',
        children: [
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'pill', size: 'md', color: 'primary' },
              { type: 'typography', variant: 'h4', text: '@entity.medication' },
            ],
          },
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'xs',
            align: 'center',
            children: [
              { type: 'badge', label: '@entity.dosage', variant: 'outline' },
              { type: 'badge', label: '@entity.frequency', variant: 'subtle' },
            ],
          },
          {
            type: 'stack',
            direction: 'horizontal',
            gap: 'sm',
            align: 'center',
            children: [
              { type: 'icon', name: 'calendar', size: 'sm', color: 'muted' },
              { type: 'typography', variant: 'body-sm', text: '@entity.startDate', color: 'muted' },
              { type: 'typography', variant: 'body-sm', text: '-', color: 'muted' },
              { type: 'typography', variant: 'body-sm', text: '@entity.endDate', color: 'muted' },
            ],
          },
          {
            type: 'button',
            label: 'View',
            event: 'VIEW',
            variant: 'ghost',
            icon: 'eye',
          },
        ],
      },
    },
  ],
}]];

/**
 * std-prescription - Prescription CRUD.
 * States: browsing -> creating -> viewing
 */
export const PRESCRIPTION_BEHAVIOR: BehaviorSchema = {
  name: "std-prescription",
  version: "1.0.0",
  description: "Prescription management with medication details",
  theme: {
    name: "healthcare-rose",
    tokens: {
      colors: {
        primary: "#e11d48",
        "primary-hover": "#be123c",
        "primary-foreground": "#ffffff",
        accent: "#f43f5e",
        "accent-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  orbitals: [
    {
      name: "PrescriptionOrbital",
      entity: {
        name: "Prescription",
        persistence: "persistent",
        collection: "prescriptions",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "medication",
            type: "string",
            default: "",
          },
          {
            name: "dosage",
            type: "string",
            default: "",
          },
          {
            name: "frequency",
            type: "string",
            default: "",
          },
          {
            name: "startDate",
            type: "string",
            default: "",
          },
          {
            name: "endDate",
            type: "string",
            default: "",
          },
          {
            name: "status",
            type: "string",
            default: "active",
          },
          {
            name: "refillsRemaining",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "PrescriptionControl",
          linkedEntity: "Prescription",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "browsing",
                isInitial: true,
              },
              {
                name: "creating",
              },
              {
                name: "viewing",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "CREATE",
                name: "New Prescription",
              },
              {
                key: "SAVE",
                name: "Save Prescription",
                payloadSchema: [
                  {
                    name: "medication",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "dosage",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "frequency",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "VIEW",
                name: "View Prescription",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "CLOSE",
                name: "Close",
              },
              {
                key: "CANCEL",
                name: "Cancel",
              },
              {
                key: "DELETE",
                name: "Delete Prescription",
                payloadSchema: [
                  {
                    name: "id",
                    type: "string",
                    required: true,
                  },
                ],
              },
            ],
            transitions: [
              {
                from: "browsing",
                to: "browsing",
                event: "INIT",
                effects: [
                  ["fetch", "Prescription"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          align: "center",
                          justify: "between",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Prescriptions",
                            },
                            {
                              type: "button",
                              label: "Add Prescription",
                              event: "CREATE",
                              variant: "primary",
                              icon: "plus",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Prescription",
                          variant: "card",
                          swipeLeftEvent: "DELETE",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "pill",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.medication",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.dosage",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "Refill",
                              event: "VIEW",
                              icon: "refresh-cw",
                            },
                            {
                              label: "View Details",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "browsing",
                to: "creating",
                event: "CREATE",
                effects: [
                  ["fetch", "Prescription"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          children: [
                            {
                              type: "icon",
                              name: "pill",
                              size: "md",
                              color: "primary",
                            },
                            {
                              type: "typography",
                              variant: "h3",
                              content: "New Prescription",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "form-section",
                          entity: "Prescription",
                          submitEvent: "SAVE",
                          cancelEvent: "CANCEL",
                          fields: [
                            {
                              name: "medication",
                              type: "string",
                            },
                            {
                              name: "dosage",
                              type: "string",
                            },
                            {
                              name: "frequency",
                              type: "string",
                            },
                            {
                              name: "startDate",
                              type: "string",
                            },
                            {
                              name: "endDate",
                              type: "string",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "SAVE",
                effects: [
                  ["set", "@entity.medication", "@payload.medication"],
                  ["set", "@entity.dosage", "@payload.dosage"],
                  ["set", "@entity.frequency", "@payload.frequency"],
                  ["render-ui", "modal", null],
                  ["fetch", "Prescription"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          align: "center",
                          justify: "between",
                          children: [
                            {
                              type: "typography",
                              variant: "h2",
                              content: "Prescriptions",
                            },
                            {
                              type: "button",
                              label: "Add Prescription",
                              event: "CREATE",
                              variant: "primary",
                              icon: "plus",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "data-list",
                          entity: "Prescription",
                          variant: "card",
                          swipeLeftEvent: "DELETE",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              justify: "space-between",
                              align: "center",
                              children: [
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "sm",
                                  align: "center",
                                  children: [
                                    {
                                      type: "icon",
                                      name: "pill",
                                      size: "sm",
                                    },
                                    {
                                      type: "typography",
                                      variant: "h4",
                                      content: "@entity.medication",
                                    },
                                  ],
                                },
                                {
                                  type: "stack",
                                  direction: "horizontal",
                                  gap: "md",
                                  align: "center",
                                  children: [
                                    {
                                      type: "typography",
                                      variant: "caption",
                                      content: "@entity.dosage",
                                    },
                                    {
                                      type: "badge",
                                      label: "@entity.status",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                          itemActions: [
                            {
                              label: "Refill",
                              event: "VIEW",
                              icon: "refresh-cw",
                            },
                            {
                              label: "View Details",
                              event: "VIEW",
                              icon: "eye",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "creating",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "viewing",
                event: "VIEW",
                effects: [
                  ["fetch", "Prescription"],
                  [
                    "render-ui",
                    "modal",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          align: "center",
                          justify: "between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "pill",
                                  size: "md",
                                  color: "primary",
                                },
                                {
                                  type: "typography",
                                  variant: "h3",
                                  content: "Prescription Detail",
                                },
                              ],
                            },
                            {
                              type: "button",
                              label: "Close",
                              event: "CLOSE",
                              variant: "ghost",
                              icon: "x",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "vertical",
                          gap: "md",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "pill",
                                  size: "sm",
                                  color: "primary",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Medication",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.medication",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "gauge",
                                  size: "sm",
                                  color: "accent",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Dosage",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.dosage",
                                  variant: "outline",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "clock",
                                  size: "sm",
                                  color: "accent",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Frequency",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.frequency",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "circle-dot",
                                  size: "sm",
                                  color: "primary",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Status",
                                },
                                {
                                  type: "badge",
                                  label: "@entity.status",
                                  variant: "outline",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "calendar",
                                  size: "sm",
                                  color: "muted",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Start",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.startDate",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "calendar-check",
                                  size: "sm",
                                  color: "muted",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "End",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.endDate",
                                },
                              ],
                            },
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              align: "center",
                              children: [
                                {
                                  type: "icon",
                                  name: "refresh-cw",
                                  size: "sm",
                                  color: "muted",
                                },
                                {
                                  type: "typography",
                                  variant: "label",
                                  content: "Refills remaining",
                                },
                                {
                                  type: "typography",
                                  variant: "body",
                                  content: "@entity.refillsRemaining",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CLOSE",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "viewing",
                to: "browsing",
                event: "CANCEL",
                effects: [
                  ["render-ui", "modal", null],
                ],
              },
              {
                from: "browsing",
                to: "browsing",
                event: "DELETE",
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: "PrescriptionsPage",
          path: "/prescriptions",
          isInitial: true,
          traits: [
            {
              ref: "PrescriptionControl",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Healthcare Behaviors
// ============================================================================

export const HEALTHCARE_BEHAVIORS: BehaviorSchema[] = [
  VITALS_BEHAVIOR,
  INTAKE_FORM_BEHAVIOR,
  PRESCRIPTION_BEHAVIOR,
];
