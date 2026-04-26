const url = process.env.CRON_URL || "http://localhost:3000/api/cron";
const token = process.env.CRON_SECRET;

async function main() {
  const response = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(`Cron failed: ${response.status} ${await response.text()}`);
  console.log(await response.text());
}

main();
