import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant = "primary" | "outline";

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
        "bg-accent text-accent-fg border border-accent hard-shadow",
    outline:
        "bg-transparent text-text-primary border border-border hard-shadow hover:bg-surface",
};

export default function Button(props: ButtonProps) {
    const { variant = "primary", className = "", ...rest } = props;

    const classes = `
    inline-flex items-center justify-center gap-2
    px-7 py-3.5
    text-sm font-medium
    transition-all duration-200
    focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
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
