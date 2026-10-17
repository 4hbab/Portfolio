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
        "bg-accent text-accent-fg border border-accent hover:bg-accent-hover hover:border-accent-hover",
    outline:
        "bg-transparent text-text-primary border border-border-strong hover:border-text-secondary hover:bg-bg-card",
};

export default function Button(props: ButtonProps) {
    const { variant = "primary", className = "", ...rest } = props;

    const classes = `
    inline-flex items-center justify-center gap-2
    rounded-full px-6 py-3
    text-sm font-medium
    transition-[background-color,border-color,color,transform] duration-200
    active:scale-[0.97]
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
