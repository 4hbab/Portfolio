import { z } from "zod";

const safeUrl = z.string().url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "mailto:";
}, "Only HTTPS and mailto links are allowed");

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

const visibleByOrder = <T extends { visible: boolean; order: number }>(items: T[]) =>
    items.filter((item) => item.visible).sort((a, b) => a.order - b.order);

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
    skillGroups: [
        ["skills-backend", "Backend & APIs", ["Node.js", "Python", "FastAPI", "ColdFusion", "Lucee", "Express"]],
        ["skills-frontend", "Frontend", ["React", "Next.js", "Vue.js", "Quasar", "Angular", "TypeScript", "JavaScript", "Tailwind CSS"]],
        ["skills-db", "Databases", ["MariaDB", "PostgreSQL", "MongoDB", "MySQL", "Prisma"]],
        ["skills-devops", "DevOps & Tools", ["Docker", "Git", "CI/CD", "GitHub Actions"]],
        ["skills-other", "Other", ["Solidity", "Web3.js", "Firebase", "FFmpeg"]],
    ].map(([id, name, skills], order) => ({ id, name, skills, order, visible: true, includeInResume: true })),
    achievements: [
        ["achievement-1", "1st Runners Up at WellDev Hackathon & CTF 2024"],
        ["achievement-2", "1st Place in WellDev CTF Competition 2024"],
        ["achievement-3", "#100DaysOfDevOps challenge participant"],
    ].map(([id, title], order) => ({ id, title, details: "", order, visible: true, includeInResume: true })),
    projects: [
        ["project-1", "Clipz", "A video clip sharing platform with upload, streaming, and social features for content creators.", ["Angular", "Firebase", "FFmpeg", "TypeScript"], "TypeScript", "https://github.com/4hbab/Clipz", true],
        ["project-2", "Crowdfunding Solitidy", "A decentralized crowdfunding platform built on Ethereum using Solidity smart contracts.", ["Solidity", "Ethereum", "Web3.js", "React"], "Solidity", "https://github.com/4hbab/Crowdfunding-Solitidy", true],
        ["project-3", "Expenses Tracker React", "A React-based personal finance tracker for managing daily expenses with category-wise breakdowns and visualizations.", ["React", "JavaScript", "CSS"], "JavaScript", "https://github.com/4hbab/expenses-tracker-react", true],
        ["project-4", "Bulky MVC", "An ASP.NET Core MVC online bookstore management application with full CRUD operations.", ["ASP.NET Core", "C#", "MVC", "SQL Server"], "C#", "https://github.com/4hbab/Bulky_MVC", false],
        ["project-5", "Book Library API", "A RESTful API for managing a book library with CRUD operations, search, and categorization features.", ["Node.js", "Express", "MongoDB", "REST"], "JavaScript", "https://github.com/4hbab/Book-Library-API", false],
    ].map(([id, title, description, tags, language, repoUrl, featured], order) => ({ id, title, description, tags, language, repoUrl, featured, order, visible: true, includeInResume: order < 3, stars: 0 })),
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
