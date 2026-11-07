import { describe, expect, it } from "vitest";
import { buildTailoredCv } from "./tailored";
import { latexEscape, renderTailoredLatex, skillLineWarnings } from "./tailoredLatex";

const master = {
    name: "Test Person",
    links: [{ label: "GitHub", display: "github.com/example", url: "https://github.com/example" }],
    roles: [{
        id: "job", role: "Engineer", period: "2024 – Present", company: "Acme", location: "Remote",
        bullets: [{ id: "a", text: "Did A & B at 100%." }, { id: "b", text: "Did B." }],
        defaultBullets: ["a"],
    }],
    projects: [{
        id: "p", title: "Project", tagline: "A thing", url: "https://example.com", stack: "Go",
        bullets: [{ id: "x", text: "Built x." }, { id: "y", text: "Built y." }], defaultBullets: ["x"],
    }],
    skillLines: [{ id: "lang", label: "Languages", skills: ["Python", "Ruby", "Go"] }],
    defaultSkillLines: ["lang"],
    education: [{ text: "BSc, Uni – CGPA 4.00", date: "2024" }],
    publications: [],
    activities: [{ id: "h", title: "Hackathon", detail: "1st", date: "2025" }],
};
const contact = { email: "test@example.com", phone: "+1 555", location: "Dhaka" };
const tailoring = { company: "Co", role: "Backend Engineer", summary: "Backend engineer." };

describe("tailored CV", () => {
    it("selects bullets, projects and lead skills by id", () => {
        const cv = buildTailoredCv(master, { ...tailoring, bullets: { job: ["b", "a"], p: ["y"] }, projects: ["p"], leadSkills: ["Go", "Ruby"] }, contact);
        expect(cv.roles[0].bullets.map((b) => b.id)).toEqual(["b", "a"]);
        expect(cv.projects[0].bullets.map((b) => b.id)).toEqual(["y"]);
        expect(cv.skillLines[0].skills).toEqual(["Go", "Ruby", "Python"]);
    });

    it("falls back to defaults", () => {
        const cv = buildTailoredCv(master, { ...tailoring, projects: ["p"] }, contact);
        expect(cv.roles[0].bullets.map((b) => b.id)).toEqual(["a"]);
        expect(cv.projects[0].bullets.map((b) => b.id)).toEqual(["x"]);
        expect(cv.activities.map((a) => a.id)).toEqual(["h"]);
    });

    it("refuses facts that are not in the master", () => {
        expect(() => buildTailoredCv(master, { ...tailoring, bullets: { job: ["invented"] } }, contact)).toThrow(/Unknown bullet/);
        expect(() => buildTailoredCv(master, { ...tailoring, leadSkills: ["Rust"] }, contact)).toThrow(/Unknown skill/);
        expect(() => buildTailoredCv(master, { ...tailoring, bullets: { other: ["a"] } }, contact)).toThrow(/Unknown role or project/);
        expect(() => buildTailoredCv(master, { ...tailoring, projects: ["nope"] }, contact)).toThrow(/Unknown project/);
    });
});

describe("LaTeX output", () => {
    it("escapes special characters and dashes", () => {
        expect(latexEscape("A & B at 100% – C_d #1 {x}")).toBe("A \\& B at 100\\% -- C\\_d \\#1 \\{x\\}");
    });

    it("renders the resume.cls layout", () => {
        const tex = renderTailoredLatex(buildTailoredCv(master, { ...tailoring, projects: ["p"] }, contact));
        expect(tex).toContain("\\documentclass{resume}");
        expect(tex).toContain("\\entry{Engineer}{2024 -- Present}{Acme}{Remote}");
        expect(tex).toContain("\\item Did A \\& B at 100\\%.");
        expect(tex).toContain("\\projentry{\\href{https://example.com}{\\textbf{Project}} -- A thing}{Go}");
        expect(tex).toContain("\\tworow{\\textbf{BSc}, Uni -- CGPA 4.00}{2024}");
        // Links are declared before contact so resume.cls prints them second.
        expect(tex.indexOf("\\address{GitHub")).toBeLessThan(tex.indexOf("\\address{+1 555"));
    });

    it("warns about skill lines that will wrap", () => {
        const long = { ...master, skillLines: [{ id: "lang", label: "Languages", skills: Array(20).fill("TypeScript") }] };
        expect(skillLineWarnings(buildTailoredCv(long, tailoring, contact))).toHaveLength(1);
    });
});
