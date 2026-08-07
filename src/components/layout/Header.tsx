import GeoLens from "../../../GeoLens.png"

export default function Header() {
  return (
    <header className="app-header">
      <img src={GeoLens} className="app-image-logo"/>
      {/* <h1>GeoLens Analyzer</h1> */}
    </header>
  );
}
