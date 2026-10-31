import type { NextConfig } from "next";

export declare const securityHeaders: { key: string; value: string }[];
export declare function withTroules(config?: NextConfig): NextConfig;
