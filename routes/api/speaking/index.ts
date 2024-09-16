import { Speaking } from "../../../models/Speaking.ts";
import { QueryHandler } from "../../../src/HandlerFactories/QueryHandler.ts";

export const handler = QueryHandler(Speaking);
