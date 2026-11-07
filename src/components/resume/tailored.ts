import { z } from "zod";

/**
 * A tailored CV is the master CV with a different summary, bullet selection and
 * skill order. Tailoring can only pick facts by id from the master, never add
 * them, so every version sent out stays as true as the master is.
 */

const bullet = z.object({ id: z.string().min(1), text: z.string().min(1).max(400) });
const bulletSource = { bullets: z.array(bullet).min(1), defaultBullets: z.array(z.string()).min(1) };

export const cvMasterSchema = z.object({
    name: z.string().min(1),
    links: z.array(z.object({ label: z.string().min(1), display: z.string().min(1), url: z.string().url() })),
    roles: z.array(z.object({
        id: z.string().min(1),
        role: z.string().min(1),
        period: z.string().min(1),
        company: z.string().min(1),
        location: z.string().min(1),
        ...bulletSource,
    })).min(1),
    projects: z.array(z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        tagline: z.string().min(1),
        url: z.string().url(),
        stack: z.string().min(1),
        ...bulletSource,
    })),
    skillLines: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), skills: z.array(z.string()).min(1) })),
    defaultSkillLines: z.array(z.string()).min(1),
    education: z.array(z.object({ text: z.string().min(1), date: z.string() })),
    publications: z.array(z.object({ text: z.string().min(1), date: z.string() })),
    activities: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), detail: z.string(), date: z.string() })),
});

export const cvContactSchema = z.object({
    email: z.string().email(),
    phone: z.string().min(1),
    location: z.string().min(1),
});

export const cvTailoringSchema = z.object({
    company: z.string().min(1),
    role: z.string().min(1),
    summary: z.string().min(1).max(600),
    /** Appended to the location in the header, e.g. "open to remote and relocation". */
    availability: z.string().optional(),
    /** Bullet ids per role or project id, in print order. Anything left out uses its defaults. */
    bullets: z.record(z.string(), z.array(z.string()).min(1)).default({}),
    projects: z.array(z.string()).default([]),
    /** Skill line ids in print order. Defaults to the master's defaultSkillLines. */
    skillLines: z.array(z.string()).optional(),
    /** Skills moved to the front of their line, e.g. the posting's must-haves. */
    leadSkills: z.array(z.string()).default([]),
    /** Activity ids to print. Defaults to all of them. */
    activities: z.array(z.string()).optional(),
    /** 2 matches the hand-written CV: experience fills page 1 and projects start page 2. */
    maxPages: z.number().int().min(1).max(2).default(2),
});

export type CvMaster = z.infer<typeof cvMasterSchema>;
export type CvContact = z.infer<typeof cvContactSchema>;
export type CvTailoring = z.input<typeof cvTailoringSchema>;

function pick<T extends { id: string }>(items: T[], ids: string[], what: string): T[] {
    return ids.map((id) => {
        const item = items.find((candidate) => candidate.id === id);
        if (!item) throw new Error(`Unknown ${what} "${id}". Add it to the master CV first; tailoring only selects.`);
        return item;
    });
}

export function buildTailoredCv(masterInput: unknown, tailoringInput: unknown, contactInput: unknown) {
    const master = cvMasterSchema.parse(masterInput);
    const tailoring = cvTailoringSchema.parse(tailoringInput);
    const contact = cvContactSchema.parse(contactInput);

    const sources = [...master.roles, ...master.projects];
    for (const id of Object.keys(tailoring.bullets)) pick(sources, [id], "role or project");
    const withBullets = <T extends (typeof sources)[number]>(source: T) => ({
        ...source,
        bullets: pick(source.bullets, tailoring.bullets[source.id] ?? source.defaultBullets, `bullet in "${source.id}"`),
    });

    const lead = new Set(tailoring.leadSkills);
    const known = new Set(master.skillLines.flatMap((line) => line.skills));
    for (const skill of lead) if (!known.has(skill)) throw new Error(`Unknown skill "${skill}". Add it to the master CV first; tailoring only selects.`);

    return {
        name: master.name,
        contact,
        availability: tailoring.availability,
        links: master.links,
        summary: tailoring.summary,
        roles: master.roles.map(withBullets),
        projects: pick(master.projects, tailoring.projects, "project").map(withBullets),
        skillLines: pick(master.skillLines, tailoring.skillLines ?? master.defaultSkillLines, "skill line")
            .map((line) => ({ ...line, skills: [...tailoring.leadSkills.filter((s) => line.skills.includes(s)), ...line.skills.filter((s) => !lead.has(s))] })),
        education: master.education,
        publications: master.publications,
        activities: tailoring.activities ? pick(master.activities, tailoring.activities, "activity") : master.activities,
        maxPages: tailoring.maxPages,
        meta: { company: tailoring.company, role: tailoring.role },
    };
}

export type TailoredCv = ReturnType<typeof buildTailoredCv>;
