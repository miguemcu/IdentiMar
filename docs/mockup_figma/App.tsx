import { useState, useEffect, useRef } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | "splash"
  | "home"
  | "new-photo"
  | "new-preview"
  | "new-info"
  | "new-processing"
  | "new-result"
  | "records"
  | "obs-detail"
  | "species"
  | "species-detail"
  | "profile"
  | "cert-start"
  | "cert-form"
  | "cert-review"
  | "cert-complete"

type TabId = "home" | "records" | "species" | "profile"
type RecordsTab = "todos" | "mis"

interface Species {
  id: number
  common: string
  scientific: string
  family: string
  description: string
  habitat: string
  depth: string
  size: string
  status: string
  statusColor: string
  color: string
  img: string
  imgAlt: string
  regionCount: number
}

interface ExpertValidation {
  validatorName: string
  pct: number
  date: string
}

interface Observation {
  id: string
  date: string
  location: string
  species: Species
  aiConfidence: number
  photo: string
  notes: string
  depth: string
  isOwn: boolean
  author: string
  authorRole: string
  expertValidation?: ExpertValidation
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const SPECIES_DB: Species[] = [
  {
    id: 1,
    common: "Raya látigo",
    scientific: "Hypanus americanus",
    family: "Dasyatidae",
    description:
      "Una de las rayas más comunes en el Caribe colombiano. Vive en fondos arenosos y zonas costeras poco profundas. Su cola es larga y delgada, con espinas venenosas que usa para defenderse.",
    habitat: "Fondos arenosos, aguas costeras poco profundas",
    depth: "0 – 36 m",
    size: "Hasta 200 cm de ancho",
    status: "Vulnerable",
    statusColor: "#F97316",
    color: "Pardo grisáceo, cara ventral blanca",
    img: "https://images.unsplash.com/photo-1577095972574-2fbdcf60c8ef?w=600&h=400&fit=crop&auto=format",
    imgAlt: "Raya látigo nadando bajo el agua",
    regionCount: 11,
  },
  {
    id: 2,
    common: "Raya chucho",
    scientific: "Aetobatus narinari",
    family: "Myliobatidae",
    description:
      "Fácil de reconocer por sus manchas blancas sobre fondo oscuro. Puede nadar cerca de la superficie y saltar fuera del agua. Se alimenta de moluscos y crustáceos que tritura con sus dientes.",
    habitat: "Aguas abiertas, lagunas costeras y arrecifes",
    depth: "1 – 80 m",
    size: "Hasta 330 cm de ancho",
    status: "En peligro",
    statusColor: "#EF4444",
    color: "Negro o azul oscuro con manchas blancas",
    img: "https://images.unsplash.com/photo-1741364855968-7355d89c7d94?w=600&h=400&fit=crop&auto=format",
    imgAlt: "Raya chucho con manchas blancas en aguas azules",
    regionCount: 6,
  },
  {
    id: 3,
    common: "Guitarra del Caribe",
    scientific: "Pseudobatos percellens",
    family: "Rhinobatidae",
    description:
      "Su cuerpo alargado mezcla características de rayas y tiburones. Vive sobre fondos blandos y aguas poco profundas. Es una especie bentónica de comportamiento tranquilo.",
    habitat: "Fondos arenosos y fangosos costeros",
    depth: "0 – 100 m",
    size: "Hasta 100 cm de largo",
    status: "Vulnerable",
    statusColor: "#F97316",
    color: "Pardo claro, a veces con manchas",
    img: "https://images.unsplash.com/photo-1560038862-c571303f6364?w=600&h=400&fit=crop&auto=format",
    imgAlt: "Guitarra del Caribe sobre fondo marino",
    regionCount: 4,
  },
  {
    id: 4,
    common: "Raya eléctrica",
    scientific: "Narcine bancroftii",
    family: "Narcinidae",
    description:
      "Produce descargas eléctricas para defenderse y capturar presas. Su cuerpo es redondeado y la cola es gruesa. Suele enterrarse en arena o fango. Al verla, ¡no la toques!",
    habitat: "Fondos fangosos, arenosos y rocosos someros",
    depth: "0 – 110 m",
    size: "Hasta 45 cm de largo",
    status: "Casi amenazada",
    statusColor: "#FCD34D",
    color: "Pardo con manchas oscuras irregulares",
    img: "https://images.unsplash.com/photo-1682957205610-6101d3452fba?w=600&h=400&fit=crop&auto=format",
    imgAlt: "Raya eléctrica sobre el fondo marino",
    regionCount: 3,
  },
  {
    id: 5,
    common: "Raya de arrecife",
    scientific: "Urobatis jamaicensis",
    family: "Urotrygonidae",
    description:
      "Pequeña raya de aguas someras, frecuente en pastos marinos y arenas cerca de arrecifes. Muy común en el Caribe pero poco documentada en el Urabá.",
    habitat: "Pastos marinos y fondos coralinos costeros",
    depth: "0 – 25 m",
    size: "Hasta 35 cm de ancho",
    status: "Preocupación menor",
    statusColor: "#22C55E",
    color: "Pardo amarillento con pequeñas manchas",
    img: "https://images.unsplash.com/photo-1560364897-472befdd3d1c?w=600&h=400&fit=crop&auto=format",
    imgAlt: "Raya de arrecife sobre fondo arenoso",
    regionCount: 8,
  },
]

const BASE_OBSERVATIONS: Observation[] = [
  // — Propias
  {
    id: "OBS-001",
    date: "8 sep 2026",
    location: "Bahía El Uno, Turbo",
    species: SPECIES_DB[0],
    aiConfidence: 88,
    photo: "https://images.unsplash.com/photo-1577095972574-2fbdcf60c8ef?w=600&h=400&fit=crop&auto=format",
    notes: "Encontrada en aguas muy poco profundas, cerca de la orilla. Estaba quieta sobre el fondo.",
    depth: "1.5 m",
    isOwn: true,
    author: "Juan Carlos",
    authorRole: "Pescador artesanal",
    expertValidation: {
      validatorName: "Dra. Camila Restrepo",
      pct: 95,
      date: "10 sep 2026",
    },
  },
  {
    id: "OBS-002",
    date: "5 sep 2026",
    location: "Playa Larga, Necoclí",
    species: SPECIES_DB[1],
    aiConfidence: 62,
    photo: "https://images.unsplash.com/photo-1741364855968-7355d89c7d94?w=600&h=400&fit=crop&auto=format",
    notes: "Vista saltando fuera del agua. Foto tomada desde la lancha.",
    depth: "En superficie",
    isOwn: true,
    author: "Juan Carlos",
    authorRole: "Pescador artesanal",
  },
  {
    id: "OBS-003",
    date: "1 sep 2026",
    location: "Bocas del Atrato, Turbo",
    species: SPECIES_DB[3],
    aiConfidence: 91,
    photo: "https://images.unsplash.com/photo-1682957205610-6101d3452fba?w=600&h=400&fit=crop&auto=format",
    notes: "Atrapada accidentalmente en la red. La liberamos de inmediato.",
    depth: "2 m",
    isOwn: true,
    author: "Juan Carlos",
    authorRole: "Pescador artesanal",
    expertValidation: {
      validatorName: "Dr. Álvaro Jiménez",
      pct: 90,
      date: "3 sep 2026",
    },
  },
  // — Comunidad
  {
    id: "OBS-004",
    date: "10 sep 2026",
    location: "Punta Las Vacas, Necoclí",
    species: SPECIES_DB[2],
    aiConfidence: 61,
    photo: "https://images.unsplash.com/photo-1560038862-c571303f6364?w=600&h=400&fit=crop&auto=format",
    notes: "Encontrada en la orilla después de la tormenta. No se movía.",
    depth: "En orilla",
    isOwn: false,
    author: "María Torres",
    authorRole: "Ciudadana",
  },
  {
    id: "OBS-005",
    date: "9 sep 2026",
    location: "Muelle de Turbo",
    species: SPECIES_DB[4],
    aiConfidence: 78,
    photo: "https://images.unsplash.com/photo-1560364897-472befdd3d1c?w=600&h=400&fit=crop&auto=format",
    notes: "Nadaba despacio entre los pilotes del muelle al amanecer.",
    depth: "0.8 m",
    isOwn: false,
    author: "Pedro Castaño",
    authorRole: "Pescador artesanal",
    expertValidation: {
      validatorName: "Dra. Camila Restrepo",
      pct: 82,
      date: "9 sep 2026",
    },
  },
  {
    id: "OBS-006",
    date: "4 sep 2026",
    location: "Bahía Colombia, Turbo",
    species: SPECIES_DB[0],
    aiConfidence: 84,
    photo: "https://images.unsplash.com/photo-1577095972574-2fbdcf60c8ef?w=600&h=400&fit=crop&auto=format",
    notes: "Raya grande, de unos 80 cm de ancho. Nadó hacia el fondo al acercarnos.",
    depth: "3 m",
    isOwn: false,
    author: "Luz Adriana Pino",
    authorRole: "Trabajadora de campo",
  },
  {
    id: "OBS-007",
    date: "29 ago 2026",
    location: "Desembocadura río León",
    species: SPECIES_DB[1],
    aiConfidence: 54,
    photo: "https://images.unsplash.com/photo-1741364855968-7355d89c7d94?w=600&h=400&fit=crop&auto=format",
    notes: "Muy difícil fotografiar porque se movía rápido. La foto salió movida.",
    depth: "Superficie",
    isOwn: false,
    author: "Carlos Díaz",
    authorRole: "Pescador artesanal",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function aiLabel(pct: number): { text: string; color: string; bg: string } {
  if (pct >= 75) return { text: "Alta certeza", color: "#166534", bg: "#DCFCE7" }
  if (pct >= 45) return { text: "Certeza media", color: "#92400E", bg: "#FEF3C7" }
  return { text: "Baja certeza", color: "#991B1B", bg: "#FEE2E2" }
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcoHome = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={active ? "#0284C7" : "#94A3B8"} strokeWidth="2" fill={active ? "#BAE6FD" : "none"} strokeLinejoin="round" />
    <path d="M9 21V12h6v9" stroke={active ? "#0284C7" : "#94A3B8"} strokeWidth="2" strokeLinejoin="round" />
  </svg>
)
const IcoHistory = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke={active ? "#0284C7" : "#94A3B8"} strokeWidth="2" fill={active ? "#BAE6FD" : "none"} />
    <path d="M7 9h10M7 13h7" stroke={active ? "#0284C7" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IcoSpecies = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <ellipse cx="12" cy="13" rx="8" ry="5" stroke={active ? "#0284C7" : "#94A3B8"} strokeWidth="2" fill={active ? "#BAE6FD" : "none"} />
    <path d="M12 8C12 5 16 3 20 4" stroke={active ? "#0284C7" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="12" r="1" fill={active ? "#0284C7" : "#94A3B8"} />
  </svg>
)
const IcoProfile = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" stroke={active ? "#0284C7" : "#94A3B8"} strokeWidth="2" fill={active ? "#BAE6FD" : "none"} />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? "#0284C7" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IcoCamera = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="white" strokeWidth="2" fill="none" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2" />
  </svg>
)
const IcoGallery = () => (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
    <path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)
const IcoBack = ({ light }: { light?: boolean }) => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke={light ? "white" : "#1E293B"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IcoCheck = ({ color = "white" }: { color?: string }) => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path d="M5 12l5 5L20 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IcoLocation = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#0284C7" strokeWidth="2" fill="#BAE6FD" />
    <circle cx="12" cy="9" r="2.5" stroke="#0284C7" strokeWidth="2" />
  </svg>
)
const IcoDepth = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
    <path d="M12 2v20M5 8l7-6 7 6" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IcoClock = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke="#0284C7" strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IcoEdit = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#0284C7" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)
const IcoShield = ({ color = "#22C55E" }: { color?: string }) => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z" stroke={color} strokeWidth="2" fill={color + "22"} strokeLinejoin="round" />
    <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IcoPlus = () => (
  <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)
const IcoInfo = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke="#0284C7" strokeWidth="2" />
    <path d="M12 11v5M12 8v.01" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IcoStar = ({ filled }: { filled?: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "#FCD34D" : "none"}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)
const IcoNotification = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IcoExpert = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
    <path d="M12 7v5l3 2" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" fill="#92400E" />
  </svg>
)
const IcoPercent = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <circle cx="9" cy="9" r="3" stroke="#0284C7" strokeWidth="2" />
    <circle cx="15" cy="15" r="3" stroke="#0284C7" strokeWidth="2" />
    <path d="M19 5L5 19" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IcoCertificate = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
    <rect x="2" y="4" width="20" height="14" rx="2" stroke="white" strokeWidth="2" />
    <path d="M7 9h10M7 13h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="17" cy="18" r="4" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
    <path d="M15.5 18l1 1 2-2" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─── Compound Badge Components ────────────────────────────────────────────────
const AiConfidenceDisplay = ({
  pct,
  isExpert,
  size = "sm",
}: {
  pct: number
  isExpert: boolean
  size?: "sm" | "md"
}) => {
  const label = aiLabel(pct)
  if (isExpert) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "#EFF6FF", color: "#0284C7", fontFamily: "Nunito, sans-serif" }}
        >
          EXPERTO
        </span>
        <span
          className="font-bold"
          style={{
            fontSize: size === "md" ? 13 : 11,
            color: "#0284C7",
            fontFamily: "Source Sans 3, sans-serif",
          }}
        >
          Modelo: {pct}%
        </span>
      </div>
    )
  }
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: label.bg, color: label.color, fontFamily: "Nunito, sans-serif" }}
    >
      {label.text}
    </span>
  )
}

const ExpertValidationBadge = ({ val }: { val: ExpertValidation }) => (
  <div
    className="flex items-center gap-2 px-3 py-2 rounded-xl"
    style={{ background: "#FFFBEB" }}
  >
    <IcoShield color="#F59E0B" />
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold" style={{ color: "#92400E", fontFamily: "Nunito, sans-serif" }}>
        Validado por experto · {val.pct}%
      </p>
      <p className="text-[10px] truncate" style={{ color: "#B45309", fontFamily: "Source Sans 3, sans-serif" }}>
        {val.validatorName} · {val.date}
      </p>
    </div>
  </div>
)

const StatusBadge = ({ status, color }: { status: string; color: string }) => (
  <span
    className="text-xs font-bold px-2 py-0.5 rounded-full"
    style={{ backgroundColor: color + "22", color, fontFamily: "Nunito, sans-serif" }}
  >
    {status}
  </span>
)

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
const BottomNav = ({
  active,
  onNav,
}: {
  active: TabId
  onNav: (tab: TabId) => void
}) => {
  const tabs: { id: TabId; label: string; Icon: React.FC<{ active?: boolean }> }[] = [
    { id: "home", label: "Inicio", Icon: IcoHome },
    { id: "records", label: "Registros", Icon: IcoHistory },
    { id: "species", label: "Especies", Icon: IcoSpecies },
    { id: "profile", label: "Perfil", Icon: IcoProfile },
  ]
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 bg-white flex items-center justify-around border-t border-slate-100"
      style={{ height: 68, paddingBottom: 8 }}
    >
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onNav(id)}
          className="flex flex-col items-center gap-0.5 flex-1 py-2 transition-opacity active:opacity-70"
          aria-label={label}
        >
          <Icon active={active === id} />
          <span
            className="text-[11px] font-semibold"
            style={{ fontFamily: "Nunito, sans-serif", color: active === id ? "#0284C7" : "#94A3B8" }}
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  )
}

// ─── Screen: Splash ───────────────────────────────────────────────────────────
const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "#0284C7" }}>
      <div className="flex flex-col items-center gap-5" style={{ animation: "fade-up 0.5s ease-out forwards" }}>
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <svg width="56" height="56" fill="none" viewBox="0 0 56 56">
              <ellipse cx="28" cy="30" rx="20" ry="10" fill="white" opacity="0.9" />
              <path d="M28 40 Q32 50 28 52 Q24 50 28 40" fill="white" opacity="0.7" />
              <path d="M8 30 Q16 20 28 30" fill="white" opacity="0.5" />
              <path d="M48 30 Q40 20 28 30" fill="white" opacity="0.5" />
              <circle cx="22" cy="28" r="2.5" fill="#0284C7" />
              <path d="M4 44 Q10 41 16 44 Q22 47 28 44 Q34 41 40 44 Q46 47 52 44" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
            </svg>
          </div>
          <div className="animate-pulse-ring absolute inset-0 rounded-3xl" style={{ border: "2px solid rgba(255,255,255,0.3)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-white" style={{ fontFamily: "Nunito, sans-serif" }}>IdentiMar</h1>
          <p className="text-sm mt-1 font-medium" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "Source Sans 3, sans-serif" }}>Urabá Antioqueño · Colombia</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/60 wave-bar" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
      <p className="absolute bottom-8 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Source Sans 3, sans-serif" }}>Con apoyo científico</p>
    </div>
  )
}

// ─── Screen: Home ─────────────────────────────────────────────────────────────
const HomeScreen = ({
  isExpert,
  observations,
  onNewObs,
  onObsDetail,
  onSpeciesDetail,
}: {
  isExpert: boolean
  observations: Observation[]
  onNewObs: () => void
  onObsDetail: (obs: Observation) => void
  onSpeciesDetail: (sp: Species) => void
}) => (
  <div className="absolute inset-0 overflow-y-auto scrollable" style={{ background: "#F4F6F8", paddingBottom: 76 }}>
    <div className="px-5 pt-4 pb-6" style={{ background: "linear-gradient(160deg, #0284C7 0%, #0369A1 100%)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-blue-100/80" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Buenos días</p>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white" style={{ fontFamily: "Nunito, sans-serif" }}>¿Qué encontraste hoy?</h2>
            {isExpert && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: "#FCD34D", color: "#92400E", fontFamily: "Nunito, sans-serif" }}>
                EXPERTO
              </span>
            )}
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30">
          <IcoNotification />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Registros", value: String(observations.filter(o => o.isOwn).length) }, { label: "Comunidad", value: String(observations.length) }, { label: "Esta semana", value: "1" }].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-white/15 px-3 py-2.5 text-center">
            <p className="text-xl font-black text-white" style={{ fontFamily: "Nunito, sans-serif" }}>{value}</p>
            <p className="text-[10px] text-blue-100/80" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="px-5 -mt-4">
      <button
        onClick={onNewObs}
        className="w-full rounded-2xl py-4 flex items-center gap-4 shadow-lg active:scale-[0.98] transition-transform"
        style={{ background: "#1E293B" }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center ml-4 flex-shrink-0" style={{ background: "#0284C7" }}>
          <IcoCamera />
        </div>
        <div className="text-left">
          <p className="text-white font-black text-base" style={{ fontFamily: "Nunito, sans-serif" }}>Nueva observación</p>
          <p className="text-slate-400 text-xs font-medium" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Fotografía y registra una raya</p>
        </div>
        <div className="ml-auto mr-4"><IcoPlus /></div>
      </button>
    </div>

    <div className="px-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-slate-deep" style={{ fontFamily: "Nunito, sans-serif" }}>Últimos registros</h3>
      </div>
      <div className="flex flex-col gap-3">
        {observations.slice(0, 2).map((obs) => (
          <button key={obs.id} onClick={() => onObsDetail(obs)} className="w-full text-left bg-card rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
            <div className="flex gap-3 p-3">
              <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-slate-100 overflow-hidden" style={{ minWidth: 64 }}>
                <img src={obs.photo} alt={obs.species.imgAlt} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-slate-deep text-sm leading-tight truncate" style={{ fontFamily: "Nunito, sans-serif" }}>{obs.species.common}</p>
                  <AiConfidenceDisplay pct={obs.aiConfidence} isExpert={isExpert} />
                </div>
                <p className="text-xs italic text-slate-mid mt-0.5 truncate" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.species.scientific}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <IcoLocation />
                  <p className="text-[11px] text-slate-mid truncate" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.location}</p>
                </div>
              </div>
            </div>
            {obs.expertValidation && (
              <div className="mx-3 mb-3">
                <ExpertValidationBadge val={obs.expertValidation} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>

    <div className="px-5 mt-6 mb-2">
      <h3 className="text-sm font-black text-slate-deep mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>¿Sabías esto?</h3>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FCD34D" }}>
        <div className="relative h-28 bg-ocean overflow-hidden">
          <img src={SPECIES_DB[1].img} alt={SPECIES_DB[1].imgAlt} className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-ocean/80 to-transparent" />
          <p className="absolute bottom-3 left-4 text-white font-black text-base leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>Raya chucho</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-slate-deep leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
            La raya chucho puede saltar varios metros fuera del agua. Si la ves en Turbo o Necoclí, ¡regístrala!
          </p>
          <button onClick={() => onSpeciesDetail(SPECIES_DB[1])} className="mt-2 text-xs font-black" style={{ color: "#0369A1", fontFamily: "Nunito, sans-serif" }}>
            Saber más →
          </button>
        </div>
      </div>
    </div>
  </div>
)

// ─── Obs Card (reusable) ───────────────────────────────────────────────────────
const ObsCard = ({
  obs,
  isExpert,
  showAuthor,
  onPress,
}: {
  obs: Observation
  isExpert: boolean
  showAuthor: boolean
  onPress: () => void
}) => {
  const label = aiLabel(obs.aiConfidence)
  return (
    <button onClick={onPress} className="w-full text-left bg-card rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
      <div className="relative h-44 bg-slate-100">
        <img src={obs.photo} alt={obs.species.imgAlt} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
        {/* confidence top-right */}
        <div className="absolute top-3 right-3">
          {isExpert ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#0284C7", fontFamily: "Nunito, sans-serif" }}>
              {obs.aiConfidence}%
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: label.bg, color: label.color, fontFamily: "Nunito, sans-serif" }}>
              {label.text}
            </span>
          )}
        </div>
        {obs.expertValidation && (
          <div className="absolute top-3 left-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#FEF3C7" }}>
              <IcoShield color="#F59E0B" />
            </div>
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-white font-black text-base leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>{obs.species.common}</p>
          <p className="text-white/70 text-xs italic" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.species.scientific}</p>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <IcoLocation />
            <p className="text-xs text-slate-mid truncate max-w-[150px]" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.location}</p>
          </div>
          <div className="flex items-center gap-1">
            <IcoClock />
            <p className="text-xs text-slate-light" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.date}</p>
          </div>
        </div>
        {showAuthor && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: "#0284C7", fontFamily: "Nunito, sans-serif" }}>
              {obs.author[0]}
            </div>
            <p className="text-[11px] text-slate-mid" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.author} · {obs.authorRole}</p>
          </div>
        )}
      </div>
      {obs.expertValidation && (
        <div className="mx-3 mb-3">
          <ExpertValidationBadge val={obs.expertValidation} />
        </div>
      )}
    </button>
  )
}

// ─── Screen: Records ──────────────────────────────────────────────────────────
const RecordsScreen = ({
  isExpert,
  observations,
  tab,
  onTabChange,
  onDetail,
}: {
  isExpert: boolean
  observations: Observation[]
  tab: RecordsTab
  onTabChange: (t: RecordsTab) => void
  onDetail: (obs: Observation) => void
}) => {
  const shown = tab === "mis" ? observations.filter(o => o.isOwn) : observations

  const validationStates: Record<string, { label: string; color: string; bg: string }> = {
    "OBS-001": { label: "Validado", color: "#166534", bg: "#DCFCE7" },
    "OBS-002": { label: "En revisión", color: "#92400E", bg: "#FEF3C7" },
    "OBS-003": { label: "Validado", color: "#166534", bg: "#DCFCE7" },
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#F4F6F8", paddingBottom: 68 }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <h1 className="text-2xl font-black text-slate-deep" style={{ fontFamily: "Nunito, sans-serif" }}>Registros</h1>
        <p className="text-sm text-slate-mid mt-0.5" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
          {tab === "todos" ? `${observations.length} observaciones de la comunidad` : `${observations.filter(o => o.isOwn).length} tus observaciones`}
        </p>
      </div>

      {/* Segmented control */}
      <div className="px-4 mb-3 flex-shrink-0">
        <div className="bg-slate-200/80 rounded-2xl p-1 flex gap-1">
          {(["todos", "mis"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
              style={{
                fontFamily: "Nunito, sans-serif",
                background: tab === t ? "white" : "transparent",
                color: tab === t ? "#0284C7" : "#94A3B8",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
              }}
            >
              {t === "todos" ? "Todos" : "Mis registros"}
            </button>
          ))}
        </div>
      </div>

      {/* Expert indicator */}
      {isExpert && tab === "todos" && (
        <div className="mx-4 mb-3 flex-shrink-0 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: "#FFFBEB" }}>
          <IcoShield color="#F59E0B" />
          <p className="text-xs font-semibold" style={{ color: "#92400E", fontFamily: "Source Sans 3, sans-serif" }}>
            Como experto puedes validar cualquier observación
          </p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollable px-4">
        {tab === "mis" ? (
          // Personal observations with status
          <div className="flex flex-col gap-3 pb-4">
            {shown.map((obs) => {
              const vs = validationStates[obs.id]
              return (
                <button key={obs.id} onClick={() => onDetail(obs)} className="w-full text-left bg-card rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
                  <div className="flex gap-3 p-3">
                    <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-slate-100 overflow-hidden">
                      <img src={obs.photo} alt={obs.species.imgAlt} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-deep text-base leading-tight truncate" style={{ fontFamily: "Nunito, sans-serif" }}>{obs.species.common}</p>
                      <p className="text-xs italic text-slate-mid mt-0.5" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.species.scientific}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <IcoLocation />
                        <p className="text-[11px] text-slate-mid truncate" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.location}</p>
                      </div>
                      <p className="text-[11px] text-slate-light" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.date}</p>
                    </div>
                  </div>
                  <div className="mx-3 mb-3 flex items-center justify-between">
                    <AiConfidenceDisplay pct={obs.aiConfidence} isExpert={isExpert} />
                    {vs && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: vs.bg, color: vs.color, fontFamily: "Nunito, sans-serif" }}>
                        {vs.label}
                      </span>
                    )}
                  </div>
                  {obs.expertValidation && (
                    <div className="mx-3 mb-3">
                      <ExpertValidationBadge val={obs.expertValidation} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {shown.map((obs) => (
              <ObsCard key={obs.id} obs={obs} isExpert={isExpert} showAuthor onPress={() => onDetail(obs)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen: Obs Detail ───────────────────────────────────────────────────────
const ObsDetailScreen = ({
  obs,
  isExpert,
  onBack,
  onValidate,
}: {
  obs: Observation
  isExpert: boolean
  onBack: () => void
  onValidate: (obsId: string, pct: number) => void
}) => {
  const [valPct, setValPct] = useState(85)
  const [submitted, setSubmitted] = useState(false)
  const [showValForm, setShowValForm] = useState(false)
  const hasValidation = !!obs.expertValidation

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => {
      onValidate(obs.id, valPct)
    }, 1000)
  }

  return (
    <div className="absolute inset-0 overflow-y-auto scrollable" style={{ background: "#F4F6F8", paddingBottom: 20 }}>
      {/* Hero */}
      <div className="relative h-72 bg-ocean overflow-hidden">
        <img src={obs.photo} alt={obs.species.imgAlt} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)" }} />
        <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center active:bg-black/60">
          <IcoBack light />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <AiConfidenceDisplay pct={obs.aiConfidence} isExpert={isExpert} size="md" />
              <h2 className="text-white font-black text-2xl mt-1 leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>{obs.species.common}</h2>
              <p className="text-blue-100 text-sm italic" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.species.scientific}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        {/* Author */}
        {!obs.isOwn && (
          <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0" style={{ background: "#0284C7", fontFamily: "Nunito, sans-serif" }}>
              {obs.author[0]}
            </div>
            <div>
              <p className="font-black text-slate-deep text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>{obs.author}</p>
              <p className="text-xs text-slate-mid" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.authorRole} · {obs.date}</p>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-black text-slate-deep text-sm mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>Detalles del registro</p>
          <div className="flex flex-col gap-2.5">
            {[{ icon: <IcoLocation />, label: "Lugar", value: obs.location }, { icon: <IcoClock />, label: "Fecha", value: obs.date }, { icon: <IcoDepth />, label: "Profundidad", value: obs.depth }].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>{icon}</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#94A3B8", fontFamily: "Nunito, sans-serif" }}>{label}</p>
                  <p className="text-sm font-semibold text-slate-deep" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {obs.notes && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-black text-slate-deep text-sm mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Notas</p>
            <p className="text-sm text-slate-mid leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.notes}</p>
          </div>
        )}

        {/* Existing expert validation */}
        {obs.expertValidation && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <IcoShield color="#F59E0B" />
              <p className="font-black text-sm" style={{ color: "#92400E", fontFamily: "Nunito, sans-serif" }}>Validación de experto</p>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{ background: "#FEF3C7" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${obs.expertValidation.pct}%`, background: "linear-gradient(90deg, #F59E0B, #FCD34D)" }}
                />
              </div>
              <span className="font-black text-base" style={{ color: "#92400E", fontFamily: "Nunito, sans-serif" }}>
                {obs.expertValidation.pct}%
              </span>
            </div>
            <p className="text-xs text-slate-mid" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
              {obs.expertValidation.validatorName} · {obs.expertValidation.date}
            </p>
            <p className="text-xs text-slate-light mt-1" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
              El experto está {obs.expertValidation.pct}% seguro de que la identificación es correcta.
            </p>
          </div>
        )}

        {/* AI disclaimer for normal users */}
        {!isExpert && (
          <div className="rounded-2xl p-4 flex items-start gap-2" style={{ background: "#EFF6FF" }}>
            <div className="mt-0.5"><IcoInfo /></div>
            <p className="text-xs leading-relaxed" style={{ color: "#1E40AF", fontFamily: "Source Sans 3, sans-serif" }}>
              Esta identificación fue sugerida automáticamente. Un experto puede revisarla y confirmarla.
            </p>
          </div>
        )}

        {/* Expert validation block */}
        {isExpert && !hasValidation && (
          <>
            {!showValForm ? (
              <button
                onClick={() => setShowValForm(true)}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-black text-white text-base active:scale-[0.98] transition-transform shadow-md"
                style={{ background: "linear-gradient(135deg, #F59E0B, #FCD34D)", fontFamily: "Nunito, sans-serif" }}
              >
                <IcoShield color="white" />
                Validar esta identificación
              </button>
            ) : submitted ? (
              <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2" style={{ background: "#FEF3C7" }}>
                <IcoShield color="#F59E0B" />
                <span className="font-black text-base" style={{ color: "#92400E", fontFamily: "Nunito, sans-serif" }}>¡Validación enviada!</span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <IcoShield color="#F59E0B" />
                  <p className="font-black text-sm" style={{ color: "#92400E", fontFamily: "Nunito, sans-serif" }}>Validar identificación</p>
                </div>
                <p className="text-xs text-slate-mid mb-4 leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
                  ¿Qué tan seguro estás de que esta es una <strong>{obs.species.common}</strong>?
                </p>

                {/* Percentage display */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-mid" style={{ fontFamily: "Nunito, sans-serif" }}>Certeza del experto</p>
                  <span className="text-2xl font-black" style={{ color: "#F59E0B", fontFamily: "Nunito, sans-serif" }}>{valPct}%</span>
                </div>

                {/* Slider */}
                <div className="relative mb-1">
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "#FEF3C7" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${valPct}%`, background: "linear-gradient(90deg, #F59E0B, #FCD34D)" }} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={valPct}
                    onChange={(e) => setValPct(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    style={{ height: 12 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-light mb-4" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
                  <span>Poco seguro</span><span>Muy seguro</span>
                </div>

                {/* Interpretation */}
                <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background: "#FFFBEB" }}>
                  <p className="text-xs font-semibold leading-relaxed" style={{ color: "#92400E", fontFamily: "Source Sans 3, sans-serif" }}>
                    {valPct >= 80
                      ? "Identificación muy probable. Buen registro para la comunidad."
                      : valPct >= 50
                      ? "La especie es plausible, aunque la foto podría ser más clara."
                      : "Difícil confirmar con esta imagen. Se recomienda una nueva observación."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowValForm(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-mid text-sm border border-slate-200" style={{ fontFamily: "Nunito, sans-serif" }}>
                    Cancelar
                  </button>
                  <button onClick={handleSubmit} className="flex-2 px-5 py-3 rounded-xl font-black text-white text-sm active:scale-95 transition-transform" style={{ background: "#F59E0B", fontFamily: "Nunito, sans-serif", flex: 2 }}>
                    Enviar validación
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Species */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="h-28 relative bg-slate-100">
            <img src={obs.species.img} alt={obs.species.imgAlt} className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-3"><StatusBadge status={obs.species.status} color={obs.species.statusColor} /></div>
          </div>
          <div className="p-4">
            <p className="font-black text-slate-deep text-sm mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>Sobre esta especie</p>
            <p className="text-xs text-slate-mid leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{obs.species.description}</p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-light" style={{ fontFamily: "Source Sans 3, sans-serif" }}>ID: {obs.id}</p>
      </div>
    </div>
  )
}

// ─── Screen: New Photo ────────────────────────────────────────────────────────
const NewPhotoScreen = ({ onBack, onPhotoTaken }: { onBack: () => void; onPhotoTaken: () => void }) => {
  const [mode, setMode] = useState<"camera" | "gallery">("camera")
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#0F172A" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3 z-10">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
        </button>
        <div className="text-center">
          <p className="text-white font-black text-base" style={{ fontFamily: "Nunito, sans-serif" }}>Nueva observación</p>
          <p className="text-white/50 text-xs" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Paso 1 de 3</p>
        </div>
        <div className="w-10" />
      </div>
      <div className="px-4 mb-2">
        <div className="h-1 bg-white/15 rounded-full"><div className="h-full rounded-full bg-ocean w-1/3" /></div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1560364897-472befdd3d1c?w=400&h=600&fit=crop&auto=format" alt="Vista previa de cámara" className="absolute inset-0 w-full h-full object-cover opacity-80" />
        {["top-8 left-8", "top-8 right-8 rotate-90", "bottom-24 left-8 -rotate-90", "bottom-24 right-8 rotate-180"].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-8 h-8`}><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M4 16V4h12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        ))}
        <div className="animate-scan-line absolute left-8 right-8 h-px bg-ocean/80" style={{ boxShadow: "0 0 8px #0284C7" }} />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
          <p className="text-white text-xs font-semibold text-center" style={{ fontFamily: "Nunito, sans-serif" }}>Centra la raya en el encuadre</p>
        </div>
      </div>
      <div className="px-6 pb-8 pt-5" style={{ background: "#0F172A" }}>
        <div className="flex justify-center gap-3 mb-5">
          {(["camera", "gallery"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95" style={{ fontFamily: "Nunito, sans-serif", background: mode === m ? "#0284C7" : "rgba(255,255,255,0.1)", color: mode === m ? "white" : "rgba(255,255,255,0.6)" }}>
              {m === "camera" ? "Cámara" : "Galería"}
            </button>
          ))}
        </div>
        {mode === "camera" ? (
          <div className="flex items-center justify-center gap-8">
            <div className="w-10" />
            <button onClick={onPhotoTaken} className="w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform" style={{ boxShadow: "0 0 0 4px rgba(255,255,255,0.25)" }}>
              <div className="w-16 h-16 rounded-full bg-white border-4 border-slate-200" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M1 4v6h6M23 20v-6h-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M20.5 9A9 9 0 005.2 5.2M3.5 15a9 9 0 0015.3 3.8" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={onPhotoTaken} className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-white text-base active:scale-95 transition-transform" style={{ background: "#0284C7", fontFamily: "Nunito, sans-serif" }}>
            <IcoGallery />Elegir de la galería
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Screen: New Preview ──────────────────────────────────────────────────────
const NewPreviewScreen = ({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) => (
  <div className="absolute inset-0 flex flex-col" style={{ background: "#0F172A" }}>
    <div className="flex items-center justify-between px-4 pt-4 pb-3">
      <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25"><IcoBack light /></button>
      <div className="text-center">
        <p className="text-white font-black text-base" style={{ fontFamily: "Nunito, sans-serif" }}>¿Se ve bien?</p>
        <p className="text-white/50 text-xs" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Paso 1 de 3</p>
      </div>
      <div className="w-10" />
    </div>
    <div className="px-4 mb-3"><div className="h-1 bg-white/15 rounded-full"><div className="h-full rounded-full bg-ocean w-1/3" /></div></div>
    <div className="flex-1 mx-4 rounded-3xl overflow-hidden bg-slate-800">
      <img src="https://images.unsplash.com/photo-1560364897-472befdd3d1c?w=400&h=550&fit=crop&auto=format" alt="Foto de la raya capturada" className="w-full h-full object-cover" />
    </div>
    <div className="mx-4 mt-3 px-4 py-2.5 rounded-2xl bg-white/10 flex items-start gap-2">
      <div className="mt-0.5 flex-shrink-0"><IcoInfo /></div>
      <p className="text-white/75 text-xs leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Mientras más clara sea la foto, mejor será la identificación.</p>
    </div>
    <div className="px-4 pt-3 pb-8 flex gap-3">
      <button onClick={onBack} className="flex-1 py-4 rounded-2xl font-black text-white/80 text-base border border-white/20" style={{ fontFamily: "Nunito, sans-serif" }}>Volver a tomar</button>
      <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{ background: "#0284C7", fontFamily: "Nunito, sans-serif" }}>
        <IcoCheck />Usar esta foto
      </button>
    </div>
  </div>
)

// ─── Screen: New Info ─────────────────────────────────────────────────────────
const NewInfoScreen = ({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) => {
  const [location, setLocation] = useState("Turbo, Antioquia")
  const [depth, setDepth] = useState("")
  const [notes, setNotes] = useState("")
  const [waterType, setWaterType] = useState("marino")
  const [time, setTime] = useState("Mañana")
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#F4F6F8" }}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm active:scale-95"><IcoBack /></button>
        <div>
          <p className="font-black text-slate-deep text-base" style={{ fontFamily: "Nunito, sans-serif" }}>Información básica</p>
          <p className="text-slate-light text-xs" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Paso 2 de 3</p>
        </div>
      </div>
      <div className="px-4 mb-4"><div className="h-1.5 bg-slate-200 rounded-full"><div className="h-full rounded-full bg-ocean w-2/3" /></div></div>
      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        <div className="mb-4">
          <label className="block text-sm font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>¿Dónde fue?</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><IcoLocation /></div>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-white rounded-2xl pl-9 pr-4 py-3.5 text-sm text-slate-deep font-medium border border-slate-200 focus:outline-none focus:border-ocean" style={{ fontFamily: "Source Sans 3, sans-serif" }} placeholder="Escribe el lugar" />
          </div>
          <button className="mt-2 flex items-center gap-1.5 text-xs font-bold text-ocean" style={{ fontFamily: "Nunito, sans-serif" }}><IcoLocation />Usar mi ubicación actual</button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Tipo de agua</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ value: "marino", label: "Mar" }, { value: "estuario", label: "Estuario" }, { value: "manglar", label: "Manglar" }].map(({ value, label }) => (
              <button key={value} onClick={() => setWaterType(value)} className="py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95" style={{ fontFamily: "Nunito, sans-serif", background: waterType === value ? "#EFF6FF" : "white", borderColor: waterType === value ? "#0284C7" : "#E2E8F0", color: waterType === value ? "#0284C7" : "#475569" }}>{label}</button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>¿A qué hora del día?</label>
          <div className="grid grid-cols-3 gap-2">
            {["Mañana", "Tarde", "Noche"].map((t) => (
              <button key={t} onClick={() => setTime(t)} className="py-3 rounded-2xl text-sm font-bold border transition-all active:scale-95" style={{ fontFamily: "Nunito, sans-serif", background: time === t ? "#EFF6FF" : "white", borderColor: time === t ? "#0284C7" : "#E2E8F0", color: time === t ? "#0284C7" : "#475569" }}>{t}</button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Profundidad aproximada (opcional)</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><IcoDepth /></div>
            <input value={depth} onChange={(e) => setDepth(e.target.value)} className="w-full bg-white rounded-2xl pl-9 pr-4 py-3.5 text-sm text-slate-deep font-medium border border-slate-200 focus:outline-none focus:border-ocean" style={{ fontFamily: "Source Sans 3, sans-serif" }} placeholder="Ej: 2 m, poco profundo…" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Notas adicionales (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white rounded-2xl px-4 py-3.5 text-sm text-slate-deep font-medium border border-slate-200 focus:outline-none focus:border-ocean resize-none" style={{ fontFamily: "Source Sans 3, sans-serif" }} rows={3} placeholder="¿Algo especial que notaste?" />
        </div>
      </div>
      <div className="px-4 pb-6 pt-3 bg-surface">
        <button onClick={onSubmit} className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform" style={{ background: "#0284C7", fontFamily: "Nunito, sans-serif" }}>
          Enviar para identificación →
        </button>
      </div>
    </div>
  )
}

// ─── Screen: Processing ───────────────────────────────────────────────────────
const ProcessingScreen = ({ onDone }: { onDone: () => void }) => {
  const [step, setStep] = useState(0)
  const steps = ["Analizando la imagen…", "Comparando características…", "Revisando datos del Urabá…", "Preparando resultado…"]
  useEffect(() => {
    const timers = [0, 1400, 2600, 3600].map((d, i) => setTimeout(() => setStep(i), d))
    const done = setTimeout(onDone, 5000)
    return () => { timers.forEach(clearTimeout); clearTimeout(done) }
  }, [onDone])
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-8" style={{ background: "#F4F6F8" }}>
      <div className="relative w-36 h-36 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="animate-spin-slow absolute inset-0 rounded-full border-4 border-transparent" style={{ borderTopColor: "#0284C7" }} />
        <div className="absolute inset-4 rounded-full bg-white shadow-md flex items-center justify-center">
          <svg width="48" height="48" fill="none" viewBox="0 0 56 56">
            <ellipse cx="28" cy="30" rx="18" ry="9" fill="#BAE6FD" />
            <path d="M28 39 Q31 48 28 50 Q25 48 28 39" fill="#93C5FD" />
            <path d="M10 30 Q18 22 28 30" fill="#DBEAFE" />
            <path d="M46 30 Q38 22 28 30" fill="#DBEAFE" />
            <circle cx="23" cy="28" r="2.5" fill="#0284C7" />
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-black text-slate-deep text-center mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Identificando…</h2>
      <p className="text-sm text-slate-mid text-center mb-8" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Estamos analizando tu foto con ayuda de inteligencia de especies</p>
      <div className="w-full flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-sm transition-all" style={{ opacity: i <= step ? 1 : 0.35 }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: i < step ? "#0284C7" : i === step ? "#BAE6FD" : "#E2E8F0" }}>
              {i < step ? <IcoCheck /> : i === step ? <div className="w-2.5 h-2.5 rounded-full bg-ocean animate-pulse" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
            </div>
            <p className="text-sm font-semibold" style={{ fontFamily: "Source Sans 3, sans-serif", color: i <= step ? "#1E293B" : "#94A3B8" }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screen: Result ───────────────────────────────────────────────────────────
const ResultScreen = ({ isExpert, onSave, onCorrect }: { isExpert: boolean; onSave: () => void; onCorrect: () => void }) => {
  const species = SPECIES_DB[4]
  const [saved, setSaved] = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(onSave, 1500) }
  return (
    <div className="absolute inset-0 overflow-y-auto scrollable" style={{ background: "#F4F6F8" }}>
      <div className="relative h-64 bg-ocean overflow-hidden">
        <img src="https://images.unsplash.com/photo-1560364897-472befdd3d1c?w=400&h=300&fit=crop&auto=format" alt="Foto de tu observación" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }} />
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: "#22C55E" }}>
          <IcoCheck /><span className="text-white text-xs font-black" style={{ fontFamily: "Nunito, sans-serif" }}>¡Identificada!</span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white/75 text-xs font-medium mb-1" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Resultado de identificación</p>
          <h2 className="text-white font-black text-2xl leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>{species.common}</h2>
          <p className="text-blue-100 text-sm italic mt-0.5" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{species.scientific}</p>
        </div>
      </div>
      <div className="px-4 -mt-3 relative z-10 pb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-slate-deep text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>
              {isExpert ? "Confianza del modelo" : "Nivel de certeza"}
            </p>
            <AiConfidenceDisplay pct={78} isExpert={isExpert} />
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: "78%", background: "linear-gradient(90deg, #0284C7, #22C55E)" }} />
          </div>
          {isExpert ? (
            <p className="text-xs text-slate-mid" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Puntuación del modelo de visión por computador.</p>
          ) : (
            <p className="text-xs text-slate-mid" style={{ fontFamily: "Source Sans 3, sans-serif" }}>La imagen tiene buenas características para identificar esta especie.</p>
          )}
          <div className="mt-3 p-3 rounded-xl flex items-start gap-2" style={{ background: "#FFFBEB" }}>
            <div className="flex-shrink-0 mt-0.5"><IcoInfo /></div>
            <p className="text-xs leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif", color: "#92400E" }}>
              Esta es una <strong>sugerencia</strong>. Un experto puede revisar y confirmar la identificación más adelante.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          <div className="relative h-32 bg-slate-100">
            <img src={species.img} alt={species.imgAlt} className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-3"><StatusBadge status={species.status} color={species.statusColor} /></div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[{ icon: <IcoLocation />, label: "Hábitat", value: species.habitat }, { icon: <IcoDepth />, label: "Profundidad", value: species.depth }, { icon: <IcoClock />, label: "Familia", value: species.family }, { icon: <IcoInfo />, label: "Tamaño", value: species.size }].map(({ icon, label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-1 mb-0.5">{icon}<p className="text-[10px] font-bold text-slate-light uppercase tracking-wide" style={{ fontFamily: "Nunito, sans-serif" }}>{label}</p></div>
                  <p className="text-xs font-semibold text-slate-deep leading-tight" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-mid leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{species.description}</p>
          </div>
        </div>
        {saved ? (
          <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 animate-fade-up" style={{ background: "#F0FDF4" }}>
            <IcoShield color="#22C55E" /><span className="font-black text-green-700 text-base" style={{ fontFamily: "Nunito, sans-serif" }}>¡Registro guardado!</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={handleSave} className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg active:scale-[0.98] transition-transform" style={{ background: "#0284C7", fontFamily: "Nunito, sans-serif" }}>Guardar observación</button>
            <button onClick={onCorrect} className="w-full py-4 rounded-2xl font-black text-slate-mid text-base border border-slate-200" style={{ fontFamily: "Nunito, sans-serif" }}>Corregir especie</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen: Species List ─────────────────────────────────────────────────────
const SpeciesScreen = ({ onDetail }: { onDetail: (sp: Species) => void }) => (
  <div className="absolute inset-0 overflow-y-auto scrollable" style={{ background: "#F4F6F8", paddingBottom: 76 }}>
    <div className="px-4 pt-5 pb-3">
      <h1 className="text-2xl font-black text-slate-deep" style={{ fontFamily: "Nunito, sans-serif" }}>Especies del Urabá</h1>
      <p className="text-sm text-slate-mid mt-0.5" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Batoideos del Caribe colombiano</p>
    </div>
    <div className="px-4 mb-4">
      <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-200">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#94A3B8" strokeWidth="2" /><path d="M16.5 16.5L21 21" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" /></svg>
        <span className="text-sm text-slate-light" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Buscar especie…</span>
      </div>
    </div>
    <div className="px-4 flex flex-col gap-3 pb-4">
      {SPECIES_DB.map((sp) => (
        <button key={sp.id} onClick={() => onDetail(sp)} className="w-full text-left bg-card rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
          <div className="flex gap-3 p-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              <img src={sp.img} alt={sp.imgAlt} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <p className="font-black text-slate-deep text-base leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>{sp.common}</p>
                <StatusBadge status={sp.status} color={sp.statusColor} />
              </div>
              <p className="text-xs italic text-slate-mid" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{sp.scientific}</p>
              <p className="text-[11px] text-slate-light mt-1" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Familia {sp.family}</p>
              <div className="flex items-center gap-1 mt-1.5"><IcoDepth /><p className="text-[11px] text-slate-mid" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{sp.depth}</p></div>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
)

// ─── Screen: Species Detail ───────────────────────────────────────────────────
const SpeciesDetailScreen = ({ species, onBack }: { species: Species; onBack: () => void }) => (
  <div className="absolute inset-0 overflow-y-auto scrollable" style={{ background: "#F4F6F8", paddingBottom: 20 }}>
    <div className="relative h-72 bg-ocean overflow-hidden">
      <img src={species.img} alt={species.imgAlt} className="w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
      <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center active:bg-black/60"><IcoBack light /></button>
      <div className="absolute bottom-4 left-4 right-4">
        <StatusBadge status={species.status} color={species.statusColor} />
        <h2 className="text-white font-black text-2xl mt-1 leading-tight" style={{ fontFamily: "Nunito, sans-serif" }}>{species.common}</h2>
        <p className="text-blue-100 text-sm italic" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{species.scientific}</p>
      </div>
    </div>
    <div className="px-4 mt-4 flex flex-col gap-4 pb-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-black text-slate-deep text-sm mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>Datos clave</p>
        <div className="grid grid-cols-2 gap-3">
          {[{ icon: <IcoLocation />, label: "Hábitat", value: species.habitat }, { icon: <IcoDepth />, label: "Profundidad", value: species.depth }, { icon: <IcoInfo />, label: "Tamaño", value: species.size }, { icon: <IcoClock />, label: "Coloración", value: species.color }].map(({ icon, label, value }) => (
            <div key={label} className="bg-surface rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">{icon}<p className="text-[10px] font-bold text-slate-light uppercase tracking-wide" style={{ fontFamily: "Nunito, sans-serif" }}>{label}</p></div>
              <p className="text-xs font-semibold text-slate-deep leading-tight" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-black text-slate-deep text-sm mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Descripción</p>
        <p className="text-sm text-slate-mid leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{species.description}</p>
      </div>
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#EFF6FF" }}>
        <div className="w-10 h-10 rounded-xl bg-ocean/15 flex items-center justify-center flex-shrink-0"><IcoSpecies active /></div>
        <div>
          <p className="text-[10px] font-bold text-ocean uppercase tracking-wide" style={{ fontFamily: "Nunito, sans-serif" }}>Familia</p>
          <p className="text-sm font-black text-slate-deep" style={{ fontFamily: "Nunito, sans-serif" }}>{species.family}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="font-black text-slate-deep text-sm" style={{ fontFamily: "Nunito, sans-serif" }}>Registros en el Urabá</p>
          <p className="text-xs text-slate-mid mt-0.5" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Registrada por la comunidad</p>
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
          <span className="text-2xl font-black text-ocean" style={{ fontFamily: "Nunito, sans-serif" }}>{species.regionCount}</span>
        </div>
      </div>
    </div>
  </div>
)

// ─── Screen: Profile ──────────────────────────────────────────────────────────
const ProfileScreen = ({
  isExpert,
  onStartCert,
}: {
  isExpert: boolean
  onStartCert: () => void
}) => (
  <div className="absolute inset-0 overflow-y-auto scrollable" style={{ background: "#F4F6F8", paddingBottom: 76 }}>
    <div className="px-4 pt-5 pb-8" style={{ background: "linear-gradient(160deg, #0284C7 0%, #0369A1 100%)" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-white" style={{ fontFamily: "Nunito, sans-serif" }}>Mi perfil</h1>
        {isExpert && (
          <span className="px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5" style={{ background: "#FCD34D", color: "#92400E", fontFamily: "Nunito, sans-serif" }}>
            <IcoExpert />EXPERTO
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white" style={{ background: "rgba(255,255,255,0.2)", fontFamily: "Nunito, sans-serif" }}>JC</div>
          {isExpert && (
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#FCD34D", border: "2px solid white" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#92400E"><path d="M5 12l5 5L20 7" stroke="#92400E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
            </div>
          )}
        </div>
        <div>
          <p className="font-black text-white text-lg" style={{ fontFamily: "Nunito, sans-serif" }}>Juan Carlos</p>
          <p className="text-blue-100/80 text-sm" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
            {isExpert ? "Experto certificado · Turbo" : "Pescador artesanal · Turbo"}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((n) => <IcoStar key={n} filled={n <= 4} />)}
            <span className="text-blue-100 text-xs ml-1" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
              {isExpert ? "Experto validador" : "Observador activo"}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="px-4 -mt-4 mb-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-3 gap-4 text-center">
        {[{ value: "3", label: "Registros" }, { value: "2", label: "Especies" }, { value: isExpert ? "5" : "2", label: isExpert ? "Validaciones" : "Verificados" }].map(({ value, label }) => (
          <div key={label}>
            <p className="text-2xl font-black text-ocean" style={{ fontFamily: "Nunito, sans-serif" }}>{value}</p>
            <p className="text-[11px] text-slate-mid font-semibold" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="px-4 flex flex-col gap-3">
      {/* Expert status card */}
      {isExpert ? (
        <div className="rounded-2xl p-4 flex gap-3 items-start" style={{ background: "#FEF3C7" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FCD34D" }}>
            <IcoCertificate />
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: "#92400E", fontFamily: "Nunito, sans-serif" }}>Eres un experto certificado</p>
            <p className="text-xs leading-relaxed mt-1" style={{ color: "#B45309", fontFamily: "Source Sans 3, sans-serif" }}>
              Puedes validar observaciones de la comunidad y acceder a información técnica del modelo de identificación.
            </p>
          </div>
        </div>
      ) : (
        /* Certification CTA */
        <button
          onClick={onStartCert}
          className="w-full rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform shadow-md"
          style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FCD34D" }}>
            <IcoCertificate />
          </div>
          <div className="text-left flex-1">
            <p className="text-white font-black text-base" style={{ fontFamily: "Nunito, sans-serif" }}>Certificarse como experto</p>
            <p className="text-slate-400 text-xs font-medium mt-0.5" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Valida observaciones de la comunidad</p>
          </div>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      )}

      {/* Personal info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-black text-slate-deep text-sm mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>Información personal</p>
        {[{ label: "Nombre", value: "Juan Carlos Martínez" }, { label: "Zona", value: "Turbo, Antioquia" }, { label: "Actividad", value: isExpert ? "Experto certificado" : "Pesca artesanal" }, { label: "Desde", value: "agosto 2026" }].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
            <p className="text-xs text-slate-mid font-medium" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{label}</p>
            <p className="text-xs font-semibold text-slate-deep" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4 flex gap-3 items-start" style={{ background: "#FFFBEB" }}>
        <IcoStar filled />
        <div>
          <p className="font-black text-sm" style={{ color: "#92400E", fontFamily: "Nunito, sans-serif" }}>Gracias por contribuir</p>
          <p className="text-xs leading-relaxed mt-1" style={{ color: "#92400E", fontFamily: "Source Sans 3, sans-serif" }}>Tus registros ayudan a proteger las rayas del Urabá Antioqueño. Cada observación cuenta para la ciencia.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {[{ label: "Notificaciones", icon: "🔔" }, { label: "Privacidad y datos", icon: "🔒" }, { label: "Sobre IdentiMar", icon: "ℹ️" }, { label: "Cerrar sesión", icon: "👋" }].map(({ label, icon }, i, arr) => (
          <button key={label} className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 ${i < arr.length - 1 ? "border-b border-slate-100" : ""}`}>
            <span className="text-base">{icon}</span>
            <span className="flex-1 text-left text-sm font-semibold text-slate-deep" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{label}</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-slate-light py-2" style={{ fontFamily: "Source Sans 3, sans-serif" }}>IdentiMar · Urabá Antioqueño · v1.0</p>
    </div>
  </div>
)

// ─── Screen: Cert Start ───────────────────────────────────────────────────────
const CertStartScreen = ({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) => (
  <div className="absolute inset-0 overflow-y-auto scrollable" style={{ background: "#F4F6F8", paddingBottom: 24 }}>
    {/* Hero */}
    <div className="relative overflow-hidden px-4 pt-12 pb-10 flex flex-col items-center" style={{ background: "linear-gradient(160deg, #1E293B 0%, #0F172A 100%)" }}>
      <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25"><IcoBack light /></button>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: "#FCD34D" }}>
        <IcoCertificate />
      </div>
      <h1 className="text-2xl font-black text-white text-center" style={{ fontFamily: "Nunito, sans-serif" }}>Certificarse como experto</h1>
      <p className="text-sm text-slate-400 text-center mt-2 leading-relaxed max-w-xs" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
        Los expertos de IdentiMar ayudan a la comunidad validando las identificaciones de rayas registradas en el Urabá.
      </p>
    </div>

    <div className="px-4 mt-5 flex flex-col gap-4">
      {/* What experts can do */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-black text-slate-deep text-sm mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>¿Qué puede hacer un experto?</p>
        {[
          { icon: "✅", text: "Validar identificaciones de la comunidad" },
          { icon: "📊", text: "Ver el porcentaje de confianza del modelo de IA" },
          { icon: "🔬", text: "Aportar criterio científico a los registros" },
          { icon: "🏅", text: "Aparecer acreditado en las observaciones validadas" },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-base">{icon}</span>
            <p className="text-sm font-medium text-slate-deep" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{text}</p>
          </div>
        ))}
      </div>

      {/* Who can apply */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "#EFF6FF" }}>
        <div className="mt-0.5"><IcoInfo /></div>
        <p className="text-xs leading-relaxed" style={{ color: "#1E40AF", fontFamily: "Source Sans 3, sans-serif" }}>
          Cualquier persona con conocimiento en biología marina, ictiología, o experiencia de campo con batoideos puede solicitar la certificación.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg active:scale-[0.98] transition-transform"
        style={{ background: "linear-gradient(135deg, #0284C7, #0369A1)", fontFamily: "Nunito, sans-serif" }}
      >
        Comenzar solicitud →
      </button>
      <button onClick={onBack} className="w-full py-3 text-sm font-bold text-slate-mid" style={{ fontFamily: "Nunito, sans-serif" }}>
        Ahora no
      </button>
    </div>
  </div>
)

// ─── Screen: Cert Form ────────────────────────────────────────────────────────
const CertFormScreen = ({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) => {
  const [area, setArea] = useState("")
  const [years, setYears] = useState("")
  const [motivation, setMotivation] = useState("")
  const [agreed, setAgreed] = useState(false)

  const areas = ["Biología marina", "Ictiología", "Investigación de campo", "Pesca artesanal", "Otra"]
  const canSubmit = area !== "" && agreed

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#F4F6F8" }}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm active:scale-95"><IcoBack /></button>
        <div>
          <p className="font-black text-slate-deep text-base" style={{ fontFamily: "Nunito, sans-serif" }}>Solicitud de certificación</p>
          <p className="text-slate-light text-xs" style={{ fontFamily: "Source Sans 3, sans-serif" }}>Cuéntanos sobre ti</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollable px-4 pb-4">
        <div className="mb-5">
          <label className="block text-sm font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>¿Cuál es tu área de experiencia?</label>
          <div className="flex flex-col gap-2">
            {areas.map((a) => (
              <button key={a} onClick={() => setArea(a)} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white text-left transition-all active:scale-[0.98]" style={{ borderColor: area === a ? "#0284C7" : "#E2E8F0", background: area === a ? "#EFF6FF" : "white" }}>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: area === a ? "#0284C7" : "#CBD5E1" }}>
                  {area === a && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#0284C7" }} />}
                </div>
                <p className="text-sm font-semibold" style={{ fontFamily: "Source Sans 3, sans-serif", color: area === a ? "#0284C7" : "#1E293B" }}>{a}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Años de experiencia (opcional)</label>
          <input value={years} onChange={(e) => setYears(e.target.value)} className="w-full bg-white rounded-2xl px-4 py-3.5 text-sm text-slate-deep font-medium border border-slate-200 focus:outline-none focus:border-ocean" style={{ fontFamily: "Source Sans 3, sans-serif" }} placeholder="Ej: 5 años" />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>¿Por qué quieres ser experto? (opcional)</label>
          <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} className="w-full bg-white rounded-2xl px-4 py-3.5 text-sm text-slate-deep font-medium border border-slate-200 focus:outline-none focus:border-ocean resize-none" style={{ fontFamily: "Source Sans 3, sans-serif" }} rows={3} placeholder="Cuéntanos tu motivación…" />
        </div>

        {/* Agreement */}
        <button onClick={() => setAgreed(!agreed)} className="w-full flex items-start gap-3 p-4 rounded-2xl text-left border mb-2 transition-all" style={{ background: agreed ? "#EFF6FF" : "white", borderColor: agreed ? "#0284C7" : "#E2E8F0" }}>
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: agreed ? "#0284C7" : "white", border: agreed ? "none" : "2px solid #CBD5E1" }}>
            {agreed && <IcoCheck />}
          </div>
          <p className="text-xs leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif", color: "#475569" }}>
            Entiendo que mi nombre aparecerá en las observaciones que valide y que debo actuar con responsabilidad científica.
          </p>
        </button>
      </div>

      <div className="px-4 pb-6 pt-3 flex-shrink-0">
        <button
          onClick={canSubmit ? onSubmit : undefined}
          className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg transition-all active:scale-[0.98]"
          style={{ background: canSubmit ? "#0284C7" : "#CBD5E1", fontFamily: "Nunito, sans-serif" }}
        >
          Enviar solicitud
        </button>
      </div>
    </div>
  )
}

// ─── Screen: Cert Review ──────────────────────────────────────────────────────
const CertReviewScreen = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-8" style={{ background: "#F4F6F8" }}>
      <div className="relative w-28 h-28 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="animate-spin-slow absolute inset-0 rounded-full border-4 border-transparent" style={{ borderTopColor: "#FCD34D" }} />
        <div className="absolute inset-4 rounded-full bg-white shadow-md flex items-center justify-center" style={{ background: "#FEF3C7" }}>
          <IcoCertificate />
        </div>
      </div>
      <h2 className="text-2xl font-black text-slate-deep text-center mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Revisando tu solicitud…</h2>
      <p className="text-sm text-slate-mid text-center leading-relaxed" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
        Estamos verificando tu información. Esto solo toma un momento.
      </p>
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full wave-bar" style={{ background: "#FCD34D", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Screen: Cert Complete ────────────────────────────────────────────────────
const CertCompleteScreen = ({ onDone }: { onDone: () => void }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center" style={{ background: "#F4F6F8" }}>
    {/* Animated badge */}
    <div className="relative mb-6 animate-fade-up">
      <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: "#FEF3C7" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#FCD34D" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#22C55E", border: "3px solid white" }}>
        <IcoCheck />
      </div>
    </div>

    <h2 className="text-2xl font-black text-slate-deep mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>
      ¡Felicitaciones!
    </h2>
    <h3 className="text-xl font-black mb-3" style={{ color: "#0284C7", fontFamily: "Nunito, sans-serif" }}>
      Ya eres experto de IdentiMar
    </h3>
    <p className="text-sm text-slate-mid leading-relaxed mb-6 max-w-xs" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
      Ahora puedes validar observaciones de la comunidad y ayudar a proteger los batoideos del Urabá Antioqueño.
    </p>

    {/* Capabilities */}
    <div className="w-full bg-white rounded-2xl p-4 shadow-sm mb-6 text-left">
      {[
        { icon: "✅", text: "Valida observaciones de la comunidad" },
        { icon: "📊", text: "Accede al porcentaje de confianza del modelo" },
        { icon: "🏅", text: "Tu nombre aparecerá en las validaciones" },
      ].map(({ icon, text }) => (
        <div key={text} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
          <span className="text-base">{icon}</span>
          <p className="text-sm font-semibold text-slate-deep" style={{ fontFamily: "Source Sans 3, sans-serif" }}>{text}</p>
        </div>
      ))}
    </div>

    <button
      onClick={onDone}
      className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg active:scale-[0.98] transition-transform"
      style={{ background: "linear-gradient(135deg, #0284C7, #0369A1)", fontFamily: "Nunito, sans-serif" }}
    >
      Ir a mi perfil
    </button>
  </div>
)

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("splash")
  const [tab, setTab] = useState<TabId>("home")
  const [isExpert, setIsExpert] = useState(false)
  const [recordsTab, setRecordsTab] = useState<RecordsTab>("todos")
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null)
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null)
  const [observations, setObservations] = useState<Observation[]>(BASE_OBSERVATIONS)
  const [obsDetailSource, setObsDetailSource] = useState<TabId>("records")

  const tabScreenMap: Record<TabId, Screen> = {
    home: "home",
    records: "records",
    species: "species",
    profile: "profile",
  }

  const handleNav = (t: TabId) => {
    setTab(t)
    setScreen(tabScreenMap[t])
  }

  const handleObsDetail = (obs: Observation, source: TabId = "records") => {
    setSelectedObs(obs)
    setObsDetailSource(source)
    setScreen("obs-detail")
  }

  const handleValidate = (obsId: string, pct: number) => {
    setObservations((prev) =>
      prev.map((o) =>
        o.id === obsId
          ? { ...o, expertValidation: { validatorName: "Juan Carlos (Experto)", pct, date: "Hoy" } }
          : o
      )
    )
    if (selectedObs?.id === obsId) {
      setSelectedObs((prev) =>
        prev ? { ...prev, expertValidation: { validatorName: "Juan Carlos (Experto)", pct, date: "Hoy" } } : prev
      )
    }
  }

  const showBottomNav: Screen[] = ["home", "records", "species", "profile"]
  const isTabScreen = showBottomNav.includes(screen)

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#0369A1" }}>
      {/* Phone frame */}
      <div
        className="relative overflow-hidden bg-surface"
        style={{
          width: "min(390px, 100vw)",
          height: "min(844px, 100vh)",
          borderRadius: "min(44px, 0px)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
        }}
      >
        {/* Screen content */}
        <div className="absolute inset-0">
          {screen === "splash" && <SplashScreen onDone={() => setScreen("home")} />}

          {screen === "home" && (
            <HomeScreen
              isExpert={isExpert}
              observations={observations}
              onNewObs={() => setScreen("new-photo")}
              onObsDetail={(obs) => handleObsDetail(obs, "home")}
              onSpeciesDetail={(sp) => { setSelectedSpecies(sp); setScreen("species-detail") }}
            />
          )}

          {screen === "new-photo" && <NewPhotoScreen onBack={() => setScreen("home")} onPhotoTaken={() => setScreen("new-preview")} />}
          {screen === "new-preview" && <NewPreviewScreen onBack={() => setScreen("new-photo")} onConfirm={() => setScreen("new-info")} />}
          {screen === "new-info" && <NewInfoScreen onBack={() => setScreen("new-preview")} onSubmit={() => setScreen("new-processing")} />}
          {screen === "new-processing" && <ProcessingScreen onDone={() => setScreen("new-result")} />}
          {screen === "new-result" && (
            <ResultScreen
              isExpert={isExpert}
              onSave={() => { setTab("records"); setRecordsTab("mis"); setScreen("records") }}
              onCorrect={() => setScreen("new-info")}
            />
          )}

          {screen === "records" && (
            <RecordsScreen
              isExpert={isExpert}
              observations={observations}
              tab={recordsTab}
              onTabChange={setRecordsTab}
              onDetail={(obs) => handleObsDetail(obs, "records")}
            />
          )}

          {screen === "obs-detail" && selectedObs && (
            <ObsDetailScreen
              obs={selectedObs}
              isExpert={isExpert}
              onBack={() => { setScreen(obsDetailSource === "home" ? "home" : "records") }}
              onValidate={handleValidate}
            />
          )}

          {screen === "species" && <SpeciesScreen onDetail={(sp) => { setSelectedSpecies(sp); setScreen("species-detail") }} />}
          {screen === "species-detail" && selectedSpecies && <SpeciesDetailScreen species={selectedSpecies} onBack={() => setScreen("species")} />}

          {screen === "profile" && <ProfileScreen isExpert={isExpert} onStartCert={() => setScreen("cert-start")} />}

          {screen === "cert-start" && <CertStartScreen onBack={() => setScreen("profile")} onContinue={() => setScreen("cert-form")} />}
          {screen === "cert-form" && <CertFormScreen onBack={() => setScreen("cert-start")} onSubmit={() => setScreen("cert-review")} />}
          {screen === "cert-review" && <CertReviewScreen onDone={() => setScreen("cert-complete")} />}
          {screen === "cert-complete" && <CertCompleteScreen onDone={() => { setIsExpert(true); setTab("profile"); setScreen("profile") }} />}
        </div>

        {/* Bottom nav */}
        {isTabScreen && <BottomNav active={tab} onNav={handleNav} />}
      </div>
    </div>
  )
}
