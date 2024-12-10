import type { Handler } from "../deps.ts";
import { createItemPipeline, createQueryPipeline } from "./pipeline.ts";

export const QueryHandler = <D>(modelName: string): Handler => (req, ctx) => {
  return createQueryPipeline<D>(modelName, req, ctx).toHttp();
};

export const ItemHandler = <D>(modelName: string): Handler<D> => (req, ctx) => {
  return createItemPipeline<D>(modelName, req, ctx).toHttp();
};
