/**
 * Structured knowledge base for the portfolio chatbot.
 *
 * This data is bundled into the client-side JS and injected into
 * the LLM system prompt so the chatbot can answer questions about
 * Sakif without any backend or database.
 */

import { experiences } from "./experience";
import { socials } from "./socials";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface PersonalKnowledge {
    name: string;
    title: string;
    bio: string[];
    experience: {
        company: string;
        role: string;
        period: string;
        description: string;
        tags: string[];
    }[];
    skills: Record<string, string[]>;
    education: {
        degree: string;
        institution: string;
        year: string;
        details: string;
    };
    achievements: string[];
    contact: {
        email: string;
        github: string;
        linkedin: string;
    };
    interests: string[];
}

// ──────────────────────────────────────────────
// Knowledge data
// ──────────────────────────────────────────────

export const personalKnowledge: PersonalKnowledge = {
    name: "Sakif Ahbab",
    title: "Junior Software Engineer",

    bio: [
        "Backend-focused software engineer and AI/ML enthusiast with a CS degree from the Islamic University of Technology.",
        "Thrives on designing scalable APIs, optimizing databases, and shipping reliable services for complex, production-grade systems.",
        "Currently a Junior Software Engineer at WellDev, building and maintaining features within a 20-year-old legacy multi-tenant codebase for the InnoTix project — working with ColdFusion, Vue.js, Quasar, Node.js, MariaDB, and Docker across a globally distributed team.",
        "Placed 1st Runners Up at the WellDev Hackathon & CTF (and 1st in the CTF competition).",
        "Actively pursuing DevOps and containerization skills through a #100DaysOfDevOps challenge.",
    ],

    experience: experiences.map((e) => ({
        company: e.company,
        role: e.role,
        period: e.period,
        description: e.description,
        tags: e.tags,
    })),

    skills: {
        "Backend & APIs": [
            "Node.js",
            "Python",
            "FastAPI",
            "ColdFusion",
            "Lucee",
            "Express",
        ],
        "Frontend": [
            "React",
            "Next.js",
            "Vue.js",
            "Quasar",
            "Angular",
            "TypeScript",
            "JavaScript",
            "Tailwind CSS",
        ],
        "Databases": ["MariaDB", "PostgreSQL", "MongoDB", "MySQL", "Prisma"],
        "DevOps & Tools": ["Docker", "Git", "CI/CD", "GitHub Actions"],
        "Other": ["Solidity", "Web3.js", "Firebase", "FFmpeg"],
    },

    education: {
        degree: "B.Sc. in Computer Science and Engineering",
        institution: "Islamic University of Technology (IUT)",
        year: "Graduated",
        details:
            "Studied computer science fundamentals, algorithms, data structures, databases, software engineering, and AI/ML.",
    },

    achievements: [
        "1st Runners Up at WellDev Hackathon & CTF 2024",
        "1st Place in WellDev CTF Competition 2024",
        "#100DaysOfDevOps challenge participant",
    ],

    contact: {
        email:
            socials.find((s) => s.platform === "Email")?.url.replace("mailto:", "") ??
            "sakifahbab74@gmail.com",
        github:
            socials.find((s) => s.platform === "GitHub")?.url ??
            "https://github.com/4hbab",
        linkedin:
            socials.find((s) => s.platform === "LinkedIn")?.url ??
            "https://www.linkedin.com/in/sakif-ahbab-a939b3228",
    },

    interests: [
        "Backend architecture & system design",
        "AI/ML and its real-world applications",
        "DevOps, containerization, and CI/CD pipelines",
        "Open-source contribution",
        "Competitive programming and CTFs",
    ],
};

// ──────────────────────────────────────────────
// Serialiser (used as LLM context)
// ──────────────────────────────────────────────

/** Flatten the knowledge object into a human-readable string for the LLM prompt. */
export function serialiseKnowledge(k: PersonalKnowledge): string {
    const lines: string[] = [];

    lines.push(`# ${k.name}`);
    lines.push(`**Title:** ${k.title}\n`);

    lines.push("## Bio");
    k.bio.forEach((b) => lines.push(`- ${b}`));

    lines.push("\n## Work Experience");
    k.experience.forEach((e) => {
        lines.push(
            `### ${e.role} at ${e.company} (${e.period})\n${e.description}\nTech: ${e.tags.join(", ")}\n`
        );
    });

    lines.push("## Skills");
    Object.entries(k.skills).forEach(([cat, skills]) => {
        lines.push(`- **${cat}:** ${skills.join(", ")}`);
    });

    lines.push("\n## Education");
    lines.push(
        `${k.education.degree} — ${k.education.institution} (${k.education.year})\n${k.education.details}`
    );

    lines.push("\n## Achievements");
    k.achievements.forEach((a) => lines.push(`- ${a}`));

    lines.push("\n## Contact");
    lines.push(`- Email: ${k.contact.email}`);
    lines.push(`- GitHub: ${k.contact.github}`);
    lines.push(`- LinkedIn: ${k.contact.linkedin}`);

    lines.push("\n## Interests");
    k.interests.forEach((i) => lines.push(`- ${i}`));

    return lines.join("\n");
}
