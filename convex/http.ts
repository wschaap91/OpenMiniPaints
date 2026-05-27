import { httpRouter } from "convex/server";
import {
  handleSearch,
  handleBrands,
  handlePaints,
  handleLookup,
} from "./catalog";

const http = httpRouter();

// GET /search?q=&brand=
http.route({
  path: "/search",
  method: "GET",
  handler: handleSearch,
});

// GET /brands
http.route({
  path: "/brands",
  method: "GET",
  handler: handleBrands,
});

// GET /paints?brand=&type=&cursor=
http.route({
  path: "/paints",
  method: "GET",
  handler: handlePaints,
});

// GET /lookup?code=&barcode=
http.route({
  path: "/lookup",
  method: "GET",
  handler: handleLookup,
});

export default http;
