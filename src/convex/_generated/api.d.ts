/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as demoData from "../demoData.js";
import type * as http from "../http.js";
import type * as langs from "../langs.js";
import type * as n8n from "../n8n.js";
import type * as razorpay from "../razorpay.js";
import type * as responses from "../responses.js";
import type * as seed from "../seed.js";
import type * as tools from "../tools.js";
import type * as users from "../users.js";
import type * as voice from "../voice.js";
import type * as vyapar from "../vyapar.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  demoData: typeof demoData;
  http: typeof http;
  langs: typeof langs;
  n8n: typeof n8n;
  razorpay: typeof razorpay;
  responses: typeof responses;
  seed: typeof seed;
  tools: typeof tools;
  users: typeof users;
  voice: typeof voice;
  vyapar: typeof vyapar;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
