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
        title: "Clipz",
        description:
            "A video clip sharing platform with upload, streaming, and social features for content creators.",
        longDescription:
            "Built a scalable video clip sharing platform supporting video uploads, streaming playback, user profiles, and social engagement features like comments and likes.",
        tags: ["Angular", "Firebase", "FFmpeg", "TypeScript"],
        repoUrl: "https://github.com/4hbab/Clipz",
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
        repoUrl: "https://github.com/4hbab/Crowdfunding-Solitidy",
        featured: true,
    },
    {
        id: "project-3",
        title: "Expenses Tracker",
        description:
            "A React-based personal finance tracker for managing daily expenses with category-wise breakdowns and visualizations.",
        tags: ["React", "JavaScript", "CSS"],
        repoUrl: "https://github.com/4hbab/expenses-tracker-react",
        featured: true,
    },
    {
        id: "project-4",
        title: "Bulky MVC",
        description:
            "An ASP.NET Core MVC web application implementing an online bookstore management system with full CRUD operations.",
        tags: ["ASP.NET Core", "C#", "MVC", "SQL Server"],
        repoUrl: "https://github.com/4hbab/Bulky_MVC",
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
        title: "Book Library API",
        description:
            "A RESTful API for managing a book library with CRUD operations, search, and categorization features.",
        tags: ["Node.js", "Express", "MongoDB", "REST"],
        repoUrl: "https://github.com/4hbab/Book-Library-API",
        featured: false,
    },
];

export const allTags: string[] = Array.from(
    new Set(projects.flatMap((p) => p.tags))
).sort();
