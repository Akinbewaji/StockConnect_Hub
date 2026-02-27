import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../../utils/api';
import { ArrowLeft, ShoppingCart, Check, AlertTriangle } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // In a real app, we'd fetch by ID. For now, we'll just fetch all and find one (mock)
    // or implement a get-by-id endpoint.
    // Let's implement get-by-id in the backend first or just mock it here if needed.
    // But I implemented /api/products/:id in the backend plan? No, I implemented /api/products list.
    // Let's just fetch the list and filter for now to save time, or add the endpoint.
    // Actually, I should add the endpoint to be proper.
    
    // For now, let's just use the list endpoint and filter client side for MVP speed.
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(products => {
        const found = products.find((p: any) => p.id === Number(id));
        setProduct(found);
      });
  }, [id]);

  if (!product) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-8">
        <ArrowLeft size={20} className="mr-2" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          <img
            src={product.image_url || `https://picsum.photos/seed/${product.id}/800/800`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-lg text-gray-500 mb-6">{product.category}</p>
          
          <div className="text-3xl font-bold text-indigo-600 mb-6">₦{product.price}</div>

          <div className="prose prose-gray mb-8">
            <p>{product.description || 'No description available.'}</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            {product.quantity > 0 ? (
              <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                <Check size={16} className="mr-1.5" />
                In Stock ({product.quantity} available)
              </div>
            ) : (
              <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                <AlertTriangle size={16} className="mr-1.5" />
                Out of Stock
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max={product.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                disabled={product.quantity <= 0}
              />
            </div>
            <button
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              disabled={product.quantity <= 0}
            >
              <ShoppingCart size={20} />
              Add to Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
