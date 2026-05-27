import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import {
  handleSearch,
  handleBrands,
  handlePaints,
  handleLookup,
} from "./catalog";

const http = httpRouter();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-api-key, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const handleOptions = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
});

// GET /search?q=&brand=
http.route({
  path: "/search",
  method: "GET",
  handler: handleSearch,
});
http.route({ path: "/search", method: "OPTIONS", handler: handleOptions });

// GET /brands
http.route({
  path: "/brands",
  method: "GET",
  handler: handleBrands,
});
http.route({ path: "/brands", method: "OPTIONS", handler: handleOptions });

// GET /paints?brand=&type=&cursor=
http.route({
  path: "/paints",
  method: "GET",
  handler: handlePaints,
});
http.route({ path: "/paints", method: "OPTIONS", handler: handleOptions });

// GET /lookup?code=&barcode=
http.route({
  path: "/lookup",
  method: "GET",
  handler: handleLookup,
});
http.route({ path: "/lookup", method: "OPTIONS", handler: handleOptions });

export default http;
