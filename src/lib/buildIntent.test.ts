import { describe, it, expect, beforeEach } from "vitest";
import { builderPath, clearBuildIntent, isBuilderDocumentType, postSignInPath, saveBuildIntent } from "./buildIntent";

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
