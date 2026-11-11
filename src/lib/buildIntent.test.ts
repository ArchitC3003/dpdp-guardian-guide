import { describe, it, expect, beforeEach } from "vitest";
import { builderPath, clearBuildIntent, isBuilderDocumentType, postSignInPath, saveBuildIntent, saveRouteIntent } from "./buildIntent";

describe("build intent from Learn to the builder", () => {
  beforeEach(() => sessionStorage.clear());
  it("goes to the dashboard when nothing was chosen", () => {
    expect(postSignInPath()).toBe("/dashboard");
  });
  it("opens the builder on the chosen document type after sign-in", () => {
    saveBuildIntent("sop-breach-notification");
    expect(postSignInPath()).toBe("/policy-sop-builder?documentType=sop-breach-notification");
  });
  it("opens the plain builder for an artefact the builder has no type for", () => {
    saveBuildIntent(null);
    expect(postSignInPath()).toBe("/policy-sop-builder");
  });
  it("never turns an unknown value into a destination", () => {
    saveBuildIntent("https://evil.example/x");
    expect(postSignInPath()).toBe("/policy-sop-builder");
    sessionStorage.setItem("privcybhub_build_intent", "//evil.example");
    expect(postSignInPath()).toBe("/policy-sop-builder");
    expect(isBuilderDocumentType("data-privacy-policy")).toBe(true);
    expect(isBuilderDocumentType("data-privacy")).toBe(false);
    expect(builderPath("nope")).toBe("/policy-sop-builder");
  });
  it("forgets the choice once cleared", () => {
    saveBuildIntent("data-privacy-policy"); clearBuildIntent();
    expect(postSignInPath()).toBe("/dashboard");
  });
});

describe("route intent", () => {
  it("resumes an allow-listed stage after sign-in", () => {
    clearBuildIntent(); saveRouteIntent("/assessments", 1000);
    expect(postSignInPath(2000)).toBe("/assessments");
  });
  it("ignores routes that are not allow-listed", () => {
    clearBuildIntent(); saveRouteIntent("https://evil.example/x"); saveRouteIntent("/admin/ai-config");
    expect(postSignInPath()).toBe("/dashboard");
    sessionStorage.setItem("privcybhub_route_intent", JSON.stringify({ route: "/settings", at: Date.now() }));
    expect(postSignInPath()).toBe("/dashboard");
  });
  it("expires", () => {
    clearBuildIntent(); saveRouteIntent("/execute", 0);
    expect(postSignInPath(16 * 60 * 1000)).toBe("/dashboard");
  });
  it("gives way to a build intent and is cleared with it", () => {
    clearBuildIntent(); saveRouteIntent("/execute"); saveBuildIntent(null);
    expect(postSignInPath()).toBe("/policy-sop-builder");
    clearBuildIntent();
    expect(postSignInPath()).toBe("/dashboard");
  });
});
