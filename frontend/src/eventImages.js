const EVENT_IMAGES = [
  {
    categories: ["technology", "tech", "conference", "business"],
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=85"
  },
  {
    categories: ["music", "concert", "live"],
    url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85"
  },
  {
    categories: ["wedding", "celebration"],
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
  },
  {
    categories: ["sports", "sport", "fitness"],
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=85"
  },
  {
    categories: ["food", "drink", "culinary"],
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85"
  },
  {
    categories: ["art", "exhibition", "culture"],
    url: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=85"
  },
  {
    categories: ["comedy", "theatre", "theater"],
    url: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=85"
  },
  {
    categories: ["festival", "outdoor"],
    url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=85"
  }
];

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85";

export function eventImageForCategory(category) {
  const normalizedCategory = (category || "").trim().toLowerCase();
  const match = EVENT_IMAGES.find(({ categories }) =>
    categories.some((term) => normalizedCategory.includes(term))
  );

  return match?.url || DEFAULT_EVENT_IMAGE;
}
