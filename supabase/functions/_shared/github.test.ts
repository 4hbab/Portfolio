import { describe, expect, it } from "vitest";
import { safeLiveUrl, titleFromRepoName } from "./github";

// Regression: `liveUrl: repo.homepage` was written into the draft unchecked.
// GitHub's homepage field is free text, and anything that is not an absolute
// https URL produced a draft the content schema rejects — which surfaced as the
// studio failing to load the draft it had just saved.
describe("safeLiveUrl", () => {
    it.each([
        ["https://example.com", "https://example.com"],
        ["  https://example.com/app  ", "https://example.com/app"],
    ])("keeps %s", (input, expected) => {
        expect(safeLiveUrl(input)).toBe(expected);
    });

    it.each([
        ["an empty homepage", ""],
        ["whitespace", "   "],
        ["a bare domain", "www.example.com"],
        ["http", "http://example.com"],
        ["a javascript URL", "javascript:alert(1)"],
        ["null", null],
        ["a number", 42],
    ])("drops %s", (_label, input) => {
        expect(safeLiveUrl(input)).toBeUndefined();
    });
});

describe("titleFromRepoName", () => {
    it("turns a repository slug into a readable title", () => {
        expect(titleFromRepoName("coding-playground")).toBe("Coding Playground");
        expect(titleFromRepoName("Crowdfunding_Solidity")).toBe("Crowdfunding Solidity");
    });
});
