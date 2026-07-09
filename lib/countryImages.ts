// Country/region photo keys → Cloudinary URLs.
// The AI picks one of these keys per destination card.
export const COUNTRY_IMAGES: Record<string, string> = {
  turkey:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258136/1_tdn4zq.webp",
  "south-korea":
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258138/southkorea_k8ub70.jpg",
  india:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258135/india_kzxnkt.jpg",
  china:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258135/china_lnugob.jpg",
  africa:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258135/africa_ru3ypo.webp",
  usa: "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258136/newyork_jtoc7l.jpg",
  singapore:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258136/singapore_salsxj.webp",
  japan:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258136/japan_fequ3o.avif",
  mexico:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258137/mexico_adsmsk.jpg",
  thailand:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258137/thailand_jpng2m.jpg",
  malaysia:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258137/malaysia_mykkvr.avif",
  europe:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258136/europe_frr2lx.avif",
  russia:
    "https://res.cloudinary.com/dzvffb6vv/image/upload/v1783258416/russia_uvf2mp.jpg",
};

export const IMAGE_KEYS = Object.keys(COUNTRY_IMAGES);

export function countryImage(key: string | undefined): string {
  if (!key) return COUNTRY_IMAGES.europe;
  return COUNTRY_IMAGES[key.toLowerCase().trim()] ?? COUNTRY_IMAGES.europe;
}
