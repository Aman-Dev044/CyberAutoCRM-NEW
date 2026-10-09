import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Model } from 'mongoose';
import type { ZodType } from 'zod';
import { ApiError, escapeRegex, ok, pagination, parseBody, route, searchParams } from './api';
import { logAudit } from './audit';
import type { Permission } from './rbac';
import type { SessionUser } from './auth';

type PopulateSpec = { path: string; select?: string };

export type CollectionConfig<T> = {
  model: Model<any>;
  entity: string;
  createSchema: ZodType<T>;
  updateSchema: ZodType<Partial<T>>;
  permissions: {
    view: Permission;
    create: Permission;
    update: Permission;
    delete: Permission;
  };
  /** Regex-searched fields for the `?q=` param. */
  searchFields?: string[];
  /** Query params copied straight into the Mongo filter when present. */
  filterFields?: string[];
  /** Params parsed as booleans. */
  booleanFields?: string[];
  populate?: PopulateSpec[];
  defaultSort?: Record<string, 1 | -1>;
  /** Hook to shape the document before create (codes, ownership, defaults). */
  beforeCreate?: (payload: any, user: SessionUser) => Promise<any> | any;
  beforeUpdate?: (payload: any, doc: any, user: SessionUser) => Promise<any> | any;
  afterWrite?: (doc: any, user: SessionUser, action: 'create' | 'update') => Promise<void> | void;
  /** Extra filter forced on every list query (e.g. tenant/own-records scoping). */
  scopeFilter?: (user: SessionUser, req: Request) => Record<string, unknown>;
  label?: (doc: any) => string;
};

function buildFilter<T>(config: CollectionConfig<T>, req: Request, user: SessionUser) {
  const sp = searchParams(req);
  const filter: Record<string, any> = { ...(config.scopeFilter?.(user, req) ?? {}) };

  const q = sp.get('q')?.trim();
  if (q && config.searchFields?.length) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = config.searchFields.map((f) => ({ [f]: rx }));
  }

  config.filterFields?.forEach((field) => {
    const value = sp.get(field);
    if (value && value !== 'ALL') filter[field] = value;
  });

  config.booleanFields?.forEach((field) => {
    const value = sp.get(field);
    if (value === 'true' || value === 'false') filter[field] = value === 'true';
  });

  return filter;
}

export function collectionRoutes<T>(config: CollectionConfig<T>) {
  const GET = route(async ({ req, user }) => {
    const { page, limit, skip } = pagination(req);
    const sp = searchParams(req);
    const filter = buildFilter(config, req, user);

    const sortParam = sp.get('sort');
    const sort: Record<string, 1 | -1> = sortParam
      ? { [sortParam.replace(/^-/, '')]: sortParam.startsWith('-') ? -1 : 1 }
      : (config.defaultSort ?? { createdAt: -1 });

    let query = config.model.find(filter).sort(sort).skip(skip).limit(limit);
    config.populate?.forEach((p) => {
      query = query.populate(p.path, p.select);
    });

    const [items, total] = await Promise.all([
      query.lean(),
      config.model.countDocuments(filter),
    ]);

    return ok({
      items,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  }, { permission: config.permissions.view });

  const POST = route(async ({ req, user }) => {
    const payload = await parseBody(req, config.createSchema);
    const prepared = (await config.beforeCreate?.(payload, user)) ?? payload;
    const doc = await config.model.create({ ...prepared, createdBy: user.id });

    await config.afterWrite?.(doc, user, 'create');
    await logAudit({
      actor: user,
      action: 'CREATE',
      entity: config.entity,
      entityId: String(doc._id),
      summary: `Created ${config.entity} ${config.label?.(doc) ?? ''}`.trim(),
      req,
    });

    return ok(doc, { status: 201 });
  }, { permission: config.permissions.create });

  return { GET, POST };
}

type Ctx = { params: Promise<{ id: string }> };

export function itemRoutes<T>(config: CollectionConfig<T>) {
  const GET = route<Ctx>(async ({ ctx }) => {
    const { id } = await ctx.params;
    let query = config.model.findById(id);
    config.populate?.forEach((p) => {
      query = query.populate(p.path, p.select);
    });
    const doc = await query.lean();
    if (!doc) throw new ApiError(`${config.entity} not found`, 404);
    return ok(doc);
  }, { permission: config.permissions.view });

  const PATCH = route<Ctx>(async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const payload = await parseBody(req, config.updateSchema);
    const doc = await config.model.findById(id);
    if (!doc) throw new ApiError(`${config.entity} not found`, 404);

    const prepared = (await config.beforeUpdate?.(payload, doc, user)) ?? payload;
    Object.assign(doc, prepared);
    await doc.save();

    await config.afterWrite?.(doc, user, 'update');
    await logAudit({
      actor: user,
      action: 'UPDATE',
      entity: config.entity,
      entityId: id,
      summary: `Updated ${config.entity} ${config.label?.(doc) ?? ''}`.trim(),
      meta: { fields: Object.keys(prepared as object) },
      req,
    });

    return ok(doc);
  }, { permission: config.permissions.update });

  const DELETE = route<Ctx>(async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const doc = await config.model.findByIdAndDelete(id);
    if (!doc) throw new ApiError(`${config.entity} not found`, 404);

    await logAudit({
      actor: user,
      action: 'DELETE',
      entity: config.entity,
      entityId: id,
      summary: `Deleted ${config.entity} ${config.label?.(doc) ?? ''}`.trim(),
      req,
    });

    return ok({ deleted: true });
  }, { permission: config.permissions.delete });

  return { GET, PATCH, DELETE };
}
