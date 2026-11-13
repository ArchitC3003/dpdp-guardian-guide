import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_CATEGORIES, CONSENT_CHANGE_EVENT, CONSENT_STORAGE_KEY, choicesFor, hasConsent, normaliseChoices,
  readConsent, saveConsent, setPreference, setPreferenceCookie, splitChoices,
} from "./consent";

const clearCookies = () => document.cookie.split(";").forEach((c) => {
  const name = c.split("=")[0].trim();
  if (name) document.cookie = `${name}=; path=/; max-age=0`;
});

describe("consent", () => {
  beforeEach(() => { localStorage.clear(); clearCookies(); });

  it("treats no choice as no consent, except for required categories", () => {
    expect(readConsent()).toBeNull();
    expect(hasConsent("functional")).toBe(false);
    expect(hasConsent("strictly_necessary")).toBe(true);
  });

  it("never lets a required category be switched off and ignores unknown ones", () => {
    expect(normaliseChoices({ strictly_necessary: false, functional: true, marketing: true }))
      .toEqual({ strictly_necessary: true, functional: true });
  });

  it("declares only categories that hold a technology", () => {
    for (const c of CONSENT_CATEGORIES) expect(c.technologies.length).toBeGreaterThan(0);
  });

  it("splits a choice into accepted and rejected lists", () => {
    expect(splitChoices(choicesFor(false))).toEqual({ accepted: ["strictly_necessary"], rejected: ["functional"] });
    expect(splitChoices(choicesFor(true)).rejected).toEqual([]);
  });

  it("blocks preference storage until the visitor allows it", () => {
    expect(setPreference("privcybhub-theme-prefs", "x")).toBe(false);
    expect(setPreferenceCookie("sidebar:state", "true", 60)).toBe(false);
    expect(localStorage.getItem("privcybhub-theme-prefs")).toBeNull();
    expect(document.cookie).not.toContain("sidebar:state");

    saveConsent(choicesFor(true), "accept_all");
    expect(setPreference("privcybhub-theme-prefs", "x")).toBe(true);
    expect(setPreferenceCookie("sidebar:state", "true", 60)).toBe(true);
    expect(document.cookie).toContain("sidebar:state=true");
  });

  it("erases stored preferences on withdrawal and announces the change", () => {
    saveConsent(choicesFor(true), "accept_all");
    setPreference("privcybhub-theme-prefs", "x");
    setPreferenceCookie("sidebar:state", "true", 60);
    const heard = vi.fn();
    window.addEventListener(CONSENT_CHANGE_EVENT, heard);

    saveConsent(choicesFor(false), "withdrawn");

    window.removeEventListener(CONSENT_CHANGE_EVENT, heard);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("privcybhub-theme-prefs")).toBeNull();
    expect(document.cookie).not.toContain("sidebar:state");
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!).action).toBe("withdrawn");
    expect(hasConsent("functional")).toBe(false);
  });
});
