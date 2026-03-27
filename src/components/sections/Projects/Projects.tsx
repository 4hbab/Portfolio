import SectionHeading from "@/components/ui/SectionHeading/SectionHeading";
import { fetchProjects, getProjectTags } from "@/content/projects";
import ProjectsClient from "./ProjectsClient";

export default async function Projects() {
    const projects = await fetchProjects();
    const allTags = getProjectTags(projects);

    return (
        <section id="projects" className="section bg-bg stripe-bg">
            <div className="mx-auto max-w-6xl px-6">
                <SectionHeading
                    title="Projects"
                    subtitle="A selection of things I've built."
                    accent="var(--color-accent-blue)"
                />

                <ProjectsClient projects={projects} allTags={allTags} />
            </div>
        </section>
    );
}
