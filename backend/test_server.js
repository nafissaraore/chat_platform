// backend/test_server.js
console.log("----------------------------------------------------");
console.log("TEST DU SERVEUR MINIMAL : DÉMARRAGE...");
console.log("----------------------------------------------------");

const http = require('http');

const hostname = '127.0.0.1';
const port = 3001; // Utilisez un port différent pour éviter les conflits

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Serveur de test minimal en cours d\'exécution\n');
});

server.listen(port, hostname, () => {
  console.log(`Serveur de test minimal démarré sur http://${hostname}:${port}/`);
  console.log("Vérifiez cette console pour les logs !");
});

// Ajoutez un log qui s'affiche après 5 secondes pour vérifier le fonctionnement asynchrone
setTimeout(() => {
    console.log("Message de test après 5 secondes.");
}, 5000);
