export function ThemeScript() {
  const script = `
    const stored = localStorage.getItem('theme');
    const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
