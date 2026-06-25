/**
 * @lockin/shared — domain constants, pure helpers, and command schemas shared by
 * the web app and the command layer. Keep this side-effect-free (zod only).
 */

export * from "./commands";
export * from "./schemas";

// XP and Levels were removed from the product (ADR 0010, PRD §10.12 amended).
// Motivation is the streak alone; the level/XP helpers that lived here are gone.
