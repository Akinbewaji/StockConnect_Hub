import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
}

export default function SEO({ 
  title = 'StockConnect - Customer Hub', 
  description = 'Procure high-quality industrial materials and track your inventory on StockConnect.' 
}: SEOProps) {
  useEffect(() => {
    // Update Document Title
    const baseTitle = 'StockConnect';
    document.title = title === baseTitle ? title : `${title} | ${baseTitle}`;
    
    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update Open Graph Tags
    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    updateOGTag('og:type', 'website');
  }, [title, description]);

  return null;
}
