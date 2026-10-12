import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ oauth: vi.fn(), getUser: vi.fn(), navigate: vi.fn(), error: vi.fn() }));
vi.mock("@/integrations/lovable/index", () => ({ lovable: { auth: { signInWithOAuth: mocks.oauth } } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser } } }));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
import Auth from "./Auth";

describe("Google authorization lifecycle", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("starts only one authorization while a request is pending", async () => {
    let finish: ((value: { error: Error }) => void) | undefined;
    mocks.oauth.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<Auth />);
    const button = screen.getByRole("button", { name: "Continue with Google" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.oauth).toHaveBeenCalledTimes(1);
    expect(mocks.oauth).toHaveBeenCalledWith("google", { redirect_uri: `${window.location.origin}/auth` });
    await act(async () => finish?.({ error: new Error("State verification failed") }));
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(mocks.oauth).toHaveBeenCalledTimes(2);
  });

  it("keeps the authorization locked after full-page redirect starts", async () => {
    mocks.oauth.mockResolvedValue({ redirected: true, error: null });
    render(<Auth />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => expect(mocks.oauth).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Connecting to Google..." })).toBeDisabled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("enters the dashboard only after the popup session is validated", async () => {
    mocks.oauth.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "signed-in-user" } }, error: null });
    render(<Auth />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
  });

  it("does not enter protected pages when no session user is received", async () => {
    mocks.oauth.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    render(<Auth />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledTimes(1));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});