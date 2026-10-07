export const ICONS = {
    prev: 'M15 18l-6-6 6-6',
    next: 'M9 18l6-6-6-6',
    plus: 'M12 5v14M5 12h14',
    up: 'M12 19V5M5 12l7-7 7 7',
    down: 'M12 5v14M5 12l7 7 7-7',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
};

type Props = { d: string; size?: number; width?: number; color?: string };

export default function Icon({ d, size = 20, width = 2, color }: Props) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ stroke: color ?? 'currentColor' }}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={d} />
        </svg>
    );
}
