import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopicPicker } from "./TopicPicker";
import type { Domain } from "@/hooks/useContentTaxonomy";

const domains: Domain[] = [
  { code: "notice", number: 2, name: "Notice", topics: [{ id: "n1", domain_code: "notice", slug: "privacy-notices", name: "Privacy notices", display_order: 10 }] },
  { code: "choice-consent", number: 3, name: "Choice and Consent", topics: [
    { id: "c1", domain_code: "choice-consent", slug: "consent", name: "Consent", display_order: 10 },
    { id: "c2", domain_code: "choice-consent", slug: "withdrawal", name: "Withdrawal", display_order: 20 },
  ] },
];

describe("TopicPicker", () => {
  it("files an unfiled post under the clicked topic as its home", () => {
    const onChange = vi.fn();
    render(<TopicPicker domains={domains} filing={{ topicIds: [], primaryId: null }} onChange={onChange} />);
    expect(screen.getByText(/Not filed yet/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Consent" }));
    expect(onChange).toHaveBeenCalledWith({ topicIds: ["c1"], primaryId: "c1" });
  });
  it("cross-lists across domains and lets another topic become the home", () => {
    const onChange = vi.fn();
    render(<TopicPicker domains={domains} filing={{ topicIds: ["c1", "n1"], primaryId: "c1" }} onChange={onChange} />);
    expect(screen.getByText("Home")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Make home" }));
    expect(onChange).toHaveBeenCalledWith({ topicIds: ["c1", "n1"], primaryId: "n1" });
    fireEvent.click(screen.getByRole("button", { name: "Remove Consent" }));
    expect(onChange).toHaveBeenLastCalledWith({ topicIds: ["n1"], primaryId: "n1" });
  });
  it("offers adding a topic only when a handler is given", () => {
    const onAdd = vi.fn();
    const { rerender } = render(<TopicPicker domains={domains} filing={{ topicIds: [], primaryId: null }} onChange={() => {}} />);
    expect(screen.queryByText("+ New topic")).toBeNull();
    rerender(<TopicPicker domains={domains} filing={{ topicIds: [], primaryId: null }} onChange={() => {}} onAddTopic={onAdd} />);
    fireEvent.click(screen.getAllByText("+ New topic")[1]);
    expect(onAdd).toHaveBeenCalledWith("choice-consent");
  });
});
