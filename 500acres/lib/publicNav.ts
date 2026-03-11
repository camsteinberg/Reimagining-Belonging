export interface PublicNavLink {
  href: string;
  label: string;
  external?: boolean;
}

export interface PublicNavItem {
  label: string;
  num: string;
  href?: string;
  children?: PublicNavLink[];
  includeInFooter?: boolean;
}

export interface SocialLink {
  label: string;
  href: string;
  ariaLabel: string;
}

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { href: "/", label: "Home", num: "01" },
  {
    href: "/about",
    label: "About",
    num: "02",
    children: [
      { href: "/about", label: "Overview" },
      { href: "/about/mission", label: "Our Mission" },
      { href: "/about/team", label: "Our Team" },
      { href: "/about/sponsors", label: "Our Sponsors" },
      { href: "/about/white-paper", label: "White Paper" },
    ],
  },
  {
    href: "/stories",
    label: "Stories & Games",
    num: "03",
    children: [
      { href: "/stories", label: "Stories" },
      { href: "https://blueprint-telephone.vercel.app", label: "Blueprint Telephone", external: true },
    ],
  },
  { href: "/resources", label: "Resources", num: "04" },
  { href: "/get-involved", label: "Get Involved", num: "05" },
];

export const AUTH_NAV_ITEM: PublicNavItem = {
  href: "/login",
  label: "Login",
  num: "06",
  includeInFooter: false,
};

export const PUBLIC_SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: "https://instagram.com/500acres", ariaLabel: "Follow us on Instagram" },
  { label: "Twitter", href: "https://twitter.com/500acres", ariaLabel: "Follow us on Twitter" },
  { label: "Email", href: "mailto:hello@500acres.org", ariaLabel: "Send us an email" },
];

export function isNavHrefActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavItemActive(pathname: string, item: PublicNavItem) {
  if (isNavHrefActive(pathname, item.href)) return true;
  return item.children?.some((child) => !child.external && isNavHrefActive(pathname, child.href)) ?? false;
}
