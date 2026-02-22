import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost";

interface BaseProps {
    variant?: Variant;
    className?: string;
}

type ButtonAsButton = BaseProps &
    ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

type ButtonAsLink = BaseProps &
    AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<Variant, string> = {
    primary:
        "bg-accent text-text-primary border-3 border-border hard-shadow hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_var(--color-border)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_var(--color-border)]",
    outline:
        "bg-transparent text-text-primary border-3 border-border hard-shadow hover:bg-accent hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_var(--color-border)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_var(--color-border)]",
    ghost:
        "text-text-secondary border-3 border-transparent hover:border-border hover:text-text-primary hover:bg-surface",
};

export default function Button(props: ButtonProps) {
    const { variant = "primary", className = "", ...rest } = props;

    const classes = `
    inline-flex items-center justify-center gap-2
    px-7 py-3.5
    text-sm font-bold uppercase tracking-wider
    transition-all duration-200
    focus-visible:outline-3 focus-visible:outline-border focus-visible:outline-offset-2
    ${variantClasses[variant]}
    ${className}
  `.trim();

    if ("href" in rest && rest.href) {
        const { href, ...anchorRest } = rest as ButtonAsLink;
        const isExternal = href.startsWith("http") || href.startsWith("mailto:");
        return (
            <a
                href={href}
                className={classes}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...anchorRest}
            >
                {anchorRest.children}
            </a>
        );
    }

    const buttonRest = rest as ButtonAsButton;
    return (
        <button className={classes} {...buttonRest}>
            {buttonRest.children}
        </button>
    );
}
