import { describe, it, expect } from "vitest";
import { linkify } from "@/lib/linkify";

describe("linkify", () => {
  it("returns a single text token when there's no link", () => {
    expect(linkify("just some notes")).toEqual([
      { type: "text", value: "just some notes" },
    ]);
  });

  it("renders a markdown link with its label as the visible text", () => {
    expect(
      linkify(
        "USACO Guide Silver Week 1 — finish the [5 problems listed here](https://usaco.guide/groups/XiLYcL6kiIzgZr3yHKNf/post/NC1LQTTEIV6u5bLmUfEe)",
      ),
    ).toEqual([
      { type: "text", value: "USACO Guide Silver Week 1 — finish the " },
      {
        type: "link",
        href: "https://usaco.guide/groups/XiLYcL6kiIzgZr3yHKNf/post/NC1LQTTEIV6u5bLmUfEe",
        label: "5 problems listed here",
      },
    ]);
  });

  it("falls back to the URL as the label for a bare URL", () => {
    expect(linkify("see https://example.com/x")).toEqual([
      { type: "text", value: "see " },
      {
        type: "link",
        href: "https://example.com/x",
        label: "https://example.com/x",
      },
    ]);
  });

  it("keeps trailing sentence punctuation out of a bare link", () => {
    expect(linkify("see https://example.com.")).toEqual([
      { type: "text", value: "see " },
      { type: "link", href: "https://example.com", label: "https://example.com" },
      { type: "text", value: "." },
    ]);
  });

  it("handles text on both sides of a markdown link", () => {
    expect(linkify("go [home](http://a.co/x) now")).toEqual([
      { type: "text", value: "go " },
      { type: "link", href: "http://a.co/x", label: "home" },
      { type: "text", value: " now" },
    ]);
  });
});
