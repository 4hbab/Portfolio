import type { TailoredCv } from "./tailored";

/**
 * Renders a tailored CV as LaTeX for resume.cls, in the layout of Sakif's own
 * hand-written CV: same macros, same spacing fixes. Master text is plain text and
 * is escaped here, so a stray "&" or "%" can't break the build.
 */

const SKILL_LINE_BUDGET = 95;

export function latexEscape(value: string) {
    return value
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/([&%$#_{}])/g, "\\$1")
        .replace(/~/g, "\\textasciitilde{}")
        .replace(/\^/g, "\\textasciicircum{}")
        .replace(/—/g, "---")
        .replace(/–/g, "--")
        .replace(/·/g, "\\textperiodcentered{}")
        .replace(/→/g, "$\\rightarrow$");
}

const e = latexEscape;
const href = (url: string, text: string) => `\\href{${url.replace(/([%#])/g, "\\$1")}}{${text}}`;
const items = (bullets: { text: string }[]) =>
    ["\\begin{tightemize}", ...bullets.map((b) => `    \\item ${e(b.text)}`), "\\end{tightemize}"].join("\n");

/** Skill lines over budget wrap and cost a full line of the one-page budget. */
export function skillLineWarnings(cv: TailoredCv) {
    return cv.skillLines
        .map((line) => `${line.label}: ${line.skills.join(", ")}`)
        .filter((text) => text.length > SKILL_LINE_BUDGET)
        .map((text) => `Skill line is ${text.length} characters (budget ${SKILL_LINE_BUDGET}) and will likely wrap: "${text}"`);
}

const PREAMBLE = String.raw`\documentclass{resume}

\usepackage[T1]{fontenc}
\usepackage{xcolor}
\usepackage{enumitem}
\usepackage[left=0.45in,top=0.3in,right=0.45in,bottom=0.3in]{geometry}
\usepackage{hyperref}
\hypersetup{
    colorlinks=true,
    urlcolor=black,
    linkcolor=black,
    pdfborder={0 0 0},
    pdftitle={Sakif Ahbab - Resume},
    pdfauthor={Sakif Ahbab}
}

% No hyphenation: keeps keywords intact for ATS text extraction.
\hyphenpenalty=10000
\exhyphenpenalty=10000
\tolerance=4000
\emergencystretch=3em

\def\namesize{\LARGE}
\def\nameskip{\smallskip}
\def\addressskip{\smallskip}
\def\sectionskip{\medskip}
\def\sectionlineskip{\smallskip}

% Two-column row; #2 must not be empty (TeX drops the trailing \hfill). Use \oneline.
% The \hspace keeps at least 1em between the columns when #1 is long.
\newcommand{\tworow}[2]{{\parskip=0pt\parfillskip=0pt\relax #1\hfill\hspace{1em}#2\par}}
\newcommand{\oneline}[1]{{\parskip=0pt\relax #1\par}}

\newcommand{\entry}[4]{%
  \vspace{0.5em}%
  \tworow{\textbf{#1}}{#2}%
  \tworow{#3}{\textit{#4}}%
}
\newcommand{\projentry}[2]{%
  \vspace{0.5em}%
  \tworow{#1}{\textit{#2}}%
}

\newenvironment{tightemize}{%
  \begin{itemize}[itemsep=1pt, topsep=3pt, parsep=0pt, partopsep=0pt, leftmargin=1.3em]%
}{%
  \end{itemize}%
}`;

export function renderTailoredLatex(cv: TailoredCv) {
    const location = cv.availability ? `${cv.contact.location} (${cv.availability})` : cv.contact.location;
    const links = cv.links.map((link) => `${e(link.label)}: ${href(link.url, e(link.display))}`).join(" \\textbar\\ ");
    const sections: string[] = [];

    sections.push(`\\begin{rSection}{Summary}\n${e(cv.summary)}\n\\end{rSection}`);

    sections.push([
        "\\begin{rSection}{Skills}",
        cv.skillLines.map((line) => `\\textbf{${e(line.label)}:} ${e(line.skills.join(", "))}`).join(" \\\\\n"),
        "\\end{rSection}",
    ].join("\n"));

    sections.push([
        "\\begin{rSection}{Experience}",
        ...cv.roles.map((role) => `\\entry{${e(role.role)}}{${e(role.period)}}{${e(role.company)}}{${e(role.location)}}\n${items(role.bullets)}`),
        "\\end{rSection}",
    ].join("\n\n"));

    if (cv.projects.length > 0) sections.push([
        // Page 2 starts at Projects, as in the hand-written CV, so a heading is never stranded at the foot of page 1.
        ...(cv.maxPages > 1 ? ["\\newpage"] : []),
        "\\begin{rSection}{Projects}",
        ...cv.projects.map((p) => `\\projentry{${href(p.url, `\\textbf{${e(p.title)}}`)} -- ${e(p.tagline)}}{${e(p.stack)}}\n${items(p.bullets)}`),
        "\\end{rSection}",
    ].join("\n\n"));

    const educationRows = [
        ...cv.education.map((row) => ({ ...row, label: "", plain: false })),
        ...cv.publications.map((row) => ({ ...row, label: "\\textbf{Publication:} ", plain: true })),
    ];
    sections.push([
        `\\begin{rSection}{${cv.publications.length > 0 ? "Education \\& Publication" : "Education"}}`,
        "\\vspace{0.3em}",
        ...educationRows.map((row) => {
            const text = `${row.label}${row.plain ? e(row.text) : boldLead(row.text)}`;
            return row.date ? `\\tworow{${text}}{${e(row.date)}}` : `\\oneline{${text}}`;
        }),
        "\\end{rSection}",
    ].join("\n"));

    if (cv.activities.length > 0) sections.push([
        "\\begin{rSection}{Activities \\& Achievements}",
        ...cv.activities.map((a) => {
            const left = `\\textbf{${e(a.title)}}${a.detail ? ` -- ${e(a.detail)}` : ""}`;
            return a.date ? `\\projentry{${left}}{${e(a.date)}}` : `\\vspace{0.5em}\\oneline{${left}}`;
        }),
        "\\end{rSection}",
    ].join("\n\n"));

    return [
        `% Sakif Ahbab - CV tailored for ${cv.meta.company}, ${cv.meta.role}`,
        "% GENERATED from applications/_profile/master.json and this folder's cv.json.",
        "% Edit those and re-run `npm run cv:tailor`; edits made here are overwritten.",
        "",
        PREAMBLE,
        "",
        `\\name{${e(cv.name)}}`,
        "",
        "% resume.cls prints \\address lines in reverse call order: links are declared first so they print second.",
        `\\address{${links}}`,
        `\\address{${e(cv.contact.phone)} \\textbar\\ ${e(location)} \\textbar\\ ${href(`mailto:${cv.contact.email}`, e(cv.contact.email))}}`,
        "",
        "\\begin{document}",
        "",
        sections.join("\n\n"),
        "",
        "\\end{document}",
        "",
    ].join("\n");
}

/** "Degree, School -- CGPA" prints the part before the first comma in bold, as in the hand-written CV. */
function boldLead(text: string) {
    const comma = text.indexOf(",");
    return comma === -1 ? e(text) : `\\textbf{${e(text.slice(0, comma))}}${e(text.slice(comma))}`;
}
