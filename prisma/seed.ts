import { PrismaClient, ProfileType, Unit } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    name: "VeKa 82",
    brand: "Izotec",
    systemName: "Izoklass",
    profileType: ProfileType.PVC,
    sortOrder: 1,
    descriptionTemplate: `Sistem de tâmplărie din PVC premium **VeKa 82 – Izoklass**, produs de **Izotec**, conceput pentru performanță termică și acustică de nivel superior.

**Caracteristici tehnice:**
- Profil PVC cu **6 camere** și adâncime de construcție de 82mm
- Coeficient de transfer termic Uf = **1,0 W/(m²K)**
- Izolație termică excelentă, clasa energetică **A+**
- Geam termoizolant tripan 4-16-4-16-4 cu **Argon** și low-e coating
- Uw final al ferestrei ≤ **0,8 W/(m²K)** (variabil în funcție de dimensiuni)
- Izolație fonică până la **46 dB** (Rw)
- Armătură din oțel galvanizat la toate profilele portante
- Feronerie multifuncțională cu **4 puncte de blocare**, rezistentă la efracție

**Aspectul:** Design modern, linii curate. Disponibil în **alb standard** și **foliat (RAL sau lemn)**.

*Recomandat pentru: locuințe rezidențiale, apartamente, case particulare unde izolarea termică și confortul acustic sunt priorități.*`,
  },
  {
    name: "VeKa 76",
    brand: "Izotec",
    systemName: "Izosense",
    profileType: ProfileType.PVC,
    sortOrder: 2,
    descriptionTemplate: `Sistem de tâmplărie din PVC **VeKa 76 – Izosense**, produs de **Izotec**, soluție echilibrată între performanță și accesibilitate.

**Caracteristici tehnice:**
- Profil PVC cu **5 camere** și adâncime de construcție de 76mm
- Coeficient de transfer termic Uf = **1,3 W/(m²K)**
- Geam termoizolant dupan sau tripan, cu low-e și gaz Argon
- Uw final ≤ **1,1 W/(m²K)**
- Izolație fonică până la **42 dB** (Rw)
- Armătură oțel galvanizat la profilele principale
- Feronerie perimetrală cu blocare în **3 puncte**

**Aspectul:** Profil zvelt, potrivit pentru deschideri standard. Disponibil **alb** și în variante foliate la comandă.

*Recomandat pentru: renovări, blocuri, proiecte cu buget optimizat fără a compromite calitatea termică.*`,
  },
  {
    name: "Gealan S9000",
    brand: "Izotec",
    systemName: "Izoelite",
    profileType: ProfileType.PVC,
    sortOrder: 3,
    descriptionTemplate: `Sistem de tâmplărie din PVC de înaltă performanță **Gealan S9000 – Izoelite**, distribuit de **Izotec**, ideal pentru proiecte cu cerințe energetice maxime.

**Caracteristici tehnice:**
- Profil PVC inovator cu **6 camere** optimizate, adâncime 92mm
- Coeficient de transfer termic Uf = **0,95 W/(m²K)** — performanță pasivă
- Compatibil cu geam tripan premium, cu gaz Krypton
- Uw final ≤ **0,7 W/(m²K)** — cerințe case pasive (PassivHaus)
- Izolație fonică până la **48 dB** (Rw)
- Garnituri **EPDM** în 3 planuri de etanșare
- Sistem de drenaj îmbunătățit, rezistent la apa de ploaie

**Aspectul:** Design contemporan, profil modern cu vizibilitate redusă. Disponibil în **alb, gri antracit (7016)** și foliat lemn.

*Recomandat pentru: case pasive, clădiri cu certificare energetică înaltă, zone cu climat sever.*`,
  },
  {
    name: "Gealan Linear",
    brand: "Izotec",
    systemName: "Izo3+",
    profileType: ProfileType.PVC,
    sortOrder: 4,
    descriptionTemplate: `Sistem de tâmplărie din PVC **Gealan Linear – Izo3+**, distribuit de **Izotec**, caracterizat prin design minimalist și eficiență termică ridicată.

**Caracteristici tehnice:**
- Profil PVC cu linii geometrice drepte (design flat/flush), adâncime 83mm
- Coeficient de transfer termic Uf = **1,1 W/(m²K)**
- Geam termoizolant tripan inclus, cu low-e și Argon
- Uw final ≤ **0,9 W/(m²K)**
- Izolație fonică până la **44 dB** (Rw)
- Aspect interior și exterior **perfect plat** — tendință arhitecturală modernă
- Feronerie ascunsă disponibilă (opțional)

**Aspectul:** Profil drept, fără rotunjiri, aspect contemporan premium. Disponibil în **alb, antracit mat, bronz** și nuanțe speciale RAL.

*Recomandat pentru: arhitectură modernă, case contemporane, proiecte premium unde estetica minimalista este esențială.*`,
  },
  {
    name: "Aluprof MB79SI",
    brand: "Aluprof",
    systemName: "MB79SI",
    profileType: ProfileType.ALUMINIU,
    sortOrder: 5,
    descriptionTemplate: `Sistem de tâmplărie din **aluminiu termoizolant Aluprof MB79SI**, soluție profesională pentru clădiri rezidențiale și comerciale.

**Caracteristici tehnice:**
- Profil din aluminiu cu **rupere de punte termică** de 79mm
- Coeficient de transfer termic Uf = **1,0 W/(m²K)**
- Sistem de garnituri triple pentru etanșare perfectă
- Compatibil cu geam tripan, dimensiuni pana la 3000x2400mm
- Uw final ≤ **0,9 W/(m²K)**
- Izolație fonică până la **45 dB** (Rw)
- Rezistență la vânt clasa **C5**, impermeabilitate **E900**
- Eloxat sau vopsit în câmp electrostatic — orice RAL la comandă

**Aspectul:** Profil îngust, vizibilitate maximă a geamului. Disponibil în orice culoare RAL, bi-color (interior/exterior diferit).

*Recomandat pentru: apartamente de lux, vile, față de bloc, proiecte unde aluminiul este impus estetic sau structural.*`,
  },
  {
    name: "Aluprof MB86SI",
    brand: "Aluprof",
    systemName: "MB86SI",
    profileType: ProfileType.ALUMINIU,
    sortOrder: 6,
    descriptionTemplate: `Sistem de tâmplărie din **aluminiu premium Aluprof MB86SI**, conceput pentru cerințe energetice superioare și deschideri mari.

**Caracteristici tehnice:**
- Profil din aluminiu cu rupere de punte termică de 86mm — performanță pasivă
- Coeficient de transfer termic Uf = **0,87 W/(m²K)**
- Compatibil cu geam tripan de înaltă izolare, pana la 52mm grosime
- Uw final ≤ **0,8 W/(m²K)** — compatibil standard PassivHaus
- Izolație fonică până la **47 dB** (Rw)
- Feronerie robustă, sarcina de operare până la **400 kg** per canat
- Certificare CE, conforme EN 14351-1

**Aspectul:** Design elegant, profil zvelt malgré adâncimea mare. Disponibil în orice RAL, texturi metalice, bi-color.

*Recomandat pentru: case pasive, clădiri cu certificare LEED/BREEAM, deschideri panoramice mari.*`,
  },
  {
    name: "Reynaers MasterLine 8",
    brand: "Reynaers",
    systemName: "MasterLine 8",
    profileType: ProfileType.ALUMINIU,
    sortOrder: 7,
    descriptionTemplate: `Sistem de tâmplărie din **aluminiu Reynaers MasterLine 8**, soluție belgiană premium pentru ferestre și uși rezidențiale moderne.

**Caracteristici tehnice:**
- Profil aluminiu cu rupere de punte termică de 80mm, profilat precis
- Coeficient de transfer termic Uf = **1,1 W/(m²K)**
- Geam termoizolant dupan sau tripan, cu coating low-e
- Uw final ≤ **1,0 W/(m²K)**
- Izolație fonică până la **44 dB** (Rw)
- Sistem de drenaj ascuns, aspect pur exterior
- Compatibil cu sistem de automatizare și control inteligent

**Aspectul:** Design belgian rafinat, linii fine și proporții echilibrate. Disponibil în gamma RAL completă, anodizat, texturi speciale.

*Recomandat pentru: locuințe premium, proiecte arhitecturale cu cerințe estetice ridicate.*`,
  },
  {
    name: "Reynaers MasterLine 10",
    brand: "Reynaers",
    systemName: "MasterLine 10",
    profileType: ProfileType.ALUMINIU,
    sortOrder: 8,
    descriptionTemplate: `Sistem de tâmplărie din **aluminiu Reynaers MasterLine 10**, vârf de gamă pentru performanță termică și design ultra-minimalist.

**Caracteristici tehnice:**
- Profil aluminiu cu rupere de punte termică de 100mm — top performanță
- Coeficient de transfer termic Uf = **0,79 W/(m²K)** — nivel pasiv certificat
- Geam tripan de 52-56mm cu gaz Krypton și coating triple low-e
- Uw final ≤ **0,7 W/(m²K)** — cel mai bun din clasa aluminiu
- Izolație fonică până la **52 dB** (Rw) — clasa D
- Canate de până la **500 kg**, glisante și pivotante disponibile
- Certificare PassivHaus PHI

**Aspectul:** Design ultra-plat, profil vizibil redus la minimum. Disponibil în orice RAL, metalic, mat sau lucios.

*Recomandat pentru: proiecte PassivHaus, vile de lux, clădiri cu cerințe de izolare și estetică la cel mai înalt nivel.*`,
  },
];

const EXTRA_OPTIONS = [
  // Geam & izolații
  {
    name: "Geam cu control solar (Reflectiv/Low-e+)",
    description:
      "Geam cu strat de control solar care reduce aportul de căldură în sezon cald cu până la 60%, menținând în același timp transmisia luminoasă ridicată. Ideal pentru fațade expuse sudului sau vestului.",
    category: "Geam & Izolații",
    unit: Unit.mp,
    sortOrder: 1,
  },
  {
    name: "Geam tripan (față de standard dupan)",
    description:
      "Upgrade la geam termoizolant cu 3 straturi de sticlă și 2 camere cu gaz Argon. Reduce drastic pierderile termice (Ug ≤ 0,6 W/m²K) și îmbunătățește confortul acustic. Recomandat pentru zone cu temperaturi extreme.",
    category: "Geam & Izolații",
    unit: Unit.mp,
    sortOrder: 2,
  },
  {
    name: "Geam securizat P2A (antiefracție)",
    description:
      "Folie de securitate integrată în geam (laminat 2 foi sticlă + PVB 0.76mm). Clasificare antiefracție P2A conform EN 356 — rezistă la lovituri repetate. Obligatoriu pentru parter sau zone cu risc.",
    category: "Geam & Izolații",
    unit: Unit.mp,
    sortOrder: 3,
  },
  {
    name: "Geam ornamental / satinblock",
    description:
      "Sticlă satinată sau model ornamental pentru intimitate vizuală, menținând transmisia luminoasă. Disponibil în variante: satin full, coaste, arctic. Potrivit pentru băi, holuri, parțial living.",
    category: "Geam & Izolații",
    unit: Unit.mp,
    sortOrder: 4,
  },
  // Folii & finisaje
  {
    name: "Folie exterioară (RAL la comandă)",
    description:
      "Folie co-extrudată aplicată pe profilul exterior în nuanța dorită RAL. Durabilitate UV testată min. 10 ani. Opțiuni: culori solide, nuanțe metalice, aspect lemn (stejar, nuc, mahon). Nu necesită vopsire sau întreținere.",
    category: "Folii & Finisaje",
    unit: Unit.mp,
    sortOrder: 10,
  },
  {
    name: "Folie interior diferit de exterior (bi-color)",
    description:
      "Sistem cu folie distinctă pe fața interioară față de exterior. Exemplu: exterior antracit (RAL 7016), interior alb sau lemn. Permite personalizare totală fără compromis estetic.",
    category: "Folii & Finisaje",
    unit: Unit.mp,
    sortOrder: 11,
  },
  // Glafuri & accesorii
  {
    name: "Glaf exterior aluminiu vopsit",
    description:
      "Glaf de pervaz exterior din aluminiu preformat, vopsit electrostatic în culoarea tâmplăriei. Protejează zidul sub fereastră de infiltrații, aspect îngrijit și durabil. Inclus sistem de prindere și benzi de etanșare laterale.",
    category: "Glafuri & Accesorii",
    unit: Unit.ml,
    sortOrder: 20,
  },
  {
    name: "Glaf interior PVC sau marmură",
    description:
      "Glaf interior din PVC expansionat (opțiune economică) sau marmură artificială (opțiune premium), disponibil în lățimi de 15–45cm. Finisaj curat, montaj inclus în ofertă.",
    category: "Glafuri & Accesorii",
    unit: Unit.ml,
    sortOrder: 21,
  },
  {
    name: "Pervaz/Tablă de apărare exterioară",
    description:
      "Tablă zincată sau aluminiu pliată pentru protecția soclului sub fereastră, rezistentă la intemperării. Prindere mecanică și etanșare siliconic incluse.",
    category: "Glafuri & Accesorii",
    unit: Unit.ml,
    sortOrder: 22,
  },
  // Jaluzele & sisteme umbrire
  {
    name: "Rolou exterior (casetă integrată în tâmplărie)",
    description:
      "Rolou din lamele aluminiu sau PVC integrat în casetă direct pe tâmplărie. Acționare manuală (curea) sau electrică (motor 230V, opțional cu telecomandă). Reduce aportul solar și crește securitatea.",
    category: "Umbrire & Rulouri",
    unit: Unit.buc,
    sortOrder: 30,
  },
  {
    name: "Rolou exterior cu acționare electrică (motor)",
    description:
      "Upgrade la ruloul exterior: motor electric silențios integrat (< 45 dB) cu comandă prin întrerupător 230V sau telecomandă RF 433MHz. Compatibil cu sisteme smart home (Somfy, Nice). Include cablu și protecție la vânt.",
    category: "Umbrire & Rulouri",
    unit: Unit.buc,
    sortOrder: 31,
  },
  {
    name: "Jaluzelele orizontale între geamuri (venetian)",
    description:
      "Jaluzele din aluminiu montate etanș în spațiul geamului termoizolant, controlabile prin magnet din exterior. Fără praf, fără curățare. Disponibil în nuanțe standard.",
    category: "Umbrire & Rulouri",
    unit: Unit.buc,
    sortOrder: 32,
  },
  // Sisteme ventilare
  {
    name: "Ventilație higrocontrolabilă (grilă pe tâmplărie)",
    description:
      "Grilă de microventilație higrocontrolabilă montată pe profilul superior al ferestrei. Debit variabil automat 5–45 m³/h în funcție de umiditatea interioară. Fără curent, silențioasă. Recomandată în dormitoare și bucătării.",
    category: "Ventilație",
    unit: Unit.buc,
    sortOrder: 40,
  },
  {
    name: "Ventilație cu grilă fixă (aerisire permanentă minimă)",
    description:
      "Grilă fixă de ventilație continuă montată în toc, debit constant ~10 m³/h. Soluție economică pentru asigurarea unui minim de schimb de aer conform normativelor.",
    category: "Ventilație",
    unit: Unit.buc,
    sortOrder: 41,
  },
  // Feronerie specială
  {
    name: "Feronerie antiefracție WK2 (RC2)",
    description:
      "Upgrade la feronerie perimetrală cu clasificare rezistență la efracție clasa RC2 (WK2) conform EN 1627. Include ciuperci de blocare zincate, bride suplimentare și întăriri în puncte critice. Recomandat pentru ușile de intrare și ferestre parter.",
    category: "Feronerie",
    unit: Unit.buc,
    sortOrder: 50,
  },
  {
    name: "Balama ascunsă (ușă intrare / fereastră specială)",
    description:
      "Balamale ascunse reglabile 3D pentru ușile de intrare sau ferestre speciale. Aspect pur, fără elemente vizibile la exterior. Sarcina max 160 kg/balama.",
    category: "Feronerie",
    unit: Unit.buc,
    sortOrder: 51,
  },
  {
    name: "Mâner inoxidabil premium / design",
    description:
      "Mâner din inox periat sau cromat mat, disponibil în modele minimaliste sau clasice. Include rozeta și șuruburi din inox. Rezistent la coroziune și uzură intensivă.",
    category: "Feronerie",
    unit: Unit.buc,
    sortOrder: 52,
  },
  // Montaj special
  {
    name: "Montaj în sistemul cu grilă (IZO-bloc / Compriband)",
    description:
      "Montaj prin sistem etanș cu bandă expandabilă precomprimată (compriband) pe contur exterior și folie barieră vapori interior. Elimină punțile termice, asigură etanșare permanentă la apă și aer. Standard german RAL.",
    category: "Montaj Special",
    unit: Unit.ml,
    sortOrder: 60,
  },
  {
    name: "Demontaj și eliminare tâmplărie veche",
    description:
      "Serviciu de demontare a tâmplăriei existente (PVC, lemn, aluminiu) și evacuare deșeuri. Include transport la centru de reciclare autorizat. Prețul este per canat sau per ml perimetru.",
    category: "Montaj Special",
    unit: Unit.buc,
    sortOrder: 61,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@2024!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bdm.ro" },
    update: {},
    create: {
      name: "Administrator BDM",
      email: "admin@bdm.ro",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Admin user:", admin.email);

  // Create demo agent
  const agentPassword = await bcrypt.hash("Agent@2024!", 12);
  const agent = await prisma.user.upsert({
    where: { email: "agent@bdm.ro" },
    update: {},
    create: {
      name: "Ion Ionescu (Agent Demo)",
      email: "agent@bdm.ro",
      passwordHash: agentPassword,
      role: "AGENT",
      isActive: true,
    },
  });
  console.log("✅ Agent user:", agent.email);

  // Seed products
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { name: p.name },
      update: { descriptionTemplate: p.descriptionTemplate },
      create: p,
    });

    // Set default prices for each product
    const existingPrice = await prisma.productPrice.findFirst({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
    });

    if (!existingPrice) {
      await prisma.productPrice.create({
        data: {
          productId: product.id,
          pricePerMpRon:
            p.profileType === "PVC"
              ? p.sortOrder <= 2
                ? 450
                : 520
              : p.sortOrder <= 6
                ? 680
                : 850,
          pricePerMlRon: p.profileType === "PVC" ? 200 : 280,
          montajPriceRon: p.profileType === "PVC" ? 180 : 220,
          setByUserId: admin.id,
        },
      });
    }
  }
  console.log(`✅ ${PRODUCTS.length} products seeded`);

  // Seed extra options
  for (const extra of EXTRA_OPTIONS) {
    await prisma.extraOption.upsert({
      where: { name: extra.name },
      update: { description: extra.description },
      create: extra,
    });
  }
  console.log(`✅ ${EXTRA_OPTIONS.length} extra options seeded`);

  console.log("\n🎉 Seed complete!");
  console.log("📧 Admin: admin@bdm.ro / Admin@2024!");
  console.log("📧 Agent: agent@bdm.ro / Agent@2024!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
