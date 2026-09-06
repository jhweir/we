import type { EntitySchema } from '@we/backend-shared';
import { CORE_MANIFEST } from '@we/entities/manifest';
import { describe, expect, it } from 'vitest';

import { displayFor, kindFor } from '../src/shared/shapes/recordDisplay';

const sighting: EntitySchema = {
  properties: {
    species: { type: 'string', required: true },
    notes: { type: 'string', control: 'textarea' },
    photo: { type: 'string', format: 'file' },
    attachment: { type: 'string', format: 'file' },
    seenAt: { type: 'datetime' },
    confirmed: { type: 'boolean' },
    count: { type: 'number' },
    status: { type: 'string', options: ['new', 'verified'] },
    link: { type: 'string', control: 'url' },
    extra: { type: 'json' },
  },
  relations: {},
};

describe('displayFor', () => {
  it('derives title, summary and media from a community shape with no hints', () => {
    const display = displayFor({ entity: 'Sighting', schema: sighting, authorable: true, icon: 'binoculars' });
    expect(display.title).toBe('species');
    expect(display.summary).toBe('notes');
    expect(display.media).toBe('photo');
    expect(display.label).toBe('Sighting');
    expect(display.icon).toBe('binoculars');
    expect(display.fields.map((f) => f.name)).toEqual(Object.keys(sighting.properties));
    expect(display.fields.find((f) => f.name === 'species')?.role).toBe('title');
    expect(display.fields.find((f) => f.name === 'count')?.role).toBe('detail');
    expect(display.fields.find((f) => f.name === 'seenAt')?.label).toBe('Seen at');
  });

  it('shows a core entity only what it declares, in that order', () => {
    const post: EntitySchema = {
      properties: {
        version: { type: 'number' },
        title: { type: 'string', required: true },
        body: { type: 'string', control: 'textarea' },
      },
      relations: {},
      authoring: { fields: ['title', 'body'] },
    };
    const display = displayFor({ entity: 'Post', schema: post, authorable: false });
    expect(display.fields.map((f) => f.name)).toEqual(['title', 'body']);
    expect(display.icon).toBe('cube');
  });

  it('lets the declaration override every guess', () => {
    const declared: EntitySchema = {
      ...sighting,
      display: {
        title: 'status',
        summary: 'link',
        media: 'attachment',
        fields: ['status', 'link', 'attachment', 'ghost'],
      },
    };
    const display = displayFor({ entity: 'Sighting', schema: declared, authorable: true });
    expect(display.title).toBe('status');
    expect(display.summary).toBe('link');
    expect(display.media).toBe('attachment');
    // A declared field the entity does not have is a manifest error, not an empty row.
    expect(display.fields.map((f) => f.name)).toEqual(['status', 'link', 'attachment']);
  });

  it('answers with empty roles rather than guessing wrongly', () => {
    const numbers: EntitySchema = { properties: { x: { type: 'number' }, y: { type: 'number' } }, relations: {} };
    const display = displayFor({ entity: 'Point', schema: numbers, authorable: true });
    expect(display.title).toBe('');
    expect(display.summary).toBe('');
    expect(display.media).toBe('');
    expect(display.fields.every((f) => f.role === 'detail')).toBe(true);
  });
});

describe('kindFor', () => {
  it.each([
    ['photo', { type: 'string', format: 'file' }, 'image'],
    ['attachment', { type: 'string', format: 'file' }, 'file'],
    ['status', { type: 'string', options: ['a'] }, 'text'],
    ['notes', { type: 'string', control: 'textarea' }, 'longText'],
    ['site', { type: 'string', control: 'url' }, 'url'],
    ['day', { type: 'string', control: 'date' }, 'date'],
    ['at', { type: 'datetime' }, 'datetime'],
    ['tint', { type: 'string', control: 'color' }, 'color'],
    ['done', { type: 'boolean' }, 'boolean'],
    ['n', { type: 'number' }, 'number'],
    ['blob', { type: 'json' }, 'json'],
    ['name', { type: 'string' }, 'text'],
  ] as const)('%s → %s', (name, property, kind) => {
    expect(kindFor(name, property as never)).toBe(kind);
  });
});

/**
 * A connection is shown even though it cannot be created from the picker.
 *
 * These are two questions and the store answered them with one list. `Relationship` is excluded from
 * `creatableEntities` on purpose — a connection is *drawn* between two things rather than filled in
 * from a form, so offering it there would offer two endpoints nobody had chosen — and `displays` was
 * derived from that list, which quietly made "cannot be created here" mean "cannot be displayed".
 *
 * The symptom was an empty inspector for a connector whose own name was drawn on the line beside it.
 * Nothing failed: the record was found, the panel mounted, and every field read off a display that
 * was `undefined`.
 *
 * Asserted against the manifest rather than against the store, which needs a live space — what is
 * being pinned is that the declaration a display is built from is there and says something useful.
 */
describe('a connection is displayable', () => {
  const relationship = CORE_MANIFEST.entities.Relationship;

  it('is declared, and declares the fields somebody fills in', () => {
    // The premise. Without an `authoring` declaration there would be nothing to derive a display
    // from, and excluding it from the picker would be the whole story rather than half of it.
    expect(relationship).toBeDefined();
    expect(relationship.authoring?.fields).toContain('label');
  });

  it('derives a display with something to read on it', () => {
    const display = displayFor({
      entity: 'Relationship',
      schema: relationship,
      authorable: false,
      icon: 'arrow-right',
    });

    // A title is what the inspector leads with; without one the panel is blank whatever else is on
    // the record. `label` is the connection's own name — the string already drawn on the line.
    expect(display.title).toBe('label');
    expect(display.fields.length).toBeGreaterThan(0);
  });
});
