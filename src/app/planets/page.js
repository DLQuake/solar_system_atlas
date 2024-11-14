import Link from 'next/link';

export default function PlanetsPage() {
    const planets = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];

    return (
        <main>
            <h1>Planets</h1>
            <ul>
                {planets.map(planet => (
                    <li key={planet}>
                        <Link href={`/planets/${planet}`}>{planet}</Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
