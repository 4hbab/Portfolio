export interface Project {
    id: string;
    title: string;
    description: string;
    longDescription?: string;
    tags: string[];
    image?: string;
    liveUrl?: string;
    repoUrl?: string;
    featured: boolean;
}

export const projects: Project[] = [
    {
        id: "project-1",
        title: "Vidi",
        description:
            "A full-featured video sharing platform with upload, streaming, and social features for content creators.",
        longDescription:
            "Built a scalable video sharing platform supporting video uploads, transcoding, streaming playback, user profiles, and social engagement features like comments and likes.",
        tags: ["React", "Node.js", "MongoDB", "FFmpeg"],
        repoUrl: "https://github.com/4hbab",
        featured: true,
    },
    {
        id: "project-2",
        title: "Crowdfunding Solidity",
        description:
            "A decentralized crowdfunding platform built on Ethereum using Solidity smart contracts.",
        longDescription:
            "Developed a blockchain-based crowdfunding solution where users can create campaigns, contribute ETH, and track funding progress — all secured by smart contracts on the Ethereum network.",
        tags: ["Solidity", "Ethereum", "Web3.js", "React"],
        repoUrl: "https://github.com/4hbab",
        featured: true,
    },
    {
        id: "project-3",
        title: "Expenses Tracker",
        description:
            "A React-based personal finance tracker for managing daily expenses with category-wise breakdowns and visualizations.",
        tags: ["React", "JavaScript", "CSS"],
        repoUrl: "https://github.com/4hbab",
        featured: true,
    },
    {
        id: "project-4",
        title: "Travel Management API",
        description:
            "Backend REST API services powering a travel-management platform with booking, payments, and user management.",
        tags: ["Node.js", "ColdFusion", "MariaDB", "Docker"],
        featured: false,
    },
    {
        id: "project-5",
        title: "RAG Chatbot",
        description:
            "An AI-powered chatbot leveraging Retrieval-Augmented Generation for intelligent document Q&A — built during a hackathon.",
        tags: ["Python", "FastAPI", "LangChain", "Vector DB"],
        featured: false,
    },
    {
        id: "project-6",
        title: "Auth System Frontend",
        description:
            "User authentication UI with login, registration, and session management built with Next.js and Tailwind.",
        tags: ["Next.js", "React", "Tailwind CSS"],
        featured: false,
    },
];

export const allTags: string[] = Array.from(
    new Set(projects.flatMap((p) => p.tags))
).sort();
