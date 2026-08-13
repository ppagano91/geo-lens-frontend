import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="app-header">
      <img
        src="/GeoLens.png"
        alt="GeoLens"
        className="app-header-logo"
      />
      <div className="app-header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}
