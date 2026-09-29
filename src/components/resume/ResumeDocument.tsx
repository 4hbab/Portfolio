import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { resumeItems, type PortfolioContent } from "@/content/portfolio";

const styles = StyleSheet.create({
    page: { padding: 34, fontFamily: "Helvetica", fontSize: 9, color: "#18181b", lineHeight: 1.35 },
    header: { borderBottomWidth: 2, borderBottomColor: "#18181b", paddingBottom: 8, marginBottom: 10 },
    name: { fontSize: 23, lineHeight: 1.15, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
    title: { fontSize: 11, marginTop: 5 },
    links: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 5 },
    link: { color: "#155eef", textDecoration: "none", fontSize: 8 },
    section: { marginBottom: 9 },
    heading: { fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "uppercase", borderBottomWidth: 1, borderBottomColor: "#777", paddingBottom: 2, marginBottom: 5 },
    row: { marginBottom: 6 },
    rowHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    strong: { fontFamily: "Helvetica-Bold" },
    muted: { color: "#52525b", fontSize: 8 },
    body: { marginTop: 2 },
    tags: { color: "#3f3f46", fontSize: 8, marginTop: 2 },
});

const pdfText = (value: string) => value.replace(/[—–]/g, "-");

export function ResumeDocument({ content }: { content: PortfolioContent }) {
    const experience = resumeItems(content.experience);
    const education = resumeItems(content.education);
    const projects = resumeItems(content.projects);
    const skills = resumeItems(content.skillGroups);
    const achievements = resumeItems(content.achievements);
    const links = resumeItems(content.links);

    return (
        <Document title={`${content.profile.name} Resume`} author={content.profile.name}>
            <Page size="A4" style={styles.page} wrap>
                <View style={styles.header}>
                    <Text style={styles.name}>{content.profile.name}</Text>
                    <Text style={styles.title}>{content.profile.title} · {content.profile.location}</Text>
                    <View style={styles.links}>
                        <Link src={`mailto:${content.profile.email}`} style={styles.link}>{content.profile.email}</Link>
                        {links.filter((link) => link.kind !== "email").map((link) => (
                            <Link key={link.id} src={link.url} style={styles.link}>{link.label}</Link>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>Profile</Text>
                    <Text>{content.profile.tagline}</Text>
                </View>

                {experience.length > 0 && <View style={styles.section}>
                    <Text style={styles.heading}>Experience</Text>
                    {experience.map((entry) => <View key={entry.id} style={styles.row} wrap={false}>
                        <View style={styles.rowHeader}>
                            <Text style={styles.strong}>{entry.role} · {entry.company}</Text>
                            <Text style={styles.muted}>{pdfText(entry.period)}</Text>
                        </View>
                        <Text style={styles.body}>{entry.description}</Text>
                        <Text style={styles.tags}>{entry.tags.join(" · ")}</Text>
                    </View>)}
                </View>}

                {projects.length > 0 && <View style={styles.section} break>
                    <Text style={styles.heading}>Selected Projects</Text>
                    {projects.map((project) => <View key={project.id} style={styles.row} wrap={false}>
                        <View style={styles.rowHeader}>
                            <Text style={styles.strong}>{project.title}</Text>
                            {project.repoUrl && <Link src={project.repoUrl} style={styles.link}>Repository</Link>}
                        </View>
                        <Text style={styles.body}>{project.description}</Text>
                        <Text style={styles.tags}>{project.tags.join(" · ")}</Text>
                    </View>)}
                </View>}

                {education.length > 0 && <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>Education</Text>
                    {education.map((entry) => <View key={entry.id} style={styles.row}>
                        <View style={styles.rowHeader}>
                            <Text style={styles.strong}>{entry.degree}</Text>
                            <Text style={styles.muted}>{pdfText(entry.period)}</Text>
                        </View>
                        <Text>{entry.institution}</Text>
                        {entry.details && <Text style={styles.muted}>{entry.details}</Text>}
                    </View>)}
                </View>}

                {skills.length > 0 && <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>Skills</Text>
                    {skills.map((group) => <Text key={group.id}><Text style={styles.strong}>{group.name}: </Text>{group.skills.join(", ")}</Text>)}
                </View>}

                {achievements.length > 0 && <View style={styles.section} wrap={false}>
                    <Text style={styles.heading}>Achievements</Text>
                    {achievements.map((entry) => <Text key={entry.id}>• {entry.title}{entry.details ? ` - ${entry.details}` : ""}</Text>)}
                </View>}
            </Page>
        </Document>
    );
}
