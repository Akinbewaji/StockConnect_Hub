import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Upload,
  Download,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { authFetch } from "../../utils/api";
import { ListSkeleton } from "../../components/Skeleton";

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, low, healthy
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    reorderThreshold: "5",
    costPrice: "",
    supplier: "",
    supplierPhone: "",
    barcode: "",
    imageUrl: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on search/filter
      fetchProducts(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterCategory]);

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const fetchProducts = (targetPage: number = page) => {
    let url = `/api/products?search=${search}&page=${targetPage}&limit=${limit}`;
    if (filterCategory) url += `&category=${filterCategory}`;

    setLoading(true);
    authFetch(url)
      .then((res) => res.json())
      .then((res) => {
        setProducts(res.data || []);
        setTotal(res.total || 0);
        setLoading(false);
      });
  };

  const filteredProducts = products.filter((product) => {
    if (filterStatus === "low")
      return product.quantity <= product.reorder_threshold;
    if (filterStatus === "healthy")
      return product.quantity > product.reorder_threshold;
    return true;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });
    setShowAddModal(false);
    fetchProducts();
    setNewProduct({
      name: "",
      category: "",
      price: "",
      quantity: "",
      reorderThreshold: "5",
      costPrice: "",
      supplier: "",
      supplierPhone: "",
      barcode: "",
      imageUrl: "",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResults(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const product: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        // Map common header variations
        if (
          header === "name" ||
          header === "product name" ||
          header === "product"
        ) {
          product.name = value;
        } else if (header === "category") {
          product.category = value;
        } else if (header === "price") {
          product.price = value;
        } else if (
          header === "quantity" ||
          header === "stock" ||
          header === "qty"
        ) {
          product.quantity = value;
        } else if (
          header === "reorderthreshold" ||
          header === "reorder_threshold" ||
          header === "min_stock"
        ) {
          product.reorderThreshold = value;
        } else if (header === "supplier") {
          product.supplier = value;
        } else if (header === "supplier_phone" || header === "supplier phone") {
          product.supplierPhone = value;
        } else if (header === "barcode" || header === "sku" || header === "upc") {
          product.barcode = value;
        } else if (header === "description") {
          product.description = value;
        } else if (
          header === "imageurl" ||
          header === "image_url" ||
          header === "image"
        ) {
          product.imageUrl = value;
        }
      });

      return product;
    });
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResults(null);

    try {
      const text = await importFile.text();
      let productsData: any[] = [];

      if (importFile.name.endsWith(".csv")) {
        productsData = parseCSV(text);
      } else if (importFile.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        productsData = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        throw new Error("Unsupported file format. Please use CSV or JSON.");
      }

      const response = await authFetch("/api/products/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: productsData }),
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText || response.statusText}`);
      }

      // Try to parse JSON response
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const results = await response.json();
        setImportResults(results);

        if (results.success > 0) {
          fetchProducts();
        }
      } else {
        // If not JSON, read as text
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text}`);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      setImportResults({
        success: 0,
        failed: 1,
        errors: [{ error: error.message || "Unknown error occurred" }],
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "name,category,price,quantity,reorderThreshold,costPrice,barcode,supplier,supplierPhone,description\nSample Product,Electronics,1000,50,10,700,12345678,Sample Supplier,+23412345678,Sample description";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Upload size={20} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white p-2 rounded-full shadow-lg"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Stock Status</option>
            <option value="low">Low Stock</option>
            <option value="healthy">Healthy Stock</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                <img
                  src={
                    product.image_url ||
                    `https://picsum.photos/seed/${product.id}/200/200`
                  }
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-medium text-indigo-600">
                    ₦{product.price}
                  </span>
                  {product.cost_price > 0 && (
                    <span className="text-[10px] text-gray-400">
                      Margin: {Math.round(((product.price - product.cost_price) / product.price) * 100)}%
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      product.quantity <= product.reorder_threshold
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {product.quantity} in stock (Min:{" "}
                    {product.reorder_threshold})
                  </span>
                </div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical size={20} />
            </button>
          </div>
        ))}
      </div>
      )}

      {/* Pagination Controls */}
      {total > limit && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page <span className="font-semibold text-indigo-600">{page}</span> of {Math.ceil(total / limit)}
            <span className="ml-2 text-gray-400">({total} total)</span>
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Import Inventory</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportResults(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Instructions
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Upload a CSV or JSON file with product data</li>
                  <li>Required fields: name, price, quantity</li>
                  <li>
                    Optional fields: category, reorderThreshold, supplier,
                    description, imageUrl
                  </li>
                  <li>Download the template below for the correct format</li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium"
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File (CSV or JSON)
                </label>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="w-full p-3 border rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {importFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>

              {importResults && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle size={20} />
                      <span className="font-semibold">
                        {importResults.success} Successful
                      </span>
                    </div>
                    {importResults.failed > 0 && (
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle size={20} />
                        <span className="font-semibold">
                          {importResults.failed} Failed
                        </span>
                      </div>
                    )}
                  </div>

                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <h4 className="font-semibold text-red-900 mb-2">
                        Errors:
                      </h4>
                      <ul className="text-sm text-red-800 space-y-2">
                        {importResults.errors.map((err: any, idx: number) => (
                          <li
                            key={idx}
                            className="border-b border-red-200 pb-2 last:border-0"
                          >
                            <span className="font-medium">
                              Row {err.row || idx + 1}:
                            </span>{" "}
                            {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportResults(null);
                  }}
                  className="flex-1 p-3 text-gray-600 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 p-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Import Products
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                className="w-full p-3 border rounded-lg"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Category"
                className="w-full p-3 border rounded-lg"
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 border rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {newProduct.imageUrl && (
                  <div className="mt-2 h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={newProduct.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Price"
                  className="w-full p-3 border rounded-lg"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  className="w-full p-3 border rounded-lg"
                  value={newProduct.quantity}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Cost Price"
                  className="w-full p-3 border rounded-lg"
                  value={newProduct.costPrice}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, costPrice: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Min Stock Level"
                  className="w-full p-3 border rounded-lg"
                  value={newProduct.reorderThreshold}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, reorderThreshold: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Barcode (Optional)"
                  className="w-full p-3 border rounded-lg"
                  value={newProduct.barcode}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, barcode: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Supplier Name"
                  className="w-full p-3 border rounded-lg"
                  value={newProduct.supplier}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, supplier: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Supplier Phone (+234...)"
                  className="w-full p-3 border rounded-lg"
                  value={newProduct.supplierPhone}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, supplierPhone: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 p-3 text-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 p-3 bg-indigo-600 text-white rounded-lg font-medium"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
