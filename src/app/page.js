import EarthCanvas from "@/components/EarthCanvas";
import InfoCard from "@/components/InfoCard";

export default function Home() {
  return (
    <div className="container">
      <div className="canvas-container">
        <EarthCanvas />
      </div>
      <div className="info-container">
        <InfoCard />
      </div>
    </div>
  );
}
