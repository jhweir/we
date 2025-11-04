import { AIPromptExamples } from '@coasys/ad4m';

// TODO: include examples for all token uses (i.e mapping over store items, picking props, expressions, etc)

export const schemaPrompt = `
🧠 AI Context Prompt for We Schema Generation

You are an expert UI schema generator for the We design system.
Your job is to generate or update JSON schemas that describe UI layouts for the We app.
You are always passed prompts with the following stringified JSON format: 
"{ currentSchema: { ... }, request: "User's request here" }".

And should always respond with the following stringified JSON format: 
"{ updatedSchema: { ... }, response: "Your response here" }".

If you are unable to meet the user's request, explain why in the response field and return null for updatedSchema.

Follow the rules and references below to ensure all schemas are valid and use the design system correctly.

---

1. Schema Structure
A schema is a tree of nodes.
Each node can have:
- type: The component to render (string, e.g. "we-button", "Column", etc.)
- props: An object of props for the component (see component registry below)
- children: An array of child nodes (or strings for text)
- slots: Named slots for advanced composition (optional)
- slot: The name of the slot this node should be rendered into (optional)
- routes: For routing components, an array of nestable route objects (optional)

Example node:
{
  "type": "we-button",
  "props": {
    "p": "300",
    "r": "pill",
    "onClick": { "$action": "routeStore.navigate", "args": ["/"] },
    "styles": { "height": "50px" },
    "hover": { "bg": "ui-100" }
  },
  "children": [
    { "type": "we-icon", "props": { "name": "house" } },
    { "type": "we-text", "props": { "size": "600" }, "children": ["Home"] }
  ]
}

---

2. Component Registry
You can use any of these components as type values.
Each component has specific props (see below).
Always use the correct prop names and value types.

@we/elements
- we-text
- we-button
- we-icon
- we-tabs
- we-tab

@we/components
- Column
- Row
- CircleButton
- IconLabelButton
- PopoverMenu
- PostCard

@we/widgets
- CreateSpaceModalWidget
- SpaceSidebarWidget

@we/pages
- HomePage
- PageNotFound
- SpacePage

@we/templates
- DefaultTemplate
- CenteredTemplate

---

3. Component Props Reference
Common Design System Props (for most components):
- Spacing: gap, p, pl, pr, pt, pb, px, py, m, ml, mr, mt, mb, mx, my
- Radius: r, rt, rb, rl, rr, rtl, rtr, rbr, rbl
- Color: bg, color
- Flex: ax (horizontal alignment), ay (vertical alignment), wrap (boolean), reverse (boolean)
- Custom styles: styles (object, e.g. { width: "100px" })
- Hover state: hover (object, can include any of the above props and/or styles)
- Events: onClick (object, see dynamic logic below)

Component-specific props:
- we-button: All design system props, href, disabled, loading, children
- we-icon: name, color, size, weight, svg, error (all names from phosphor-icons allowed)
- we-text: size, variant, tag, inline, uppercase, color, weight
- Column/Row: All design system props, children
- CircleButton: label, icon, image, onClick, class, styles
- IconLabelButton: icon, label, selected, iconWeight, onClick, class, styles
- PopoverMenu: options, selectedOption, onSelect, class, styles
- PostCard: creator, title, content, class, styles

---

4. Design Tokens
Use these tokens for spacing, color, radius, etc.
Do not use raw CSS values unless using the styles prop.

Spacing (gap, p, m, etc.):
- '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'

Radius:
- 'none', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'pill', 'full'

Color:
- Hues: 'ui', 'primary', 'success', 'warning', 'danger'
- Lightness: '0' (lightest) to '1000' (darkest)

Size:
- 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'

Font:
- Family: 'base'
- Size: 'base', '100' ... '1000'

Effects:
- Depth: 'none', '100', '200', '300', '400', '500'

---

5. Dynamic Logic & Expressions
You can use special tokens in props for dynamic behavior:
- Store reference: { "$store": "storeName.property.path" }
- Conditional logic: { "$if": { "condition": ..., "then": ..., "else": ... } }
- Action/event: { "$action": "storeName.method", "args": [...] }
- Map/foreach: { "$map": { "items": { "$store": "templateStore.templates" }, "select": { ... } } }
- Pick: { "$pick": { "from": { "$store": "userStore.profile" }, "props": ["name", "email"] } }
- Expression: { "$expr": "expression" }

---

6. Example Schema
{
  "type": "we-button",
  "props": {
    "pl": "300",
    "pr": "600",
    "gap": "400",
    "r": "pill",
    "onClick": { "$action": "routeStore.navigate", "args": ["/"] },
    "styles": { "height": "50px" },
    "hover": { "bg": "ui-100" }
  },
  "children": [
    {
      "type": "we-icon",
      "props": {
        "name": "house",
        "color": "ui-1000",
        "weight": {
          "$if": {
            "condition": { "$eq": [ { "$store": "routeStore.currentPath" }, "/" ] },
            "then": "bold",
            "else": "regular"
          }
        }
      }
    },
    {
      "type": "we-text",
      "props": {
        "size": "600",
        "color": "ui-1000",
        "weight": {
          "$if": {
            "condition": { "$eq": [ { "$store": "routeStore.currentPath" }, "/" ] },
            "then": "600",
            "else": "400"
          }
        }
      },
      "children": ["Home"]
    }
  ]
}

---

7. Rules & Best Practices
- Always use the correct prop names and value types for each component.
- Never use null as a value in any children array. Only use valid schema nodes or strings.
- Each item in a children array must be either a valid schema node object or a string. Never mix types or use invalid values.
- Use design tokens for spacing, color, radius, etc. (do not use raw CSS except in styles)
- Use the styles prop for custom inline CSS (e.g., { width: "100px" }).
- Use the hover prop for hover state overrides (can include any design system prop and/or styles).
- Use dynamic logic tokens ($store, $if, $action, etc.) for reactivity and conditional behavior.
- Nest components using children or slots as needed.
- For routes, use the routes array with path and child nodes.
- Do not invent new components or props—use only those in the registry and reference.
- Important: All schemas must be valid JSON with all property names and string values in double quotes.

---

You are now ready to generate or update valid WE schemas based on user conversation.
Always follow the structure, tokens, and rules above.
If you feel confident in your response, return only the JSON schema object without any extra explanation.
If not, ask for clarification.
`;

const example1Schemas = {
  input: {
    meta: { name: 'Twitter Template', description: 'A template for Twitter-like apps.', icon: 'x-logo' },
    type: 'Row',
    props: { bg: 'ui-0', ax: 'center', styles: { width: '100%', height: '100%' } },
    children: [
      {
        type: 'Row',
        props: { bg: 'ui-0', styles: { height: '100%' } },
        children: [
          {
            type: 'Column',
            props: { bg: 'ui-0', py: '400', pr: '600', gap: '300', styles: { width: '275px', height: '100%' } },
            children: [
              {
                type: 'we-button',
                props: {
                  p: '300',
                  r: 'full',
                  color: 'ui-1000',
                  hover: { bg: 'ui-100', p: '500', styles: { width: '500px' } },
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                },
                children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'house',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Home'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'magnifying-glass',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Explore'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/notifications'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'bell',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Notifications'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/messages'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'envelope-simple',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Messages'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  r: 'pill',
                  bg: 'ui-1000',
                  hover: { bg: 'ui-800' },
                  onClick: { $action: 'routeStore.navigate', args: ['/post'] },
                  styles: { width: '100%', height: '50px' },
                },
                children: [
                  { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Post'] },
                ],
              },
            ],
          },
          {
            type: 'Column',
            props: {
              styles: {
                width: '600px',
                height: '100%',
                'border-left': '1px solid var(--we-color-ui-50)',
                'border-right': '1px solid var(--we-color-ui-50)',
              },
            },
            children: [{ type: '$routes' }],
          },
          {
            type: 'Column',
            props: {
              bg: 'ui-0',
              p: '500',
              styles: { width: '350px', height: '100%' },
            },
            children: [
              { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Sidebar right'] },
            ],
          },
        ],
      },
    ],
    routes: [
      {
        path: '/',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-tabs',
            props: { value: { $store: 'routeStore.currentPath' }, fill: true, gap: '400', styles: { width: '100%' } },
            children: [
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'For you',
                  value: '/',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                },
              },
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'Following',
                  value: '/following',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/following'] },
                },
              },
            ],
          },
        ],
      },
      {
        path: '/explore',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-text',
            props: { size: '700', weight: '600' },
            children: ['Explore Page'],
          },
        ],
      },
    ],
  },
  output: {
    meta: { name: 'Twitter Template', description: 'A template for Twitter-like apps.', icon: 'x-logo' },
    type: 'Row',
    props: { bg: 'ui-0', ax: 'center', styles: { width: '100%', height: '100%' } },
    children: [
      {
        type: 'Row',
        props: { bg: 'ui-0', styles: { height: '100%' } },
        children: [
          {
            type: 'Column',
            props: { bg: 'ui-0', py: '400', pr: '600', gap: '300', styles: { width: '275px', height: '100%' } },
            children: [
              {
                type: 'we-button',
                props: {
                  p: '300',
                  r: 'full',
                  color: 'ui-1000',
                  hover: { bg: 'ui-100', p: '500', styles: { width: '500px' } },
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                },
                children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'house',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Dashboard'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'magnifying-glass',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Explore'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/notifications'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'bell',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Notifications'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/messages'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'envelope-simple',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Messages'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  r: 'pill',
                  bg: 'ui-1000',
                  hover: { bg: 'ui-800' },
                  onClick: { $action: 'routeStore.navigate', args: ['/post'] },
                  styles: { width: '100%', height: '50px' },
                },
                children: [
                  { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Post'] },
                ],
              },
            ],
          },
          {
            type: 'Column',
            props: {
              styles: {
                width: '600px',
                height: '100%',
                'border-left': '1px solid var(--we-color-ui-50)',
                'border-right': '1px solid var(--we-color-ui-50)',
              },
            },
            children: [{ type: '$routes' }],
          },
          {
            type: 'Column',
            props: {
              bg: 'ui-0',
              p: '500',
              styles: { width: '350px', height: '100%' },
            },
            children: [
              { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Sidebar right'] },
            ],
          },
        ],
      },
    ],
    routes: [
      {
        path: '/',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-tabs',
            props: { value: { $store: 'routeStore.currentPath' }, fill: true, gap: '400', styles: { width: '100%' } },
            children: [
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'For you',
                  value: '/',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                },
              },
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'Following',
                  value: '/following',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/following'] },
                },
              },
            ],
          },
        ],
      },
      {
        path: '/explore',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-text',
            props: { size: '700', weight: '600' },
            children: ['Explore Page'],
          },
        ],
      },
    ],
  },
};

const example1 = {
  input: `{ "currentSchema": ${JSON.stringify(example1Schemas.input)}, "request": "Please rename the home button in the left sidebar to 'Dashboard'" }`,
  output: `{ "updatedSchema": ${JSON.stringify(example1Schemas.output)}, "response": "No problem, I've made that change for you :)" }`,
};

const example2Schemas = {
  input: {
    meta: { name: 'Twitter Template', description: 'A template for Twitter-like apps.', icon: 'x-logo' },
    type: 'Row',
    props: { bg: 'ui-0', ax: 'center', styles: { width: '100%', height: '100%' } },
    children: [
      {
        type: 'Row',
        props: { bg: 'ui-0', styles: { height: '100%' } },
        children: [
          {
            type: 'Column',
            props: { bg: 'ui-0', py: '400', pr: '600', gap: '300', styles: { width: '275px', height: '100%' } },
            children: [
              {
                type: 'we-button',
                props: {
                  p: '300',
                  r: 'full',
                  color: 'ui-1000',
                  hover: { bg: 'ui-100', p: '500', styles: { width: '500px' } },
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                },
                children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'house',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Home'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'magnifying-glass',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Explore'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/notifications'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'bell',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Notifications'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/messages'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'envelope-simple',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Messages'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  r: 'pill',
                  bg: 'ui-1000',
                  hover: { bg: 'ui-800' },
                  onClick: { $action: 'routeStore.navigate', args: ['/post'] },
                  styles: { width: '100%', height: '50px' },
                },
                children: [
                  { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Post'] },
                ],
              },
            ],
          },
          {
            type: 'Column',
            props: {
              styles: {
                width: '600px',
                height: '100%',
                'border-left': '1px solid var(--we-color-ui-50)',
                'border-right': '1px solid var(--we-color-ui-50)',
              },
            },
            children: [{ type: '$routes' }],
          },
          {
            type: 'Column',
            props: {
              bg: 'ui-0',
              p: '500',
              styles: { width: '350px', height: '100%' },
            },
            children: [
              { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Sidebar right'] },
            ],
          },
        ],
      },
    ],
    routes: [
      {
        path: '/',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-tabs',
            props: { value: { $store: 'routeStore.currentPath' }, fill: true, gap: '400', styles: { width: '100%' } },
            children: [
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'For you',
                  value: '/',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                },
              },
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'Following',
                  value: '/following',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/following'] },
                },
              },
            ],
          },
        ],
      },
      {
        path: '/explore',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-text',
            props: { size: '700', weight: '600' },
            children: ['Explore Page'],
          },
        ],
      },
    ],
  },
  output: {
    meta: { name: 'Twitter Template', description: 'A template for Twitter-like apps.', icon: 'x-logo' },
    type: 'Row',
    props: { bg: 'ui-0', ax: 'center', styles: { width: '100%', height: '100%' } },
    children: [
      {
        type: 'Row',
        props: { bg: 'ui-0', styles: { height: '100%' } },
        children: [
          {
            type: 'Column',
            props: { bg: 'ui-0', py: '400', pr: '600', gap: '300', styles: { width: '275px', height: '100%' } },
            children: [
              {
                type: 'we-button',
                props: {
                  p: '300',
                  r: 'full',
                  color: 'ui-1000',
                  hover: { bg: 'ui-100', p: '500', styles: { width: '500px' } },
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                },
                children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'house',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Home'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'magnifying-glass',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Explore'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/notifications'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'bell',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Notifications'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/messages'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'envelope-simple',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Messages'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  bg: 'ui-1000',
                  hover: { bg: 'ui-800' },
                  onClick: { $action: 'routeStore.navigate', args: ['/post'] },
                  styles: { width: '100%', height: '50px' },
                },
                children: [
                  { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Post'] },
                ],
              },
            ],
          },
          {
            type: 'Column',
            props: {
              styles: {
                width: '600px',
                height: '100%',
                'border-left': '1px solid var(--we-color-ui-50)',
                'border-right': '1px solid var(--we-color-ui-50)',
              },
            },
            children: [{ type: '$routes' }],
          },
          {
            type: 'Column',
            props: {
              bg: 'ui-0',
              p: '500',
              styles: { width: '350px', height: '100%' },
            },
            children: [
              { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Sidebar right'] },
            ],
          },
        ],
      },
    ],
    routes: [
      {
        path: '/',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-tabs',
            props: { value: { $store: 'routeStore.currentPath' }, fill: true, gap: '400', styles: { width: '100%' } },
            children: [
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'For you',
                  value: '/',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                },
              },
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'Following',
                  value: '/following',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/following'] },
                },
              },
            ],
          },
        ],
      },
      {
        path: '/explore',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-text',
            props: { size: '700', weight: '600' },
            children: ['Explore Page'],
          },
        ],
      },
    ],
  },
};

const example2 = {
  input: `{ "currentSchema": ${JSON.stringify(example2Schemas.input)}, "request": "Please make the Post button square instead of rounded" }`,
  output: `{ "updatedSchema": ${JSON.stringify(example2Schemas.output)}, "response": "No problem, I've made that change for you :)" }`,
};

const example3Schemas = {
  input: {
    meta: { name: 'Twitter Template', description: 'A template for Twitter-like apps.', icon: 'x-logo' },
    type: 'Row',
    props: { bg: 'ui-0', ax: 'center', styles: { width: '100%', height: '100%' } },
    children: [
      {
        type: 'Row',
        props: { bg: 'ui-0', styles: { height: '100%' } },
        children: [
          {
            type: 'Column',
            props: { bg: 'ui-0', py: '400', pr: '600', gap: '300', styles: { width: '275px', height: '100%' } },
            children: [
              {
                type: 'we-button',
                props: {
                  p: '300',
                  r: 'full',
                  color: 'ui-1000',
                  hover: { bg: 'ui-100', p: '500', styles: { width: '500px' } },
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                },
                children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'house',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Home'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'magnifying-glass',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Explore'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/notifications'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'bell',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Notifications'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/messages'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'envelope-simple',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Messages'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  r: 'pill',
                  bg: 'ui-1000',
                  hover: { bg: 'ui-800' },
                  onClick: { $action: 'routeStore.navigate', args: ['/post'] },
                  styles: { width: '100%', height: '50px' },
                },
                children: [
                  { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Post'] },
                ],
              },
            ],
          },
          {
            type: 'Column',
            props: {
              styles: {
                width: '600px',
                height: '100%',
                'border-left': '1px solid var(--we-color-ui-50)',
                'border-right': '1px solid var(--we-color-ui-50)',
              },
            },
            children: [{ type: '$routes' }],
          },
          {
            type: 'Column',
            props: {
              bg: 'ui-0',
              p: '500',
              styles: { width: '350px', height: '100%' },
            },
            children: [
              { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Sidebar right'] },
            ],
          },
        ],
      },
    ],
    routes: [
      {
        path: '/',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-tabs',
            props: { value: { $store: 'routeStore.currentPath' }, fill: true, gap: '400', styles: { width: '100%' } },
            children: [
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'For you',
                  value: '/',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                },
              },
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'Following',
                  value: '/following',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/following'] },
                },
              },
            ],
          },
        ],
      },
      {
        path: '/explore',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-text',
            props: { size: '700', weight: '600' },
            children: ['Explore Page'],
          },
        ],
      },
    ],
  },
  output: {
    meta: { name: 'Twitter Template', description: 'A template for Twitter-like apps.', icon: 'x-logo' },
    type: 'Row',
    props: { bg: 'ui-0', ax: 'center', styles: { width: '100%', height: '100%' } },
    children: [
      {
        type: 'Row',
        props: { bg: 'ui-0', styles: { height: '100%' } },
        children: [
          {
            type: 'Column',
            props: { bg: 'ui-0', py: '400', pr: '600', gap: '300', styles: { width: '275px', height: '100%' } },
            children: [
              {
                type: 'we-button',
                props: {
                  p: '300',
                  r: 'full',
                  color: 'ui-1000',
                  hover: { bg: 'ui-100', p: '500', styles: { width: '500px' } },
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                },
                children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'house',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Home'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'magnifying-glass',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Explore'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/notifications'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'bell',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Notifications'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/messages'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'envelope-simple',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Messages'],
                  },
                ],
              },
            ],
          },
          {
            type: 'Column',
            props: {
              styles: {
                width: '600px',
                height: '100%',
                'border-left': '1px solid var(--we-color-ui-50)',
                'border-right': '1px solid var(--we-color-ui-50)',
              },
            },
            children: [{ type: '$routes' }],
          },
          {
            type: 'Column',
            props: {
              bg: 'ui-0',
              p: '500',
              styles: { width: '350px', height: '100%' },
            },
            children: [
              { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Sidebar right'] },
            ],
          },
        ],
      },
    ],
    routes: [
      {
        path: '/',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-tabs',
            props: { value: { $store: 'routeStore.currentPath' }, fill: true, gap: '400', styles: { width: '100%' } },
            children: [
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'For you',
                  value: '/',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                },
              },
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'Following',
                  value: '/following',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/following'] },
                },
              },
            ],
          },
        ],
      },
      {
        path: '/explore',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-text',
            props: { size: '700', weight: '600' },
            children: ['Explore Page'],
          },
        ],
      },
    ],
  },
};

const example3 = {
  input: `{ "currentSchema": ${JSON.stringify(example3Schemas.input)}, "request": "Please delete the Post button" }`,
  output: `{ "updatedSchema": ${JSON.stringify(example3Schemas.output)}, "response": "No problem, I've made that change for you :)" }`,
};

const example4Schemas = {
  input: {
    meta: { name: 'Twitter Template', description: 'A template for Twitter-like apps.', icon: 'x-logo' },
    type: 'Row',
    props: { bg: 'ui-0', ax: 'center', styles: { width: '100%', height: '100%' } },
    children: [
      {
        type: 'Row',
        props: { bg: 'ui-0', styles: { height: '100%' } },
        children: [
          {
            type: 'Column',
            props: { bg: 'ui-0', py: '400', pr: '600', gap: '300', styles: { width: '275px', height: '100%' } },
            children: [
              {
                type: 'we-button',
                props: {
                  p: '300',
                  r: 'full',
                  color: 'ui-1000',
                  hover: { bg: 'ui-100', p: '500', styles: { width: '500px' } },
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                },
                children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'house',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Home'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'magnifying-glass',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/explore'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Explore'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/notifications'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'bell',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: 'fill',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/notifications'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Notifications'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  pl: '300',
                  pr: '600',
                  gap: '400',
                  r: 'pill',
                  onClick: { $action: 'routeStore.navigate', args: ['/messages'] },
                  styles: { height: '50px' },
                  hover: { bg: 'ui-100', styles: { height: '100px' } },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'envelope-simple',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: 'bold',
                          else: 'regular',
                        },
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      size: '600',
                      color: 'ui-1000',
                      weight: {
                        $if: {
                          condition: { $eq: [{ $store: 'routeStore.currentPath' }, '/messages'] },
                          then: '600',
                          else: '400',
                        },
                      },
                    },
                    children: ['Messages'],
                  },
                ],
              },
              {
                type: 'we-button',
                props: {
                  r: 'pill',
                  bg: 'ui-1000',
                  hover: { bg: 'ui-800' },
                  onClick: { $action: 'routeStore.navigate', args: ['/post'] },
                  styles: { width: '100%', height: '50px' },
                },
                children: [
                  { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Post'] },
                ],
              },
            ],
          },
          {
            type: 'Column',
            props: {
              styles: {
                width: '600px',
                height: '100%',
                'border-left': '1px solid var(--we-color-ui-50)',
                'border-right': '1px solid var(--we-color-ui-50)',
              },
            },
            children: [{ type: '$routes' }],
          },
          {
            type: 'Column',
            props: {
              bg: 'ui-0',
              p: '500',
              styles: { width: '350px', height: '100%' },
            },
            children: [
              { type: 'we-text', props: { color: 'ui-0', size: '500', weight: '800' }, children: ['Sidebar right'] },
            ],
          },
        ],
      },
    ],
    routes: [
      {
        path: '/',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-tabs',
            props: { value: { $store: 'routeStore.currentPath' }, fill: true, gap: '400', styles: { width: '100%' } },
            children: [
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'For you',
                  value: '/',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/'] },
                  styles: { height: '50px' },
                },
              },
              {
                type: 'we-tab',
                slot: 'tab',
                props: {
                  label: 'Following',
                  value: '/following',
                  fill: true,
                  onClick: { $action: 'routeStore.navigate', args: ['/following'] },
                },
              },
            ],
          },
        ],
      },
      {
        path: '/explore',
        type: 'Column',
        props: {},
        children: [
          {
            type: 'we-text',
            props: { size: '700', weight: '600' },
            children: ['Explore Page'],
          },
        ],
      },
    ],
  },
  output: null,
};

const example4 = {
  input: `{ "currentSchema": ${JSON.stringify(example4Schemas.input)}, "request": "asdfjasdf jasdfjhasdf rras" }`,
  output: `{ "updatedSchema": ${JSON.stringify(example4Schemas.output)}, "response": "Sorry, I couldn't understand your prompt. Please try rephrasing it." }`,
};

export const schemaPromptExamples: AIPromptExamples[] = [example1, example2, example3, example4];
