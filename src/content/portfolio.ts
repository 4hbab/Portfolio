import { z } from "zod";

const ALLOWED_PROTOCOLS = new Set(["https:", "mailto:"]);

/**
 * One total check, deliberately not `.url()` followed by a refinement. Zod runs
 * every check even after an earlier one fails, so the refinement would still see
 * a malformed value and `new URL(value)` would throw straight out of
 * `safeParse` — turning "invalid content" into an exception for every caller
 * that reasonably expects `{ success: false }`, including the build-time gate.
 */
const safeUrl = z.string().min(1).max(2048).refine((value) => {
    try {
        return ALLOWED_PROTOCOLS.has(new URL(value).protocol);
    } catch {
        return false;
    }
}, "Only absolute https:// and mailto: links are allowed");

const itemFields = {
    id: z.string().min(1).max(80),
    visible: z.boolean().default(true),
    includeInResume: z.boolean().default(true),
    order: z.number().int().min(0),
};

export const portfolioContentSchema = z.object({
    schemaVersion: z.literal(1),
    profile: z.object({
        name: z.string().min(1).max(100),
        title: z.string().min(1).max(120),
        tagline: z.string().min(1).max(240),
        availability: z.string().max(120),
        location: z.string().max(120),
        email: z.string().email(),
    }),
    bio: z.array(z.object({
        ...itemFields,
        text: z.string().min(1).max(1200),
        highlighted: z.boolean().default(false),
    })).max(12),
    experience: z.array(z.object({
        ...itemFields,
        company: z.string().min(1).max(150),
        role: z.string().min(1).max(150),
        period: z.string().min(1).max(100),
        description: z.string().min(1).max(2000),
        tags: z.array(z.string().min(1).max(60)).max(30),
    })).max(30),
    education: z.array(z.object({
        ...itemFields,
        degree: z.string().min(1).max(180),
        institution: z.string().min(1).max(180),
        period: z.string().max(100),
        details: z.string().max(1200),
    })).max(20),
    skillGroups: z.array(z.object({
        ...itemFields,
        name: z.string().min(1).max(100),
        skills: z.array(z.string().min(1).max(60)).max(40),
    })).max(20),
    achievements: z.array(z.object({
        ...itemFields,
        title: z.string().min(1).max(180),
        details: z.string().max(800),
    })).max(30),
    projects: z.array(z.object({
        ...itemFields,
        title: z.string().min(1).max(150),
        description: z.string().min(1).max(1600),
        tags: z.array(z.string().min(1).max(60)).max(30),
        language: z.string().max(60).nullable(),
        stars: z.number().int().min(0),
        repoUrl: safeUrl,
        liveUrl: safeUrl.optional(),
        featured: z.boolean(),
    })).max(50),
    links: z.array(z.object({
        ...itemFields,
        label: z.string().min(1).max(80),
        url: safeUrl,
        kind: z.enum(["github", "linkedin", "email", "website", "other"]),
    })).max(20),
    faqs: z.array(z.object({
        ...itemFields,
        question: z.string().min(1).max(300),
        answer: z.string().min(1).max(1800),
    })).max(30),
});

export type PortfolioContent = z.infer<typeof portfolioContentSchema>;
export type PortfolioProject = PortfolioContent["projects"][number];

export interface PublicContentResponse {
    schemaVersion: 1;
    revision: number;
    publishedAt: string;
    content: PortfolioContent;
}

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

const visibleByOrder = <T extends { visible: boolean; order: number }>(items: T[]) =>
    items.filter((item) => item.visible).sort(byOrder);

/**
 * What the PDF carries: visible on the site *and* marked for the resume. Lives
 * beside `visibleContent` so the two orderings cannot drift apart.
 */
export const resumeItems = <T extends { visible: boolean; includeInResume: boolean; order: number }>(items: T[]) =>
    items.filter((item) => item.visible && item.includeInResume).sort(byOrder);

export function visibleContent(content: PortfolioContent): PortfolioContent {
    return {
        ...content,
        bio: visibleByOrder(content.bio),
        experience: visibleByOrder(content.experience),
        education: visibleByOrder(content.education),
        skillGroups: visibleByOrder(content.skillGroups),
        achievements: visibleByOrder(content.achievements),
        projects: visibleByOrder(content.projects),
        links: visibleByOrder(content.links),
        faqs: visibleByOrder(content.faqs),
    };
}

export const fallbackContent: PortfolioContent = portfolioContentSchema.parse({
    schemaVersion: 1,
    profile: {
        name: "Sakif Ahbab",
        title: "Junior Software Engineer",
        tagline: "Backend focused engineer & AI/ML enthusiast building large scale production ready applications.",
        availability: "Available for work",
        location: "Bangladesh",
        email: "sakifahbab74@gmail.com",
    },
    bio: [
        { id: "bio-1", visible: true, includeInResume: false, order: 0, highlighted: false, text: "I'm a backend-focused software engineer and AI/ML enthusiast with a CS degree from the Islamic University of Technology. I thrive on designing scalable APIs, optimizing databases, and shipping reliable services for complex, production-grade systems." },
        { id: "bio-2", visible: true, includeInResume: false, order: 1, highlighted: false, text: "Currently a Junior Software Engineer at WellDev, I build and maintain features within a 20-year-old legacy multi-tenant codebase for the InnoTix project — working with ColdFusion, Vue.js, Quasar, Node.js, MariaDB, and Docker across a globally distributed team." },
        { id: "bio-3", visible: true, includeInResume: false, order: 2, highlighted: true, text: "I've placed 1st Runners Up at the WellDev Hackathon & CTF (plus 1st in the CTF competition), and I'm actively pursuing DevOps and containerization skills through a #100DaysOfDevOps challenge." },
    ],
    experience: [
        ["exp-1", "WellDev", "Junior Software Engineer", "Mar 2025 — Present", "Developing and maintaining features within a complex, 20-year-old legacy multi-tenant codebase for the InnoTix project. Building scalable backend services and contributing to CI/CD pipelines across a globally distributed team.", ["ColdFusion", "Vue.js", "Quasar", "Node.js", "MariaDB", "Docker"]],
        ["exp-2", "WellDev", "Trainee Software Engineer", "Oct 2024 — Feb 2025", "Gained proficiency in ColdFusion and its ecosystem. Developed a Reddit-like book recommendation platform with infinitely nesting comments and ISBN-based API validation. Containerized applications with Docker and followed agile methodology.", ["ColdFusion", "Lucee", "Docker", "Git", "Agile"]],
        ["exp-3", "Bangladesh University of Business & Technology", "Lecturer", "Jul 2024 — Sep 2024", "Delivered lectures and guided students in computer science coursework, bridging industry experience with academic instruction.", ["Teaching", "Computer Science"]],
        ["exp-4", "Zolo Inc", "Software Engineer Intern", "Mar 2024 — Apr 2024", "Engineered the frontend for the user authentication system and the primary responsive navigation menu.", ["React.js", "Tailwind CSS", "JavaScript", "Git"]],
        ["exp-5", "Edvive", "Back End Developer (Intern)", "May 2023 — Aug 2023", "Built backend services using Python and Prisma ORM, contributing to the core platform infrastructure and API development.", ["Python", "Prisma", "FastAPI", "PostgreSQL"]],
        ["exp-6", "Kernel Technologies", "Intern", "Jun 2022 — Sep 2022", "Developed full-stack features using React and MySQL, gaining foundational experience in production software development workflows.", ["MySQL", "React.js", "JavaScript", "Node.js"]],
    ].map(([id, company, role, period, description, tags], order) => ({ id, company, role, period, description, tags, order, visible: true, includeInResume: true })),
    education: [{ id: "edu-1", degree: "B.Sc. in Computer Science and Engineering", institution: "Islamic University of Technology (IUT)", period: "Graduated", details: "Studied computer science fundamentals, algorithms, data structures, databases, software engineering, and AI/ML.", order: 0, visible: true, includeInResume: true }],
    // Grouped the way engineering resumes and job specs are read: languages
    // first, then the stack front to back, then delivery. The order is the
    // order they render in, on the site and in the PDF.
    skillGroups: [
        ["skills-languages", "Languages", ["TypeScript", "JavaScript", "Python", "Solidity", "ColdFusion"]],
        ["skills-frontend", "Frontend", ["React", "Next.js", "Vue.js", "Angular", "Quasar", "Tailwind CSS"]],
        ["skills-backend", "Backend & APIs", ["Node.js", "Express", "FastAPI", "Lucee"]],
        ["skills-data", "Databases & ORMs", ["PostgreSQL", "MariaDB", "MySQL", "MongoDB", "Prisma"]],
        ["skills-devops", "DevOps & CI/CD", ["Docker", "GitHub Actions", "CI/CD", "Git"]],
        ["skills-platforms", "Platforms & Tools", ["Firebase", "Web3.js", "FFmpeg"]],
    ].map(([id, name, skills], order) => ({ id, name, skills, order, visible: true, includeInResume: true })),
    achievements: [
        ["achievement-1", "1st Runners Up at WellDev Hackathon & CTF 2024"],
        ["achievement-2", "1st Place in WellDev CTF Competition 2024"],
        ["achievement-3", "#100DaysOfDevOps challenge participant"],
    ].map(([id, title], order) => ({ id, title, details: "", order, visible: true, includeInResume: true })),
    // The three that carry the most engineering weight lead and are the only
    // ones shown or carried into the resume; the rest stay here, hidden, so
    // they can be brought back from the admin without retyping them.
    projects: [
        { id: "project-pyplayground", title: "PyPlayground", description: "A browser-based Python coding playground. A Go backend handles GitHub authentication and saved snippets, while Pyodide runs Python inside a WebAssembly web worker so submitted code executes in the visitor's browser rather than on the server. Monaco editor, full tracebacks, keyboard shortcuts, and light and dark themes.", tags: ["Go", "WebAssembly", "Pyodide", "Monaco Editor"], language: "Go", stars: 0, repoUrl: "https://github.com/4hbab/coding-playground", featured: true, order: 0, visible: true, includeInResume: true },
        { id: "project-2", title: "CrowdChain", description: "A decentralized crowdfunding platform on Ethereum. The Solidity contract escrows ETH contributions until the deadline: creators withdraw once the funding goal is met, and backers reclaim their contributions when it is not. Paired with a Web3 frontend for wallet connection and campaign management.", tags: ["Solidity", "Ethereum", "Web3.js", "Smart Contracts"], language: "Solidity", stars: 0, repoUrl: "https://github.com/4hbab/Crowdfunding-Solitidy", featured: true, order: 1, visible: true, includeInResume: true },
        { id: "project-1", title: "Clipz", description: "A video clip sharing platform built on Angular 18 standalone components, with Firebase behind authentication, uploads, and clip metadata. Uploaded video is processed in the browser with ffmpeg.wasm, playback runs on Video.js, and Cypress covers the end-to-end flows.", tags: ["Angular", "TypeScript", "Firebase", "FFmpeg"], language: "TypeScript", stars: 0, repoUrl: "https://github.com/4hbab/Clipz", featured: true, order: 2, visible: true, includeInResume: true },
        { id: "project-4", title: "Bulky MVC", description: "An ASP.NET Core MVC online bookstore built on a three-tier architecture with EF Core, the repository pattern, and scaffolded Identity for authentication.", tags: ["ASP.NET Core", "C#", "EF Core", "SQL Server"], language: "C#", stars: 1, repoUrl: "https://github.com/4hbab/Bulky_MVC", featured: false, order: 3, visible: false, includeInResume: false },
        { id: "project-3", title: "Expenses Tracker React", description: "A React personal finance tracker for logging daily expenses with category-wise breakdowns and visualizations.", tags: ["React", "JavaScript", "CSS"], language: "JavaScript", stars: 0, repoUrl: "https://github.com/4hbab/expenses-tracker-react", featured: false, order: 4, visible: false, includeInResume: false },
        { id: "project-5", title: "Book Library API", description: "A RESTful API for managing a book library with CRUD operations, search, and categorization.", tags: ["Node.js", "Express", "MongoDB", "REST"], language: "JavaScript", stars: 0, repoUrl: "https://github.com/4hbab/Book-Library-API", featured: false, order: 5, visible: false, includeInResume: false },
    ],
    links: [
        { id: "link-github", label: "GitHub", url: "https://github.com/4hbab", kind: "github", order: 0, visible: true, includeInResume: true },
        { id: "link-linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/sakif-ahbab-a939b3228", kind: "linkedin", order: 1, visible: true, includeInResume: true },
        { id: "link-email", label: "Email", url: "mailto:sakifahbab74@gmail.com", kind: "email", order: 2, visible: true, includeInResume: true },
    ],
    faqs: [
        { id: "faq-1", question: "What does Sakif do?", answer: "Sakif is a backend-focused software engineer and AI/ML enthusiast.", order: 0, visible: true, includeInResume: false },
        { id: "faq-2", question: "How can I contact Sakif?", answer: "Use the contact section or the published email and LinkedIn links.", order: 1, visible: true, includeInResume: false },
    ],
});

export const fallbackSnapshot: PublicContentResponse = {
    schemaVersion: 1,
    revision: 0,
    publishedAt: "2026-09-19T00:00:00.000Z",
    content: fallbackContent,
};
