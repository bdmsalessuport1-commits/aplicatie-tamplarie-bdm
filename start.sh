#!/bin/bash

echo "🚀 Pornire aplicatie BDM Tamplarie..."

# Porneste baza de date si aplicatia
sudo docker-compose up -d --build

# Asteapta sa fie gata baza de date
echo "⏳ Asteptam baza de date..."
sleep 15

# Ruleaza migrarile (creeaza tabelele in baza de date)
echo "📦 Pregatim baza de date..."
sudo docker-compose exec app npx prisma migrate deploy

# Adauga datele initiale (useri, produse)
sudo docker-compose exec app npx prisma db seed

echo ""
echo "✅ Gata! Deschide browserul la: http://localhost:3000"
echo ""
echo "📧 Admin: admin@bdm.ro"
echo "🔑 Parola: Admin@2024!"
