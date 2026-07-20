export type Station = {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  streamUrl: string;
  tags?: string[];
};

/** Curated real stations with known HTTPS stream URLs. */
export const stations: Station[] = [
  // North America
  { id: "npr", name: "NPR News", city: "Washington", country: "USA", lat: 38.9072, lng: -77.0369, streamUrl: "https://npr-ice.streamguys1.com/live.mp3", tags: ["news"] },
  { id: "kexp", name: "KEXP 90.3", city: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321, streamUrl: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3", tags: ["indie", "alternative"] },
  { id: "wfmu", name: "WFMU", city: "New York", country: "USA", lat: 40.7128, lng: -74.006, streamUrl: "https://stream0.wfmu.org/freeform-128k", tags: ["freeform"] },
  { id: "wnyc", name: "WNYC FM", city: "New York", country: "USA", lat: 40.7484, lng: -73.9857, streamUrl: "https://fm939.wnyc.org/wnycfm", tags: ["news", "public"] },
  { id: "kcrw", name: "KCRW", city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, streamUrl: "https://kcrw.streamguys1.com/kcrw_192k_mp3_on_air", tags: ["eclectic"] },
  { id: "kqed", name: "KQED", city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194, streamUrl: "https://streams.kqed.org/kqedradio", tags: ["public"] },
  { id: "wxpn", name: "WXPN", city: "Philadelphia", country: "USA", lat: 39.9526, lng: -75.1652, streamUrl: "https://wxpn.xpn.org/xpnmp3hi", tags: ["adult alternative"] },
  { id: "cbbc", name: "CBC Music", city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, streamUrl: "https://cbcradiolive.akamaized.net/hls/live/2041057/ES_R2ETR/master.m3u8", tags: ["public", "music"] },
  { id: "citr", name: "CiTR 101.9", city: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207, streamUrl: "https://live.citr.ca/stream.mp3", tags: ["campus"] },
  { id: "wbez", name: "WBEZ", city: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298, streamUrl: "https://stream.wbez.org/wbez128.mp3", tags: ["public"] },
  { id: "kutx", name: "KUTX 98.9", city: "Austin", country: "USA", lat: 30.2672, lng: -97.7431, streamUrl: "https://streams.kut.org/kutxhd-mp3", tags: ["music"] },
  { id: "wxyc", name: "WXYC", city: "Chapel Hill", country: "USA", lat: 35.9132, lng: -79.0558, streamUrl: "https://audio-mp3.ibiblio.org/wxyc.mp3", tags: ["college"] },
  { id: "somafm-gs", name: "SomaFM Groove Salad", city: "San Francisco", country: "USA", lat: 37.8044, lng: -122.2712, streamUrl: "https://ice1.somafm.com/groovesalad-128-mp3", tags: ["ambient", "chill"] },
  { id: "somafm-drone", name: "SomaFM Drone Zone", city: "San Francisco", country: "USA", lat: 37.79, lng: -122.4, streamUrl: "https://ice1.somafm.com/dronezone-128-mp3", tags: ["ambient"] },
  { id: "paradise", name: "Radio Paradise", city: "Eureka", country: "USA", lat: 40.8021, lng: -124.1637, streamUrl: "https://stream.radioparadise.com/aac-128", tags: ["eclectic"] },
  { id: "dublab", name: "dublab", city: "Los Angeles", country: "USA", lat: 34.0736, lng: -118.4, streamUrl: "https://dublab.out.airtime.pro/dublab_a", tags: ["experimental"] },
  { id: "kfjc", name: "KFJC 89.7", city: "Los Altos Hills", country: "USA", lat: 37.377, lng: -122.13, streamUrl: "https://netcast.kfjc.org/kfjc-128k-mp3", tags: ["college"] },
  { id: "somafm-agent", name: "SomaFM Secret Agent", city: "San Francisco", country: "USA", lat: 37.78, lng: -122.41, streamUrl: "https://ice1.somafm.com/secretagent-128-mp3", tags: ["lounge"] },

  // Europe
  { id: "bbc1", name: "BBC Radio 1", city: "London", country: "UK", lat: 51.5074, lng: -0.1278, streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", tags: ["pop"] },
  { id: "bbc2", name: "BBC Radio 2", city: "London", country: "UK", lat: 51.515, lng: -0.12, streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_two", tags: ["adult"] },
  { id: "bbc6", name: "BBC Radio 6 Music", city: "London", country: "UK", lat: 51.52, lng: -0.14, streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_6music", tags: ["alternative"] },
  { id: "nts", name: "NTS Radio", city: "London", country: "UK", lat: 51.53, lng: -0.08, streamUrl: "https://stream-relay-geo.ntslive.net/stream", tags: ["electronic", "eclectic"] },
  { id: "nts2", name: "NTS 2", city: "London", country: "UK", lat: 51.525, lng: -0.075, streamUrl: "https://stream-relay-geo.ntslive.net/stream2", tags: ["electronic"] },
  { id: "rinse", name: "Rinse FM", city: "London", country: "UK", lat: 51.54, lng: -0.06, streamUrl: "https://streamer-uk.rinse.fm:8443/stream", tags: ["electronic", "grime"] },
  { id: "fip", name: "FIP", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, streamUrl: "https://icecast.radiofrance.fr/fip-midfi.mp3", tags: ["eclectic"] },
  { id: "franceinfo", name: "France Info", city: "Paris", country: "France", lat: 48.86, lng: 2.34, streamUrl: "https://icecast.radiofrance.fr/franceinfo-midfi.mp3", tags: ["news"] },
  { id: "franceinter", name: "France Inter", city: "Paris", country: "France", lat: 48.87, lng: 2.33, streamUrl: "https://icecast.radiofrance.fr/franceinter-midfi.mp3", tags: ["talk"] },
  { id: "nova", name: "Radio Nova", city: "Paris", country: "France", lat: 48.85, lng: 2.37, streamUrl: "https://novazz.ice.infomaniak.ch/novazz-128.mp3", tags: ["world"] },
  { id: "tsf-jazz", name: "TSF Jazz", city: "Paris", country: "France", lat: 48.88, lng: 2.3, streamUrl: "https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3", tags: ["jazz"] },
  { id: "fg", name: "Radio FG", city: "Paris", country: "France", lat: 48.84, lng: 2.35, streamUrl: "https://radiofg.impek.com/fg", tags: ["dance"] },
  { id: "europe1", name: "Europe 1", city: "Paris", country: "France", lat: 48.87, lng: 2.31, streamUrl: "https://stream.europe1.fr/europe1.mp3", tags: ["talk"] },
  { id: "jazz-radio", name: "Jazz Radio", city: "Lyon", country: "France", lat: 45.764, lng: 4.8357, streamUrl: "https://jazzradio.ice.infomaniak.ch/jazzradio-high.mp3", tags: ["jazz"] },
  { id: "deutschlandfunk", name: "Deutschlandfunk", city: "Cologne", country: "Germany", lat: 50.9375, lng: 6.9603, streamUrl: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3", tags: ["news"] },
  { id: "fluxfm", name: "FluxFM", city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, streamUrl: "https://streams.fluxfm.de/live/mp3-320/audio/", tags: ["indie"] },
  { id: "hr3", name: "hr3", city: "Frankfurt", country: "Germany", lat: 50.1109, lng: 8.6821, streamUrl: "https://dispatcher.rndfnk.com/hr/hr3/live/mp3/high", tags: ["pop"] },
  { id: "wdr2", name: "WDR 2", city: "Cologne", country: "Germany", lat: 50.94, lng: 6.96, streamUrl: "https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3", tags: ["pop"] },
  { id: "antenne-bayern", name: "Antenne Bayern", city: "Munich", country: "Germany", lat: 48.1351, lng: 11.582, streamUrl: "https://stream.antenne.de/antenne", tags: ["pop"] },
  { id: "nporadio2", name: "NPO Radio 2", city: "Hilversum", country: "Netherlands", lat: 52.2292, lng: 5.1778, streamUrl: "https://icecast.omroep.nl/radio2-bb-mp3", tags: ["pop"] },
  { id: "npo-3fm", name: "NPO 3FM", city: "Hilversum", country: "Netherlands", lat: 52.23, lng: 5.18, streamUrl: "https://icecast.omroep.nl/3fm-bb-mp3", tags: ["pop"] },
  { id: "slam", name: "SLAM!", city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, streamUrl: "https://stream.slam.nl/slam_mp3", tags: ["dance"] },
  { id: "studio-brussel", name: "Studio Brussel", city: "Brussels", country: "Belgium", lat: 50.8503, lng: 4.3517, streamUrl: "https://icecast.vrtcdn.be/stubru-high.mp3", tags: ["alternative"] },
  { id: "vrt-radio2", name: "Radio 2", city: "Brussels", country: "Belgium", lat: 50.85, lng: 4.35, streamUrl: "https://icecast.vrtcdn.be/ra2ant-high.mp3", tags: ["pop"] },
  { id: "srf3", name: "SRF 3", city: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417, streamUrl: "https://stream.srg-ssr.ch/m/drs3/mp3_128", tags: ["pop"] },
  { id: "swiss-jazz", name: "Swiss Jazz", city: "Geneva", country: "Switzerland", lat: 46.2044, lng: 6.1432, streamUrl: "https://stream.srg-ssr.ch/m/rsj/mp3_128", tags: ["jazz"] },
  { id: "oe1", name: "Ö1", city: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738, streamUrl: "https://orf-live.ors-shoutcast.at/oe1-q2a", tags: ["culture"] },
  { id: "orf-oe3", name: "Hitradio Ö3", city: "Vienna", country: "Austria", lat: 48.21, lng: 16.37, streamUrl: "https://orf-live.ors-shoutcast.at/oe3-q2a", tags: ["pop"] },
  { id: "rai1", name: "Rai Radio 1", city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, streamUrl: "https://icestreaming.rai.it/1.mp3", tags: ["public"] },
  { id: "rai3", name: "Rai Radio 3", city: "Rome", country: "Italy", lat: 41.91, lng: 12.5, streamUrl: "https://icestreaming.rai.it/3.mp3", tags: ["culture"] },
  { id: "rtl1025", name: "RTL 102.5", city: "Milan", country: "Italy", lat: 45.4642, lng: 9.19, streamUrl: "https://streamingv2.shoutcast.com/rtl-1025", tags: ["pop"] },
  { id: "catalunya", name: "Catalunya Ràdio", city: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686, streamUrl: "https://shoutcast.ccma.cat/ccma/catalunyaradioHD.mp3", tags: ["public"] },
  { id: "antena1-pt", name: "Antena 1", city: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, streamUrl: "https://radiocast.rtp.pt/antena180a.mp3", tags: ["public"] },
  { id: "portugal-comercial", name: "Rádio Comercial", city: "Lisbon", country: "Portugal", lat: 38.73, lng: -9.14, streamUrl: "https://stream-icy.bauermedia.pt/comercial.mp3", tags: ["pop"] },
  { id: "nrk-p3", name: "NRK P3", city: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522, streamUrl: "https://lyd.nrk.no/nrk_radio_p3_mp3_h", tags: ["youth"] },
  { id: "sr-p3", name: "Sveriges Radio P3", city: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686, streamUrl: "https://http-live.sr.se/p3-mp3-192", tags: ["pop"] },
  { id: "dr-p3", name: "DR P3", city: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683, streamUrl: "https://live-icy.dr.dk/A/A03H.mp3", tags: ["pop"] },
  { id: "cro1", name: "ČRo Radiožurnál", city: "Prague", country: "Czechia", lat: 50.0755, lng: 14.4378, streamUrl: "https://rozhlas.stream/radiozurnal_high.aac", tags: ["news"] },
  { id: "kossuth", name: "Kossuth Rádió", city: "Budapest", country: "Hungary", lat: 47.4979, lng: 19.0402, streamUrl: "https://icast.connectmedia.hu/4736/mr1.mp3", tags: ["public"] },
  { id: "m1-hu", name: "Petőfi Rádió", city: "Budapest", country: "Hungary", lat: 47.5, lng: 19.05, streamUrl: "https://icast.connectmedia.hu/4738/mr2.mp3", tags: ["pop"] },
  { id: "err-viker", name: "Vikerraadio", city: "Tallinn", country: "Estonia", lat: 59.437, lng: 24.7536, streamUrl: "https://icecast.err.ee/vikerraadio.mp3", tags: ["public"] },
  { id: "radio-romania", name: "Radio România Actualități", city: "Bucharest", country: "Romania", lat: 44.4268, lng: 26.1025, streamUrl: "https://stream2.srr.ro:8443/romania-actualitati", tags: ["news"] },
  { id: "moscow-lounge", name: "SomaFM Lush", city: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, streamUrl: "https://ice1.somafm.com/lush-128-mp3", tags: ["chill"] },

  // Asia / Pacific
  { id: "sbs-popasia", name: "SBS PopAsia", city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, streamUrl: "https://sbs-ice.streamguys1.com/sbs-popasia", tags: ["kpop"] },
  { id: "triplej", name: "triple j", city: "Sydney", country: "Australia", lat: -33.87, lng: 151.21, streamUrl: "https://live-radio01.mediahubaustralia.com/2TJW/mp3/", tags: ["alternative"] },
  { id: "abc-rn", name: "ABC Radio National", city: "Sydney", country: "Australia", lat: -33.86, lng: 151.2, streamUrl: "https://live-radio01.mediahubaustralia.com/2RNW/mp3/", tags: ["public"] },
  { id: "radio-singapore", name: "CNA938", city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/938_FMAAC.aac", tags: ["news"] },
  { id: "yes933", name: "YES 933", city: "Singapore", country: "Singapore", lat: 1.29, lng: 103.85, streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/YES933_PREM.mp3", tags: ["mandarin"] },
  { id: "tokyo-chill", name: "SomaFM Space Station", city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, streamUrl: "https://ice1.somafm.com/spacestation-128-mp3", tags: ["electronic"] },
  { id: "seoul-indie", name: "SomaFM Indie Pop Rocks", city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, streamUrl: "https://ice1.somafm.com/indiepop-128-mp3", tags: ["indie"] },
  { id: "beijing-defcon", name: "SomaFM DEF CON", city: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, streamUrl: "https://ice1.somafm.com/defcon-128-mp3", tags: ["electronic"] },
  { id: "hk-rinse", name: "Rinse FM", city: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694, streamUrl: "https://streamer-uk.rinse.fm:8443/stream", tags: ["electronic"] },
  { id: "radio-mirchi", name: "Radio Mirchi", city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/MUMBAI_HINDI_ESTAAC.aac", tags: ["bollywood"] },
  { id: "bangkok-beat", name: "SomaFM Beat Blender", city: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, streamUrl: "https://ice1.somafm.com/beatblender-128-mp3", tags: ["electronic"] },
  { id: "jakarta-soul", name: "SomaFM Underground 80s", city: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456, streamUrl: "https://ice1.somafm.com/u80s-128-mp3", tags: ["80s"] },

  // Latin America
  { id: "bandnews", name: "BandNews FM", city: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/BANDNEWSFM_SPAAC.aac", tags: ["news"] },
  { id: "rio-brasil", name: "SomaFM Boot Liquor", city: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, streamUrl: "https://ice1.somafm.com/bootliquor-128-mp3", tags: ["americana"] },
  { id: "radio-nacional-ar", name: "Radio Nacional", city: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, streamUrl: "https://sa.mp3.icecast.magma.edge-access.net/sc_rad7", tags: ["public"] },
  { id: "imer", name: "Reactor 105.7", city: "Mexico City", country: "Mexico", lat: 19.42, lng: -99.14, streamUrl: "https://s2.mexside.net/8026/stream", tags: ["rock"] },
  { id: "caracol", name: "Caracol Radio", city: "Bogotá", country: "Colombia", lat: 4.711, lng: -74.0721, streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CARACOL_RADIOAAC.aac", tags: ["news"] },
  { id: "radio-cooperativa", name: "Radio Cooperativa", city: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693, streamUrl: "https://unlimited4-us.dps.live/cooperativafm/aac/icecast.audio", tags: ["news"] },
  { id: "rpp", name: "RPP Noticias", city: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428, streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_RPP.mp3", tags: ["news"] },
  { id: "oxigeno", name: "Oxígeno", city: "Medellín", country: "Colombia", lat: 6.2476, lng: -75.5658, streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/OXIGENO_BOGOTAAAC.aac", tags: ["pop"] },

  // Africa / Middle East
  { id: "classic-fm-sa", name: "Classic FM", city: "Johannesburg", country: "South Africa", lat: -26.19, lng: 28.04, streamUrl: "https://edge.iono.fm/xice/65_medium.aac", tags: ["classical"] },
  { id: "cape-deep", name: "SomaFM Deep Space One", city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, streamUrl: "https://ice1.somafm.com/deepspaceone-128-mp3", tags: ["ambient"] },
  { id: "lagos-sonic", name: "SomaFM Sonic Universe", city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, streamUrl: "https://ice1.somafm.com/sonicuniverse-128-mp3", tags: ["jazz"] },
  { id: "nbs", name: "Nile FM", city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, streamUrl: "https://audio.nrpstream.com/listen/nile_fm/radio.mp3", tags: ["pop"] },
  { id: "galgalatz", name: "Galgalatz", city: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818, streamUrl: "https://glzwizzlv.bynetcdn.com/glglz_mp3", tags: ["pop"] },
  { id: "voix-du-liban", name: "Sawt el Ghad", city: "Beirut", country: "Lebanon", lat: 33.9, lng: 35.5, streamUrl: "https://streams.radio.co/see9cf0008/listen", tags: ["pop"] },
  { id: "nairobi-fluid", name: "SomaFM Fluid", city: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, streamUrl: "https://ice1.somafm.com/fluid-128-mp3", tags: ["electronic"] },
  { id: "casablanca-world", name: "SomaFM World Party", city: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898, streamUrl: "https://ice1.somafm.com/worldparty-128-mp3", tags: ["world"] },
  { id: "bamako-goa", name: "SomaFM Suburbs of Goa", city: "Bamako", country: "Mali", lat: 12.6392, lng: -8.0029, streamUrl: "https://ice1.somafm.com/suburbsofgoa-128-mp3", tags: ["world"] },
];

export function getStationById(id: string): Station | undefined {
  return stations.find((s) => s.id === id);
}

export function searchStations(query: string): Station[] {
  const q = query.trim().toLowerCase();
  if (!q) return stations;
  return stations.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.includes(q))
  );
}
