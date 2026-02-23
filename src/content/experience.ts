export interface Experience {
    id: string;
    company: string;
    role: string;
    period: string;
    description: string;
    tags: string[];
}

export const experiences: Experience[] = [
    {
        id: "exp-1",
        company: "WellDev",
        role: "Junior Software Engineer",
        period: "Mar 2025 — Present",
        description:
            "Developing and maintaining features within a complex, 20-year-old legacy multi-tenant codebase for the InnoTix project. Building scalable backend services and contributing to CI/CD pipelines across a globally distributed team.",
        tags: ["ColdFusion", "Vue.js", "Quasar", "Node.js", "MariaDB", "Docker"],
    },
    {
        id: "exp-2",
        company: "WellDev",
        role: "Trainee Software Engineer",
        period: "Oct 2024 — Feb 2025",
        description:
            "Gained proficiency in ColdFusion and its ecosystem. Developed a Reddit-like book recommendation platform with infinitely nesting comments and ISBN-based API validation. Containerized applications with Docker and followed agile methodology.",
        tags: ["ColdFusion", "Lucee", "Docker", "Git", "Agile"],
    },
    {
        id: "exp-3",
        company: "Bangladesh University of Business & Technology",
        role: "Lecturer",
        period: "Jul 2024 — Sep 2024",
        description:
            "Delivered lectures and guided students in computer science coursework, bridging industry experience with academic instruction.",
        tags: ["Teaching", "Computer Science"],
    },
    {
        id: "exp-4",
        company: "Zolo Inc",
        role: "Software Engineer Intern",
        period: "Mar 2024 — Apr 2024",
        description:
            "Engineered the frontend for the user authentication system and the primary responsive navigation menu.",
        tags: ["React.js", "Tailwind CSS", "JavaScript", "Git"],
    },
    {
        id: "exp-5",
        company: "Edvive",
        role: "Back End Developer (Intern)",
        period: "May 2023 — Aug 2023",
        description:
            "Built backend services using Python and Prisma ORM, contributing to the core platform infrastructure and API development.",
        tags: ["Python", "Prisma", "FastAPI", "PostgreSQL"],
    },
    {
        id: "exp-6",
        company: "Kernel Technologies",
        role: "Intern",
        period: "Jun 2022 — Sep 2022",
        description:
            "Developed full-stack features using React and MySQL, gaining foundational experience in production software development workflows.",
        tags: ["MySQL", "React.js", "JavaScript", "Node.js"],
    },
];
