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
        period: "Oct 2024 — Present",
        description:
            "Focused on developing scalable backend services for a travel-management platform. Implemented RESTful APIs, optimized database queries, and contributed to the CI/CD pipeline.",
        tags: ["ColdFusion", "Node.js", "VueJS", "MariaDB", "Docker"],
    },
    {
        id: "exp-2",
        company: "Zolo Inc",
        role: "Software Engineer Intern",
        period: "Mar 2024 — Apr 2024",
        description:
            "Engineered the frontend for the user authentication system and the primary responsive navigation menu.",
        tags: ["React.js", "Next.js", "Tailwind CSS", "Git"],
    },
];
