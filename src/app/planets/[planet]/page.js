export default async function PlanetPage({ params }) {
    // dynamiczny segment URL
    const {planet} = await params;

    const planetData = {
        mercury: { name: "Mercury", description: "The smallest planet in our Solar System." },
        venus: { name: "Venus", description: "The second planet from the Sun." },
        earth: { name: "Earth", description: "Our home planet, third from the Sun." },
        mars: { name: "Mars", description: "Known as the Red Planet." },
        // Dodaj więcej planet
    };

    // Bezpieczne przypisanie danych planety lub domyślnych danych
    const data = planetData[planet] || { name: "Unknown", description: "No data available." };

    return (
        <main>
            <h1>{data.name}</h1>
            <p>{data.description}</p>
        </main>
    );
}
