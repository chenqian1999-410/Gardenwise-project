export const gardenStyles = [
  {
    id: "california-native",
    name: "California Native Garden",
    image: "/style-images/california-native.png",
    description: "Habitat-rich planting with local texture, layered shrubs, flowering natives, and a relaxed seasonal rhythm.",
    characteristics: ["Native shrubs", "Pollinator value", "Low summer water", "Soft meadow edges"]
  },
  {
    id: "mediterranean",
    name: "Mediterranean Garden",
    image: "/style-images/mediterranean.png",
    description: "Warm, aromatic, and structured with silver foliage, durable shrubs, gravel paths, and long bloom windows.",
    characteristics: ["Aromatic foliage", "Olive and lavender tones", "Gravel-friendly", "Heat resilient"]
  },
  {
    id: "japanese-zen",
    name: "Japanese Zen Garden",
    image: "/style-images/japanese-zen.png",
    description: "Quiet asymmetry, clipped forms, shade-tolerant accents, negative space, and carefully placed focal plants.",
    characteristics: ["Calm structure", "Fine texture", "Evergreen massing", "Focal specimens"]
  },
  {
    id: "desert-modern",
    name: "Desert Modern Garden",
    image: "/style-images/desert-modern.png",
    description: "Sculptural and spare, using succulents, bold silhouettes, mineral mulch, and strong shadow patterns.",
    characteristics: ["Succulent forms", "Architectural plants", "High contrast", "Very low water"]
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal Garden",
    image: "/style-images/modern-minimal.png",
    description: "Restrained, repeatable planting blocks with grasses, evergreen structure, and clean spatial hierarchy.",
    characteristics: ["Repeated masses", "Ornamental grasses", "Clean edges", "Evergreen anchors"]
  }
];

export const styleById = Object.fromEntries(gardenStyles.map((style) => [style.id, style]));
