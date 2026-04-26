self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "ZEROVPN", body: "Новое уведомление" };
  event.waitUntil(self.registration.showNotification(data.title || "ZEROVPN", { body: data.body || "" }));
});
